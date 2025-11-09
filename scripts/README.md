# CDN Files Fetch Script

这个脚本用于下载FFmpeg所需的CDN文件到本地，以便应用可以使用本地CDN而不是远程CDN。

## 功能说明

根据 `app/services/cdnService.ts` 中的需求，脚本会下载以下文件：

- `core@0.12.6/package.json`
- `core@0.12.6/dist/esm/ffmpeg-core.js`
- `core@0.12.6/dist/esm/ffmpeg-core.wasm`
- `core-mt@0.12.6/dist/esm/ffmpeg-core.js`
- `core-mt@0.12.6/dist/esm/ffmpeg-core.worker.js`

## 使用方法

### 1. 运行脚本

```bash
npm run cdn:fetch
```

或者

```bash
pnpm cdn:fetch
```

### 2. 目录结构

运行后，会在 `public/` 目录下创建以下结构：

```
public/
├── core@0.12.6/
│   ├── package.json
│   └── dist/esm/
│       ├── ffmpeg-core.js
│       └── ffmpeg-core.wasm
└── core-mt@0.12.6/
    └── dist/esm/
        ├── ffmpeg-core.js
        └── ffmpeg-core.worker.js
```

### 3. 配置本地CDN

下载完成后，应用就可以使用本地CDN了。确保在应用配置中选择"本地资源"作为CDN提供商。

## 脚本特性

- ✅ 自动创建目录结构
- ✅ 显示下载进度
- ✅ 错误处理和重试机制
- ✅ 检查现有文件
- ✅ 详细的下载报告

## 注意事项

1. **网络连接**：脚本需要稳定的网络连接来下载文件
2. **文件大小**：WASM文件较大（约10-15MB），下载可能需要一些时间
3. **版本固定**：脚本固定下载 `0.12.6` 版本，与 `cdnService.ts` 中指定的版本一致
4. **权限**：确保脚本有权限在 `public/` 目录中创建文件和文件夹

## 故障排除

### 下载失败
如果遇到下载失败，请检查：
- 网络连接是否正常
- 是否有防火墙阻止访问 unpkg.com
- 磁盘空间是否足够

### 文件权限问题
如果遇到权限问题，可以尝试：
```bash
chmod +x scripts/fetch-cdn-files.js
```

### 手动清理
如需重新下载，可以手动删除 `public/core@0.12.6` 和 `public/core-mt@0.12.6` 目录。