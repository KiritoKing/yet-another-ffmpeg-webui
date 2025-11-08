import type { CommandPreset } from "../../types/command";

/**
 * FFmpeg Web Store State Interface
 * 管理页面的所有 UI 状态和数据
 */
export interface FFmpegWebState {
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
	resetAll: () => void;
}
