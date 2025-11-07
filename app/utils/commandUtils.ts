import type { CommandPreset } from '../types/command';

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

  return {
    name,
    description,
    category: '自定义',
    ffmpegArgs: args,
    inputFiles,
    outputFileName,
  };
}

/**
 * 将命令预设导出为 JSON
 */
export function exportPresetsToJSON(presets: CommandPreset[]): string {
  return JSON.stringify(presets, null, 2);
}

/**
 * 从 JSON 导入命令预设
 */
export function importPresetsFromJSON(json: string): CommandPreset[] {
  try {
    const data = JSON.parse(json);
    
    // 验证数据格式
    if (!Array.isArray(data)) {
      throw new Error('JSON 必须是数组格式');
    }

    const presets: CommandPreset[] = [];
    
    for (const item of data) {
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
        createdAt: item.createdAt || Date.now(),
        updatedAt: item.updatedAt || Date.now(),
      });
    }

    return presets;
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
