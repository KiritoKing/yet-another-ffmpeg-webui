export interface CommandPreset {
  id: string;
  name: string;
  description: string;
  category: string;
  ffmpegArgs: string[];
  inputFiles: Array<{
    name: string;
    pattern?: string; // 文件类型匹配模式，如 "video/*", "audio/*"
  }>;
  outputFileName: string;
  outputMimeType?: string;
  createdAt: number;
  updatedAt: number;
}

export interface CommandExecutionState {
  isExecuting: boolean;
  progress: number;
  currentStep: string;
  error?: string;
}
