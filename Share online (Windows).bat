@echo off
title PRISM - public https link
cd /d "%~dp0"
echo.
echo  This gives your running PRISM a public https link (free, through Cloudflare).
echo  Start PRISM first with "Start PRISM (Windows).bat" and keep that window open.
echo.
where cloudflared >nul 2>nul
if errorlevel 1 (
  echo  Installing Cloudflare's free tunnel tool, one time only...
  winget install --id Cloudflare.cloudflared -e --accept-source-agreements --accept-package-agreements
  echo.
  echo  Installed. Close this window and double-click this file again.
  pause
  exit /b 0
)
set PORT=3000
if not "%1"=="" set PORT=%1
echo  Look below for a line ending in .trycloudflare.com - that is your https link.
echo  Share it while this window is open. Close this window to stop sharing.
echo.
cloudflared tunnel --url http://localhost:%PORT%
pause
