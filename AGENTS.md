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
│   │   ├── ProgressLogViewer.tsx # 优化的进度和日志组件（shadcn/ui）
│   │   ├── FileUploader.tsx    # 文件上传组件（shadcn/ui）
│   │   ├── InfoPanel.tsx       # 信息面板组件（shadcn/ui）
│   │   ├── LogViewer.tsx       # 日志查看器（shadcn/ui）
│   │   ├── ModeSelect.tsx      # 运行模式下拉选择器（shadcn/ui）
│   │   ├── VideoPlayer.tsx     # 视频播放器组件（shadcn/ui）
│   │   └── ui/            # shadcn/ui 组件库
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── input.tsx
│   │       ├── select.tsx
│   │       ├── dialog.tsx
│   │       ├── progress.tsx
│   │       ├── badge.tsx
│   │       ├── label.tsx
│   │       ├── textarea.tsx
│   │       ├── separator.tsx
│   │       ├── collapsible.tsx
│   │       └── scroll-area.tsx
│   ├── lib/               # 工具库
│   │   └── utils.ts       # cn() 等工具函数
│   ├── routes/            # 路由页面
│   │   ├── home.tsx       # 首页
│   │   ├── ffmpeg-web.tsx # FFmpeg Web 主界面（完整版）
│   │   ├── ffmpeg-demo.tsx     # FFmpeg 简单演示页面
│   │   └── ffmpeg-advanced.tsx # FFmpeg 高级自定义页面
│   ├── services/          # 业务服务层
│   │   └── ffmpegService.ts    # FFmpeg 核心服务封装
│   ├── store/             # 全局状态管理
│   │   ├── commandStore.ts # 命令预设状态管理（Zustand + persist）
│   │   └── logStore.ts    # 日志状态管理（Zustand）
│   ├── types/             # 类型定义
│   │   ├── command.ts     # 命令预设类型定义
│   │   └── log.ts         # 日志类型定义
│   ├── utils/             # 工具函数
│   │   └── commandUtils.ts # 命令解析、导入导出工具
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

## 注意事项

1. **生产构建**: 部署前务必运行 `pnpm build`
2. **环境变量**: 根据需要配置环境变量
3. **类型检查**: 提交前运行 `pnpm typecheck` 确保类型正确
4. **代码风格**: 遵循 TypeScript 和 React 最佳实践

---

## 更新日志

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
