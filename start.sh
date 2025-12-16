#!/bin/bash

echo "🚀 正在启动个人收支管理系统 (v1.0.0)..."

# 1. Check if Docker is running
if ! docker info > /dev/null 2>&1; then
  echo "❌ Docker 未运行，请先启动 Docker Desktop！"
  exit 1
fi

# 2. Start SQL Server
echo "📦 正在启动数据库容器..."
docker-compose -p finance-system up -d
if [ $? -ne 0 ]; then
    echo "❌ 数据库启动失败，请检查 Docker 日志。"
    exit 1
fi

echo "⏳ 等待数据库就绪 (5秒)..."
sleep 5

# 3. Install dependencies (if needed)
if [ ! -d "node_modules" ]; then
    echo "📥 正在安装依赖..."
    npm install
fi

# 4. Run Database Migrations
echo "🔄 正在同步数据库结构..."
npx prisma db push

# 5. Start the Application
echo "✨ 系统启动成功！"
echo "🌐 请在浏览器访问: http://localhost:5173"
echo "📝 按 Ctrl+C 停止服务"

npm run dev
