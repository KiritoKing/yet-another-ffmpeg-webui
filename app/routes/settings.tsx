/**
 * Mobile Settings Page
 * 移动端专用设置页面，平铺所有设置项
 */

import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { CDNSelector } from "../components/CDNSelector";
import { SettingsRenderer } from "../components/settings/SettingsRenderer";
import { Button } from "../components/ui/button";
import { settingsCategories } from "../config/settings-config";
import { taskDB } from "../services/taskDatabase";
import { useCommandStore } from "../store/command";

/**
 * 移动端设置页面
 * 使用平铺布局，所有设置项按分组展示
 */
export default function MobileSettings() {
	const navigate = useNavigate();
	const [showCDNSelector, setShowCDNSelector] = useState(false);
	const [isClearing, setIsClearing] = useState(false);
	const [storageSize, setStorageSize] = useState("0");

	// Store
	const { presets, resetToDefaults } = useCommandStore();

	const categoriesCount = new Set(presets.map((p) => p.category || "未分类"))
		.size;

	// 获取存储大小（估算）
	const getStorageSize = async () => {
		try {
			const count = await taskDB.tasks.count();
			return ((count * 1) / 1024).toFixed(2);
		} catch {
			return "0";
		}
	};

	useState(() => {
		getStorageSize().then(setStorageSize);
	});

	// 清理任务历史
	const handleClearHistory = async () => {
		try {
			setIsClearing(true);
			const count = await taskDB.tasks.clear();
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
		resetToDefaults();
		toast.success("已重置命令预设到初始状态");
	};

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
			<div className="max-w-2xl mx-auto px-4 py-6">
				<SettingsRenderer
					mode="page"
					categories={settingsCategories}
					context={{
						presetsCount: presets.length,
						categoriesCount,
						storageSize,
						onResetCommands: handleResetCommands,
						onClearHistory: handleClearHistory,
						onOpenCDNSelector: () => setShowCDNSelector(true),
						isClearing,
					}}
				/>

				{/* 底部间距 */}
				<div className="h-8" />
			</div>

			{/* CDN Selector Dialog */}
			<CDNSelector open={showCDNSelector} onOpenChange={setShowCDNSelector} />
		</div>
	);
}
