@echo off
echo 正在部署到Vercel...
echo.

REM 检查是否安装了Vercel CLI
where vercel >nul 2>&1
if %errorlevel% neq 0 (
    echo 首次使用，需要安装Vercel CLI...
    npm install -g vercel
)

echo.
echo 开始部署...
cd /d H:\写作第三版小应用\musewriter\dist
vercel --prod

echo.
echo 部署完成！
echo.
pause
