/**
 * utils/index.ts
 * 统一导出所有工具函数
 */

// 错误处理和文件名清理
export {
	detectUnsupportedOptions,
	formatErrorMessage,
	isRecoverableError,
	parseFFmpegError,
	sanitizeFilename,
	UNSUPPORTED_WASM_OPTIONS,
	validateAndSanitizeFilenames,
} from "./errorHandling";
// 文件字段工具
export {
	createMultiInputField,
	createOutputField,
	createSingleInputField,
	getFileInputFields,
	getFileOutputField,
} from "./fileHelpers";
// CLI 解析和导入导出
export {
	downloadJSON,
	exportPresetsToJSON,
	exportPresetToJSON,
	importPresetsFromJSON,
	parseCLICommand,
	uploadJSON,
} from "./parsers";
// 模板变量处理
export {
	extractNonFileValues,
	extractTemplateVariables,
	getDefaultFormValues,
	replaceTemplateVariables,
} from "./templates";
// 验证函数
export {
	detectRequiresReencode,
	estimateMemoryRequirement,
	validateFileSize,
	validatePreset,
	validateTemplateUsage,
} from "./validators";
