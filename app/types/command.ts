// JSON Schema 表单字段定义
export interface FormField {
	name: string; // 字段名称，用于在参数中替换 {{fieldName}}
	label: string; // 显示标签
	type:
		| "text"
		| "number"
		| "select"
		| "slider"
		| "checkbox"
		| "file-input"
		| "file-output"; // 字段类型
	defaultValue?: string | number | boolean; // 默认值
	placeholder?: string; // 占位符
	description?: string; // 字段描述
	required?: boolean; // 是否必填
	min?: number; // 最小值（number/slider）
	max?: number; // 最大值（number/slider）
	step?: number; // 步长（number/slider）
	options?: Array<{ label: string; value: string }>; // 选项（select）

	// file-input 特有属性
	accept?: string; // 允许的文件类型，如 "video/*", "audio/*", ".mp4,.mov"
	multiple?: boolean; // 是否允许多文件上传（默认 false）
	maxFiles?: number; // 最大文件数量（multiple=true 时有效）
	maxSizeMB?: number; // 单个文件最大大小（MB），手动配置或自动根据命令类型推断

	// file-output 特有属性
	defaultExtension?: string; // 默认文件扩展名，如 "mp4", "webm"
	mimeType?: string; // 输出 MIME 类型
}

export interface CommandPreset {
	id: string;
	name: string;
	description: string;
	category: string;
	ffmpegArgs: string[]; // 支持模板变量，如 ['-i', '{{input}}', '-vf', 'transpose={{direction}}', '{{output}}']

	// 已废弃：保留用于向后兼容，新版本应使用 formSchema 中的 file-input/file-output
	inputFiles?: Array<{
		name: string;
		pattern?: string;
	}>;
	outputFileName?: string;
	outputMimeType?: string;

	createdAt: number;
	updatedAt: number;

	// 自定义表单配置（包含输入输出文件配置）
	formSchema?: FormField[];

	// 内存/性能配置
	estimatedMemoryMB?: number; // 预估内存需求（MB），用于智能检测
	requiresReencode?: boolean; // 是否需要重新编码（影响内存限制）
}

export interface CommandExecutionState {
	isExecuting: boolean;
	progress: number;
	currentStep: string;
	error?: string;
}
