#!/bin/bash

echo "================================"
echo "  AXIS O 一键启动脚本"
echo "================================"
echo ""

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

echo "[1/3] 检查依赖安装..."
cd server && npm install --silent 2>/dev/null && cd ..
cd client && npm install --silent 2>/dev/null && cd ..

echo "[2/3] 启动后端服务 (端口 3001)..."
cd server && npx tsx watch src/index.ts &
cd ..

sleep 2

echo "[3/3] 启动前端服务 (端口 5173)..."
cd client && npx vite &

echo ""
echo "================================"
echo "  服务启动中..."
echo "  后端: http://localhost:3001"
echo "  前端: http://localhost:5173"
echo "================================"
echo ""
echo "按 Ctrl+C 停止所有服务"
echo ""

# 等待用户中断
wait
