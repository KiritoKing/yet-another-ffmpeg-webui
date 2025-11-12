/**
 * SettingCustom - Custom content for About section
 */

import { Github } from "lucide-react";
import type { SettingConfig } from "../../config/settings-config";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Label } from "../ui/label";
import { Separator } from "../ui/separator";

interface SettingCustomProps {
	config: SettingConfig;
	mode: "dialog" | "page";
}

export function SettingCustom({ config, mode }: SettingCustomProps) {
	const { id } = config;

	// App logo and title
	if (id === "app-logo") {
		if (mode === "page") {
			return (
				<Card className="p-6 space-y-6">
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
				</Card>
			);
		}

		return (
			<div className="text-center space-y-4">
				<div className="flex justify-center">
					<div className="w-24 h-24 bg-linear-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
						<span className="text-white text-3xl font-bold">FF</span>
					</div>
				</div>
				<div>
					<h3 className="text-2xl font-bold mb-2">FFmpeg Easy</h3>
					<p className="text-muted-foreground">简单易用的 FFmpeg Web 工具</p>
				</div>
			</div>
		);
	}

	// GitHub link
	if (id === "github-link") {
		if (mode === "page") {
			return (
				<>
					<Separator />
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
				</>
			);
		}

		return (
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
		);
	}

	// Version info
	if (id === "version-info") {
		return (
			<>
				{mode === "page" && <Separator />}
				<div>
					<Label className="text-base">版本信息</Label>
					<p className="text-sm text-muted-foreground mt-1">
						v5.0.0 (2025-11-10)
					</p>
				</div>
			</>
		);
	}

	// Tech stack
	if (id === "tech-stack") {
		return (
			<>
				{mode === "page" && <Separator />}
				<div>
					<Label className={`text-base ${mode === "page" ? "mb-2 block" : ""}`}>
						技术栈
					</Label>
					<div className="flex flex-wrap gap-2 mt-2">
						<Badge>React 19</Badge>
						<Badge>React Router v7</Badge>
						<Badge>FFmpeg.wasm</Badge>
						<Badge>TypeScript</Badge>
						<Badge>TailwindCSS v4</Badge>
						<Badge>shadcn/ui</Badge>
					</div>
				</div>
			</>
		);
	}

	// Features
	if (id === "features") {
		return (
			<>
				{mode === "page" && <Separator />}
				<div>
					<Label className={`text-base ${mode === "page" ? "mb-2 block" : ""}`}>
						功能特性
					</Label>
					<ul
						className={`text-sm text-muted-foreground ${mode === "page" ? "space-y-1.5" : "space-y-1"} mt-2 list-disc list-inside`}
					>
						<li>浏览器端视频处理，无需上传</li>
						<li>支持单/多线程模式</li>
						<li>任务队列和批处理</li>
						<li>自定义命令预设</li>
						<li>CDN 配置和优化</li>
						<li>任务历史和结果预览</li>
					</ul>
				</div>
			</>
		);
	}

	// License
	if (id === "license") {
		return (
			<>
				{mode === "page" && <Separator />}
				<div>
					<Label className="text-base">开源信息</Label>
					<p className="text-sm text-muted-foreground mt-1">
						本项目基于 MIT 协议开源
					</p>
					{mode === "dialog" && (
						<Button variant="link" className="p-0 h-auto text-sm mt-1" asChild>
							<a
								href="https://github.com/KiritoKing/yet-another-ffmpeg-webui"
								target="_blank"
								rel="noopener noreferrer"
							>
								GitHub 仓库
							</a>
						</Button>
					)}
				</div>
			</>
		);
	}

	return null;
}
