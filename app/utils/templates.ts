/**
 * templates.ts
 * 模板变量处理工具函数
 */

import type { CommandPreset } from "~/types/command";

/**
 * 从命令参数中提取所有模板变量
 * 例如: ['-vf', 'scale={{width}}:{{height}}'] => ['width', 'height']
 */
export function extractTemplateVariables(args: string[]): string[] {
	const vars = new Set<string>();
	const re = /\{\{(\w+)\}\}/g;
	for (const a of args) {
		let m: RegExpExecArray | null;
		// biome-ignore lint/suspicious/noAssignInExpressions: false positive
		while ((m = re.exec(a))) {
			vars.add(m[1]);
		}
	}
	return Array.from(vars);
}

/**
 * 从 formValues 中提取非文件参数用于模板替换
 */
export function extractNonFileValues(
	values: Record<string, string | number | boolean | File | File[]>,
): Record<string, string | number | boolean> {
	const result: Record<string, string | number | boolean> = {};
	Object.keys(values).forEach((key) => {
		const value = values[key];
		if (
			typeof value === "string" ||
			typeof value === "number" ||
			typeof value === "boolean"
		) {
			result[key] = value;
		} else if (value instanceof File) {
			result[key] = value.name; // 文件转为文件名字符串
		} else if (
			Array.isArray(value) &&
			value.length > 0 &&
			value[0] instanceof File
		) {
			result[key] = (value as File[]).map((f) => f.name).join(" "); // 多文件转为空格分隔的文件名
		}
	});
	return result;
}

/**
 * 替换命令中的模板变量
 * 例如: ['-vf', 'transpose={{direction}}'] + {direction: '1'} => ['-vf', 'transpose=1']
 */
export function replaceTemplateVariables(
	args: string[],
	values: Record<string, string | number | boolean>,
): string[] {
	return args.map((arg) => {
		let result = arg;
		// 匹配 {{variableName}} 格式
		const matches = arg.matchAll(/\{\{(\w+)\}\}/g);
		for (const match of matches) {
			const varName = match[1];
			const value = values[varName];
			if (value !== undefined) {
				result = result.replace(match[0], String(value));
			}
		}
		return result;
	});
}

/**
 * 从命令预设的表单定义中获取默认值
 */
export function getDefaultFormValues(
	preset: CommandPreset,
): Record<string, string | number | boolean> {
	if (!preset.formSchema) return {};

	const values: Record<string, string | number | boolean> = {};
	preset.formSchema.forEach((field) => {
		if (
			field.defaultValue !== undefined &&
			field.type !== "file-input" &&
			field.type !== "file-output"
		) {
			values[field.name] = field.defaultValue;
		}
	});
	return values;
}
