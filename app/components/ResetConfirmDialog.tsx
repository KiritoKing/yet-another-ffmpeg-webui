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

/**
 * 重置确认对话框
 */
interface ResetConfirmDialogProps {
	open: boolean;
	presetsCount: number;
	onOpenChange: (open: boolean) => void;
	onConfirm: () => void;
	onCancel: () => void;
}

export function ResetConfirmDialog({
	open,
	presetsCount,
	onOpenChange,
	onConfirm,
	onCancel,
}: ResetConfirmDialogProps) {
	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>确定要重置所有命令预设吗？</AlertDialogTitle>
					<AlertDialogDescription>
						此操作无法撤销，所有自定义和导入的命令都将被删除，恢复到初始的{" "}
						{presetsCount > 0 ? "11" : "默认"} 个预设命令。
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel onClick={onCancel}>取消</AlertDialogCancel>
					<AlertDialogAction
						onClick={onConfirm}
						className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
					>
						确认重置
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
