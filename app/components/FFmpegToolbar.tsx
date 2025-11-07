import {
	CodeIcon,
	DownloadIcon,
	Loader2Icon,
	PlayIcon,
	PlusIcon,
	RefreshCwIcon,
	SettingsIcon,
	UploadIcon,
} from "lucide-react";
import { ModeSelect } from "./ModeSelect";
import { Button } from "./ui/button";

interface FFmpegToolbarProps {
	loaded: boolean;
	loading: boolean;
	processing: boolean;
	useMultiThread: boolean;
	onModeChange: (useMultiThread: boolean) => void;
	onLoadFFmpeg: () => void;
	onReloadFFmpeg: () => void;
	onShowSettings: () => void;
	onShowCLIImport: () => void;
	onImportJSON: () => void;
	onExportAll: () => void;
	onNewPreset: () => void;
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
	onModeChange,
	onLoadFFmpeg,
	onReloadFFmpeg,
	onShowSettings,
	onShowCLIImport,
	onImportJSON,
	onExportAll,
	onNewPreset,
}: FFmpegToolbarProps) {
	return (
		<header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
			<div className="max-w-7xl mx-auto px-4 py-3">
				<div className="flex items-center justify-between">
					<div>
						<h1 className="text-xl font-bold">FFmpeg Web</h1>
						<p className="text-xs text-muted-foreground">
							浏览器中的视频处理工具
						</p>
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

						<ModeSelect
							useMultiThread={useMultiThread}
							onModeChange={onModeChange}
							disabled={loaded}
						/>

						{loaded && (
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
						) : (
							<>
								<Button variant="outline" size="sm" onClick={onShowCLIImport}>
									<CodeIcon />
									CLI 导入
								</Button>
								<Button variant="outline" size="sm" onClick={onImportJSON}>
									<UploadIcon />
									导入
								</Button>
								<Button variant="outline" size="sm" onClick={onExportAll}>
									<DownloadIcon />
									导出
								</Button>
								<Button size="sm" onClick={onNewPreset}>
									<PlusIcon />
									新建
								</Button>
							</>
						)}
					</div>
				</div>
			</div>
		</header>
	);
}
