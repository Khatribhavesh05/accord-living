@echo off
setlocal

echo Cleaning old dev servers on required ports...
for %%P in (3002 5175 5176 5177 5178 5179 5180) do (
	for /f "tokens=5" %%A in ('netstat -aon ^| findstr :%%P ^| findstr LISTENING') do (
		taskkill /PID %%A /F >nul 2>&1
	)
)

echo Starting Backend on http://127.0.0.1:3002 ...
start "SMS Backend" cmd /k "cd /d %~dp0backend && npm start"

echo Starting Frontend on http://127.0.0.1:5175 ...
start "SMS Frontend" cmd /k "cd /d %~dp0frontend && npm run dev -- --host 127.0.0.1 --port 5175 --strictPort"

echo.
echo App URL: http://127.0.0.1:5175/admin/bookings
pause
