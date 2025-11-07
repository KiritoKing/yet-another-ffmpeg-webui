# 部署配置文件清单

## 📋 已创建的配置文件

### 主流平台
- ✅ `vercel.json` - Vercel 部署配置
- ✅ `netlify.toml` - Netlify 部署配置
- ✅ `public/_headers` - Cloudflare Pages HTTP 头
- ✅ `public/_redirects` - Cloudflare Pages 重定向规则
- ✅ `wrangler.toml` - Cloudflare Workers/Pages 配置
- ✅ `render.yaml` - Render.com 配置
- ✅ `fly.toml` - Fly.io 配置
- ✅ `railway.json` - Railway 配置
- ✅ `.platform.app.yaml` - Platform.sh 配置

### Docker
- ✅ `Dockerfile` - Docker 镜像构建（已更新为 pnpm）
- ✅ `docker-compose.yml` - Docker Compose 配置
- ✅ `.dockerignore` - Docker 排除文件（已优化）

### 文档和工具
- ✅ `DEPLOYMENT.md` - 完整部署指南（8个平台）
- ✅ `scripts/check-deploy.sh` - 部署检查脚本
- ✅ `README.md` - 更新部署说明

## 🎯 关键特性

所有平台配置都包含：

### 1. SharedArrayBuffer 支持
所有配置都包含必要的 HTTP 头：
```
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
Cross-Origin-Resource-Policy: cross-origin
```

### 2. SPA 路由支持
所有平台都配置了客户端路由重定向，支持刷新和直接访问子路由。

### 3. pnpm 支持
所有平台都配置为使用 pnpm 作为包管理器。

### 4. 统一构建配置
- **Node 版本**: 20
- **构建命令**: `pnpm build`
- **启动命令**: `pnpm start`
- **输出目录**: `build/client`

## 🚀 快速部署

### Vercel
```bash
vercel
```

### Netlify
```bash
netlify deploy --prod
```

### Fly.io
```bash
fly deploy
```

### Railway
```bash
railway up
```

### Docker
```bash
docker-compose up -d
```

### Docker 构建
```bash
docker build -t ffmpeg-easy .
docker run -p 3000:3000 ffmpeg-easy
```

## 📊 平台对比

| 平台 | 免费额度 | 国内访问 | 配置难度 | 推荐指数 |
|------|---------|---------|---------|---------|
| Vercel | ✅ 充足 | ⚠️ 一般 | ⭐ 简单 | ⭐⭐⭐⭐⭐ |
| Netlify | ✅ 充足 | ⚠️ 一般 | ⭐ 简单 | ⭐⭐⭐⭐⭐ |
| Cloudflare | ✅ 无限 | ✅ 优秀 | ⭐⭐ 中等 | ⭐⭐⭐⭐⭐ |
| Render | ✅ 有限 | ⚠️ 一般 | ⭐ 简单 | ⭐⭐⭐⭐ |
| Fly.io | ✅ 有限 | ✅ 可选 | ⭐⭐ 中等 | ⭐⭐⭐⭐ |
| Railway | ✅ 有限 | ⚠️ 一般 | ⭐ 简单 | ⭐⭐⭐⭐ |
| Platform.sh | ❌ 付费 | ⚠️ 一般 | ⭐⭐⭐ 复杂 | ⭐⭐⭐ |
| Docker | ✅ 自建 | ✅ 完全控制 | ⭐⭐⭐ 复杂 | ⭐⭐⭐⭐ |

## ✅ 验证清单

在部署前，请确保：

- [ ] 所有配置文件存在且格式正确
- [ ] 本地构建成功 (`pnpm build`)
- [ ] 类型检查通过 (`pnpm typecheck`)
- [ ] HTTP 头正确配置（检查 COOP/COEP）
- [ ] SPA 路由重定向配置正确
- [ ] 运行检查脚本 (`./scripts/check-deploy.sh`)

## 📝 注意事项

1. **Cloudflare Pages**: 
   - HTTP 头通过 `public/_headers` 配置
   - 重定向通过 `public/_redirects` 配置
   - 这些文件会被自动部署

2. **Fly.io**:
   - 默认部署到香港区域 (hkg)
   - 可在 `fly.toml` 修改区域
   - 支持多区域部署

3. **Docker**:
   - 使用 Node 20 Alpine 基础镜像
   - 多阶段构建优化镜像大小
   - 包含健康检查配置

4. **所有平台**:
   - 确保配置了正确的 HTTP 头
   - 多线程模式需要 SharedArrayBuffer
   - 单线程模式作为降级方案

## 🔗 相关文档

- [DEPLOYMENT.md](../DEPLOYMENT.md) - 详细部署指南
- [README.md](../README.md) - 项目说明
- [AGENTS.md](../AGENTS.md) - AI 协作文档

---

**最后更新**: 2025-11-08
