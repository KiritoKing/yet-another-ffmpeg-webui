import { Settings2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { settingsCategories } from "../config/settings-config";
import { taskDB } from "../services/taskDatabase";
import { CDNSelector } from "./CDNSelector";
import { SettingsRenderer } from "./settings/SettingsRenderer";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "./ui/dialog";

interface SettingsDialogProps {
	open: boolean;
	presetsCount: number;
	categoriesCount: number;
	onOpenChange: (open: boolean) => void;
	onResetCommands: () => void;
}

export function SettingsDialog({
	open,
	presetsCount,
	categoriesCount,
	onOpenChange,
	onResetCommands,
}: SettingsDialogProps) {
	const [activeCategory, setActiveCategory] = useState("general");
	const [showCDNSelector, setShowCDNSelector] = useState(false);
	const [isClearing, setIsClearing] = useState(false);
	const [storageSize, setStorageSize] = useState("0");

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

	// 加载存储大小
	useState(() => {
		getStorageSize().then(setStorageSize);
	});

	// 清理任务历史
	const handleClearHistory = async () => {
		try {
			setIsClearing(true);
			const count = await taskDB.tasks.count();
			await taskDB.tasks.clear();
			toast.success(`已清理 ${count} 条历史记录`);
		} catch (error) {
			toast.error(
				`清理失败：${error instanceof Error ? error.message : "未知错误"}`,
			);
		} finally {
			setIsClearing(false);
		}
	};

	return (
		<>
			<Dialog open={open} onOpenChange={onOpenChange}>
				<DialogContent className="max-w-[95vw] lg:max-w-7xl w-full lg:w-[95vw] max-h-[85vh] p-0 gap-0">
					<DialogHeader className="px-6 pt-6 pb-4">
						<DialogTitle className="flex items-center gap-2">
							<Settings2 className="w-5 h-5" />
							设置
						</DialogTitle>
						<DialogDescription>配置应用程序的行为和偏好设置</DialogDescription>
					</DialogHeader>

					<div className="flex h-[calc(85vh-120px)] w-full">
						<SettingsRenderer
							mode="dialog"
							categories={settingsCategories}
							activeCategory={activeCategory}
							onCategoryChange={setActiveCategory}
							context={{
								presetsCount,
								categoriesCount,
								storageSize,
								onResetCommands,
								onClearHistory: handleClearHistory,
								onOpenCDNSelector: () => setShowCDNSelector(true),
								isClearing,
							}}
						/>
					</div>
				</DialogContent>
			</Dialog>

			{/* CDN Selector Dialog */}
			<CDNSelector open={showCDNSelector} onOpenChange={setShowCDNSelector} />
		</>
	);
}
