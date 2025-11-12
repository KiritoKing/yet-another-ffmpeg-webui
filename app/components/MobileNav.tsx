/**
 * MobileNav Component
 * 移动端导航菜单组件
 */

import { Activity, CpuIcon, SettingsIcon } from "lucide-react";
import { Link } from "react-router";
import { useCDNStore } from "../store/cdn";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "./ui/sheet";

interface MobileNavProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	loaded?: boolean;
	useMultiThread?: boolean;
}

export function MobileNav({
	open,
	onOpenChange,
	loaded = false,
	useMultiThread = false,
}: MobileNavProps) {
	const { config, getBestProvider } = useCDNStore();
	const best = getBestProvider();
	const cdnLabel = config.autoSelect
		? best?.name || "未选择"
		: best?.name || config.selectedProviderId || "未选择";

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent
				side="left"
				className="w-[300px] sm:w-[400px] p-0 flex flex-col"
			>
				<SheetHeader className="p-6 pb-4">
					<SheetTitle className="text-lg">菜单</SheetTitle>
					<SheetDescription className="text-sm">
						FFmpeg Easy - 在线视频处理工具
					</SheetDescription>
				</SheetHeader>

				{/* 主要内容区域 */}
				<div className="flex-1 px-6 py-4 overflow-y-auto">
					<div className="text-sm text-muted-foreground">
						<p>更多功能即将推出...</p>
					</div>
				</div>

				{/* 底部状态栏 */}
				<div className="border-t bg-muted/30 p-4 space-y-3">
					{/* 运行状态 */}
					{loaded && (
						<div className="flex items-center gap-2">
							<span className="text-sm text-muted-foreground">运行模式:</span>
							<Badge variant="outline" className="h-8">
								<CpuIcon className="w-3 h-3 mr-1" />
								{useMultiThread ? "多线程" : "单线程"}
							</Badge>
						</div>
					)}

					{/* CDN 信息 */}
					<div className="space-y-1.5">
						<div className="flex items-center gap-2 text-xs text-muted-foreground">
							<Activity className="w-3 h-3" />
							<span>CDN: {cdnLabel}</span>
						</div>
						<div className="text-xs text-muted-foreground pl-5">
							版本: v{config.ffmpegVersion}
						</div>
					</div>

					<Separator />

					{/* 设置按钮 */}
					<Button
						variant="outline"
						className="w-full min-h-11"
						onClick={() => onOpenChange(false)}
						asChild
					>
						<Link to="/settings">
							<SettingsIcon className="w-4 h-4 mr-2" />
							设置
						</Link>
					</Button>
				</div>
			</SheetContent>
		</Sheet>
	);
}
