/**
 * InitializationDialog.tsx
 * 初始化 FFmpeg 的居中对话框组件
 */

import { Activity } from "lucide-react";
import { useState } from "react";
import { useCDNStore } from "../store/cdn";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Label } from "./ui/label";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";

interface InitializationDialogProps {
	/** 是否正在加载 */
	loading: boolean;
	/** 当前选择的模式 */
	mode: "multi-thread" | "single-thread";
	/** 是否显示"记住我的选择"选项 */
	showRememberChoice?: boolean;
	/** 模式变更回调 */
	onModeChange: (mode: "multi-thread" | "single-thread") => void;
	/** 加载按钮点击回调 */
	onLoad: (rememberChoice: boolean) => void;
	/** 打开 CDN 配置回调（可选） */
	onOpenCDN?: () => void;
	/** 打开设置回调（可选） */
	onOpenSettings?: () => void;
}

export function InitializationDialog({
	loading,
	mode,
	showRememberChoice = true,
	onModeChange,
	onLoad,
	onOpenCDN,
	onOpenSettings,
}: InitializationDialogProps) {
	const [rememberChoice, setRememberChoice] = useState(false);
	const { config: cdnConfig, getBestProvider } = useCDNStore();
	const bestProvider = getBestProvider();

	const handleLoad = () => {
		onLoad(rememberChoice);
	};

	return (
		<div className="fixed inset-0 bg-linear-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4 z-50">
			<Card className="p-8 max-w-lg w-full shadow-2xl">
				<div className="text-center mb-6">
					{/* 品牌插画 */}
					<div className="flex justify-center mb-4">
						<img
							src="/ffmpeg-easy-hero.png"
							alt="FFmpeg Easy - 在浏览器中处理视频"
							className="w-64 h-auto"
						/>
					</div>
					<h2 className="text-3xl font-bold text-gray-900 mb-2">
						欢迎使用 FFmpeg Web
					</h2>
					<p className="text-gray-600">
						在浏览器中处理视频 - 无需上传，保护隐私
					</p>
				</div>

				<div className="space-y-6">
					{/* 模式选择 */}
					<div className="space-y-3">
						<Label className="text-base font-semibold">选择运行模式</Label>
						<RadioGroup
							value={mode}
							onValueChange={(value: string) =>
								onModeChange(value as "multi-thread" | "single-thread")
							}
							className="space-y-3"
						>
							<div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
								<RadioGroupItem value="multi-thread" id="multi-thread" />
								<div className="flex-1">
									<Label
										htmlFor="multi-thread"
										className="cursor-pointer font-medium"
									>
										⚡ 多线程模式（推荐）
									</Label>
									<p className="text-sm text-muted-foreground mt-1">
										速度更快，适合现代浏览器（Chrome 92+, Firefox 89+）
									</p>
								</div>
							</div>

							<div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
								<RadioGroupItem value="single-thread" id="single-thread" />
								<div className="flex-1">
									<Label
										htmlFor="single-thread"
										className="cursor-pointer font-medium"
									>
										🔧 单线程模式
									</Label>
									<p className="text-sm text-muted-foreground mt-1">
										兼容性更好，适合旧版浏览器或隐私模式
									</p>
								</div>
							</div>
						</RadioGroup>
					</div>

					{/* CDN 信息与入口 */}
					<div className="rounded-lg border p-4">
						<div className="flex items-center gap-2 mb-2">
							<Activity className="w-4 h-4 text-muted-foreground" />
							<Label className="text-sm">资源加载 (CDN)</Label>
						</div>
						<ul className="text-xs text-muted-foreground space-y-1 mb-3">
							<li>
								当前模式：{cdnConfig.autoSelect ? "自动选择" : "手动选择"}
							</li>
							<li>当前提供商：{bestProvider?.name || "尚未确定"}</li>
							<li>FFmpeg 版本：v{cdnConfig.ffmpegVersion}</li>
						</ul>
						<div className="flex gap-2">
							<Button variant="outline" size="sm" onClick={onOpenCDN}>
								打开 CDN 配置
							</Button>
							<Button variant="ghost" size="sm" onClick={onOpenSettings}>
								更多设置
							</Button>
						</div>
					</div>

					{/* 记住选择 */}
					{showRememberChoice && (
						<div className="flex items-center space-x-2 p-4 bg-muted/30 rounded-lg">
							<input
								type="checkbox"
								id="remember"
								checked={rememberChoice}
								onChange={(e) => setRememberChoice(e.target.checked)}
								className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
							/>
							<Label htmlFor="remember" className="cursor-pointer text-sm">
								记住我的选择，下次自动加载
							</Label>
						</div>
					)}

					{/* 加载按钮 */}
					<Button
						onClick={handleLoad}
						disabled={loading}
						className="w-full py-6 text-lg font-semibold"
						size="lg"
					>
						{loading ? (
							<>
								<div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
								加载中...
							</>
						) : (
							<>🚀 开始使用</>
						)}
					</Button>

					{/* 功能特点 */}
					<div className="bg-muted/50 rounded-lg p-4 mt-4">
						<h3 className="text-sm font-semibold text-foreground mb-3">
							✨ 功能特点
						</h3>
						<ul className="space-y-2 text-xs text-muted-foreground">
							<li className="flex items-start">
								<span className="mr-2">🔒</span>
								<span>完全在浏览器中运行，文件不会上传到服务器</span>
							</li>
							<li className="flex items-start">
								<span className="mr-2">⚡</span>
								<span>使用 WebAssembly 技术，性能强大</span>
							</li>
							<li className="flex items-start">
								<span className="mr-2">🎯</span>
								<span>支持多种视频格式转换</span>
							</li>
							<li className="flex items-start">
								<span className="mr-2">🆓</span>
								<span>完全免费，开源项目</span>
							</li>
						</ul>
					</div>
				</div>
			</Card>
		</div>
	);
}
