import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Textarea } from "./ui/textarea";

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
