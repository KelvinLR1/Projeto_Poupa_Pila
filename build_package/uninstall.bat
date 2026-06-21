@echo off

:: Verificar privilegios de administrador
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo.
    echo ====================================================================
    echo ERRO: Este desinstalador precisa ser executado como Administrador!
    echo ====================================================================
    echo.
    pause
    exit /b 1
)

echo.
echo =========================================================
echo  Desinstalando Poupa Pila - Controle Financeiro
echo =========================================================
echo.

:: Parar e remover servico
sc query PoupaPila >nul 2>&1
if %errorLevel% == 0 (
    echo Parando servico PoupaPila...
    sc stop PoupaPila >nul 2>&1
    timeout /t 3 >nul
    echo Removendo servico PoupaPila...
    sc delete PoupaPila >nul 2>&1
)

:: Remover atalho do Menu Iniciar
echo Removendo atalhos do Menu Iniciar...
set SHORTCUT_PATH=%ProgramData%\Microsoft\Windows\Start Menu\Programs\Poupa Pila.lnk
if exist "%SHORTCUT_PATH%" del /f /q "%SHORTCUT_PATH%"

:: Remover chaves do registro
echo Removendo registros do Windows...
reg delete HKLM\Software\Microsoft\Windows\CurrentVersion\Uninstall\PoupaPila /f >nul 2>&1

set "INSTALL_DIR=%~dp0"
if "%INSTALL_DIR:~-1%"=="\" set "INSTALL_DIR=%INSTALL_DIR:~0,-1%"

echo Removendo arquivos de %INSTALL_DIR%...

:: Criamos um script VBS temporario para deletar a pasta silenciosamente apos o bat fechar
set "TEMP_VBS=%TEMP%\remove_poupapila.vbs"
(
echo WScript.Sleep 2000
echo Set objShell = CreateObject^("WScript.Shell"^)
echo objShell.Run "cmd /c rd /s /q """ ^& "%INSTALL_DIR%" ^& """", 0, True
echo Set objFSO = CreateObject^("Scripting.FileSystemObject"^)
echo objFSO.DeleteFile WScript.ScriptFullName
) > "%TEMP_VBS%"

echo.
echo =========================================================
echo  Desinstalacao concluida com sucesso!
echo =========================================================
echo.
timeout /t 2 >nul
start "" /b wscript.exe "%TEMP_VBS%"
exit /b 0
