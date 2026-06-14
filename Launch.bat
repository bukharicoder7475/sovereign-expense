@echo off
title Lederly - Starting...
echo ================================
echo    SOVEREIGN - Starting App...
echo ================================

:: Kill any existing node processes
taskkill /F /IM node.exe >nul 2>&1

:: Start backend server
echo [1/2] Starting backend server...
set SERVE_FRONTEND=true
set NODE_ENV=production
cd /d C:\Users\bukha\OneDrive\Documents\splitwise-clone\backend
start /b node server.js
timeout /t 3 /nobreak >nul
echo       Backend running on port 5000

:: Start Cloudflare tunnel
echo [2/2] Starting Cloudflare tunnel...
start /b "C:\Users\bukha\cloudflared.exe" tunnel --url http://localhost:5000
timeout /t 5 /nobreak >nul

echo.
echo ================================
echo  APP IS LIVE!
echo  Check the tunnel URL above
echo  It will look like:
echo  https://xxxx.trycloudflare.com
echo ================================
echo.
echo  Press Ctrl+C to stop everything
echo.
pause
