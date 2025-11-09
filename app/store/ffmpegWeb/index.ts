import { create } from "zustand";
import { persist } from "zustand/middleware";
import { FFmpegService } from "../../services/ffmpegService";
import type { FFmpegWebState } from "./types";

/**
 * FFmpeg Web Store
 * 管理 FFmpeg Web 页面的状态
 */
export const useFFmpegWebStore = create<FFmpegWebState>()(
	persist(
		(set) => ({
			// 初始状态
			isClient: false,
			loaded: false,
			loading: false,
			// 初始化时基于更严格的检测（需 crossOriginIsolated=true）决定默认多线程偏好
			useMultiThread: FFmpegService.isMultiThreadSupported(),
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
