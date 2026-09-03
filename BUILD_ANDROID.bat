@echo off
cd /d %~dp0
call npm install
call npm run prepare:web
if not exist src-tauri\gen\android call npm run android:init
call npm run android:build
pause
