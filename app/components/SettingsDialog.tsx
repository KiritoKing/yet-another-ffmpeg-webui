import {
	Activity,
	Database,
	FileCode,
	Github,
	HardDrive,
	History,
	Info,
	Rocket,
	Settings2,
	Trash2,
	Zap,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { taskDB } from "../services/taskDatabase";
import { useCDNStore } from "../store/cdn";
import { useFFmpegWebStore } from "../store/ffmpegWeb";
import { useTaskStore } from "../store/task";
import { CDNSelector } from "./CDNSelector";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "./ui/dialog";
import { Label } from "./ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "./ui/select";
import { Separator } from "./ui/separator";
import { Switch } from "./ui/switch";

interface SettingsDialogProps {
	open: boolean;
	presetsCount: number;
	categoriesCount: number;
	onOpenChange: (open: boolean) => void;
	onResetCommands: () => void;
}

type SettingCategory = "general" | "performance" | "storage" | "cdn" | "about";

const categories = [
	{
		id: "general" as SettingCategory,
		label: "通用",
		icon: Settings2,
		description: "基本设置和默认行为",
	},
	{
		id: "performance" as SettingCategory,
		label: "性能",
		icon: Zap,
		description: "执行和队列配置",
	},
	{
		id: "storage" as SettingCategory,
		label: "存储",
		icon: Database,
		description: "数据管理和清理",
	},
	{
		id: "cdn" as SettingCategory,
		label: "CDN",
		icon: Activity,
		description: "资源加载配置",
	},
	{
		id: "about" as SettingCategory,
		label: "关于",
		icon: Info,
		description: "应用信息",
	},
];

export function SettingsDialog({
	open,
	presetsCount,
	categoriesCount,
	onOpenChange,
	onResetCommands,
}: SettingsDialogProps) {
	const [activeCategory, setActiveCategory] =
		useState<SettingCategory>("general");
	const [showCDNSelector, setShowCDNSelector] = useState(false);
	const [isClearing, setIsClearing] = useState(false);

	// Store
	const { savedMode, setSavedMode, showInitDialog, setShowInitDialog } =
		useFFmpegWebStore();
	const { queueConfig, setQueueConfig, clearAllTaskResults } = useTaskStore();
	const { config: cdnConfig, getBestProvider } = useCDNStore();

	// 清理任务历史
	const handleClearHistory = async () => {
		try {
			setIsClearing(true);
			const count = await taskDB.tasks.count();
			await taskDB.tasks.clear();
			clearAllTaskResults();
			toast.success(`已清理 ${count} 条历史记录`);
		} catch (error) {
			toast.error(
				`清理失败：${error instanceof Error ? error.message : "未知错误"}`,
			);
		} finally {
			setIsClearing(false);
		}
	};

	// 获取存储大小（估算）
	const getStorageSize = async () => {
		try {
			const count = await taskDB.tasks.count();
			// 粗略估算：每个任务约 1KB
			return ((count * 1) / 1024).toFixed(2);
		} catch {
			return "0";
		}
	};

	const [storageSize, setStorageSize] = useState("0");

	// 加载存储大小
	useState(() => {
		getStorageSize().then(setStorageSize);
	});

	const bestProvider = getBestProvider();

	return (
		<>
			<Dialog open={open} onOpenChange={onOpenChange}>
				<DialogContent className="max-w-7xl w-[95vw] max-h-[85vh] p-0 gap-0">
					<DialogHeader className="px-6 pt-6 pb-4">
						<DialogTitle className="flex items-center gap-2">
							<Settings2 className="w-5 h-5" />
							设置
						</DialogTitle>
						<DialogDescription>配置应用程序的行为和偏好设置</DialogDescription>
					</DialogHeader>

					<div className="flex h-[calc(85vh-120px)] w-full">
						{/* 左侧分类导航 */}
						<div className="w-48 border-r bg-muted/20 p-4 overflow-y-auto">
							<nav className="space-y-1">
								{categories.map((category) => {
									const Icon = category.icon;
									const isActive = activeCategory === category.id;
									return (
										<button
											type="button"
											key={category.id}
											onClick={() => setActiveCategory(category.id)}
											className={`
												w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors
												${
													isActive
														? "bg-primary text-primary-foreground"
														: "hover:bg-muted text-muted-foreground hover:text-foreground"
												}
											`}
										>
											<Icon className="w-4 h-4 shrink-0" />
											<span className="truncate">{category.label}</span>
										</button>
									);
								})}
							</nav>
						</div>

						{/* 右侧设置面板 */}
						<div className="flex-1 overflow-y-auto p-6">
							{/* 通用设置 */}
							{activeCategory === "general" && (
								<div className="space-y-6">
									<div>
										<h3 className="text-lg font-semibold mb-1">通用设置</h3>
										<p className="text-sm text-muted-foreground">
											配置应用的基本行为和默认选项
										</p>
									</div>

									<Separator />

									{/* 默认加载模式 */}
									<div className="space-y-3">
										<div>
											<Label htmlFor="default-mode" className="text-base">
												默认加载模式
											</Label>
											<p className="text-sm text-muted-foreground mt-1">
												选择 FFmpeg 的默认运行模式（需要重新加载生效）
											</p>
										</div>
										<Select
											value={savedMode || "ask"}
											onValueChange={(value) => {
												if (value === "ask") {
													setSavedMode(null);
													setShowInitDialog(true);
												} else {
													setSavedMode(
														value as "single-thread" | "multi-thread",
													);
												}
												toast.success("已保存，下次加载时生效");
											}}
										>
											<SelectTrigger id="default-mode" className="max-w-sm">
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="ask">每次询问（推荐）</SelectItem>
												<SelectItem value="multi-thread">
													多线程（性能最佳）
												</SelectItem>
												<SelectItem value="single-thread">
													单线程（兼容性最好）
												</SelectItem>
											</SelectContent>
										</Select>
									</div>

									<Separator />

									{/* 初始化对话框 */}
									<div className="space-y-3">
										<div className="flex items-center justify-between">
											<div className="flex-1">
												<Label htmlFor="show-init" className="text-base">
													显示初始化对话框
												</Label>
												<p className="text-sm text-muted-foreground mt-1">
													每次加载时显示模式选择对话框
												</p>
											</div>
											<Switch
												id="show-init"
												checked={showInitDialog}
												onCheckedChange={(checked) => {
													setShowInitDialog(checked);
													if (checked) {
														setSavedMode(null);
													}
												}}
											/>
										</div>
									</div>
								</div>
							)}

							{/* 性能设置 */}
							{activeCategory === "performance" && (
								<div className="space-y-6">
									<div>
										<h3 className="text-lg font-semibold mb-1">性能设置</h3>
										<p className="text-sm text-muted-foreground">
											优化任务执行和队列处理的性能
										</p>
									</div>

									<Separator />

									{/* 队列并发数 */}
									<div className="space-y-3">
										<div>
											<Label htmlFor="batch-size" className="text-base">
												队列并发数
											</Label>
											<p className="text-sm text-muted-foreground mt-1">
												同时处理的任务数量（建议：1，避免内存溢出）
											</p>
										</div>
										<Select
											value={queueConfig.batchSize.toString()}
											onValueChange={(value) => {
												setQueueConfig({
													batchSize: Number.parseInt(value, 10),
												});
												toast.success("并发数已更新");
											}}
										>
											<SelectTrigger id="batch-size" className="max-w-sm">
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="1">1（推荐，最稳定）</SelectItem>
												<SelectItem value="2">2</SelectItem>
												<SelectItem value="3">3</SelectItem>
												<SelectItem value="4">4</SelectItem>
											</SelectContent>
										</Select>
									</div>

									<Separator />

									{/* 自动开始队列 */}
									<div className="space-y-3">
										<div className="flex items-center justify-between">
											<div className="flex-1">
												<Label htmlFor="auto-start" className="text-base">
													自动开始队列
												</Label>
												<p className="text-sm text-muted-foreground mt-1">
													添加任务后自动开始处理队列
												</p>
											</div>
											<Switch
												id="auto-start"
												checked={queueConfig.autoStart}
												onCheckedChange={(checked) => {
													setQueueConfig({ autoStart: checked });
												}}
											/>
										</div>
									</div>

									<Separator />

									{/* 性能提示 */}
									<Card className="p-4 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
										<div className="flex items-start gap-3">
											<Rocket className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
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
								</div>
							)}

							{/* 存储设置 */}
							{activeCategory === "storage" && (
								<div className="space-y-6">
									<div>
										<h3 className="text-lg font-semibold mb-1">存储管理</h3>
										<p className="text-sm text-muted-foreground">
											管理本地存储的数据和历史记录
										</p>
									</div>

									<Separator />

									{/* 存储统计 */}
									<div className="grid grid-cols-3 gap-4">
										<Card className="p-4">
											<div className="flex items-center gap-2 mb-2">
												<FileCode className="w-4 h-4 text-muted-foreground" />
												<span className="text-sm text-muted-foreground">
													命令预设
												</span>
											</div>
											<div className="text-2xl font-bold">{presetsCount}</div>
										</Card>
										<Card className="p-4">
											<div className="flex items-center gap-2 mb-2">
												<History className="w-4 h-4 text-muted-foreground" />
												<span className="text-sm text-muted-foreground">
													分类数量
												</span>
											</div>
											<div className="text-2xl font-bold">
												{categoriesCount}
											</div>
										</Card>
										<Card className="p-4">
											<div className="flex items-center gap-2 mb-2">
												<HardDrive className="w-4 h-4 text-muted-foreground" />
												<span className="text-sm text-muted-foreground">
													存储大小
												</span>
											</div>
											<div className="text-2xl font-bold">{storageSize} MB</div>
										</Card>
									</div>

									<Separator />

									{/* 清理历史记录 */}
									<div className="space-y-3">
										<div>
											<Label className="text-base">清理任务历史</Label>
											<p className="text-sm text-muted-foreground mt-1">
												删除所有已完成、失败和中止的任务记录
											</p>
										</div>
										<Button
											variant="outline"
											onClick={handleClearHistory}
											disabled={isClearing}
											className="w-full max-w-sm"
										>
											<Trash2 className="w-4 h-4 mr-2" />
											{isClearing ? "清理中..." : "清理历史记录"}
										</Button>
									</div>

									<Separator />

									{/* 重置命令预设 */}
									<div className="space-y-3">
										<div>
											<Label className="text-base">重置命令预设</Label>
											<p className="text-sm text-muted-foreground mt-1">
												将所有命令预设恢复到初始状态，删除自定义命令
											</p>
										</div>
										<Button
											variant="destructive"
											onClick={onResetCommands}
											className="w-full max-w-sm"
										>
											<Trash2 className="w-4 h-4 mr-2" />
											重置到初始状态
										</Button>
									</div>
								</div>
							)}

							{/* CDN 设置 */}
							{activeCategory === "cdn" && (
								<div className="space-y-6">
									<div>
										<h3 className="text-lg font-semibold mb-1">CDN 配置</h3>
										<p className="text-sm text-muted-foreground">
											配置 FFmpeg 资源加载源，优化国内访问速度
										</p>
									</div>

									<Separator />

									{/* 当前 CDN 状态 */}
									<Card className="p-4">
										<div className="space-y-3">
											<div className="flex items-center justify-between">
												<Label className="text-base">当前 CDN</Label>
												<Badge variant="outline">
													{cdnConfig.autoSelect ? "自动选择" : "手动选择"}
												</Badge>
											</div>
											<div className="text-sm">
												<div className="flex items-center gap-2">
													<span className="text-muted-foreground">
														提供商：
													</span>
													<span className="font-medium">
														{bestProvider?.name || "未选择"}
													</span>
												</div>
												<div className="flex items-center gap-2 mt-1">
													<span className="text-muted-foreground">版本：</span>
													<span className="font-medium">
														{cdnConfig.ffmpegVersion}
													</span>
												</div>
												{bestProvider && (
													<div className="flex items-center gap-2 mt-1">
														<span className="text-muted-foreground">
															地址：
														</span>
														<span className="font-mono text-xs">
															{bestProvider.baseUrl}
														</span>
													</div>
												)}
											</div>
										</div>
									</Card>

									<Button
										variant="outline"
										onClick={() => setShowCDNSelector(true)}
										className="w-full max-w-sm"
									>
										<Activity className="w-4 h-4 mr-2" />
										打开 CDN 配置
									</Button>

									<Separator />

									{/* CDN 说明 */}
									<Card className="p-4 bg-muted/50">
										<p className="text-sm text-muted-foreground">
											<strong className="text-foreground">提示：</strong>
											CDN 配置影响 FFmpeg WASM 文件的加载速度。国内用户建议使用
											jsDelivr 或自定义 CDN 以获得更好的访问速度。
										</p>
									</Card>
								</div>
							)}

							{/* 关于 */}
							{activeCategory === "about" && (
								<div className="space-y-6">
									<div className="text-center space-y-4">
										{/* Logo */}
										<div className="flex justify-center">
											<div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
												<span className="text-white text-3xl font-bold">
													FF
												</span>
											</div>
										</div>

										{/* App Title */}
										<div>
											<h3 className="text-2xl font-bold mb-2">FFmpeg Easy</h3>
											<p className="text-muted-foreground">
												简单易用的 FFmpeg Web 工具
											</p>
										</div>

										{/* GitHub Button */}
										<div className="flex justify-center">
											<Button variant="outline" asChild>
												<a
													href="https://github.com/KiritoKing/yet-another-ffmpeg-webui"
													target="_blank"
													rel="noopener noreferrer"
													className="flex items-center gap-2"
												>
													<Github className="w-4 h-4" />
													访问 GitHub 仓库
												</a>
											</Button>
										</div>
									</div>

									<Separator />

									<div className="space-y-4">
										<div>
											<Label className="text-base">版本信息</Label>
											<p className="text-sm text-muted-foreground mt-1">
												v5.0.0 (2025-11-10)
											</p>
										</div>

										<div>
											<Label className="text-base">技术栈</Label>
											<div className="flex flex-wrap gap-2 mt-2">
												<Badge>React 19</Badge>
												<Badge>React Router v7</Badge>
												<Badge>FFmpeg.wasm</Badge>
												<Badge>TypeScript</Badge>
												<Badge>TailwindCSS v4</Badge>
												<Badge>shadcn/ui</Badge>
											</div>
										</div>

										<div>
											<Label className="text-base">功能特性</Label>
											<ul className="text-sm text-muted-foreground space-y-1 mt-2 list-disc list-inside">
												<li>浏览器端视频处理，无需上传</li>
												<li>支持单/多线程模式</li>
												<li>任务队列和批处理</li>
												<li>自定义命令预设</li>
												<li>CDN 配置和优化</li>
												<li>任务历史和结果预览</li>
											</ul>
										</div>

										<div>
											<Label className="text-base">开源信息</Label>
											<p className="text-sm text-muted-foreground mt-1">
												本项目基于 MIT 协议开源
											</p>
											<Button
												variant="link"
												className="p-0 h-auto text-sm mt-1"
												asChild
											>
												<a
													href="https://github.com/KiritoKing/yet-another-ffmpeg-webui"
													target="_blank"
													rel="noopener noreferrer"
												>
													GitHub 仓库
												</a>
											</Button>
										</div>
									</div>
								</div>
							)}
						</div>
					</div>
				</DialogContent>
			</Dialog>

			{/* CDN Selector Dialog */}
			<CDNSelector open={showCDNSelector} onOpenChange={setShowCDNSelector} />
		</>
	);
}
