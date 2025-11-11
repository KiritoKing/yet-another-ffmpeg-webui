/**
 * SettingSelect - Select dropdown with store binding
 */

import { toast } from "sonner";
import type { SettingConfig } from "../../config/settings-config";
import { useCDNStore } from "../../store/cdn";
import { useCommandStore } from "../../store/command";
import { useFFmpegWebStore } from "../../store/ffmpegWeb";
import { useTaskStore } from "../../store/task";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../ui/select";
import { SettingItem } from "./SettingItem";

interface SettingSelectProps {
	config: SettingConfig;
	mode: "dialog" | "page";
}

export function SettingSelect({ config, mode }: SettingSelectProps) {
	const { id, title, description, icon, options, storeBinding } = config;

	// Get store based on binding (hooks must be called unconditionally)
	const ffmpegWebStore = useFFmpegWebStore();
	const taskStore = useTaskStore();
	const cdnStore = useCDNStore();
	const commandStore = useCommandStore();

	if (!storeBinding || !options) {
		console.error(`SettingSelect ${id} requires storeBinding and options`);
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

	// Handle special case for batch-size (nested in queueConfig)
	let value: string;
	if (id === "batch-size" && typeof stateValue === "object" && stateValue) {
		value = String((stateValue as any).batchSize || "1");
	} else {
		value = (stateValue as string) || "ask";
	}

	const handleChange = (newValue: string) => {
		if (!storeBinding.setter) return;

		const setter = store[storeBinding.setter as keyof typeof store] as any;

		if (id === "default-mode") {
			// Special handling for default mode
			if (newValue === "ask") {
				setter(null);
				ffmpegWebStore.setShowInitDialog(true);
			} else {
				setter(newValue);
			}
			toast.success("已保存，下次加载时生效");
		} else if (id === "batch-size") {
			// Special handling for batch size (nested in queueConfig)
			setter({ batchSize: Number.parseInt(newValue, 10) });
			toast.success("并发数已更新");
		} else {
			// Default handling
			const transformed = storeBinding.transform
				? storeBinding.transform(newValue)
				: newValue;
			setter(transformed);
			toast.success("已保存");
		}
	};

	return (
		<SettingItem
			id={id}
			title={title}
			description={description}
			icon={icon}
			mode={mode}
			layout="vertical"
		>
			<Select value={value} onValueChange={handleChange}>
				<SelectTrigger
					id={`${mode}-${id}`}
					className={mode === "page" ? "w-full min-h-11" : "max-w-sm"}
				>
					<SelectValue />
				</SelectTrigger>
				<SelectContent>
					{options.map((option) => (
						<SelectItem key={option.value} value={option.value}>
							{option.label}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</SettingItem>
	);
}
