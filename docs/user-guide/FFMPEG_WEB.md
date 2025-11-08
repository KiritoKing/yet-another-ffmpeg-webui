# FFmpeg Web - 功能完整的视频处理界面

## 🎯 项目概述

FFmpeg Web 是一个基于 React Router v7 和 FFmpeg.wasm 的完整视频处理 Web 应用，提供了专业级的命令管理和执行功能。

## ✨ 核心功能

### 1. 命令预设管理
- ✅ **CRUD 操作**: 创建、读取、更新、删除命令预设
- ✅ **分类管理**: 按类别组织命令（基础、格式转换、视频编辑等）
- ✅ **持久化存储**: 使用 localStorage 自动保存，刷新页面不丢失
- ✅ **内置预设**: 提供 8 个常用命令预设，开箱即用

### 2. 导入导出功能
- ✅ **JSON 导出**: 导出单个或全部命令为 JSON 文件
- ✅ **JSON 导入**: 从 JSON 文件批量导入命令
- ✅ **CLI 解析**: 将 FFmpeg 命令行参数解析为 JSON 格式
- ✅ **批量操作**: 支持一次导入多个命令预设

### 3. 命令编辑器
- ✅ **可视化编辑**: 友好的表单界面编辑命令参数
- ✅ **多文件支持**: 支持配置多个输入文件
- ✅ **文件类型过滤**: 可为每个输入文件指定类型（视频/音频/图片）
- ✅ **实时验证**: 保存前验证必填字段

### 4. 进度和日志优化
- ✅ **真实进度**: 显示 FFmpeg 执行的真实进度百分比
- ✅ **折叠日志**: 默认折叠状态，只显示关键信息
- ✅ **进度条**: 实时更新的进度条动画
- ✅ **统计信息**: 显示日志总数、错误数、警告数
- ✅ **信息密度优化**: 紧凑的日志显示，提高信息密度
- ✅ **颜色编码**: 不同类型日志使用不同颜色（错误/警告/成功/信息）

### 5. 执行功能
- ✅ **命令执行**: 执行选中的预设命令
- ✅ **文件管理**: 为每个输入文件选择对应的本地文件
- ✅ **输出预览**: 支持视频、音频、图片的在线预览
- ✅ **文件下载**: 一键下载处理后的文件

## 📁 项目结构

```
app/
├── components/
│   ├── CommandEditor.tsx         # 命令编辑器组件
│   ├── CommandList.tsx            # 命令列表组件
│   ├── ProgressLogViewer.tsx      # 进度和日志查看器
│   ├── FileUploader.tsx           # 文件上传组件（已有）
│   ├── InfoPanel.tsx              # 信息面板组件（已有）
│   ├── LogViewer.tsx              # 日志查看器（已有）
│   ├── ModeSelect.tsx             # 模式选择组件（已有）
│   └── VideoPlayer.tsx            # 视频播放器组件（已有）
├── routes/
│   ├── home.tsx                   # 首页
│   ├── ffmpeg-web.tsx             # 🆕 FFmpeg Web 完整界面
│   ├── ffmpeg-demo.tsx            # 简单演示页面
│   └── ffmpeg-advanced.tsx        # 高级自定义命令页面
├── services/
│   └── ffmpegService.ts           # FFmpeg 核心服务
├── store/
│   ├── commandStore.ts            # 🆕 命令预设状态管理
│   └── logStore.ts                # 日志状态管理
├── types/
│   ├── command.ts                 # 🆕 命令类型定义
│   └── log.ts                     # 日志类型定义
└── utils/
    └── commandUtils.ts            # 🆕 命令工具函数
```

## 🔧 技术栈

- **框架**: React 19 + React Router v7
- **状态管理**: Zustand v5 (带 persist 中间件)
- **样式**: TailwindCSS v4
- **核心功能**: FFmpeg.wasm v0.12.15
- **类型系统**: TypeScript v5
- **构建工具**: Vite v7

## 📊 数据结构

### CommandPreset (命令预设)

```typescript
interface CommandPreset {
  id: string;                      // 唯一标识
  name: string;                    // 命令名称
  description: string;             // 描述
  category: string;                // 分类
  ffmpegArgs: string[];            // FFmpeg 参数数组
  inputFiles: Array<{              // 输入文件配置
    name: string;                  // 文件名（虚拟文件系统中的名称）
    pattern?: string;              // 文件类型过滤（如 "video/*"）
  }>;
  outputFileName: string;          // 输出文件名
  outputMimeType?: string;         // 输出 MIME 类型
  createdAt: number;               // 创建时间
  updatedAt: number;               // 更新时间
}
```

## 🎨 界面设计

### 布局结构
- **顶部工具栏**: 加载 FFmpeg、导入导出、新建命令
- **左侧边栏** (1/3): 命令列表，按分类分组
- **右侧主区** (2/3):
  - 命令详情和文件选择
  - 进度和日志显示
  - 输出预览

### 交互优化
1. **响应式设计**: 适配桌面和移动设备
2. **悬停效果**: 命令卡片悬停显示操作按钮
3. **模态框**: 编辑器和导入界面使用模态框
4. **加载状态**: 处理中显示加载动画
5. **即时反馈**: 操作后立即显示成功/失败提示

## 📦 内置预设命令

1. **复制流（不重新编码）** - 快速复制，速度最快
2. **转换为 WebM** - VP9 + Opus 编码
3. **提取音频为 MP3** - 从视频中提取音频
4. **调整分辨率（720p）** - 缩放到 1280x720
5. **提取视频片段** - 剪辑指定时间段
6. **转换为 GIF** - 生成动图
7. **压缩视频** - H.264 压缩
8. **合并视频** - 拼接多个视频

## 🚀 使用流程

### 基本流程
1. 点击"加载 FFmpeg"（选择单线程或多线程模式）
2. 从左侧选择预设命令
3. 为每个输入文件选择本地文件
4. 点击"执行命令"
5. 查看进度和日志
6. 预览或下载输出文件

### 自定义命令
1. 点击"新建命令"
2. 填写命令名称、描述、分类
3. 配置输入文件
4. 输入 FFmpeg 参数
5. 设置输出文件名
6. 保存并使用

### 导入导出
- **导出单个**: 点击命令卡片上的导出按钮
- **导出全部**: 点击顶部"导出全部"按钮
- **导入 JSON**: 点击"导入 JSON"，选择 JSON 文件
- **从 CLI 导入**: 点击"从 CLI 导入"，粘贴命令行

## 🎯 进度显示优化

### 折叠状态（默认）
- 显示当前步骤
- 显示进度百分比和进度条
- 显示统计信息（日志数、错误数、警告数）
- 提供"展开详情"按钮

### 展开状态
- 显示最近 50 条日志
- 按类型颜色编码
- 显示时间戳
- 提供"清除日志"按钮

### 日志优化
- **信息密度**: 紧凑布局，单行显示
- **颜色区分**: 
  - 🔴 错误: 红色背景
  - 🟡 警告: 黄色背景
  - 🟢 成功: 绿色背景
  - ⚪ 信息: 白色背景
- **滚动优化**: 自动滚动到最新日志
- **性能优化**: 只显示最近 50 条，避免卡顿

## 🔒 数据持久化

使用 Zustand 的 `persist` 中间件，数据存储在 `localStorage`:

```typescript
{
  name: 'ffmpeg-command-presets',
  onRehydrateStorage: () => (state) => {
    // 首次加载时，如果没有预设，自动添加默认预设
    if (state && state.presets.length === 0) {
      // 添加内置预设...
    }
  }
}
```

## 🛠️ 工具函数

### CLI 解析器
```typescript
parseCLICommand(cliCommand: string): Partial<CommandPreset>
```
将 FFmpeg CLI 命令解析为 JSON 格式，支持引号包裹的参数。

### 导入导出
```typescript
exportPresetsToJSON(presets: CommandPreset[]): string
exportPresetToJSON(preset: CommandPreset): string
importPresetsFromJSON(json: string): CommandPreset[]
```

### 验证
```typescript
validatePreset(preset: Partial<CommandPreset>): string[]
```
验证命令预设的完整性，返回错误列表。

## 📝 待优化项

1. **搜索功能**: 在命令列表中搜索
2. **收藏功能**: 标记常用命令
3. **历史记录**: 记录执行历史
4. **模板系统**: 参数化命令模板
5. **批量处理**: 一次处理多个文件
6. **云端同步**: 跨设备同步命令预设

## 🐛 已知问题

1. **内存限制**: WebAssembly 有内存限制，大文件可能失败
2. **浏览器兼容性**: 多线程模式需要 SharedArrayBuffer 支持
3. **编码器支持**: 部分编码器在 WASM 中不可用

## 📚 相关文档

- [API.md](./API.md) - FFmpegService API 文档
- [AGENTS.md](./AGENTS.md) - AI 协作开发文档
- [README.md](./README.md) - 项目说明文档

## 🎉 总结

FFmpeg Web 提供了一个完整的、生产级别的 FFmpeg 浏览器应用，具有：
- ✅ 专业的命令管理系统
- ✅ 友好的用户界面
- ✅ 完整的导入导出功能
- ✅ 优化的进度和日志显示
- ✅ 数据持久化存储
- ✅ 类型安全的代码

访问 `/ffmpeg-web` 体验完整功能！
