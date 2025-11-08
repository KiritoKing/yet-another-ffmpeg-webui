import type { CommandPreset } from "../types/command";
import { CommandEditor } from "./CommandEditor";
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
import { Button } from "./ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "./ui/dialog";
import { Separator } from "./ui/separator";
import { Textarea } from "./ui/textarea";

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
			<DialogContent className="max-w-[95vw]! w-fit max-h-[95vh]">
				<div className="overflow-y-auto max-h-[calc(95vh-8rem)] pr-2">
					<DialogHeader className="mb-6">
						<DialogTitle>
							{editingPreset
								? editingPreset.id.startsWith("temp_")
									? "完善 CLI 导入的命令"
									: "编辑命令"
								: "新建命令"}
						</DialogTitle>
						<DialogDescription>
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

/**
 * CLI 导入对话框
 */
interface CLIImportDialogProps {
	open: boolean;
	cliCommand: string;
	onOpenChange: (open: boolean) => void;
	onCommandChange: (command: string) => void;
	onImport: () => void;
	onCancel: () => void;
}

export function CLIImportDialog({
	open,
	cliCommand,
	onOpenChange,
	onCommandChange,
	onImport,
	onCancel,
}: CLIImportDialogProps) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-2xl">
				<DialogHeader>
					<DialogTitle>从 CLI 导入命令</DialogTitle>
				</DialogHeader>
				<div className="space-y-4">
					<Textarea
						value={cliCommand}
						onChange={(e) => onCommandChange(e.target.value)}
						rows={6}
						className="font-mono text-sm"
						placeholder="粘贴 FFmpeg CLI 命令，例如：&#10;ffmpeg -i input.mp4 -c:v libx264 -crf 23 output.mp4"
					/>
					<div className="flex justify-end gap-3">
						<Button variant="outline" onClick={onCancel}>
							取消
						</Button>
						<Button onClick={onImport} disabled={!cliCommand.trim()}>
							导入
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}

/**
 * 设置对话框
 */
interface SettingsDialogProps {
	open: boolean;
	presetsCount: number;
	categoriesCount: number;
	onOpenChange: (open: boolean) => void;
	onResetCommands: () => void;
	onClose: () => void;
}

export function SettingsDialog({
	open,
	presetsCount,
	categoriesCount,
	onOpenChange,
	onResetCommands,
	onClose,
}: SettingsDialogProps) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle>设置</DialogTitle>
					<DialogDescription>管理应用程序设置和数据</DialogDescription>
				</DialogHeader>
				<div className="space-y-6 py-4">
					{/* 重置命令预设 */}
					<div className="space-y-3">
						<div>
							<h3 className="text-sm font-medium mb-1">重置命令预设</h3>
							<p className="text-xs text-muted-foreground">
								将所有命令预设恢复到初始状态，这将删除所有自定义和导入的命令
							</p>
						</div>
						<Button
							variant="destructive"
							onClick={onResetCommands}
							className="w-full"
						>
							重置到初始状态
						</Button>
					</div>

					<Separator />

					{/* 命令统计 */}
					<div className="space-y-2">
						<h3 className="text-sm font-medium">统计信息</h3>
						<div className="grid grid-cols-2 gap-3 text-sm">
							<div className="bg-muted rounded-lg p-3">
								<div className="text-muted-foreground text-xs mb-1">
									命令总数
								</div>
								<div className="text-2xl font-bold">{presetsCount}</div>
							</div>
							<div className="bg-muted rounded-lg p-3">
								<div className="text-muted-foreground text-xs mb-1">
									分类数量
								</div>
								<div className="text-2xl font-bold">{categoriesCount}</div>
							</div>
						</div>
					</div>
				</div>
				<DialogFooter>
					<Button variant="outline" onClick={onClose}>
						关闭
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

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

/**
 * 清空队列确认对话框
 */
interface ClearQueueConfirmDialogProps {
	open: boolean;
	queueCount: number;
	executingCount: number;
	completedCount: number;
	hasResults: boolean;
	completedTasks: Array<{ outputFileName: string }>;
	onOpenChange: (open: boolean) => void;
	onConfirm: () => void;
	onCancel: () => void;
}

export function ClearQueueConfirmDialog({
	open,
	queueCount,
	executingCount,
	completedCount,
	hasResults,
	completedTasks,
	onOpenChange,
	onConfirm,
	onCancel,
}: ClearQueueConfirmDialogProps) {
	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>切换命令后需要清空任务队列</AlertDialogTitle>
					<AlertDialogDescription asChild>
						<div className="space-y-3">
							<p>
								您已切换到新的命令，当前任务队列需要清空。以下内容将被删除：
							</p>

							{queueCount > 0 && (
								<div className="text-sm">
									• 等待队列中的{" "}
									<span className="font-semibold">{queueCount}</span> 个任务
								</div>
							)}

							{executingCount > 0 && (
								<div className="text-sm text-yellow-600 dark:text-yellow-400">
									• 正在执行的{" "}
									<span className="font-semibold">{executingCount}</span>{" "}
									个任务（将被中止）
								</div>
							)}

							{completedCount > 0 && hasResults && (
								<div className="space-y-2">
									<div className="text-sm text-destructive">
										• 已完成的{" "}
										<span className="font-semibold">{completedCount}</span>{" "}
										个任务结果将被清空
									</div>
									<div className="bg-muted p-3 rounded-md max-h-32 overflow-y-auto">
										<p className="text-xs font-semibold mb-1">任务列表：</p>
										<ul className="text-xs space-y-1">
											{completedTasks.slice(0, 5).map((task) => (
												<li
													key={task.outputFileName}
													className="text-muted-foreground"
												>
													• {task.outputFileName}
												</li>
											))}
											{completedTasks.length > 5 && (
												<li className="text-muted-foreground">
													...还有 {completedTasks.length - 5} 个任务
												</li>
											)}
										</ul>
									</div>
									<p className="text-xs text-destructive font-medium">
										⚠️ 请确保已下载需要保存的文件
									</p>
								</div>
							)}
						</div>
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel onClick={onCancel}>取消切换</AlertDialogCancel>
					<AlertDialogAction
						onClick={onConfirm}
						className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
					>
						确认清空并继续
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
