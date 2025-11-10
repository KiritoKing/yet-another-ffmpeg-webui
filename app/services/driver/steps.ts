import type { DriverStep } from "./index";

export const onboardingSteps: DriverStep[] = [
	{
		element: "#ffmpeg-toolbar",
		popover: {
			title: "欢迎使用 FFmpeg Easy！",
			description:
				"这是一个简单易用的在线视频处理工具，让复杂的FFmpeg命令变得简单直观。完全在浏览器中运行，文件不会上传到服务器。",
			side: "bottom",
		},
	},
	{
		element: "#command-panel",
		popover: {
			title: "命令预设",
			description:
				"这里提供了常用的视频处理命令预设，如格式转换、压缩、旋转等。点击即可选择，支持自定义命令。",
			side: "right",
		},
	},
	{
		element: "#queue-panel",
		popover: {
			title: "执行面板",
			description:
				"选择命令后，在这里设置参数、上传文件并执行处理。支持批量处理多个文件，实时查看处理进度。",
			side: "left",
		},
	},
	{
		element: "#task-history",
		popover: {
			title: "任务历史",
			description:
				"查看所有已完成的任务记录，支持搜索、筛选和重新执行之前的任务。",
			side: "top",
		},
	},
	{
		element: "#settings-button",
		popover: {
			title: "设置选项",
			description:
				"在这里可以切换运行模式（单线程/多线程）、选择CDN源、导入导出预设等高级设置。",
			side: "bottom",
		},
	},
	{
		element: "#help-button",
		popover: {
			title: "需要帮助？",
			description:
				"点击这里查看新手引导、高级功能说明，或访问GitHub仓库获取更多支持。",
			side: "bottom",
		},
	},
];

export const advancedSteps: DriverStep[] = [
	{
		element: "#custom-form-editor",
		popover: {
			title: "自定义表单",
			description:
				"为命令创建可视化表单，让参数设置更直观。支持文本、数字、滑块等多种字段类型。",
			side: "right",
		},
	},
	{
		element: "#batch-upload",
		popover: {
			title: "批量上传",
			description: "支持拖拽或选择多个文件，系统会自动为每个文件创建处理任务。",
			side: "bottom",
		},
	},
	{
		element: "#task-history",
		popover: {
			title: "任务历史",
			description: "查看所有已完成的任务记录，支持搜索、筛选和重新执行。",
			side: "top",
		},
	},
];

export const firstTimeSteps: DriverStep[] = [
	{
		element: "body",
		popover: {
			title: "首次使用提示",
			description:
				"建议首次使用时选择单线程模式，确保兼容性。处理大文件时可以考虑多线程模式。",
			side: "bottom",
		},
	},
];
