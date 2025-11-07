import { Calendar, Download, Filter, RefreshCw, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { taskDB } from "../services/taskDatabase";
import type { Task, TaskStatistics } from "../types/task";
import { formatErrorMessage } from "../utils";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { ScrollArea } from "./ui/scroll-area";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "./ui/select";
import { Separator } from "./ui/separator";

/**
 * 任务历史查看器组件
 * 显示已完成的任务历史记录，支持筛选、搜索和下载
 */
export function TaskHistoryViewer() {
	const [tasks, setTasks] = useState<Task[]>([]);
	const [statistics, setStatistics] = useState<TaskStatistics | null>(null);
	const [loading, setLoading] = useState(true);
	const [statusFilter, setStatusFilter] = useState<string>("all");
	const [dateFilter, setDateFilter] = useState<string>("all");

	// 加载任务历史
	const loadTasks = async () => {
		try {
			setLoading(true);

			// 计算日期过滤器
			let startDate: number | undefined;
			const now = Date.now();

			switch (dateFilter) {
				case "today":
					startDate = now - 24 * 60 * 60 * 1000;
					break;
				case "week":
					startDate = now - 7 * 24 * 60 * 60 * 1000;
					break;
				case "month":
					startDate = now - 30 * 24 * 60 * 60 * 1000;
					break;
			}

			// 搜索任务
			const results = await taskDB.searchTasks({
				status: statusFilter === "all" ? undefined : statusFilter,
				startDate,
				limit: 100, // 最多显示 100 条
			});

			setTasks(results);

			// 加载统计信息
			const stats = await taskDB.getStatistics();
			setStatistics(stats);
		} catch (error) {
			console.error("加载任务历史失败:", error);
			toast.error("加载任务历史失败");
		} finally {
			setLoading(false);
		}
	};

	// 初始加载
	// biome-ignore lint/correctness/useExhaustiveDependencies: loadTasks includes statusFilter and dateFilter in its logic
	useEffect(() => {
		loadTasks();
	}, [statusFilter, dateFilter]);

	// 清理旧任务
	const handleCleanup = async () => {
		try {
			const deleted = await taskDB.cleanupOldTasks(30);
			toast.success(`已清理 ${deleted} 条旧记录`);
			await loadTasks();
		} catch (error) {
			toast.error("清理失败");
		}
	};

	// 删除单个任务
	const handleDeleteTask = async (taskId: string) => {
		try {
			await taskDB.tasks.delete(taskId);
			toast.success("已删除任务记录");
			await loadTasks();
		} catch (error) {
			toast.error("删除失败");
		}
	};

	// 格式化日期时间
	const formatDateTime = (timestamp: number) => {
		const date = new Date(timestamp);
		return date.toLocaleString("zh-CN", {
			month: "2-digit",
			day: "2-digit",
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	// 格式化文件大小
	const formatFileSize = (bytes?: number) => {
		if (!bytes) return "N/A";
		const mb = bytes / (1024 * 1024);
		if (mb < 1) {
			return `${(bytes / 1024).toFixed(2)} KB`;
		}
		return `${mb.toFixed(2)} MB`;
	};

	// 获取状态徽章样式
	const getStatusBadge = (status: Task["status"]) => {
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

		return <Badge className={styles[status]}>{labels[status]}</Badge>;
	};

	if (loading) {
		return (
			<Card className="p-6">
				<div className="flex items-center justify-center">
					<RefreshCw className="w-6 h-6 animate-spin" />
					<span className="ml-2">加载中...</span>
				</div>
			</Card>
		);
	}

	return (
		<Card className="p-6">
			{/* 标题和统计 */}
			<div className="space-y-4">
				<div className="flex items-center justify-between">
					<h2 className="text-2xl font-bold">任务历史</h2>
					<div className="flex gap-2">
						<Button variant="outline" size="sm" onClick={loadTasks}>
							<RefreshCw className="w-4 h-4 mr-2" />
							刷新
						</Button>
						<Button variant="outline" size="sm" onClick={handleCleanup}>
							<Trash2 className="w-4 h-4 mr-2" />
							清理旧记录
						</Button>
					</div>
				</div>

				{/* 统计信息 */}
				{statistics && (
					<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
						<div className="p-3 bg-gray-100 dark:bg-gray-800 rounded">
							<div className="text-sm text-gray-500">总任务数</div>
							<div className="text-2xl font-bold">{statistics.total}</div>
						</div>
						<div className="p-3 bg-green-100 dark:bg-green-900/20 rounded">
							<div className="text-sm text-gray-500">已完成</div>
							<div className="text-2xl font-bold text-green-600 dark:text-green-400">
								{statistics.completed}
							</div>
						</div>
						<div className="p-3 bg-red-100 dark:bg-red-900/20 rounded">
							<div className="text-sm text-gray-500">失败/中止</div>
							<div className="text-2xl font-bold text-red-600 dark:text-red-400">
								{statistics.failed + statistics.aborted}
							</div>
						</div>
						<div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded">
							<div className="text-sm text-gray-500">平均耗时</div>
							<div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
								{(statistics.averageExecutionTimeMs / 1000).toFixed(1)}s
							</div>
						</div>
					</div>
				)}

				{/* 筛选器 */}
				<div className="flex gap-4">
					<div className="flex items-center gap-2">
						<Filter className="w-4 h-4" />
						<span className="text-sm">状态:</span>
						<Select value={statusFilter} onValueChange={setStatusFilter}>
							<SelectTrigger className="w-32">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">全部</SelectItem>
								<SelectItem value="completed">已完成</SelectItem>
								<SelectItem value="failed">失败</SelectItem>
								<SelectItem value="aborted">已中止</SelectItem>
							</SelectContent>
						</Select>
					</div>

					<div className="flex items-center gap-2">
						<Calendar className="w-4 h-4" />
						<span className="text-sm">时间:</span>
						<Select value={dateFilter} onValueChange={setDateFilter}>
							<SelectTrigger className="w-32">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">全部</SelectItem>
								<SelectItem value="today">今天</SelectItem>
								<SelectItem value="week">最近一周</SelectItem>
								<SelectItem value="month">最近一月</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</div>

				<Separator />

				{/* 任务列表 */}
				<ScrollArea className="h-[500px]">
					{tasks.length === 0 ? (
						<div className="text-center py-12 text-gray-500">暂无任务记录</div>
					) : (
						<div className="space-y-3">
							{tasks.map((task) => (
								<Card key={task.id} className="p-4">
									<div className="space-y-2">
										{/* 任务头部 */}
										<div className="flex items-start justify-between">
											<div>
												<div className="flex items-center gap-2">
													<h3 className="font-semibold">{task.presetName}</h3>
													{getStatusBadge(task.status)}
												</div>
												<div className="text-sm text-gray-500">
													{formatDateTime(task.createdAt)}
												</div>
											</div>
											<Button
												variant="ghost"
												size="sm"
												onClick={() => handleDeleteTask(task.id)}
											>
												<Trash2 className="w-4 h-4" />
											</Button>
										</div>

										{/* 任务详情 */}
										<div className="grid grid-cols-2 gap-2 text-sm">
											<div>
												<span className="text-gray-500">输入:</span>{" "}
												{task.inputFiles.map((f) => f.name).join(", ")}
											</div>
											<div>
												<span className="text-gray-500">输出:</span>{" "}
												{task.outputFileName}
											</div>
											{task.executionTimeMs && (
												<div>
													<span className="text-gray-500">耗时:</span>{" "}
													{(task.executionTimeMs / 1000).toFixed(2)}s
												</div>
											)}
											{task.outputSize && (
												<div>
													<span className="text-gray-500">大小:</span>{" "}
													{formatFileSize(task.outputSize)}
												</div>
											)}
										</div>

										{/* 错误信息 */}
										{task.error && (
											<div className="p-2 bg-red-50 dark:bg-red-900/20 rounded text-sm">
												<div className="font-semibold text-red-600 dark:text-red-400">
													错误信息:
												</div>
												<div className="whitespace-pre-wrap text-red-700 dark:text-red-300">
													{formatErrorMessage(task.error)}
												</div>
											</div>
										)}

										{/* 命令 */}
										<details className="text-sm">
											<summary className="cursor-pointer text-gray-500 hover:text-gray-700">
												查看命令
											</summary>
											<div className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded font-mono text-xs overflow-x-auto">
												ffmpeg {task.ffmpegArgs.join(" ")}
											</div>
										</details>
									</div>
								</Card>
							))}
						</div>
					)}
				</ScrollArea>
			</div>
		</Card>
	);
}
