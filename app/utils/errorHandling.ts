import type { ErrorType, TaskError } from "../types/task";

/**
 * FFmpeg 常见错误模式和恢复建议
 */
const ERROR_PATTERNS: Array<{
	pattern: RegExp;
	type: ErrorType;
	message: string;
	suggestions: string[];
}> = [
	// 文件相关错误
	{
		pattern: /ENOENT|No such file/i,
		type: "recoverable",
		message: "文件未找到或无法访问",
		suggestions: [
			"检查文件是否已正确上传",
			"确认文件名不包含特殊字符",
			"尝试重新选择文件",
		],
	},
	{
		pattern: /Invalid data found|moov atom not found/i,
		type: "recoverable",
		message: "文件格式无效或损坏",
		suggestions: [
			"检查输入文件是否完整",
			"尝试使用其他视频文件",
			"使用视频修复工具预处理文件",
		],
	},

	// 内存相关错误
	{
		pattern: /Out of memory|Cannot allocate memory|bad_alloc/i,
		type: "non-recoverable",
		message: "内存不足，无法处理当前文件",
		suggestions: [
			"减小输入文件大小（建议 < 200MB）",
			"降低输出分辨率或码率",
			"使用 -c copy 模式避免重新编码",
			"关闭其他占用内存的标签页",
			"重新加载 FFmpeg 后再试",
		],
	},
	{
		pattern: /RuntimeError|Aborted/i,
		type: "non-recoverable",
		message: "WebAssembly 运行时错误",
		suggestions: [
			"文件可能过大或编码过于复杂",
			"尝试重新加载 FFmpeg",
			"使用更简单的转换参数",
			"考虑分段处理视频",
		],
	},

	// 编码相关错误
	{
		pattern: /Unknown encoder|Encoder.*not found/i,
		type: "recoverable",
		message: "指定的编码器不可用",
		suggestions: [
			"WebAssembly 版本不支持某些编码器",
			"使用 libx264（H.264）或 libvpx（VP8/VP9）",
			"查看支持的编码器列表",
		],
	},
	{
		pattern: /Option.*not found|Unrecognized option/i,
		type: "recoverable",
		message: "FFmpeg 参数不支持",
		suggestions: [
			"某些高级参数在 WebAssembly 版本中不可用",
			"简化命令参数",
			"参考文档中的示例命令",
		],
	},

	// 格式相关错误
	{
		pattern: /Unable to find a suitable output format/i,
		type: "recoverable",
		message: "不支持的输出格式",
		suggestions: [
			"使用常见格式：MP4, WebM, AVI, MKV",
			"检查输出文件扩展名是否正确",
		],
	},

	// 中文文件名问题
	{
		pattern: /[\u4e00-\u9fa5]+/,
		type: "recoverable",
		message: "文件名包含中文字符可能导致问题",
		suggestions: ["建议使用英文文件名", "系统会自动处理文件名"],
	},

	// 空格文件名问题
	{
		pattern: /\s+/,
		type: "recoverable",
		message: "文件名包含空格可能导致问题",
		suggestions: ["建议使用下划线或连字符代替空格", "系统会自动处理文件名"],
	},
];

/**
 * WASM 不支持的 FFmpeg 指令
 */
export const UNSUPPORTED_WASM_OPTIONS = [
	// 硬件加速相关
	"-hwaccel",
	"-hwaccel_device",
	"-hwaccel_output_format",
	"-vaapi_device",
	"-init_hw_device",
	"-filter_hw_device",

	// 多线程相关（部分）
	"-threads", // 在某些情况下可能不支持或效果有限

	// 网络相关
	"-protocol_whitelist",
	"-rtsp_transport",
	"-tcp",
	"-udp",

	// 设备相关
	"-f dshow", // DirectShow
	"-f avfoundation", // macOS
	"-f v4l2", // Linux
	"-f gdigrab", // Windows screen capture

	// 字幕相关（某些复杂操作）
	"-fix_sub_duration",
	"-canvas_size",
];

/**
 * 检查命令是否包含不支持的选项
 */
export function detectUnsupportedOptions(args: string[]): string[] {
	const unsupported: string[] = [];

	for (const arg of args) {
		for (const option of UNSUPPORTED_WASM_OPTIONS) {
			if (arg === option || arg.startsWith(option)) {
				unsupported.push(option);
			}
		}
	}

	return [...new Set(unsupported)]; // 去重
}

/**
 * 清理文件名：移除中文字符和空格
 */
export function sanitizeFilename(filename: string): string {
	// 提取文件名和扩展名
	const lastDotIndex = filename.lastIndexOf(".");
	const name = lastDotIndex > 0 ? filename.slice(0, lastDotIndex) : filename;
	const ext = lastDotIndex > 0 ? filename.slice(lastDotIndex) : "";

	// 清理文件名：
	// 1. 移除中文字符
	// 2. 空格替换为下划线
	// 3. 移除特殊字符
	let sanitized = name
		.replace(/[\u4e00-\u9fa5]+/g, "") // 移除中文
		.replace(/\s+/g, "_") // 空格转下划线
		.replace(/[^\w\-_.]/g, ""); // 只保留字母、数字、-、_、.

	// 如果清理后为空，使用时间戳
	if (!sanitized) {
		sanitized = `file_${Date.now()}`;
	}

	return sanitized + ext;
}

/**
 * 验证并清理文件名列表
 */
export function validateAndSanitizeFilenames(files: File[]): Array<{
	original: File;
	sanitized: string;
	warnings: string[];
}> {
	return files.map((file) => {
		const warnings: string[] = [];
		const sanitized = sanitizeFilename(file.name);

		// 检测中文
		if (/[\u4e00-\u9fa5]+/.test(file.name)) {
			warnings.push("文件名包含中文字符，已自动转换");
		}

		// 检测空格
		if (/\s+/.test(file.name)) {
			warnings.push("文件名包含空格，已转换为下划线");
		}

		// 检测特殊字符
		if (/[^\w\-_.\s\u4e00-\u9fa5]/.test(file.name)) {
			warnings.push("文件名包含特殊字符，已移除");
		}

		return { original: file, sanitized, warnings };
	});
}

/**
 * 解析 FFmpeg 错误并生成友好的错误信息
 */
export function parseFFmpegError(error: unknown): TaskError {
	const errorStr = error instanceof Error ? error.message : String(error);

	// 尝试匹配已知错误模式
	for (const { pattern, type, message, suggestions } of ERROR_PATTERNS) {
		if (pattern.test(errorStr)) {
			return {
				type,
				message,
				originalError: errorStr,
				recoverySuggestions: suggestions,
				timestamp: Date.now(),
			};
		}
	}

	// 未知错误
	return {
		type: "non-recoverable",
		message: "未知错误",
		originalError: errorStr,
		recoverySuggestions: [
			"检查输入文件是否有效",
			"尝试使用更简单的命令参数",
			"重新加载 FFmpeg 后再试",
			"如果问题持续，请报告此错误",
		],
		timestamp: Date.now(),
	};
}

/**
 * 格式化错误信息为用户友好的字符串
 */
export function formatErrorMessage(error: TaskError): string {
	let message = `❌ ${error.message}`;

	if (error.recoverySuggestions && error.recoverySuggestions.length > 0) {
		message += "\n\n💡 建议：\n";
		message += error.recoverySuggestions
			.map((s, i) => `${i + 1}. ${s}`)
			.join("\n");
	}

	if (error.type === "non-recoverable") {
		message += "\n\n⚠️ 这是一个不可恢复的错误，建议重新加载 FFmpeg。";
	}

	return message;
}

/**
 * 检查错误是否可恢复
 */
export function isRecoverableError(error: TaskError): boolean {
	return error.type === "recoverable";
}
