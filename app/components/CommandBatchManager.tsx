import type { Modifier } from "@dnd-kit/core";
import {
	DndContext,
	type DragEndEvent,
	DragOverlay,
	type DragStartEvent,
	KeyboardSensor,
	PointerSensor,
	pointerWithin,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import {
	arrayMove,
	SortableContext,
	sortableKeyboardCoordinates,
	useSortable,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
	CheckSquare,
	FolderEdit,
	GripVertical,
	Square,
	Trash2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { CommandPreset } from "../types/command";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { ScrollArea } from "./ui/scroll-area";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "./ui/select";

type GroupedPresets = Record<string, CommandPreset[]>;

interface GroupState {
	groupMap: GroupedPresets;
	orderedCategories: string[];
}

const normalizeCategory = (category?: string) => {
	const value = (category ?? "").trim();
	return value === "" ? "未分类" : value;
};

// 自定义 modifier：让 DragOverlay 的中心点跟随鼠标
const snapCenterToCursor: Modifier = ({
	activatorEvent,
	draggingNodeRect,
	transform,
}) => {
	if (draggingNodeRect && activatorEvent) {
		const activatorCoordinates = {
			x: (activatorEvent as MouseEvent).clientX,
			y: (activatorEvent as MouseEvent).clientY,
		};

		return {
			...transform,
			x:
				transform.x +
				activatorCoordinates.x -
				draggingNodeRect.left -
				draggingNodeRect.width / 2,
			y:
				transform.y +
				activatorCoordinates.y -
				draggingNodeRect.top -
				draggingNodeRect.height / 2,
		};
	}

	return transform;
};

const buildGroupMapFromPresets = (
	presets: CommandPreset[],
	categoryOrder: string[] = [],
): GroupedPresets => {
	const map: GroupedPresets = {};
	for (const category of categoryOrder.map(normalizeCategory)) {
		if (!map[category]) {
			map[category] = [];
		}
	}
	for (const preset of presets) {
		const category = normalizeCategory(preset.category);
		if (!map[category]) {
			map[category] = [];
		}
		map[category].push({ ...preset, category });
	}
	return map;
};

const computeOrderedCategories = (
	groupMap: GroupedPresets,
	baseOrder: string[] = [],
): string[] => {
	const normalizedBase = baseOrder.map(normalizeCategory);
	const seen = new Set<string>();
	const ordered: string[] = [];

	for (const category of normalizedBase) {
		if (category in groupMap && !seen.has(category)) {
			ordered.push(category);
			seen.add(category);
		}
	}

	for (const category of Object.keys(groupMap)) {
		if (!seen.has(category)) {
			ordered.push(category);
			seen.add(category);
		}
	}

	return ordered;
};

const createGroupState = (
	presets: CommandPreset[],
	categoryOrder: string[] = [],
): GroupState => {
	const groupMap = buildGroupMapFromPresets(presets, categoryOrder);
	const orderedCategories = computeOrderedCategories(groupMap, categoryOrder);
	return { groupMap, orderedCategories };
};

const flattenGroups = (state: GroupState): CommandPreset[] => {
	const result: CommandPreset[] = [];
	for (const category of state.orderedCategories) {
		const items = state.groupMap[category] ?? [];
		for (const item of items) {
			result.push(item);
		}
	}

	for (const [category, items] of Object.entries(state.groupMap)) {
		if (!state.orderedCategories.includes(category)) {
			result.push(...items);
		}
	}

	return result;
};

const findCategoryByItem = (map: GroupedPresets, id: string) => {
	return Object.keys(map).find((category) =>
		map[category]?.some((preset) => preset.id === id),
	);
};

interface SortableItemProps {
	preset: CommandPreset;
	categoryId: string;
	index: number;
	isSelected: boolean;
	onToggleSelect: (id: string) => void;
}

function SortableItem({
	preset,
	categoryId,
	index,
	isSelected,
	onToggleSelect,
}: SortableItemProps) {
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({
		id: preset.id,
		data: { type: "item", categoryId, index },
	});

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
	};

	const baseClass =
		"group relative flex items-start gap-3 rounded-lg border bg-background p-3 transition-shadow ring-offset-background";
	const selectedClass = isSelected
		? "ring-2 ring-primary ring-offset-2 shadow-sm"
		: "hover:ring-1 hover:ring-border hover:shadow-sm";
	const draggingClass = isDragging ? "opacity-70" : "";

	return (
		<div
			ref={setNodeRef}
			style={style}
			className={`${baseClass} ${selectedClass} ${draggingClass}`}
		>
			<button
				type="button"
				{...attributes}
				{...listeners}
				onClick={(event) => event.stopPropagation()}
				className="mt-0.5 cursor-grab rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground active:cursor-grabbing"
				title="拖动以排序"
			>
				<GripVertical className="h-5 w-5" />
			</button>

			<button
				type="button"
				onClick={() => onToggleSelect(preset.id)}
				onKeyDown={(event) => {
					if (event.key === "Enter" || event.key === " ") {
						event.preventDefault();
						onToggleSelect(preset.id);
					}
				}}
				className="flex flex-1 min-w-0 items-start gap-3 text-left"
			>
				<span className="mt-0.5 text-primary">
					{isSelected ? (
						<CheckSquare className="h-4 w-4" />
					) : (
						<Square className="h-4 w-4 text-muted-foreground" />
					)}
				</span>

				<span className="flex-1 min-w-0 space-y-1">
					<span className="block font-medium text-sm leading-5 line-clamp-2 wrap-break-word">
						{preset.name}
					</span>
					{preset.description && (
						<span className="block text-xs text-muted-foreground leading-4 line-clamp-2 wrap-break-word">
							{preset.description}
						</span>
					)}
				</span>
			</button>
		</div>
	);
}

interface SortableCategoryProps {
	category: string;
	items: CommandPreset[];
	selectedIds: Set<string>;
	onToggleSelect: (id: string) => void;
}

function SortableCategory({
	category,
	items,
	selectedIds,
	onToggleSelect,
}: SortableCategoryProps) {
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({ id: category, data: { type: "category" } });

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
	};

	return (
		<div
			ref={setNodeRef}
			style={style}
			className={`rounded-xl border bg-card/50 transition-shadow ${isDragging ? "opacity-70 shadow-sm" : ""}`}
		>
			<div className="flex items-center justify-between gap-3 border-b bg-muted/40 px-3 py-2 rounded-t-xl">
				<div className="flex items-center gap-2 text-sm font-semibold">
					<button
						type="button"
						{...attributes}
						{...listeners}
						onClick={(event) => event.stopPropagation()}
						className="cursor-grab rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground active:cursor-grabbing"
						title="拖动以排序分组"
					>
						<GripVertical className="h-4 w-4" />
					</button>
					<span>{category}</span>
					<Badge variant="outline" className="h-5 px-2 text-[11px]">
						{items.length}
					</Badge>
				</div>
			</div>
			<div className="space-y-2 px-3 py-3">
				<SortableContext
					items={items.map((item) => item.id)}
					strategy={verticalListSortingStrategy}
				>
					{items.length > 0 ? (
						items.map((item, index) => (
							<SortableItem
								key={item.id}
								preset={item}
								categoryId={category}
								index={index}
								isSelected={selectedIds.has(item.id)}
								onToggleSelect={onToggleSelect}
							/>
						))
					) : (
						<div className="rounded-lg border border-dashed border-muted-foreground/40 py-6 text-center text-xs text-muted-foreground">
							拖动命令到这里
						</div>
					)}
				</SortableContext>
			</div>
		</div>
	);
}

interface CommandBatchManagerProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	presets: CommandPreset[];
	categoryOrder: string[];
	onReorder: (presets: CommandPreset[]) => void;
	onReorderCategories: (categories: string[]) => void;
	onUpdateCategory: (id: string, category: string) => void;
	onBatchDelete: (ids: string[]) => void;
}

export function CommandBatchManager({
	open,
	onOpenChange,
	presets: initialPresets,
	categoryOrder = [],
	onReorder,
	onReorderCategories,
	onUpdateCategory,
	onBatchDelete,
}: CommandBatchManagerProps) {
	const [groupState, setGroupState] = useState<GroupState>(() =>
		createGroupState(initialPresets, categoryOrder),
	);
	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
	const [newCategory, setNewCategory] = useState("");
	const [activeDragType, setActiveDragType] = useState<
		"category" | "item" | null
	>(null);
	const [activeId, setActiveId] = useState<string | null>(null);

	useEffect(() => {
		if (!open) {
			return;
		}
		setGroupState(createGroupState(initialPresets, categoryOrder));
		setSelectedIds(new Set());
	}, [initialPresets, categoryOrder, open]);

	useEffect(() => {
		if (!open) {
			setSelectedIds(new Set());
		}
	}, [open]);

	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: {
				distance: 8,
			},
		}),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		}),
	);

	const allCategories = useMemo(
		() =>
			computeOrderedCategories(
				groupState.groupMap,
				groupState.orderedCategories,
			),
		[groupState],
	);

	const totalItems = useMemo(() => {
		return Object.values(groupState.groupMap).reduce(
			(acc, items) => acc + items.length,
			0,
		);
	}, [groupState.groupMap]);

	const activeItem = useMemo(() => {
		if (!activeId || activeDragType !== "item") return null;
		for (const items of Object.values(groupState.groupMap)) {
			const found = items.find((item) => item.id === activeId);
			if (found) return found;
		}
		return null;
	}, [activeId, activeDragType, groupState.groupMap]);

	const handleDragStart = (event: DragStartEvent) => {
		const type = event.active.data.current?.type;
		if (type === "category" || type === "item") {
			setActiveDragType(type);
			setActiveId(String(event.active.id));
		}
	};

	const handleDragEnd = (event: DragEndEvent) => {
		const { active, over } = event;
		if (!over) {
			setActiveDragType(null);
			setActiveId(null);
			return;
		}

		if (activeDragType === "category") {
			const activeId = String(active.id);
			const overId = String(over.id);
			if (activeId !== overId) {
				setGroupState((prev) => {
					const currentOrder = prev.orderedCategories;
					if (
						!currentOrder.includes(activeId) ||
						!currentOrder.includes(overId)
					) {
						return prev;
					}
					const nextOrder = arrayMove(
						currentOrder,
						currentOrder.indexOf(activeId),
						currentOrder.indexOf(overId),
					);
					return { ...prev, orderedCategories: nextOrder };
				});
			}
			setActiveDragType(null);
			setActiveId(null);
			return;
		}

		if (activeDragType === "item") {
			const activeId = String(active.id);
			const overId = String(over.id);
			const activeCategory =
				(active.data.current?.categoryId as string) ||
				findCategoryByItem(groupState.groupMap, activeId);
			const overData = over.data.current;
			const overCategory =
				overData?.type === "category"
					? String(over.id)
					: (overData?.categoryId as string) ||
						findCategoryByItem(groupState.groupMap, overId);

			if (!activeCategory || !overCategory) {
				setActiveDragType(null);
				return;
			}

			setGroupState((prev) => {
				const sourceItems = prev.groupMap[activeCategory] ?? [];
				const activeIndex = sourceItems.findIndex(
					(item) => item.id === activeId,
				);
				if (activeIndex === -1) {
					return prev;
				}

				const movedItem = sourceItems[activeIndex];
				const nextMap: GroupedPresets = { ...prev.groupMap };
				const updatedSource = [...sourceItems];
				updatedSource.splice(activeIndex, 1);
				nextMap[activeCategory] = updatedSource;

				const destinationItems = [...(nextMap[overCategory] ?? [])];
				let insertIndex = -1;
				if (overData?.type === "item") {
					insertIndex = destinationItems.findIndex(
						(item) => item.id === overId,
					);
				}
				if (insertIndex === -1) {
					insertIndex = destinationItems.length;
				}

				const updatedItem =
					overCategory === activeCategory
						? movedItem
						: { ...movedItem, category: overCategory };

				destinationItems.splice(insertIndex, 0, updatedItem);
				nextMap[overCategory] = destinationItems;

				const nextOrder = computeOrderedCategories(
					nextMap,
					prev.orderedCategories.concat(overCategory),
				);

				return {
					groupMap: nextMap,
					orderedCategories: nextOrder,
				};
			});
		}

		setActiveDragType(null);
		setActiveId(null);
		setSelectedIds((prev) => new Set(prev));
	};

	const handleToggleSelect = (id: string) => {
		setSelectedIds((prev) => {
			const next = new Set(prev);
			if (next.has(id)) {
				next.delete(id);
			} else {
				next.add(id);
			}
			return next;
		});
	};

	const handleToggleSelectAll = () => {
		if (selectedIds.size === totalItems && totalItems > 0) {
			setSelectedIds(new Set());
		} else {
			const allIds = flattenGroups(groupState).map((preset) => preset.id);
			setSelectedIds(new Set(allIds));
		}
	};

	const handleBatchDelete = () => {
		if (selectedIds.size === 0) return;
		if (
			!window.confirm(
				`确定要删除选中的 ${selectedIds.size} 个命令吗？此操作无法撤销。`,
			)
		)
			return;

		onBatchDelete(Array.from(selectedIds));

		setGroupState((prev) => {
			const nextMap: GroupedPresets = {};
			for (const [category, items] of Object.entries(prev.groupMap)) {
				nextMap[category] = items.filter((item) => !selectedIds.has(item.id));
			}
			return {
				groupMap: nextMap,
				orderedCategories: computeOrderedCategories(
					nextMap,
					prev.orderedCategories,
				),
			};
		});

		setSelectedIds(new Set());
	};

	const handleBatchUpdateCategory = (category: string) => {
		if (selectedIds.size === 0) return;

		const normalized = normalizeCategory(category);

		setGroupState((prev) => {
			const nextMap: GroupedPresets = {};
			for (const [cat, items] of Object.entries(prev.groupMap)) {
				nextMap[cat] = items
					.filter((item) => !selectedIds.has(item.id))
					.map((item) => ({ ...item }));
			}
			const moved: CommandPreset[] = [];
			for (const items of Object.values(prev.groupMap)) {
				for (const item of items) {
					if (selectedIds.has(item.id)) {
						moved.push({ ...item, category: normalized });
					}
				}
			}
			nextMap[normalized] = [...(nextMap[normalized] ?? []), ...moved];
			return {
				groupMap: nextMap,
				orderedCategories: computeOrderedCategories(
					nextMap,
					prev.orderedCategories.concat(normalized),
				),
			};
		});

		for (const id of selectedIds) {
			onUpdateCategory(id, normalized);
		}
	};

	const handleAddCategory = () => {
		const normalized = normalizeCategory(newCategory);
		if (!normalized) return;
		if (allCategories.includes(normalized)) {
			window.alert("该分类已存在");
			return;
		}

		setGroupState((prev) => ({
			groupMap: { ...prev.groupMap, [normalized]: [] },
			orderedCategories: [...prev.orderedCategories, normalized],
		}));
		setNewCategory("");
	};

	const handleSave = () => {
		const orderedCategories = computeOrderedCategories(
			groupState.groupMap,
			groupState.orderedCategories,
		);
		const flattened = flattenGroups({
			groupMap: groupState.groupMap,
			orderedCategories,
		}).map((preset) => ({
			...preset,
			category: normalizeCategory(preset.category),
		}));

		onReorder(flattened);
		onReorderCategories(orderedCategories);
		onOpenChange(false);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-4xl h-[85vh] flex flex-col p-0">
				<div className="px-6 pt-6 pb-4 shrink-0">
					<DialogHeader>
						<DialogTitle>批量管理命令</DialogTitle>
						<DialogDescription>
							拖拽分组或命令进行排序，支持批量分类与删除操作
						</DialogDescription>
					</DialogHeader>
				</div>

				<div className="px-6 space-y-3 shrink-0">
					<div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
						<Button
							variant="outline"
							size="sm"
							onClick={handleToggleSelectAll}
							className="shrink-0"
						>
							{selectedIds.size === totalItems && totalItems > 0
								? "取消全选"
								: "全选"}
						</Button>
						<Badge variant="secondary" className="shrink-0">
							已选 {selectedIds.size}/{totalItems}
						</Badge>

						<div className="flex-1" />

						{selectedIds.size > 0 && (
							<>
								<Select onValueChange={handleBatchUpdateCategory}>
									<SelectTrigger className="w-36 h-8 text-xs">
										<FolderEdit className="h-3.5 w-3.5 mr-1" />
										<SelectValue placeholder="批量分类" />
									</SelectTrigger>
									<SelectContent>
										{allCategories.map((cat) => (
											<SelectItem key={cat} value={cat} className="text-xs">
												{cat}
											</SelectItem>
										))}
									</SelectContent>
								</Select>

								<Button
									variant="destructive"
									size="sm"
									onClick={handleBatchDelete}
									className="shrink-0"
								>
									<Trash2 className="h-3.5 w-3.5 mr-1" />
									删除选中
								</Button>
							</>
						)}
					</div>

					<div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
						<Label className="text-xs shrink-0">新建分类:</Label>
						<Input
							placeholder="输入新分类名称..."
							value={newCategory}
							onChange={(e) => setNewCategory(e.target.value)}
							onKeyDown={(e) => e.key === "Enter" && handleAddCategory()}
							className="h-8 text-xs"
						/>
						<Button
							size="sm"
							onClick={handleAddCategory}
							disabled={!newCategory.trim()}
						>
							添加
						</Button>
					</div>
				</div>

				<div className="flex-1 min-h-0 px-6 py-3 overflow-hidden">
					<ScrollArea className="h-full">
						<div className="pr-4 space-y-3 pb-6">
							<DndContext
								sensors={sensors}
								collisionDetection={pointerWithin}
								onDragStart={handleDragStart}
								onDragEnd={handleDragEnd}
							>
								<SortableContext
									items={groupState.orderedCategories}
									strategy={verticalListSortingStrategy}
								>
									{groupState.orderedCategories.map((category) => (
										<SortableCategory
											key={category}
											category={category}
											items={groupState.groupMap[category] ?? []}
											selectedIds={selectedIds}
											onToggleSelect={handleToggleSelect}
										/>
									))}
								</SortableContext>
								<DragOverlay
									dropAnimation={null}
									modifiers={[snapCenterToCursor]}
								>
									{activeDragType === "category" && activeId ? (
										<div
											className="rounded-xl border bg-card shadow-2xl"
											style={{ width: "300px" }}
										>
											<div className="flex items-center justify-between gap-3 border-b bg-muted/40 px-3 py-2 rounded-t-xl">
												<div className="flex items-center gap-2 text-sm font-semibold">
													<GripVertical className="h-4 w-4 text-muted-foreground" />
													<span>{activeId}</span>
													<Badge
														variant="outline"
														className="h-5 px-2 text-[11px]"
													>
														{groupState.groupMap[activeId]?.length ?? 0}
													</Badge>
												</div>
											</div>
										</div>
									) : activeDragType === "item" && activeItem ? (
										<div
											className="flex items-start gap-3 rounded-lg border bg-background p-3 shadow-2xl"
											style={{ width: "350px" }}
										>
											<GripVertical className="h-5 w-5 mt-0.5 text-muted-foreground" />
											<CheckSquare className="h-4 w-4 mt-0.5 text-primary" />
											<div className="flex-1 min-w-0 space-y-1">
												<div className="font-medium text-sm leading-5 line-clamp-2">
													{activeItem.name}
												</div>
												{activeItem.description && (
													<div className="text-xs text-muted-foreground leading-4 line-clamp-2">
														{activeItem.description}
													</div>
												)}
											</div>
										</div>
									) : null}
								</DragOverlay>
							</DndContext>
						</div>
					</ScrollArea>
				</div>

				<div className="flex justify-end gap-2 px-6 py-4 border-t shrink-0">
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						取消
					</Button>
					<Button onClick={handleSave}>保存排序</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
