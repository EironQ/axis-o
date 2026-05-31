@echo off
echo ================================
echo   AXIS O 一键启动脚本
echo ================================
echo.

cd /d "%~dp0"

echo [1/3] 检查依赖安装...
cd server
call npm install --silent 2>nul
cd ..
cd client
call npm install --silent 2>nul
cd ..

echo [2/3] 启动后端服务 (端口 3001)...
start "AXIS-O Server" cmd /c "cd server && npx tsx watch src/index.ts"

timeout /t 3 /nobreak >nul

echo [3/3] 启动前端服务 (端口 5173)...
start "AXIS-O Client" cmd /c "cd client && npx vite"

echo.
echo ================================
echo   服务启动中...
echo   后端: http://localhost:3001
echo   前端: http://localhost:5173
echo ================================
echo.
echo 按任意键退出...
pause >nul
