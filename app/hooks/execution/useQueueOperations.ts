import { useTaskStore } from "../../store/task";

/**
 * Hook for queue state and operations
 * Provides direct access to queue-related functionality
 */
export function useQueueOperations() {
	// Get queue state
	const queue = useTaskStore((state) => state.queue);
	const executingTasks = useTaskStore((state) => state.executingTasks);
	const recentCompletedTasks = useTaskStore(
		(state) => state.recentCompletedTasks,
	);
	const isProcessingQueue = useTaskStore((state) => state.isProcessingQueue);
	const isStartingQueue = useTaskStore((state) => state.isStartingQueue);
	const batchSize = useTaskStore((state) => state.queueConfig.batchSize);
	const initialQueueSize = useTaskStore((state) => state.initialQueueSize);

	// Get queue operations
	const removeFromQueue = useTaskStore((state) => state.removeFromQueue);
	const clearQueue = useTaskStore((state) => state.clearQueue);
	const setQueueConfig = useTaskStore((state) => state.setQueueConfig);

	// Get task result operations
	const getTaskResult = useTaskStore((state) => state.getTaskResult);

	// Helper: Download task result
	const downloadTaskResult = (taskId: string) => {
		const blobUrl = getTaskResult(taskId);
		if (blobUrl) {
			const task = recentCompletedTasks.find((t) => t.id === taskId);
			if (task) {
				const a = document.createElement("a");
				a.href = blobUrl;
				a.download = task.outputFileName;
				document.body.appendChild(a);
				a.click();
				document.body.removeChild(a);
			}
		}
	};

	// Helper: Set batch size
	const setBatchSize = (size: number) => {
		setQueueConfig({ batchSize: size });
	};

	return {
		// State
		queue,
		executingTasks,
		completedTasks: recentCompletedTasks,
		isProcessingQueue,
		isStartingQueue,
		batchSize,
		initialQueueSize,

		// Operations
		removeFromQueue,
		clearQueue,
		setBatchSize,
		getTaskResultUrl: getTaskResult,
		downloadTaskResult,
	};
}
