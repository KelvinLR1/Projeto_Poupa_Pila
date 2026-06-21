$ErrorActionPreference = "Stop"

Write-Host "Building Frontend..."
cd c:\Code\Projeto_Poupa_Pila\frontend
npm run build

Write-Host "Preparing Staging Directory..."
cd c:\Code\Projeto_Poupa_Pila\build_package
if (Test-Path staging) { Remove-Item -Recurse -Force staging }
New-Item -ItemType Directory -Path staging | Out-Null
New-Item -ItemType Directory -Path staging\frontend | Out-Null
New-Item -ItemType Directory -Path staging\backend | Out-Null

Write-Host "Copying Frontend Build..."
Copy-Item -Recurse -Path c:\Code\Projeto_Poupa_Pila\frontend\dist -Destination staging\frontend\dist

Write-Host "Copying Backend..."
Copy-Item -Recurse -Path c:\Code\Projeto_Poupa_Pila\backend\* -Destination staging\backend -Exclude ".env", "*.db", "*.sqlite", "logs"

Write-Host "Copying Installer Files..."
Copy-Item install.bat staging\
Copy-Item uninstall.bat staging\
Copy-Item PoupaPilaService.exe staging\
Copy-Item node.exe staging\

Write-Host "Creating Zip Archive..."
if (Test-Path PoupaPila_Instalador.zip) { Remove-Item -Force PoupaPila_Instalador.zip }
Set-Location staging
tar -a -c -f ..\PoupaPila_Instalador.zip *
Set-Location ..

Write-Host "Copying to Project Root..."
Copy-Item PoupaPila_Instalador.zip "c:\Code\Projeto_Poupa_Pila\PoupaPila-Instalador.zip" -Force

Write-Host "Done!"
