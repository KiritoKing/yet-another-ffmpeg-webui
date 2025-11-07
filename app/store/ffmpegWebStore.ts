import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CommandPreset } from "../types/command";

/**
 * FFmpeg Web 页面状态管理
 * 管理页面的所有 UI 状态和数据
 */
interface FFmpegWebState {
	// 客户端/加载状态
	isClient: boolean;
	loaded: boolean;
	loading: boolean;
	useMultiThread: boolean;
	showInitDialog: boolean;
	savedMode: "multi-thread" | "single-thread" | null;

	// 执行状态
	processing: boolean;
	progress: number;
	currentStep: string;

	// 命令预设状态
	selectedPreset: CommandPreset | null;
	editingPreset: CommandPreset | null;
	selectedCategories: Set<string>;

	// 对话框状态
	showEditor: boolean;
	showCLIImport: boolean;
	showSettings: boolean;
	showResetConfirm: boolean;

	// 表单和数据
	cliCommand: string;
	outputUrl: string;
	copiedCommand: boolean;
	formValues: Record<string, string | number | boolean | File | File[]>;

	// Actions
	setIsClient: (isClient: boolean) => void;
	setLoaded: (loaded: boolean) => void;
	setLoading: (loading: boolean) => void;
	setUseMultiThread: (useMultiThread: boolean) => void;
	setShowInitDialog: (show: boolean) => void;
	setSavedMode: (mode: "multi-thread" | "single-thread" | null) => void;

	setProcessing: (processing: boolean) => void;
	setProgress: (progress: number) => void;
	setCurrentStep: (currentStep: string) => void;

	setSelectedPreset: (preset: CommandPreset | null) => void;
	setEditingPreset: (preset: CommandPreset | null) => void;
	setSelectedCategories: (categories: Set<string>) => void;

	setShowEditor: (show: boolean) => void;
	setShowCLIImport: (show: boolean) => void;
	setShowSettings: (show: boolean) => void;
	setShowResetConfirm: (show: boolean) => void;

	setCliCommand: (command: string) => void;
	setOutputUrl: (url: string) => void;
	setCopiedCommand: (copied: boolean) => void;
	setFormValues: (
		values: Record<string, string | number | boolean | File | File[]>,
	) => void;
	updateFormValue: (
		key: string,
		value: string | number | boolean | File | File[],
	) => void;

	// 重置方法
	resetExecutionState: () => void;
	resetAll: () => void;
}

export const useFFmpegWebStore = create<FFmpegWebState>()(
	persist(
		(set) => ({
			// 初始状态
			isClient: false,
			loaded: false,
			loading: false,
			useMultiThread: typeof SharedArrayBuffer !== "undefined",
			showInitDialog: false,
			savedMode: null,

			processing: false,
			progress: 0,
			currentStep: "就绪",

			selectedPreset: null,
			editingPreset: null,
			selectedCategories: new Set(),

			showEditor: false,
			showCLIImport: false,
			showSettings: false,
			showResetConfirm: false,

			cliCommand: "",
			outputUrl: "",
			copiedCommand: false,
			formValues: {},

			// Actions
			setIsClient: (isClient) => set({ isClient }),
			setLoaded: (loaded) => set({ loaded }),
			setLoading: (loading) => set({ loading }),
			setUseMultiThread: (useMultiThread) => set({ useMultiThread }),
			setShowInitDialog: (show) => set({ showInitDialog: show }),
			setSavedMode: (mode) => set({ savedMode: mode }),

			setProcessing: (processing) => set({ processing }),
			setProgress: (progress) => set({ progress }),
			setCurrentStep: (currentStep) => set({ currentStep }),

			setSelectedPreset: (preset) => set({ selectedPreset: preset }),
			setEditingPreset: (preset) => set({ editingPreset: preset }),
			setSelectedCategories: (categories) =>
				set({ selectedCategories: categories }),

			setShowEditor: (show) => set({ showEditor: show }),
			setShowCLIImport: (show) => set({ showCLIImport: show }),
			setShowSettings: (show) => set({ showSettings: show }),
			setShowResetConfirm: (show) => set({ showResetConfirm: show }),

			setCliCommand: (command) => set({ cliCommand: command }),
			setOutputUrl: (url) => set({ outputUrl: url }),
			setCopiedCommand: (copied) => set({ copiedCommand: copied }),
			setFormValues: (values) => set({ formValues: values }),
			updateFormValue: (key, value) =>
				set((state) => ({
					formValues: { ...state.formValues, [key]: value },
				})),

			// 重置执行状态
			resetExecutionState: () =>
				set({
					processing: false,
					progress: 0,
					currentStep: "就绪",
					outputUrl: "",
				}),

			// 重置所有状态
			resetAll: () =>
				set({
					loaded: false,
					loading: false,
					processing: false,
					progress: 0,
					currentStep: "就绪",
					selectedPreset: null,
					editingPreset: null,
					showEditor: false,
					showCLIImport: false,
					showSettings: false,
					showResetConfirm: false,
					cliCommand: "",
					outputUrl: "",
					copiedCommand: false,
					formValues: {},
				}),
		}),
		{
			name: "ffmpeg-web-storage",
			// 只持久化用户偏好
			partialize: (state) => ({
				savedMode: state.savedMode,
			}),
		},
	),
);
