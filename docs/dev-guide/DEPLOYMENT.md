# 部署指南

本项目支持多个部署平台，所有配置文件已准备就绪。

## 重要说明

⚠️ **所有部署平台都必须配置以下 HTTP 头以支持 SharedArrayBuffer（多线程模式）**：

```
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
Cross-Origin-Resource-Policy: cross-origin
```

这些头部配置已包含在所有平台的配置文件中。

---

## 1. Vercel

### 一键部署
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/KiritoKing/yet-another-ffmpeg-webui)

### 手动部署
```bash
# 安装 Vercel CLI
pnpm add -g vercel

# 部署
vercel
```

**配置文件**: `vercel.json`

---

## 2. Netlify

### 一键部署
[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/KiritoKing/yet-another-ffmpeg-webui)

### 手动部署
```bash
# 安装 Netlify CLI
pnpm add -g netlify-cli

# 部署
netlify deploy --prod
```

**配置文件**: `netlify.toml`

---

## 3. Cloudflare Pages

### 部署步骤
1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 进入 **Pages** → **Create a project**
3. 连接 GitHub 仓库
4. 配置构建设置：
   - **Build command**: `pnpm build`
   - **Build output directory**: `build/client`
   - **Root directory**: `/`
5. HTTP 头和重定向规则会自动从 `public/_headers` 和 `public/_redirects` 读取

**配置文件**: 
- `public/_headers` - HTTP 头配置（包含 COOP/COEP）
- `public/_redirects` - SPA 路由重定向规则
- `wrangler.toml` - Wrangler CLI 配置（可选）

---

## 4. Render

### 部署步骤
1. 登录 [Render Dashboard](https://dashboard.render.com/)
2. 点击 **New** → **Blueprint**
3. 连接 GitHub 仓库
4. Render 会自动识别 `render.yaml` 配置

**配置文件**: `render.yaml`

---

## 5. Fly.io

### 部署步骤
```bash
# 安装 Fly CLI
curl -L https://fly.io/install.sh | sh

# 登录
fly auth login

# 部署（首次会创建应用）
fly deploy
```

**配置文件**: `fly.toml`

**注意**: 默认部署到香港区域 (hkg)，可在 `fly.toml` 中修改 `primary_region`。

---

## 6. Railway

### 一键部署
[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template?template=https://github.com/KiritoKing/yet-another-ffmpeg-webui)

### 手动部署
```bash
# 安装 Railway CLI
pnpm add -g @railway/cli

# 登录
railway login

# 部署
railway up
```

**配置文件**: `railway.json`

---

## 7. Platform.sh

### 部署步骤
```bash
# 安装 Platform.sh CLI
curl -fsSL https://raw.githubusercontent.com/platformsh/cli/main/installer.sh | bash

# 创建项目
platform create

# 部署
platform push
```

**配置文件**: `.platform.app.yaml`

---

## 8. Docker / Docker Compose

### 使用 Docker
```bash
# 构建镜像
docker build -t ffmpeg-easy .

# 运行容器
docker run -p 3000:3000 ffmpeg-easy
```

### 使用 Docker Compose
```bash
# 启动服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

**配置文件**: 
- `Dockerfile` - Docker 镜像定义
- `docker-compose.yml` - Docker Compose 配置
- `.dockerignore` - 排除文件列表

---

## 环境变量

所有平台都支持以下环境变量（可选）：

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `PORT` | 服务端口 | `3000` |
| `NODE_ENV` | Node 环境 | `production` |

---

## 构建配置

所有平台使用统一的构建配置：

- **Node 版本**: 20
- **包管理器**: pnpm
- **构建命令**: `pnpm build`
- **启动命令**: `pnpm start`
- **输出目录**: `build/client`

---

## 健康检查

Docker 部署包含健康检查配置：
- 每 30 秒检查一次
- 超时 10 秒
- 重试 3 次
- 启动后 40 秒开始检查

---

## 故障排查

### SharedArrayBuffer 不可用
**症状**: 多线程模式无法使用，浏览器控制台显示 SharedArrayBuffer 相关错误。

**解决方案**:
1. 确认部署平台已正确配置 COOP/COEP 头
2. 使用浏览器开发者工具检查响应头
3. 如果平台不支持自定义头，使用单线程模式

### 构建失败
**症状**: 部署时构建步骤失败。

**解决方案**:
1. 确认使用 Node 20 或更高版本
2. 确认使用 pnpm 作为包管理器
3. 检查构建日志中的具体错误信息

### 路由 404 错误
**症状**: 刷新页面或直接访问子路由时显示 404。

**解决方案**:
1. 确认平台配置了 SPA 路由重写规则（所有平台配置已包含）
2. 检查平台是否正确识别了配置文件

---

## 推荐平台

根据不同需求推荐：

- **免费部署**: Vercel, Netlify, Cloudflare Pages
- **国内访问**: 自建 Docker / Fly.io 香港区域
- **完全控制**: Docker / Docker Compose
- **企业级**: Platform.sh, Render

---

## 获取帮助

如遇到部署问题，请：
1. 检查本文档的故障排查章节
2. 查看平台官方文档
3. 在项目仓库提交 Issue

---

## 桌面应用部署

### 概述

从 v6.0 开始，FFmpeg Easy 支持作为原生桌面应用部署。桌面版本使用 Tauri 2.x 框架构建。

**支持平台**:
- 🍎 macOS 10.15 (Catalina) 及更高版本
- 🪟 Windows 10 及更高版本
- 🐧 Linux（支持 GTK3 的现代发行版）

### 前置要求

**开发环境**:
- Node.js 18+
- pnpm 9.x
- Rust 工具链 1.70+

**平台特定依赖**:

**macOS**:
```bash
xcode-select --install
```

**Windows**:
- [Visual Studio Build Tools](https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022)
- 或 [MinGW](https://www.mingw-w64.org/)

**Linux (Ubuntu/Debian)**:
```bash
sudo apt install libwebkit2gtk-4.1-dev \
    build-essential \
    curl \
    wget \
    file \
    libxdo-dev \
    libssl-dev \
    libayatana-appindicator3-dev \
    librsvg2-dev
```

### 构建桌面应用

**开发模式**:
```bash
# 终端 1: 启动 Vite
pnpm dev

# 终端 2: 启动 Tauri
pnpm dev:tauri
```

**生产构建**:
```bash
pnpm build:tauri
```

**构建产物位置**: `src-tauri/target/release/bundle/`

### 分发格式

| 平台 | 格式 | 位置 |
|------|------|------|
| **macOS** | `.app` 包<br>`.dmg` 安装器 | `bundle/macos/` |
| **Windows** | `.exe` 安装器<br>`.msi`（可选） | `bundle/msi/` 或 `bundle/nsis/` |
| **Linux** | `.AppImage`<br>`.deb`<br>`.rpm` | `bundle/appimage/` 或 `bundle/deb/` |

### macOS 代码签名

**要求**: Apple 开发者 ID

```bash
# 签名应用
codesign --deep --force --verify --verbose \
    --sign "Developer ID Application: Your Name" \
    src-tauri/target/release/bundle/macos/FFmpeg\ Easy.app

# 验证签名
codesign --verify --deep --strict --verbose=2 \
    src-tauri/target/release/bundle/macos/FFmpeg\ Easy.app
```

**公证（Notarization）**:
```bash
# 创建 DMG
# (已由 Tauri 自动生成)

# 上传公证
xcrun notarytool submit \
    src-tauri/target/release/bundle/macos/FFmpeg\ Easy.dmg \
    --apple-id "your-email@example.com" \
    --team-id "YOUR_TEAM_ID" \
    --password "app-specific-password" \
    --wait

# 装订公证票据
xcrun stapler staple \
    src-tauri/target/release/bundle/macos/FFmpeg\ Easy.dmg
```

### Windows 代码签名

**要求**: 代码签名证书

```bash
# 使用 signtool.exe 签名
signtool sign /f certificate.pfx /p password \
    /t http://timestamp.digicert.com \
    src-tauri/target/release/bundle/nsis/FFmpeg_Easy_setup.exe
```

### Linux 分发

**AppImage**:
- 无需安装，直接运行
- 便携式，适合所有发行版

**Debian/Ubuntu (.deb)**:
```bash
sudo dpkg -i src-tauri/target/release/bundle/deb/ffmpeg-easy_*.deb
```

**Fedora/RHEL (.rpm)**:
```bash
sudo rpm -i src-tauri/target/release/bundle/rpm/ffmpeg-easy-*.rpm
```

### 自动更新（可选）

Tauri 支持内置更新机制。配置 `tauri.conf.json`:

```json
{
  "updater": {
    "active": true,
    "endpoints": [
      "https://your-domain.com/releases/{{target}}/{{current_version}}"
    ],
    "dialog": true,
    "pubkey": "YOUR_PUBLIC_KEY"
  }
}
```

**生成密钥对**:
```bash
tauri signer generate -w ~/.tauri/myapp.key
```

**签名更新包**:
```bash
tauri signer sign -k ~/.tauri/myapp.key \
    src-tauri/target/release/bundle/macos/FFmpeg\ Easy.app
```

### GitHub Releases 分发

**自动化工作流** (.github/workflows/release.yml):

```yaml
name: Release Desktop App

on:
  push:
    tags:
      - 'v*'

jobs:
  release:
    strategy:
      matrix:
        platform: [macos-latest, ubuntu-latest, windows-latest]
    
    runs-on: ${{ matrix.platform }}
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 18
      
      - name: Setup Rust
        uses: actions-rs/toolchain@v1
        with:
          toolchain: stable
      
      - name: Install dependencies (Ubuntu)
        if: matrix.platform == 'ubuntu-latest'
        run: |
          sudo apt update
          sudo apt install -y libwebkit2gtk-4.1-dev \
            build-essential curl wget file libssl-dev \
            libayatana-appindicator3-dev librsvg2-dev
      
      - name: Install pnpm
        run: npm install -g pnpm
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Build desktop app
        run: pnpm build:tauri
      
      - name: Upload artifacts
        uses: actions/upload-artifact@v3
        with:
          name: ${{ matrix.platform }}-app
          path: src-tauri/target/release/bundle/
      
      - name: Create Release
        uses: softprops/action-gh-release@v1
        with:
          files: src-tauri/target/release/bundle/*/*
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### 故障排除

**首次构建时间长**:
- 正常现象：~40-60 秒
- Rust 编译约 450 个包
- 后续增量构建：~5-10 秒

**启动白屏**:
- 确保按正确顺序启动（Vite 先于 Tauri）
- 删除 `.vite` 缓存目录
- 参考 [Tauri 开发指南](./TAURI_DEVELOPMENT.md)

**平台特定问题**:
- 查看 [Tauri 故障排除](https://tauri.app/v2/guides/troubleshooting/)
- 检查平台依赖是否完整安装

### 更多信息

详细的开发指南请参考：
- **[Tauri 开发指南](./TAURI_DEVELOPMENT.md)** - 完整的设置、开发和故障排除指南
- **[OpenSpec 提案](../../openspec/changes/add-tauri-desktop-support/proposal.md)** - 技术决策和架构
- **[Tauri 官方文档](https://tauri.app/v2/)** - Tauri 框架文档

---

**最后更新**: 2025-01-13 (添加桌面应用部署)
