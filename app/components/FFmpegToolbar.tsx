import {
	CpuIcon,
	Loader2Icon,
	PlayIcon,
	RefreshCwIcon,
	SettingsIcon,
	Activity,
} from "lucide-react";
import { useCDNStore } from "../store/cdn";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";

interface FFmpegToolbarProps {
	loaded: boolean;
	loading: boolean;
	processing: boolean;
	useMultiThread: boolean;
	onLoadFFmpeg: () => void;
	onReloadFFmpeg: () => void;
	onShowSettings: () => void;
}

/**
 * FFmpeg Web 页面顶部工具栏
 * 包含加载、设置、导入导出等功能
 */
export function FFmpegToolbar({
	loaded,
	loading,
	processing,
	useMultiThread,
	onLoadFFmpeg,
	onReloadFFmpeg,
	onShowSettings,
}: FFmpegToolbarProps) {
	const { config, getBestProvider } = useCDNStore();
	const best = getBestProvider();
	const cdnLabel = config.autoSelect
		? `CDN: ${best?.name || "未选择"}`
		: `CDN: ${best?.name || (config.selectedProviderId ? config.selectedProviderId : "未选择")}`;
	const versionLabel = `v${config.ffmpegVersion}`;
	return (
		<header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
			<div className="max-w-7xl mx-auto px-4 py-3">
				<div className="flex items-center justify-between">
					<div>
						<h1 className="text-xl font-bold">FFmpeg Web</h1>
						<div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1">
							<p className="text-xs text-muted-foreground">
								浏览器中的视频处理工具
							</p>
							{/* CDN 信息 */}
							{best && (
								<span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
									<Activity className="w-3 h-3" />
									{cdnLabel}
								</span>
							)}
							<span className="text-[11px] text-muted-foreground">
								{versionLabel}
							</span>
						</div>
					</div>

					<div className="flex items-center gap-2">
						<Button
							variant="ghost"
							size="sm"
							onClick={onShowSettings}
							title="设置"
						>
							<SettingsIcon className="size-4" />
						</Button>

						{loaded && (
							<>
								<Badge variant="outline" className="h-8">
									<CpuIcon className="w-3 h-3 mr-1" />
									{useMultiThread ? "多线程" : "单线程"}
								</Badge>
								<Button
									variant="outline"
									size="sm"
									onClick={onReloadFFmpeg}
									disabled={processing}
									title="重新加载 FFmpeg（如果遇到错误）"
								>
									<RefreshCwIcon className="size-4" />
									重新加载
								</Button>
							</>
						)}

						{!loaded ? (
							<Button onClick={onLoadFFmpeg} disabled={loading}>
								{loading ? (
									<>
										<Loader2Icon className="animate-spin" />
										加载中...
									</>
								) : (
									<>
										<PlayIcon />
										加载 FFmpeg
									</>
								)}
							</Button>
						) : null}
					</div>
				</div>
			</div>
		</header>
	);
}
