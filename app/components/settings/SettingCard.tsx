/**
 * SettingCard - Info/status card component
 */

import { Rocket } from "lucide-react";
import type {
	SettingConfig,
	SettingsRendererContext,
} from "../../config/settings-config";
import { useCDNStore } from "../../store/cdn";
import { Badge } from "../ui/badge";
import { Card } from "../ui/card";
import { Label } from "../ui/label";

interface SettingCardProps {
	config: SettingConfig;
	mode: "dialog" | "page";
	context: SettingsRendererContext;
}

export function SettingCard({ config, mode, context }: SettingCardProps) {
	const { id } = config;
	const { config: cdnConfig, getBestProvider } = useCDNStore();
	const bestProvider = getBestProvider();

	// Performance tips card
	if (id === "performance-tips") {
		return (
			<Card className="p-4 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
				<div className="flex items-start gap-3">
					<Rocket className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
					<div className="space-y-1">
						<p className="text-sm font-medium text-blue-900 dark:text-blue-100">
							性能优化建议
						</p>
						<ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1 list-disc list-inside">
							<li>使用多线程模式可提升处理速度</li>
							<li>并发数设为 1 避免内存问题</li>
							<li>大文件建议使用单线程模式</li>
						</ul>
					</div>
				</div>
			</Card>
		);
	}

	// CDN status card
	if (id === "cdn-status") {
		return (
			<Card className="p-4">
				<div className="space-y-3">
					<div className="flex items-center justify-between">
						<Label className="text-base">当前 CDN</Label>
						<Badge variant="outline">
							{cdnConfig.autoSelect ? "自动选择" : "手动选择"}
						</Badge>
					</div>
					<div className="text-sm space-y-2">
						<div className="flex items-center gap-2">
							<span className="text-muted-foreground">提供商：</span>
							<span className="font-medium">
								{bestProvider?.name || "未选择"}
							</span>
						</div>
						<div className="flex items-center gap-2">
							<span className="text-muted-foreground">版本：</span>
							<span className="font-medium">{cdnConfig.ffmpegVersion}</span>
						</div>
						{bestProvider && (
							<div
								className={
									mode === "page"
										? "flex flex-col gap-1"
										: "flex items-center gap-2"
								}
							>
								<span className="text-muted-foreground">地址：</span>
								<span
									className={`font-mono text-xs ${mode === "page" ? "break-all" : ""}`}
								>
									{bestProvider.baseUrl}
								</span>
							</div>
						)}
					</div>
				</div>
			</Card>
		);
	}

	// CDN info card
	if (id === "cdn-info") {
		return (
			<Card className="p-4 bg-muted/50">
				<p className="text-sm text-muted-foreground">
					<strong className="text-foreground">提示：</strong>
					CDN 配置影响 FFmpeg WASM 文件的加载速度。国内用户建议使用 jsDelivr
					或自定义 CDN 以获得更好的访问速度。
				</p>
			</Card>
		);
	}

	return null;
}
