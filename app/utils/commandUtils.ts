import type { CommandPreset, FormField } from '../types/command';

/**
 * 解析 FFmpeg CLI 命令为 JSON 格式
 */
export function parseCLICommand(cliCommand: string): Partial<CommandPreset> {
  // 移除 "ffmpeg" 前缀（如果存在）
  const cleanCommand = cliCommand.trim().replace(/^ffmpeg\s+/, '');
  
  // 分割参数（处理引号包裹的参数）
  const args: string[] = [];
  let current = '';
  let inQuote = false;
  let quoteChar = '';

  for (let i = 0; i < cleanCommand.length; i++) {
    const char = cleanCommand[i];
    
    if ((char === '"' || char === "'") && !inQuote) {
      inQuote = true;
      quoteChar = char;
    } else if (char === quoteChar && inQuote) {
      inQuote = false;
      quoteChar = '';
    } else if (char === ' ' && !inQuote) {
      if (current) {
        args.push(current);
        current = '';
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
    if (args[i] === '-i' && args[i + 1]) {
      inputFiles.push({ name: args[i + 1] });
    }
  }

  // 提取输出文件（通常是最后一个参数）
  const outputFileName = args[args.length - 1] || 'output.mp4';

  // 生成默认名称和描述
  const name = `自定义命令 ${new Date().toLocaleTimeString()}`;
  const description = `从 CLI 导入: ${cleanCommand.substring(0, 100)}${
    cleanCommand.length > 100 ? '...' : ''
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
      formSchema.push({ name: 'width', label: '宽度', type: 'number', defaultValue: Number(w), min: 16, max: 7680, step: 2, description: '视频宽度'});
      formSchema.push({ name: 'height', label: '高度', type: 'number', defaultValue: Number(h), min: 16, max: 4320, step: 2, description: '视频高度'});
      transformedArgs[i] = `scale={{width}}:{{height}}${rest}`;
    }
  }

  // -b:v <number>k 码率
  for (let i = 0; i < transformedArgs.length - 1; i++) {
    if (transformedArgs[i] === '-b:v') {
      const val = transformedArgs[i + 1];
      const m = /(\d+)(k|m)?$/i.exec(val);
      if (m) {
        const num = Number(m[1]);
        formSchema.push({ name: 'bitrate', label: '视频码率(kbps)', type: 'slider', defaultValue: num, min: 100, max: 50000, step: 100, description: '视频码率影响文件大小与质量'});
        transformedArgs[i + 1] = '{{bitrate}}k';
      }
    }
  }

  // -crf <number>
  for (let i = 0; i < transformedArgs.length - 1; i++) {
    if (transformedArgs[i] === '-crf') {
      const val = transformedArgs[i + 1];
      const num = Number(val);
      if (!isNaN(num)) {
        formSchema.push({ name: 'quality', label: 'CRF 质量', type: 'slider', defaultValue: num, min: 10, max: 40, step: 1, description: 'CRF 值越低质量越高' });
        transformedArgs[i + 1] = '{{quality}}';
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
        name: 'direction',
        label: '旋转方向',
        type: 'select',
        defaultValue: val,
        options: [
          { label: '逆时针90°+垂直翻转', value: '0' },
          { label: '顺时针90°', value: '1' },
          { label: '逆时针90°', value: '2' },
          { label: '顺时针90°+垂直翻转', value: '3' },
        ],
      });
      transformedArgs[i] = 'transpose={{direction}}';
    }
  }

  return {
    name,
    description,
    category: '自定义',
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
        console.warn('跳过无效的预设:', item);
        continue;
      }

      presets.push({
        id: item.id || `preset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: item.name,
        description: item.description || '',
        category: item.category || '未分类',
        ffmpegArgs: item.ffmpegArgs,
        inputFiles: item.inputFiles || [{ name: 'input.mp4' }],
        outputFileName: item.outputFileName || 'output.mp4',
        outputMimeType: item.outputMimeType,
        formSchema: item.formSchema,
        createdAt: item.createdAt || Date.now(),
        updatedAt: item.updatedAt || Date.now(),
      });
    }

    if (presets.length === 0) {
      throw new Error('JSON 中没有有效的命令预设');
    }

    return { presets, isSingle };
  } catch (error) {
    throw new Error(`JSON 解析失败: ${error instanceof Error ? error.message : String(error)}`);
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
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
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
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) {
        reject(new Error('未选择文件'));
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        resolve(content);
      };
      reader.onerror = () => reject(new Error('文件读取失败'));
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

  if (!preset.name || preset.name.trim() === '') {
    errors.push('命令名称不能为空');
  }

  if (!preset.ffmpegArgs || preset.ffmpegArgs.length === 0) {
    errors.push('FFmpeg 参数不能为空');
  }

  if (!preset.inputFiles || preset.inputFiles.length === 0) {
    errors.push('至少需要一个输入文件');
  }

  if (!preset.outputFileName || preset.outputFileName.trim() === '') {
    errors.push('输出文件名不能为空');
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
export function validateTemplateUsage(preset: Pick<CommandPreset, 'ffmpegArgs' | 'formSchema'>): {
  unknown: string[];
  unused: string[];
} {
  const used = new Set(extractTemplateVariables(preset.ffmpegArgs));
  const declared = new Set((preset.formSchema || []).map(f => f.name));

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
  values: Record<string, string | number | boolean>
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
export function getDefaultFormValues(preset: CommandPreset): Record<string, string | number | boolean> {
  if (!preset.formSchema) return {};
  
  const values: Record<string, string | number | boolean> = {};
  preset.formSchema.forEach((field) => {
    if (field.defaultValue !== undefined) {
      values[field.name] = field.defaultValue;
    }
  });
  return values;
}
