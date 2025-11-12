/**
 * Theme Store Types
 * 主题状态管理类型定义
 */

export type Theme = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

/**
 * 主题状态接口
 */
export interface ThemeState {
	/** 用户选择的主题模式 */
	theme: Theme;
	/** 解析后的实际主题（system 会被解析为 light 或 dark） */
	resolvedTheme: ResolvedTheme;
	/** 是否在客户端环境 */
	isClient: boolean;
}

/**
 * 主题操作接口
 */
export interface ThemeActions {
	/** 设置主题 */
	setTheme: (theme: Theme) => void;
	/** 切换主题（循环切换：light → dark → system → light） */
	toggleTheme: () => void;
	/** 初始化主题（在客户端挂载时调用） */
	initializeTheme: () => void;
}

/**
 * 主题 Store 接口
 */
export interface ThemeStore extends ThemeState, ThemeActions {}
