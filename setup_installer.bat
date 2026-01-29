@echo off
setlocal
title Epic Suit - Instalador Automatico
color 0A

echo ==================================================
echo       Bem-vindo ao Instalador do Epic Suit
echo ==================================================
echo.

:: 1. Verificar Node.js
echo [1/5] Verificando instalacao do Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [X] Node.js nao encontrado!
    echo Tentando instalar via Winget (Windows Package Manager)...
    winget install OpenJS.NodeJS.LTS
    if %errorlevel% neq 0 (
        echo.
        echo [ERRO] Nao foi possivel instalar o Node.js automaticamente.
        echo Por favor, instale manualmente em: https://nodejs.org/
        pause
        exit /b
    )
    echo [OK] Node.js instalado. Reinicie este script para continuar.
    pause
    exit
) else (
    echo [OK] Node.js detectado.
)

:: 2. Verificar Git (Opcional, mas util)
echo [2/5] Verificando Git...
git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [!] Git nao detectado (ok, nao e critico para instalacao se voce baixou o ZIP).
) else (
    echo [OK] Git detectado.
)

:: 3. Configurar Banco de Dados (.env)
echo [3/5] Configurando ambiente...
if not exist "server\.env" (
    echo Criando arquivo de configuracao do banco de dados...
    echo DATABASE_URL="file:./dev.db" > server\.env
    echo [OK] Arquivo .env criado.
) else (
    echo [OK] Arquivo .env ja existe.
)

:: 4. Instalar Dependencias
echo [4/5] Instalando dependencias do projeto (Isso pode demorar)...
call npm install
if %errorlevel% neq 0 (
    echo [ERRO] Falha ao instalar dependencias. Verifique sua conexao.
    pause
    exit /b
)

:: 5. Gerar Executavel
echo [5/5] Gerando o executavel (Compilando o App)...
echo Aguarde, esse processo compila o React e empacota com Electron.
call npm run build
if %errorlevel% neq 0 (
    echo [ERRO] Falha na compilacao.
    pause
    exit /b
)

echo.
echo ==================================================
echo       SUCESSO! Instalacao Concluida.
echo ==================================================
echo.
echo O instalador foi gerado na pasta: Release-Build
echo.
echo Pressione qualquer tecla para abrir a pasta do executavel...
pause >nul
start explorer "release-build"

endlocal
