import type { CommandPreset } from "../types/command";
import { CommandFilter } from "./CommandFilter";
import { CommandList } from "./CommandList";
import { Card } from "./ui/card";

interface CommandPanelProps {
	presets: CommandPreset[];
	selectedId?: string;
	selectedCategories: Set<string>;
	onCategoriesChange: (categories: Set<string>) => void;
	onSelect: (preset: CommandPreset) => void;
	onEdit: (preset: CommandPreset) => void;
	onDelete: (preset: CommandPreset) => void;
	onExport: (preset: CommandPreset) => void;
}

/**
 * 命令列表面板
 * 包含分类筛选器和命令列表
 */
export function CommandPanel({
	presets,
	selectedId,
	selectedCategories,
	onCategoriesChange,
	onSelect,
	onEdit,
	onDelete,
	onExport,
}: CommandPanelProps) {
	return (
		<Card className="h-[calc(100vh-10rem)] flex flex-col">
			<div className="px-4 py-2 border-b">
				<div className="flex items-center justify-between">
					<h2 className="text-sm font-semibold">命令预设</h2>
				</div>
				<CommandFilter
					presets={presets}
					selectedCategories={selectedCategories}
					onCategoriesChange={onCategoriesChange}
				/>
			</div>
			<div className="flex-1 overflow-hidden p-4">
				<CommandList
					presets={presets}
					selectedId={selectedId}
					selectedCategories={selectedCategories}
					onSelect={onSelect}
					onEdit={onEdit}
					onDelete={onDelete}
					onExport={onExport}
				/>
			</div>
		</Card>
	);
}
