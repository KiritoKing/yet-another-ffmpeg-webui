import type { CommandPreset, FormField } from "../types/command";

/**
 * 解析 FFmpeg CLI 命令为 JSON 格式
 */
export function parseCLICommand(cliCommand: string): Partial<CommandPreset> {
  // 移除 "ffmpeg" 前缀（如果存在）
  const cleanCommand = cliCommand.trim().replace(/^ffmpeg\s+/, "");

  // 分割参数（处理引号包裹的参数）
  const args: string[] = [];
  let current = "";
  let inQuote = false;
  let quoteChar = "";

  for (let i = 0; i < cleanCommand.length; i++) {
    const char = cleanCommand[i];

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

  // 提取输入文件
  const inputFiles: Array<{ name: string; pattern?: string }> = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "-i" && args[i + 1]) {
      inputFiles.push({ name: args[i + 1] });
    }
  }

  // 提取输出文件（通常是最后一个参数）
  const outputFileName = args[args.length - 1] || "output.mp4";

  // 生成默认名称和描述
  const name = `自定义命令 ${new Date().toLocaleTimeString()}`;
  const description = `从 CLI 导入: ${cleanCommand.substring(0, 100)}${
    cleanCommand.length > 100 ? "..." : ""
  }`;

  // 智能识别模板变量与表单字段
  const formSchema: FormField[] = [];
  const transformedArgs = [...args];

  // scale=WxH 检测
  for (let i = 0; i < transformedArgs.length; i++) {
    const a = transformedArgs[i];
    const m = /^scale=(\d+):(\d+)(.*)$/.exec(a);
    if (m) {
      const [, w, h, rest] = m;
      formSchema.push({
        name: "width",
        label: "宽度",
        type: "number",
        defaultValue: Number(w),
        min: 16,
        max: 7680,
        step: 2,
        description: "视频宽度",
      });
      formSchema.push({
        name: "height",
        label: "高度",
        type: "number",
        defaultValue: Number(h),
        min: 16,
        max: 4320,
        step: 2,
        description: "视频高度",
      });
      transformedArgs[i] = `scale={{width}}:{{height}}${rest}`;
    }
  }

  // -b:v <number>k 码率
  for (let i = 0; i < transformedArgs.length - 1; i++) {
    if (transformedArgs[i] === "-b:v") {
      const val = transformedArgs[i + 1];
      const m = /(\d+)(k|m)?$/i.exec(val);
      if (m) {
        const num = Number(m[1]);
        formSchema.push({
          name: "bitrate",
          label: "视频码率(kbps)",
          type: "slider",
          defaultValue: num,
          min: 100,
          max: 50000,
          step: 100,
          description: "视频码率影响文件大小与质量",
        });
        transformedArgs[i + 1] = "{{bitrate}}k";
      }
    }
  }

  // -crf <number>
  for (let i = 0; i < transformedArgs.length - 1; i++) {
    if (transformedArgs[i] === "-crf") {
      const val = transformedArgs[i + 1];
      const num = Number(val);
      if (!isNaN(num)) {
        formSchema.push({
          name: "quality",
          label: "CRF 质量",
          type: "slider",
          defaultValue: num,
          min: 10,
          max: 40,
          step: 1,
          description: "CRF 值越低质量越高",
        });
        transformedArgs[i + 1] = "{{quality}}";
      }
    }
  }

  // transpose=0|1|2|3
  for (let i = 0; i < transformedArgs.length; i++) {
    const a = transformedArgs[i];
    const mt = /^transpose=(\d)$/.exec(a);
    if (mt) {
      const val = mt[1];
      formSchema.push({
        name: "direction",
        label: "旋转方向",
        type: "select",
        defaultValue: val,
        options: [
          { label: "逆时针90°+垂直翻转", value: "0" },
          { label: "顺时针90°", value: "1" },
          { label: "逆时针90°", value: "2" },
          { label: "顺时针90°+垂直翻转", value: "3" },
        ],
      });
      transformedArgs[i] = "transpose={{direction}}";
    }
  }

  return {
    name,
    description,
    category: "自定义",
    ffmpegArgs: transformedArgs,
    inputFiles,
    outputFileName,
    formSchema: formSchema.length ? formSchema : undefined,
  };
}

/**
 * 将命令预设导出为 JSON
 */
export function exportPresetsToJSON(presets: CommandPreset[]): string {
  return JSON.stringify(presets, null, 2);
}

/**
 * 从 JSON 导入命令预设（支持单个或多个）
 */
export function importPresetsFromJSON(json: string): {
  presets: CommandPreset[];
  isSingle: boolean;
} {
  try {
    const data = JSON.parse(json);

    // 判断是单个命令还是多个命令
    const isSingle = !Array.isArray(data);
    const items = isSingle ? [data] : data;

    const presets: CommandPreset[] = [];

    for (const item of items) {
      // 验证必需字段
      if (!item.name || !item.ffmpegArgs || !Array.isArray(item.ffmpegArgs)) {
        console.warn("跳过无效的预设:", item);
        continue;
      }

      presets.push({
        id: item.id ||
          `preset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: item.name,
        description: item.description || "",
        category: item.category || "未分类",
        ffmpegArgs: item.ffmpegArgs,
        inputFiles: item.inputFiles || [{ name: "input.mp4" }],
        outputFileName: item.outputFileName || "output.mp4",
        outputMimeType: item.outputMimeType,
        formSchema: item.formSchema,
        createdAt: item.createdAt || Date.now(),
        updatedAt: item.updatedAt || Date.now(),
      });
    }

    if (presets.length === 0) {
      throw new Error("JSON 中没有有效的命令预设");
    }

    return { presets, isSingle };
  } catch (error) {
    throw new Error(
      `JSON 解析失败: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
}

/**
 * 导出单个预设为 JSON
 */
export function exportPresetToJSON(preset: CommandPreset): string {
  return JSON.stringify(preset, null, 2);
}

/**
 * 下载 JSON 文件
 */
export function downloadJSON(filename: string, data: string) {
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * 上传并读取 JSON 文件
 */
export function uploadJSON(): Promise<string> {
  return new Promise((resolve, reject) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";

    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) {
        reject(new Error("未选择文件"));
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        resolve(content);
      };
      reader.onerror = () => reject(new Error("文件读取失败"));
      reader.readAsText(file);
    };

    input.click();
  });
}

/**
 * 验证命令预设
 */
export function validatePreset(preset: Partial<CommandPreset>): string[] {
  const errors: string[] = [];

  if (!preset.name || preset.name.trim() === "") {
    errors.push("命令名称不能为空");
  }

  if (!preset.ffmpegArgs || preset.ffmpegArgs.length === 0) {
    errors.push("FFmpeg 参数不能为空");
  }

  if (!preset.inputFiles || preset.inputFiles.length === 0) {
    errors.push("至少需要一个输入文件");
  }

  if (!preset.outputFileName || preset.outputFileName.trim() === "") {
    errors.push("输出文件名不能为空");
  }

  return errors;
}

/**
 * 提取命令参数中的模板变量名列表，例如 {{foo}} -> ['foo']
 */
export function extractTemplateVariables(args: string[]): string[] {
  const vars = new Set<string>();
  const re = /\{\{(\w+)\}\}/g;
  for (const a of args) {
    let m: RegExpExecArray | null;
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
  used.forEach((v) => {
    if (!declared.has(v)) unknown.push(v);
  });

  const unused: string[] = [];
  declared.forEach((v) => {
    if (!used.has(v)) unused.push(v);
  });

  return { unknown, unused };
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
      field.defaultValue !== undefined && field.type !== "file-input" &&
      field.type !== "file-output"
    ) {
      values[field.name] = field.defaultValue;
    }
  });
  return values;
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
    args.includes("-vf") || args.includes("-filter:v") ||
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
  const requiresReencode = preset.requiresReencode ??
    detectRequiresReencode(preset.ffmpegArgs);
  const estimatedMemoryMB = preset.estimatedMemoryMB ??
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
      message: `文件过大！单个文件最大 ${
        maxFileSizeMB.toFixed(1)
      } MB，建议 < ${recommendedMaxMB} MB。${
        requiresReencode ? "此命令需要重新编码，内存需求较高。" : ""
      }`,
      recommendedMaxMB,
    };
  }

  // 检查总大小（针对多文件）
  if (files.length > 1 && totalSizeMB > recommendedMaxMB * 1.5) {
    return {
      valid: false,
      message: `文件总大小过大！总计 ${totalSizeMB.toFixed(1)} MB，建议 < ${
        (recommendedMaxMB * 1.5).toFixed(0)
      } MB。`,
      recommendedMaxMB,
    };
  }

  return {
    valid: true,
    recommendedMaxMB,
  };
}

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
  name: string = "input",
  accept: string = "video/*",
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
  name: string = "inputs",
  accept: string = "video/*",
  maxFiles: number = 10,
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
  name: string = "output",
  defaultValue: string = "output.mp4",
  defaultExtension: string = "mp4",
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
