import type { CommandPreset } from "../../types/command";

/**
 * Command Store State Interface
 */
export interface CommandStore {
	presets: CommandPreset[];
	categoryOrder: string[];
	addPreset: (
		preset: Omit<CommandPreset, "id" | "createdAt" | "updatedAt">,
	) => void;
	updatePreset: (id: string, preset: Partial<CommandPreset>) => void;
	deletePreset: (id: string) => void;
	getPreset: (id: string) => CommandPreset | undefined;
	importPresets: (presets: CommandPreset[]) => void;
	exportPresets: () => CommandPreset[];
	clearPresets: () => void;
	resetToDefaults: () => void;
	// 批量操作
	reorderPresets: (presets: CommandPreset[]) => void;
	reorderCategories: (categories: string[]) => void;
	batchDelete: (ids: string[]) => void;
	batchUpdateCategory: (ids: string[], category: string) => void;
}
