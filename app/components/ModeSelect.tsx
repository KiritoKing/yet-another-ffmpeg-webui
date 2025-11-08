import { InfoIcon } from "lucide-react";
import { Badge } from "./ui/badge";
import { Label } from "./ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "./ui/select";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "./ui/tooltip";

interface ModeSelectProps {
	useMultiThread: boolean;
	onModeChange: (multiThread: boolean) => void;
	disabled?: boolean;
}

export function ModeSelect({
	useMultiThread,
	onModeChange,
	disabled = false,
}: ModeSelectProps) {
	const isSharedArrayBufferAvailable = typeof SharedArrayBuffer !== "undefined";

	return (
		<div className="flex items-center gap-2">
			<Label
				htmlFor="mode-select"
				className="text-sm font-medium whitespace-nowrap"
			>
				运行模式:
			</Label>
			<TooltipProvider>
				<div className="flex items-center gap-1.5">
					<Select
						value={useMultiThread ? "multi" : "single"}
						onValueChange={(value) => onModeChange(value === "multi")}
						disabled={disabled}
					>
						<SelectTrigger id="mode-select" className="w-[180px]">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="multi">
								<div className="flex items-center gap-2">
									<span>多线程模式 ⚡</span>
									{!isSharedArrayBufferAvailable && (
										<Badge
											variant="outline"
											className="text-[10px] px-1.5 py-0 text-orange-600 border-orange-600"
										>
											需重启
										</Badge>
									)}
								</div>
							</SelectItem>
							<SelectItem value="single">
								<span>单线程模式</span>
							</SelectItem>
						</SelectContent>
					</Select>

					<Tooltip>
						<TooltipTrigger asChild>
							<InfoIcon className="size-4 text-muted-foreground cursor-help" />
						</TooltipTrigger>
						<TooltipContent side="bottom" className="max-w-xs">
							<div className="space-y-2 text-sm p-4">
								<div>
									<p className="font-semibold">⚡ 多线程模式</p>
									<p className="text-xs text-muted-foreground mt-1">
										更快的处理速度，适合大文件和复杂操作。需要浏览器支持
										SharedArrayBuffer（需要特殊的 HTTP 头配置）。
									</p>
								</div>
								<div>
									<p className="font-semibold">单线程模式</p>
									<p className="text-xs text-muted-foreground mt-1">
										兼容性更好，所有浏览器都支持。适合小文件和简单操作。
									</p>
								</div>
								{!isSharedArrayBufferAvailable && (
									<p className="text-xs text-orange-600 font-medium">
										💡 当前浏览器不支持多线程，请刷新页面后重试。
									</p>
								)}
							</div>
						</TooltipContent>
					</Tooltip>
				</div>
			</TooltipProvider>
		</div>
	);
}
