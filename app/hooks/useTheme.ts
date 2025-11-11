/**
 * useTheme Hook
 * 主题初始化和事件监听 Hook
 */

import { useEffect } from "react";
import { useThemeStore } from "~/store/theme";

/**
 * 主题 Hook - 处理主题初始化、系统主题监听和跨标签页同步
 */
export function useTheme() {
	const { theme, initializeTheme, setTheme } = useThemeStore();

	useEffect(() => {
		// 初始化主题
		initializeTheme();

		// 监听系统主题变化
		const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
		const handleSystemThemeChange = (e: MediaQueryListEvent) => {
			// 只有在用户选择 'system' 模式时才响应系统主题变化
			const currentTheme = useThemeStore.getState().theme;
			if (currentTheme === "system") {
				const resolved = e.matches ? "dark" : "light";
				const root = document.documentElement;
				if (resolved === "dark") {
					root.classList.add("dark");
				} else {
					root.classList.remove("dark");
				}
				useThemeStore.setState({ resolvedTheme: resolved });
			}
		};

		// 监听 localStorage 变化（跨标签页同步）
		const handleStorageChange = (e: StorageEvent) => {
			if (e.key === "ffmpeg-easy-theme" && e.newValue) {
				const newTheme = e.newValue;
				if (
					newTheme === "light" ||
					newTheme === "dark" ||
					newTheme === "system"
				) {
					setTheme(newTheme);
				}
			}
		};

		// 添加事件监听器
		mediaQuery.addEventListener("change", handleSystemThemeChange);
		window.addEventListener("storage", handleStorageChange);

		// 清理事件监听器
		return () => {
			mediaQuery.removeEventListener("change", handleSystemThemeChange);
			window.removeEventListener("storage", handleStorageChange);
		};
	}, [initializeTheme, setTheme]);

	return {
		theme,
		setTheme,
		toggleTheme: useThemeStore.getState().toggleTheme,
	};
}
