import type { QueueConfig, Task } from "../../types/task";

/**
 * Task Store State Interface
 * 管理任务队列和执行状态
 */
export interface TaskState {
	// 当前任务（正在执行或刚完成）
	currentTask: Task | null;

	// 任务队列（待执行的任务）
	queue: Task[];

	// 正在执行的任务列表（批处理时可能有多个）
	executingTasks: Task[];

	// 最近完成的任务（当前会话，不持久化）
	recentCompletedTasks: Task[];

	// 队列配置
	queueConfig: QueueConfig;

	// 是否正在处理队列
	isProcessingQueue: boolean;

	// 是否正在启动队列（准备阶段）
	isStartingQueue: boolean;

	// 队列初始大小，用于计算总体进度
	initialQueueSize: number;

	// 任务结果的内存缓存（Blob URLs）
	// 仅保存当前会话的结果，应用退出时释放
	taskResults: Map<string, string>; // taskId -> blobUrl

	// Actions
	setCurrentTask: (task: Task | null) => void;
	updateCurrentTask: (updates: Partial<Task>) => void;
	clearCurrentTask: () => void;

	addToQueue: (task: Task) => void;
	addMultipleToQueue: (tasks: Task[]) => void;
	removeFromQueue: (taskId: string) => void;
	clearQueue: () => void;

	setQueueConfig: (config: Partial<QueueConfig>) => void;

	startTask: (taskId: string) => void;
	completeTask: (
		taskId: string,
		outputSize: number,
		outputBlobUrl?: string,
	) => void;
	failTask: (taskId: string, error: Task["error"]) => void;
	abortTask: (taskId: string) => void;

	addExecutingTask: (task: Task) => void;
	removeExecutingTask: (taskId: string) => void;
	updateExecutingTask: (taskId: string, updates: Partial<Task>) => void;

	setProcessingQueue: (isProcessing: boolean) => void;
	setStartingQueue: (isStarting: boolean) => void;
	setInitialQueueSize: (size: number) => void;

	// 任务结果管理
	setTaskResult: (taskId: string, blobUrl: string) => void;
	getTaskResult: (taskId: string) => string | undefined;
	clearTaskResult: (taskId: string) => void;
	clearAllTaskResults: () => void;

	// 持久化任务到 IndexedDB
	persistTask: (task: Task) => Promise<void>;
}
