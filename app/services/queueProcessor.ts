import type { Task } from "../types/task";
import {
	detectUnsupportedOptions,
	parseFFmpegError,
	validateAndSanitizeFilenames,
} from "../utils/errorHandling";
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
	private ffmpegService: FFmpegService;
	private config: QueueProcessorConfig;
	private queue: Task[] = [];
	private executingTasks: Set<string> = new Set();
	private isProcessing = false;
	private shouldStop = false;

	constructor(ffmpegService: FFmpegService, config: QueueProcessorConfig) {
		this.ffmpegService = ffmpegService;
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
	 * 停止处理队列
	 */
	stop(): void {
		this.shouldStop = true;
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

			// 从 formValues 中提取文件
			for (const [key, value] of Object.entries(task.formValues)) {
				if (value instanceof File) {
					const sanitized = validateAndSanitizeFilenames([value])[0];
					if (sanitized.warnings.length > 0) {
						this.config.onLog?.(
							`[警告] ${sanitized.warnings.join(", ")}`,
							"warning",
						);
					}
					inputFilesList.push({ file: value, name: sanitized.sanitized });
				} else if (Array.isArray(value)) {
					const files = value.filter((v) => v instanceof File) as File[];
					const sanitized = validateAndSanitizeFilenames(files);
					for (const item of sanitized) {
						if (item.warnings.length > 0) {
							this.config.onLog?.(
								`[警告] ${item.warnings.join(", ")}`,
								"warning",
							);
						}
						inputFilesList.push({
							file: item.original,
							name: item.sanitized,
						});
					}
				}
			}

			// 执行 FFmpeg 命令
			const outputBlob = await this.ffmpegService.executeCommand({
				inputFiles: inputFilesList,
				outputFileName: task.outputFileName,
				ffmpegArgs: task.ffmpegArgs,
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
			this.config.onTaskFail?.(task.id, taskError);
			this.config.onLog?.(
				`[队列] 任务失败: ${task.presetName} - ${taskError.message}`,
				"error",
			);
		} finally {
			this.executingTasks.delete(task.id);
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
