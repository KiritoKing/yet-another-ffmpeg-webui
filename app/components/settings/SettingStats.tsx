/**
 * SettingStats - Storage statistics grid
 */

import { FileCode, HardDrive, History } from "lucide-react";
import type {
	SettingConfig,
	SettingsRendererContext,
} from "../../config/settings-config";
import { Card } from "../ui/card";

interface SettingStatsProps {
	config: SettingConfig;
	mode: "dialog" | "page";
	context: SettingsRendererContext;
}

export function SettingStats({ config, mode, context }: SettingStatsProps) {
	const { presetsCount, categoriesCount, storageSize } = context;

	if (mode === "page") {
		// Mobile layout: 3 columns with vertical centering
		return (
			<div className="grid grid-cols-3 gap-3">
				<Card className="p-3">
					<div className="flex flex-col items-center gap-2 text-center">
						<FileCode className="w-5 h-5 text-muted-foreground" />
						<div className="text-xl font-bold">{presetsCount}</div>
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
		);
	}

	// Desktop layout: 3 columns with horizontal layout
	return (
		<div className="grid grid-cols-3 gap-4">
			<Card className="p-4">
				<div className="flex items-center gap-2 mb-2">
					<FileCode className="w-4 h-4 text-muted-foreground" />
					<span className="text-sm text-muted-foreground">命令预设</span>
				</div>
				<div className="text-2xl font-bold">{presetsCount}</div>
			</Card>
			<Card className="p-4">
				<div className="flex items-center gap-2 mb-2">
					<History className="w-4 h-4 text-muted-foreground" />
					<span className="text-sm text-muted-foreground">分类数量</span>
				</div>
				<div className="text-2xl font-bold">{categoriesCount}</div>
			</Card>
			<Card className="p-4">
				<div className="flex items-center gap-2 mb-2">
					<HardDrive className="w-4 h-4 text-muted-foreground" />
					<span className="text-sm text-muted-foreground">存储大小</span>
				</div>
				<div className="text-2xl font-bold">{storageSize} MB</div>
			</Card>
		</div>
	);
}
