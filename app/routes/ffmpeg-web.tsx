import {
	CheckIcon,
	CodeIcon,
	CopyIcon,
	DownloadIcon,
	Loader2Icon,
	PlayIcon,
	PlusIcon,
	SettingsIcon,
	UploadIcon,
	XIcon,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { CommandEditor } from "../components/CommandEditor";
import { CommandFilter } from "../components/CommandFilter";
import { CommandList } from "../components/CommandList";
import { DynamicForm } from "../components/DynamicForm";
import { ModeSelect } from "../components/ModeSelect";
import { ProgressLogViewer } from "../components/ProgressLogViewer";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "../components/ui/alert-dialog";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Separator } from "../components/ui/separator";
import { Textarea } from "../components/ui/textarea";
import { type FFmpegMode, FFmpegService } from "../services/ffmpegService";
import { useCommandStore } from "../store/commandStore";
import { useLogStore } from "../store/logStore";
import type { CommandPreset } from "../types/command";
import {
	downloadJSON,
	exportPresetsToJSON,
	exportPresetToJSON,
	extractTemplateVariables,
	getDefaultFormValues,
	getFileInputFields,
	getFileOutputField,
	importPresetsFromJSON,
	parseCLICommand,
	replaceTemplateVariables,
	uploadJSON,
	validateTemplateUsage,
} from "../utils/commandUtils";

export default function FFmpegWeb() {
	const [isClient, setIsClient] = useState(false);
	const [loaded, setLoaded] = useState(false);
	const [loading, setLoading] = useState(false);
	// 默认使用多线程模式（如果支持）
	const [useMultiThread, setUseMultiThread] = useState(
		typeof SharedArrayBuffer !== "undefined",
	);
	const [processing, setProcessing] = useState(false);
	const [progress, setProgress] = useState(0);
	const [currentStep, setCurrentStep] = useState("就绪");
	const [selectedPreset, setSelectedPreset] = useState<CommandPreset | null>(
		null,
	);
	const [editingPreset, setEditingPreset] = useState<CommandPreset | null>(
		null,
	);
	const [showEditor, setShowEditor] = useState(false);
	const [showCLIImport, setShowCLIImport] = useState(false);
	const [showSettings, setShowSettings] = useState(false);
	const [showResetConfirm, setShowResetConfirm] = useState(false);
	const [cliCommand, setCliCommand] = useState("");
	const [outputUrl, setOutputUrl] = useState("");
	const [selectedFiles, setSelectedFiles] = useState<Record<string, File>>({});
	const [copiedCommand, setCopiedCommand] = useState(false);
	const [formValues, setFormValues] = useState<
		Record<string, string | number | boolean | File | File[]>
	>({});

	// 分类筛选状态
	const [selectedCategories, setSelectedCategories] = useState<Set<string>>(
		new Set(),
	);

	// 用于跟踪任务执行的起始时间，避免累积问题
	const taskStartTimeRef = useRef<number>(0);

	// 用于检测进度停滞
	const lastProgressUpdateRef = useRef<number>(0);
	const progressCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);

	const ffmpegServiceRef = useRef<FFmpegService | null>(null);
	const addLog = useLogStore((state) => state.addLog);
	const clearLogs = useLogStore((state) => state.clearLogs);

	const presets = useCommandStore((state) => state.presets);
	const addPreset = useCommandStore((state) => state.addPreset);
	const updatePreset = useCommandStore((state) => state.updatePreset);
	const deletePreset = useCommandStore((state) => state.deletePreset);
	const importPresets = useCommandStore((state) => state.importPresets);
	const exportPresets = useCommandStore((state) => state.exportPresets);
	const resetToDefaults = useCommandStore((state) => state.resetToDefaults);

	// 初始化分类筛选（全选）
	useEffect(() => {
		if (presets.length > 0 && selectedCategories.size === 0) {
			const categories = new Set(presets.map((p) => p.category || "未分类"));
			setSelectedCategories(categories);
		}
	}, [presets, selectedCategories.size]);

	// 当选择预设时，初始化表单默认值
	useEffect(() => {
		if (selectedPreset) {
			const defaultValues = getDefaultFormValues(selectedPreset);
			setFormValues(defaultValues);
		}
	}, [selectedPreset]);

	// 辅助函数：从 formValues 中提取非文件参数用于模板替换
	const extractNonFileValues = (
		values: Record<string, string | number | boolean | File | File[]>,
	): Record<string, string | number | boolean> => {
		const result: Record<string, string | number | boolean> = {};
		Object.keys(values).forEach((key) => {
			const value = values[key];
			if (
				typeof value === "string" ||
				typeof value === "number" ||
				typeof value === "boolean"
			) {
				result[key] = value;
			} else if (value instanceof File) {
				result[key] = value.name; // 文件转为文件名字符串
			} else if (
				Array.isArray(value) &&
				value.length > 0 &&
				value[0] instanceof File
			) {
				result[key] = (value as File[]).map((f) => f.name).join(" "); // 多文件转为空格分隔的文件名
			}
		});
		return result;
	};

	useEffect(() => {
		setIsClient(true);
	}, []);

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
					// 第一次收到进度时记录起始时间
					if (taskStartTimeRef.current === 0 && time > 0) {
						taskStartTimeRef.current = time;
					}

					// 更新最后进度时间
					lastProgressUpdateRef.current = Date.now();

					setProgress(p);
					if (p > 0 && p < 1) {
						// 计算相对于任务开始的时间
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

	// 计算动态输出文件名（支持 file-output 字段）
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
		// 向后兼容旧字段
		return preset.outputFileName || "output.mp4";
	};

	const executeCommand = async () => {
		const service = ffmpegServiceRef.current;

		if (!loaded || !service || !selectedPreset) {
			const message = "请先加载 FFmpeg 并选择命令";
			addLog(message, "warning");
			toast.warning(message);
			return;
		}

		// 新架构：如果存在 formSchema 中的 file-input 字段，则使用它们进行文件校验
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
		} else {
			// 旧架构：使用 legacy inputFiles 校验
			const missingFiles = (selectedPreset.inputFiles || []).filter(
				(input) => !selectedFiles[input.name],
			);
			if (missingFiles.length > 0) {
				const message = `请先选择以下文件: ${missingFiles.map((f) => f.name).join(", ")}`;
				addLog(message, "warning");
				toast.warning(message);
				return;
			}
		}

		setProcessing(true);
		setProgress(0); // 重置进度
		taskStartTimeRef.current = 0; // 重置任务起始时间
		lastProgressUpdateRef.current = Date.now(); // 记录开始时间
		setCurrentStep("准备执行...");
		clearLogs();

		// 启动进度停滞检测（每 30 秒检查一次）
		progressCheckIntervalRef.current = setInterval(() => {
			const now = Date.now();
			const timeSinceLastUpdate = now - lastProgressUpdateRef.current;

			// 如果超过 30 秒没有进度更新，发出警告
			if (timeSinceLastUpdate > 30000) {
				const message =
					`⚠️ 任务进度已停滞 ${Math.floor(timeSinceLastUpdate / 1000)} 秒。可能原因：\n` +
					`- VP9/H.265 等编码器处理大文件极慢\n` +
					`- 建议使用"中止"按钮停止，并尝试:\n` +
					`  • 使用更快的编码器（H.264）\n` +
					`  • 降低分辨率或帧率\n` +
					`  • 减小文件大小`;
				addLog(message, "warning");

				// 只提示一次，避免重复提示
				if (progressCheckIntervalRef.current) {
					clearInterval(progressCheckIntervalRef.current);
					progressCheckIntervalRef.current = null;
				}
			}
		}, 30000);

		try {
			addLog(`开始执行命令: ${selectedPreset.name}`, "info");
			setCurrentStep("正在处理...");

			// 构造输入文件列表：优先使用 formSchema 中的 file-input 字段
			let inputFilesList: Array<{ file: File; name: string }> = [];
			if (fileInputFields.length > 0) {
				for (const field of fileInputFields) {
					const val = formValues[field.name];
					if (!val) continue;
					if (field.multiple && Array.isArray(val)) {
						// 多文件：使用原文件名写入虚拟 FS
						for (const f of val as File[]) {
							inputFilesList.push({ file: f, name: f.name });
						}
					} else if (val instanceof File) {
						inputFilesList.push({
							file: val as File,
							name: (val as File).name,
						});
					}
				}
			} else {
				// 旧架构
				inputFilesList = (selectedPreset.inputFiles || []).map((input) => ({
					file: selectedFiles[input.name],
					name: input.name,
				}));
			}

			// 如果有表单配置，替换模板变量
			let finalArgs = selectedPreset.ffmpegArgs;
			if (selectedPreset.formSchema && selectedPreset.formSchema.length > 0) {
				finalArgs = replaceTemplateVariables(
					selectedPreset.ffmpegArgs,
					extractNonFileValues(formValues),
				);
				addLog(
					`应用表单参数: ${JSON.stringify(extractNonFileValues(formValues))}`,
					"info",
				);
				addLog(`最终命令: ${finalArgs.join(" ")}`, "info");
			}

			const dynamicOutputName = computeDynamicOutputName(
				selectedPreset,
				formValues,
			);

			const outputBlob = await service.executeCommand({
				inputFiles: inputFilesList,
				outputFileName: dynamicOutputName,
				ffmpegArgs: finalArgs,
			});

			// 清理之前的 URL
			if (outputUrl) {
				URL.revokeObjectURL(outputUrl);
			}

			const url = URL.createObjectURL(outputBlob);
			setOutputUrl(url);
			setProgress(1);
			setCurrentStep("执行成功！");
			addLog("命令执行成功！🎉", "success");
			toast.success("命令执行成功！🎉");
		} catch (error) {
			console.error("执行错误:", error);
			const errorMessage =
				error instanceof Error ? error.message : String(error);
			addLog(`执行失败: ${errorMessage}`, "error");
			toast.error(`执行失败: ${errorMessage}`);
			setCurrentStep("执行失败");

			// 清理错误的 FFmpeg 实例，避免后续任务继续出错
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
		} finally {
			// 清理进度检测定时器
			if (progressCheckIntervalRef.current) {
				clearInterval(progressCheckIntervalRef.current);
				progressCheckIntervalRef.current = null;
			}
			setProcessing(false);
		}
	};

	const handleAbortTask = async () => {
		const service = ffmpegServiceRef.current;

		if (!service || !service.getIsExecuting()) {
			toast.warning("当前没有正在执行的任务");
			return;
		}

		try {
			addLog("用户请求中止任务...", "warning");

			// 清理进度检测定时器
			if (progressCheckIntervalRef.current) {
				clearInterval(progressCheckIntervalRef.current);
				progressCheckIntervalRef.current = null;
			}

			await service.abort();

			// 清空所有状态
			ffmpegServiceRef.current = null;
			setLoaded(false);
			setProcessing(false);
			setProgress(0);
			setCurrentStep("任务已中止");

			// 清空输出和选择的文件
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

	const handleFileSelect = (fileName: string, file: File) => {
		setSelectedFiles((prev) => ({ ...prev, [fileName]: file }));
		addLog(`已选择文件: ${fileName} -> ${file.name}`, "success");
	};

	const handleExportAll = () => {
		const json = exportPresetsToJSON(exportPresets());
		downloadJSON("ffmpeg-presets.json", json);
		addLog("已导出所有命令预设", "success");
		toast.success("已导出所有命令预设");
	};

	const handleImportJSON = async () => {
		try {
			const json = await uploadJSON();
			const result = importPresetsFromJSON(json);
			// 对每个导入的命令执行模板校验（忽略无 formSchema 的情况）
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

			if (result.isSingle) {
				// 单个命令
				importPresets(result.presets);
				addLog(`成功导入命令: ${result.presets[0].name}`, "success");
				toast.success(`成功导入命令: ${result.presets[0].name}`);
			} else {
				// 多个命令
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

	const handleExportPreset = (preset: CommandPreset) => {
		const json = exportPresetToJSON(preset);
		downloadJSON(`${preset.name}.json`, json);
		addLog(`已导出命令: ${preset.name}`, "success");
		toast.success(`已导出命令: ${preset.name}`);
	};

	const handleCLIImport = () => {
		try {
			const parsed = parseCLICommand(cliCommand);

			// 创建临时预设对象用于编辑
			const tempPreset: Partial<CommandPreset> = {
				...parsed,
				id: `temp_${Date.now()}`, // 临时 ID
			};

			// 关闭 CLI 导入对话框
			setShowCLIImport(false);
			setCliCommand("");

			// 打开编辑器让用户完善信息
			setEditingPreset(tempPreset as CommandPreset);
			setShowEditor(true);

			// 如果 CLI 中包含模板变量但未声明表单字段，给出提示
			const usedVars = extractTemplateVariables(
				(parsed.ffmpegArgs || []) as string[],
			);
			if (usedVars.length > 0) {
				const msg = `检测到模板变量: ${usedVars.join(", ")}，请在右侧“表单字段配置”中添加相应字段，并保持名称一致。`;
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

	const handleDownload = () => {
		if (!outputUrl || !selectedPreset) return;
		const a = document.createElement("a");
		a.href = outputUrl;
		const dynamicName = computeDynamicOutputName(selectedPreset, formValues);
		a.download = dynamicName;
		a.click();
		toast.success("文件下载成功");
	};

	const handleCopyCommand = async () => {
		if (!selectedPreset) return;

		// 如果有表单配置，使用替换后的参数
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

	const handleResetCommands = () => {
		resetToDefaults();
		addLog("已重置命令预设到初始状态", "success");
		toast.success("已重置命令预设到初始状态");
		setShowSettings(false);
		// 如果当前选中的预设被删除了，清空选择
		setSelectedPreset(null);
		setSelectedFiles({});
		setOutputUrl("");
	};

	if (!isClient) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
					<p className="text-gray-600">加载中...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-background">
			{/* 顶部工具栏 - 缩小版本 */}
			<header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
				<div className="max-w-7xl mx-auto px-4 py-3">
					<div className="flex items-center justify-between">
						<div>
							<h1 className="text-xl font-bold">FFmpeg Web</h1>
							<p className="text-xs text-muted-foreground">
								浏览器中的视频处理工具
							</p>
						</div>

						<div className="flex items-center gap-2">
							<Button
								variant="ghost"
								size="sm"
								onClick={() => setShowSettings(true)}
								title="设置"
							>
								<SettingsIcon className="size-4" />
							</Button>

							<ModeSelect
								useMultiThread={useMultiThread}
								onModeChange={setUseMultiThread}
								disabled={loaded}
							/>

							{!loaded ? (
								<Button onClick={loadFFmpeg} disabled={loading}>
									{loading ? (
										<>
											<Loader2Icon className="animate-spin" />
											加载中...
										</>
									) : (
										<>
											<PlayIcon />
											加载 FFmpeg
										</>
									)}
								</Button>
							) : (
								<>
									<Button
										variant="outline"
										size="sm"
										onClick={() => setShowCLIImport(true)}
									>
										<CodeIcon />
										CLI 导入
									</Button>
									<Button
										variant="outline"
										size="sm"
										onClick={handleImportJSON}
									>
										<UploadIcon />
										导入
									</Button>
									<Button variant="outline" size="sm" onClick={handleExportAll}>
										<DownloadIcon />
										导出
									</Button>
									<Button
										size="sm"
										onClick={() => {
											setEditingPreset(null);
											setShowEditor(true);
										}}
									>
										<PlusIcon />
										新建
									</Button>
								</>
							)}
						</div>
					</div>
				</div>
			</header>

			{/* 主内容区域 */}
			<div className="max-w-7xl mx-auto px-4 py-6">
				{loaded ? (
					<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
						{/* 左侧：命令列表 */}
						<div className="lg:col-span-1">
							<Card className="h-[calc(100vh-10rem)] flex flex-col">
								<div className="px-4 py-2 border-b">
									<div className="flex items-center justify-between">
										<h2 className="text-sm font-semibold">命令预设</h2>
									</div>
									{/* 筛选器 */}
									<CommandFilter
										presets={presets}
										selectedCategories={selectedCategories}
										onCategoriesChange={setSelectedCategories}
									/>
								</div>
								<div className="flex-1 overflow-hidden p-4">
									<CommandList
										presets={presets}
										selectedId={selectedPreset?.id}
										selectedCategories={selectedCategories}
										onSelect={setSelectedPreset}
										onEdit={(preset) => {
											setEditingPreset(preset);
											setShowEditor(true);
										}}
										onDelete={(preset) => deletePreset(preset.id)}
										onExport={handleExportPreset}
									/>
								</div>
							</Card>
						</div>

						{/* 右侧：执行区域 */}
						<div className="lg:col-span-2 space-y-6">
							{/* 命令信息和文件选择 */}
							{selectedPreset && (
								<Card className="p-6">
									<div className="flex items-start justify-between mb-4">
										<div>
											<h2 className="text-xl font-bold">
												{selectedPreset.name}
											</h2>
											<p className="text-sm text-muted-foreground mt-1">
												{selectedPreset.description}
											</p>
										</div>
										<Badge variant="secondary">{selectedPreset.category}</Badge>
									</div>

									{/* 命令预览 */}
									<div className="mb-4">
										<div className="flex items-center justify-between mb-2">
											<Label>FFmpeg 命令</Label>
											<Button
												variant="ghost"
												size="sm"
												onClick={handleCopyCommand}
												className="h-7 px-2 text-xs"
											>
												{copiedCommand ? (
													<>
														<CheckIcon className="size-3 mr-1" />
														已复制
													</>
												) : (
													<>
														<CopyIcon className="size-3 mr-1" />
														复制
													</>
												)}
											</Button>
										</div>
										<div className="bg-slate-950 text-slate-50 p-3 rounded-lg font-mono text-xs overflow-x-auto">
											ffmpeg{" "}
											{selectedPreset.formSchema &&
											selectedPreset.formSchema.length > 0
												? replaceTemplateVariables(
														selectedPreset.ffmpegArgs,
														extractNonFileValues(formValues),
													).join(" ")
												: selectedPreset.ffmpegArgs.join(" ")}
										</div>
									</div>

									{/* 自定义表单（如果有） */}
									{selectedPreset.formSchema &&
										selectedPreset.formSchema.length > 0 && (
											<Card className="p-4 mb-4 bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
												<div className="mb-3">
													<Label className="text-base font-semibold flex items-center gap-2">
														<span className="text-blue-600 dark:text-blue-400">
															⚙️
														</span>
														命令参数配置
													</Label>
													<p className="text-xs text-muted-foreground mt-1">
														调整下方参数，命令将实时更新
													</p>
												</div>
												<DynamicForm
													schema={selectedPreset.formSchema}
													values={formValues}
													onChange={setFormValues}
												/>
											</Card>
										)}

									{/* 文件选择 */}
									{selectedPreset.inputFiles &&
										selectedPreset.inputFiles.length > 0 && (
											<div className="space-y-3">
												<Label>选择输入文件</Label>
												{selectedPreset.inputFiles.map((input) => (
													<div key={input.name} className="space-y-1">
														<Label className="text-xs text-muted-foreground">
															{input.name}
															{input.pattern && (
																<span className="ml-2">({input.pattern})</span>
															)}
														</Label>
														<Input
															type="file"
															accept={input.pattern || "*"}
															onChange={(e) => {
																const file = e.target.files?.[0];
																if (file) handleFileSelect(input.name, file);
															}}
															disabled={processing}
														/>
														{selectedFiles[input.name] && (
															<p className="text-xs text-green-600">
																✓ {selectedFiles[input.name].name}
															</p>
														)}
													</div>
												))}
											</div>
										)}

									{/* 执行/中止按钮 */}
									<div className="flex gap-2 mt-4">
										<Button
											onClick={executeCommand}
											disabled={
												processing ||
												(selectedPreset.inputFiles?.some(
													(input) => !selectedFiles[input.name],
												) ??
													false)
											}
											className="flex-1"
											size="lg"
										>
											{processing ? (
												<>
													<Loader2Icon className="mr-2 animate-spin" />
													处理中...
												</>
											) : (
												"执行命令"
											)}
										</Button>
										{processing && (
											<Button
												onClick={handleAbortTask}
												variant="destructive"
												size="lg"
											>
												<XIcon className="mr-2" />
												中止
											</Button>
										)}
									</div>
								</Card>
							)}

							{/* 进度和日志 */}
							<ProgressLogViewer
								progress={progress}
								currentStep={currentStep}
								isExecuting={processing}
							/>

							{/* 输出预览 */}
							{outputUrl && selectedPreset && (
								<Card className="p-6">
									<div className="flex items-center justify-between mb-4">
										<h3 className="text-lg font-semibold">输出预览</h3>
										<Button
											onClick={handleDownload}
											variant="default"
											size="sm"
										>
											<DownloadIcon className="mr-2" />
											下载文件
										</Button>
									</div>

									{(() => {
										const outName = computeDynamicOutputName(
											selectedPreset,
											formValues,
										);
										if (/\.(mp4|webm|avi|mov)$/i.test(outName)) {
											return (
												<video
													src={outputUrl}
													controls
													className="w-full rounded-lg bg-black"
													aria-label="输出视频预览"
												>
													<track
														kind="captions"
														src="data:text/vtt,WEBVTT%0A%0A"
														srcLang="zh"
														label="空字幕"
														default
													/>
												</video>
											);
										}
										if (/\.(mp3|wav|ogg|m4a)$/i.test(outName)) {
											return (
												<audio
													src={outputUrl}
													controls
													className="w-full"
													aria-label="输出音频预览"
												>
													<track
														kind="captions"
														src="data:text/vtt,WEBVTT%0A%0A"
														srcLang="zh"
														label="空字幕"
														default
													/>
												</audio>
											);
										}
										if (/\.(gif|jpg|jpeg|png|webp)$/i.test(outName)) {
											return (
												<img
													src={outputUrl}
													alt="输出文件预览"
													className="w-full rounded-lg"
												/>
											);
										}
										return (
											<p className="text-muted-foreground text-sm">
												文件已生成，点击"下载文件"按钮保存
											</p>
										);
									})()}
								</Card>
							)}
						</div>
					</div>
				) : (
					<Card className="p-12 text-center">
						<svg
							className="w-20 h-20 mx-auto mb-6 text-muted-foreground"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							role="img"
							aria-label="播放占位图标"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
							/>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
							/>
						</svg>
						<h2 className="text-2xl font-bold mb-2">欢迎使用 FFmpeg Web</h2>
						<p className="text-muted-foreground mb-6">
							点击上方"加载 FFmpeg"按钮开始使用
						</p>
					</Card>
				)}
			</div>

			{/* 编辑器模态框 */}
			<Dialog open={showEditor} onOpenChange={setShowEditor}>
				<DialogContent className="max-w-[95vw]! w-fit max-h-[95vh]">
					<div className="overflow-y-auto max-h-[calc(95vh-8rem)] pr-2">
						<DialogHeader className="mb-6">
							<DialogTitle>
								{editingPreset
									? editingPreset.id.startsWith("temp_")
										? "完善 CLI 导入的命令"
										: "编辑命令"
									: "新建命令"}
							</DialogTitle>
							<DialogDescription>
								{editingPreset?.id.startsWith("temp_")
									? "已从 CLI 命令解析基本信息，请完善命令名称、描述等详细信息"
									: "配置 FFmpeg 命令参数和输入输出文件"}
							</DialogDescription>
						</DialogHeader>
						<CommandEditor
							preset={editingPreset || undefined}
							onSave={(preset) => {
								if (editingPreset && !editingPreset.id.startsWith("temp_")) {
									// 更新现有命令
									updatePreset(editingPreset.id, preset);
									addLog(`更新命令: ${preset.name}`, "success");
									toast.success(`命令已更新: ${preset.name}`);
								} else {
									// 新建命令（包括从 CLI 导入的）
									addPreset(preset);
									addLog(`创建命令: ${preset.name}`, "success");
									toast.success(`命令已创建: ${preset.name}`);
								}
								setShowEditor(false);
								setEditingPreset(null);
							}}
							onCancel={() => {
								setShowEditor(false);
								setEditingPreset(null);
							}}
						/>
					</div>
				</DialogContent>
			</Dialog>

			{/* CLI 导入模态框 */}
			<Dialog open={showCLIImport} onOpenChange={setShowCLIImport}>
				<DialogContent className="max-w-2xl">
					<DialogHeader>
						<DialogTitle>从 CLI 导入命令</DialogTitle>
					</DialogHeader>
					<div className="space-y-4">
						<Textarea
							value={cliCommand}
							onChange={(e) => setCliCommand(e.target.value)}
							rows={6}
							className="font-mono text-sm"
							placeholder="粘贴 FFmpeg CLI 命令，例如：&#10;ffmpeg -i input.mp4 -c:v libx264 -crf 23 output.mp4"
						/>
						<div className="flex justify-end gap-3">
							<Button
								variant="outline"
								onClick={() => {
									setShowCLIImport(false);
									setCliCommand("");
								}}
							>
								取消
							</Button>
							<Button onClick={handleCLIImport} disabled={!cliCommand.trim()}>
								导入
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>

			{/* 设置模态框 */}
			<Dialog open={showSettings} onOpenChange={setShowSettings}>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<DialogTitle>设置</DialogTitle>
						<DialogDescription>管理应用程序设置和数据</DialogDescription>
					</DialogHeader>
					<div className="space-y-6 py-4">
						{/* 重置命令预设 */}
						<div className="space-y-3">
							<div>
								<h3 className="text-sm font-medium mb-1">重置命令预设</h3>
								<p className="text-xs text-muted-foreground">
									将所有命令预设恢复到初始状态，这将删除所有自定义和导入的命令
								</p>
							</div>
							<Button
								variant="destructive"
								onClick={() => setShowResetConfirm(true)}
								className="w-full"
							>
								重置到初始状态
							</Button>
						</div>

						<Separator />

						{/* 命令统计 */}
						<div className="space-y-2">
							<h3 className="text-sm font-medium">统计信息</h3>
							<div className="grid grid-cols-2 gap-3 text-sm">
								<div className="bg-muted rounded-lg p-3">
									<div className="text-muted-foreground text-xs mb-1">
										命令总数
									</div>
									<div className="text-2xl font-bold">{presets.length}</div>
								</div>
								<div className="bg-muted rounded-lg p-3">
									<div className="text-muted-foreground text-xs mb-1">
										分类数量
									</div>
									<div className="text-2xl font-bold">
										{new Set(presets.map((p) => p.category || "未分类")).size}
									</div>
								</div>
							</div>
						</div>
					</div>
					<DialogFooter>
						<Button variant="outline" onClick={() => setShowSettings(false)}>
							关闭
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* 重置确认对话框 */}
			<AlertDialog open={showResetConfirm} onOpenChange={setShowResetConfirm}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>确定要重置所有命令预设吗？</AlertDialogTitle>
						<AlertDialogDescription>
							此操作无法撤销，所有自定义和导入的命令都将被删除，恢复到初始的{" "}
							{presets.length > 0 ? "11" : "默认"} 个预设命令。
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>取消</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleResetCommands}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
						>
							确认重置
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
