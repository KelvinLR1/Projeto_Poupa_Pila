@echo off
setlocal enabledelayedexpansion
cd /d "%~dp0"
:: Verificar privilegios de administrador
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo.
    echo ====================================================================
    echo ERRO: Este instalador precisa ser executado como Administrador!
    echo Clique com o botao direito e selecione "Executar como Administrador".
    echo ====================================================================
    echo.
    pause
    exit /b 1
)

echo.
echo =========================================================
echo  Iniciando instalacao do Poupa Pila - Controle Financeiro
echo =========================================================
echo.

:: Parar e remover servico existente, se houver
sc query PoupaPila >nul 2>&1
if %errorLevel% == 0 (
    echo [1/6] Parando servico existente...
    sc stop PoupaPila >nul 2>&1
    timeout /t 2 >nul
    echo [2/6] Removendo servico antigo...
    sc delete PoupaPila >nul 2>&1
) else (
    echo [1/6] Nenhum servico anterior ativo detectado.
    echo [2/6] Pulando remocao de servico antigo.
)

:: Criar diretorio de destino
set INSTALL_DIR=C:\PoupaPila
echo [3/6] Criando pasta de instalacao em %INSTALL_DIR%...
if not exist "%INSTALL_DIR%" mkdir "%INSTALL_DIR%"

:: Copiar arquivos principais
echo [4/6] Copiando binarios principais...
copy /y "node.exe" "%INSTALL_DIR%\" >nul
copy /y "PoupaPilaService.exe" "%INSTALL_DIR%\" >nul
copy /y "uninstall.bat" "%INSTALL_DIR%\" >nul

:: Copiar pastas de codigo
echo [5/6] Copiando arquivos do sistema (frontend e backend)...
xcopy /E /I /Y "frontend" "%INSTALL_DIR%\frontend" >nul
xcopy /E /I /Y "backend" "%INSTALL_DIR%\backend" >nul

:: Criar o arquivo .env padrao caso nao exista
if not exist "%INSTALL_DIR%\backend\.env" (
    echo Criando arquivo de configuracao inicial .env...
    (
        echo PORT=3001
        echo NODE_ENV=production
        echo ENCRYPTION_KEY=poupa_pila_super_secure_production_key_32_bytes_long!
    ) > "%INSTALL_DIR%\backend\.env"
)

:: Registrar servico do Windows
echo [6/6] Registrando e iniciando servico do Windows...
sc create PoupaPila binPath= "\"%INSTALL_DIR%\PoupaPilaService.exe\"" start= auto >nul
sc description PoupaPila "Servico de Controle Financeiro Poupa Pila (Local)" >nul
sc start PoupaPila >nul

:: Adicionar ao "Adicionar ou Remover Programas" do Windows (Painel de Controle)
echo Gravando registros de desinstalacao do Windows...
set REG_KEY=HKLM\Software\Microsoft\Windows\CurrentVersion\Uninstall\PoupaPila
reg add "%REG_KEY%" /v "DisplayName" /d "Poupa Pila - Controle Financeiro" /f >nul
reg add "%REG_KEY%" /v "UninstallString" /d "\"%INSTALL_DIR%\uninstall.bat\"" /f >nul
reg add "%REG_KEY%" /v "InstallLocation" /d "%INSTALL_DIR%" /f >nul
reg add "%REG_KEY%" /v "Publisher" /d "Poupa Pila" /f >nul
reg add "%REG_KEY%" /v "DisplayVersion" /d "1.0.0" /f >nul

:: Criar atalho no Menu Iniciar
echo Criando atalho no Menu Iniciar...
set SHORTCUT_PATH=%ProgramData%\Microsoft\Windows\Start Menu\Programs\Poupa Pila.lnk
powershell -Command "$WshShell = New-Object -ComObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%SHORTCUT_PATH%'); $Shortcut.TargetPath = 'http://localhost:3001'; $Shortcut.Save()" >nul

echo.
echo =========================================================
echo  Instalacao concluida com sucesso!
echo  O Poupa Pila esta ativo e rodando como servico do Windows.
echo  Acesse em seu navegador: http://localhost:3001
echo =========================================================
echo.
pause
exit /b 0
