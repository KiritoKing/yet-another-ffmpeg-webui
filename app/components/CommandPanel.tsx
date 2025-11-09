import {
	CodeIcon,
	DownloadIcon,
	ListOrdered,
	MoreHorizontal,
	PlusIcon,
	Search,
	UploadIcon,
} from "lucide-react";
import { useState } from "react";
import type { CommandPreset } from "../types/command";
import { CommandBatchManager } from "./CommandBatchManager";
import { CommandList } from "./CommandList";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Input } from "./ui/input";

interface CommandPanelProps {
	presets: CommandPreset[];
	categoryOrder: string[];
	selectedId?: string;
	selectedCategories: Set<string>;
	onSelect: (preset: CommandPreset) => void;
	onEdit: (preset: CommandPreset) => void;
	onDelete: (preset: CommandPreset) => void;
	onExport: (preset: CommandPreset) => void;
	onReorder: (presets: CommandPreset[]) => void;
	onReorderCategories: (categories: string[]) => void;
	onUpdateCategory: (id: string, category: string) => void;
	onBatchDelete: (ids: string[]) => void;
	onShowCLIImport: () => void;
	onImportJSON: () => void;
	onExportAll: () => void;
	onNewPreset: () => void;
}

/**
 * 命令列表面板
 * 包含搜索框和命令列表（手风琴形式）
 */
export function CommandPanel({
	presets,
	categoryOrder,
	selectedId,
	selectedCategories,
	onSelect,
	onEdit,
	onDelete,
	onExport,
	onReorder,
	onReorderCategories,
	onUpdateCategory,
	onBatchDelete,
	onShowCLIImport,
	onImportJSON,
	onExportAll,
	onNewPreset,
}: CommandPanelProps) {
	const [searchQuery, setSearchQuery] = useState("");
	const [showBatchManager, setShowBatchManager] = useState(false);

	return (
		<>
			<Card className="h-[calc(100vh-10rem)] flex flex-col">
				<div className="px-4 py-3 border-b space-y-3">
					<div className="flex items-center justify-between">
						<h2 className="text-sm font-semibold">命令预设</h2>
						<div className="flex items-center gap-2">
							<Button
								variant="outline"
								size="sm"
								onClick={() => setShowBatchManager(true)}
								className="h-8"
							>
								<ListOrdered className="h-3.5 w-3.5 mr-1.5" />
								批量管理
							</Button>
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button variant="outline" size="sm" className="h-8 px-2">
										<MoreHorizontal className="h-4 w-4" />
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent align="end" className="w-48">
									<DropdownMenuItem onClick={onNewPreset}>
										<PlusIcon className="h-4 w-4 mr-2" />
										新建预设
									</DropdownMenuItem>
									<DropdownMenuItem onClick={onShowCLIImport}>
										<CodeIcon className="h-4 w-4 mr-2" />
										CLI 导入
									</DropdownMenuItem>
									<DropdownMenuItem onClick={onImportJSON}>
										<UploadIcon className="h-4 w-4 mr-2" />
										导入文件
									</DropdownMenuItem>
									<DropdownMenuItem onClick={onExportAll}>
										<DownloadIcon className="h-4 w-4 mr-2" />
										导出全部
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						</div>
					</div>
					{/* 搜索框 */}
					<div className="relative">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
						<Input
							placeholder="搜索命令..."
							className="pl-9 h-9"
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
						/>
					</div>
				</div>
				<div className="flex-1 overflow-hidden p-4">
					<CommandList
						presets={presets}
						categoryOrder={categoryOrder}
						selectedId={selectedId}
						selectedCategories={selectedCategories}
						onSelect={onSelect}
						onEdit={onEdit}
						onDelete={onDelete}
						onExport={onExport}
						searchQuery={searchQuery}
					/>
				</div>
			</Card>

			<CommandBatchManager
				open={showBatchManager}
				onOpenChange={setShowBatchManager}
				presets={presets}
				categoryOrder={categoryOrder}
				onReorder={onReorder}
				onReorderCategories={onReorderCategories}
				onUpdateCategory={onUpdateCategory}
				onBatchDelete={onBatchDelete}
			/>
		</>
	);
}
