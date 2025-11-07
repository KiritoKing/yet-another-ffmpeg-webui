#!/bin/bash

# 部署平台检查脚本
# 用于验证所有部署配置文件的完整性

echo "🔍 检查部署配置文件..."
echo ""

# 检查文件是否存在
check_file() {
  if [ -f "$1" ]; then
    echo "✅ $1"
  else
    echo "❌ $1 (缺失)"
  fi
}

# 平台配置文件
echo "📦 平台配置文件:"
check_file "vercel.json"
check_file "netlify.toml"
check_file "public/_headers"
check_file "public/_redirects"
check_file "wrangler.toml"
check_file "render.yaml"
check_file "fly.toml"
check_file "railway.json"
check_file ".platform.app.yaml"
echo ""

# Docker 配置
echo "🐳 Docker 配置:"
check_file "Dockerfile"
check_file "docker-compose.yml"
check_file ".dockerignore"
echo ""

# 文档
echo "📚 文档:"
check_file "DEPLOYMENT.md"
check_file "README.md"
echo ""

# 检查关键依赖
echo "🔧 检查依赖:"
if command -v pnpm &> /dev/null; then
  echo "✅ pnpm $(pnpm --version)"
else
  echo "❌ pnpm (未安装)"
fi

if command -v node &> /dev/null; then
  echo "✅ node $(node --version)"
else
  echo "❌ node (未安装)"
fi
echo ""

# 构建测试
echo "🏗️  测试构建命令:"
echo "运行: pnpm build"
if pnpm build; then
  echo "✅ 构建成功"
else
  echo "❌ 构建失败"
  exit 1
fi
echo ""

echo "✨ 所有检查完成！"
