import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { type FFmpegMode, FFmpegService } from "../services/ffmpegService";
import { useCDNStore } from "../store/cdn";
import { useCommandStore } from "../store/command";
import { useFFmpegWebStore } from "../store/ffmpegWeb";
import { useLogStore } from "../store/log";
import type { CommandPreset } from "../types/command";
import {
	downloadJSON,
	exportPresetsToJSON,
	exportPresetToJSON,
	extractNonFileValues,
	extractTemplateVariables,
	getDefaultFormValues,
	getFileInputFields,
	getFileOutputField,
	importPresetsFromJSON,
	parseCLICommand,
	replaceTemplateVariables,
	sanitizeFilename,
	standardizeAndUniquifyFilenames,
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

	const {
		presets,
		addPreset,
		updatePreset,
		deletePreset,
		importPresets,
		exportPresets,
		resetToDefaults,
	} = useCommandStore();

	// CDN 配置
	const { getBestProvider } = useCDNStore();

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

	// 当预设列表更新时，保持 selectedPreset 指向最新对象（避免编辑保存后仍引用旧对象）
	useEffect(() => {
		if (!selectedPreset) return;
		const latest = presets.find((p) => p.id === selectedPreset.id);
		if (latest && latest !== selectedPreset) {
			setSelectedPreset(latest);
		}
	}, [presets, selectedPreset, setSelectedPreset]);

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

		// 获取最佳 CDN provider
		const cdnProvider = getBestProvider();
		if (cdnProvider) {
			addLog(`使用 CDN: ${cdnProvider.name}`, "info");
		}

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
				cdnProvider: cdnProvider || undefined,
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

		// 批量文件场景：单一 file-input 且 multiple=true，并选择了多个文件 -> 拆分为多个队列任务
		if (
			fileInputFields.length === 1 &&
			fileInputFields[0].multiple &&
			Array.isArray(formValues[fileInputFields[0].name]) &&
			(formValues[fileInputFields[0].name] as File[]).length > 1
		) {
			const inputField = fileInputFields[0];
			const files = formValues[inputField.name] as File[];
			addLog(
				`检测到批量文件，共 ${files.length} 个，将拆分为 ${files.length} 个队列任务`,
				"info",
			);

			// 预先标准化所有文件名
			const standardized = standardizeAndUniquifyFilenames(files);

			const tasks = files.map((file, index) => {
				const std = standardized[index];

				// 记录文件名标准化
				if (std.warnings.length) {
					addLog(
						`[文件名标准化] ${std.original} -> ${std.finalName} (${std.warnings.join(", ")})`,
						"warning",
					);
				} else if (std.original !== std.finalName) {
					addLog(`[文件名标准化] ${std.original} -> ${std.finalName}`, "info");
				}

				const fv: Record<string, unknown> = {
					...formValues,
					[inputField.name]: file,
				};

				let args = selectedPreset.ffmpegArgs;
				if (selectedPreset.formSchema?.length) {
					const nonFileVals = extractNonFileValues(
						fv as Record<string, string | number | boolean | File | File[]>,
					);
					args = replaceTemplateVariables(
						selectedPreset.ffmpegArgs,
						nonFileVals,
					);
				}

				// 应用文件名映射到 args（将原始文件名替换为标准化文件名）
				args = args.map((arg) => (arg === file.name ? std.finalName : arg));

				const outName = computeDynamicOutputName(selectedPreset, fv);
				const sanitizedOutName = sanitizeFilename(outName);

				// 替换输出文件名
				args = args.map((a) => {
					if (a === "{{output}}" || a === outName) {
						return sanitizedOutName;
					}
					return a;
				});

				addLog(
					`[任务 ${index + 1}] 最终命令: ffmpeg ${args.join(" ")}`,
					"info",
				);

				return taskManager.createTask(
					selectedPreset,
					fv,
					args,
					sanitizedOutName,
				);
			});
			taskManager.addTasksToQueue(tasks);
			toast.success(`已添加 ${tasks.length} 个任务到队列`);
			return;
		}

		// 单文件场景：也提交到任务队列
		addLog(`提交任务: ${selectedPreset.name}`, "info");

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

		addLog(`最终命令: ffmpeg ${finalArgs.join(" ")}`, "info");

		// 创建并添加任务到队列
		const task = taskManager.createTask(
			selectedPreset,
			formValues,
			finalArgs,
			dynamicOutputName,
		);
		taskManager.addTasksToQueue([task]);
		toast.success("任务已添加到队列");
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
		handleReloadFFmpeg,
		handleExportAll,
		handleImportJSON,
		handleExportPreset,
		handleCLIImport,
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
