# FFmpegService API 文档

## 概述

`FFmpegService` 是对 FFmpeg.wasm 的封装，提供了简单易用的 API 来在浏览器中处理视频。

## 安装和导入

```typescript
import { 
  FFmpegService, 
  type FFmpegMode, 
  type FFmpegConfig,
  type ConvertOptions,
  type ExecuteCommandOptions
} from '../services/ffmpegService';
```

## 类型定义

### FFmpegMode

```typescript
type FFmpegMode = "single" | "multi";
```

- `"single"`: 单线程模式（兼容性更好）
- `"multi"`: 多线程模式（性能更好，需要 SharedArrayBuffer 支持）

### FFmpegConfig

```typescript
interface FFmpegConfig {
  mode: FFmpegMode;
  onLog?: (message: string) => void;
  onProgress?: (progress: number, time: number) => void;
}
```

### ConvertOptions

```typescript
interface ConvertOptions {
  inputFile: File;
  outputFormat?: string;
  videoCodec?: string;
  quality?: number;
  speed?: number;
}
```

### ExecuteCommandOptions

```typescript
interface ExecuteCommandOptions {
  inputFiles: { file: File; name: string }[];
  outputFileName: string;
  ffmpegArgs: string[];
}
```

## API 方法

### 静态方法

#### `FFmpegService.isMultiThreadSupported()`

检查当前浏览器是否支持多线程模式。

```typescript
const supported = FFmpegService.isMultiThreadSupported();
console.log(`多线程支持: ${supported}`);
```

### 实例方法

#### `constructor(config: FFmpegConfig)`

创建 FFmpegService 实例。

```typescript
const service = new FFmpegService({
  mode: 'single',
  onLog: (message) => console.log(message),
  onProgress: (progress, time) => {
    console.log(`进度: ${(progress * 100).toFixed(2)}%`);
  }
});
```

#### `async load(): Promise<void>`

加载 FFmpeg WebAssembly 模块。

```typescript
await service.load();
```

#### `async executeCommand(options: ExecuteCommandOptions): Promise<Blob>`

**核心方法**：执行自定义 FFmpeg 命令。

```typescript
const outputBlob = await service.executeCommand({
  inputFiles: [
    { file: videoFile, name: 'input.mp4' }
  ],
  outputFileName: 'output.webm',
  ffmpegArgs: [
    '-i', 'input.mp4',
    '-c:v', 'libvpx-vp9',
    '-b:v', '1M',
    '-c:a', 'libopus',
    'output.webm'
  ]
});
```

#### `async convert(options: ConvertOptions): Promise<Blob>`

**便捷方法**：简化的视频转换方法（内部调用 `executeCommand`）。

```typescript
const outputBlob = await service.convert({
  inputFile: videoFile,
  outputFormat: 'webm',
  videoCodec: 'libvpx-vp9',
  quality: 30,
  speed: 4
});
```

#### `isLoaded(): boolean`

检查 FFmpeg 是否已加载。

```typescript
if (service.isLoaded()) {
  console.log('FFmpeg 已准备就绪');
}
```

#### `getMode(): FFmpegMode`

获取当前使用的模式。

```typescript
const mode = service.getMode();
console.log(`当前模式: ${mode}`);
```

#### `async terminate(): Promise<void>`

终止 FFmpeg 实例并清理资源。

```typescript
await service.terminate();
```

## 使用示例

### 示例 1: 基本使用（简单模式）

```typescript
import { FFmpegService } from '../services/ffmpegService';

// 创建服务实例
const service = new FFmpegService({
  mode: 'single',
  onLog: (msg) => console.log(msg),
  onProgress: (progress) => console.log(`${(progress * 100).toFixed(2)}%`)
});

// 加载 FFmpeg
await service.load();

// 转换视频
const outputBlob = await service.convert({
  inputFile: myVideoFile
});

// 使用输出
const url = URL.createObjectURL(outputBlob);
videoElement.src = url;
```

### 示例 2: 自定义命令（高级模式）

```typescript
// 复制流（不重新编码）
const blob1 = await service.executeCommand({
  inputFiles: [{ file: videoFile, name: 'input.mp4' }],
  outputFileName: 'output.mp4',
  ffmpegArgs: ['-i', 'input.mp4', '-c', 'copy', 'output.mp4']
});

// 转换为 WebM
const blob2 = await service.executeCommand({
  inputFiles: [{ file: videoFile, name: 'input.mp4' }],
  outputFileName: 'output.webm',
  ffmpegArgs: [
    '-i', 'input.mp4',
    '-c:v', 'libvpx-vp9',
    '-b:v', '1M',
    '-c:a', 'libopus',
    'output.webm'
  ]
});

// 提取音频
const blob3 = await service.executeCommand({
  inputFiles: [{ file: videoFile, name: 'input.mp4' }],
  outputFileName: 'audio.mp3',
  ffmpegArgs: [
    '-i', 'input.mp4',
    '-vn',
    '-acodec', 'libmp3lame',
    '-q:a', '2',
    'audio.mp3'
  ]
});
```

### 示例 3: 处理多个文件

```typescript
// 合并两个视频
const mergedBlob = await service.executeCommand({
  inputFiles: [
    { file: video1, name: 'video1.mp4' },
    { file: video2, name: 'video2.mp4' }
  ],
  outputFileName: 'merged.mp4',
  ffmpegArgs: [
    '-i', 'video1.mp4',
    '-i', 'video2.mp4',
    '-filter_complex', '[0:v][1:v]concat=n=2:v=1[v]',
    '-map', '[v]',
    'merged.mp4'
  ]
});
```

### 示例 4: 调整视频大小

```typescript
const resizedBlob = await service.executeCommand({
  inputFiles: [{ file: videoFile, name: 'input.mp4' }],
  outputFileName: 'output_720p.mp4',
  ffmpegArgs: [
    '-i', 'input.mp4',
    '-vf', 'scale=1280:720',
    '-c:a', 'copy',
    'output_720p.mp4'
  ]
});
```

### 示例 5: 剪辑视频片段

```typescript
// 从第 10 秒开始，提取 5 秒
const clippedBlob = await service.executeCommand({
  inputFiles: [{ file: videoFile, name: 'input.mp4' }],
  outputFileName: 'clip.mp4',
  ffmpegArgs: [
    '-i', 'input.mp4',
    '-ss', '00:00:10',
    '-t', '00:00:05',
    '-c', 'copy',
    'clip.mp4'
  ]
});
```

### 示例 6: 转换为 GIF

```typescript
const gifBlob = await service.executeCommand({
  inputFiles: [{ file: videoFile, name: 'input.mp4' }],
  outputFileName: 'output.gif',
  ffmpegArgs: [
    '-i', 'input.mp4',
    '-vf', 'fps=10,scale=320:-1:flags=lanczos',
    '-c:v', 'gif',
    'output.gif'
  ]
});
```

## 常见 FFmpeg 命令参数

### 视频编解码器
- `-c:v copy`: 复制视频流（不重新编码）
- `-c:v libx264`: H.264 编码
- `-c:v libvpx-vp9`: VP9 编码（WebM）
- `-c:v gif`: GIF 编码

### 音频编解码器
- `-c:a copy`: 复制音频流
- `-c:a libmp3lame`: MP3 编码
- `-c:a libopus`: Opus 编码（WebM）
- `-c:a aac`: AAC 编码

### 常用选项
- `-i <file>`: 输入文件
- `-vn`: 禁用视频
- `-an`: 禁用音频
- `-b:v <bitrate>`: 视频比特率（如 `1M`）
- `-b:a <bitrate>`: 音频比特率（如 `128k`）
- `-vf <filter>`: 视频滤镜
- `-af <filter>`: 音频滤镜
- `-ss <time>`: 开始时间
- `-t <duration>`: 持续时间

## 注意事项

1. **文件名约定**: 
   - 输入文件名需要在 `ffmpegArgs` 中引用
   - 建议使用简单的文件名（如 `input.mp4`）

2. **内存限制**:
   - WebAssembly 有内存限制
   - 建议处理小于 500MB 的文件
   - 使用 `-c copy` 避免重新编码可以节省内存

3. **多线程模式**:
   - 需要浏览器支持 SharedArrayBuffer
   - 需要正确配置 COOP/COEP HTTP 头

4. **性能优化**:
   - 使用较快的预设（如 `ultrafast`）
   - 限制线程数（4-8 个）
   - 避免复杂的滤镜操作

5. **文件清理**:
   - 服务会自动清理临时文件
   - 记得调用 `URL.revokeObjectURL()` 清理 Blob URL

## 错误处理

```typescript
try {
  const outputBlob = await service.executeCommand({
    inputFiles: [{ file: videoFile, name: 'input.mp4' }],
    outputFileName: 'output.mp4',
    ffmpegArgs: ['-i', 'input.mp4', '-c', 'copy', 'output.mp4']
  });
  
  // 处理成功
  console.log('转换成功！');
} catch (error) {
  // 处理错误
  if (error instanceof Error) {
    console.error('转换失败:', error.message);
    
    if (error.message.includes('memory access out of bounds')) {
      console.log('可能是内存不足，尝试使用更小的文件');
    }
  }
}
```

## 完整工作流程示例

```typescript
import { useState, useRef } from 'react';
import { FFmpegService } from '../services/ffmpegService';

function VideoConverter() {
  const [loaded, setLoaded] = useState(false);
  const serviceRef = useRef<FFmpegService | null>(null);

  const loadFFmpeg = async () => {
    const service = new FFmpegService({
      mode: 'single',
      onLog: console.log,
      onProgress: (p) => console.log(`${(p * 100).toFixed(2)}%`)
    });

    await service.load();
    serviceRef.current = service;
    setLoaded(true);
  };

  const convertVideo = async (file: File) => {
    if (!serviceRef.current) return;

    const output = await serviceRef.current.executeCommand({
      inputFiles: [{ file, name: 'input.mp4' }],
      outputFileName: 'output.webm',
      ffmpegArgs: [
        '-i', 'input.mp4',
        '-c:v', 'libvpx-vp9',
        '-b:v', '1M',
        'output.webm'
      ]
    });

    // 下载文件
    const url = URL.createObjectURL(output);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'converted.webm';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      {!loaded ? (
        <button onClick={loadFFmpeg}>加载 FFmpeg</button>
      ) : (
        <input 
          type="file" 
          accept="video/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) convertVideo(file);
          }}
        />
      )}
    </div>
  );
}
```

## 更多资源

- [FFmpeg 官方文档](https://ffmpeg.org/documentation.html)
- [FFmpeg.wasm GitHub](https://github.com/ffmpegwasm/ffmpeg.wasm)
- [FFmpeg 命令示例](https://ffmpeg.org/ffmpeg.html#Examples)
