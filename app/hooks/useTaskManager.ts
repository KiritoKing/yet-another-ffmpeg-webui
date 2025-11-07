import { useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";
import type { FFmpegService } from "../services/ffmpegService";
import { QueueProcessor } from "../services/queueProcessor";
import { useLogStore } from "../store/logStore";
import { useTaskStore } from "../store/taskStore";
import type { CommandPreset } from "../types/command";
import type { Task, TaskStatus } from "../types/task";
import {
	detectUnsupportedOptions,
	formatErrorMessage,
	parseFFmpegError,
	sanitizeFilename,
} from "../utils";

/**
 * 任务管理 Hook
 * 管理任务创建、队列处理、历史记录等功能
 */
export function useTaskManager(
	ffmpegServiceRef: React.RefObject<FFmpegService | null>,
) {
	const addLog = useLogStore((state) => state.addLog);
	const queueProcessorRef = useRef<QueueProcessor | null>(null);

	const {
		currentTask,
		queue,
		queueConfig,
		isProcessingQueue,
		setCurrentTask,
		updateCurrentTask,
		clearCurrentTask,
		addToQueue,
		addMultipleToQueue,
		removeFromQueue,
		clearQueue,
		setQueueConfig,
		startTask,
		completeTask,
		failTask,
		abortTask,
		setTaskResult,
		clearTaskResult,
		setProcessingQueue,
	} = useTaskStore();

	/**
	 * 创建新任务
	 */
	const createTask = useCallback(
		(
			preset: CommandPreset,
			formValues: Record<string, unknown>,
			ffmpegArgs: string[],
			outputFileName: string,
		): Task => {
			// 提取输入文件信息
			const inputFiles: Task["inputFiles"] = [];
			for (const [key, value] of Object.entries(formValues)) {
				if (value instanceof File) {
					inputFiles.push({
						name: value.name,
						size: value.size,
						type: value.type,
					});
				} else if (Array.isArray(value)) {
					const files = value.filter((v) => v instanceof File) as File[];
					for (const file of files) {
						inputFiles.push({
							name: file.name,
							size: file.size,
							type: file.type,
						});
					}
				}
			}

			// 验证不支持的选项
			const unsupported = detectUnsupportedOptions(ffmpegArgs);
			if (unsupported.length > 0) {
				addLog(
					`⚠️ 命令包含 WebAssembly 不支持的选项: ${unsupported.join(", ")}`,
					"warning",
				);
				toast.warning(
					`命令包含不支持的选项，可能会失败: ${unsupported.join(", ")}`,
				);
			}

			// 清理输出文件名
			const sanitizedOutput = sanitizeFilename(outputFileName);
			if (sanitizedOutput !== outputFileName) {
				addLog(`文件名已清理: ${outputFileName} -> ${sanitizedOutput}`, "info");
			}

			const task: Task = {
				id: `task_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
				presetId: preset.id,
				presetName: preset.name,
				status: "pending" as TaskStatus,
				progress: 0,
				createdAt: Date.now(),
				inputFiles,
				outputFileName: sanitizedOutput,
				ffmpegArgs,
				formValues: Object.fromEntries(
					Object.entries(formValues).filter(
						([_, v]) => !(v instanceof File) && !Array.isArray(v),
					),
				),
				estimatedMemoryMB: preset.estimatedMemoryMB,
			};

			return task;
		},
		[addLog],
	);

	/**
	 * 执行单个任务
	 */
	const executeTask = useCallback(
		async (task: Task, formValues: Record<string, unknown>) => {
			const service = ffmpegServiceRef.current;
			if (!service) {
				throw new Error("FFmpeg 未加载");
			}

			// 清空之前的任务状态和结果
			if (currentTask) {
				clearTaskResult(currentTask.id);
			}
			clearCurrentTask();

			// 设置为当前任务
			setCurrentTask(task);
			startTask(task.id);

			addLog(`开始执行任务: ${task.presetName}`, "info");

			try {
				// 准备输入文件
				const inputFilesList: Array<{ file: File; name: string }> = [];
				for (const [key, value] of Object.entries(formValues)) {
					if (value instanceof File) {
						const sanitized = sanitizeFilename(value.name);
						inputFilesList.push({ file: value, name: sanitized });
					} else if (Array.isArray(value)) {
						const files = value.filter((v) => v instanceof File) as File[];
						for (const file of files) {
							const sanitized = sanitizeFilename(file.name);
							inputFilesList.push({ file, name: sanitized });
						}
					}
				}

				// 执行命令
				const outputBlob = await service.executeCommand({
					inputFiles: inputFilesList,
					outputFileName: task.outputFileName,
					ffmpegArgs: task.ffmpegArgs,
				});

				// 创建 Blob URL
				const blobUrl = URL.createObjectURL(outputBlob);

				// 完成任务
				completeTask(task.id, outputBlob.size, blobUrl);
				setTaskResult(task.id, blobUrl);

				addLog(
					`任务完成: ${task.presetName} (${(outputBlob.size / 1024).toFixed(2)} KB)`,
					"success",
				);
				toast.success("任务执行成功！🎉");

				return blobUrl;
			} catch (error) {
				const taskError = parseFFmpegError(error);
				failTask(task.id, taskError);

				const errorMsg = formatErrorMessage(taskError);
				addLog(errorMsg, "error");
				toast.error(taskError.message);

				throw error;
			}
		},
		[
			ffmpegServiceRef,
			currentTask,
			setCurrentTask,
			startTask,
			completeTask,
			failTask,
			clearCurrentTask,
			clearTaskResult,
			setTaskResult,
			addLog,
		],
	);

	/**
	 * 添加任务到队列
	 */
	const addTaskToQueue = useCallback(
		(task: Task) => {
			addToQueue(task);
			addLog(`任务已添加到队列: ${task.presetName}`, "info");
			toast.info(`已添加到队列: ${task.presetName}`);
		},
		[addToQueue, addLog],
	);

	/**
	 * 批量添加任务到队列
	 */
	const addTasksToQueue = useCallback(
		(tasks: Task[]) => {
			addMultipleToQueue(tasks);
			addLog(`已添加 ${tasks.length} 个任务到队列`, "info");
			toast.info(`已添加 ${tasks.length} 个任务到队列`);
		},
		[addMultipleToQueue, addLog],
	);

	/**
	 * 开始处理队列
	 */
	const startQueue = useCallback(async () => {
		const service = ffmpegServiceRef.current;
		if (!service) {
			toast.error("请先加载 FFmpeg");
			return;
		}

		if (queue.length === 0) {
			toast.warning("队列为空");
			return;
		}

		if (isProcessingQueue) {
			toast.warning("队列正在处理中");
			return;
		}

		try {
			setProcessingQueue(true);
			addLog(`开始处理队列 (${queue.length} 个任务)`, "info");

			// 创建队列处理器
			const processor = new QueueProcessor(service, {
				batchSize: queueConfig.batchSize,
				onTaskStart: (task) => {
					startTask(task.id);
					addLog(`[队列] 开始: ${task.presetName}`, "info");
				},
				onTaskComplete: (taskId, outputSize, outputBlob) => {
					const blobUrl = URL.createObjectURL(outputBlob);
					completeTask(taskId, outputSize, blobUrl);
					setTaskResult(taskId, blobUrl);
				},
				onTaskFail: (taskId, error) => {
					failTask(taskId, error);
					if (error) {
						const msg = formatErrorMessage(error);
						addLog(msg, "error");
					}
				},
				onLog: (message, type) => {
					addLog(message, type as "info" | "warning" | "error" | "success");
				},
			});

			queueProcessorRef.current = processor;

			// 添加所有任务到处理器
			processor.addTasks([...queue]);
			clearQueue();

			// 开始处理
			await processor.start();

			addLog("队列处理完成", "success");
			toast.success("队列处理完成");
		} catch (error) {
			const errorMsg = error instanceof Error ? error.message : String(error);
			addLog(`队列处理失败: ${errorMsg}`, "error");
			toast.error(`队列处理失败: ${errorMsg}`);
		} finally {
			setProcessingQueue(false);
			queueProcessorRef.current = null;
		}
	}, [
		ffmpegServiceRef,
		queue,
		queueConfig,
		isProcessingQueue,
		setProcessingQueue,
		startTask,
		completeTask,
		failTask,
		setTaskResult,
		clearQueue,
		addLog,
	]);

	/**
	 * 停止队列处理
	 */
	const stopQueue = useCallback(() => {
		if (queueProcessorRef.current) {
			queueProcessorRef.current.stop();
			addLog("正在停止队列处理...", "warning");
			toast.info("正在停止队列处理...");
		}
	}, [addLog]);

	/**
	 * 中止当前任务
	 */
	const abortCurrentTask = useCallback(() => {
		if (currentTask) {
			abortTask(currentTask.id);
			addLog(`任务已中止: ${currentTask.presetName}`, "warning");
		}
	}, [currentTask, abortTask, addLog]);

	// 监听页面卸载，提示用户
	useEffect(() => {
		const handleBeforeUnload = (e: BeforeUnloadEvent) => {
			if (
				isProcessingQueue ||
				(currentTask && currentTask.status === "running")
			) {
				e.preventDefault();
				e.returnValue = "";
				return "";
			}
		};

		window.addEventListener("beforeunload", handleBeforeUnload);
		return () => window.removeEventListener("beforeunload", handleBeforeUnload);
	}, [isProcessingQueue, currentTask]);

	return {
		// State
		currentTask,
		queue,
		queueConfig,
		isProcessingQueue,

		// Actions
		createTask,
		executeTask,
		addTaskToQueue,
		addTasksToQueue,
		startQueue,
		stopQueue,
		setQueueConfig,
		removeFromQueue,
		clearQueue,
		abortCurrentTask,
	};
}
