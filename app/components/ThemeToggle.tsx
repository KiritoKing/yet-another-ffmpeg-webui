/**
 * ThemeToggle Component
 * 主题切换按钮组件
 */

import { Monitor, Moon, Sun } from "lucide-react";
import { useThemeStore } from "~/store/theme";
import { Button } from "./ui/button";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "./ui/tooltip";

export function ThemeToggle() {
	const { theme, toggleTheme, isClient } = useThemeStore();

	// 在服务端渲染时不显示（避免闪烁）
	if (!isClient) {
		return null;
	}

	// 根据当前主题选择图标
	const Icon = theme === "light" ? Sun : theme === "dark" ? Moon : Monitor;

	// 提示文本
	const tooltipText =
		theme === "light"
			? "切换到暗色模式"
			: theme === "dark"
				? "切换到系统模式"
				: "切换到亮色模式";

	// ARIA 标签
	const ariaLabel = `当前主题: ${theme === "light" ? "亮色" : theme === "dark" ? "暗色" : "跟随系统"}，点击切换`;

	return (
		<TooltipProvider>
			<Tooltip>
				<TooltipTrigger asChild>
					<Button
						variant="ghost"
						size="icon"
						onClick={toggleTheme}
						aria-label={ariaLabel}
						className="min-w-11 min-h-11 touch-manipulation"
					>
						<Icon className="w-5 h-5" />
						<span className="sr-only">{ariaLabel}</span>
					</Button>
				</TooltipTrigger>
				<TooltipContent side="bottom">
					<p>{tooltipText}</p>
				</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	);
}
