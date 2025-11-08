# FFmpeg Easy - 浏览器中的视频处理工具

基于 React Router v7 和 FFmpeg.wasm 构建的完整视频处理 Web 应用。

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/remix-run/react-router-templates/tree/main/default)

## ✨ 主要特性

- 🎬 **FFmpeg Web**: 完整的命令管理和执行界面
  - 预设命令管理（CRUD 操作）
  - 自定义表单配置（基于 JSON Schema）
  - 导入导出 JSON 格式
  - 从 CLI 解析命令
  - 批量操作支持
  - 持久化存储
- � **任务队列系统**: 批量处理多个任务
  - 并发控制（1-4 个任务同时执行）
  - 实时进度追踪（每个任务和总体进度）
  - 任务状态管理（等待/执行/完成）
  - 结果预览（视频/音频/图片）
  - 历史记录（IndexedDB 持久化）
  - 文件名自动标准化
- �🚀 **高性能**: 支持单线程和多线程模式
- 🔒 **隐私保护**: 所有处理在浏览器本地完成，文件不上传
- ⚡ **实时反馈**: 进度条和日志实时更新
- 📦 **开箱即用**: 内置 10 个常用命令预设（含自定义表单示例）
- 🎨 **现代 UI**: 基于 shadcn/ui 的专业设计系统，完全可访问
- 🎯 **紧凑布局**: 优化的界面设计，信息密度高
- 📝 **可视化配置**: 通过表单调整 FFmpeg 参数，无需手写命令
- 🔍 **智能日志**: 搜索、筛选、自动滚动、手动清空

## 🎯 功能页面

| 页面 | 路径 | 说明 |
|------|------|------|
| **FFmpeg Web** | `/` 或 `/ffmpeg-web` | 完整版界面，包含命令管理、队列处理、历史记录等全部功能 |

### 主要功能模块

- **执行面板**: 选择命令、配置参数、执行任务
- **队列面板**: 批量任务管理、并发控制、实时进度
- **历史面板**: 查看历史任务、搜索筛选、重新执行

## 🚀 快速开始

### 安装依赖

```bash
pnpm install
```

### 开发模式

启动开发服务器（支持 HMR）：

```bash
pnpm dev
```

访问 `http://localhost:5173` 开始使用。

### 生产构建

```bash
pnpm build
```

### 启动生产服务器

```bash
pnpm start
```

## 📖 使用指南

### 基本使用流程

1. **访问首页**: 打开 `http://localhost:5173`
2. **加载 FFmpeg**: 选择单线程或多线程模式，点击"加载 FFmpeg"
3. **选择命令**: 从左侧列表选择预设命令
4. **配置参数**: 上传文件、调整表单参数
5. **执行任务**: 点击"执行命令"或"添加到队列"
6. **查看结果**: 在输出预览区查看或下载结果

### 批量处理流程

1. **选择命令**: 在执行面板选择要批量处理的命令
2. **上传文件**: 选择多个文件（会自动拆分为多个任务）
3. **添加到队列**: 点击"添加到队列"按钮
4. **切换到队列面板**: 查看等待中的任务
5. **配置并发数**: 选择同时处理 1-4 个任务
6. **开始处理**: 点击"开始处理"按钮
7. **监控进度**: 实时查看各任务进度和总体进度
8. **预览结果**: 完成后点击眼睛图标预览，或下载图标下载

### 命令管理

- **新建命令**: 点击"+ 新建命令"按钮
- **编辑命令**: 点击命令卡片上的编辑图标
- **删除命令**: 点击删除图标（需确认）
- **导出命令**: 
  - 单个导出: 点击命令卡片上的导出图标
  - 批量导出: 点击顶部"导出全部"按钮
- **导入命令**:
  - JSON 导入: 点击"导入 JSON"
  - CLI 导入: 点击"从 CLI 导入"

## 🛠️ 技术栈

- **框架**: React 19 + React Router v7
- **状态管理**: Zustand v5 (带 persist 中间件)
- **样式**: TailwindCSS v4
- **组件库**: shadcn/ui (基于 Radix UI)
- **图标**: lucide-react
- **核心功能**: FFmpeg.wasm v0.12.15
- **类型系统**: TypeScript v5
- **构建工具**: Vite v7
- **包管理器**: pnpm
- **Hooks 工具**: ahooks v3 (防抖、性能优化)

## 📁 项目结构

```
ffmpeg-easy/
├── app/
│   ├── components/          # 可复用组件（shadcn/ui）
│   │   ├── CommandEditor.tsx
│   │   ├── CommandList.tsx
│   │   ├── QueueControlPanel.tsx   # 队列控制面板
│   │   ├── TaskHistoryViewer.tsx   # 任务历史查看器
│   │   ├── BatchFileUpload.tsx     # 批量文件上传
│   │   ├── ProgressLogViewer.tsx
│   │   ├── ui/             # shadcn/ui 组件库
│   │   └── ...
│   ├── lib/                # 工具库
│   │   └── utils.ts        # cn() 等工具函数
│   ├── hooks/              # 自定义 Hooks
│   │   ├── useFFmpegWeb.ts  # FFmpeg Web 业务逻辑
│   │   └── useTaskManager.ts # 任务队列管理
│   ├── routes/              # 路由页面
│   │   ├── home.tsx         # 首页
│   │   └── ffmpeg-web.tsx   # 主界面
│   ├── services/            # 业务服务
│   │   ├── ffmpegService.ts    # FFmpeg 核心服务
│   │   ├── queueProcessor.ts   # 队列处理器
│   │   ├── taskDatabase.ts     # IndexedDB 持久化
│   │   └── ffmpegPool.ts       # FFmpeg 实例池
│   ├── store/               # 状态管理
│   │   ├── commandStore.ts
│   │   ├── taskStore.ts         # 任务队列状态
│   │   ├── logStore.ts
│   │   └── ffmpegWebStore.ts
│   ├── types/               # 类型定义
│   │   ├── command.ts
│   │   ├── task.ts              # 任务类型定义
│   │   └── log.ts
│   └── utils/               # 工具函数
│       ├── parsers.ts
│       ├── validators.ts
│       ├── templates.ts
│       ├── fileHelpers.ts
│       ├── errorHandling.ts     # 错误处理和文件名标准化
│       └── index.ts
├── public/                  # 静态资源
├── .github/                # GitHub 配置
│   └── prompts/           # AI 提示词
├── components.json         # shadcn/ui 配置
├── AGENTS.md               # AI 协作文档
├── API.md                  # API 文档
├── CUSTOM_FORMS.md         # 自定义表单功能说明
├── TASK_SYSTEM_v3.md       # 任务系统 v3 文档
├── FFMPEG_WEB.md           # FFmpeg Web 功能文档
└── README.md               # 本文件
```

## 📚 文档

- [AGENTS.md](./AGENTS.md) - AI 协作开发指南
- [API.md](./API.md) - FFmpegService API 参考
- [CUSTOM_FORMS.md](./CUSTOM_FORMS.md) - 自定义表单功能完整说明
- [TASK_SYSTEM_v3.md](./TASK_SYSTEM_v3.md) - 任务系统 v3 架构文档
- [FFMPEG_WEB.md](./FFMPEG_WEB.md) - FFmpeg Web 完整功能说明

## 🎬 内置预设命令

1. **复制流** - 快速复制，不重新编码
2. **转换为 WebM** - VP9 + Opus 编码
3. **提取音频为 MP3** - 从视频中提取音频
4. **调整分辨率** - 缩放到 720p
5. **提取视频片段** - 剪辑指定时间段
6. **转换为 GIF** - 生成动图
7. **压缩视频** - H.264 压缩
8. **合并视频** - 拼接多个视频
9. **旋转视频** ⭐ - 自定义表单示例（单字段）
10. **视频缩放（自定义）** ⭐ - 自定义表单示例（多字段：宽度、高度、码率、质量）

> ⭐ 标记的命令支持可视化表单配置，详见 [CUSTOM_FORMS.md](./CUSTOM_FORMS.md)

## 🔧 开发工具

### 类型检查

```bash
pnpm typecheck
```

### 部署检查

检查所有部署配置文件的完整性：

```bash
./scripts/check-deploy.sh
```

## 🚀 部署

本项目支持多个部署平台，详细说明请查看 [DEPLOYMENT.md](./DEPLOYMENT.md)。

### 一键部署

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/KiritoKing/yet-another-ffmpeg-webui)
[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/KiritoKing/yet-another-ffmpeg-webui)
[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template?template=https://github.com/KiritoKing/yet-another-ffmpeg-webui)

### Docker 部署

```bash
# 构建镜像
docker build -t ffmpeg-easy .

# 运行容器
docker run -p 3000:3000 ffmpeg-easy

# 或使用 Docker Compose
docker-compose up -d
```

### 支持的部署平台

- ✅ **Vercel** - 零配置部署
- ✅ **Netlify** - 自动 CI/CD
- ✅ **Cloudflare Pages** - 全球 CDN
- ✅ **Render** - 全托管部署
- ✅ **Fly.io** - 边缘计算
- ✅ **Railway** - 简单快捷
- ✅ **Platform.sh** - 企业级
- ✅ **Docker** - 完全控制

所有平台配置已包含：
- ✅ SharedArrayBuffer 支持（COOP/COEP 头）
- ✅ SPA 路由重定向
- ✅ pnpm 支持
- ✅ Node 20 环境

## ⚠️ 注意事项

### 多线程模式

多线程模式需要浏览器支持 SharedArrayBuffer，并且服务器必须配置以下 HTTP 头：

```
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

开发服务器已自动配置这些头（见 `vite.config.ts`）。

### 内存限制

WebAssembly 有内存限制，建议：
- 处理小于 500MB 的文件
- 使用 `-c copy` 模式避免重新编码
- 使用较快的预设（如 `ultrafast`）

### 任务中止与恢复

- ✅ 支持中止正在执行的任务
- ✅ 中止后自动重新加载 FFmpeg 实例
- ✅ 重新提交任务无需手动重新加载

### 浏览器兼容性

- ✅ Chrome/Edge 90+
- ✅ Firefox 90+
- ✅ Safari 15.2+
- ❌ 不支持 IE

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT

## 🙏 致谢

- [FFmpeg.wasm](https://github.com/ffmpegwasm/ffmpeg.wasm) - WebAssembly 版 FFmpeg
- [React Router](https://reactrouter.com/) - 现代 React 路由框架
- [Zustand](https://github.com/pmndrs/zustand) - 轻量级状态管理
- [TailwindCSS](https://tailwindcss.com/) - 实用优先的 CSS 框架
- [shadcn/ui](https://ui.shadcn.com/) - 精美的组件库
- [Radix UI](https://www.radix-ui.com/) - 无障碍组件原语
- [Lucide](https://lucide.dev/) - 优雅的图标库

---

Built with ❤️ using React Router and FFmpeg.wasm

