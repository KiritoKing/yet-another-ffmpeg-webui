import {
	AudioLines,
	Copy,
	Crop,
	DownloadIcon,
	FileVideo,
	PencilIcon,
	Repeat2,
	ScissorsIcon,
	Share2,
	TrashIcon,
	Video,
	Wand2,
} from "lucide-react";
import { useMemo, useState } from "react";
import type { CommandPreset } from "../types/command";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "./ui/accordion";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "./ui/alert-dialog";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";

interface CommandListProps {
	presets: CommandPreset[];
	categoryOrder: string[];
	selectedId?: string;
	onSelect: (preset: CommandPreset) => void;
	onEdit: (preset: CommandPreset) => void;
	onDelete: (preset: CommandPreset) => void;
	onExport: (preset: CommandPreset) => void;
	selectedCategories: Set<string>;
	searchQuery?: string;
}

// 根据分类返回对应的图标
function getCategoryIcon(category: string) {
	const iconClass = "h-4 w-4 shrink-0";
	switch (category) {
		case "格式转换":
			return <Repeat2 className={iconClass} />;
		case "视频处理":
			return <Video className={iconClass} />;
		case "音频处理":
			return <AudioLines className={iconClass} />;
		case "基础操作":
			return <Copy className={iconClass} />;
		default:
			return <FileVideo className={iconClass} />;
	}
}

// 根据命令名称返回更具体的图标
function getCommandIcon(name: string) {
	const iconClass = "h-4 w-4 mr-3 text-muted-foreground";
	if (name.includes("GIF")) return <Share2 className={iconClass} />;
	if (name.includes("裁剪") || name.includes("片段"))
		return <ScissorsIcon className={iconClass} />;
	if (name.includes("分辨率") || name.includes("缩放"))
		return <Crop className={iconClass} />;
	if (name.includes("音频")) return <AudioLines className={iconClass} />;
	if (name.includes("压缩") || name.includes("编辑"))
		return <Wand2 className={iconClass} />;
	return <FileVideo className={iconClass} />;
}

export function CommandList({
	presets,
	categoryOrder,
	selectedId,
	onSelect,
	onEdit,
	onDelete,
	onExport,
	selectedCategories,
	searchQuery = "",
}: CommandListProps) {
	// 筛选后的预设（按分类和搜索关键词）
	const filteredPresets = useMemo(() => {
		return presets.filter((p) => {
			const categoryMatch = selectedCategories.has(p.category || "未分类");
			const searchMatch =
				!searchQuery ||
				p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				p.description?.toLowerCase().includes(searchQuery.toLowerCase());
			return categoryMatch && searchMatch;
		});
	}, [presets, selectedCategories, searchQuery]);

	// 待删除的预设
	const [presetToDelete, setPresetToDelete] = useState<CommandPreset | null>(
		null,
	);

	// 按分类分组
	const groupedPresets = filteredPresets.reduce(
		(acc, preset) => {
			const category = preset.category || "未分类";
			if (!acc[category]) {
				acc[category] = [];
			}
			acc[category].push(preset);
			return acc;
		},
		{} as Record<string, CommandPreset[]>,
	);

	const categories = useMemo(() => {
		const categoryKeys = Object.keys(groupedPresets);
		if (categoryKeys.length === 0) return categoryKeys;
		if (!categoryOrder || categoryOrder.length === 0) {
			return categoryKeys.sort();
		}
		const normalizedOrder = categoryOrder.filter((category) =>
			categoryKeys.includes(category),
		);
		const remaining = categoryKeys.filter(
			(category) => !normalizedOrder.includes(category),
		);
		return [...normalizedOrder, ...remaining.sort()];
	}, [groupedPresets, categoryOrder]);

	// 默认展开所有分类
	const defaultOpenCategories = categories;

	return (
		<>
			<ScrollArea className="h-full">
				<div className="space-y-2 pr-3">
					{categories.length > 0 ? (
						<Accordion
							type="multiple"
							defaultValue={defaultOpenCategories}
							className="space-y-2"
						>
							{categories.map((category) => (
								<AccordionItem
									key={category}
									value={category}
									className="border! rounded-lg px-2"
								>
									<AccordionTrigger className="text-sm font-semibold hover:no-underline py-3">
										<div className="flex items-center gap-2">
											{getCategoryIcon(category)}
											<span>{category}</span>
											<Badge variant="outline" className="ml-2 text-[10px] h-4">
												{groupedPresets[category].length}
											</Badge>
										</div>
									</AccordionTrigger>
									<AccordionContent>
										<div className="flex flex-col gap-1 pb-2">
											{groupedPresets[category].map((preset) => {
												const isSelected = selectedId === preset.id;
												const inputs =
													preset.formSchema?.filter(
														(f) => f.type === "file-input",
													) || [];
												const hasMultiple = inputs.some((f) => f.multiple);

												return (
													<div key={preset.id} className="group relative">
														<button
															type="button"
															className={`w-full flex items-center justify-between rounded-md transition-all text-left pr-2 ${
																isSelected
																	? "bg-primary/10 border-2 border-primary"
																	: "hover:bg-accent/50 border-2 border-transparent"
															}`}
															onClick={() => onSelect(preset)}
														>
															{/* 主内容区 */}
															<div className="flex items-start gap-2 flex-1 min-w-0 p-3 pr-0">
																{getCommandIcon(preset.name)}
																<div className="flex flex-col items-start flex-1 min-w-0">
																	<div className="flex items-center gap-2 w-full">
																		<span className="font-medium text-sm truncate">
																			{preset.name}
																		</span>
																		{hasMultiple && (
																			<Badge
																				variant="secondary"
																				className="text-[9px] h-4 px-1.5 shrink-0"
																			>
																				批量
																			</Badge>
																		)}
																	</div>
																	{preset.description && (
																		<span className="text-xs text-muted-foreground mt-1 line-clamp-2 text-left pr-24">
																			{preset.description}
																		</span>
																	)}
																</div>
															</div>

															{/* 操作按钮区 - 绝对定位在右侧 */}
															<div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-background/95 backdrop-blur-sm rounded-md p-1 shadow-sm">
																<Button
																	variant="ghost"
																	size="icon"
																	className="h-7 w-7 hover:bg-primary/10 hover:text-primary"
																	onClick={(e) => {
																		e.stopPropagation();
																		onEdit(preset);
																	}}
																	title="编辑"
																>
																	<PencilIcon className="h-3.5 w-3.5" />
																</Button>
																<Button
																	variant="ghost"
																	size="icon"
																	className="h-7 w-7 hover:bg-blue-500/10 hover:text-blue-600 dark:hover:text-blue-400"
																	onClick={(e) => {
																		e.stopPropagation();
																		onExport(preset);
																	}}
																	title="导出"
																>
																	<DownloadIcon className="h-3.5 w-3.5" />
																</Button>
																<Button
																	variant="ghost"
																	size="icon"
																	className="h-7 w-7 hover:bg-destructive/10 hover:text-destructive"
																	onClick={(e) => {
																		e.stopPropagation();
																		setPresetToDelete(preset);
																	}}
																	title="删除"
																>
																	<TrashIcon className="h-3.5 w-3.5" />
																</Button>
															</div>
														</button>
													</div>
												);
											})}
										</div>
									</AccordionContent>
								</AccordionItem>
							))}
						</Accordion>
					) : (
						<div className="p-12 text-center text-muted-foreground border border-dashed rounded-lg">
							<FileVideo className="size-12 mx-auto mb-4 opacity-20" />
							<p className="text-sm font-medium">
								{presets.length === 0
									? "暂无命令预设"
									: "没有符合筛选条件的命令"}
							</p>
							<p className="text-xs mt-1">
								{presets.length === 0
									? '点击"新建命令"创建第一个预设'
									: "尝试选择其他分类或修改搜索关键词"}
							</p>
						</div>
					)}
				</div>
			</ScrollArea>

			{/* 删除确认对话框 */}
			<AlertDialog
				open={!!presetToDelete}
				onOpenChange={(open) => !open && setPresetToDelete(null)}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>确认删除</AlertDialogTitle>
						<AlertDialogDescription>
							确定要删除命令预设 "{presetToDelete?.name}" 吗？此操作无法撤销。
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>取消</AlertDialogCancel>
						<AlertDialogAction
							onClick={() => {
								if (presetToDelete) {
									onDelete(presetToDelete);
									setPresetToDelete(null);
								}
							}}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
						>
							删除
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}
