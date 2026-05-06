@echo off
title FitRep - Setup
cd /d "%~dp0"
echo ====================================
echo FitRep - AI Tracker Setup
echo ====================================
echo.
echo Step 1: Installing dependencies...
npm install
echo.
echo Step 2: Generating Prisma client...
npx prisma generate
echo.
echo Step 3: Setting up database...
npx prisma db push
echo.
echo ====================================
echo Setup complete!
echo Run run.bat to start the application
echo ====================================
pause