import { toast } from "sonner";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CommandPreset, FormField } from "../../types/command";
import { parseCLICommand } from "../../utils";
import { defaultPresets } from "./default-values";
import type { CommandStore } from "./types";

/**
 * Category normalization and management utilities
 */
const normalizeCategory = (category?: string) => {
	const value = (category ?? "").trim();
	return value === "" ? "未分类" : value;
};

const mergeCategoryOrder = (
	order: string[],
	categories: string[],
): string[] => {
	const normalizedOrder = order.map(normalizeCategory);
	const seen = new Set(normalizedOrder);
	const next = [...normalizedOrder];
	for (const raw of categories) {
		const category = normalizeCategory(raw);
		if (!seen.has(category)) {
			next.push(category);
			seen.add(category);
		}
	}
	return next;
};

const pruneCategoryOrder = (
	order: string[],
	presets: CommandPreset[],
): string[] => {
	const inUse = new Set(
		presets.map((preset) => normalizeCategory(preset.category)),
	);
	return order.map(normalizeCategory).filter((category) => inUse.has(category));
};

const computeCategoryOrderFromPresets = (
	presets: CommandPreset[],
	existingOrder: string[] = [],
) => {
	const normalizedExisting = existingOrder.map(normalizeCategory);
	const seen = new Set<string>();
	const next: string[] = [];
	for (const category of normalizedExisting) {
		if (!seen.has(category)) {
			next.push(category);
			seen.add(category);
		}
	}
	for (const preset of presets) {
		const category = normalizeCategory(preset.category);
		if (!seen.has(category)) {
			next.push(category);
			seen.add(category);
		}
	}
	return next;
};

/**
 * Command Store
 * 管理命令预设的状态和操作
 */
export const useCommandStore = create<CommandStore>()(
	persist(
		(set, get) => ({
			presets: [],
			categoryOrder: [],

			addPreset: (preset) => {
				const now = Date.now();
				const normalizedPreset: CommandPreset = {
					...preset,
					category: normalizeCategory(preset.category),
					id: `preset_${now}_${Math.random().toString(36).substr(2, 9)}`,
					createdAt: now,
					updatedAt: now,
				};
				set((state) => {
					const nextPresets = [...state.presets, normalizedPreset];
					const mergedOrder = mergeCategoryOrder(state.categoryOrder, [
						normalizedPreset.category,
					]);
					return {
						presets: nextPresets,
						categoryOrder: pruneCategoryOrder(mergedOrder, nextPresets),
					};
				});
			},

			updatePreset: (id, updates) => {
				const now = Date.now();
				set((state) => {
					let updatedCategory: string | undefined;
					const updatedPresets = state.presets.map((preset) => {
						if (preset.id !== id) {
							const normalized = normalizeCategory(preset.category);
							return normalized === preset.category
								? preset
								: { ...preset, category: normalized };
						}

						const { category: categoryUpdate, ...restUpdates } = updates;
						const currentCategory = normalizeCategory(preset.category);
						const nextCategory =
							categoryUpdate !== undefined
								? normalizeCategory(categoryUpdate)
								: currentCategory;

						if (
							categoryUpdate !== undefined &&
							nextCategory !== currentCategory
						) {
							updatedCategory = nextCategory;
						}

						return {
							...preset,
							...restUpdates,
							category: nextCategory,
							updatedAt: now,
						};
					});

					const normalizedPresets = updatedPresets.map((preset) =>
						preset.category === normalizeCategory(preset.category)
							? preset
							: { ...preset, category: normalizeCategory(preset.category) },
					);

					const prunedOrder = pruneCategoryOrder(
						state.categoryOrder,
						normalizedPresets,
					);

					const finalOrder =
						updatedCategory !== undefined
							? pruneCategoryOrder(
									mergeCategoryOrder(prunedOrder, [updatedCategory]),
									normalizedPresets,
								)
							: prunedOrder;

					return {
						presets: normalizedPresets,
						categoryOrder: finalOrder,
					};
				});
			},

			deletePreset: (id) => {
				set((state) => {
					const nextPresets = state.presets.filter(
						(preset) => preset.id !== id,
					);
					return {
						presets: nextPresets,
						categoryOrder: pruneCategoryOrder(state.categoryOrder, nextPresets),
					};
				});
			},

			getPreset: (id) => {
				return get().presets.find((p) => p.id === id);
			},

			importPresets: (presets) => {
				const now = Date.now();
				const currentState = get();
				const existingIds = new Set(currentState.presets.map((p) => p.id));

				const importedPresets = presets
					.filter((p) => {
						if (existingIds.has(p.id)) {
							console.warn(`跳过重复的预设 ID: ${p.id} (${p.name})`);
							toast.warning(`跳过重复的预设 ID: ${p.id} (${p.name})`);
							return false;
						}
						return true;
					})
					.map((p) => ({
						...p,
						category: normalizeCategory(p.category),
						id: `preset_${now}_${Math.random().toString(36).substr(2, 9)}`,
						createdAt: p.createdAt || now,
						updatedAt: now,
					}));

				set((state) => {
					const nextPresets = [...state.presets, ...importedPresets];
					const mergedOrder = mergeCategoryOrder(state.categoryOrder, [
						...importedPresets.map((preset) => preset.category),
					]);
					return {
						presets: nextPresets,
						categoryOrder: pruneCategoryOrder(mergedOrder, nextPresets),
					};
				});
			},

			exportPresets: () => {
				return get().presets;
			},

			clearPresets: () => {
				set({ presets: [], categoryOrder: [] });
			},

			resetToDefaults: () => {
				const now = Date.now();
				const initialPresets = defaultPresets.map((preset, index) => ({
					...preset,
					category: normalizeCategory(preset.category),
					id: `default_${now}_${index}`,
					createdAt: now,
					updatedAt: now,
				}));
				set({
					presets: initialPresets,
					categoryOrder: computeCategoryOrderFromPresets(initialPresets),
				});
			},

			// 批量操作
			reorderPresets: (presets) => {
				const normalizedPresets = presets.map((preset) => ({
					...preset,
					category: normalizeCategory(preset.category),
				}));
				set({
					presets: normalizedPresets,
					categoryOrder: computeCategoryOrderFromPresets(normalizedPresets),
				});
			},

			reorderCategories: (categories) => {
				set((state) => {
					const normalizedInput = categories.map(normalizeCategory);
					const merged = mergeCategoryOrder(normalizedInput, [
						...state.presets.map((preset) =>
							normalizeCategory(preset.category),
						),
					]);
					return {
						categoryOrder: pruneCategoryOrder(merged, state.presets),
					};
				});
			},

			batchDelete: (ids) => {
				set((state) => {
					const nextPresets = state.presets.filter((p) => !ids.includes(p.id));
					return {
						presets: nextPresets,
						categoryOrder: pruneCategoryOrder(state.categoryOrder, nextPresets),
					};
				});
			},

			batchUpdateCategory: (ids, category) => {
				const now = Date.now();
				const normalizedCategory = normalizeCategory(category);
				set((state) => {
					const nextPresets = state.presets.map((preset) =>
						ids.includes(preset.id)
							? { ...preset, category: normalizedCategory, updatedAt: now }
							: preset,
					);
					const merged = mergeCategoryOrder(state.categoryOrder, [
						normalizedCategory,
					]);
					return {
						presets: nextPresets,
						categoryOrder: pruneCategoryOrder(merged, nextPresets),
					};
				});
			},
		}),
		{
			name: "ffmpeg-command-presets",
			version: 2,
			migrate: (persistedState: unknown) => {
				if (!persistedState || typeof persistedState !== "object")
					return persistedState as unknown;
				const ps = persistedState as {
					presets?: unknown[];
					categoryOrder?: unknown[];
				};
				if (!ps.presets || !Array.isArray(ps.presets))
					return persistedState as unknown;
				const migrated = ps.presets.map((raw) => {
					const preset = raw as Record<string, unknown> & {
						ffmpegArgs?: string[];
						formSchema?: FormField[];
					};
					const hasFileFields = (preset.formSchema || []).some(
						(f) => f.type === "file-input" || f.type === "file-output",
					);
					if (hasFileFields) {
						const { inputFiles: _i, outputFileName: _o, ...rest } = preset;
						return rest;
					}
					try {
						const partial = parseCLICommand(
							`ffmpeg ${(preset.ffmpegArgs || []).join(" ")}`,
						);
						const { inputFiles: _li, outputFileName: _lo, ...others } = preset;
						return {
							...others,
							ffmpegArgs: partial.ffmpegArgs || preset.ffmpegArgs,
							formSchema: partial.formSchema || preset.formSchema,
						};
					} catch {
						const { inputFiles: _li, outputFileName: _lo, ...rest } = preset;
						return rest;
					}
				});

				const normalizedPresets = migrated.map((raw) => {
					const presetRecord = raw as Record<string, unknown>;
					const rawCategory =
						typeof presetRecord.category === "string"
							? (presetRecord.category as string)
							: undefined;
					return {
						...(presetRecord as unknown as CommandPreset),
						category: normalizeCategory(rawCategory),
					};
				});

				const previousOrder = Array.isArray(ps.categoryOrder)
					? ps.categoryOrder.filter(
							(value): value is string => typeof value === "string",
						)
					: [];

				return {
					...ps,
					presets: normalizedPresets,
					categoryOrder: computeCategoryOrderFromPresets(
						normalizedPresets as CommandPreset[],
						previousOrder,
					),
				};
			},
			onRehydrateStorage: () => (state) => {
				if (!state) return;

				const normalizedPresets = state.presets.map((preset) => ({
					...preset,
					category: normalizeCategory(preset.category),
				}));
				state.presets = normalizedPresets;
				const existingOrder = Array.isArray(state.categoryOrder)
					? state.categoryOrder
					: [];
				state.categoryOrder = computeCategoryOrderFromPresets(
					normalizedPresets,
					existingOrder,
				);

				if (state.presets.length === 0) {
					const now = Date.now();
					const initialPresets = defaultPresets.map((preset, index) => ({
						...preset,
						category: normalizeCategory(preset.category),
						id: `default_${now}_${index}`,
						createdAt: now,
						updatedAt: now,
					}));
					state.presets = initialPresets;
					state.categoryOrder = computeCategoryOrderFromPresets(
						initialPresets,
						state.categoryOrder,
					);
				}
			},
		},
	),
);
