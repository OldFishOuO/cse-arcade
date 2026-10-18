@echo off
rem ============================================================
rem  IECS ARCADE - rebuild, commit and publish to GitHub Pages
rem  (See 修改指南.md for the Chinese guide)
rem ============================================================
cd /d "%~dp0"

set PY=
where python >nul 2>nul && set PY=python
if "%PY%"=="" (where py >nul 2>nul && set PY=py)
if "%PY%"=="" (
  echo  [!] Python not found - cannot rebuild the standalone file.
  pause
  exit /b 1
)

echo.
echo  [1/3] Rebuilding iecs-arcade-standalone.html ...
%PY% build-single-file.py
if errorlevel 1 (
  echo  [!] Build failed. Nothing was published.
  pause
  exit /b 1
)

echo.
rem Detect any change, including brand-new untracked files
set "DIRTY="
for /f "delims=" %%i in ('git status --porcelain') do set "DIRTY=1"
if not defined DIRTY (
  echo  Nothing changed - already up to date.
  echo.
  pause
  exit /b 0
)

echo  [2/3] Changed files:
git status --short
echo.
set "MSG="
set /p "MSG=  What did you change? (press Enter for a default message): "
if "%MSG%"=="" set "MSG=update content"

git add -A
git commit -m "%MSG%"
if errorlevel 1 (
  echo  [!] Commit failed.
  pause
  exit /b 1
)

echo.
echo  [3/3] Pushing to GitHub ...
git push
if errorlevel 1 (
  echo  [!] Push failed. Check your network or GitHub login.
  pause
  exit /b 1
)

echo.
echo  ============================================================
echo   Done. The live site updates in about 1 minute:
echo   https://oldfishouo.github.io/iecs-arcade/
echo   If it looks unchanged, press Ctrl+F5 in the browser.
echo  ============================================================
echo.
pause
