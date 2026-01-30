@echo off
title Epic Suit - Criar Instalador
echo =========================================
echo   Epic Suit - Build e Empacotamento
echo =========================================
echo.

REM Verifica se está na pasta correta
if not exist "package.json" (
    echo [ERRO] Execute este script na pasta raiz do projeto.
    pause
    exit /b 1
)

echo [1/4] Limpando builds anteriores...
if exist "release-build" rmdir /s /q "release-build"
if exist "client\dist-build" rmdir /s /q "client\dist-build"
echo [OK] Limpeza concluída.
echo.

echo [2/4] Compilando frontend (pode demorar)...
call npm run client:build
if errorlevel 1 (
    echo [ERRO] Falha ao compilar o frontend.
    pause
    exit /b 1
)
echo [OK] Frontend compilado.
echo.

echo [3/4] Garantindo template do banco de dados...
if not exist "server\prisma\template.db" (
    echo [AVISO] template.db não encontrado, gerando...
    cd server
    call npx prisma db push
    copy prisma\dev.db prisma\template.db
    cd ..
)
echo [OK] Template do banco pronto.
echo.

echo [4/4] Criando instalador Windows (pode pedir admin)...
echo [INFO] Execute este passo como Administrador se falhar.
call npx electron-builder --win --x64
if errorlevel 1 (
    echo [ERRO] Falha ao criar o instalador.
    echo [DICA] Tente executar o PowerShell como Administrador.
    pause
    exit /b 1
)
echo.

echo =========================================
echo           BUILD CONCLUIDO!
echo =========================================
echo.
echo Arquivos gerados em: release-build\
echo.
echo - Epic Suit Setup X.X.X.exe  (Instalador)
echo - win-unpacked\              (Versão portátil)
echo.
echo Para criar um release no GitHub:
echo   gh release create vX.X.X "release-build\Epic Suit Setup X.X.X.exe"
echo.
pause
