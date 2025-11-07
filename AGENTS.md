# AGENTS.md

## 项目概述

**项目名称**: ffmpeg-easy  
**项目描述**: 基于 React Router 的 FFmpeg 简化工具 Web 应用  
**技术栈**: React Router v7, React 19, TypeScript, TailwindCSS v4, shadcn/ui, Vite

---

## 项目结构

```
ffmpeg-easy/
├── app/                    # 应用程序主目录
│   ├── app.css            # 全局样式
│   ├── root.tsx           # 根组件（包含 COOP/COEP 头配置）
│   ├── routes.ts          # 路由配置
│   ├── components/        # 可复用组件
│   │   ├── CommandEditor.tsx   # 命令编辑器（shadcn/ui）
│   │   ├── CommandList.tsx     # 命令列表（shadcn/ui）
│   │   ├── CommandFilter.tsx   # 命令分类筛选器
│   │   ├── CommandPanel.tsx    # 命令列表面板（整合 Filter + List）
│   │   ├── ExecutionPanel.tsx  # 执行面板（命令信息+表单+进度+输出）
│   │   ├── FFmpegToolbar.tsx   # 顶部工具栏组件
│   │   ├── FFmpegDialogs.tsx   # 对话框组件集合
│   │   ├── InitializationDialog.tsx # 初始化对话框（居中模式选择）
│   │   ├── ProgressLogViewer.tsx # 优化的进度和日志组件（shadcn/ui）
│   │   ├── DynamicForm.tsx     # 动态表单组件（基于 JSON Schema）
│   │   ├── ArgsEditor.tsx      # FFmpeg 参数编辑器
│   │   ├── FormSchemaEditor.tsx # 表单字段配置编辑器
│   │   └── ui/            # shadcn/ui 组件库
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── input.tsx
│   │       ├── select.tsx
│   │       ├── dialog.tsx
│   │       ├── alert-dialog.tsx
│   │       ├── progress.tsx
│   │       ├── badge.tsx
│   │       ├── label.tsx
│   │       ├── textarea.tsx
│   │       ├── separator.tsx
│   │       ├── collapsible.tsx
│   │       ├── slider.tsx
│   │       ├── scroll-area.tsx
│   │       ├── radio-group.tsx
│   │       ├── tooltip.tsx
│   │       ├── form.tsx
│   │       └── sonner.tsx
│   ├── lib/               # 工具库
│   │   └── utils.ts       # cn() 等工具函数
│   ├── hooks/             # 自定义 Hooks
│   │   └── useFFmpegWeb.ts # FFmpeg Web 业务逻辑 Hook
│   ├── routes/            # 路由页面
│   │   ├── home.tsx       # 首页
│   │   ├── ffmpeg-web.tsx # FFmpeg Web 主界面（重构后）
│   │   ├── ffmpeg-demo.tsx     # FFmpeg 简单演示页面
│   │   └── ffmpeg-advanced.tsx # FFmpeg 高级自定义页面
│   ├── services/          # 业务服务层
│   │   └── ffmpegService.ts    # FFmpeg 核心服务封装
│   ├── store/             # 全局状态管理（Zustand）
│   │   ├── commandStore.ts # 命令预设状态管理（持久化）
│   │   ├── logStore.ts    # 日志状态管理
│   │   └── ffmpegWebStore.ts # FFmpeg Web 页面状态管理（持久化模式偏好）
│   ├── types/             # 类型定义
│   │   ├── command.ts     # 命令预设类型定义
│   │   └── log.ts         # 日志类型定义
│   ├── utils/             # 工具函数（模块化）
│   │   ├── parsers.ts     # CLI 解析和导入导出
│   │   ├── validators.ts  # 命令验证和文件大小检查
│   │   ├── templates.ts   # 模板变量处理
│   │   ├── fileHelpers.ts # 文件字段配置工具
│   │   └── index.ts       # 统一导出
│   └── welcome/           # 欢迎页面组件
│       └── welcome.tsx
├── public/                # 静态资源目录
├── .github/               # GitHub 配置
│   └── prompts/          # AI 提示词
├── components.json        # shadcn/ui 配置
├── Dockerfile             # Docker 容器配置
├── package.json           # 项目依赖配置
├── pnpm-lock.yaml         # pnpm 锁文件
├── react-router.config.ts # React Router 配置
├── tsconfig.json          # TypeScript 配置
├── vite.config.ts         # Vite 构建配置（包含 CORS 头配置）
├── AGENTS.md              # AI 协作开发文档
├── API.md                 # FFmpegService API 文档
├── CUSTOM_FORMS.md        # 自定义表单功能文档
├── FFMPEG_WEB.md          # FFmpeg Web 功能完整文档
└── README.md              # 项目说明文档
```

---

## 开发指南

### 环境要求
- Node.js (推荐 v18+)
- pnpm (包管理器)

### 常用命令
```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 类型检查
pnpm typecheck

# 构建生产版本
pnpm build

# 启动生产服务器
pnpm start
```

### 开发服务器
- 本地开发地址: `http://localhost:5173`
- 支持热模块替换 (HMR)
- 服务端渲染 (SSR)

---

## 架构设计

### 前端架构
- **框架**: React 19 with React Router v7
- **样式方案**: TailwindCSS v4
- **组件库**: shadcn/ui (基于 Radix UI)
- **图标库**: lucide-react
- **构建工具**: Vite v7
- **类型系统**: TypeScript v5
- **状态管理**: Zustand v5 (轻量级全局状态)
- **核心功能**: FFmpeg.wasm (WebAssembly 视频处理)

### 路由系统
- 使用 React Router v7 的文件系统路由
- 支持服务端渲染 (SSR)
- 数据加载和变更通过 loader/action
- 客户端特定功能通过 `useEffect` 和 `isClient` 标志处理

### FFmpeg 集成
- **库**: @ffmpeg/ffmpeg v0.12.15
- **核心**: 
  - @ffmpeg/core v0.12.6 (单线程版本)
  - @ffmpeg/core-mt v0.12.6 (多线程版本)
- **工具**: @ffmpeg/util v0.12.2
- **特性**:
  - 支持单线程和多线程模式切换
  - 多线程需要 SharedArrayBuffer (COOP/COEP 头配置)
  - 服务层封装（FFmpegService）
  - 实时日志和进度反馈

---

## AI 代理协作指南

### 代码修改原则
1. **保持一致性**: 遵循现有代码风格和架构模式
2. **类型安全**: 所有新增代码必须有完整的 TypeScript 类型
3. **组件化**: 遵循 React 组件化开发原则
4. **路由优先**: 新页面应在 `app/routes/` 目录下创建

### 文件操作规范
- 新增路由页面: `app/routes/<route-name>.tsx`
- 新增组件: 根据功能在相应目录创建
- 样式文件: 使用 TailwindCSS 工具类，必要时在 `app.css` 添加全局样式

### 依赖管理
- 使用 `pnpm` 管理依赖
- 添加依赖前检查是否与现有依赖冲突
- 优先使用项目已有的依赖库

---

## 关键技术点

### React Router v7 特性
- 文件系统路由
- 服务端渲染 (SSR)
- 数据加载 (loader)
- 数据变更 (action)
- 类型安全的路由

### TailwindCSS v4
- 使用 Vite 插件集成
- 支持最新的 CSS 特性
- 工具优先的样式方案

### shadcn/ui 组件库
- 基于 Radix UI 的无障碍组件
- 使用 TailwindCSS 样式
- 可复制粘贴的组件代码
- 完全可定制
- 已集成组件：Button, Card, Input, Textarea, Select, Dialog, Progress, Badge, Label, Separator, Collapsible, ScrollArea

### FFmpeg.wasm 注意事项
1. **SSR 兼容性**: FFmpeg 只能在客户端运行，需要使用 `useEffect` 延迟初始化
2. **SharedArrayBuffer**: 多线程模式需要配置以下 HTTP 头：
   ```typescript
   "Cross-Origin-Opener-Policy": "same-origin"
   "Cross-Origin-Embedder-Policy": "require-corp"
   ```
3. **内存限制**: WebAssembly 有内存限制，建议：
   - 使用 `-c copy` 模式避免重新编码
   - 限制视频文件大小（< 500MB）
   - 控制线程数量（建议 4 线程）
   - 使用较快的预设（如 `ultrafast`）
4. **文件处理**: 
   - 使用简单文件名避免特殊字符问题
   - 及时清理虚拟文件系统中的临时文件
   - 将 Uint8Array 转换为 ArrayBuffer 避免 SharedArrayBuffer 兼容性问题

### 状态管理（Zustand）
- 轻量级，无需 Provider
- TypeScript 友好
- 用于全局日志管理
- 示例：
  ```typescript
  const useLogStore = create<LogStore>((set) => ({
    logs: [],
    addLog: (message, type) => set((state) => ({
      logs: [...state.logs, { id, timestamp, message, type }]
    })),
  }));
  ```

---

## 部署说明

### Docker 部署
```bash
# 构建镜像
docker build -t ffmpeg-easy .

# 运行容器
docker run -p 3000:3000 ffmpeg-easy
```

### 支持的平台
- AWS ECS
- Google Cloud Run
- Azure Container Apps
- Digital Ocean App Platform
- Fly.io
- Railway

---

## 代码规范

### 文件大小限制
- **单文件不超过 500 行**: 保持代码可读性和可维护性
- 超过 500 行的文件应拆分为多个专职模块
- 使用 `index.ts` 统一导出接口

### 代码组织原则
1. **单一职责**: 每个文件/模块只负责一个功能
2. **关注点分离**: 数据层、逻辑层、视图层分离
3. **可复用性**: 组件和工具函数应设计为可复用
4. **可测试性**: 业务逻辑独立，便于单元测试

### TypeScript 规范
- 所有代码必须有完整的类型定义
- 避免使用 `any` 类型
- 优先使用接口（interface）定义对象类型
- 使用 Biome 进行代码检查和格式化

### 组件规范
- React 组件使用函数式组件
- 使用 shadcn/ui 组件库保持 UI 一致性
- Props 接口命名：`{ComponentName}Props`
- 组件文件命名：PascalCase（如 `CommandEditor.tsx`）

---

## 注意事项

1. **生产构建**: 部署前务必运行 `pnpm build`
2. **环境变量**: 根据需要配置环境变量
3. **类型检查**: 提交前运行 `pnpm typecheck` 确保类型正确
4. **代码风格**: 遵循 TypeScript 和 React 最佳实践
5. **文件拆分**: 超过 500 行的文件必须拆分

---

## 更新日志

### 2025-11-09 (v3.2)
- **工具函数模块化与 UX 优化**
  - 拆分 commandUtils.ts (683行) 为 4 个专职模块：
    - `parsers.ts` (273行): CLI 解析和导入导出功能
    - `validators.ts` (191行): 命令验证和文件大小检查
    - `templates.ts` (80行): 模板变量处理
    - `fileHelpers.ts` (87行): 文件字段配置工具
    - 创建 `utils/index.ts` 统一导出
  - 初始化体验优化：
    - 创建 `InitializationDialog` 组件
    - 居中对话框显示模式选择（多线程/单线程）
    - 支持"记住我的选择"功能
    - 下次访问自动加载用户偏好
  - 状态管理增强：
    - 扩展 `ffmpegWebStore` 添加 `savedMode`, `showInitDialog` 状态
    - 使用 zustand `persist` 中间件持久化用户偏好
    - 仅持久化必要状态（`savedMode`）
  - UI/UX 改进：
    - 在加载中和未加载状态添加功能特点提示
    - 统一首页和主界面的功能介绍展示
  - 代码质量：
    - 所有模块通过 TypeScript 类型检查
    - 遵循单文件不超过 500 行的规范
    - 安装 shadcn/ui `radio-group` 组件

### 2025-11-08 (v3.1)
- **路由清理与规范建立**
  - 删除测试路由：移除 `ffmpeg-demo.tsx` 和 `ffmpeg-advanced.tsx`
  - 简化用户体验：将首页直接重定向到 FFmpeg Web 主界面
  - 清理备份文件：删除 `ffmpeg-web.backup.tsx`
  - 建立代码规范：
    - 新增"代码规范"章节到 AGENTS.md
    - 明确单文件不超过 500 行的规则
    - 规范代码组织、TypeScript 使用和组件命名

### 2025-11-08 (v3.0)
- **重大重构**: 数据层、逻辑层、视图层分离
  - 创建 `ffmpegWebStore.ts` 全局状态管理
    - 集中管理所有页面状态（18+ 状态变量）
    - 提供清晰的 actions 接口
    - 支持状态重置功能
  - 创建 `useFFmpegWeb.ts` 自定义 Hook
    - 封装所有业务逻辑（10+ 核心方法）
    - 统一处理 FFmpeg 操作和错误
    - 与 store 解耦，便于测试
  - 组件化重构
    - `FFmpegToolbar`: 顶部工具栏（加载、设置、导入导出）
    - `CommandPanel`: 命令列表面板（筛选 + 列表）
    - `ExecutionPanel`: 执行面板（表单 + 进度 + 输出）
    - `FFmpegDialogs`: 对话框集合（编辑器、CLI导入、设置、确认）
  - `ffmpeg-web.tsx` 重写
    - 从 1164 行精简到 238 行（减少 80%）
    - 清晰的数据流：Store → Hook → Components
    - 更易维护和测试
- **代码质量提升**
  - 完全类型安全，无 TypeScript 错误
  - 通过 Biome 代码检查
  - 添加 `extractNonFileValues` 工具函数到 commandUtils
  - 备份原文件为 `ffmpeg-web.backup.tsx`
- **架构优化**
  - 单一职责原则：每个文件职责明确
  - 关注点分离：数据、逻辑、视图互不耦合
  - 可复用性：组件和 Hook 可在其他页面复用
  - 可测试性：逻辑层独立，便于单元测试

### 2025-11-07 (v2.2)
- **自定义表单功能**: 为命令预设添加可视化表单配置
  - 扩展 CommandPreset 类型，添加 formSchema 字段
  - 创建 DynamicForm 组件支持 5 种字段类型
    - text（文本输入）
    - number（数字输入）
    - select（下拉选择）
    - slider（滑块）
    - checkbox（复选框）
  - 实现模板变量替换系统（`{{variableName}}` 语法）
  - 添加工具函数：
    - replaceTemplateVariables: 替换命令中的模板变量
    - getDefaultFormValues: 获取表单默认值
  - 安装 shadcn/ui slider 组件
  - 新增预设命令：
    - "旋转视频"（单字段演示）
    - "视频缩放（自定义）"（多字段演示：宽度、高度、码率、质量）
- **UI/UX 改进**
  - 表单修改时实时更新命令预览
  - 带背景色的表单区域突出显示
  - 命令复制功能支持模板替换后的命令
- **文档更新**
  - 创建 CUSTOM_FORMS.md 完整表单功能文档
  - 包含示例、最佳实践和技术实现细节

### 2025-11-07 (v2.1)
- **shadcn/ui 集成**: 全面采用 shadcn/ui 组件库
  - 安装 12 个核心 shadcn/ui 组件
  - 转换所有组件使用 shadcn/ui：
    - CommandEditor, CommandList, ProgressLogViewer
    - ffmpeg-web.tsx 主界面
    - ModeSelect (改为 dropdown 下拉选择器)
    - FileUploader, VideoPlayer, InfoPanel, LogViewer
  - 集成 lucide-react 图标库
  - 统一的现代化 UI 设计系统
  - 改进的可访问性和用户体验
- **UI/UX 优化**
  - 运行模式选择改为紧凑的下拉选择器
  - 统一的颜色系统（语义化 tokens）
  - 更好的响应式布局
  - 改进的交互反馈和状态显示

### 2025-11-07 (v2.0)
- **重大更新**: 创建完整的 FFmpeg Web 界面
  - 实现命令预设管理系统（CRUD 操作）
  - 添加命令导入导出功能（JSON 格式）
  - 实现 CLI 命令解析器
  - 支持批量导入导出
  - 使用 Zustand persist 实现持久化存储
- **组件优化**
  - 创建 CommandEditor 组件（可视化编辑器）
  - 创建 CommandList 组件（分类展示）
  - 创建 ProgressLogViewer 组件（优化的进度和日志显示）
- **状态管理**
  - 新增 commandStore（命令预设管理）
  - 内置 8 个常用预设命令
- **工具函数**
  - parseCLICommand: CLI 命令解析
  - exportPresetsToJSON/importPresetsFromJSON: 导入导出
  - validatePreset: 命令验证
- **UI/UX 优化**
  - 进度条实时更新
  - 日志默认折叠，信息密度优化
  - 颜色编码日志类型
  - 响应式布局设计
- **文档更新**
  - 创建 FFMPEG_WEB.md 完整功能文档
  - 更新 README.md
  - 更新 API.md

### 2025-11-07 (v1.0)
- 初始化 AGENTS.md 文档
- 定义项目结构和开发规范
- 实现 FFmpeg.wasm 集成演示页面
  - 创建 ffmpeg-demo 路由页面
  - 实现单/多线程模式切换
  - 添加文件上传和视频预览功能
- 组件化重构
  - 拆分 FileUploader、LogViewer、ModeSelect、VideoPlayer、InfoPanel 组件
  - 引入 Zustand 进行全局日志状态管理
- 创建 FFmpegService 服务层
  - 封装 FFmpeg 核心功能
  - 实现加载、转换、清理等方法
  - 添加详细的日志和进度回调
  - 支持执行任意 FFmpeg 命令（executeCommand 方法）
- 配置 SharedArrayBuffer 支持
  - 在 root.tsx 中添加 COOP/COEP 头
  - 在 vite.config.ts 中配置开发服务器 CORS 头
- 解决关键问题
  - 修复 SSR 兼容性问题（客户端特定代码使用 useEffect）
  - 修复文件类型验证 bug（防止 undefined.startsWith 错误）
  - 解决内存溢出问题（使用 `-c copy` 模式避免重新编码）
  - 修复 Blob 类型转换问题（Uint8Array to ArrayBuffer）

---

*此文档由 AI 代理维护，用于指导 AI 协作开发此项目。*
