import {
	CheckCircle,
	CheckIcon,
	ChevronDown,
	ChevronUp,
	CopyIcon,
	DownloadIcon,
	Eye,
	FileUp,
	Play,
	Plus,
	Settings,
	Square,
	Trash2,
} from "lucide-react";
import { useState } from "react";
import type { CommandPreset } from "../types/command";
import type { Task } from "../types/task";
import {
	extractNonFileValues,
	getFileInputFields,
	replaceTemplateVariables,
} from "../utils";
import { DynamicForm } from "./DynamicForm";
import { ProgressLogViewer } from "./ProgressLogViewer";
import { TaskHistoryViewer } from "./TaskHistoryViewer";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "./ui/collapsible";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "./ui/dialog";
import { Label } from "./ui/label";
import { Progress } from "./ui/progress";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "./ui/select";
import { Separator } from "./ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

interface ExecutionPanelProps {
	// 命令相关
	selectedPreset: CommandPreset | null;
	formValues: Record<string, string | number | boolean | File | File[]>;
	copiedCommand: boolean;
	onFormChange: (
		values: Record<string, string | number | boolean | File | File[]>,
	) => void;
	onCopyCommand: () => void;

	// 执行控制
	onExecute: () => void;

	// 队列相关
	queue: Task[];
	executingTasks: Task[];
	completedTasks: Task[];
	isProcessingQueue: boolean;
	batchSize: number;
	initialQueueSize: number;
	onStartQueue: () => void;
	onStopQueue: () => void;
	onClearQueue: () => void;
	onRemoveTask: (taskId: string) => void;
	onBatchSizeChange: (size: number) => void;
	getTaskResultUrl: (taskId: string) => string | undefined;
	onDownloadResult: (taskId: string) => void;
}

/**
 * 统一的执行面板组件
 * 整合了命令执行、队列管理和任务历史
 */
export function ExecutionPanel({
	// 命令相关
	selectedPreset,
	formValues,
	copiedCommand,
	onFormChange,
	onCopyCommand,

	// 执行控制
	onExecute,

	// 队列相关
	queue,
	executingTasks,
	completedTasks,
	isProcessingQueue,
	batchSize,
	initialQueueSize,
	onStartQueue,
	onStopQueue,
	onClearQueue,
	onRemoveTask,
	onBatchSizeChange,
	getTaskResultUrl,
	onDownloadResult,
}: ExecutionPanelProps) {
	// 本地状态
	const [previewTaskId, setPreviewTaskId] = useState<string | null>(null);
	const [showQueue, setShowQueue] = useState(true);
	const [showCompleted, setShowCompleted] = useState(true);

	// 获取预览任务
	const previewTask = previewTaskId
		? completedTasks.find((t) => t.id === previewTaskId)
		: null;
	const previewUrl = previewTaskId ? getTaskResultUrl(previewTaskId) : null;

	// 计算总体进度
	const totalTasks =
		initialQueueSize > 0
			? initialQueueSize
			: queue.length + executingTasks.length;
	const completedCount = Math.max(
		0,
		totalTasks - queue.length - executingTasks.length,
	);
	const overallProgress =
		totalTasks > 0 ? (completedCount / totalTasks) * 100 : 0;

	// 如果没有选择命令预设
	if (!selectedPreset) {
		return (
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
				<h2 className="text-2xl font-bold mb-2">请选择一个命令预设</h2>
				<p className="text-muted-foreground">
					从左侧列表中选择要执行的 FFmpeg 命令
				</p>
			</Card>
		);
	}

	const fileInputFields = getFileInputFields(selectedPreset);
	const hasRequiredFiles = !fileInputFields.some((field) => {
		if (!field.required) return false;
		const val = formValues[field.name];
		if (field.multiple) {
			return !val || !Array.isArray(val) || val.length === 0;
		}
		return !(val instanceof File);
	});

	return (
		<div className="space-y-6">
			{/* 1. 命令信息和表单 */}
			<Card className="p-6">
				<div className="flex items-start justify-between mb-4">
					<div>
						<h2 className="text-xl font-bold">{selectedPreset.name}</h2>
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
							onClick={onCopyCommand}
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
						{selectedPreset.formSchema && selectedPreset.formSchema.length > 0
							? replaceTemplateVariables(
									selectedPreset.ffmpegArgs,
									extractNonFileValues(formValues),
								).join(" ")
							: selectedPreset.ffmpegArgs.join(" ")}
					</div>
				</div>

				{/* 自定义表单 */}
				{selectedPreset.formSchema && selectedPreset.formSchema.length > 0 && (
					<Card className="p-4 mb-4 bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
						<div className="mb-3">
							<Label className="text-base font-semibold flex items-center gap-2">
								<span className="text-blue-600 dark:text-blue-400">⚙️</span>
								命令参数配置
							</Label>
							<p className="text-xs text-muted-foreground mt-1">
								调整下方参数，命令将实时更新
							</p>
						</div>
						<DynamicForm
							schema={selectedPreset.formSchema}
							values={formValues}
							onChange={onFormChange}
						/>
					</Card>
				)}

				{/* 提交任务按钮 */}
				<div className="flex gap-2 mt-4">
					<Button
						onClick={onExecute}
						disabled={!hasRequiredFiles}
						className="flex-1"
						size="lg"
					>
						<Plus className="mr-2" />
						提交任务到队列
					</Button>
				</div>
			</Card>

			{/* 2. 标签页：队列和历史 */}
			<Tabs defaultValue="queue" className="w-full">
				<TabsList className="grid w-full grid-cols-2">
					<TabsTrigger value="queue">任务队列</TabsTrigger>
					<TabsTrigger value="history">任务历史</TabsTrigger>
				</TabsList>

				{/* 队列标签页 */}
				<TabsContent value="queue" className="mt-6">
					<Card className="p-6">
						{/* 批处理和队列控制 */}
						<div className="flex items-center justify-between mb-4">
							<div>
								<h3 className="text-lg font-semibold">任务队列</h3>
								<p className="text-sm text-muted-foreground">
									添加多个任务到队列并批量处理
								</p>
							</div>
						</div>

						{/* 批处理大小设置 */}
						<div className="flex items-center gap-4 p-3 bg-muted rounded mb-4">
							<Settings className="w-4 h-4" />
							<Label htmlFor="batch-size-exec">并发数:</Label>
							<Select
								value={batchSize.toString()}
								onValueChange={(value) => onBatchSizeChange(Number(value))}
								disabled={isProcessingQueue}
							>
								<SelectTrigger id="batch-size-exec" className="w-24">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="1">1</SelectItem>
									<SelectItem value="2">2</SelectItem>
									<SelectItem value="3">3</SelectItem>
									<SelectItem value="4">4</SelectItem>
								</SelectContent>
							</Select>
							<span className="text-sm text-muted-foreground">
								同时处理的任务数量
							</span>
						</div>

						{/* 队列控制按钮 */}
						<div className="flex gap-2 mb-4">
							{!isProcessingQueue ? (
								<Button
									onClick={onStartQueue}
									disabled={queue.length === 0}
									size="sm"
									className="flex-1"
								>
									<Play className="w-4 h-4 mr-2" />
									开始处理队列 ({queue.length})
								</Button>
							) : (
								<Button
									onClick={onStopQueue}
									variant="destructive"
									size="sm"
									className="flex-1"
								>
									<Square className="w-4 h-4 mr-2" />
									停止
								</Button>
							)}
							<Button
								onClick={onClearQueue}
								variant="outline"
								size="sm"
								disabled={isProcessingQueue || queue.length === 0}
							>
								<Trash2 className="w-4 h-4 mr-2" />
								清空
							</Button>
						</div>

						{/* 总体进度 */}
						{isProcessingQueue && totalTasks > 0 && (
							<div className="space-y-2">
								<div className="flex justify-between text-sm">
									<span>总体进度</span>
									<span>
										{completedCount} / {totalTasks}
									</span>
								</div>
								<Progress value={overallProgress} />
							</div>
						)}

						<Separator className="my-4" />

						{/* 正在执行的任务 */}
						{executingTasks.length > 0 && (
							<div className="space-y-2 mb-4">
								<h4 className="font-semibold text-sm">
									正在执行 ({executingTasks.length})
								</h4>
								{executingTasks.map((task) => (
									<div
										key={task.id}
										className="space-y-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded"
									>
										<div className="flex items-center justify-between">
											<div className="flex items-center gap-2">
												<span className="font-medium">{task.presetName}</span>
												<Badge className="bg-blue-500">执行中</Badge>
											</div>
											<span className="text-sm text-muted-foreground">
												{(task.progress * 100).toFixed(1)}%
											</span>
										</div>

										{/* 任务详细信息 */}
										<div className="text-xs text-muted-foreground space-y-1">
											<div className="flex items-center gap-2">
												<FileUp className="w-3 h-3" />
												<span>
													输入: {task.inputFiles.map((f) => f.name).join(", ")}
												</span>
											</div>
											<div className="flex items-center gap-2">
												<DownloadIcon className="w-3 h-3" />
												<span>输出: {task.outputFileName}</span>
											</div>
										</div>

										{/* 进度条 */}
										<Progress value={task.progress * 100} className="h-1.5" />
									</div>
								))}
							</div>
						)}

						{/* 等待队列（可折叠） */}
						{queue.length > 0 && (
							<Collapsible open={showQueue} onOpenChange={setShowQueue}>
								<CollapsibleTrigger asChild>
									<Button variant="ghost" size="sm" className="w-full mb-2">
										{showQueue ? (
											<>
												<ChevronUp className="w-4 h-4 mr-2" />
												隐藏等待队列 ({queue.length})
											</>
										) : (
											<>
												<ChevronDown className="w-4 h-4 mr-2" />
												显示等待队列 ({queue.length})
											</>
										)}
									</Button>
								</CollapsibleTrigger>
								<CollapsibleContent>
									<div className="space-y-2 max-h-64 overflow-y-auto">
										{queue.map((task, index) => (
											<div
												key={task.id}
												className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded"
											>
												<div className="flex-1">
													<div className="flex items-center gap-2">
														<span className="text-sm text-gray-500">
															#{index + 1}
														</span>
														<span className="font-medium">
															{task.presetName}
														</span>
													</div>
													<div className="text-sm text-gray-500">
														{task.inputFiles.map((f) => f.name).join(", ")}
													</div>
												</div>
												<Button
													variant="ghost"
													size="sm"
													onClick={() => onRemoveTask(task.id)}
													disabled={isProcessingQueue}
												>
													<Trash2 className="w-4 h-4" />
												</Button>
											</div>
										))}
									</div>
								</CollapsibleContent>
							</Collapsible>
						)}

						{/* 最近完成（可折叠） */}
						{completedTasks.length > 0 && (
							<>
								<Separator className="my-4" />
								<Collapsible
									open={showCompleted}
									onOpenChange={setShowCompleted}
								>
									<CollapsibleTrigger asChild>
										<Button variant="ghost" size="sm" className="w-full mb-2">
											{showCompleted ? (
												<>
													<ChevronUp className="w-4 h-4 mr-2" />
													隐藏已完成 ({completedTasks.length})
												</>
											) : (
												<>
													<ChevronDown className="w-4 h-4 mr-2" />
													显示已完成 ({completedTasks.length})
												</>
											)}
										</Button>
									</CollapsibleTrigger>
									<CollapsibleContent>
										<div className="space-y-2 max-h-96 overflow-y-auto">
											{completedTasks.map((task) => {
												const resultUrl = getTaskResultUrl(task.id);
												const isVideo = /\.(mp4|webm|avi|mov)$/i.test(
													task.outputFileName,
												);
												const isAudio = /\.(mp3|wav|ogg|m4a)$/i.test(
													task.outputFileName,
												);
												const isImage = /\.(gif|jpg|jpeg|png|webp)$/i.test(
													task.outputFileName,
												);
												const canPreview =
													resultUrl && (isVideo || isAudio || isImage);

												return (
													<div
														key={task.id}
														className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded"
													>
														<div className="flex-1">
															<div className="flex items-center gap-2">
																<CheckCircle className="w-4 h-4 text-green-600" />
																<span className="font-medium">
																	{task.presetName}
																</span>
																{task.outputSize && (
																	<span className="text-sm text-gray-500">
																		{(task.outputSize / 1024 / 1024).toFixed(2)}{" "}
																		MB
																	</span>
																)}
															</div>
															<div className="text-sm text-gray-500">
																{task.inputFiles.map((f) => f.name).join(", ")}{" "}
																→ {task.outputFileName}
															</div>
														</div>
														<div className="flex gap-1">
															{canPreview && (
																<Button
																	variant="ghost"
																	size="sm"
																	onClick={() => setPreviewTaskId(task.id)}
																	title="预览"
																>
																	<Eye className="w-4 h-4" />
																</Button>
															)}
															<Button
																variant="ghost"
																size="sm"
																onClick={() => onDownloadResult(task.id)}
																title="下载"
															>
																<DownloadIcon className="w-4 h-4" />
															</Button>
														</div>
													</div>
												);
											})}
										</div>
									</CollapsibleContent>
								</Collapsible>
							</>
						)}

						{/* 空状态 */}
						{queue.length === 0 &&
							executingTasks.length === 0 &&
							completedTasks.length === 0 && (
								<div className="text-center py-8 text-gray-500">
									<FileUp className="w-12 h-12 mx-auto mb-2 opacity-50" />
									<p>队列为空</p>
									<p className="text-sm">上传多个文件以批量处理</p>
								</div>
							)}
					</Card>
				</TabsContent>

				{/* 历史标签页 */}
				<TabsContent value="history" className="mt-6">
					<TaskHistoryViewer />
				</TabsContent>
			</Tabs>

			{/* 3. 日志 */}
			<ProgressLogViewer />

			{/* 预览对话框 */}
			{previewTask && previewUrl && (
				<Dialog
					open={!!previewTaskId}
					onOpenChange={() => setPreviewTaskId(null)}
				>
					<DialogContent className="max-w-4xl max-h-[90vh]">
						<DialogHeader>
							<DialogTitle>{previewTask.presetName}</DialogTitle>
							<DialogDescription>
								{previewTask.inputFiles.map((f) => f.name).join(", ")} →{" "}
								{previewTask.outputFileName}
								{previewTask.outputSize && (
									<span className="ml-2">
										({(previewTask.outputSize / 1024 / 1024).toFixed(2)} MB)
									</span>
								)}
							</DialogDescription>
						</DialogHeader>
						<div className="mt-4">
							{/\.(mp4|webm|avi|mov)$/i.test(previewTask.outputFileName) && (
								<video
									src={previewUrl}
									controls
									className="w-full rounded"
									aria-label="任务输出视频预览"
								>
									<track
										kind="captions"
										src="data:text/vtt,WEBVTT%0A%0A"
										srcLang="zh"
										label="空字幕"
										default
									/>
								</video>
							)}
							{/\.(mp3|wav|ogg|m4a)$/i.test(previewTask.outputFileName) && (
								<audio
									src={previewUrl}
									controls
									className="w-full"
									aria-label="任务输出音频预览"
								>
									<track
										kind="captions"
										src="data:text/vtt,WEBVTT%0A%0A"
										srcLang="zh"
										label="空字幕"
										default
									/>
								</audio>
							)}
							{/\.(gif|jpg|jpeg|png|webp)$/i.test(
								previewTask.outputFileName,
							) && (
								<img
									src={previewUrl}
									alt="任务输出图片预览"
									className="w-full rounded"
								/>
							)}
						</div>
					</DialogContent>
				</Dialog>
			)}
		</div>
	);
}
