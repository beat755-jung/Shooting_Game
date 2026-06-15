@echo off
chcp 65001 >nul
echo ===================================
echo  동물 슈팅 게임 EXE 빌드
echo ===================================
echo.

:: 의존성 설치
echo [1/3] 패키지 설치 중...
pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo [오류] pip 설치 실패
    pause & exit /b 1
)

echo.
echo [2/3] PyInstaller로 EXE 빌드 중...
pyinstaller ^
  --onefile ^
  --windowed ^
  --name "동물슈팅게임" ^
  --add-data "index.html;." ^
  --add-data "style.css;." ^
  --add-data "game.js;." ^
  --icon NONE ^
  launcher.py

if %errorlevel% neq 0 (
    echo [오류] 빌드 실패
    pause & exit /b 1
)

echo.
echo [3/3] 완료!
echo  실행 파일 위치: dist\동물슈팅게임.exe
echo.
pause
