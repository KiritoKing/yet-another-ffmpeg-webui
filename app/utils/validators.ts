/**
 * validators.ts
 * 命令预设验证工具函数
 */

import type { CommandPreset } from "~/types/command";

/**
 * 验证命令预设的完整性和有效性
 * 返回错误信息数组，空数组表示验证通过
 */
export function validatePreset(
	preset: Partial<CommandPreset>,
	requireId = false,
): string[] {
	const errors: string[] = [];

	// 新建命令时可以不传 id，由外部逻辑生成；仅在 requireId=true 时强制校验
	if (requireId && (!preset.id || preset.id.trim() === "")) {
		errors.push("ID 不能为空");
	}

	if (!preset.name || preset.name.trim() === "") {
		errors.push("名称不能为空");
	}

	if (!preset.description || preset.description.trim() === "") {
		errors.push("描述不能为空");
	}

	if (!preset.category || preset.category.trim() === "") {
		errors.push("分类不能为空");
	}

	if (!Array.isArray(preset.ffmpegArgs) || preset.ffmpegArgs.length === 0) {
		errors.push("FFmpeg 参数不能为空");
	}

	// 如果有 formSchema，验证其有效性
	if (preset.formSchema) {
		if (!Array.isArray(preset.formSchema)) {
			errors.push("formSchema 必须是数组");
		} else {
			preset.formSchema.forEach((field, index) => {
				if (!field.name) {
					errors.push(`formSchema[${index}]: name 不能为空`);
				}
				if (!field.type) {
					errors.push(`formSchema[${index}]: type 不能为空`);
				}
			});
		}
	}

	return errors;
}

/**
 * 从命令参数中提取所有模板变量
 * （与 templates.ts 中的函数重复定义，避免循环依赖）
 */
function extractTemplateVariables(args: string[]): string[] {
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
 * 校验模板变量使用情况：
 * - unknown: 命令中使用但未在 formSchema 中声明
 * - unused: 在 formSchema 中声明但命令中未使用
 */
export function validateTemplateUsage(
	preset: Pick<CommandPreset, "ffmpegArgs" | "formSchema">,
): {
	unknown: string[];
	unused: string[];
} {
	const used = new Set(extractTemplateVariables(preset.ffmpegArgs));
	const declared = new Set((preset.formSchema || []).map((f) => f.name));

	const unknown: string[] = [];
	used.forEach((v: string) => {
		if (!declared.has(v)) unknown.push(v);
	});

	const unused: string[] = [];
	declared.forEach((v: string) => {
		if (!used.has(v)) unused.push(v);
	});

	return { unknown, unused };
}

/**
 * 检测命令是否需要重新编码（影响内存需求）
 */
export function detectRequiresReencode(args: string[]): boolean {
	// 如果包含 -c copy 或 -codec copy，则不需要重新编码
	for (let i = 0; i < args.length - 1; i++) {
		if ((args[i] === "-c" || args[i] === "-codec") && args[i + 1] === "copy") {
			return false;
		}
		if (args[i] === "-c:v" && args[i + 1] === "copy") {
			return false;
		}
	}

	// 检查是否有编码器参数（libx264, libvpx-vp9 等）
	const encoders = [
		"libx264",
		"libx265",
		"libvpx",
		"libvpx-vp9",
		"libaom-av1",
		"libtheora",
	];
	for (const arg of args) {
		if (encoders.some((enc) => arg.includes(enc))) {
			return true;
		}
	}

	// 检查滤镜参数（需要重新编码）
	if (
		args.includes("-vf") ||
		args.includes("-filter:v") ||
		args.includes("-filter_complex")
	) {
		return true;
	}

	// 默认假设需要重新编码
	return true;
}

/**
 * 估算命令的内存需求（MB）
 */
export function estimateMemoryRequirement(
	args: string[],
	requiresReencode: boolean,
): number {
	// 基础内存需求
	let baseMB = 50;

	if (requiresReencode) {
		// 重新编码需要更多内存
		baseMB = 200;

		// 检查是否有复杂滤镜
		if (args.includes("-filter_complex")) {
			baseMB += 150;
		} else if (args.includes("-vf") || args.includes("-filter:v")) {
			baseMB += 100;
		}

		// 检查编码器类型
		const heavyEncoders = ["libx265", "libaom-av1"];
		if (args.some((arg) => heavyEncoders.some((enc) => arg.includes(enc)))) {
			baseMB += 100;
		}
	} else {
		// 仅复制流，内存需求很小
		baseMB = 50;
	}

	return baseMB;
}

/**
 * 验证文件大小是否适合执行命令
 */
export function validateFileSize(
	files: File[],
	preset: CommandPreset,
): { valid: boolean; message?: string; recommendedMaxMB?: number } {
	const requiresReencode =
		preset.requiresReencode ?? detectRequiresReencode(preset.ffmpegArgs);
	const _estimatedMemoryMB =
		preset.estimatedMemoryMB ??
		estimateMemoryRequirement(preset.ffmpegArgs, requiresReencode);

	// 根据命令类型设置推荐的最大文件大小
	let recommendedMaxMB: number;
	if (requiresReencode) {
		// 重新编码：建议 < 200MB
		recommendedMaxMB = 200;
	} else {
		// 仅复制：可以处理更大的文件
		recommendedMaxMB = 500;
	}

	// 如果预设中手动指定了 maxSizeMB，使用该值
	const fileInputFields =
		preset.formSchema?.filter((f) => f.type === "file-input") || [];
	if (fileInputFields.length > 0 && fileInputFields[0].maxSizeMB) {
		recommendedMaxMB = fileInputFields[0].maxSizeMB;
	}

	// 检查所有文件
	const totalSizeMB = files.reduce(
		(sum, file) => sum + file.size / 1024 / 1024,
		0,
	);
	const maxFileSizeMB = Math.max(...files.map((f) => f.size / 1024 / 1024));

	if (maxFileSizeMB > recommendedMaxMB) {
		return {
			valid: false,
			message: `文件过大！单个文件最大 ${maxFileSizeMB.toFixed(
				1,
			)} MB，建议 < ${recommendedMaxMB} MB。${
				requiresReencode ? "此命令需要重新编码，内存需求较高。" : ""
			}`,
			recommendedMaxMB,
		};
	}

	// 检查总大小（针对多文件）
	if (files.length > 1 && totalSizeMB > recommendedMaxMB * 1.5) {
		return {
			valid: false,
			message: `文件总大小过大！总计 ${totalSizeMB.toFixed(1)} MB，建议 < ${(
				recommendedMaxMB * 1.5
			).toFixed(0)} MB。`,
			recommendedMaxMB,
		};
	}

	return {
		valid: true,
		recommendedMaxMB,
	};
}
