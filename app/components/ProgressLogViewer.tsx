import {
	ChevronDownIcon,
	ChevronUpIcon,
	CopyIcon,
	Loader2Icon,
	TrashIcon,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useLogStore } from "../store/logStore";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "./ui/collapsible";
import { Progress } from "./ui/progress";
import { ScrollArea } from "./ui/scroll-area";

interface ProgressLogViewerProps {
	progress: number;
	currentStep: string;
	isExecuting: boolean;
}

export function ProgressLogViewer({
	progress,
	currentStep,
	isExecuting,
}: ProgressLogViewerProps) {
	const [isExpanded, setIsExpanded] = useState(false);
	const logs = useLogStore((state) => state.logs);
	const clearLogs = useLogStore((state) => state.clearLogs);

	// 跟踪上一次的错误数量，只在新错误出现时自动展开
	const prevErrorCountRef = useRef(0);

	// 只显示最近的重要日志
	const recentLogs = logs.slice(-50);
	const errorLogs = logs.filter((log) => log.type === "error");
	const warningLogs = logs.filter((log) => log.type === "warning");

	// 当有新错误出现时自动展开日志面板（仅一次）
	useEffect(() => {
		const currentErrorCount = errorLogs.length;
		// 只在错误数量增加时自动展开
		if (
			currentErrorCount > prevErrorCountRef.current &&
			currentErrorCount > 0
		) {
			setIsExpanded(true);
		}
		prevErrorCountRef.current = currentErrorCount;
	}, [errorLogs.length]);

	// 复制所有日志
	const handleCopyLogs = async () => {
		if (logs.length === 0) {
			toast.warning("暂无日志可复制");
			return;
		}

		const logText = logs
			.map((log) => {
				const time = new Date(log.timestamp).toLocaleTimeString("zh-CN", {
					hour: "2-digit",
					minute: "2-digit",
					second: "2-digit",
				});
				const type = log.type.toUpperCase().padEnd(8);
				return `[${time}] ${type} ${log.message}`;
			})
			.join("\n");

		try {
			await navigator.clipboard.writeText(logText);
			toast.success(`已复制 ${logs.length} 条日志到剪贴板`);
		} catch {
			toast.error("复制失败");
		}
	};

	return (
		<Card>
			<CardHeader className="pb-4">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-3">
						<CardTitle className="text-lg">执行状态</CardTitle>
						{isExecuting && (
							<div className="flex items-center gap-2">
								<Loader2Icon className="size-4 animate-spin text-primary" />
								<span className="text-sm text-muted-foreground">处理中...</span>
							</div>
						)}
					</div>

					<div className="flex items-center gap-2">
						{logs.length > 0 && (
							<>
								<Button
									variant="ghost"
									size="sm"
									onClick={handleCopyLogs}
									title="复制所有日志"
								>
									<CopyIcon className="mr-1" />
									复制
								</Button>
								<Button variant="ghost" size="sm" onClick={clearLogs}>
									<TrashIcon className="mr-1" />
									清除
								</Button>
							</>
						)}
					</div>
				</div>
			</CardHeader>

			<CardContent className="space-y-4">
				{/* 进度条 */}
				<div>
					<div className="flex justify-between items-center mb-2">
						<span className="text-sm text-muted-foreground">{currentStep}</span>
						<span className="text-sm font-semibold">
							{(progress * 100).toFixed(1)}%
						</span>
					</div>
					<Progress value={progress * 100} className="h-2" />
				</div>

				{/* 统计信息 */}
				<div className="flex gap-3 flex-wrap">
					<Badge variant="secondary" className="gap-1.5">
						<div className="size-2 rounded-full bg-primary"></div>
						<span>日志: {logs.length}</span>
					</Badge>
					{errorLogs.length > 0 && (
						<Badge variant="destructive" className="gap-1.5">
							<div className="size-2 rounded-full bg-destructive-foreground"></div>
							<span>错误: {errorLogs.length}</span>
						</Badge>
					)}
					{warningLogs.length > 0 && (
						<Badge
							variant="outline"
							className="gap-1.5 border-yellow-500 text-yellow-700"
						>
							<div className="size-2 rounded-full bg-yellow-500"></div>
							<span>警告: {warningLogs.length}</span>
						</Badge>
					)}
				</div>

				{/* 详细日志 */}
				<Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
					<CollapsibleTrigger asChild>
						<Button variant="outline" size="sm" className="w-full">
							{isExpanded ? (
								<>
									<ChevronUpIcon className="mr-1" />
									收起详情
								</>
							) : (
								<>
									<ChevronDownIcon className="mr-1" />
									展开详情
								</>
							)}
						</Button>
					</CollapsibleTrigger>

					<CollapsibleContent className="mt-3">
						<ScrollArea className="h-96 rounded-md border bg-muted/30">
							{recentLogs.length === 0 ? (
								<p className="text-sm text-muted-foreground text-center py-8">
									暂无日志
								</p>
							) : (
								<div className="p-3 space-y-1 font-mono text-xs">
									{recentLogs.map((log) => (
										<div
											key={log.id}
											className={`flex items-start gap-2 p-2 rounded ${
												log.type === "error"
													? "bg-destructive/10 text-destructive"
													: log.type === "warning"
														? "bg-yellow-50 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200"
														: log.type === "success"
															? "bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-200"
															: "bg-background text-foreground"
											}`}
										>
											<span className="text-muted-foreground select-none shrink-0 tabular-nums">
												{new Date(log.timestamp).toLocaleTimeString("zh-CN", {
													hour: "2-digit",
													minute: "2-digit",
													second: "2-digit",
												})}
											</span>
											<span className="break-all">{log.message}</span>
										</div>
									))}
								</div>
							)}
						</ScrollArea>
					</CollapsibleContent>
				</Collapsible>
			</CardContent>
		</Card>
	);
}
