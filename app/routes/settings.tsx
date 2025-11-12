/**
 * Mobile Settings Page
 * 移动端专用设置页面，平铺所有设置项
 */

import { invoke } from "@tauri-apps/api/core";
import {
	Activity,
	ArrowLeft,
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
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { CDNSelector } from "../components/CDNSelector";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Label } from "../components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../components/ui/select";
import { Separator } from "../components/ui/separator";
import { Switch } from "../components/ui/switch";
import { taskDB } from "../services/taskDatabase";
import { useCDNStore } from "../store/cdn";
import { useCommandStore } from "../store/command";
import { useFFmpegWebStore } from "../store/ffmpegWeb";
import { useTaskStore } from "../store/task";

/**
 * Tauri 集成测试组件
 */
function TauriTest() {
	const [result, setResult] = useState<string>("");
	const [isLoading, setIsLoading] = useState(false);

	const testTauriCommand = async () => {
		try {
			setIsLoading(true);
			setResult("调用中...");

			// 检测是否在 Tauri 环境中 (Tauri 2.0 使用 __TAURI_INTERNALS__)
			const isTauri = "__TAURI_INTERNALS__" in window;
			if (!isTauri) {
				setResult("⚠️ 未在 Tauri 环境中运行");
				return;
			}

			// 调用 Rust 命令
			const response = await invoke<string>("greet_from_rust", {
				name: "FFmpeg Easy",
			});
			setResult(`✅ ${response}`);
			toast.success("Tauri 通信成功！");
		} catch (error) {
			const errMsg = error instanceof Error ? error.message : "Unknown error";
			setResult(`❌ 错误: ${errMsg}`);
			toast.error("Tauri 通信失败");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<section className="space-y-4">
			<div className="flex items-center gap-2">
				<Rocket className="w-5 h-5 text-primary" />
				<h2 className="text-lg font-semibold">Tauri 集成测试</h2>
				<Badge variant="outline" className="ml-auto">
					实验性功能
				</Badge>
			</div>
			<p className="text-sm text-muted-foreground">
				测试 Tauri 后端通信是否正常工作
			</p>

			<Card className="p-4 space-y-4">
				<Button
					onClick={testTauriCommand}
					disabled={isLoading}
					className="w-full min-h-11"
				>
					<Rocket className="w-4 h-4 mr-2" />
					{isLoading ? "测试中..." : "测试 Tauri 命令"}
				</Button>

				{result && (
					<div className="p-3 bg-muted rounded-lg">
						<p className="text-sm font-mono wrap-break-word">{result}</p>
					</div>
				)}

				<div className="text-xs text-muted-foreground">
					<p>
						<strong>环境检测：</strong>
						{"__TAURI_INTERNALS__" in window ? "✅ Tauri 环境" : "⚠️ Web 环境"}
					</p>
				</div>
			</Card>
		</section>
	);
}

/**
 * 移动端设置页面
 * 使用平铺布局，所有设置项按分组展示
 */
export default function MobileSettings() {
	const navigate = useNavigate();
	const [showCDNSelector, setShowCDNSelector] = useState(false);
	const [isClearing, setIsClearing] = useState(false);
	const [showResetConfirm, setShowResetConfirm] = useState(false);

	// Store
	const { savedMode, setSavedMode, showInitDialog, setShowInitDialog } =
		useFFmpegWebStore();
	const { queueConfig, setQueueConfig, clearAllTaskResults } = useTaskStore();
	const { config: cdnConfig, getBestProvider } = useCDNStore();
	const { presets, resetToDefaults } = useCommandStore();

	const bestProvider = getBestProvider();
	const categoriesCount = new Set(presets.map((p) => p.category || "未分类"))
		.size;

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

	// 重置命令预设
	const handleResetCommands = () => {
		if (showResetConfirm) {
			resetToDefaults();
			toast.success("已重置命令预设到初始状态");
			setShowResetConfirm(false);
		} else {
			setShowResetConfirm(true);
		}
	};

	// 获取存储大小（估算）
	const getStorageSize = async () => {
		try {
			const count = await taskDB.tasks.count();
			return ((count * 1) / 1024).toFixed(2);
		} catch {
			return "0";
		}
	};

	const [storageSize, setStorageSize] = useState("0");
	useState(() => {
		getStorageSize().then(setStorageSize);
	});

	return (
		<div className="min-h-screen bg-background">
			{/* 顶部导航栏 */}
			<header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
				<div className="flex items-center gap-3 px-4 py-3">
					<Button
						variant="ghost"
						size="icon"
						onClick={() => navigate(-1)}
						className="min-w-11 min-h-11"
						aria-label="返回"
					>
						<ArrowLeft className="w-5 h-5" />
					</Button>
					<div>
						<h1 className="text-lg font-semibold">设置</h1>
						<p className="text-xs text-muted-foreground">应用配置和偏好设置</p>
					</div>
				</div>
			</header>

			{/* 设置内容（平铺布局） */}
			<div className="max-w-2xl mx-auto px-4 py-6 space-y-8">
				{/* Tauri 集成测试 */}
				<TauriTest />

				{/* 通用设置 */}
				<section className="space-y-4">
					<div className="flex items-center gap-2">
						<Settings2 className="w-5 h-5 text-primary" />
						<h2 className="text-lg font-semibold">通用设置</h2>
					</div>
					<p className="text-sm text-muted-foreground">
						配置应用的基本行为和默认选项
					</p>

					<Card className="p-4 space-y-4">
						{/* 默认加载模式 */}
						<div className="space-y-3">
							<div>
								<Label htmlFor="mobile-default-mode" className="text-base">
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
										setSavedMode(value as "single-thread" | "multi-thread");
									}
									toast.success("已保存，下次加载时生效");
								}}
							>
								<SelectTrigger
									id="mobile-default-mode"
									className="w-full min-h-11"
								>
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
						<div className="flex items-center justify-between">
							<div className="flex-1">
								<Label htmlFor="mobile-show-init" className="text-base">
									显示初始化对话框
								</Label>
								<p className="text-sm text-muted-foreground mt-1">
									每次加载时显示模式选择对话框
								</p>
							</div>
							<Switch
								id="mobile-show-init"
								checked={showInitDialog}
								onCheckedChange={(checked) => {
									setShowInitDialog(checked);
									if (checked) {
										setSavedMode(null);
									}
								}}
							/>
						</div>
					</Card>
				</section>

				{/* 性能设置 */}
				<section className="space-y-4">
					<div className="flex items-center gap-2">
						<Zap className="w-5 h-5 text-primary" />
						<h2 className="text-lg font-semibold">性能设置</h2>
					</div>
					<p className="text-sm text-muted-foreground">
						优化任务执行和队列处理的性能
					</p>

					<Card className="p-4 space-y-4">
						{/* 队列并发数 */}
						<div className="space-y-3">
							<div>
								<Label htmlFor="mobile-batch-size" className="text-base">
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
								<SelectTrigger
									id="mobile-batch-size"
									className="w-full min-h-11"
								>
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
						<div className="flex items-center justify-between">
							<div className="flex-1">
								<Label htmlFor="mobile-auto-start" className="text-base">
									自动开始队列
								</Label>
								<p className="text-sm text-muted-foreground mt-1">
									添加任务后自动开始处理队列
								</p>
							</div>
							<Switch
								id="mobile-auto-start"
								checked={queueConfig.autoStart}
								onCheckedChange={(checked) => {
									setQueueConfig({ autoStart: checked });
								}}
							/>
						</div>
					</Card>

					{/* 性能提示 */}
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
				</section>

				{/* 存储管理 */}
				<section className="space-y-4">
					<div className="flex items-center gap-2">
						<Database className="w-5 h-5 text-primary" />
						<h2 className="text-lg font-semibold">存储管理</h2>
					</div>
					<p className="text-sm text-muted-foreground">
						管理本地存储的数据和历史记录
					</p>

					{/* 存储统计 */}
					<div className="grid grid-cols-3 gap-3">
						<Card className="p-3">
							<div className="flex flex-col items-center gap-2 text-center">
								<FileCode className="w-5 h-5 text-muted-foreground" />
								<div className="text-xl font-bold">{presets.length}</div>
								<span className="text-xs text-muted-foreground">命令预设</span>
							</div>
						</Card>
						<Card className="p-3">
							<div className="flex flex-col items-center gap-2 text-center">
								<History className="w-5 h-5 text-muted-foreground" />
								<div className="text-xl font-bold">{categoriesCount}</div>
								<span className="text-xs text-muted-foreground">分类数量</span>
							</div>
						</Card>
						<Card className="p-3">
							<div className="flex flex-col items-center gap-2 text-center">
								<HardDrive className="w-5 h-5 text-muted-foreground" />
								<div className="text-xl font-bold">{storageSize}</div>
								<span className="text-xs text-muted-foreground">MB</span>
							</div>
						</Card>
					</div>

					<Card className="p-4 space-y-4">
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
								className="w-full min-h-11"
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
							{showResetConfirm ? (
								<div className="space-y-2">
									<p className="text-sm text-destructive font-medium">
										确认要重置吗？此操作无法撤销！
									</p>
									<div className="flex gap-2">
										<Button
											variant="destructive"
											onClick={handleResetCommands}
											className="flex-1 min-h-11"
										>
											确认重置
										</Button>
										<Button
											variant="outline"
											onClick={() => setShowResetConfirm(false)}
											className="flex-1 min-h-11"
										>
											取消
										</Button>
									</div>
								</div>
							) : (
								<Button
									variant="destructive"
									onClick={handleResetCommands}
									className="w-full min-h-11"
								>
									<Trash2 className="w-4 h-4 mr-2" />
									重置到初始状态
								</Button>
							)}
						</div>
					</Card>
				</section>

				{/* CDN 配置 */}
				<section className="space-y-4">
					<div className="flex items-center gap-2">
						<Activity className="w-5 h-5 text-primary" />
						<h2 className="text-lg font-semibold">CDN 配置</h2>
					</div>
					<p className="text-sm text-muted-foreground">
						配置 FFmpeg 资源加载源，优化国内访问速度
					</p>

					{/* 当前 CDN 状态 */}
					<Card className="p-4 space-y-3">
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
								<div className="flex flex-col gap-1">
									<span className="text-muted-foreground">地址：</span>
									<span className="font-mono text-xs break-all">
										{bestProvider.baseUrl}
									</span>
								</div>
							)}
						</div>
					</Card>

					<Button
						variant="outline"
						onClick={() => setShowCDNSelector(true)}
						className="w-full min-h-11"
					>
						<Activity className="w-4 h-4 mr-2" />
						打开 CDN 配置
					</Button>

					{/* CDN 说明 */}
					<Card className="p-4 bg-muted/50">
						<p className="text-sm text-muted-foreground">
							<strong className="text-foreground">提示：</strong>
							CDN 配置影响 FFmpeg WASM 文件的加载速度。国内用户建议使用 jsDelivr
							或自定义 CDN 以获得更好的访问速度。
						</p>
					</Card>
				</section>

				{/* 关于 */}
				<section className="space-y-4">
					<div className="flex items-center gap-2">
						<Info className="w-5 h-5 text-primary" />
						<h2 className="text-lg font-semibold">关于</h2>
					</div>

					<Card className="p-6 space-y-6">
						{/* Logo */}
						<div className="flex flex-col items-center gap-4">
							<div className="w-20 h-20 bg-linear-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
								<span className="text-white text-2xl font-bold">FF</span>
							</div>
							<div className="text-center">
								<h3 className="text-xl font-bold mb-1">FFmpeg Easy</h3>
								<p className="text-sm text-muted-foreground">
									简单易用的 FFmpeg Web 工具
								</p>
							</div>
						</div>

						<Separator />

						{/* GitHub */}
						<Button variant="outline" className="w-full min-h-11" asChild>
							<a
								href="https://github.com/KiritoKing/yet-another-ffmpeg-webui"
								target="_blank"
								rel="noopener noreferrer"
								className="flex items-center justify-center gap-2"
							>
								<Github className="w-4 h-4" />
								访问 GitHub 仓库
							</a>
						</Button>

						<Separator />

						{/* 版本信息 */}
						<div>
							<Label className="text-base">版本信息</Label>
							<p className="text-sm text-muted-foreground mt-1">
								v5.0.0 (2025-11-10)
							</p>
						</div>

						<Separator />

						{/* 技术栈 */}
						<div>
							<Label className="text-base mb-2 block">技术栈</Label>
							<div className="flex flex-wrap gap-2">
								<Badge>React 19</Badge>
								<Badge>React Router v7</Badge>
								<Badge>FFmpeg.wasm</Badge>
								<Badge>TypeScript</Badge>
								<Badge>TailwindCSS v4</Badge>
								<Badge>shadcn/ui</Badge>
							</div>
						</div>

						<Separator />

						{/* 功能特性 */}
						<div>
							<Label className="text-base mb-2 block">功能特性</Label>
							<ul className="text-sm text-muted-foreground space-y-1.5 list-disc list-inside">
								<li>浏览器端视频处理，无需上传</li>
								<li>支持单/多线程模式</li>
								<li>任务队列和批处理</li>
								<li>自定义命令预设</li>
								<li>CDN 配置和优化</li>
								<li>任务历史和结果预览</li>
							</ul>
						</div>

						<Separator />

						{/* 开源信息 */}
						<div>
							<Label className="text-base">开源信息</Label>
							<p className="text-sm text-muted-foreground mt-1">
								本项目基于 MIT 协议开源
							</p>
						</div>
					</Card>
				</section>

				{/* 底部间距 */}
				<div className="h-8" />
			</div>

			{/* CDN Selector Dialog */}
			<CDNSelector open={showCDNSelector} onOpenChange={setShowCDNSelector} />
		</div>
	);
}
