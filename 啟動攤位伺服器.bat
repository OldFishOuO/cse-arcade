@echo off
rem ============================================================
rem  CSE ARCADE - start a local server and open the site
rem  (Chinese notes are in README.md)
rem ============================================================
cd /d "%~dp0"

set PORT=8765
set PY=

where python >nul 2>nul && set PY=python
if "%PY%"=="" (where py >nul 2>nul && set PY=py)

if "%PY%"=="" (
  echo.
  echo  [!] Python not found.
  echo      Just double-click  cse-arcade-single-file.html  instead.
  echo      It works with no server at all.
  echo.
  pause
  exit /b 1
)

echo.
echo  CSE ARCADE
echo  Serving on http://localhost:%PORT%
echo  Keep this window OPEN while the booth is running.
echo  Press Ctrl+C or close this window to stop.
echo.

start "" "http://localhost:%PORT%"
%PY% -m http.server %PORT%
