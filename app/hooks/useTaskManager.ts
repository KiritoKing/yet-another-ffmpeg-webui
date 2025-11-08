import { useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";
import { FFmpegWorkerPool, SingleFFmpegProvider } from "../services/ffmpegPool";
import type { FFmpegService } from "../services/ffmpegService";
import { QueueProcessor } from "../services/queueProcessor";
import { useLogStore } from "../store/logStore";
import { useTaskStore } from "../store/taskStore";
import type { CommandPreset } from "../types/command";
import type { Task, TaskStatus } from "../types/task";
import {
	applyFilenameMappings,
	detectUnsupportedOptions,
	formatErrorMessage,
	parseFFmpegError,
	sanitizeFilename,
	standardizeAndUniquifyFilenames,
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
		executingTasks,
		recentCompletedTasks,
		queueConfig,
		isProcessingQueue,
		initialQueueSize,
		setCurrentTask,
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
		addExecutingTask,
		removeExecutingTask,
		updateExecutingTask,
		setTaskResult,
		getTaskResult,
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
			for (const [, value] of Object.entries(formValues)) {
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
				// 保存 File 对象到临时字段（用于队列执行，不持久化）
				_files: Object.fromEntries(
					Object.entries(formValues).filter(
						([_, v]) =>
							v instanceof File || (Array.isArray(v) && v[0] instanceof File),
					),
				) as Record<string, File | File[]>,
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
				// 准备输入文件（统一标准化并去重），记录日志
				const pendingFiles: File[] = [];
				for (const [, value] of Object.entries(formValues)) {
					if (value instanceof File) {
						pendingFiles.push(value);
					} else if (Array.isArray(value)) {
						pendingFiles.push(
							...(value.filter((v) => v instanceof File) as File[]),
						);
					}
				}
				const standardized = standardizeAndUniquifyFilenames(pendingFiles);
				const inputFilesList: Array<{ file: File; name: string }> = [];

				// 构建文件名映射（原始名 -> 标准化名）
				const filenameMappings: Array<{ original: string; finalName: string }> =
					[];

				for (const item of standardized) {
					if (item.warnings.length) {
						addLog(
							`[文件名标准化] ${item.original} -> ${item.finalName} (${item.warnings.join(", ")})`,
							"warning",
						);
					} else if (item.original !== item.finalName) {
						addLog(
							`[文件名标准化] ${item.original} -> ${item.finalName}`,
							"info",
						);
					}
					const file = pendingFiles.find((f) => f.name === item.original);
					if (file) {
						inputFilesList.push({ file, name: item.finalName });
						filenameMappings.push({
							original: item.original,
							finalName: item.finalName,
						});
					}
				}

				// 标准化输出文件名
				const sanitizedOutputFileName = sanitizeFilename(task.outputFileName);
				if (sanitizedOutputFileName !== task.outputFileName) {
					addLog(
						`[输出文件名标准化] ${task.outputFileName} -> ${sanitizedOutputFileName}`,
						"info",
					);
					filenameMappings.push({
						original: task.outputFileName,
						finalName: sanitizedOutputFileName,
					});
				}

				// 更新 ffmpegArgs 中的文件名引用
				const updatedArgs = applyFilenameMappings(
					task.ffmpegArgs,
					filenameMappings,
				);

				// 记录最终执行的命令
				if (JSON.stringify(updatedArgs) !== JSON.stringify(task.ffmpegArgs)) {
					addLog(`[最终命令] ffmpeg ${updatedArgs.join(" ")}`, "info");
				}

				// 执行命令
				const outputBlob = await service.executeCommand({
					inputFiles: inputFilesList,
					outputFileName: sanitizedOutputFileName,
					ffmpegArgs: updatedArgs,
				}); // 创建 Blob URL
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
		const baseService = ffmpegServiceRef.current;
		if (!baseService) {
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
			addLog(
				`开始处理队列 (${queue.length} 个任务) 并发=${queueConfig.batchSize}`,
				"info",
			);

			// 选择 Provider：batchSize=1 时复用现有实例；否则创建池
			const provider =
				queueConfig.batchSize === 1
					? new SingleFFmpegProvider(baseService)
					: new FFmpegWorkerPool({
							mode: baseService.getMode() === "multi" ? "multi" : "single",
							size: queueConfig.batchSize,
							onLog: (m, instanceId) => addLog(m, "info", instanceId),
						});

			// 创建队列处理器
			const processor = new QueueProcessor(provider, {
				batchSize: queueConfig.batchSize,
				onTaskStart: (task) => {
					addExecutingTask(task); // 先添加到执行列表
					startTask(task.id); // 再更新状态
					addLog(`[队列] 开始: ${task.presetName}`, "info");
				},
				onTaskProgress: (taskId, progress) => {
					// 更新正在执行任务的进度
					updateExecutingTask(taskId, { progress });
				},
				onTaskComplete: (taskId, outputSize, outputBlob) => {
					const blobUrl = URL.createObjectURL(outputBlob);
					completeTask(taskId, outputSize, blobUrl);
					setTaskResult(taskId, blobUrl);
					removeExecutingTask(taskId);
				},
				onTaskFail: (taskId, error) => {
					failTask(taskId, error);
					removeExecutingTask(taskId);
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

			// 开始处理（内部并发）
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
		addExecutingTask,
		removeExecutingTask,
		updateExecutingTask,
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
		executingTasks,
		recentCompletedTasks,
		queueConfig,
		isProcessingQueue,
		initialQueueSize,

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
		getTaskResult,
	};
}
