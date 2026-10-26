@echo off
title PRISM demo
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo  Node.js is not installed. Install the LTS version from https://nodejs.org, then double-click this file again.
  start "" https://nodejs.org
  pause
  exit /b 1
)
if not exist ".env" (
  echo.
  echo  First run: no API key needed. Just press Enter to use PRISM's built-in AI.
  echo  ^(Optional: paste a Claude API key, starting with sk-ant-, to use Claude instead.^)
  set /p KEY=  Claude API key ^(optional^): 
  call :writeenv
)
if not exist "node_modules" (
  echo.
  echo  Installing PRISM ^(first run only, needs internet^)...
  call npm install --no-audit --no-fund
  if errorlevel 1 ( echo  npm install failed. Check your internet connection. & pause & exit /b 1 )
)
node server.mjs --open
pause
exit /b 0

:writeenv
> ".env" echo ANTHROPIC_API_KEY=%KEY%
>> ".env" echo ACCESS_CODE=
>> ".env" echo CLAUDE_MODEL=claude-opus-5-5
>> ".env" echo CLAUDE_EFFORT=medium
exit /b 0
