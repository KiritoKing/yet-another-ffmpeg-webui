import { useVirtualizer } from "@tanstack/react-virtual";
import { useDebounceFn } from "ahooks";
import {
	ChevronDownIcon,
	ChevronUpIcon,
	CopyIcon,
	SearchIcon,
	Trash2Icon,
	XIcon,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useLogStore } from "../store/log";
import type { LogEntry } from "../types/log";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "./ui/collapsible";
import { Input } from "./ui/input";

export function ProgressLogViewer() {
	const [isExpanded, setIsExpanded] = useState(false);
	const [searchInput, setSearchInput] = useState(""); // 用户输入
	const [searchQuery, setSearchQuery] = useState(""); // 实际搜索关键词（防抖后）
	const [selectedType, setSelectedType] = useState<LogEntry["type"] | null>(
		null,
	); // 选中的日志类型
	const [autoScroll, setAutoScroll] = useState(true); // 是否自动滚动到底部
	const logs = useLogStore((state) => state.logs);
	const clearLogs = useLogStore((state) => state.clearLogs);

	// 虚拟滚动的父容器引用
	const parentRef = useRef<HTMLDivElement>(null);

	// 跟踪上一次的错误数量，只在新错误出现时自动展开
	const prevErrorCountRef = useRef(0);
	const prevLogsLengthRef = useRef(0);

	// 防抖处理搜索
	const { run: debouncedSearch } = useDebounceFn(
		(value: string) => {
			setSearchQuery(value);
		},
		{ wait: 300 },
	);

	// 处理搜索输入变化
	const handleSearchChange = (value: string) => {
		setSearchInput(value);
		debouncedSearch(value);
	};

	// 过滤日志
	const filteredLogs = useMemo(() => {
		let result = logs;

		// 按类型筛选
		if (selectedType) {
			result = result.filter((log) => log.type === selectedType);
		}

		// 按搜索关键词筛选
		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase();
			result = result.filter((log) => {
				return (
					log.message.toLowerCase().includes(query) ||
					log.type.toLowerCase().includes(query) ||
					log.instanceId?.toLowerCase().includes(query)
				);
			});
		}

		return result;
	}, [logs, searchQuery, selectedType]);

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

	// 配置虚拟滚动器
	const virtualizer = useVirtualizer({
		count: filteredLogs.length,
		getScrollElement: () => parentRef.current,
		estimateSize: () => 48, // 每条日志大约 48px 高度
		overscan: 10, // 预渲染前后各10条
	});

	// 监听滚动事件，检测用户是否手动滚动
	useEffect(() => {
		const scrollElement = parentRef.current;
		if (!scrollElement || !isExpanded) return;

		const handleScroll = () => {
			const { scrollTop, scrollHeight, clientHeight } = scrollElement;
			// 当距离底部小于 50px 时认为在底部
			const isAtBottom = Math.abs(scrollHeight - clientHeight - scrollTop) < 50;
			setAutoScroll(isAtBottom);
		};

		scrollElement.addEventListener("scroll", handleScroll);
		return () => scrollElement.removeEventListener("scroll", handleScroll);
	}, [isExpanded]);

	// 当日志展开时，初始化为自动滚动到底部
	// biome-ignore lint/correctness/useExhaustiveDependencies: 只在展开时执行一次
	useEffect(() => {
		if (isExpanded && filteredLogs.length > 0) {
			setAutoScroll(true);
			const scrollElement = parentRef.current;
			if (scrollElement) {
				requestAnimationFrame(() => {
					scrollElement.scrollTo({
						top: scrollElement.scrollHeight,
						behavior: "instant",
					});
				});
			}
		}
	}, [isExpanded]);

	// 当日志更新且 autoScroll 为 true 时，自动滚动到底部
	useEffect(() => {
		// 有筛选条件时不自动滚动
		const hasFilter = searchQuery.trim() !== "" || selectedType !== null;
		if (!isExpanded || !autoScroll || filteredLogs.length === 0 || hasFilter)
			return;

		const scrollElement = parentRef.current;
		if (!scrollElement) return;

		// 检查是否有新日志
		const hasNewLogs = filteredLogs.length > prevLogsLengthRef.current;
		prevLogsLengthRef.current = filteredLogs.length;

		if (hasNewLogs) {
			// 延迟滚动，确保虚拟滚动器已更新
			requestAnimationFrame(() => {
				scrollElement.scrollTo({
					top: scrollElement.scrollHeight,
					behavior: "smooth",
				});
			});
		}
	}, [filteredLogs.length, isExpanded, autoScroll, searchQuery, selectedType]);

	// 清空日志
	const handleClearLogs = () => {
		clearLogs();
		setSearchInput("");
		setSearchQuery("");
		setSelectedType(null);
		toast.success("日志已清空");
	};

	// 切换类型筛选
	const handleToggleType = (type: LogEntry["type"]) => {
		setSelectedType((prev) => (prev === type ? null : type));
	};

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
				const instance = log.instanceId ? `[${log.instanceId}] ` : "";
				return `[${time}] ${type} ${instance}${log.message}`;
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
		<div className="space-y-3">
			{/* 日志区域（可展开） */}
			{logs.length > 0 && (
				<Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
					<div className="p-4 rounded-lg border bg-card space-y-3">
						{/* 日志统计和操作栏 */}
						<div className="flex items-center justify-between gap-3 flex-wrap">
							<div className="flex gap-2 flex-wrap">
								<Badge
									variant="secondary"
									className={`gap-1.5 cursor-pointer transition-all hover:opacity-80 min-h-11 lg:min-h-0 px-3 lg:px-2 ${
										selectedType === null ? "ring-2 ring-primary" : ""
									}`}
									onClick={() => setSelectedType(null)}
								>
									<div className="size-2 rounded-full bg-primary" />
									<span>全部 {logs.length}</span>
									{(searchQuery || selectedType) &&
										filteredLogs.length !== logs.length && (
											<span className="text-muted-foreground">
												/ {filteredLogs.length}
											</span>
										)}
								</Badge>
								{errorLogs.length > 0 && (
									<Badge
										variant="destructive"
										className={`gap-1.5 cursor-pointer transition-all hover:opacity-80 min-h-11 lg:min-h-0 px-3 lg:px-2 ${
											selectedType === "error" ? "ring-2 ring-destructive" : ""
										}`}
										onClick={() => handleToggleType("error")}
									>
										<div className="size-2 rounded-full bg-destructive-foreground" />
										<span>错误 {errorLogs.length}</span>
									</Badge>
								)}
								{warningLogs.length > 0 && (
									<Badge
										variant="outline"
										className={`gap-1.5 border-yellow-500 text-yellow-700 cursor-pointer transition-all hover:opacity-80 min-h-11 lg:min-h-0 px-3 lg:px-2 ${
											selectedType === "warning" ? "ring-2 ring-yellow-500" : ""
										}`}
										onClick={() => handleToggleType("warning")}
									>
										<div className="size-2 rounded-full bg-yellow-500" />
										<span>警告 {warningLogs.length}</span>
									</Badge>
								)}
							</div>

							<div className="flex items-center gap-1">
								<Button
									variant="ghost"
									size="sm"
									onClick={handleCopyLogs}
									title="复制所有日志"
									className="h-11 w-11 lg:h-8 lg:w-auto lg:px-2 p-0 touch-manipulation"
								>
									<CopyIcon className="size-4" />
								</Button>
								<Button
									variant="ghost"
									size="sm"
									onClick={handleClearLogs}
									title="清空日志"
									className="h-11 w-11 lg:h-8 lg:w-auto lg:px-2 p-0 touch-manipulation"
								>
									<Trash2Icon className="size-4" />
								</Button>
								<CollapsibleTrigger asChild>
									<Button
										variant="ghost"
										size="sm"
										className="h-11 w-11 lg:h-8 lg:w-auto lg:px-2 p-0 touch-manipulation"
									>
										{isExpanded ? (
											<ChevronUpIcon className="size-4" />
										) : (
											<ChevronDownIcon className="size-4" />
										)}
									</Button>
								</CollapsibleTrigger>
							</div>
						</div>

						{/* 搜索框 */}
						<div className="relative">
							<SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
							<Input
								type="text"
								placeholder="搜索日志内容、类型或实例ID..."
								value={searchInput}
								onChange={(e) => handleSearchChange(e.target.value)}
								className="pl-9 pr-9 h-11 lg:h-9 text-base"
							/>
							{searchInput && (
								<Button
									variant="ghost"
									size="sm"
									onClick={() => {
										setSearchInput("");
										setSearchQuery("");
									}}
									className="absolute right-1 top-1/2 -translate-y-1/2 h-9 w-9 lg:h-7 lg:w-7 p-0 touch-manipulation"
								>
									<XIcon className="size-4" />
								</Button>
							)}
						</div>

						{/* 日志详情（可展开） */}
						<CollapsibleContent>
							<div
								ref={parentRef}
								className="h-80 rounded-md border bg-muted/30 overflow-auto"
							>
								{filteredLogs.length === 0 ? (
									<p className="text-sm text-muted-foreground text-center py-8">
										{searchQuery || selectedType
											? "未找到匹配的日志"
											: "暂无日志"}
									</p>
								) : (
									<div
										style={{
											height: `${virtualizer.getTotalSize()}px`,
											width: "100%",
											position: "relative",
										}}
									>
										{virtualizer.getVirtualItems().map((virtualItem) => {
											const log = filteredLogs[virtualItem.index];
											return (
												<div
													key={virtualItem.key}
													style={{
														position: "absolute",
														top: 0,
														left: 0,
														width: "100%",
														height: `${virtualItem.size}px`,
														transform: `translateY(${virtualItem.start}px)`,
													}}
													className={`flex items-start gap-2 p-2 rounded font-mono text-sm lg:text-xs ${
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
														{new Date(log.timestamp).toLocaleTimeString(
															"zh-CN",
															{
																hour: "2-digit",
																minute: "2-digit",
																second: "2-digit",
															},
														)}
													</span>
													{log.instanceId && (
														<span className="text-primary select-none shrink-0 font-semibold">
															[{log.instanceId}]
														</span>
													)}
													<span className="break-all">{log.message}</span>
												</div>
											);
										})}
									</div>
								)}
							</div>
						</CollapsibleContent>
					</div>
				</Collapsible>
			)}
		</div>
	);
}
