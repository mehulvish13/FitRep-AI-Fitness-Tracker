@echo off
title FitRep - AI Tracker
cd /d "%~dp0"

REM Check if dependencies are installed
if not exist "node_modules\.prisma\client" (
    echo [SETUP] Running first-time setup...
    call setup.bat
)

echo.
echo ====================================
echo FitRep - AI Tracker
echo ====================================
echo.
echo Starting server at http://localhost:3000
echo.
echo If browser doesn't open automatically:
echo   1. Open your browser
echo   2. Go to: http://localhost:3000
echo.
echo Press Ctrl+C to stop the server
echo ====================================
echo.

start http://localhost:3000
npm run dev

pause