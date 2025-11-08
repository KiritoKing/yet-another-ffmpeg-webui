import type { Task } from "../types/task";
import { detectUnsupportedOptions, parseFFmpegError } from "../utils";
import type { FFmpegProvider } from "./ffmpegPool";
import type { FFmpegService } from "./ffmpegService";

export interface QueueProcessorConfig {
	batchSize: number;
	onTaskStart?: (task: Task) => void;
	onTaskProgress?: (taskId: string, progress: number, time: number) => void;
	onTaskComplete?: (
		taskId: string,
		outputSize: number,
		outputBlob: Blob,
	) => void;
	onTaskFail?: (taskId: string, error: Task["error"]) => void;
	onTaskAbort?: (taskId: string) => void;
	onLog?: (message: string, type?: string) => void;
}

/**
 * 任务队列处理器
 * 管理任务队列的执行，支持批处理
 */
export class QueueProcessor {
	private provider:
		| FFmpegProvider
		| {
				acquire: () => Promise<FFmpegService>;
				release: (svc: FFmpegService) => void;
		  };
	private config: QueueProcessorConfig;
	private queue: Task[] = [];
	private executingTasks: Set<string> = new Set();
	private executingServices: Map<string, FFmpegService> = new Map(); // 跟踪正在执行的服务实例
	private isProcessing = false;
	private shouldStop = false;

	constructor(
		provider:
			| FFmpegProvider
			| {
					acquire: () => Promise<FFmpegService>;
					release: (svc: FFmpegService) => void;
			  },
		config: QueueProcessorConfig,
	) {
		this.provider = provider;
		this.config = config;
	}

	/**
	 * 添加任务到队列
	 */
	addTask(task: Task): void {
		this.queue.push(task);
	}

	/**
	 * 添加多个任务到队列
	 */
	addTasks(tasks: Task[]): void {
		this.queue.push(...tasks);
	}

	/**
	 * 获取队列长度
	 */
	getQueueLength(): number {
		return this.queue.length;
	}

	/**
	 * 获取正在执行的任务数
	 */
	getExecutingCount(): number {
		return this.executingTasks.size;
	}

	/**
	 * 清空队列
	 */
	clearQueue(): void {
		this.queue = [];
	}

	/**
	 * 停止处理队列并中止所有正在执行的任务
	 */
	stop(): void {
		this.shouldStop = true;

		// 中止所有正在执行的任务
		for (const [taskId, service] of this.executingServices.entries()) {
			try {
				service.abort();
				this.config.onLog?.(`[队列] 中止任务: ${taskId}`, "warning");
			} catch (error) {
				console.error(`中止任务 ${taskId} 失败:`, error);
			}
		}

		this.config.onLog?.(
			"[队列] 队列已停止，所有正在执行的任务已中止",
			"warning",
		);
	}

	/**
	 * 开始处理队列
	 */
	async start(): Promise<void> {
		if (this.isProcessing) {
			throw new Error("队列已在处理中");
		}

		this.isProcessing = true;
		this.shouldStop = false;

		try {
			while (this.queue.length > 0 && !this.shouldStop) {
				// 等待有空闲槽位
				while (
					this.executingTasks.size >= this.config.batchSize &&
					!this.shouldStop
				) {
					await this.sleep(100);
				}

				if (this.shouldStop) break;

				// 获取下一个任务
				const task = this.queue.shift();
				if (!task) continue;

				// 执行任务（不等待完成）
				this.executeTask(task);
			}

			// 等待所有任务完成
			while (this.executingTasks.size > 0 && !this.shouldStop) {
				await this.sleep(100);
			}
		} finally {
			this.isProcessing = false;
		}
	}

	/**
	 * 执行单个任务
	 */
	private async executeTask(task: Task): Promise<void> {
		this.executingTasks.add(task.id);

		const service = await this.provider.acquire();
		this.executingServices.set(task.id, service); // 记录服务实例

		try {
			// 验证命令参数
			const unsupportedOptions = detectUnsupportedOptions(task.ffmpegArgs);
			if (unsupportedOptions.length > 0) {
				throw new Error(
					`命令包含不支持的选项: ${unsupportedOptions.join(", ")}`,
				);
			}

			// 通知任务开始
			this.config.onTaskStart?.(task);
			this.config.onLog?.(`[队列] 开始执行任务: ${task.presetName}`, "info");

			// 准备输入文件
			const inputFilesList: Array<{ file: File; name: string }> = [];

			// 从 task._files 中提取文件（批量任务中保存的临时 File 对象）
			const pendingFiles: File[] = [];
			if (task._files) {
				for (const [, value] of Object.entries(task._files)) {
					if (value instanceof File) {
						pendingFiles.push(value);
					} else if (Array.isArray(value)) {
						pendingFiles.push(
							...(value.filter((v) => v instanceof File) as File[]),
						);
					}
				}
			}

			this.config.onLog?.(
				`[调试] 从 task._files 提取的文件: ${pendingFiles.map((f) => f.name).join(", ")}`,
				"info",
			);

			// 从 ffmpegArgs 中提取文件名（已经是标准化后的名称）
			// 假设第一个 -i 后面的参数是输入文件名
			const inputFileNameInArgs =
				task.ffmpegArgs[task.ffmpegArgs.indexOf("-i") + 1];

			this.config.onLog?.(
				`[调试] 从 ffmpegArgs 提取的文件名: ${inputFileNameInArgs}`,
				"info",
			);

			// 将文件和标准化后的名称关联
			if (pendingFiles.length === 1 && inputFileNameInArgs) {
				inputFilesList.push({
					file: pendingFiles[0],
					name: inputFileNameInArgs,
				});
			} else {
				// 多文件情况：按顺序匹配
				for (let i = 0; i < pendingFiles.length; i++) {
					const argIndex = task.ffmpegArgs.findIndex(
						(arg, idx) =>
							arg === "-i" &&
							idx >
								(i === 0
									? -1
									: task.ffmpegArgs.lastIndexOf(
											"-i",
											task.ffmpegArgs.length - 1,
										)),
					);
					if (argIndex !== -1) {
						inputFilesList.push({
							file: pendingFiles[i],
							name: task.ffmpegArgs[argIndex + 1],
						});
					}
				}
			}

			this.config.onLog?.(
				`[调试] 将要写入的文件映射: ${inputFilesList.map((item) => `${item.file.name} -> ${item.name}`).join(", ")}`,
				"info",
			);

			// 执行 FFmpeg 命令（使用任务中已准备好的 ffmpegArgs 和 outputFileName）
			const outputBlob = await service.executeCommand({
				inputFiles: inputFilesList,
				outputFileName: task.outputFileName,
				ffmpegArgs: task.ffmpegArgs,
				onProgress: (progress, time) => {
					// 转发进度更新到 QueueProcessor 配置的回调
					this.config.onTaskProgress?.(task.id, progress, time);
				},
			});

			// 任务成功
			this.config.onTaskComplete?.(task.id, outputBlob.size, outputBlob);
			this.config.onLog?.(
				`[队列] 任务完成: ${task.presetName} (${(outputBlob.size / 1024).toFixed(2)} KB)`,
				"success",
			);
		} catch (error) {
			// 任务失败
			const taskError = parseFFmpegError(error);

			// 如果是中止错误，使用 onTaskAbort 回调
			if (taskError.originalError === "TASK_ABORTED") {
				this.config.onTaskAbort?.(task.id);
				this.config.onLog?.(`[队列] 任务已中止: ${task.presetName}`, "warning");
			} else {
				this.config.onTaskFail?.(task.id, taskError);
				// 显示简化错误和原始错误
				this.config.onLog?.(
					`[队列] 任务失败: ${task.presetName} - ${taskError.message}`,
					"error",
				);
				if (taskError.originalError) {
					this.config.onLog?.(
						`[队列] 原始错误: ${taskError.originalError}`,
						"error",
					);
				}
			}
		} finally {
			this.executingTasks.delete(task.id);
			this.executingServices.delete(task.id); // 移除服务实例记录
			// 归还实例
			this.provider.release(service);
		}
	}

	/**
	 * 休眠指定毫秒数
	 */
	private sleep(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	/**
	 * 检查是否正在处理
	 */
	isRunning(): boolean {
		return this.isProcessing;
	}
}
