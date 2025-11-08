import { toast } from "sonner";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CommandPreset, FormField } from "../types/command";
import { parseCLICommand } from "../utils";

interface CommandStore {
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

// 辅助函数：创建标准的单输入文件字段
const createInput = (maxSizeMB = 500): FormField => ({
	name: "input",
	label: "输入文件",
	type: "file-input",
	accept: "video/*",
	multiple: false,
	maxSizeMB,
	description: "选择要处理的视频文件",
	required: true,
});

// 辅助函数：创建标准的输出文件字段
const createOutput = (ext = "mp4", mimeType?: string): FormField => ({
	name: "output",
	label: "输出文件名",
	type: "file-output",
	defaultValue: `output.${ext}`,
	defaultExtension: ext,
	mimeType,
	description: "输出文件的名称",
	required: true,
});

// 默认预设命令
const defaultPresets: Omit<CommandPreset, "id" | "createdAt" | "updatedAt">[] =
	[
		{
			name: "复制流（不重新编码）",
			description: "快速复制视频和音频流，不进行重新编码，速度最快",
			category: "基础操作",
			ffmpegArgs: ["-i", "{{input}}", "-c", "copy", "{{output}}"],
			requiresReencode: false,
			estimatedMemoryMB: 50,
			formSchema: [createInput(500), createOutput("mp4")],
		},
		{
			name: "转换为 WebM",
			description:
				"使用 VP9 和 Opus 编码器转换为 WebM 格式（⚠️ 大文件或高分辨率视频可能极慢）",
			category: "格式转换",
			ffmpegArgs: [
				"-i",
				"{{input}}",
				"-c:v",
				"libvpx-vp9",
				"-b:v",
				"1M",
				"-crf",
				"32",
				"-speed",
				"8",
				"-threads",
				"4",
				"-c:a",
				"libopus",
				"{{output}}",
			],
			requiresReencode: true,
			estimatedMemoryMB: 250,
			formSchema: [
				createInput(100), // 限制为 100MB，VP9 编码很慢
				createOutput("webm", "video/webm"),
			],
		},
		{
			name: "提取音频为 MP3",
			description: "从视频中提取音频轨道并转换为 MP3 格式",
			category: "音频处理",
			ffmpegArgs: [
				"-i",
				"{{input}}",
				"-vn",
				"-acodec",
				"libmp3lame",
				"-q:a",
				"2",
				"{{output}}",
			],
			requiresReencode: true,
			estimatedMemoryMB: 150,
			formSchema: [createInput(300), createOutput("mp3", "audio/mpeg")],
		},
		{
			name: "调整分辨率（720p）",
			description: "将视频缩放到 1280x720 分辨率",
			category: "视频处理",
			ffmpegArgs: [
				"-i",
				"{{input}}",
				"-vf",
				"scale=1280:720",
				"-c:a",
				"copy",
				"{{output}}",
			],
			requiresReencode: true,
			estimatedMemoryMB: 250,
			formSchema: [createInput(200), createOutput("mp4")],
		},
		{
			name: "转换为 WebM（快速）",
			description: "使用 H.264 转 WebM 容器（不重新编码视频，速度快）",
			category: "格式转换",
			ffmpegArgs: [
				"-i",
				"{{input}}",
				"-c:v",
				"copy",
				"-c:a",
				"libopus",
				"{{output}}",
			],
			requiresReencode: false,
			estimatedMemoryMB: 100,
			formSchema: [createInput(300), createOutput("webm", "video/webm")],
		},
		{
			name: "提取视频片段",
			description: "从第 10 秒开始提取 5 秒的视频片段",
			category: "视频处理",
			ffmpegArgs: [
				"-i",
				"{{input}}",
				"-ss",
				"00:00:10",
				"-t",
				"00:00:05",
				"-c",
				"copy",
				"{{output}}",
			],
			requiresReencode: false,
			estimatedMemoryMB: 50,
			formSchema: [createInput(500), createOutput("mp4")],
		},
		{
			name: "转换为 GIF",
			description: "将视频转换为 GIF 动图（10fps，320px 宽度）",
			category: "格式转换",
			ffmpegArgs: [
				"-i",
				"{{input}}",
				"-vf",
				"fps=10,scale=320:-1:flags=lanczos",
				"-c:v",
				"gif",
				"{{output}}",
			],
			requiresReencode: true,
			estimatedMemoryMB: 200,
			formSchema: [createInput(100), createOutput("gif", "image/gif")],
		},
		{
			name: "压缩视频",
			description: "使用 H.264 编码器压缩视频，CRF 值 28（值越大压缩越多）",
			category: "视频处理",
			ffmpegArgs: [
				"-i",
				"{{input}}",
				"-c:v",
				"libx264",
				"-crf",
				"28",
				"-c:a",
				"aac",
				"-b:a",
				"128k",
				"{{output}}",
			],
			requiresReencode: true,
			estimatedMemoryMB: 250,
			formSchema: [createInput(200), createOutput("mp4")],
		},
		{
			name: "合并视频",
			description: "按顺序合并两个视频文件",
			category: "视频处理",
			ffmpegArgs: [
				"-i",
				"{{input1}}",
				"-i",
				"{{input2}}",
				"-filter_complex",
				"[0:v][0:a][1:v][1:a]concat=n=2:v=1:a=1[v][a]",
				"-map",
				"[v]",
				"-map",
				"[a]",
				"{{output}}",
			],
			requiresReencode: true,
			estimatedMemoryMB: 350,
			formSchema: [
				{
					name: "input1",
					label: "第一个视频",
					type: "file-input",
					accept: "video/*",
					multiple: false,
					maxSizeMB: 150,
					description: "选择第一个要合并的视频",
					required: true,
				},
				{
					name: "input2",
					label: "第二个视频",
					type: "file-input",
					accept: "video/*",
					multiple: false,
					maxSizeMB: 150,
					description: "选择第二个要合并的视频",
					required: true,
				},
				createOutput("mp4"),
			],
		},
		{
			name: "旋转视频",
			description: "使用自定义角度或方向旋转视频（支持表单化配置）",
			category: "视频处理",
			ffmpegArgs: [
				"-i",
				"{{input}}",
				"-vf",
				"transpose={{direction}}",
				"-c:a",
				"copy",
				"{{output}}",
			],
			requiresReencode: true,
			estimatedMemoryMB: 250,
			formSchema: [
				createInput(200),
				{
					name: "direction",
					label: "旋转方向",
					type: "select",
					defaultValue: "1",
					required: true,
					description: "选择视频旋转的方向",
					options: [
						{ label: "顺时针旋转 90°", value: "1" },
						{ label: "逆时针旋转 90°", value: "2" },
						{ label: "顺时针旋转 90° + 垂直翻转", value: "3" },
						{ label: "逆时针旋转 90° + 垂直翻转", value: "0" },
					],
				},
				createOutput("mp4"),
			],
		},
		{
			name: "视频缩放（自定义）",
			description: "自定义视频分辨率、码率和质量参数",
			category: "视频处理",
			ffmpegArgs: [
				"-i",
				"{{input}}",
				"-vf",
				"scale={{width}}:{{height}}",
				"-b:v",
				"{{bitrate}}k",
				"-crf",
				"{{quality}}",
				"-c:a",
				"copy",
				"{{output}}",
			],
			requiresReencode: true,
			estimatedMemoryMB: 300,
			formSchema: [
				createInput(200),
				{
					name: "width",
					label: "宽度（像素）",
					type: "number",
					defaultValue: 1280,
					min: 128,
					max: 3840,
					step: 2,
					required: true,
					description: "输出视频的宽度（必须是偶数）",
				},
				{
					name: "height",
					label: "高度（像素）",
					type: "number",
					defaultValue: 720,
					min: 128,
					max: 2160,
					step: 2,
					required: true,
					description: "输出视频的高度（必须是偶数）",
				},
				{
					name: "bitrate",
					label: "视频码率（kbps）",
					type: "slider",
					defaultValue: 2000,
					min: 500,
					max: 10000,
					step: 100,
					description: "视频比特率，值越高质量越好但文件越大",
				},
				{
					name: "quality",
					label: "CRF 质量",
					type: "slider",
					defaultValue: 23,
					min: 18,
					max: 35,
					step: 1,
					description: "CRF 值：18=最高质量，28=平衡，35=最低质量",
				},
				createOutput("mp4"),
			],
		},
	];

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
