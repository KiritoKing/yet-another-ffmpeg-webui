# 中止功能更新日志

**日期**: 2025-11-08  
**版本**: v2.3.3

## Bug 修复 (2025-11-08 v2.3.3)

### 修复 #4: VP9 编码器导致进度长时间卡在 0%

**问题描述**: 
- 使用 "转换为 WebM" 命令处理大文件或高分辨率视频时
- 进度长时间停留在 0%，看似卡死
- 实际上 VP9 编码器在 WASM 环境中极慢（1080p 可能需要几十分钟）

**根本原因**: 
1. VP9 编码器计算量极大，在 WebAssembly 中性能非常差
2. 高分辨率视频（如 1920x1080 @ 50fps）处理速度极慢
3. 没有进度停滞检测机制，用户无法判断是卡死还是正在处理

**解决方案**:

#### 1. 优化 VP9 编码参数
为 "转换为 WebM" 命令添加速度优化参数：
```typescript
ffmpegArgs: [
  "-i", "{{input}}",
  "-c:v", "libvpx-vp9",
  "-b:v", "1M",
  "-crf", "32",        // 质量参数，降低质量换取速度
  "-speed", "8",       // 最快速度（0-8，8 最快）
  "-threads", "4",     // 限制线程数
  "-c:a", "libopus",
  "{{output}}",
]
```

并更新描述和文件大小限制：
- 描述：添加 "⚠️ 大文件或高分辨率视频可能极慢" 警告
- 输入限制：从 200MB 降低到 100MB

#### 2. 新增快速 WebM 转换选项
添加 "转换为 WebM（快速）" 命令：
```typescript
{
  name: "转换为 WebM（快速）",
  description: "使用 H.264 转 WebM 容器（不重新编码视频，速度快）",
  ffmpegArgs: [
    "-i", "{{input}}",
    "-c:v", "copy",      // 复制视频流，不重新编码
    "-c:a", "libopus",   // 只编码音频
    "{{output}}",
  ],
}
```
- 速度：非常快（只编码音频）
- 限制：输入视频必须是 H.264 编码

#### 3. 添加进度停滞检测
实现 30 秒超时警告机制：

```typescript
// 添加引用
const lastProgressUpdateRef = useRef<number>(0);
const progressCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);

// 在进度回调中更新时间
onProgress: (p, time) => {
  lastProgressUpdateRef.current = Date.now();
  // ...
}

// 执行任务时启动检测
progressCheckIntervalRef.current = setInterval(() => {
  const timeSinceLastUpdate = Date.now() - lastProgressUpdateRef.current;
  
  if (timeSinceLastUpdate > 30000) {
    addLog(`⚠️ 任务进度已停滞 ${Math.floor(timeSinceLastUpdate / 1000)} 秒...`, 'warning');
    // 清理定时器，避免重复提示
    clearInterval(progressCheckIntervalRef.current);
  }
}, 30000);
```

**停滞警告内容**:
```
⚠️ 任务进度已停滞 XX 秒。可能原因：
- VP9/H.265 等编码器处理大文件极慢
- 建议使用"中止"按钮停止，并尝试:
  • 使用更快的编码器（H.264）
  • 降低分辨率或帧率
  • 减小文件大小
```

#### 4. 清理定时器
在任务结束或中止时清理检测定时器：
```typescript
finally {
  if (progressCheckIntervalRef.current) {
    clearInterval(progressCheckIntervalRef.current);
    progressCheckIntervalRef.current = null;
  }
  setProcessing(false);
}
```

**改进效果**:
- ✅ VP9 编码速度提升（使用 `-speed 8` 参数）
- ✅ 提供快速 WebM 转换替代方案
- ✅ 30 秒无进度自动警告
- ✅ 提供明确的优化建议
- ✅ 防止定时器泄漏

**用户体验**:
- 进度停滞 30 秒后会看到警告和建议
- 可以选择继续等待或中止任务
- 有两种 WebM 转换选项：慢但高质量 vs 快速但需要 H.264 输入

**性能对比**:
- VP9 编码（优化前）：1080p @ 50fps 16s 视频 → 可能需要 30-60 分钟
- VP9 编码（优化后）：1080p @ 50fps 16s 视频 → 可能需要 10-20 分钟
- 快速 WebM：1080p @ 50fps 16s 视频 → 约 10-30 秒（仅编码音频）

---

## Bug 修复 (2025-11-08 v2.3.2)

### 修复 #3: 任务失败后 FFmpeg 实例未清理导致后续任务继续报错

**问题描述**: 
- 当任务 A 执行失败时，FFmpeg 实例可能处于错误状态但未被清理
- 切换到任务 B 时，仍然使用这个损坏的实例
- 导致任务 B 也报相同的错误

**根本原因**: 
`executeCommand()` 的 catch 块只记录错误，没有清理可能损坏的 FFmpeg 实例。

**解决方案**:
在任务执行失败时自动清理 FFmpeg 实例：

```typescript
} catch (error) {
  console.error('执行错误:', error);
  const errorMessage = error instanceof Error ? error.message : String(error);
  addLog(`执行失败: ${errorMessage}`, 'error');
  toast.error(`执行失败: ${errorMessage}`);
  setCurrentStep('执行失败');
  
  // 清理错误的 FFmpeg 实例，避免后续任务继续出错
  try {
    if (service) {
      await service.terminate();
      ffmpegServiceRef.current = null;
      setLoaded(false);
      addLog('FFmpeg 实例已清理，请重新加载后再试', 'warning');
      toast.warning('FFmpeg 实例已清理，请重新加载后再试');
    }
  } catch (cleanupError) {
    console.error('清理 FFmpeg 实例失败:', cleanupError);
  }
}
```

**改进效果**:
- ✅ 任务失败后自动终止 FFmpeg 实例
- ✅ 清空服务引用和加载状态
- ✅ 提示用户重新加载 FFmpeg
- ✅ 避免错误状态传播到下一个任务
- ✅ 清理过程即使失败也不影响主流程

**用户体验**:
- 任务失败后会看到清晰的提示："FFmpeg 实例已清理，请重新加载后再试"
- 必须重新点击"加载 FFmpeg"才能执行新任务
- 确保每个任务都使用干净的 FFmpeg 实例

---

## Bug 修复 (2025-11-08 v2.3.1)

### 修复 #1: 进度条显示异常大数字

**问题描述**: 执行完一个任务后再执行第二个任务时，进度条的时间会显示非常大的数字。

**根本原因**: FFmpeg 的 `onProgress` 回调中的 `time` 参数是累积值，不会在不同任务间重置。

**解决方案**:
1. 添加 `taskStartTimeRef` 引用来跟踪每个任务的起始时间
2. 在 `onProgress` 回调中:
   - 第一次收到进度时记录起始时间
   - 计算相对时间 = 当前时间 - 起始时间
   - 使用 `Math.max(0, ...)` 确保时间不为负数
3. 在每次执行任务前重置 `taskStartTimeRef.current = 0`

**代码变更**:
```typescript
// 添加引用
const taskStartTimeRef = useRef<number>(0);

// 进度回调中计算相对时间
onProgress: (p, time) => {
  if (taskStartTimeRef.current === 0 && time > 0) {
    taskStartTimeRef.current = time;
  }
  const relativeTime = taskStartTimeRef.current > 0 
    ? time - taskStartTimeRef.current 
    : time;
  setCurrentStep(`处理中... ${Math.max(0, relativeTime / 1000000).toFixed(2)}s`);
}

// 执行任务前重置
taskStartTimeRef.current = 0;
```

---

### 修复 #2: 终止任务失败且状态未清空

**问题描述**: 
1. 点击"中止"按钮后任务无法正常终止
2. 重新加载 FFmpeg 后，应用状态（输出文件、进度等）没有清空

**根本原因**: 
1. `terminate()` 方法没有正确清理 FFmpeg 实例引用
2. `handleAbortTask()` 只清理了部分状态

**解决方案**:

#### FFmpegService 改进:
```typescript
async terminate(): Promise<void> {
  try {
    // 先设置标志，防止新任务启动
    this.isExecuting = false;
    this.loaded = false;
    
    // 终止 FFmpeg 实例
    this.ffmpeg.terminate();
    
    // 清空实例引用（关键！）
    this.ffmpeg = null;
  } catch (error) {
    // 即使出错也要清理状态
    this.isExecuting = false;
    this.loaded = false;
    this.ffmpeg = null;
  }
}
```

#### 前端改进:
```typescript
const handleAbortTask = async () => {
  try {
    await service.abort();
    
    // 清空所有状态
    ffmpegServiceRef.current = null;  // 清空服务引用
    setLoaded(false);
    setProcessing(false);
    setProgress(0);
    setCurrentStep('任务已中止');
    
    // 清空输出和 URL
    if (outputUrl) {
      URL.revokeObjectURL(outputUrl);
      setOutputUrl('');
    }
  }
}
```

**改进点**:
1. ✅ `terminate()` 方法设置 `this.ffmpeg = null`，彻底清理实例
2. ✅ 即使出错也确保状态被重置
3. ✅ 清空 `ffmpegServiceRef.current` 引用
4. ✅ 清空输出 URL 并释放 Blob URL
5. ✅ 重置所有 UI 状态

---

## 新增功能：任务中止 (2025-11-08 初版)

为正在执行的 FFmpeg 任务添加了中止功能，允许用户随时停止处理过程。

### 后端更新 (ffmpegService.ts)

1. **执行状态跟踪**
   - 添加 `private isExecuting = false` 标志
   - 在 `executeCommand()` 开始时设置为 `true`
   - 在 `finally` 块中重置为 `false`
   - 执行前检查状态，防止并发执行

2. **新增方法**
   - `abort()`: 中止当前正在执行的任务
     - 调用 `terminate()` 终止 FFmpeg 实例
     - 重置 `isExecuting` 标志
     - 记录中止日志
   - `getIsExecuting()`: 获取当前执行状态
     - 返回 `boolean` 值

3. **错误处理**
   - 如果 FFmpeg 正在执行，阻止新任务启动
   - 抛出错误提示用户等待或中止当前任务

### 前端更新 (ffmpeg-web.tsx)

1. **导入图标**
   - 添加 `XIcon` 从 `lucide-react`

2. **新增处理函数**
   - `handleAbortTask()`: 中止任务处理函数
     - 检查是否有正在执行的任务
     - 调用 `service.abort()`
     - 重置 UI 状态（loaded, processing, progress）
     - 提示用户重新加载 FFmpeg

3. **UI 改进**
   - 执行按钮改为 `flex-1`，与中止按钮并排显示
   - 添加中止按钮（仅在 `processing=true` 时显示）
     - 红色危险样式 (`variant="destructive"`)
     - XIcon 图标
     - "中止" 文字标签

### 使用流程

1. 用户点击"执行命令"开始处理
2. 处理过程中，中止按钮出现在执行按钮旁边
3. 点击"中止"按钮：
   - FFmpeg 实例被终止
   - 任务停止执行
   - UI 显示"任务已中止"
   - 用户需要重新加载 FFmpeg 才能继续使用

### 注意事项

- **中止后需要重新加载**: 由于 `abort()` 会终止 FFmpeg 实例，用户必须重新点击"加载 FFmpeg"才能执行新任务
- **清理资源**: 中止时会自动清理虚拟文件系统中的临时文件
- **并发保护**: 系统会阻止在任务执行时启动新任务

### 技术细节

- **状态同步**: `isExecuting` 标志确保前后端状态一致
- **优雅终止**: 使用 FFmpeg 原生的 `terminate()` 方法安全停止
- **用户反馈**: 通过 toast 和日志提供清晰的状态反馈

---

*这个更新增强了用户控制能力，允许在发现配置错误或不想等待长时间处理时及时中止任务。*
