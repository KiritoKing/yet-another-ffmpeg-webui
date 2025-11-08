import Dexie, { type EntityTable } from "dexie";
import type { BatchTask, Task } from "../types/task";

/**
 * FFmpeg Task Database
 * 使用 Dexie.js 管理 IndexedDB 中的任务历史记录
 */
class TaskDatabase extends Dexie {
	// 声明表类型
	tasks!: EntityTable<Task, "id">;
	batchTasks!: EntityTable<BatchTask, "id">;

	constructor() {
		super("FFmpegTaskDatabase");

		// 定义数据库版本和表结构
		this.version(1).stores({
			tasks:
				"id, presetId, status, createdAt, startedAt, completedAt, presetName",
			batchTasks: "id, createdAt, completedAt, status",
		});
	}

	/**
	 * 清理旧任务（保留最近 N 天的记录）
	 */
	async cleanupOldTasks(daysToKeep = 30): Promise<number> {
		const cutoffDate = Date.now() - daysToKeep * 24 * 60 * 60 * 1000;

		const deletedTasks = await this.tasks
			.where("createdAt")
			.below(cutoffDate)
			.delete();

		const deletedBatches = await this.batchTasks
			.where("createdAt")
			.below(cutoffDate)
			.delete();

		return deletedTasks + deletedBatches;
	}

	/**
	 * 获取任务统计信息
	 */
	async getStatistics() {
		const allTasks = await this.tasks.toArray();

		const completed = allTasks.filter((t) => t.status === "completed");
		const failed = allTasks.filter((t) => t.status === "failed");
		const aborted = allTasks.filter((t) => t.status === "aborted");

		const totalExecutionTime = completed.reduce(
			(sum, t) => sum + (t.executionTimeMs || 0),
			0,
		);
		const averageExecutionTimeMs =
			completed.length > 0 ? totalExecutionTime / completed.length : 0;

		const totalProcessedSize = completed.reduce((sum, t) => {
			const inputSize = t.inputFiles.reduce(
				(s, f) => s + f.size / (1024 * 1024),
				0,
			);
			return sum + inputSize;
		}, 0);

		return {
			total: allTasks.length,
			completed: completed.length,
			failed: failed.length,
			aborted: aborted.length,
			averageExecutionTimeMs,
			totalProcessedSizeMB: totalProcessedSize,
		};
	}

	/**
	 * 搜索任务
	 */
	async searchTasks(options: {
		presetId?: string;
		status?: string;
		startDate?: number;
		endDate?: number;
		limit?: number;
	}): Promise<Task[]> {
		let query = this.tasks.orderBy("createdAt").reverse();

		if (options.presetId) {
			query = query.filter((t) => t.presetId === options.presetId);
		}

		if (options.status) {
			query = query.filter((t) => t.status === options.status);
		}

		if (options.startDate !== undefined) {
			const startDate = options.startDate;
			query = query.filter((t) => t.createdAt >= startDate);
		}

		if (options.endDate !== undefined) {
			const endDate = options.endDate;
			query = query.filter((t) => t.createdAt <= endDate);
		}

		if (options.limit) {
			query = query.limit(options.limit);
		}

		return query.toArray();
	}
}

// 导出单例实例
export const taskDB = new TaskDatabase();
