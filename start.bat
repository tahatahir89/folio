@echo off
rem One-step launcher for Windows.
rem   start.bat            install, configure and start the dev server
rem   start.bat --docker   also start a local MongoDB container first
rem   start.bat --prod     build and start the production server
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js 18.18 or newer is required. Install it from https://nodejs.org and run this again.
  exit /b 1
)

if "%1"=="--docker" docker compose up -d
if "%2"=="--docker" docker compose up -d

node scripts\setup-env.mjs
if not exist node_modules\next (
  echo Installing dependencies ^(first run only^)...
  call npm install
  if errorlevel 1 exit /b 1
)

if "%1"=="--prod" goto prod
if "%2"=="--prod" goto prod
call npm run dev
goto end

:prod
call npm run build
if errorlevel 1 exit /b 1
call npm run start

:end
