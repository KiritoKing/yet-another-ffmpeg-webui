/**
 * parsers.ts
 * CLI 命令解析和 JSON 导入导出工具
 */

import type { CommandPreset, FormField } from "~/types/command";

/**
 * 解析 FFmpeg CLI 命令为命令预设对象
 *
 * 支持的格式：
 * - ffmpeg -i input.mp4 output.mp4
 * - ffmpeg -i input.mp4 -c:v libx264 -crf 23 output.mp4
 *
 * 自动识别：
 * - 输入文件（-i 参数）
 * - 输出文件（最后一个参数）
 * - 常用参数（scale, bitrate, crf, transpose等）
 */
export function parseCLICommand(cliCommand: string): Partial<CommandPreset> {
	// 移除开头的 "ffmpeg " 前缀
	let cmd = cliCommand.trim();
	if (cmd.startsWith("ffmpeg ")) {
		cmd = cmd.substring(7);
	}

	// 简单的命令行解析（支持引号）
	const args: string[] = [];
	let current = "";
	let inQuote = false;
	let quoteChar = "";

	for (let i = 0; i < cmd.length; i++) {
		const char = cmd[i];
		if ((char === '"' || char === "'") && !inQuote) {
			inQuote = true;
			quoteChar = char;
		} else if (char === quoteChar && inQuote) {
			inQuote = false;
			quoteChar = "";
		} else if (char === " " && !inQuote) {
			if (current) {
				args.push(current);
				current = "";
			}
		} else {
			current += char;
		}
	}
	if (current) {
		args.push(current);
	}

	// 查找输入文件（-i 参数）
	const inputFiles: string[] = [];
	for (let i = 0; i < args.length - 1; i++) {
		if (args[i] === "-i") {
			inputFiles.push(args[i + 1]);
		}
	}

	// 查找输出文件（最后一个参数，且不以 - 开头）
	let outputFile = "";
	if (args.length > 0) {
		const last = args[args.length - 1];
		if (!last.startsWith("-")) {
			outputFile = last;
		}
	}

	// 提取纯参数部分（去掉输入输出文件）
	const ffmpegArgs: string[] = [];
	for (let i = 0; i < args.length; i++) {
		const arg = args[i];
		// 跳过 -i 和其后的文件名
		if (arg === "-i") {
			i++; // 跳过文件名
			continue;
		}
		// 跳过最后的输出文件
		if (i === args.length - 1 && arg === outputFile) {
			continue;
		}
		ffmpegArgs.push(arg);
	}

	// 构建 formSchema
	const formSchema: FormField[] = [];

	// 输入文件字段
	if (inputFiles.length === 1) {
		formSchema.push({
			name: "input",
			label: "输入文件",
			type: "file-input",
			accept: "video/*",
			multiple: false,
			description: "选择要处理的视频文件",
			required: true,
		});
	} else if (inputFiles.length > 1) {
		formSchema.push({
			name: "inputs",
			label: "输入文件",
			type: "file-input",
			accept: "video/*",
			multiple: true,
			maxFiles: inputFiles.length,
			description: `选择 ${inputFiles.length} 个输入文件`,
			required: true,
		});
	}

	// 智能识别常用参数并生成对应的表单字段

	// 1. 识别视频缩放（-vf scale=width:height 或 -s WxH）
	const scaleMatch = ffmpegArgs.findIndex((arg) =>
		/scale=(\d+):(\d+)|^(\d+)x(\d+)$/.test(arg),
	);
	if (scaleMatch !== -1) {
		const scaleArg = ffmpegArgs[scaleMatch];
		const match = scaleArg.match(/scale=(\d+):(\d+)|^(\d+)x(\d+)$/);
		if (match) {
			const width = match[1] || match[3];
			const height = match[2] || match[4];
			formSchema.push({
				name: "width",
				label: "宽度",
				type: "number",
				defaultValue: Number.parseInt(width),
				min: 128,
				max: 7680,
				description: "输出视频宽度（像素）",
			});
			formSchema.push({
				name: "height",
				label: "高度",
				type: "number",
				defaultValue: Number.parseInt(height),
				min: 128,
				max: 4320,
				description: "输出视频高度（像素）",
			});
			// 替换原参数为模板
			ffmpegArgs[scaleMatch] = "scale={{width}}:{{height}}";
		}
	}

	// 2. 识别视频比特率（-b:v）
	const bitrateIdx = ffmpegArgs.indexOf("-b:v");
	if (bitrateIdx !== -1 && bitrateIdx < ffmpegArgs.length - 1) {
		const bitrateValue = ffmpegArgs[bitrateIdx + 1];
		const match = bitrateValue.match(/^(\d+)([kKmM])?$/);
		if (match) {
			let bitrate = Number.parseInt(match[1]);
			const unit = match[2]?.toLowerCase();
			if (unit === "k") {
				// 已是 kbps
			} else if (unit === "m") {
				bitrate *= 1000; // Mbps -> kbps
			}
			formSchema.push({
				name: "bitrate",
				label: "视频比特率 (kbps)",
				type: "number",
				defaultValue: bitrate,
				min: 100,
				max: 50000,
				description: "输出视频比特率",
			});
			// 替换为模板
			ffmpegArgs[bitrateIdx + 1] = "{{bitrate}}k";
		}
	}

	// 3. 识别 CRF 质量（-crf）
	const crfIdx = ffmpegArgs.indexOf("-crf");
	if (crfIdx !== -1 && crfIdx < ffmpegArgs.length - 1) {
		const crfValue = Number.parseInt(ffmpegArgs[crfIdx + 1]);
		if (!Number.isNaN(crfValue)) {
			formSchema.push({
				name: "crf",
				label: "CRF 质量",
				type: "slider",
				defaultValue: crfValue,
				min: 0,
				max: 51,
				step: 1,
				description: "值越小质量越高（0-51，推荐 18-28）",
			});
			// 替换为模板
			ffmpegArgs[crfIdx + 1] = "{{crf}}";
		}
	}

	// 4. 识别旋转（-vf transpose）
	const transposeMatch = ffmpegArgs.findIndex((arg) =>
		/transpose=(\d)/.test(arg),
	);
	if (transposeMatch !== -1) {
		const match = ffmpegArgs[transposeMatch].match(/transpose=(\d)/);
		if (match) {
			const direction = match[1];
			formSchema.push({
				name: "direction",
				label: "旋转方向",
				type: "select",
				defaultValue: direction,
				options: [
					{ value: "0", label: "90° 逆时针 + 垂直翻转" },
					{ value: "1", label: "90° 顺时针" },
					{ value: "2", label: "90° 逆时针" },
					{ value: "3", label: "90° 顺时针 + 垂直翻转" },
				],
				description: "选择视频旋转方向",
			});
			// 替换为模板
			ffmpegArgs[transposeMatch] = "transpose={{direction}}";
		}
	}

	// 输出文件字段
	if (outputFile) {
		const ext = outputFile.split(".").pop() || "mp4";
		formSchema.push({
			name: "output",
			label: "输出文件名",
			type: "file-output",
			defaultValue: outputFile,
			defaultExtension: ext,
			description: "输出文件的名称",
			required: true,
		});
	}

	// 生成命令名称和描述
	let name = "自定义命令";
	let description = `从 CLI 导入: ${cliCommand.substring(0, 50)}${
		cliCommand.length > 50 ? "..." : ""
	}`;

	// 根据参数智能生成名称
	if (ffmpegArgs.includes("-vf") && ffmpegArgs.join(" ").includes("scale")) {
		name = "视频缩放";
		description = "调整视频分辨率";
	} else if (ffmpegArgs.includes("transpose")) {
		name = "旋转视频";
		description = "旋转视频方向";
	} else if (ffmpegArgs.includes("-c") && ffmpegArgs.includes("copy")) {
		name = "格式转换（无重编码）";
		description = "快速转换容器格式";
	} else if (ffmpegArgs.includes("-c:v")) {
		name = "视频编码";
		description = "使用指定编码器重新编码视频";
	}

	return {
		name,
		description,
		category: "自定义",
		ffmpegArgs,
		formSchema: formSchema.length > 0 ? formSchema : undefined,
		requiresReencode: !ffmpegArgs.includes("copy"),
	};
}

/**
 * 导出命令预设数组为 JSON 字符串
 */
export function exportPresetsToJSON(presets: CommandPreset[]): string {
	return JSON.stringify(presets, null, 2);
}

/**
 * 从 JSON 字符串导入命令预设数组
 * 返回成功导入的预设和错误信息
 */
export function importPresetsFromJSON(json: string): {
	presets: CommandPreset[];
	errors: string[];
} {
	try {
		const parsed = JSON.parse(json);
		if (!Array.isArray(parsed)) {
			return {
				presets: [],
				errors: ["JSON 格式错误：预期为数组"],
			};
		}

		const presets: CommandPreset[] = [];
		const errors: string[] = [];

		parsed.forEach((item, index) => {
			// 基本字段验证
			if (!item.id || typeof item.id !== "string") {
				errors.push(`第 ${index + 1} 项：缺少 id 字段`);
				return;
			}
			if (!item.name || typeof item.name !== "string") {
				errors.push(`第 ${index + 1} 项：缺少 name 字段`);
				return;
			}
			if (!item.description || typeof item.description !== "string") {
				errors.push(`第 ${index + 1} 项：缺少 description 字段`);
				return;
			}
			if (!item.category || typeof item.category !== "string") {
				errors.push(`第 ${index + 1} 项：缺少 category 字段`);
				return;
			}
			if (!Array.isArray(item.ffmpegArgs)) {
				errors.push(`第 ${index + 1} 项：ffmpegArgs 必须是数组`);
				return;
			}

			// formSchema 验证（可选）
			if (item.formSchema !== undefined && !Array.isArray(item.formSchema)) {
				errors.push(`第 ${index + 1} 项：formSchema 必须是数组`);
				return;
			}

			// 构建有效的 CommandPreset
			const preset: CommandPreset = {
				id: item.id,
				name: item.name,
				description: item.description,
				category: item.category,
				ffmpegArgs: item.ffmpegArgs,
				formSchema: item.formSchema,
				requiresReencode: item.requiresReencode,
				estimatedMemoryMB: item.estimatedMemoryMB,
				createdAt: item.createdAt || new Date().toISOString(),
				updatedAt: item.updatedAt || new Date().toISOString(),
			};
			presets.push(preset);
		});

		return {
			presets,
			errors,
		};
	} catch (err) {
		return {
			presets: [],
			errors: [
				`JSON 解析失败: ${err instanceof Error ? err.message : String(err)}`,
			],
		};
	}
}

/**
 * 导出单个命令预设为 JSON 字符串
 */
export function exportPresetToJSON(preset: CommandPreset): string {
	return JSON.stringify(preset, null, 2);
}

/**
 * 下载 JSON 数据为文件
 */
export function downloadJSON(filename: string, data: string) {
	const blob = new Blob([data], { type: "application/json" });
	const url = URL.createObjectURL(blob);
	const link = document.createElement("a");
	link.href = url;
	link.download = filename;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	URL.revokeObjectURL(url);
}

/**
 * 上传并读取 JSON 文件内容
 */
export function uploadJSON(): Promise<string> {
	return new Promise((resolve, reject) => {
		const input = document.createElement("input");
		input.type = "file";
		input.accept = ".json,application/json";

		input.onchange = (e) => {
			const file = (e.target as HTMLInputElement).files?.[0];
			if (!file) {
				reject(new Error("未选择文件"));
				return;
			}

			const reader = new FileReader();
			reader.onload = (event) => {
				const content = event.target?.result as string;
				resolve(content);
			};
			reader.onerror = () => {
				reject(new Error("文件读取失败"));
			};
			reader.readAsText(file);
		};

		input.click();
	});
}
