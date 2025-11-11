import type { CommandPreset } from "../types/command";
import { CommandEditor } from "./CommandEditor";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "./ui/dialog";

/**
 * 命令编辑器对话框
 */
interface EditorDialogProps {
	open: boolean;
	editingPreset: CommandPreset | null;
	onOpenChange: (open: boolean) => void;
	onSave: (
		preset: Omit<CommandPreset, "id" | "createdAt" | "updatedAt">,
	) => void;
	onCancel: () => void;
}

export function EditorDialog({
	open,
	editingPreset,
	onOpenChange,
	onSave,
	onCancel,
}: EditorDialogProps) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-[95vw] lg:max-w-[95vw] w-full lg:w-fit max-h-[95vh] p-4 lg:p-6">
				<div className="overflow-y-auto max-h-[calc(95vh-8rem)] pr-1 lg:pr-2">
					<DialogHeader className="mb-4 lg:mb-6">
						<DialogTitle className="text-lg lg:text-xl">
							{editingPreset
								? editingPreset.id.startsWith("temp_")
									? "完善 CLI 导入的命令"
									: "编辑命令"
								: "新建命令"}
						</DialogTitle>
						<DialogDescription className="text-sm">
							{editingPreset?.id.startsWith("temp_")
								? "已从 CLI 命令解析基本信息，请完善命令名称、描述等详细信息"
								: "配置 FFmpeg 命令参数和输入输出文件"}
						</DialogDescription>
					</DialogHeader>
					<CommandEditor
						preset={editingPreset || undefined}
						onSave={onSave}
						onCancel={onCancel}
					/>
				</div>
			</DialogContent>
		</Dialog>
	);
}
