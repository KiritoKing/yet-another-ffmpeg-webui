/**
 * MobileHeader Component
 * 移动端头部组件（仅在移动设备上显示）
 */

import { Menu } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { Button } from "./ui/button";

interface MobileHeaderProps {
	onMenuClick: () => void;
}

export function MobileHeader({ onMenuClick }: MobileHeaderProps) {
	return (
		<header className="lg:hidden sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
			<div className="flex items-center justify-between px-4 py-3">
				{/* 菜单按钮 */}
				<Button
					variant="ghost"
					size="icon"
					onClick={onMenuClick}
					className="min-w-11 min-h-11"
					aria-label="打开菜单"
				>
					<Menu className="w-6 h-6" />
				</Button>

				{/* 应用标题 */}
				<h1 className="text-lg font-semibold">FFmpeg Easy</h1>

				{/* 主题切换 */}
				<ThemeToggle />
			</div>
		</header>
	);
}
