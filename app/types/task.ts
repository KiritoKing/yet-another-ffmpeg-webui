/**
 * 任务状态枚举
 */
export type TaskStatus =
	| "pending" // 等待中
	| "running" // 执行中
	| "completed" // 已完成
	| "failed" // 失败
	| "aborted"; // 已中止

/**
 * 错误类型枚举
 */
export type ErrorType =
	| "recoverable" // 可恢复错误（如文件大小超限）
	| "non-recoverable" // 不可恢复错误（如 FFmpeg 崩溃）
	| "user-aborted"; // 用户主动中止

/**
 * 任务错误信息
 */
export interface TaskError {
	type: ErrorType;
	message: string;
	originalError?: string;
	recoverySuggestions?: string[]; // 恢复建议
	timestamp: number;
}

/**
 * 单个任务定义
 */
export interface Task {
	id: string; // 唯一标识
	presetId: string; // 使用的命令预设 ID
	presetName: string; // 命令预设名称（冗余存储，便于显示）
	status: TaskStatus;
	progress: number; // 0-1
	createdAt: number;
	startedAt?: number;
	completedAt?: number;

	// 输入信息
	inputFiles: Array<{
		name: string;
		size: number;
		type: string;
	}>;

	// 输出信息
	outputFileName: string;
	outputSize?: number;
	outputBlobUrl?: string; // 仅在内存中保存（不持久化到 IndexedDB）

	// 执行信息
	ffmpegArgs: string[]; // 实际执行的命令参数
	formValues: Record<string, unknown>; // 表单值（排除 File 对象）

	// 临时文件对象（仅用于传递，不持久化）
	_files?: Record<string, File | File[]>;

	// 错误信息
	error?: TaskError;

	// 性能信息
	executionTimeMs?: number;
	estimatedMemoryMB?: number;
}

/**
 * 批处理任务组
 */
export interface BatchTask {
	id: string;
	name: string; // 批次名称
	createdAt: number;
	completedAt?: number;
	tasks: Task[];
	batchSize: number; // 同时处理的任务数量
	status: TaskStatus;
	totalProgress: number; // 总体进度 0-1
}

/**
 * 队列配置
 */
export interface QueueConfig {
	batchSize: number; // 同时执行的任务数量，默认 1
	autoStart: boolean; // 自动开始处理队列，默认 true
	maxRetries: number; // 失败后最大重试次数，默认 0
}

/**
 * 任务统计信息
 */
export interface TaskStatistics {
	total: number;
	completed: number;
	failed: number;
	aborted: number;
	averageExecutionTimeMs: number;
	totalProcessedSizeMB: number;
}
