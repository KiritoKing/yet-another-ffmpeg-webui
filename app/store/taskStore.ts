import { create } from "zustand";
import { taskDB } from "../services/taskDatabase";
import type { QueueConfig, Task, TaskStatus } from "../types/task";

/**
 * 任务和队列状态管理
 * 管理当前执行的任务、队列和任务历史
 */
interface TaskState {
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
	setInitialQueueSize: (size: number) => void;

	// 任务结果管理
	setTaskResult: (taskId: string, blobUrl: string) => void;
	getTaskResult: (taskId: string) => string | undefined;
	clearTaskResult: (taskId: string) => void;
	clearAllTaskResults: () => void;

	// 持久化任务到 IndexedDB
	persistTask: (task: Task) => Promise<void>;
}

export const useTaskStore = create<TaskState>((set, get) => ({
	// 初始状态
	currentTask: null,
	queue: [],
	executingTasks: [],
	recentCompletedTasks: [],
	queueConfig: {
		batchSize: 1,
		autoStart: true,
		maxRetries: 0,
	},
	isProcessingQueue: false,
	initialQueueSize: 0,
	taskResults: new Map(),

	// Actions
	setCurrentTask: (task) => set({ currentTask: task }),

	updateCurrentTask: (updates) =>
		set((state) => ({
			currentTask: state.currentTask
				? { ...state.currentTask, ...updates }
				: null,
		})),

	clearCurrentTask: () => {
		const state = get();
		// 清理任务结果
		if (state.currentTask?.id) {
			const blobUrl = state.taskResults.get(state.currentTask.id);
			if (blobUrl) {
				URL.revokeObjectURL(blobUrl);
				state.taskResults.delete(state.currentTask.id);
			}
		}
		set({ currentTask: null });
	},

	addToQueue: (task) => {
		set((state) => ({
			queue: [...state.queue, task],
		}));
		// 立即持久化新创建的任务
		get().persistTask(task);
	},

	addMultipleToQueue: (tasks) => {
		set((state) => ({
			queue: [...state.queue, ...tasks],
		}));
		// 批量持久化所有新任务
		for (const task of tasks) {
			get().persistTask(task);
		}
	},

	removeFromQueue: (taskId) =>
		set((state) => ({
			queue: state.queue.filter((t) => t.id !== taskId),
		})),

	clearQueue: () => set({ queue: [] }),

	setQueueConfig: (config) =>
		set((state) => ({
			queueConfig: { ...state.queueConfig, ...config },
		})),

	startTask: (taskId) => {
		const now = Date.now();
		let updatedTask: Task | null = null;

		set((state) => {
			// 更新当前任务
			if (state.currentTask?.id === taskId) {
				updatedTask = {
					...state.currentTask,
					status: "running" as TaskStatus,
					startedAt: now,
				};
				return { currentTask: updatedTask };
			}

			// 更新执行中任务列表
			const updatedExecutingTasks = state.executingTasks.map((t) => {
				if (t.id === taskId) {
					updatedTask = {
						...t,
						status: "running" as TaskStatus,
						startedAt: now,
					};
					return updatedTask;
				}
				return t;
			});

			// 更新队列中的任务
			const updatedQueue = state.queue.map((t) => {
				if (t.id === taskId) {
					updatedTask = {
						...t,
						status: "running" as TaskStatus,
						startedAt: now,
					};
					return updatedTask;
				}
				return t;
			});

			return {
				queue: updatedQueue,
				executingTasks: updatedExecutingTasks,
			};
		});

		// 持久化状态更新
		if (updatedTask) {
			get().persistTask(updatedTask);
		}
	},

	completeTask: (taskId, outputSize, outputBlobUrl) => {
		const now = Date.now();
		set((state) => {
			const task =
				state.currentTask?.id === taskId
					? state.currentTask
					: state.executingTasks.find((t) => t.id === taskId);

			if (!task) return state;

			const executionTimeMs = task.startedAt ? now - task.startedAt : undefined;

			const completedTask: Task = {
				...task,
				status: "completed",
				progress: 1,
				completedAt: now,
				outputSize,
				executionTimeMs,
			};

			// 持久化到 IndexedDB
			get().persistTask(completedTask);

			// 保存结果到内存
			if (outputBlobUrl) {
				state.taskResults.set(taskId, outputBlobUrl);
			}

			// 添加到最近完成列表（限制最多20个）
			const recentCompleted = [
				completedTask,
				...state.recentCompletedTasks,
			].slice(0, 20);

			// 更新状态
			if (state.currentTask?.id === taskId) {
				return {
					currentTask: completedTask,
					recentCompletedTasks: recentCompleted,
				};
			}

			return {
				executingTasks: state.executingTasks.filter((t) => t.id !== taskId),
				recentCompletedTasks: recentCompleted,
			};
		});
	},

	failTask: (taskId, error) => {
		const now = Date.now();
		set((state) => {
			const task =
				state.currentTask?.id === taskId
					? state.currentTask
					: state.executingTasks.find((t) => t.id === taskId);

			if (!task) return state;

			const executionTimeMs = task.startedAt ? now - task.startedAt : undefined;

			const failedTask: Task = {
				...task,
				status: "failed",
				completedAt: now,
				executionTimeMs,
				error,
			};

			// 持久化到 IndexedDB
			get().persistTask(failedTask);

			// 更新状态
			if (state.currentTask?.id === taskId) {
				return { currentTask: failedTask };
			}

			return {
				executingTasks: state.executingTasks.filter((t) => t.id !== taskId),
			};
		});
	},

	abortTask: (taskId) => {
		const now = Date.now();
		set((state) => {
			const task =
				state.currentTask?.id === taskId
					? state.currentTask
					: state.executingTasks.find((t) => t.id === taskId);

			if (!task) return state;

			const executionTimeMs = task.startedAt ? now - task.startedAt : undefined;

			const abortedTask: Task = {
				...task,
				status: "aborted",
				completedAt: now,
				executionTimeMs,
				error: {
					type: "user-aborted",
					message: "用户主动中止任务",
					timestamp: now,
				},
			};

			// 持久化到 IndexedDB
			get().persistTask(abortedTask);

			// 更新状态
			if (state.currentTask?.id === taskId) {
				return { currentTask: abortedTask };
			}

			return {
				executingTasks: state.executingTasks.filter((t) => t.id !== taskId),
			};
		});
	},

	addExecutingTask: (task) =>
		set((state) => ({
			executingTasks: [...state.executingTasks, task],
		})),

	removeExecutingTask: (taskId) =>
		set((state) => ({
			executingTasks: state.executingTasks.filter((t) => t.id !== taskId),
		})),

	updateExecutingTask: (taskId, updates) =>
		set((state) => ({
			executingTasks: state.executingTasks.map((t) =>
				t.id === taskId ? { ...t, ...updates } : t,
			),
		})),

	setProcessingQueue: (isProcessing) =>
		set({
			isProcessingQueue: isProcessing,
			// 如果开始处理，重置初始队列大小；结束时保持不变
			initialQueueSize: isProcessing ? get().queue.length : 0,
		}),

	setInitialQueueSize: (size) => set({ initialQueueSize: size }),

	// 任务结果管理
	setTaskResult: (taskId, blobUrl) => {
		get().taskResults.set(taskId, blobUrl);
	},

	getTaskResult: (taskId) => {
		return get().taskResults.get(taskId);
	},

	clearTaskResult: (taskId) => {
		const { taskResults } = get();
		const blobUrl = taskResults.get(taskId);
		if (blobUrl) {
			URL.revokeObjectURL(blobUrl);
			taskResults.delete(taskId);
		}
	},

	clearAllTaskResults: () => {
		const { taskResults } = get();
		// 释放所有 Blob URLs
		for (const url of taskResults.values()) {
			URL.revokeObjectURL(url);
		}
		taskResults.clear();
		set({ taskResults: new Map() });
	},

	// 持久化任务
	persistTask: async (task) => {
		try {
			// 创建一个副本，移除不需要持久化的字段（如 outputBlobUrl）
			const taskToPersist: Task = {
				...task,
				outputBlobUrl: undefined, // 不持久化 Blob URL
				formValues: task.formValues, // formValues 已经是序列化友好的
			};

			await taskDB.tasks.put(taskToPersist);
		} catch (error) {
			console.error("持久化任务失败:", error);
		}
	},
}));

// 监听页面卸载，清理所有 Blob URLs
if (typeof window !== "undefined") {
	window.addEventListener("beforeunload", () => {
		const { clearAllTaskResults } = useTaskStore.getState();
		clearAllTaskResults();
	});
}
