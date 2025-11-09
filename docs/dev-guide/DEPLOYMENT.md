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

**最后更新**: 2025-11-08
