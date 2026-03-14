@echo off
echo 正在部署到Netlify（永久版本）...
echo.

REM 检查是否安装了Netlify CLI
where netlify >nul 2>&1
if %errorlevel% neq 0 (
    echo 首次使用，需要安装Netlify CLI...
    npm install -g netlify-cli
)

echo.
echo 开始部署...
cd /d H:\写作第三版小应用\musewriter\dist
netlify deploy --prod --site=大文豪

echo.
echo 部署完成！
echo.
echo 你的应用将永久在线，无需密码保护。
echo.
pause
