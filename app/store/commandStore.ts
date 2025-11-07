import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CommandPreset } from '../types/command';

interface CommandStore {
  presets: CommandPreset[];
  addPreset: (preset: Omit<CommandPreset, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updatePreset: (id: string, preset: Partial<CommandPreset>) => void;
  deletePreset: (id: string) => void;
  getPreset: (id: string) => CommandPreset | undefined;
  importPresets: (presets: CommandPreset[]) => void;
  exportPresets: () => CommandPreset[];
  clearPresets: () => void;
}

// 默认预设命令
const defaultPresets: Omit<CommandPreset, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: '复制流（不重新编码）',
    description: '快速复制视频和音频流，不进行重新编码，速度最快',
    category: '基础',
    ffmpegArgs: ['-i', 'input.mp4', '-c', 'copy', 'output.mp4'],
    inputFiles: [{ name: 'input.mp4', pattern: 'video/*' }],
    outputFileName: 'output.mp4',
  },
  {
    name: '转换为 WebM',
    description: '使用 VP9 和 Opus 编码器转换为 WebM 格式',
    category: '格式转换',
    ffmpegArgs: [
      '-i',
      'input.mp4',
      '-c:v',
      'libvpx-vp9',
      '-b:v',
      '1M',
      '-c:a',
      'libopus',
      'output.webm',
    ],
    inputFiles: [{ name: 'input.mp4', pattern: 'video/*' }],
    outputFileName: 'output.webm',
    outputMimeType: 'video/webm',
  },
  {
    name: '提取音频为 MP3',
    description: '从视频中提取音频轨道并转换为 MP3 格式',
    category: '音频提取',
    ffmpegArgs: [
      '-i',
      'input.mp4',
      '-vn',
      '-acodec',
      'libmp3lame',
      '-q:a',
      '2',
      'output.mp3',
    ],
    inputFiles: [{ name: 'input.mp4', pattern: 'video/*' }],
    outputFileName: 'output.mp3',
    outputMimeType: 'audio/mpeg',
  },
  {
    name: '调整分辨率（720p）',
    description: '将视频缩放到 1280x720 分辨率',
    category: '视频编辑',
    ffmpegArgs: [
      '-i',
      'input.mp4',
      '-vf',
      'scale=1280:720',
      '-c:a',
      'copy',
      'output.mp4',
    ],
    inputFiles: [{ name: 'input.mp4', pattern: 'video/*' }],
    outputFileName: 'output.mp4',
  },
  {
    name: '提取视频片段',
    description: '从第 10 秒开始提取 5 秒的视频片段',
    category: '视频编辑',
    ffmpegArgs: [
      '-i',
      'input.mp4',
      '-ss',
      '00:00:10',
      '-t',
      '00:00:05',
      '-c',
      'copy',
      'output.mp4',
    ],
    inputFiles: [{ name: 'input.mp4', pattern: 'video/*' }],
    outputFileName: 'output.mp4',
  },
  {
    name: '转换为 GIF',
    description: '将视频转换为 GIF 动图（10fps，320px 宽度）',
    category: '格式转换',
    ffmpegArgs: [
      '-i',
      'input.mp4',
      '-vf',
      'fps=10,scale=320:-1:flags=lanczos',
      '-c:v',
      'gif',
      'output.gif',
    ],
    inputFiles: [{ name: 'input.mp4', pattern: 'video/*' }],
    outputFileName: 'output.gif',
    outputMimeType: 'image/gif',
  },
  {
    name: '压缩视频',
    description: '使用 H.264 编码器压缩视频，CRF 值 28（值越大压缩越多）',
    category: '视频编辑',
    ffmpegArgs: [
      '-i',
      'input.mp4',
      '-c:v',
      'libx264',
      '-crf',
      '28',
      '-c:a',
      'aac',
      '-b:a',
      '128k',
      'output.mp4',
    ],
    inputFiles: [{ name: 'input.mp4', pattern: 'video/*' }],
    outputFileName: 'output.mp4',
  },
  {
    name: '合并视频',
    description: '按顺序合并两个视频文件',
    category: '视频编辑',
    ffmpegArgs: [
      '-i',
      'video1.mp4',
      '-i',
      'video2.mp4',
      '-filter_complex',
      '[0:v][0:a][1:v][1:a]concat=n=2:v=1:a=1[v][a]',
      '-map',
      '[v]',
      '-map',
      '[a]',
      'output.mp4',
    ],
    inputFiles: [
      { name: 'video1.mp4', pattern: 'video/*' },
      { name: 'video2.mp4', pattern: 'video/*' },
    ],
    outputFileName: 'output.mp4',
  },
  {
    name: '旋转视频',
    description: '使用自定义角度或方向旋转视频（支持表单化配置）',
    category: '视频编辑',
    ffmpegArgs: [
      '-i',
      'input.mp4',
      '-vf',
      'transpose={{direction}}',
      '-c:a',
      'copy',
      'output.mp4',
    ],
    inputFiles: [{ name: 'input.mp4', pattern: 'video/*' }],
    outputFileName: 'output.mp4',
    // 自定义表单配置
    formSchema: [
      {
        name: 'direction',
        label: '旋转方向',
        type: 'select',
        defaultValue: '1',
        required: true,
        description: '选择视频旋转的方向',
        options: [
          { label: '顺时针旋转 90°', value: '1' },
          { label: '逆时针旋转 90°', value: '2' },
          { label: '顺时针旋转 90° + 垂直翻转', value: '3' },
          { label: '逆时针旋转 90° + 垂直翻转', value: '0' },
        ],
      },
    ],
  },
  {
    name: '视频缩放（自定义）',
    description: '自定义视频分辨率、码率和质量参数',
    category: '视频编辑',
    ffmpegArgs: [
      '-i',
      'input.mp4',
      '-vf',
      'scale={{width}}:{{height}}',
      '-b:v',
      '{{bitrate}}k',
      '-crf',
      '{{quality}}',
      '-c:a',
      'copy',
      'output.mp4',
    ],
    inputFiles: [{ name: 'input.mp4', pattern: 'video/*' }],
    outputFileName: 'output.mp4',
    formSchema: [
      {
        name: 'width',
        label: '宽度（像素）',
        type: 'number',
        defaultValue: 1280,
        min: 128,
        max: 3840,
        step: 2,
        required: true,
        description: '输出视频的宽度（必须是偶数）',
      },
      {
        name: 'height',
        label: '高度（像素）',
        type: 'number',
        defaultValue: 720,
        min: 128,
        max: 2160,
        step: 2,
        required: true,
        description: '输出视频的高度（必须是偶数）',
      },
      {
        name: 'bitrate',
        label: '视频码率（kbps）',
        type: 'slider',
        defaultValue: 2000,
        min: 500,
        max: 10000,
        step: 100,
        description: '视频比特率，值越高质量越好但文件越大',
      },
      {
        name: 'quality',
        label: 'CRF 质量',
        type: 'slider',
        defaultValue: 23,
        min: 18,
        max: 35,
        step: 1,
        description: 'CRF 值：18=最高质量，28=平衡，35=最低质量',
      },
    ],
  },
];

export const useCommandStore = create<CommandStore>()(
  persist(
    (set, get) => ({
      presets: [],
      
      addPreset: (preset) => {
        const newPreset: CommandPreset = {
          ...preset,
          id: `preset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        set((state) => ({
          presets: [...state.presets, newPreset],
        }));
      },

      updatePreset: (id, updates) => {
        set((state) => ({
          presets: state.presets.map((p) =>
            p.id === id ? { ...p, ...updates, updatedAt: Date.now() } : p
          ),
        }));
      },

      deletePreset: (id) => {
        set((state) => ({
          presets: state.presets.filter((p) => p.id !== id),
        }));
      },

      getPreset: (id) => {
        return get().presets.find((p) => p.id === id);
      },

      importPresets: (presets) => {
        const now = Date.now();
        const currentState = get();
        const existingIds = new Set(currentState.presets.map(p => p.id));
        
        // 过滤掉重复的 ID，并为所有导入的预设生成新的 ID
        const importedPresets = presets
          .filter((p) => {
            if (existingIds.has(p.id)) {
              console.warn(`跳过重复的预设 ID: ${p.id} (${p.name})`);
              return false;
            }
            return true;
          })
          .map((p) => ({
            ...p,
            id: `preset_${now}_${Math.random().toString(36).substr(2, 9)}`,
            createdAt: p.createdAt || now,
            updatedAt: now,
          }));
        
        set((state) => ({
          presets: [...state.presets, ...importedPresets],
        }));
      },

      exportPresets: () => {
        return get().presets;
      },

      clearPresets: () => {
        set({ presets: [] });
      },
    }),
    {
      name: 'ffmpeg-command-presets',
      onRehydrateStorage: () => (state) => {
        // 如果没有预设命令，添加默认预设
        if (state && state.presets.length === 0) {
          defaultPresets.forEach((preset) => {
            state.addPreset(preset);
          });
        }
      },
    }
  )
);
