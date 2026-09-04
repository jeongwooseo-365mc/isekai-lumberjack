@echo off
cd /d %~dp0
call npm install
call npm run prepare:web
if not exist src-tauri\gen\android call npm run android:init
call node_modules\.bin\tauri.cmd icon src-tauri\icons\icon-mobile.png
python tools\patch_android.py
if errorlevel 1 exit /b 1
python tools\verify_android_package.py --generated
if errorlevel 1 exit /b 1
call npm run android:build
pause
