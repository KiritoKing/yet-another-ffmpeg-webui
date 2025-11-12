<!-- OPENSPEC:START -->
# OpenSpec Instructions

These instructions are for AI assistants working in this project.

Always open `@/openspec/AGENTS.md` when the request:
- Mentions planning or proposals (words like proposal, spec, change, plan)
- Introduces new capabilities, breaking changes, architecture shifts, or big performance/security work
- Sounds ambiguous and you need the authoritative spec before coding

Use `@/openspec/AGENTS.md` to learn:
- How to create and apply change proposals
- Spec format and conventions
- Project structure and guidelines

Keep this managed block so 'openspec update' can refresh the instructions.

<!-- OPENSPEC:END -->

# AGENTS.md

## 📚 Module-Specific Documentation

For detailed documentation on specific modules, see:
- **[Components](./app/components/AGENTS.md)** - Component patterns, props vs hooks, styling
- **[Services](./app/services/AGENTS.md)** - Service architecture, FFmpeg integration, async patterns
- **[Store](./app/store/AGENTS.md)** - State management, store structure, persistence

## 📖 Complete Documentation

All project documentation is now organized in the [`docs/`](./docs/) directory:
- **[User Guide](./docs/user-guide/)** - For end users
- **[Developer Guide](./docs/dev-guide/)** - For developers
- **[Changelog](./docs/changelog/)** - Historical changes
- **[Blog](./docs/blog/)** - Articles and deep-dives

---

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
│   │   ├── QueueControlPanel.tsx # 队列控制面板（批处理）
│   │   ├── TaskHistoryViewer.tsx # 任务历史查看器
│   │   ├── BatchFileUpload.tsx # 批量文件上传组件
│   │   ├── CDNSelector.tsx     # CDN 配置选择器
│   │   ├── AGENTS.md           # Components 架构文档
│   │   └── ui/            # shadcn/ui 组件库
│   ├── lib/               # 工具库
│   │   └── utils.ts       # cn() 等工具函数
│   ├── hooks/             # 自定义 Hooks
│   │   ├── useFFmpegWeb.ts # FFmpeg Web 业务逻辑 Hook
│   │   └── useTaskManager.ts # 任务队列管理 Hook
│   ├── routes/            # 路由页面
│   │   ├── home.tsx       # 首页（重定向到 ffmpeg-web）
│   │   └── ffmpeg-web.tsx # FFmpeg Web 主界面（重构后）
│   ├── services/          # 业务服务层
│   │   │   ├── ffmpegService.ts    # FFmpeg 核心服务封装
│   │   │   ├── ffmpegPool.ts       # FFmpeg 实例池（多线程）
│   │   │   ├── queueProcessor.ts   # 队列处理器
│   │   │   ├── taskDatabase.ts     # IndexedDB 任务持久化
│   │   │   ├── cdnService.ts       # CDN 健康检查和 URL 生成
│   │   │   └── AGENTS.md           # Services 架构文档
│   ├── store/             # 全局状态管理（Zustand）
│   │   ├── command/      # 命令预设状态管理（持久化）
│   │   │   ├── types.ts         # 类型定义
│   │   │   ├── index.ts         # Store 实现
│   │   │   └── default-values.ts # 默认预设
│   │   ├── ffmpegWeb/    # FFmpeg Web 页面状态管理
│   │   │   ├── types.ts
│   │   │   └── index.ts
│   │   ├── log/          # 日志状态管理
│   │   │   ├── types.ts
│   │   │   └── index.ts
│   │   ├── task/         # 任务队列状态管理
│   │   │   ├── types.ts
│   │   │   └── index.ts
│   │   ├── cdn/          # CDN 配置状态管理
│   │   │   ├── types.ts
│   │   │   ├── index.ts
│   │   │   └── default-values.ts
│   │   └── AGENTS.md     # Store 架构文档
│   │   ├── logStore.ts    # 日志状态管理
│   │   ├── taskStore.ts   # 任务队列状态管理
│   │   └── ffmpegWebStore.ts # FFmpeg Web 页面状态管理（持久化模式偏好）
│   ├── types/             # 类型定义
│   │   ├── command.ts     # 命令预设类型定义
│   │   ├── log.ts         # 日志类型定义
│   │   └── task.ts        # 任务类型定义
│   ├── utils/             # 工具函数（模块化）
│   │   ├── parsers.ts     # CLI 解析和导入导出
│   │   ├── validators.ts  # 命令验证和文件大小检查
│   │   ├── templates.ts   # 模板变量处理
│   │   ├── fileHelpers.ts # 文件字段配置工具
│   │   ├── errorHandling.ts # 错误处理和文件名标准化
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
├── react-router.config.ts # React Router 配置（CSR 模式）
├── tsconfig.json          # TypeScript 配置
├── vite.config.ts         # Vite 构建配置
├── vite-plugin-headers.ts # 自定义 Vite 插件（HTTP headers）
├── AGENTS.md              # AI 协作开发文档
├── API.md                 # FFmpegService API 文档
├── CUSTOM_FORMS.md        # 自定义表单功能文档
├── TASK_SYSTEM_v3.md      # 任务系统 v3 文档
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
   "Cross-Origin-Resource-Policy": "cross-origin"
   ```
   - **CSR 模式**: 使用 `vite-plugin-headers.ts` 自定义插件通过中间件设置 headers
   - **SSR 模式**: 在 `root.tsx` 的 `headers()` 函数中设置
   - **生产部署**: 在 `vercel.json` / `_headers` / `netlify.toml` 等配置文件中设置
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

## 📖 Documentation Structure

All documentation has been organized into the `docs/` directory:

### For Users
- **[User Guide](./docs/user-guide/)**: Getting started, features, FAQ
- **[FFmpeg Web Guide](./docs/user-guide/FFMPEG_WEB.md)**: Main interface documentation
- **[Custom Forms Guide](./docs/user-guide/CUSTOM_FORMS.md)**: Creating custom presets

### For Developers  
- **[Developer Guide](./docs/dev-guide/)**: Architecture, API, development setup
- **[API Documentation](./docs/dev-guide/API.md)**: FFmpegService API reference
- **[Task System v4](./docs/dev-guide/TASK_SYSTEM_v4.md)**: Latest task architecture
- **[Deployment Guide](./docs/dev-guide/DEPLOYMENT.md)**: Platform-specific deployments

### Module-Specific
- **[Components Module](./app/components/AGENTS.md)**: Component patterns and best practices
- **[Services Module](./app/services/AGENTS.md)**: Service architecture and integration
- **[Store Module](./app/store/AGENTS.md)**: State management patterns

### Changelogs & History
- **[Changelog Directory](./docs/changelog/)**: Detailed feature history
- See update log section below for recent changes

---

## 注意事项

1. **生产构建**: 部署前务必运行 `pnpm build`
2. **环境变量**: 根据需要配置环境变量
3. **类型检查**: 提交前运行 `pnpm typecheck` 确保类型正确
4. **代码风格**: 遵循 TypeScript 和 React 最佳实践
5. **文件拆分**: 超过 500 行的文件必须拆分

---

## 更新日志

### 2025-01-13 (v7.0) - Native FFmpeg Driver (Proposed) 🎯
- **OpenSpec Proposal: implement-native-ffmpeg-driver** 📋
  - **Phase 2 of Desktop Strategy** (Depends on Phase 1)
  - **Driver Abstraction Layer**:
    - Designed `IFFmpegDriver` interface for pluggable implementations
    - `WasmDriver`: Wrapper around existing FFmpegService
    - `NativeDriver`: Rust-based system FFmpeg execution
    - `FFmpegDriverManager`: Auto-selection and switching logic
  - **Native Execution Capabilities**:
    - FFmpeg availability detection via Tauri
    - Temporary workspace management in Rust
    - File I/O through Tauri commands (write input, read output)
    - Process execution with progress parsing
    - Hardware acceleration detection (NVENC, QuickSync, VideoToolbox)
  - **Auto-Detection System**:
    - Environment detection (browser vs desktop)
    - Intelligent driver selection based on availability
    - User preference support (auto/wasm/native)
    - Runtime driver switching
    - Graceful fallback on failures
  - **Performance Goals**:
    - 3-5x faster encoding (native CPU vs WASM)
    - 10-20x faster encoding (native GPU vs WASM)
    - Unlimited file size support on desktop
    - Hardware-accelerated encoding (NVENC, QuickSync, VideoToolbox, AMF)
  - **OpenSpec Compliance**:
    - 3 capability specifications (driver-abstraction, native-execution, auto-detection)
    - 15+ requirements with testable scenarios
    - Passed `openspec validate --strict` validation
    - 39 task groups across 8 implementation phases
  - **Estimated Effort**: 4-5 weeks for complete implementation
  - **Zero Breaking Changes**: Fully backward-compatible addition
  - **Proposal Location**: `openspec/changes/implement-native-ffmpeg-driver/`
  - **Status**: ✅ Proposed, awaiting approval and implementation

### 2025-01-09 (v6.0) - Tauri Desktop Integration 🚀
- **OpenSpec Proposal: add-tauri-desktop-support** 📋
  - **Minimal Functional Verification Complete** ✅
    - Integrated Tauri 2.9.4 for desktop application support
    - Implemented Rust backend with test command (`greet_from_rust`)
    - Environment detection using `__TAURI_INTERNALS__` global
    - Verified Rust↔JavaScript communication working correctly
  - **Infrastructure Established**:
    - Created `src-tauri/` directory with complete Rust project structure
    - Configured `tauri.conf.json` for dual deployment (web + desktop)
    - Added `dev:tauri` and `build:tauri` npm scripts
    - Set up application icons and metadata
  - **Key Learnings Documented**:
    - Startup sequence: Vite must run before Tauri (prevents 504 errors)
    - Tauri 2.0 breaking change: `__TAURI_INTERNALS__` replaces `__TAURI__`
    - First Rust build: ~40-60s (449 packages), incremental: ~5-10s
  - **OpenSpec Compliance**:
    - Created comprehensive proposal with Why/What/Impact analysis
    - Defined formal specification with requirements and scenarios
    - Passed `openspec validate --strict` with zero errors
    - Tasks.md checklist: 95% complete (only documentation pending)
  - **Foundation for Phase 2**:
    - Establishes groundwork for native FFmpeg driver
    - Enables future hardware acceleration support
    - Maintains full web deployment compatibility
  - **Files Added**: ~20 new files, ~200 LOC in `src-tauri/`
  - **Files Modified**: `package.json`, `app/routes/settings.tsx` (TauriTest component)
  - **Proposal Location**: `openspec/changes/add-tauri-desktop-support/`
  - **No User-Facing Changes**: This is Phase 1 infrastructure only

### 2025-11-09 (v5.0) - Three Major Updates 🎉
- **Store Refactoring Complete** ✨
  - Restructured all stores into subdirectories (types/index/default-values)
  - Optimized preset scripts (parameterized, consolidated, WASM-compatible)
  - Reduced prop drilling by 76% (ExecutionPanel: 17 props → 4 props)
  - Created focused hooks: `useCommandExecution`, `useQueueOperations`
  
- **CDN Selector Feature** 🌐
  - Multi-CDN support (unpkg, jsDelivr, local resources)
  - Auto-select best CDN based on latency
  - Health checking with timeout (5s)
  - Custom CDN URL validation
  - FFmpeg version selection (6 versions)
  - Integrated into settings dialog
  - FFmpegService enhanced with CDN configuration
  
- **Documentation Organization** 📚
  - Reorganized all docs into `docs/` directory structure
  - Created user guide, dev guide, changelog, and blog sections
  - Added module-specific AGENTS.md files:
    - `app/store/AGENTS.md` - State management patterns
    - `app/services/AGENTS.md` - Service architecture
    - `app/components/AGENTS.md` - Component best practices
  - Updated root AGENTS.md with documentation references
  - Created comprehensive README files for each documentation section

### 2025-11-09 (v4.2)
- **CSR 模式下多线程支持修复** 🔧
  - **问题**: 禁用 SSR 后，开发服务器的多线程模式（SharedArrayBuffer）不可用
  - **根本原因**: 
    - React Router CSR 模式下不执行 `root.tsx` 的服务端代码
    - `vite.config.ts` 中的 `server.headers` 配置在某些情况下不会正确应用
  - **解决方案**:
    - 创建自定义 Vite 插件 `vite-plugin-headers.ts`
    - 使用中间件直接设置 HTTP headers（更可靠）
    - 同时支持开发和预览模式
  - **修改文件**:
    - 新增 `vite-plugin-headers.ts`: 自定义插件，通过中间件设置 headers
    - 更新 `vite.config.ts`: 
      - 导入并使用 `headersPlugin()`
      - 添加 `preview.headers` 配置
      - 移除 `server.middlewareMode` 配置
    - 新增 `public/check-headers.html`: SharedArrayBuffer 检测页面
  - **关键 Headers**:
    ```
    Cross-Origin-Opener-Policy: same-origin
    Cross-Origin-Embedder-Policy: require-corp
    Cross-Origin-Resource-Policy: cross-origin
    ```
  - **测试验证**:
    - ✅ `crossOriginIsolated = true`
    - ✅ `SharedArrayBuffer` 可用
    - ✅ FFmpeg 多线程模式正常工作
  - **技术要点**:
    - 中间件方式比配置项更可靠
    - 插件执行顺序很重要（放在最前面）
    - CSR 模式下必须通过 Vite 插件设置 headers

### 2025-11-08 (v4.1)
- **任务中止问题修复** 🔧
  - **问题**: 中止任务后重新提交会报错 "FFmpeg 未加载"
  - **根本原因**: `FFmpegService.abort()` 调用 `terminate()` 销毁实例，但未重新加载
  - **解决方案**: 
    - 将 `abort()` 改为异步方法
    - 中止后立即重新加载 FFmpeg 实例
    - 保证实例始终可用，避免"未加载"错误
  - **修改文件**:
    - `ffmpegService.ts`: `abort()` 方法重构（终止 + 重新加载）
    - `queueProcessor.ts`: `stop()` 改为异步，等待所有中止完成
    - `useTaskManager.ts`: `stopQueue()` 改为异步
  - **测试场景**: 
    - ✅ 提交任务 → 执行成功
    - ✅ 中止任务 → FFmpeg 终止并重新加载
    - ✅ 重新提交 → 使用已重新加载的实例，正常执行
    - ✅ 多次中止/重新提交 → 每次都能正常工作

- **日志系统增强** ✨
  - 新增日志搜索功能（防抖 300ms）
  - 可点击类型筛选（全部/错误/警告）
  - 支持手动清空日志
  - 支持复制所有日志
  - 智能自动滚动：
    - 监听滚动位置，检测用户是否在底部
    - 仅当在底部时自动滚动到最新日志
    - 手动滚动上去时停止自动滚动
    - 有筛选条件时不自动滚动（避免干扰用户查看）
  - 使用 `ahooks` 的 `useDebounceFn` 优化搜索性能
  - 虚拟滚动渲染优化（48px 行高）

- **UI/UX 优化** 🎨
  - 移除全局进度条（任务队列中已有各任务进度）
  - 精简 `ProgressLogViewer` 组件：
    - 移除所有 props（progress, currentStep, isExecuting）
    - 只保留日志展示功能
    - 移除 Card 包装，使用更紧凑的布局
  - 移除输出预览区域（结果在队列面板预览）
  - 优化提示框位置（Tooltip 从 right 改为 bottom）

- **代码清理** 🧹
  - 删除 4 个未使用的组件文件（~200 行）:
    - `FileUploader.tsx`
    - `VideoPlayer.tsx`
    - `InfoPanel.tsx`
    - `LogViewer.tsx`
  - 删除 `useFFmpegWeb.ts` 中的未使用方法（~70 行）:
    - `handleAbortTask()` - 58 行
    - `handleDownload()` - 11 行
  - 清理 `ffmpegWebStore.ts`:
    - 移除 `setProcessing` action
    - 移除 `resetExecutionState()` action
  - 简化 `ExecutionPanel`:
    - 移除 progress/currentStep/processing/outputUrl props
    - 移除 outputUrl 预览部分（67 行）
  - 统一首页路由：直接重定向到 FFmpeg Web 主界面
  - 删除测试路由文件

- **新增依赖** 📦
  - `ahooks@^3.9.6` - React Hooks 工具库（用于防抖）

### 2025-11-08 (v4.0)
- **任务队列系统完整实现** 🎉
  - **核心功能**:
    - 创建 `taskStore.ts` 任务队列状态管理（Zustand）
    - 创建 `useTaskManager.ts` 任务管理 Hook
    - 创建 `queueProcessor.ts` 队列处理器（支持并发控制）
    - 创建 `taskDatabase.ts` IndexedDB 持久化存储
    - 创建 `ffmpegPool.ts` FFmpeg 实例池（多线程支持）
  - **UI 组件**:
    - `QueueControlPanel`: 队列控制面板（等待/执行/完成三区域）
    - `TaskHistoryViewer`: 任务历史查看器（支持搜索、筛选、分页）
    - `BatchFileUpload`: 批量文件上传组件
  - **文件名标准化系统**:
    - 创建 `errorHandling.ts` 工具模块
    - `sanitizeFilename()`: 移除中文、空格、特殊字符，标准化扩展名
    - `standardizeAndUniquifyFilenames()`: 批量处理，自动去重（添加序号）
    - `applyFilenameMappings()`: 更新 FFmpeg 参数中的文件名
    - 实时日志记录文件名映射过程
  - **批处理优化**:
    - 任务状态管理：pending → running → completed/failed/aborted
    - 支持并发执行（可配置并发数 1-4）
    - `executingTasks` 实时追踪正在执行的任务
    - `recentCompletedTasks` 保留最近 20 个完成任务
    - `initialQueueSize` 用于正确计算总体进度
  - **进度系统重构**:
    - 扩展 `ExecuteCommandOptions` 添加 `onProgress` 回调
    - FFmpegService 支持任务级进度回调
    - QueueProcessor 转发进度到 `onTaskProgress`
    - 实时更新正在执行任务的进度条
    - 修复总体进度计算（基于初始队列大小）
  - **结果预览系统**:
    - Blob URL 内存管理（`taskResults` Map）
    - 支持视频/音频/图片预览
    - 弹窗式预览界面（Dialog 组件）
    - 下载功能支持
  - **错误处理增强**:
    - `parseFFmpegError()`: 解析 FFmpeg 错误信息
    - `formatErrorMessage()`: 格式化用户友好的错误消息
    - 支持内存错误、编码器错误等特殊情况识别
  - **Tab 布局集成**:
    - 执行 | 队列 | 历史 三个标签页
    - 独立的状态管理和 UI
    - 统一的用户体验
  - **修复的关键问题**:
    1. ✅ 文件名双重标准化（时间戳不一致）→ 使用预准备的 `task.ffmpegArgs`
    2. ✅ File 对象丢失（无法序列化）→ 添加 `task._files` 临时字段
    3. ✅ 批量任务无进度显示 → 实现完整的进度回调链
    4. ✅ 结果无法预览 → 添加 Blob URL 管理和预览对话框
    5. ✅ 状态不更新 → 修复 `startTask()` 逻辑和回调顺序
    6. ✅ 总体进度计算错误 → 使用 `initialQueueSize` 记录初始值

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
