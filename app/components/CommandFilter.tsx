import { ChevronDownIcon, FilterIcon } from "lucide-react";
import { useMemo, useState } from "react";
import type { CommandPreset } from "../types/command";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "./ui/collapsible";

interface CommandFilterProps {
	presets: CommandPreset[];
	selectedCategories: Set<string>;
	onCategoriesChange: (categories: Set<string>) => void;
}

export function CommandFilter({
	presets,
	selectedCategories,
	onCategoriesChange,
}: CommandFilterProps) {
	// 筛选器展开状态（默认折叠）
	const [isFilterOpen, setIsFilterOpen] = useState(false);

	// 获取所有分类
	const allCategories = useMemo(() => {
		const categorySet = new Set(presets.map((p) => p.category || "未分类"));
		return Array.from(categorySet).sort();
	}, [presets]);

	// 切换分类筛选
	const toggleCategory = (category: string) => {
		const newSet = new Set(selectedCategories);
		if (newSet.has(category)) {
			// 至少保留一项
			if (newSet.size > 1) {
				newSet.delete(category);
			}
		} else {
			newSet.add(category);
		}
		onCategoriesChange(newSet);
	};

	// 全选/取消全选
	const toggleSelectAll = () => {
		if (selectedCategories.size === allCategories.length) {
			// 已全选，保留第一项
			onCategoriesChange(new Set([allCategories[0]]));
		} else {
			// 未全选，全选
			onCategoriesChange(new Set(allCategories));
		}
	};

	if (allCategories.length === 0) {
		return null;
	}

	return (
		<Collapsible open={isFilterOpen} onOpenChange={setIsFilterOpen}>
			{/* 标题栏 - 始终可见 */}
			<CollapsibleTrigger asChild>
				<div className="flex items-center justify-between cursor-pointer group py-2">
					<div className="flex items-center gap-2">
						<ChevronDownIcon
							className={`size-3.5 text-muted-foreground transition-transform duration-200 ${
								isFilterOpen ? "rotate-0" : "-rotate-90"
							}`}
						/>
						<FilterIcon className="size-3.5 text-muted-foreground" />
						<span className="text-xs font-medium text-muted-foreground">
							筛选
						</span>
						<Badge variant="outline" className="text-[10px] h-4 px-1.5">
							{selectedCategories.size}/{allCategories.length}
						</Badge>
					</div>
					<Button
						variant="ghost"
						size="sm"
						onClick={(e) => {
							e.stopPropagation();
							toggleSelectAll();
						}}
						className="text-[10px] h-5 px-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
					>
						{selectedCategories.size === allCategories.length
							? "保留一项"
							: "全选"}
					</Button>
				</div>
			</CollapsibleTrigger>

			{/* 可折叠内容 - 筛选按钮 */}
			<CollapsibleContent>
				<div className="flex flex-wrap gap-1.5 pb-2 pt-1">
					{allCategories.map((category) => {
						const isSelected = selectedCategories.has(category);
						const count = presets.filter(
							(p) => (p.category || "未分类") === category,
						).length;
						const isLastSelected = selectedCategories.size === 1 && isSelected;

						return (
							<Button
								key={category}
								variant={isSelected ? "default" : "outline"}
								size="sm"
								onClick={() => toggleCategory(category)}
								disabled={isLastSelected}
								className={`text-[11px] h-6 px-2 ${
									isLastSelected ? "cursor-not-allowed opacity-50" : ""
								}`}
								title={
									isLastSelected
										? "至少保留一个分类"
										: `点击${isSelected ? "取消" : ""}筛选 ${category}`
								}
							>
								{category}
								<Badge
									variant={isSelected ? "secondary" : "outline"}
									className="ml-1 text-[9px] px-1 py-0 h-3.5"
								>
									{count}
								</Badge>
							</Button>
						);
					})}
				</div>
			</CollapsibleContent>
		</Collapsible>
	);
}
