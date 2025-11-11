/**
 * SettingSwitch - Toggle switch with store binding
 */

import type { SettingConfig } from "../../config/settings-config";
import { useCDNStore } from "../../store/cdn";
import { useCommandStore } from "../../store/command";
import { useFFmpegWebStore } from "../../store/ffmpegWeb";
import { useTaskStore } from "../../store/task";
import { Switch } from "../ui/switch";
import { SettingItem } from "./SettingItem";

interface SettingSwitchProps {
	config: SettingConfig;
	mode: "dialog" | "page";
}

export function SettingSwitch({ config, mode }: SettingSwitchProps) {
	const { id, title, description, storeBinding } = config;

	// Get store based on binding (hooks must be called unconditionally)
	const ffmpegWebStore = useFFmpegWebStore();
	const taskStore = useTaskStore();
	const cdnStore = useCDNStore();
	const commandStore = useCommandStore();

	if (!storeBinding) {
		console.error(`SettingSwitch ${id} requires storeBinding`);
		return null;
	}

	const stores = {
		ffmpegWeb: ffmpegWebStore,
		task: taskStore,
		cdn: cdnStore,
		command: commandStore,
	};

	const store = stores[storeBinding.store];
	const stateValue = store[storeBinding.key as keyof typeof store];

	// Handle special case for auto-start (nested in queueConfig)
	let checked: boolean;
	if (
		id === "auto-start-queue" &&
		typeof stateValue === "object" &&
		stateValue
	) {
		checked = (stateValue as any).autoStart || false;
	} else {
		checked = Boolean(stateValue);
	}

	const handleChange = (newChecked: boolean) => {
		if (!storeBinding.setter) return;

		const setter = store[storeBinding.setter as keyof typeof store] as any;

		if (id === "show-init-dialog") {
			// Special handling for show-init-dialog
			setter(newChecked);
			if (newChecked) {
				ffmpegWebStore.setSavedMode(null);
			}
		} else if (id === "auto-start-queue") {
			// Special handling for auto-start (nested in queueConfig)
			setter({ autoStart: newChecked });
		} else {
			// Default handling
			const transformed = storeBinding.transform
				? storeBinding.transform(newChecked)
				: newChecked;
			setter(transformed);
		}
	};

	return (
		<SettingItem
			id={id}
			title={title}
			description={description}
			mode={mode}
			layout="horizontal"
		>
			<Switch
				id={`${mode}-${id}`}
				checked={checked}
				onCheckedChange={handleChange}
			/>
		</SettingItem>
	);
}
