@echo off
echo Starting Mobile System Local Environment...

echo [1/2] Starting Backend...
start cmd /k "cd Mobile-System-Backend && npm install && npm start"

echo [2/2] Starting Frontend...
start cmd /k "cd Mobile-System-Front-End && npm install && npm start"

echo.
echo Both servers are starting in separate windows.
echo Backend: http://localhost:5000 (Check backend console for exact port)
echo Frontend: http://localhost:5173 (Check frontend console for exact port)
echo.
pause
