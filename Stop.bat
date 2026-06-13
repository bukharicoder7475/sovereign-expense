@echo off
echo Stopping Sovereign...
taskkill /F /IM node.exe >nul 2>&1
taskkill /F /IM cloudflared.exe >nul 2>&1
echo Done.
