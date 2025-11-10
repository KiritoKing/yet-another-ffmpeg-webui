# GitHub Actions Workflows

## 问题修复 (2025-11-10)

### 问题描述
GitHub Actions 报错 `Unable to locate executable file: pnpm`

**根本原因**: 步骤执行顺序错误
- `actions/setup-node@v4` 在 `pnpm/action-setup` 之前执行
- `setup-node` 使用了 `cache: 'pnpm'` 但此时 pnpm 尚未安装

### 解决方案

#### 方案 1: 调整步骤顺序 (已应用)
```yaml
steps:
  - name: Checkout
    uses: actions/checkout@v4

  # 1. 先安装 pnpm
  - name: Setup pnpm
    uses: pnpm/action-setup@v4
    with:
      version: 9

  # 2. 再设置 Node.js (此时 pnpm 已安装,可以使用缓存)
  - name: Use Node.js 20
    uses: actions/setup-node@v4
    with:
      node-version: '20'
      cache: 'pnpm'
```

#### 方案 2: 使用 Corepack (推荐)
Corepack 是 Node.js 16.9+ 内置的包管理器管理工具,官方推荐使用。

**前置条件**: 在 `package.json` 中添加 `packageManager` 字段:
```json
{
  "packageManager": "pnpm@9.0.0"
}
```

**Workflow 配置**:
```yaml
steps:
  - name: Checkout
    uses: actions/checkout@v4

  - name: Enable Corepack
    run: corepack enable

  - name: Use Node.js 20
    uses: actions/setup-node@v4
    with:
      node-version: '20'
      cache: 'pnpm'
```

参考文件: `ci-corepack.yml.example`

## 当前 Workflows

### ci.yml
- **触发条件**: push 到 main 分支 或 PR 到 main
- **执行内容**:
  - 代码检查 (Biome)
  - TypeScript 类型检查

### deploy-check.yml
- **触发条件**: push 到 main 分支 或 PR 到 main
- **执行内容**:
  - TypeScript 类型检查
  - 生产构建测试
  - 部署配置文件检查
  - Docker 镜像构建验证

## 最佳实践

1. **包管理器版本管理**
   - 使用 `packageManager` 字段锁定版本
   - 或在 workflow 中明确指定版本

2. **步骤顺序**
   - 先安装包管理器 (pnpm/action-setup 或 corepack)
   - 再设置 Node.js (此时才能使用缓存)

3. **缓存优化**
   - 使用 `cache: 'pnpm'` 加速依赖安装
   - 确保包管理器已安装才能使用缓存

## 参考资料
- [pnpm/action-setup](https://github.com/pnpm/action-setup)
- [Corepack Documentation](https://nodejs.org/api/corepack.html)
- [actions/setup-node](https://github.com/actions/setup-node)
