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

echo Removendo arquivos de C:\PoupaPila...
:: Como o batch esta sendo executado a partir de C:\PoupaPila, 
:: agendamos a exclusao da pasta em background apos a finalizacao deste script.
timeout /t 1 >nul
start /b "" cmd /c "rd /s /q C:\PoupaPila"

echo.
echo =========================================================
echo  Desinstalacao concluida com sucesso!
echo =========================================================
echo.
timeout /t 2 >nul
exit /b 0
