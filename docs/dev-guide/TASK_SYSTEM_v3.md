# 任务系统优化 v3.0

## 概述

本次更新系统性地优化了 FFmpeg Web 的任务系统，实现了以下目标：

1. **输入和输出作为动态参数**：不再使用固定的 `inputFiles` 和 `outputFileName` 字段，改为通过 `formSchema` 中的特殊字段类型 (`file-input`, `file-output`) 定义
2. **支持多输入**：通过 `file-input` 字段支持多文件上传、类型限制、数量限制
3. **智能内存检测**：根据命令类型和文件大小自动判断是否可以执行，支持手动配置限制

## 核心变更

### 1. 类型系统升级

#### `FormField` 类型扩展

新增两种字段类型：

```typescript
type: 'file-input' | 'file-output'

// file-input 特有属性
accept?: string;         // 允许的文件类型
multiple?: boolean;      // 是否允许多文件
maxFiles?: number;       // 最大文件数量
maxSizeMB?: number;      // 单个文件最大大小（MB）

// file-output 特有属性
defaultExtension?: string;  // 默认文件扩展名
mimeType?: string;          // 输出 MIME 类型
```

#### `CommandPreset` 类型更新

```typescript
export interface CommandPreset {
  // ... 其他字段

  // 已废弃但保留向后兼容
  inputFiles?: Array<{ name: string; pattern?: string }>;
  outputFileName?: string;
  outputMimeType?: string;

  // 新增：性能配置
  requiresReencode?: boolean;      // 是否需要重新编码
  estimatedMemoryMB?: number;      // 预估内存需求（MB）
  
  // formSchema 现在包含文件输入输出
  formSchema?: FormField[];
}
```

### 2. DynamicForm 组件更新

**文件输入字段渲染** (`file-input`):
- 使用 `<input type="file">` 支持文件上传
- 支持 `multiple` 属性多文件选择
- 显示已选文件列表和大小
- 文件类型和数量限制

**文件输出字段渲染** (`file-output`):
- 文本输入框设置输出文件名
- 显示默认扩展名徽章
- 支持占位符和描述

### 3. 智能内存检测

#### 命令分析函数

**detectRequiresReencode(args: string[])**
```typescript
// 检测命令是否需要重新编码
// - 检查 `-c copy` 参数
// - 检查编码器（libx264, libvpx-vp9 等）
// - 检查滤镜参数（-vf, -filter_complex）
```

**estimateMemoryRequirement(args: string[], requiresReencode: boolean)**
```typescript
// 估算内存需求
// - 基础内存: 仅复制 50MB, 重新编码 200MB
// - 复杂滤镜额外 +100-150MB
// - 重量级编码器 +100MB
```

#### 文件大小验证

**validateFileSize(files: File[], preset: CommandPreset)**
```typescript
// 返回: { valid: boolean; message?: string; recommendedMaxMB?: number }
// 
// 默认限制：
// - 重新编码：< 200MB
// - 仅复制：< 500MB
//
// 可通过 formSchema 中的 maxSizeMB 手动覆盖
```

### 4. 预设命令更新

所有默认预设命令已更新使用新体系：

```typescript
{
  name: '复制流（不重新编码）',
  ffmpegArgs: ['-i', '{{input}}', '-c', 'copy', '{{output}}'],
  requiresReencode: false,
  estimatedMemoryMB: 50,
  formSchema: [
    createInput(500),    // 最大 500MB
    createOutput('mp4'),
  ],
}
```

多输入示例：

```typescript
{
  name: '合并视频',
  ffmpegArgs: ['-i', '{{input1}}', '-i', '{{input2}}', '-filter_complex', '...', '{{output}}'],
  requiresReencode: true,
  estimatedMemoryMB: 350,
  formSchema: [
    {
      name: 'input1',
      label: '第一个视频',
      type: 'file-input',
      accept: 'video/*',
      maxSizeMB: 150,
      required: true,
    },
    {
      name: 'input2',
      label: '第二个视频',
      type: 'file-input',
      accept: 'video/*',
      maxSizeMB: 150,
      required: true,
    },
    createOutput('mp4'),
  ],
}
```

### 5. 工具函数扩展

**新增辅助函数** (`commandUtils.ts`):

```typescript
// 文件字段提取
getFileInputFields(preset: CommandPreset): FormField[]
getFileOutputField(preset: CommandPreset): FormField | undefined

// 标准字段创建
createSingleInputField(name?, accept?, maxSizeMB?, description?): FormField
createMultiInputField(name?, accept?, maxFiles?, maxSizeMB?, description?): FormField
createOutputField(name?, defaultValue?, defaultExtension?, mimeType?, description?): FormField

// 内存检测
detectRequiresReencode(args: string[]): boolean
estimateMemoryRequirement(args: string[], requiresReencode: boolean): number
validateFileSize(files: File[], preset: CommandPreset): { valid, message?, recommendedMaxMB? }
```

## 向后兼容性

为保持兼容性，系统同时支持新旧两种方式：

1. **新预设**：使用 `formSchema` 中的 `file-input` 和 `file-output` 字段
2. **旧预设**：仍可使用 `inputFiles` 和 `outputFileName` 字段

类型定义中这些旧字段标记为可选 (`?`)，不影响现有代码。

## 使用示例

### 创建单输入预设

```typescript
{
  name: '视频压缩',
  description: '使用 H.264 编码器压缩视频',
  category: '视频编辑',
  ffmpegArgs: ['-i', '{{input}}', '-c:v', 'libx264', '-crf', '28', '{{output}}'],
  requiresReencode: true,
  estimatedMemoryMB: 250,
  formSchema: [
    {
      name: 'input',
      label: '输入文件',
      type: 'file-input',
      accept: 'video/*',
      maxSizeMB: 200,
      description: '选择要压缩的视频',
      required: true,
    },
    {
      name: 'output',
      label: '输出文件名',
      type: 'file-output',
      defaultValue: 'compressed.mp4',
      defaultExtension: 'mp4',
      required: true,
    },
  ],
}
```

### 创建多输入预设

```typescript
{
  name: '批量合并',
  description: '合并多个视频文件',
  category: '视频编辑',
  ffmpegArgs: [...],
  requiresReencode: true,
  estimatedMemoryMB: 400,
  formSchema: [
    {
      name: 'inputs',
      label: '视频文件',
      type: 'file-input',
      accept: 'video/*',
      multiple: true,
      maxFiles: 5,
      maxSizeMB: 150,
      description: '选择要合并的视频（最多5个）',
      required: true,
    },
    {
      name: 'output',
      label: '输出文件',
      type: 'file-output',
      defaultValue: 'merged.mp4',
      defaultExtension: 'mp4',
      required: true,
    },
  ],
}
```

### 智能内存限制配置

```typescript
// 方式1：手动指定
formSchema: [
  {
    name: 'input',
    type: 'file-input',
    maxSizeMB: 300,  // 手动设置限制
  }
]

// 方式2：自动推断（基于命令）
requiresReencode: false,  // 仅复制，自动允许 500MB
estimatedMemoryMB: 50,

// 方式3：完全自动（从 ffmpegArgs 分析）
// 系统会调用 detectRequiresReencode() 和 estimateMemoryRequirement()
```

## 技术实现

### 文件处理流程

1. **表单值收集**：用户选择文件存储在 `formValues` 中（`File` 或 `File[]` 类型）
2. **文件大小验证**：调用 `validateFileSize()` 检查是否超限
3. **文件名生成**：为上传的文件生成简单文件名（`input.mp4`, `input1.mp4` 等）
4. **模板替换**：将 `{{input}}`, `{{output}}` 等替换为实际文件名
5. **WASM写入**：将文件写入 FFmpeg WASM 虚拟文件系统
6. **命令执行**：使用替换后的参数执行 FFmpeg 命令

### 类型安全

所有文件操作保持类型安全：

```typescript
// formValues 类型
Record<string, string | number | boolean | File | File[]>

// 模板替换时分离文件和普通值
const replacementValues: Record<string, string | number | boolean> = {};
// File -> 文件名字符串
// File[] -> 文件名列表
```

## 性能优化

1. **内存预估**：根据命令类型和文件大小提前计算内存需求
2. **早期验证**：在执行前验证文件大小，避免浪费时间
3. **用户提示**：超限时显示警告并允许用户决定是否继续
4. **合理默认值**：
   - 仅复制模式：500MB（较宽松）
   - 重新编码：200MB（保守）
   - 复杂滤镜：更严格限制

## 未来扩展

1. **更多文件类型支持**：图片、字幕文件等
2. **文件预览**：上传前预览视频信息
3. **批处理模式**：多个输入生成多个输出
4. **内存监控**：实时监控 WASM 内存使用
5. **智能推荐**：根据设备性能动态调整限制

## 测试建议

1. **单文件上传**：测试基本文件输入输出
2. **多文件上传**：测试 `multiple` 和 `maxFiles`
3. **文件大小限制**：测试超限警告和拒绝
4. **命令类型检测**：验证 copy vs re-encode 识别
5. **内存估算**：检查不同命令的内存预估准确性
6. **向后兼容**：确保旧预设仍能正常工作

## 版本信息

- **版本**: 3.0
- **日期**: 2025-11-08
- **主要贡献**: 输入输出动态化、多输入支持、智能内存检测

---

*此文档描述了 FFmpeg Web v3.0 的任务系统优化内容。*
