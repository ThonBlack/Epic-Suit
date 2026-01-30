@echo off
title Epic Suit Launcher
echo =========================================
echo      Epic Suit - WhatsApp Manager
echo =========================================
echo.

REM Define o diretório do app
set APP_DIR=%~dp0release-build\win-unpacked
set EXE_PATH=%APP_DIR%\Epic Suit.exe

REM Verifica se o executável existe
if not exist "%EXE_PATH%" (
    echo [ERRO] Executável não encontrado em: %EXE_PATH%
    echo.
    echo Verifique se o build foi feito corretamente.
    echo Execute: npm run build
    pause
    exit /b 1
)

echo [INFO] Iniciando Epic Suit...
echo.

REM Inicia o aplicativo
start "" "%EXE_PATH%"

echo [OK] Aplicativo iniciado!
echo.
echo Você pode fechar esta janela.
timeout /t 3 >nul
