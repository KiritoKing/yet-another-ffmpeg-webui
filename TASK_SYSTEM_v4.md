# 任务队列系统 v4.0

## 概述

v4.0 版本完整实现了任务队列批处理系统，支持多任务并发执行、实时进度追踪、结果预览和历史记录管理。

## 核心特性

### 1. 任务队列管理

- **状态流转**: pending → running → completed/failed/aborted
- **并发控制**: 可配置 1-4 个任务同时执行
- **队列操作**: 添加、移除、清空、开始、停止
- **实时追踪**: 分离等待队列、执行队列、完成列表

### 2. 进度追踪系统

#### 任务级进度
- 每个任务独立的进度百分比
- 实时更新（通过 FFmpeg progress 事件）
- 显示在"正在执行"区域

#### 总体进度
- 基于初始队列大小计算
- 公式：`completed / initialQueueSize * 100`
- 不受任务完成后队列减少的影响

### 3. 文件名标准化

#### 标准化规则
```typescript
sanitizeFilename(filename: string): string
```
- 移除中文字符 `/[\u4e00-\u9fa5]+/g`
- 移除空格 `/\s+/g`
- 移除特殊字符 `/[^\w\-_.]/g`
- 规范化扩展名（转小写）
- 长度限制 48 字符
- 添加时间戳避免冲突

#### 批量处理
```typescript
standardizeAndUniquifyFilenames(files: File[]): FileMapping[]
```
- 自动检测重复文件名
- 添加序号去重（`file_1.mp4`, `file_2.mp4`）
- 返回原始名 → 标准化名的映射

#### 参数更新
```typescript
applyFilenameMappings(args: string[], mappings: FileMapping[]): string[]
```
- 将 FFmpeg 参数中的文件名替换为标准化后的名称
- 支持多文件场景

### 4. 结果管理

#### Blob URL 内存管理
```typescript
taskResults: Map<string, string>  // taskId -> blobUrl
```
- 任务完成后创建 Blob URL
- 内存存储（非持久化）
- 应用关闭时自动释放

#### 预览功能
- **视频预览**: mp4, webm, avi, mov
- **音频预览**: mp3, wav, ogg, m4a
- **图片预览**: gif, jpg, jpeg, png, webp
- **弹窗显示**: 使用 Dialog 组件，最大宽度 4xl
- **下载支持**: 所有任务都可下载

### 5. 历史记录

#### IndexedDB 持久化
```typescript
// 数据库: ffmpeg-tasks
// 对象存储: tasks
// 索引: status, createdAt, presetName
```

#### 功能
- 自动保存完成的任务
- 支持搜索（命令名称、输入文件名）
- 支持筛选（状态、日期范围）
- 分页浏览（每页 10 条）
- 详情查看
- 重新执行任务

## 架构设计

### 组件层次

```
ffmpeg-web.tsx (主页面)
├── ExecutionPanel (执行面板)
│   ├── CommandPanel (命令列表)
│   └── DynamicForm (动态表单)
├── QueueControlPanel (队列面板)
│   ├── 等待队列
│   ├── 正在执行
│   └── 最近完成
└── TaskHistoryViewer (历史面板)
    ├── 搜索和筛选
    ├── 任务列表
    └── 详情对话框
```

### 状态管理

#### taskStore.ts (Zustand)
```typescript
interface TaskState {
  currentTask: Task | null;
  queue: Task[];
  executingTasks: Task[];
  recentCompletedTasks: Task[];
  queueConfig: QueueConfig;
  isProcessingQueue: boolean;
  initialQueueSize: number;
  taskResults: Map<string, string>;
  
  // Actions
  addToQueue(task: Task): void;
  startTask(taskId: string): void;
  completeTask(taskId: string, outputSize: number, blobUrl?: string): void;
  addExecutingTask(task: Task): void;
  removeExecutingTask(taskId: string): void;
  updateExecutingTask(taskId: string, updates: Partial<Task>): void;
  // ...
}
```

#### useTaskManager.ts (Hook)
```typescript
export function useTaskManager() {
  // 核心业务逻辑
  const createTask = useCallback(...);
  const executeTask = useCallback(...);
  const addTaskToQueue = useCallback(...);
  const startQueue = useCallback(...);
  const stopQueue = useCallback(...);
  
  return {
    // 状态
    queue,
    executingTasks,
    recentCompletedTasks,
    initialQueueSize,
    
    // 操作
    createTask,
    executeTask,
    addTaskToQueue,
    startQueue,
    stopQueue,
    getTaskResult,
  };
}
```

### 服务层

#### queueProcessor.ts
```typescript
class QueueProcessor {
  private queue: Task[];
  private executingTasks: Set<string>;
  private config: QueueProcessorConfig;
  
  async start(): Promise<void> {
    // 并发控制循环
    while (queue.length > 0 && !shouldStop) {
      // 等待空闲槽位
      while (executingTasks.size >= batchSize) {
        await sleep(100);
      }
      
      // 执行任务（不阻塞）
      const task = queue.shift();
      this.executeTask(task);
    }
    
    // 等待所有任务完成
    while (executingTasks.size > 0) {
      await sleep(100);
    }
  }
  
  private async executeTask(task: Task): Promise<void> {
    // 1. 获取 FFmpeg 实例
    const service = await provider.acquire();
    
    // 2. 提取文件（从 task._files）
    const files = extractFilesFromTask(task);
    
    // 3. 执行命令（使用 task.ffmpegArgs）
    const blob = await service.executeCommand({
      inputFiles,
      outputFileName: task.outputFileName,
      ffmpegArgs: task.ffmpegArgs,
      onProgress: (progress) => {
        config.onTaskProgress?.(task.id, progress);
      },
    });
    
    // 4. 通知完成
    config.onTaskComplete?.(task.id, blob.size, blob);
    
    // 5. 释放实例
    provider.release(service);
  }
}
```

#### ffmpegPool.ts
```typescript
class FFmpegWorkerPool {
  private pool: FFmpegService[];
  private available: FFmpegService[];
  private waiting: Array<(service: FFmpegService) => void>;
  
  async acquire(): Promise<FFmpegService> {
    if (available.length > 0) {
      return available.pop()!;
    }
    
    // 等待空闲实例
    return new Promise(resolve => {
      waiting.push(resolve);
    });
  }
  
  release(service: FFmpegService): void {
    if (waiting.length > 0) {
      const resolve = waiting.shift()!;
      resolve(service);
    } else {
      available.push(service);
    }
  }
}
```

#### taskDatabase.ts
```typescript
class TaskDatabase {
  private db: IDBDatabase;
  
  async saveTask(task: Task): Promise<void> {
    const transaction = db.transaction(['tasks'], 'readwrite');
    const store = transaction.objectStore('tasks');
    await store.put(task);
  }
  
  async getTasks(filter?: TaskFilter): Promise<Task[]> {
    const store = db.transaction('tasks').objectStore('tasks');
    const index = store.index('createdAt');
    const tasks = await index.getAll();
    
    return applyFilters(tasks, filter);
  }
  
  async searchTasks(query: string): Promise<Task[]> {
    const tasks = await getTasks();
    return tasks.filter(t => 
      t.presetName.includes(query) ||
      t.inputFiles.some(f => f.name.includes(query))
    );
  }
}
```

## 进度更新链路

```
FFmpeg.on("progress")
  ↓
ffmpegService.executeCommand({ onProgress })
  ↓
queueProcessor.executeTask({ onTaskProgress })
  ↓
useTaskManager.startQueue({ onTaskProgress: updateExecutingTask })
  ↓
taskStore.updateExecutingTask(taskId, { progress })
  ↓
QueueControlPanel (UI 更新)
```

## 文件处理流程

### 批量任务创建
```typescript
// 1. 用户上传多个文件
const files = [file1, file2, file3];

// 2. 标准化文件名
const mappings = standardizeAndUniquifyFilenames(files);
// 结果: [
//   { original: '干杯.mp4', standardized: 'file_1234567890.mp4' },
//   { original: '干杯 (1).mp4', standardized: 'file_1234567891.mp4' },
// ]

// 3. 更新 FFmpeg 参数
const updatedArgs = applyFilenameMappings(preset.ffmpegArgs, mappings);

// 4. 创建任务（每个文件一个任务）
for (const mapping of mappings) {
  const task = createTask(preset, {
    input: findFileByOriginalName(files, mapping.original)
  }, updatedArgs, generateOutputName(mapping));
  
  // 5. 添加临时文件引用
  task._files = { input: file };
  
  addToQueue(task);
}
```

### 任务执行
```typescript
// 1. QueueProcessor 从队列取出任务
const task = queue.shift();

// 2. 提取文件（从 task._files）
const files = Object.entries(task._files)
  .filter(([, value]) => value instanceof File)
  .map(([name, file]) => ({ file, name: task.ffmpegArgs[...] }));

// 3. 写入 WASM 文件系统
for (const { file, name } of files) {
  await ffmpeg.writeFile(name, await fetchFile(file));
}

// 4. 执行命令
await ffmpeg.exec(task.ffmpegArgs);

// 5. 读取输出
const data = await ffmpeg.readFile(task.outputFileName);

// 6. 创建 Blob
const blob = new Blob([data], { type: mimeType });

// 7. 生成 Blob URL
const blobUrl = URL.createObjectURL(blob);

// 8. 保存结果
taskStore.setTaskResult(task.id, blobUrl);
```

## 关键问题解决

### 问题 1: 双重标准化
**症状**: 批量任务执行时报"文件不存在"

**原因**: 
- 创建任务时标准化一次（时间戳 T1）
- 执行任务时又标准化一次（时间戳 T2）
- T1 ≠ T2，文件名不匹配

**解决**:
- 创建任务时预先标准化并保存到 `task.ffmpegArgs`
- 执行时直接使用 `task.ffmpegArgs`，不再标准化

### 问题 2: File 对象丢失
**症状**: 执行任务时 `formValues` 中没有 File 对象

**原因**:
- Zustand 将 task 存储到 store
- File 对象无法序列化（内部有 Blob）
- `formValues` 被过滤掉了 File 字段

**解决**:
- 添加 `task._files` 临时字段存储 File 对象
- 不序列化到 IndexedDB（通过类型定义标记为可选）
- 执行时从 `_files` 提取文件

### 问题 3: 进度不更新
**症状**: 批量任务执行时看不到进度条

**原因**:
- FFmpegService 的 progress 回调是全局的
- 批量任务时无法区分是哪个任务的进度

**解决**:
- 扩展 `ExecuteCommandOptions` 添加 `onProgress` 参数
- 执行时临时设置 progress 监听器
- 通过回调链传递到 UI：
  ```
  executeCommand.onProgress
    → QueueProcessor.onTaskProgress
    → useTaskManager.updateExecutingTask
    → taskStore.updateExecutingTask
    → UI 更新
  ```

### 问题 4: 总体进度错误
**症状**: 进度条显示 `0 / 0` 或计算错误

**原因**:
- 使用 `queue.length + executingTasks.length` 作为总数
- 任务完成后从队列移除，总数减少
- 进度倒退或无法达到 100%

**解决**:
- 添加 `initialQueueSize` 记录开始时的队列大小
- `setProcessingQueue(true)` 时设置 `initialQueueSize = queue.length`
- 计算进度时使用初始大小：
  ```typescript
  completed = initialQueueSize - queue.length - executingTasks.length
  progress = completed / initialQueueSize * 100
  ```

### 问题 5: 状态不转换
**症状**: 任务停留在 pending 状态，不显示在"正在执行"

**原因**:
- `onTaskStart` 回调顺序错误
- 先调用 `startTask(taskId)` 尝试更新状态
- 再调用 `addExecutingTask(task)` 添加到列表
- `startTask` 在 `executingTasks` 中找不到任务，更新失败

**解决**:
- 调整回调顺序：
  ```typescript
  onTaskStart: (task) => {
    addExecutingTask(task);  // 1. 先添加
    startTask(task.id);      // 2. 再更新
  }
  ```

### 问题 6: 无法预览结果
**症状**: 完成的任务只能下载，看不到预览

**解决**:
- 添加 `getTaskResultUrl` prop 传递到 `QueueControlPanel`
- 实现媒体类型检测（视频/音频/图片）
- 使用 Dialog 弹窗显示预览
- 点击眼睛图标打开，点击外部或 ESC 关闭

## 使用示例

### 单个任务执行
```typescript
// 1. 选择命令和文件
const preset = commandStore.presets[0];
const file = await selectFile();

// 2. 创建并执行任务
const task = taskManager.createTask(preset, { input: file }, [...], 'output.mp4');
await taskManager.executeTask(task);

// 3. 查看结果
const blobUrl = taskManager.getTaskResult(task.id);
```

### 批量任务处理
```typescript
// 1. 选择命令和多个文件
const preset = commandStore.presets[0];
const files = await selectMultipleFiles();

// 2. 批量添加到队列
await taskManager.addTasksToQueue(preset, files);

// 3. 配置并发数
taskManager.setQueueConfig({ batchSize: 2 });

// 4. 开始处理
await taskManager.startQueue();

// 5. 监控进度（自动更新 UI）
// queue.length: 等待中的任务数
// executingTasks.length: 正在执行的任务数
// recentCompletedTasks: 最近完成的任务
```

### 查看历史记录
```typescript
// 1. 打开历史面板
<TaskHistoryViewer />

// 2. 搜索任务
searchTasks("视频压缩");

// 3. 筛选状态
filterByStatus("completed");

// 4. 重新执行
reExecuteTask(taskId);
```

## 性能优化

### 内存管理
- 使用 `_files` 临时存储，不持久化
- Blob URL 使用完后可手动释放：`URL.revokeObjectURL(blobUrl)`
- `recentCompletedTasks` 最多保留 20 个

### 并发控制
- 默认并发数 1（保守）
- 可配置 2-4（根据设备性能）
- 使用实例池复用 FFmpeg Worker

### 进度更新
- 使用防抖减少 UI 更新频率
- 批量更新状态（`updateExecutingTask`）
- 避免频繁的 DOM 操作

## 未来扩展

1. **任务优先级**: 支持调整任务执行顺序
2. **断点续传**: 任务失败后从断点继续
3. **智能调度**: 根据文件大小和命令复杂度智能分配资源
4. **批量预览**: 完成后自动显示所有结果的缩略图
5. **导出报告**: 批量任务完成后生成 CSV/JSON 报告
6. **任务模板**: 保存常用的批处理配置

## 版本信息

- **版本**: 4.0
- **日期**: 2025-11-08
- **主要贡献**: 完整的任务队列系统实现

---

*本文档描述了 FFmpeg Web v4.0 的任务队列系统架构和实现细节。*
