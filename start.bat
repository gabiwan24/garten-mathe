@echo off
setlocal
cd /d "%~dp0"

REM ==== CONFIG (per project) ====
set "BASE_PORT=5173"

REM ==== find free port ====
set "PORT="
for /f "usebackq delims=" %%P in (`powershell -NoProfile -ExecutionPolicy Bypass -File "scripts\find-port.ps1" %BASE_PORT%`) do set "PORT=%%P"
if not defined PORT (
  echo [start.bat] No free port found from %BASE_PORT% upwards.
  pause
  exit /b 1
)

echo [start.bat] http://localhost:%PORT%/blumenweg.html  (Handy im WLAN: http://^<PC-IP^>:%PORT%/blumenweg.html)
start "" /b cmd /c "timeout /t 2 /nobreak >nul & start "" http://localhost:%PORT%/blumenweg.html"

REM ==== START COMMAND (per project): static server for the Zaubergarten in lab/ ====
python -m http.server %PORT% -d lab

endlocal
