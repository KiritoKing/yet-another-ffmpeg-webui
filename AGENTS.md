# AGENTS.md

## 项目概述

**项目名称**: ffmpeg-easy  
**项目描述**: 基于 React Router 的 FFmpeg 简化工具 Web 应用  
**技术栈**: React Router v7, React 19, TypeScript, TailwindCSS, Vite

---

## 项目结构

```
ffmpeg-easy/
├── app/                    # 应用程序主目录
│   ├── app.css            # 全局样式
│   ├── root.tsx           # 根组件（包含 COOP/COEP 头配置）
│   ├── routes.ts          # 路由配置
│   ├── components/        # 可复用组件
│   │   ├── FileUploader.tsx    # 文件上传组件
│   │   ├── InfoPanel.tsx       # 信息面板组件
│   │   ├── LogViewer.tsx       # 日志查看器
│   │   ├── ModeSelect.tsx      # 单/多线程模式选择
│   │   └── VideoPlayer.tsx     # 视频播放器组件
│   ├── routes/            # 路由页面
│   │   ├── home.tsx       # 首页
│   │   └── ffmpeg-demo.tsx     # FFmpeg 演示页面
│   ├── services/          # 业务服务层
│   │   └── ffmpegService.ts    # FFmpeg 核心服务封装
│   ├── store/             # 全局状态管理
│   │   └── logStore.ts    # 日志状态管理（Zustand）
│   ├── types/             # 类型定义
│   │   └── log.ts         # 日志类型定义
│   └── welcome/           # 欢迎页面组件
│       └── welcome.tsx
├── public/                # 静态资源目录
├── Dockerfile             # Docker 容器配置
├── package.json           # 项目依赖配置
├── pnpm-lock.yaml         # pnpm 锁文件
├── react-router.config.ts # React Router 配置
├── tsconfig.json          # TypeScript 配置
├── vite.config.ts         # Vite 构建配置（包含 CORS 头配置）
├── AGENTS.md              # AI 协作开发文档
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

### 2025-11-07
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
