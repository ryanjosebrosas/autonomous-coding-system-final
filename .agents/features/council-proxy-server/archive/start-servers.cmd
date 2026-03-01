@echo off
echo Starting OpenCode server on :4096...
start "OpenCode Server" cmd /c "opencode serve"

echo Waiting for OpenCode server to start...
timeout /t 3 /nobreak > nul

echo Starting Council proxy on :4097...
cd proxy-server
npm start

echo.
echo Both servers running:
echo   OpenCode: http://127.0.0.1:4096
echo   Council:  http://127.0.0.1:4097/council
