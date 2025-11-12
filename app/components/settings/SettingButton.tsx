/**
 * SettingButton - Action button component
 */

import type {
	SettingConfig,
	SettingsRendererContext,
} from "../../config/settings-config";
import { Button } from "../ui/button";
import { SettingItem } from "./SettingItem";

interface SettingButtonProps {
	config: SettingConfig;
	mode: "dialog" | "page";
	context: SettingsRendererContext;
}

export function SettingButton({ config, mode, context }: SettingButtonProps) {
	const { id, title, description, icon: Icon, variant = "default" } = config;

	// Determine action based on setting id
	let action: (() => void | Promise<void>) | undefined;
	let disabled = false;
	let loading = false;

	if (id === "clear-history") {
		action = context.onClearHistory;
		disabled = context.isClearing;
		loading = context.isClearing;
	} else if (id === "reset-presets") {
		action = context.onResetCommands;
	} else if (id === "open-cdn-config") {
		action = context.onOpenCDNSelector;
	}

	const handleClick = () => {
		if (action) {
			action();
		}
	};

	return (
		<SettingItem
			id={id}
			title={title}
			description={description}
			mode={mode}
			layout="vertical"
		>
			<Button
				variant={variant}
				onClick={handleClick}
				disabled={disabled || config.disabled}
				className={mode === "page" ? "w-full min-h-11" : "w-full max-w-sm"}
			>
				{Icon && <Icon className="w-4 h-4 mr-2" />}
				{loading ? (id === "clear-history" ? "清理中..." : "处理中...") : title}
			</Button>
		</SettingItem>
	);
}
