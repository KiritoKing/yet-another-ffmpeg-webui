# CDN Provider 架构重构 (2025-11-10)

## 概述

将 CDN 配置和 URL 生成逻辑从 `ffmpegService.ts` 中分离出来，创建独立的 CDN Provider 模块。

## 动机

1. **职责单一**：`ffmpegService.ts` 原本包含 FFmpeg 加载逻辑和 CDN URL 构建逻辑，职责不清
2. **可扩展性差**：添加新 CDN 需要修改核心服务代码
3. **URL 逻辑混乱**：单线程和多线程的 URL 构建逻辑混在一起
4. **难以测试**：CDN 相关逻辑与 FFmpeg 加载逻辑耦合

## 新架构

### 目录结构

```
app/services/cdn/
├── types.ts                  # CDN Provider 接口定义
├── BaseCDNProvider.ts        # Provider 基类（通用功能）
├── UnpkgProvider.ts          # unpkg CDN 实现
├── JsDelivrProvider.ts       # jsDelivr CDN 实现
├── LocalProvider.ts          # 本地资源实现
├── CustomProvider.ts         # 自定义 CDN 实现
├── CDNProviderFactory.ts     # Provider 工厂类
└── index.ts                  # 统一导出
```

### 核心接口

```typescript
interface ICDNProvider {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  
  getResourceUrls(mode: FFmpegMode): FFmpegResourceUrls;
  checkHealth(): Promise<boolean>;
  getLatency(): Promise<number>;
}
```

### 设计模式

1. **策略模式**：每个 CDN Provider 实现相同的接口但有不同的 URL 构建策略
2. **工厂模式**：`CDNProviderFactory` 负责创建和管理 Provider 实例
3. **模板方法模式**：`BaseCDNProvider` 提供通用实现，子类可覆盖

## 优势

### 1. 职责清晰

- `ffmpegService.ts`：专注于 FFmpeg 实例管理和命令执行
- CDN Provider：专注于 URL 构建和健康检查

### 2. 易于扩展

添加新 CDN 只需要：
```typescript
class NewCDNProvider extends BaseCDNProvider {
  readonly id = "new-cdn";
  readonly name = "新 CDN";
  readonly description = "描述";
  
  getResourceUrls(mode: FFmpegMode): FFmpegResourceUrls {
    // 自定义 URL 逻辑
  }
}
```

### 3. URL 逻辑清晰

每个 Provider 内部处理单线程/多线程差异：

```typescript
// UnpkgProvider
getResourceUrls(mode: "single" | "multi"): FFmpegResourceUrls {
  const packageName = mode === "multi" ? "core-mt" : "core";
  const base = `${this.baseUrl}/${packageName}@${this.version}/dist/esm`;
  return {
    coreUrl: `${base}/ffmpeg-core.js`,
    wasmUrl: `${base}/ffmpeg-core.wasm`,
    workerUrl: mode === "multi" ? `${base}/ffmpeg-core.worker.js` : undefined,
  };
}
```

### 4. 易于测试

```typescript
// 测试 unpkg Provider
const provider = new UnpkgProvider();
const urls = provider.getResourceUrls("multi");
assert.equal(urls.coreUrl, "https://unpkg.com/@ffmpeg/core-mt@0.12.6/dist/esm/ffmpeg-core.js");

// 测试健康检查
const healthy = await provider.checkHealth();
assert.equal(healthy, true);
```

### 5. 自动选择最佳 CDN

```typescript
// CDNProviderFactory 支持自动选择延迟最低的 CDN
const bestProvider = await CDNProviderFactory.selectBestProvider();
// 返回延迟最低的可用 Provider
```

## 使用示例

### 方式 1：使用默认 Provider

```typescript
const service = new FFmpegService({
  mode: "multi",
  onLog: console.log,
});

await service.load(); // 自动选择最佳 CDN
```

### 方式 2：指定 Provider

```typescript
const cdnProvider: CDNProvider = {
  id: "unpkg",
  name: "unpkg",
  baseUrl: "https://unpkg.com/@ffmpeg",
  description: "Fast CDN",
  priority: 1,
};

const service = new FFmpegService({
  mode: "multi",
  cdnProvider,
  onLog: console.log,
});

await service.load(); // 使用 unpkg
```

### 方式 3：自定义 CDN

```typescript
const customCDN: CDNProvider = {
  id: "custom",
  name: "My CDN",
  baseUrl: "https://mycdn.com/@ffmpeg",
  description: "Custom CDN",
  priority: 0,
};

const service = new FFmpegService({
  mode: "multi",
  cdnProvider: customCDN,
  onLog: console.log,
});

await service.load(); // 使用自定义 CDN
```

## 迁移指南

### 旧代码

```typescript
// 在 ffmpegService.ts 中硬编码 URL 逻辑
private getBaseURLFor(mode: FFmpegMode): string {
  if (this.config.cdnProvider?.id === "local") {
    return mode === "multi" ? `/core-mt/@0.12.6/dist/esm` : `/core/@0.12.6/dist/esm`;
  }
  const pkg = mode === "multi" ? "core-mt" : "core";
  return `${this.config.cdnProvider?.baseUrl}/${pkg}@0.12.6/dist/esm`;
}
```

### 新代码

```typescript
// 使用 Provider 模式
const provider = CDNProviderFactory.fromStoreConfig(this.config.cdnProvider);
const urls = provider.getResourceUrls(this.config.mode);
// urls.coreUrl, urls.wasmUrl, urls.workerUrl
```

## 向后兼容性

✅ 完全向后兼容，`FFmpegConfig` 接口未变化
✅ 原有的 `cdnProvider` 配置继续工作
✅ 如果未指定 CDN，自动选择最佳的

## 相关文件

- `/app/services/cdn/` - 新增的 CDN Provider 模块
- `/app/services/ffmpegService.ts` - 需要重构以使用新模块
- `/app/services/cdnService.ts` - 可以废弃或整合到新架构

## 后续工作

1. [ ] 重构 `ffmpegService.ts` 使用新的 CDN Provider
2. [ ] 添加单元测试覆盖所有 Provider
3. [ ] 更新 `cdnService.ts` 或将其功能整合到新架构
4. [ ] 更新文档和示例代码
5. [ ] 考虑添加更多 CDN (如 cdnjs, 自建镜像等)

## 注意事项

1. **本地资源路径差异**：本地资源使用 `/@version` 而不是 `@version`
2. **预检机制**：每个 Provider 都支持 `preflightCheck()` 验证资源可用性
3. **回退机制**：如果指定的 CDN 不可用，自动回退到 jsDelivr
4. **延迟测量**：使用 HEAD 请求测量延迟，避免下载大文件

## 总结

这次重构大大提升了代码的可维护性和可扩展性。通过将 CDN 逻辑分离到独立的 Provider 模块，我们实现了：

✅ 职责单一
✅ 易于扩展
✅ 逻辑清晰
✅ 易于测试
✅ 自动选择最佳 CDN

这是一个典型的"面向接口编程"和"开闭原则"的应用案例。
