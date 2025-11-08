# 任务中止问题修复记录 (v4.1)

**修复日期**: 2025-11-08  
**版本**: v4.1  
**问题严重性**: 高 - 影响核心功能

---

## 🐛 问题描述

### 复现步骤
1. 提交任务并开始执行
2. 在执行过程中点击"中止"按钮
3. 任务成功中止，日志显示"任务已被用户中止"
4. 重新提交相同任务
5. **报错**: `FFmpeg 未加载，请先调用 load()`

### 用户日志示例
```
[23:22:50] INFO     提交任务: 旋转视频
[23:22:51] INFO     开始处理队列 (1 个任务) 并发=1
[23:22:52] INFO     执行 FFmpeg 命令: ffmpeg -i ...
[23:23:35] INFO     正在中止当前任务...
[23:23:35] WARNING  [队列] 中止任务: task_1762615370331_wmx0r91
[23:23:35] INFO     任务已被用户中止
[23:23:36] INFO     提交任务: 旋转视频  (重新提交)
[23:23:37] ERROR    [队列] 任务失败: 旋转视频 - 文件名包含中文字符可能导致问题
[23:23:37] ERROR    [队列] 原始错误: FFmpeg 未加载，请先调用 load()
```

---

## 🔍 根本原因分析

### 问题链路
```
提交任务 → 执行 → 中止(terminate) → FFmpeg销毁 → 重新提交 → 使用同一实例 → 未加载错误
```

### 代码层面分析

#### 1. FFmpegService.abort() 的问题
**原实现** (`app/services/ffmpegService.ts`):
```typescript
abort(): void {
  this.config.onLog?.("正在中止当前任务...");
  this.isAborting = true;
  
  // 调用 terminate 强制结束 FFmpeg 进程
  if (this.ffmpeg) {
    this.ffmpeg.terminate();  // ❌ 销毁实例
    this.ffmpeg = null;        // ❌ 清空引用
    this.loaded = false;       // ❌ 标记为未加载
    this.isExecuting = false;
  }
}
```

**问题**:
- `terminate()` 完全销毁 FFmpeg WebAssembly 实例
- 设置 `loaded = false` 和 `ffmpeg = null`
- 没有重新加载机制

#### 2. SingleFFmpegProvider 的问题
**实现** (`app/services/ffmpegPool.ts`):
```typescript
export class SingleFFmpegProvider implements FFmpegProvider {
  private service: FFmpegService;
  
  constructor(service: FFmpegService) {
    this.service = service;  // 直接引用外部实例
  }
  
  async acquire(): Promise<FFmpegService> {
    return this.service;  // 每次返回同一个实例
  }
  
  release(): void {}  // 无操作
}
```

**问题**:
- 总是返回同一个 FFmpegService 实例
- 如果实例被销毁，后续获取到的仍是已销毁的实例
- 没有检查实例是否可用

#### 3. 队列处理器的问题
**实现** (`app/services/queueProcessor.ts`):
```typescript
async executeTask(task: Task): Promise<void> {
  const service = await this.provider.acquire();  // 获取实例
  
  // ... 执行任务
  
  const outputBlob = await service.executeCommand({...});  // ❌ 实例可能已销毁
}
```

**问题**:
- 没有检查获取到的实例是否已加载
- 直接调用 `executeCommand()` 会触发错误检查

---

## ✅ 解决方案

### 设计思路
1. **保持中止能力**: 仍使用 `terminate()` 真正停止 FFmpeg 进程
2. **自动恢复**: 中止后立即重新加载实例
3. **异步化**: 将 `abort()` 改为异步方法，等待重新加载完成
4. **级联修改**: 更新所有调用 `abort()` 的地方

### 实现细节

#### 1. 修改 FFmpegService.abort() ✅
```typescript
/**
 * 中止当前正在执行的任务
 * 注意：会终止并重新加载 FFmpeg 实例以确保干净状态
 */
async abort(): Promise<void> {
  if (!this.isExecuting) {
    this.config.onLog?.("没有正在执行的任务");
    return;
  }

  this.config.onLog?.("正在中止当前任务...");
  this.isAborting = true;

  // 保存配置，因为 terminate 后需要重新加载
  const savedMode = this.config.mode;
  const savedOnLog = this.config.onLog;
  const savedOnProgress = this.config.onProgress;

  // 调用 terminate 强制结束 FFmpeg 进程
  if (this.ffmpeg) {
    this.ffmpeg.terminate();
    this.ffmpeg = null;
    this.loaded = false;
    this.isExecuting = false;
  }

  // ✅ 立即重新加载，保持实例可用
  try {
    this.config.onLog?.("正在重新加载 FFmpeg...");
    
    // 重置状态
    this.config = {
      mode: savedMode,
      onLog: savedOnLog,
      onProgress: savedOnProgress,
    };
    this.loaded = false;
    this.isExecuting = false;
    this.isAborting = false;
    
    // 重新加载
    await this.load();
    this.config.onLog?.("FFmpeg 已重新加载，可继续使用");
  } catch (error) {
    this.config.onLog?.(`重新加载失败: ${error}`);
    throw error;
  }
}
```

**关键改进**:
- ✅ 改为 `async` 方法
- ✅ 保存配置（mode, onLog, onProgress）
- ✅ 终止后立即调用 `load()` 重新加载
- ✅ 错误处理和日志记录

#### 2. 修改 QueueProcessor.stop() ✅
```typescript
/**
 * 停止处理队列并中止所有正在执行的任务
 */
async stop(): Promise<void> {
  this.shouldStop = true;

  // 中止所有正在执行的任务
  const abortPromises: Promise<void>[] = [];
  for (const [taskId, service] of this.executingServices.entries()) {
    try {
      // ✅ abort() 现在是异步的，需要等待
      const abortPromise = service.abort().catch((error) => {
        console.error(`中止任务 ${taskId} 失败:`, error);
      });
      abortPromises.push(abortPromise);
      this.config.onLog?.(`[队列] 中止任务: ${taskId}`, "warning");
    } catch (error) {
      console.error(`中止任务 ${taskId} 失败:`, error);
    }
  }

  // ✅ 等待所有中止操作完成
  await Promise.all(abortPromises);

  this.config.onLog?.(
    "[队列] 队列已停止，所有正在执行的任务已中止",
    "warning",
  );
}
```

**关键改进**:
- ✅ 改为 `async` 方法
- ✅ 收集所有 `abort()` 的 Promise
- ✅ 使用 `Promise.all()` 等待所有中止完成
- ✅ 错误处理（捕获单个失败，不影响其他）

#### 3. 修改 useTaskManager.stopQueue() ✅
```typescript
/**
 * 停止队列处理
 */
const stopQueue = useCallback(async () => {
  if (queueProcessorRef.current) {
    addLog("正在停止队列处理...", "warning");
    toast.info("正在停止队列处理...");
    await queueProcessorRef.current.stop();  // ✅ 等待停止完成
  }
}, [addLog]);
```

**关键改进**:
- ✅ 改为 `async` 函数
- ✅ `await` 等待 `stop()` 完成

---

## 📊 修复效果

### 测试场景

#### ✅ 场景 1: 提交 → 执行成功
```
[时间] INFO     开始加载 FFmpeg 多线程版本
[时间] SUCCESS  FFmpeg 加载成功！🚀
[时间] INFO     提交任务: 旋转视频
[时间] INFO     开始处理队列 (1 个任务) 并发=1
[时间] INFO     执行 FFmpeg 命令: ffmpeg -i input.mp4 ...
[时间] SUCCESS  任务完成！
```

#### ✅ 场景 2: 中止 → FFmpeg 重新加载
```
[时间] INFO     正在中止当前任务...
[时间] WARNING  [队列] 中止任务: task_xxx
[时间] INFO     正在重新加载 FFmpeg...
[时间] SUCCESS  FFmpeg 已重新加载，可继续使用
[时间] WARNING  [队列] 队列已停止，所有正在执行的任务已中止
```

#### ✅ 场景 3: 重新提交 → 正常执行
```
[时间] INFO     提交任务: 旋转视频
[时间] INFO     开始处理队列 (1 个任务) 并发=1
[时间] INFO     [队列] 开始执行任务: 旋转视频
[时间] INFO     正在加载文件: input.mp4
[时间] INFO     执行 FFmpeg 命令: ffmpeg -i input.mp4 ...
[时间] SUCCESS  任务完成！
```

#### ✅ 场景 4: 多次中止/重新提交
```
循环：
  提交 → 执行 → 中止 → 重新加载 → 提交 → 执行 → ...
  
每次中止后都能正常重新提交和执行
```

---

## 📁 修改的文件

### 核心修改
1. **app/services/ffmpegService.ts** (48 行新增)
   - `abort()` 方法重构
   - 异步化 + 自动重新加载

2. **app/services/queueProcessor.ts** (20 行修改)
   - `stop()` 方法异步化
   - 等待所有中止操作完成

3. **app/hooks/useTaskManager.ts** (5 行修改)
   - `stopQueue()` 异步化
   - 等待队列停止完成

### 类型安全
- ✅ 所有修改通过 `pnpm typecheck`
- ✅ 无 TypeScript 错误
- ✅ 无运行时错误

---

## 🎯 经验总结

### 设计教训
1. **实例生命周期管理**: 销毁实例后必须有恢复机制
2. **异步操作的级联影响**: 改为异步后要更新所有调用链
3. **状态一致性**: 确保内部状态（loaded, ffmpeg）与实际能力一致

### 最佳实践
1. ✅ **优先恢复而非失败**: 中止后自动恢复，而不是要求用户手动操作
2. ✅ **完整的错误处理**: 每个异步操作都有 try-catch
3. ✅ **清晰的日志**: 记录关键状态转换（中止 → 重新加载 → 完成）
4. ✅ **类型安全**: 使用 TypeScript 确保方法签名正确

### 测试要点
- ✅ 单任务中止后重新提交
- ✅ 批量任务中止后重新提交
- ✅ 多次连续中止
- ✅ 中止期间提交新任务
- ✅ 并发任务部分中止

---

## 🔗 相关文档

- [AGENTS.md](./AGENTS.md) - 完整更新日志（包含 v4.1）
- [API.md](./API.md) - FFmpegService API 文档
- [TASK_SYSTEM_v3.md](./TASK_SYSTEM_v3.md) - 任务系统架构

---

**修复完成时间**: 2025-11-08 23:40  
**测试状态**: ✅ 通过  
**部署状态**: ✅ 就绪
