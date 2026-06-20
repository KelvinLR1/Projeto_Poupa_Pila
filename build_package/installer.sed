[Version]
Class=IEXPRESS
SEDVersion=3
[Options]
PackagePurpose=InstallApp
ShowInstallProgramWindow=1
HideExtractAnimation=1
UseLongFileName=1
InsideCompressed=1
CAB_FixedSize=0
CAB_ResvCodeSigning=0
RebootMode=N
InstallPrompt=%InstallPrompt%
DisplayLicense=%DisplayLicense%
FinishMessage=%FinishMessage%
TargetName=%TargetName%
FriendlyName=%FriendlyName%
AppLaunched=%AppLaunched%
PostInstallCmd=%PostInstallCmd%
SourceFiles=SourceFiles
[Strings]
InstallPrompt=Deseja instalar o Poupa Pila - Controle Financeiro em seu computador?
DisplayLicense=
FinishMessage=Instalacao Concluida! O Poupa Pila foi configurado como um servico do Windows e esta pronto para ser acessado em http://localhost:3001
TargetName=c:\Code\Projeto_Poupa_Pila\Instalar-PoupaPila.exe
FriendlyName=Poupa Pila - Controle Financeiro
AppLaunched=cmd.exe /c install.bat
PostInstallCmd=<None>
[SourceFiles]
SourceFiles0=c:\Code\Projeto_Poupa_Pila\build_package\
[SourceFiles0]
node.exe=
PoupaPilaService.exe=
install.bat=
uninstall.bat=
app.zip=
