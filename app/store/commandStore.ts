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
        const importedPresets = presets.map((p) => ({
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
