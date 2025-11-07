/**
 * fileHelpers.ts
 * 文件字段配置工具函数
 */

import type { CommandPreset, FormField } from "~/types/command";

/**
 * 获取文件输入字段的配置
 */
export function getFileInputFields(preset: CommandPreset): FormField[] {
	return preset.formSchema?.filter((f) => f.type === "file-input") || [];
}

/**
 * 获取文件输出字段的配置
 */
export function getFileOutputField(
	preset: CommandPreset,
): FormField | undefined {
	return preset.formSchema?.find((f) => f.type === "file-output");
}

/**
 * 创建标准的单输入文件字段
 */
export function createSingleInputField(
	name = "input",
	accept = "video/*",
	maxSizeMB?: number,
	description?: string,
): FormField {
	return {
		name,
		label: "输入文件",
		type: "file-input",
		accept,
		multiple: false,
		maxSizeMB,
		description: description || "选择要处理的视频文件",
		required: true,
	};
}

/**
 * 创建标准的多输入文件字段
 */
export function createMultiInputField(
	name = "inputs",
	accept = "video/*",
	maxFiles = 10,
	maxSizeMB?: number,
	description?: string,
): FormField {
	return {
		name,
		label: "输入文件",
		type: "file-input",
		accept,
		multiple: true,
		maxFiles,
		maxSizeMB,
		description: description || `选择要处理的视频文件（最多 ${maxFiles} 个）`,
		required: true,
	};
}

/**
 * 创建标准的输出文件字段
 */
export function createOutputField(
	name = "output",
	defaultValue = "output.mp4",
	defaultExtension = "mp4",
	mimeType?: string,
	description?: string,
): FormField {
	return {
		name,
		label: "输出文件名",
		type: "file-output",
		defaultValue,
		defaultExtension,
		mimeType,
		description: description || "输出文件的名称",
		required: true,
	};
}
