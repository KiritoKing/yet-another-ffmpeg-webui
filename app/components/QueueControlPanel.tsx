import {
	CheckCircle,
	Download,
	Eye,
	FileUp,
	Play,
	Settings,
	Square,
	Trash2,
} from "lucide-react";
import { useState } from "react";
import type { Task } from "../types/task";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
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

interface QueueControlPanelProps {
	queue: Task[];
	executingTasks: Task[];
	completedTasks?: Task[]; // 最近完成的任务（可选）
	isProcessing: boolean;
	batchSize: number;
	initialQueueSize?: number; // 队列初始大小，用于计算总体进度
	onStart: () => void;
	onStop: () => void;
	onClear: () => void;
	onRemoveTask: (taskId: string) => void;
	onBatchSizeChange: (size: number) => void;
	onDownloadResult?: (taskId: string) => void; // 下载任务结果
	getTaskResultUrl?: (taskId: string) => string | undefined; // 获取任务结果URL
}

/**
 * 队列控制面板组件
 * 显示和管理任务队列
 */
export function QueueControlPanel({
	queue,
	executingTasks,
	completedTasks = [],
	isProcessing,
	batchSize,
	initialQueueSize = 0,
	onStart,
	onStop,
	onClear,
	onRemoveTask,
	onBatchSizeChange,
	onDownloadResult,
	getTaskResultUrl,
}: QueueControlPanelProps) {
	const [previewTaskId, setPreviewTaskId] = useState<string | null>(null);

	// 获取预览任务
	const previewTask = previewTaskId
		? completedTasks.find((t) => t.id === previewTaskId)
		: null;
	const previewUrl = previewTaskId ? getTaskResultUrl?.(previewTaskId) : null;

	// 计算总体进度
	// 使用初始队列大小计算进度，而不是当前的 queue + executingTasks
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

	// 获取状态徽章
	const getStatusBadge = (task: Task) => {
		const styles = {
			pending: "bg-gray-500",
			running: "bg-blue-500",
			completed: "bg-green-500",
			failed: "bg-red-500",
			aborted: "bg-orange-500",
		};

		const labels = {
			pending: "等待中",
			running: "执行中",
			completed: "已完成",
			failed: "失败",
			aborted: "已中止",
		};

		return <Badge className={styles[task.status]}>{labels[task.status]}</Badge>;
	};

	return (
		<Card className="p-6">
			<div className="space-y-4">
				{/* 标题和控制 */}
				<div className="flex items-center justify-between">
					<div>
						<h3 className="text-xl font-bold">任务队列</h3>
						<p className="text-sm text-gray-500">
							{queue.length} 个任务等待中，{executingTasks.length} 个正在执行
						</p>
					</div>

					<div className="flex gap-2">
						{!isProcessing ? (
							<Button onClick={onStart} disabled={queue.length === 0} size="sm">
								<Play className="w-4 h-4 mr-2" />
								开始处理
							</Button>
						) : (
							<Button onClick={onStop} variant="destructive" size="sm">
								<Square className="w-4 h-4 mr-2" />
								停止
							</Button>
						)}

						<Button
							onClick={onClear}
							variant="outline"
							size="sm"
							disabled={isProcessing || queue.length === 0}
						>
							<Trash2 className="w-4 h-4 mr-2" />
							清空队列
						</Button>
					</div>
				</div>

				{/* 批处理大小设置 */}
				<div className="flex items-center gap-4 p-3 bg-gray-100 dark:bg-gray-800 rounded">
					<Settings className="w-4 h-4" />
					<Label htmlFor="batch-size">并发数:</Label>
					<Select
						value={batchSize.toString()}
						onValueChange={(value) => onBatchSizeChange(Number(value))}
						disabled={isProcessing}
					>
						<SelectTrigger id="batch-size" className="w-24">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="1">1</SelectItem>
							<SelectItem value="2">2</SelectItem>
							<SelectItem value="3">3</SelectItem>
							<SelectItem value="4">4</SelectItem>
						</SelectContent>
					</Select>
					<span className="text-sm text-gray-500">同时处理的任务数量</span>
				</div>

				{/* 总体进度 */}
				{isProcessing && totalTasks > 0 && (
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

				<Separator />

				{/* 正在执行的任务 */}
				{executingTasks.length > 0 && (
					<div className="space-y-2">
						<h4 className="font-semibold text-sm">正在执行</h4>
						{executingTasks.map((task) => (
							<div
								key={task.id}
								className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded"
							>
								<div className="flex-1">
									<div className="flex items-center gap-2">
										<span className="font-medium">{task.presetName}</span>
										{getStatusBadge(task)}
									</div>
									<div className="text-sm text-gray-500">
										{task.inputFiles.map((f) => f.name).join(", ")}
									</div>
								</div>
								<div className="text-sm text-gray-500">
									{(task.progress * 100).toFixed(0)}%
								</div>
							</div>
						))}
					</div>
				)}

				{/* 等待队列 */}
				{queue.length > 0 && (
					<div className="space-y-2">
						<h4 className="font-semibold text-sm">等待队列</h4>
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
											<span className="font-medium">{task.presetName}</span>
										</div>
										<div className="text-sm text-gray-500">
											{task.inputFiles.map((f) => f.name).join(", ")}
										</div>
									</div>
									<Button
										variant="ghost"
										size="sm"
										onClick={() => onRemoveTask(task.id)}
										disabled={isProcessing}
									>
										<Trash2 className="w-4 h-4" />
									</Button>
								</div>
							))}
						</div>
					</div>
				)}

				{/* 已完成任务 */}
				{completedTasks.length > 0 && (
					<div className="space-y-2">
						<h4 className="font-semibold text-sm">
							最近完成 ({completedTasks.length})
						</h4>
						<div className="space-y-2 max-h-96 overflow-y-auto">
							{completedTasks.map((task) => {
								const resultUrl = getTaskResultUrl?.(task.id);
								const isVideo = /\.(mp4|webm|avi|mov)$/i.test(
									task.outputFileName,
								);
								const isAudio = /\.(mp3|wav|ogg|m4a)$/i.test(
									task.outputFileName,
								);
								const isImage = /\.(gif|jpg|jpeg|png|webp)$/i.test(
									task.outputFileName,
								);
								const canPreview = resultUrl && (isVideo || isAudio || isImage);

								return (
									<div
										key={task.id}
										className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded"
									>
										<div className="flex-1">
											<div className="flex items-center gap-2">
												<CheckCircle className="w-4 h-4 text-green-600" />
												<span className="font-medium">{task.presetName}</span>
												{task.outputSize && (
													<span className="text-sm text-gray-500">
														{(task.outputSize / 1024 / 1024).toFixed(2)} MB
													</span>
												)}
											</div>
											<div className="text-sm text-gray-500">
												{task.inputFiles.map((f) => f.name).join(", ")} →{" "}
												{task.outputFileName}
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
											{onDownloadResult && (
												<Button
													variant="ghost"
													size="sm"
													onClick={() => onDownloadResult(task.id)}
													title="下载"
												>
													<Download className="w-4 h-4" />
												</Button>
											)}
										</div>
									</div>
								);
							})}
						</div>
					</div>
				)}

				{/* 空状态 */}
				{queue.length === 0 &&
					executingTasks.length === 0 &&
					completedTasks.length === 0 && (
						<div className="text-center py-8 text-gray-500">
							<FileUp className="w-12 h-12 mx-auto mb-2 opacity-50" />
							<p>队列为空</p>
							<p className="text-sm">添加任务到队列后可批量处理</p>
						</div>
					)}
			</div>

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
		</Card>
	);
}
