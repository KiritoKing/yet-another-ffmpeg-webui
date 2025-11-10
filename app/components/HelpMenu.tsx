import { BookOpen, HelpCircle, LifeBuoy } from "lucide-react";
import { Button } from "./ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "./ui/dropdown-menu";

interface HelpMenuProps {
	onStartBasicTour: () => void;
	onStartAdvancedTour?: () => void;
}

export function HelpMenu({
	onStartBasicTour,
	onStartAdvancedTour,
}: HelpMenuProps) {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button id="help-button" variant="ghost" size="sm" title="帮助">
					<HelpCircle className="size-4" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-48">
				<DropdownMenuItem onClick={onStartBasicTour}>
					<LifeBuoy className="mr-2 h-4 w-4" />
					新手引导
				</DropdownMenuItem>
				{onStartAdvancedTour && (
					<DropdownMenuItem onClick={onStartAdvancedTour}>
						<BookOpen className="mr-2 h-4 w-4" />
						高级功能引导
					</DropdownMenuItem>
				)}
				<DropdownMenuItem
					onClick={() =>
						window.open("https://github.com/bytedance/ffmpeg-easy", "_blank")
					}
				>
					<BookOpen className="mr-2 h-4 w-4" />
					GitHub 仓库
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
