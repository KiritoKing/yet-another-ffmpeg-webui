/**
 * Settings Configuration
 *
 * Single source of truth for all application settings.
 * Defines setting types, categories, and configurations used across desktop and mobile layouts.
 */

import type { LucideIcon } from "lucide-react";
import {
	Activity,
	Database,
	FileCode,
	Github,
	HardDrive,
	History,
	Info,
	Rocket,
	Settings2,
	Trash2,
	Zap,
} from "lucide-react";

/**
 * Setting component types
 */
export type SettingType =
	| "select" // Dropdown selection
	| "switch" // Toggle switch
	| "button" // Action button
	| "card" // Info/status card
	| "stats" // Statistics grid
	| "custom"; // Custom content

/**
 * Store binding for connecting settings to Zustand stores
 */
export interface StoreBinding {
	store: "ffmpegWeb" | "task" | "cdn" | "command";
	key: string; // State key to read
	setter?: string; // Action name to call
	transform?: (value: any) => any; // Value transformation
}

/**
 * Select option for dropdown settings
 */
export interface SelectOption {
	value: string;
	label: string;
}

/**
 * Individual setting configuration
 */
export interface SettingConfig {
	id: string; // Unique identifier
	type: SettingType;
	title: string;
	description?: string;
	icon?: LucideIcon;

	// Type-specific configuration
	options?: SelectOption[]; // For select
	action?: () => void | Promise<void>; // For button
	variant?: "default" | "outline" | "destructive" | "ghost" | "link"; // For button
	storeBinding?: StoreBinding; // Store connection
	disabled?: boolean; // Disabled state
	loading?: boolean; // Loading state

	// Custom render function for complex cases
	render?: (mode: "dialog" | "page") => React.ReactNode;
}

/**
 * Setting category containing multiple settings
 */
export interface SettingCategory {
	id: string;
	label: string;
	icon: LucideIcon;
	description: string;
	settings: SettingConfig[];
}

/**
 * Props passed to setting renderers
 */
export interface SettingsRendererContext {
	presetsCount: number;
	categoriesCount: number;
	storageSize: string;
	onResetCommands: () => void;
	onClearHistory: () => Promise<void>;
	onOpenCDNSelector: () => void;
	isClearing: boolean;
}

/**
 * All settings categories configuration
 * This is the single source of truth for all settings
 */
export const settingsCategories: SettingCategory[] = [
	{
		id: "general",
		label: "通用",
		icon: Settings2,
		description: "基本设置和默认行为",
		settings: [
			{
				id: "default-mode",
				type: "select",
				title: "默认加载模式",
				description: "选择 FFmpeg 的默认运行模式（需要重新加载生效）",
				storeBinding: {
					store: "ffmpegWeb",
					key: "savedMode",
					setter: "setSavedMode",
				},
				options: [
					{ value: "ask", label: "每次询问（推荐）" },
					{ value: "multi-thread", label: "多线程（性能最佳）" },
					{ value: "single-thread", label: "单线程（兼容性最好）" },
				],
			},
			{
				id: "show-init-dialog",
				type: "switch",
				title: "显示初始化对话框",
				description: "每次加载时显示模式选择对话框",
				storeBinding: {
					store: "ffmpegWeb",
					key: "showInitDialog",
					setter: "setShowInitDialog",
				},
			},
		],
	},
	{
		id: "performance",
		label: "性能",
		icon: Zap,
		description: "执行和队列配置",
		settings: [
			{
				id: "batch-size",
				type: "select",
				title: "队列并发数",
				description: "同时处理的任务数量（建议：1，避免内存溢出）",
				storeBinding: {
					store: "task",
					key: "queueConfig",
					setter: "setQueueConfig",
				},
				options: [
					{ value: "1", label: "1（推荐，最稳定）" },
					{ value: "2", label: "2" },
					{ value: "3", label: "3" },
					{ value: "4", label: "4" },
				],
			},
			{
				id: "auto-start-queue",
				type: "switch",
				title: "自动开始队列",
				description: "添加任务后自动开始处理队列",
				storeBinding: {
					store: "task",
					key: "queueConfig",
					setter: "setQueueConfig",
				},
			},
			{
				id: "performance-tips",
				type: "card",
				title: "性能优化建议",
				icon: Rocket,
			},
		],
	},
	{
		id: "storage",
		label: "存储",
		icon: Database,
		description: "数据管理和清理",
		settings: [
			{
				id: "storage-stats",
				type: "stats",
				title: "存储统计",
			},
			{
				id: "clear-history",
				type: "button",
				title: "清理任务历史",
				description: "删除所有已完成、失败和中止的任务记录",
				icon: Trash2,
				variant: "outline",
			},
			{
				id: "reset-presets",
				type: "button",
				title: "重置命令预设",
				description: "将所有命令预设恢复到初始状态，删除自定义命令",
				icon: Trash2,
				variant: "destructive",
			},
		],
	},
	{
		id: "cdn",
		label: "CDN",
		icon: Activity,
		description: "资源加载配置",
		settings: [
			{
				id: "cdn-status",
				type: "card",
				title: "当前 CDN",
			},
			{
				id: "open-cdn-config",
				type: "button",
				title: "打开 CDN 配置",
				icon: Activity,
				variant: "outline",
			},
			{
				id: "cdn-info",
				type: "card",
				title: "CDN 说明",
			},
		],
	},
	{
		id: "about",
		label: "关于",
		icon: Info,
		description: "应用信息",
		settings: [
			{
				id: "app-logo",
				type: "custom",
				title: "应用图标和标题",
			},
			{
				id: "github-link",
				type: "custom",
				title: "GitHub 链接",
				icon: Github,
			},
			{
				id: "version-info",
				type: "custom",
				title: "版本信息",
			},
			{
				id: "tech-stack",
				type: "custom",
				title: "技术栈",
			},
			{
				id: "features",
				type: "custom",
				title: "功能特性",
			},
			{
				id: "license",
				type: "custom",
				title: "开源信息",
			},
		],
	},
];
