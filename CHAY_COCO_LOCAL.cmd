@echo off
setlocal
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0CoCo\scripts\start-local.ps1" %*
set "coco_result=%ERRORLEVEL%"
if not "%coco_result%"=="0" pause
exit /b %coco_result%
