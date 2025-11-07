import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { type FFmpegMode, FFmpegService } from "../services/ffmpegService";
import { useCommandStore } from "../store/commandStore";
import { useFFmpegWebStore } from "../store/ffmpegWebStore";
import { useLogStore } from "../store/logStore";
import { useTaskStore } from "../store/taskStore";
import type { CommandPreset } from "../types/command";
import {
	downloadJSON,
	exportPresetsToJSON,
	exportPresetToJSON,
	extractNonFileValues,
	extractTemplateVariables,
	formatErrorMessage,
	getDefaultFormValues,
	getFileInputFields,
	getFileOutputField,
	importPresetsFromJSON,
	parseCLICommand,
	parseFFmpegError,
	replaceTemplateVariables,
	uploadJSON,
	validateTemplateUsage,
} from "../utils";
import { useTaskManager } from "./useTaskManager";

/**
 * FFmpeg Web 页面核心业务逻辑 Hook
 * 封装所有与 FFmpeg 相关的操作和状态管理
 */
export function useFFmpegWeb() {
	// FFmpeg 服务引用
	const ffmpegServiceRef = useRef<FFmpegService | null>(null);

	// 任务执行相关的 ref
	const taskStartTimeRef = useRef<number>(0);
	const lastProgressUpdateRef = useRef<number>(0);
	const progressCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);

	// Store 状态
	const {
		isClient,
		loaded,
		loading,
		useMultiThread,
		processing,
		progress,
		selectedPreset,
		editingPreset,
		outputUrl,
		formValues,
		cliCommand,
		setIsClient,
		setLoaded,
		setLoading,
		setUseMultiThread,
		setProcessing,
		setProgress,
		setCurrentStep,
		setSelectedPreset,
		setEditingPreset,
		setOutputUrl,
		setFormValues,
		setCliCommand,
		setShowEditor,
		setShowCLIImport,
		setShowSettings,
		setCopiedCommand,
		resetAll,
	} = useFFmpegWebStore();

	const addLog = useLogStore((state) => state.addLog);
	const clearLogs = useLogStore((state) => state.clearLogs);

	const { currentTask } = useTaskStore();

	const {
		presets,
		addPreset,
		updatePreset,
		deletePreset,
		importPresets,
		exportPresets,
		resetToDefaults,
	} = useCommandStore();

	// 初始化任务管理器
	const taskManager = useTaskManager(ffmpegServiceRef);

	// 初始化客户端标志
	useEffect(() => {
		setIsClient(true);
	}, [setIsClient]);

	// 当选择预设时，初始化表单默认值
	useEffect(() => {
		if (selectedPreset) {
			const defaultValues = getDefaultFormValues(selectedPreset);
			setFormValues(defaultValues);
		}
	}, [selectedPreset, setFormValues]);

	/**
	 * 计算动态输出文件名
	 */
	const computeDynamicOutputName = (
		preset: CommandPreset,
		values: Record<string, unknown>,
	): string => {
		const outputField = getFileOutputField(preset);
		if (outputField) {
			const val = values[outputField.name];
			if (typeof val === "string" && val.trim()) return val.trim();
			if (
				outputField.defaultValue &&
				typeof outputField.defaultValue === "string"
			)
				return String(outputField.defaultValue);
			if (outputField.defaultExtension)
				return `output.${outputField.defaultExtension}`;
			return "output.mp4";
		}
		return "output.mp4";
	};

	/**
	 * 加载 FFmpeg
	 */
	const loadFFmpeg = async () => {
		if (!isClient) return;

		if (useMultiThread && !FFmpegService.isMultiThreadSupported()) {
			const message = "您的浏览器不支持多线程模式，自动切换到单线程模式";
			addLog(message, "warning");
			toast.warning(message);
			setUseMultiThread(false);
			return;
		}

		const mode: FFmpegMode = useMultiThread ? "multi" : "single";

		try {
			setLoading(true);
			setCurrentStep("正在加载 FFmpeg...");
			setProgress(0.1);
			addLog(
				`开始加载 FFmpeg ${mode === "multi" ? "多线程" : "单线程"}版本`,
				"info",
			);

			const service = new FFmpegService({
				mode,
				onLog: (message) => {
					console.log(message);
					addLog(message, "info");
				},
				onProgress: (p, time) => {
					if (taskStartTimeRef.current === 0 && time > 0) {
						taskStartTimeRef.current = time;
					}

					lastProgressUpdateRef.current = Date.now();

					setProgress(p);
					if (p > 0 && p < 1) {
						const relativeTime =
							taskStartTimeRef.current > 0
								? time - taskStartTimeRef.current
								: time;
						setCurrentStep(
							`处理中... ${Math.max(0, relativeTime / 1000000).toFixed(2)}s`,
						);
					}
				},
			});

			await service.load();
			ffmpegServiceRef.current = service;
			setLoaded(true);
			setProgress(1);
			setCurrentStep("FFmpeg 已就绪");
			addLog("FFmpeg 加载成功！🚀", "success");
			toast.success("FFmpeg 加载成功！");
		} catch (error) {
			const errorMsg = error instanceof Error ? error.message : String(error);
			addLog(`加载失败: ${errorMsg}`, "error");
			toast.error(`加载失败: ${errorMsg}`);
			setCurrentStep("加载失败");
			setProgress(0);
		} finally {
			setLoading(false);
		}
	};

	/**
	 * 执行命令
	 */
	const executeCommand = async () => {
		const service = ffmpegServiceRef.current;

		if (!loaded || !service || !selectedPreset) {
			const message = "请先加载 FFmpeg 并选择命令";
			addLog(message, "warning");
			toast.warning(message);
			return;
		}

		// 验证文件输入
		const fileInputFields = getFileInputFields(selectedPreset);
		if (fileInputFields.length > 0) {
			const missing: string[] = [];
			for (const field of fileInputFields) {
				const val = formValues[field.name];
				if (field.required) {
					if (field.multiple) {
						if (!val || !Array.isArray(val) || val.length === 0)
							missing.push(field.label || field.name);
					} else {
						if (!val || !(val instanceof File))
							missing.push(field.label || field.name);
					}
				}
			}
			if (missing.length) {
				const msg = `请先选择必填文件字段: ${missing.join(", ")}`;
				addLog(msg, "warning");
				toast.warning(msg);
				return;
			}
		}

		setProcessing(true);
		setProgress(0);
		taskStartTimeRef.current = 0;
		lastProgressUpdateRef.current = Date.now();
		setCurrentStep("准备执行...");
		clearLogs();

		// 启动进度停滞检测
		progressCheckIntervalRef.current = setInterval(() => {
			const now = Date.now();
			const timeSinceLastUpdate = now - lastProgressUpdateRef.current;

			if (timeSinceLastUpdate > 30000) {
				const message =
					`⚠️ 任务进度已停滞 ${Math.floor(timeSinceLastUpdate / 1000)} 秒。可能原因：\n` +
					`- VP9/H.265 等编码器处理大文件极慢\n` +
					`- 建议使用"中止"按钮停止，并尝试:\n` +
					`  • 使用更快的编码器（H.264）\n` +
					`  • 降低分辨率或帧率\n` +
					`  • 减小文件大小`;
				addLog(message, "warning");

				if (progressCheckIntervalRef.current) {
					clearInterval(progressCheckIntervalRef.current);
					progressCheckIntervalRef.current = null;
				}
			}
		}, 30000);

		try {
			addLog(`开始执行命令: ${selectedPreset.name}`, "info");
			setCurrentStep("正在处理...");

			// 替换模板变量
			let finalArgs = selectedPreset.ffmpegArgs;
			if (selectedPreset.formSchema && selectedPreset.formSchema.length > 0) {
				const nonFileValues = extractNonFileValues(formValues);
				finalArgs = replaceTemplateVariables(
					selectedPreset.ffmpegArgs,
					nonFileValues,
				);
				addLog(`应用表单参数: ${JSON.stringify(nonFileValues)}`, "info");
			}

			const dynamicOutputName = computeDynamicOutputName(
				selectedPreset,
				formValues,
			);

			// 替换 {{output}} 变量
			finalArgs = finalArgs.map((arg) =>
				arg === "{{output}}" ? dynamicOutputName : arg,
			);

			addLog(`最终命令: ${finalArgs.join(" ")}`, "info");

			// 创建任务
			const task = taskManager.createTask(
				selectedPreset,
				formValues,
				finalArgs,
				dynamicOutputName,
			);

			// 执行任务
			const url = await taskManager.executeTask(task, formValues);

			// 更新 UI 状态
			setOutputUrl(url);
			setProgress(1);
			setCurrentStep("执行成功！");
		} catch (error) {
			console.error("执行错误:", error);
			const taskError = parseFFmpegError(error);
			const errorMessage = formatErrorMessage(taskError);
			addLog(errorMessage, "error");

			// 如果是不可恢复错误，清理 FFmpeg 实例
			if (taskError.type === "non-recoverable") {
				try {
					if (service) {
						await service.terminate();
						ffmpegServiceRef.current = null;
						setLoaded(false);
						addLog("FFmpeg 实例已清理，请重新加载后再试", "warning");
						toast.warning("FFmpeg 实例已清理，请重新加载后再试");
					}
				} catch (cleanupError) {
					console.error("清理 FFmpeg 实例失败:", cleanupError);
				}
			}

			setCurrentStep("执行失败");
		} finally {
			if (progressCheckIntervalRef.current) {
				clearInterval(progressCheckIntervalRef.current);
				progressCheckIntervalRef.current = null;
			}
			setProcessing(false);
		}
	};

	/**
	 * 中止任务
	 */
	const handleAbortTask = async () => {
		const service = ffmpegServiceRef.current;

		if (!service || !service.getIsExecuting()) {
			toast.warning("当前没有正在执行的任务");
			return;
		}

		try {
			addLog("用户请求中止任务...", "warning");

			if (progressCheckIntervalRef.current) {
				clearInterval(progressCheckIntervalRef.current);
				progressCheckIntervalRef.current = null;
			}

			await service.abort();

			// 中止任务记录
			if (currentTask && currentTask.status === "running") {
				taskManager.abortCurrentTask();
			}

			ffmpegServiceRef.current = null;
			setLoaded(false);
			setProcessing(false);
			setProgress(0);
			setCurrentStep("任务已中止");

			if (outputUrl) {
				URL.revokeObjectURL(outputUrl);
				setOutputUrl("");
			}

			addLog("任务已中止，请重新加载 FFmpeg", "warning");
			toast.info("任务已中止，请重新加载 FFmpeg");
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : String(error);
			addLog(`中止任务失败: ${errorMessage}`, "error");
			toast.error(`中止任务失败: ${errorMessage}`);
		}
	};

	/**
	 * 重新加载 FFmpeg
	 */
	const handleReloadFFmpeg = async () => {
		const service = ffmpegServiceRef.current;

		if (processing) {
			toast.warning("请先中止当前任务");
			return;
		}

		try {
			addLog("用户请求重新加载 FFmpeg...", "info");

			// 清理定时器
			if (progressCheckIntervalRef.current) {
				clearInterval(progressCheckIntervalRef.current);
				progressCheckIntervalRef.current = null;
			}

			// 终止 FFmpeg 服务
			if (service) {
				await service.terminate();
			}

			// 清理服务引用
			ffmpegServiceRef.current = null;

			// 释放 outputUrl 占用的内存
			if (outputUrl) {
				URL.revokeObjectURL(outputUrl);
			}

			// 重置所有状态（包括表单、命令、预设选择等）
			resetAll();
			clearLogs();

			addLog("FFmpeg 已清理，请重新加载", "success");
			toast.success("FFmpeg 已清理，可以重新加载了");
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : String(error);
			addLog(`重新加载失败: ${errorMessage}`, "error");
			toast.error(`重新加载失败: ${errorMessage}`);
		}
	};

	/**
	 * 导出所有命令
	 */
	const handleExportAll = () => {
		const json = exportPresetsToJSON(exportPresets());
		downloadJSON("ffmpeg-presets.json", json);
		addLog("已导出所有命令预设", "success");
		toast.success("已导出所有命令预设");
	};

	/**
	 * 导入 JSON
	 */
	const handleImportJSON = async () => {
		try {
			const json = await uploadJSON();
			const result = importPresetsFromJSON(json);

			// 验证模板变量
			const invalid: string[] = [];
			result.presets.forEach((p) => {
				if (p.formSchema?.length) {
					const v = validateTemplateUsage({
						ffmpegArgs: p.ffmpegArgs,
						formSchema: p.formSchema,
					});
					if (v.unknown.length) {
						invalid.push(`${p.name}: 未声明变量(${v.unknown.join(",")})`);
					}
				}
			});

			if (invalid.length) {
				throw new Error(`以下命令存在未声明的模板变量:\n${invalid.join("\n")}`);
			}

			const isSingle = result.presets.length === 1;
			if (isSingle) {
				importPresets(result.presets);
				addLog(`成功导入命令: ${result.presets[0].name}`, "success");
				toast.success(`成功导入命令: ${result.presets[0].name}`);
			} else {
				importPresets(result.presets);
				addLog(`成功导入 ${result.presets.length} 个命令预设`, "success");
				toast.success(`成功导入 ${result.presets.length} 个命令预设`);
			}
		} catch (error) {
			const errorMsg = error instanceof Error ? error.message : String(error);
			addLog(`导入失败: ${errorMsg}`, "error");
			toast.error(`导入失败: ${errorMsg}`);
		}
	};

	/**
	 * 导出单个预设
	 */
	const handleExportPreset = (preset: CommandPreset) => {
		const json = exportPresetToJSON(preset);
		downloadJSON(`${preset.name}.json`, json);
		addLog(`已导出命令: ${preset.name}`, "success");
		toast.success(`已导出命令: ${preset.name}`);
	};

	/**
	 * CLI 导入
	 */
	const handleCLIImport = () => {
		try {
			const parsed = parseCLICommand(cliCommand);

			const tempPreset: Partial<CommandPreset> = {
				...parsed,
				id: `temp_${Date.now()}`,
			};

			setShowCLIImport(false);
			setCliCommand("");

			setEditingPreset(tempPreset as CommandPreset);
			setShowEditor(true);

			const usedVars = extractTemplateVariables(
				(parsed.ffmpegArgs || []) as string[],
			);
			if (usedVars.length > 0) {
				const msg = `检测到模板变量: ${usedVars.join(", ")}，请在右侧"表单字段配置"中添加相应字段，并保持名称一致。`;
				addLog(msg, "warning");
				toast.warning(msg);
			}

			addLog("已解析 CLI 命令，请完善命令信息", "info");
			toast.info("请完善命令信息后保存");
		} catch (e) {
			const errorMsg = e instanceof Error ? e.message : String(e);
			addLog(`CLI 解析失败: ${errorMsg}`, "error");
			toast.error(`CLI 解析失败: ${errorMsg}`);
		}
	};

	/**
	 * 下载文件
	 */
	const handleDownload = () => {
		if (!outputUrl || !selectedPreset) return;
		const a = document.createElement("a");
		a.href = outputUrl;
		const dynamicName = computeDynamicOutputName(selectedPreset, formValues);
		a.download = dynamicName;
		a.click();
		toast.success("文件下载成功");
	};

	/**
	 * 复制命令
	 */
	const handleCopyCommand = async () => {
		if (!selectedPreset) return;

		let args = selectedPreset.ffmpegArgs;
		if (selectedPreset.formSchema && selectedPreset.formSchema.length > 0) {
			args = replaceTemplateVariables(
				selectedPreset.ffmpegArgs,
				extractNonFileValues(formValues),
			);
		}

		const command = `ffmpeg ${args.join(" ")}`;
		try {
			await navigator.clipboard.writeText(command);
			setCopiedCommand(true);
			toast.success("命令已复制到剪贴板");
			setTimeout(() => setCopiedCommand(false), 2000);
		} catch {
			toast.error("复制失败");
		}
	};

	/**
	 * 重置命令
	 */
	const handleResetCommands = () => {
		resetToDefaults();
		addLog("已重置命令预设到初始状态", "success");
		toast.success("已重置命令预设到初始状态");
		setShowSettings(false);
		setSelectedPreset(null);
		setFormValues({});
		setOutputUrl("");
	};

	return {
		// State
		isClient,
		loaded,
		loading,
		useMultiThread,
		processing,
		progress,
		selectedPreset,
		editingPreset,
		outputUrl,
		formValues,
		presets,

		// Actions
		loadFFmpeg,
		executeCommand,
		handleAbortTask,
		handleReloadFFmpeg,
		handleExportAll,
		handleImportJSON,
		handleExportPreset,
		handleCLIImport,
		handleDownload,
		handleCopyCommand,
		handleResetCommands,

		// Command Store Actions
		addPreset,
		updatePreset,
		deletePreset,

		// Utils
		computeDynamicOutputName,

		// Task Manager
		taskManager,
	};
}
