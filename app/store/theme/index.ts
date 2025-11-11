/**
 * Theme Store
 * 主题状态管理 Store
 */

import { create } from "zustand";
import { defaultThemeState } from "./default-values";
import type { ResolvedTheme, Theme, ThemeStore } from "./types";

const STORAGE_KEY = "ffmpeg-easy-theme";

/**
 * 解析主题：将 'system' 解析为实际的 'light' 或 'dark'
 */
function resolveTheme(theme: Theme): ResolvedTheme {
	if (theme !== "system") {
		return theme;
	}

	// 在服务端或 window 不可用时，默认返回 light
	if (typeof window === "undefined") {
		return "light";
	}

	// 检测系统主题偏好
	const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
	return systemDark ? "dark" : "light";
}

/**
 * 应用主题到 DOM
 */
function applyTheme(resolved: ResolvedTheme): void {
	if (typeof document === "undefined") return;

	const root = document.documentElement;
	if (resolved === "dark") {
		root.classList.add("dark");
	} else {
		root.classList.remove("dark");
	}
}

/**
 * 从 localStorage 加载主题
 */
function loadThemeFromStorage(): Theme {
	if (typeof window === "undefined") return "system";

	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored === "light" || stored === "dark" || stored === "system") {
			return stored;
		}
	} catch (error) {
		console.warn("[ThemeStore] Failed to load theme from localStorage:", error);
	}

	return "system";
}

/**
 * 保存主题到 localStorage
 */
function saveThemeToStorage(theme: Theme): void {
	if (typeof window === "undefined") return;

	try {
		localStorage.setItem(STORAGE_KEY, theme);
	} catch (error) {
		console.warn("[ThemeStore] Failed to save theme to localStorage:", error);
	}
}

/**
 * 主题 Store
 */
export const useThemeStore = create<ThemeStore>((set, get) => ({
	// 初始状态
	...defaultThemeState,

	// 设置主题
	setTheme: (theme: Theme) => {
		const resolved = resolveTheme(theme);
		applyTheme(resolved);
		saveThemeToStorage(theme);

		set({
			theme,
			resolvedTheme: resolved,
		});
	},

	// 切换主题（循环：light → dark → system → light）
	toggleTheme: () => {
		const { theme } = get();
		const nextTheme: Theme =
			theme === "light" ? "dark" : theme === "dark" ? "system" : "light";
		get().setTheme(nextTheme);
	},

	// 初始化主题（在客户端挂载时调用）
	initializeTheme: () => {
		if (typeof window === "undefined") return;

		const theme = loadThemeFromStorage();
		const resolved = resolveTheme(theme);
		applyTheme(resolved);

		set({
			theme,
			resolvedTheme: resolved,
			isClient: true,
		});
	},
}));
