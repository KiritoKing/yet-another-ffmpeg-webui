// JSON Schema 表单字段定义
export interface FormField {
  name: string; // 字段名称，用于在参数中替换 {{fieldName}}
  label: string; // 显示标签
  type: 'text' | 'number' | 'select' | 'slider' | 'checkbox'; // 字段类型
  defaultValue?: string | number | boolean; // 默认值
  placeholder?: string; // 占位符
  description?: string; // 字段描述
  required?: boolean; // 是否必填
  min?: number; // 最小值（number/slider）
  max?: number; // 最大值（number/slider）
  step?: number; // 步长（number/slider）
  options?: Array<{ label: string; value: string }>; // 选项（select）
}

export interface CommandPreset {
  id: string;
  name: string;
  description: string;
  category: string;
  ffmpegArgs: string[]; // 支持模板变量，如 ['-i', 'input.mp4', '-vf', 'transpose={{direction}}', 'output.mp4']
  inputFiles: Array<{
    name: string;
    pattern?: string; // 文件类型匹配模式，如 "video/*", "audio/*"
  }>;
  outputFileName: string;
  outputMimeType?: string;
  createdAt: number;
  updatedAt: number;
  // 新增：自定义表单配置
  formSchema?: FormField[]; // 如果定义了表单，则显示自定义表单UI
}

export interface CommandExecutionState {
  isExecuting: boolean;
  progress: number;
  currentStep: string;
  error?: string;
}
