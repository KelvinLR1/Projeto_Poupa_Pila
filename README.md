# Poupa Pila - Controle Financeiro & Segurança

O **Poupa Pila** é um sistema completo de gestão financeira pessoal e cofre de senhas premium. Ele conta com dashboard dinâmico, conciliação bancária por arquivos OFX, gestão de limites e categorias, amortização de empréstimos e criptografia local forte de credenciais (AES-256-GCM).

Este repositório está configurado para permitir tanto o **desenvolvimento ágil** do sistema quanto a **geração automática de um instalador autônomo (.exe)** para Windows que roda como serviço em segundo plano.

---

## 📦 Guia de Instalação Rápida (Outro Computador)

Para instalar o sistema em outro computador de forma simplificada, **não é necessário instalar o Node.js, Git ou qualquer dependência**. Todo o runtime e configuração estão embutidos no instalador.

1. Copie o executável **[Instalar-PoupaPila.exe](Instalar-PoupaPila.exe)** (localizado na raiz deste projeto) para o computador de destino.
2. Dê dois cliques no arquivo. Ele solicitará permissão de **Administrador** (UAC).
3. O instalador extrairá silenciosamente os arquivos, criará a pasta `C:\PoupaPila`, configurará o serviço do Windows e criará os atalhos.
4. Ao finalizar, o Poupa Pila estará ativo e pronto. Acesse pelo atalho criado no Menu Iniciar ou pelo navegador em: **`http://localhost:3001`**.

---

## ⚙️ Como Alterar a Porta do Sistema (Após Instalado)

O frontend e o backend rodam unificados em uma **única porta** de rede (padrão: `3001`). Se essa porta estiver ocupada por outro programa ou se você desejar alterá-la (por exemplo, para `8080`), siga os passos:

1. Vá até a pasta de instalação (por padrão, **`C:\PoupaPila\backend`**).
2. Abra o arquivo **`.env`** com o Bloco de Notas (Notepad).
3. Modifique a linha da porta para o número desejado:
   ```env
   PORT=8080
   ```
4. Salve e feche o arquivo.
5. Reinicie o serviço do Windows para aplicar as mudanças:
   * Abra o **Gerenciador de Tarefas** (`Ctrl + Shift + Esc`) -> aba **Serviços**.
   * Procure por **`PoupaPila`**, clique com o botão direito e selecione **Reiniciar**.
   * *Alternativa via terminal (Admin):* Rode `net stop PoupaPila` e depois `net start PoupaPila`.

> ⚠️ **Ajustando o Atalho**: O atalho no Menu Iniciar aponta estaticamente para a porta `3001`. Caso mude a porta, edite as propriedades do atalho em `%ProgramData%\Microsoft\Windows\Start Menu\Programs\Poupa Pila.lnk` e mude o endereço de destino para a nova porta (ex: `http://localhost:8080`).

---

## 🖥️ Gerenciamento do Serviço Windows

O sistema roda silenciosamente em segundo plano. Você pode controlar o status do serviço por comandos no Prompt de Comando (CMD) ou PowerShell como **Administrador**:

* **Parar o sistema**:
  ```bash
  net stop PoupaPila
  ```
* **Iniciar o sistema**:
  ```bash
  net start PoupaPila
  ```
* **Verificar logs de execução**:
  Consulte o arquivo `C:\PoupaPila\service_log.txt` para conferir a auditoria de inicialização do serviço e o PID do processo.

---

## ❌ Como Desinstalar o Sistema

O Poupa Pila é totalmente integrado ao sistema operacional Windows:

1. Abra o menu **Configurações** do Windows -> **Aplicativos** -> **Aplicativos Instalados** (ou *Adicionar ou Remover Programas* no Painel de Controle).
2. Procure por **Poupa Pila - Controle Financeiro** na lista.
3. Clique em **Desinstalar** e confirme.
4. O Windows executará o script de remoção, que para e deleta o serviço, apaga os atalhos e remove a pasta `C:\PoupaPila` do disco automaticamente.

---

## 💻 Configuração para Desenvolvimento (Programadores)

Caso deseje modificar o código-fonte do projeto na sua máquina de desenvolvimento:

### Pré-requisitos
* Node.js v20 ou v22+ instalado.

### 1. Instalar as dependências
Na raiz do repositório, rode:
```bash
npm run install:all
```

### 2. Executar em modo de desenvolvimento (Hot-Reload)
Abra dois terminais na raiz:
* **Terminal 1 (Servidor Backend):**
  ```bash
  npm run dev:backend
  ```
* **Terminal 2 (Tela Frontend - Vite):**
  ```bash
  npm run dev:frontend
  ```
Acesse em: `http://localhost:5173`. O Vite fará o proxy das requisições `/api` para a porta `3001` do Node.js automaticamente.

### 3. Gerar um novo instalador (.exe)
Caso faça alterações e queira gerar um novo instalador executável:
1. Compile o frontend para produção:
   ```bash
   npm run build:frontend
   ```
2. Vá até a pasta `c:\Code\Projeto_Poupa_Pila\build_package` e execute os comandos de montagem de payload e compilação do wrapper:
   ```powershell
   # No PowerShell (gera o app.zip atualizado)
   Compress-Archive -Path ..\backend\server.js, ..\backend\db.js, ..\backend\crypto.js, ..\backend\package.json, ..\backend\node_modules, ..\frontend\dist -DestinationPath app.zip -Force
   
   # Compila o wrapper C# do serviço
   C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe /r:System.ServiceProcess.dll /target:exe /out:PoupaPilaService.exe PoupaPilaService.cs
   
   # Compila o stub do instalador
   C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe /r:System.IO.Compression.FileSystem.dll /r:System.IO.Compression.dll /target:exe /out:InstallerStub.exe Installer.cs
   
   # Compacta o payload final
   Compress-Archive -Path node.exe, PoupaPilaService.exe, install.bat, uninstall.bat, app.zip -DestinationPath installer_payload.zip -Force
   
   # Concatena em um único .exe instalador
   cmd.exe /c "copy /b InstallerStub.exe+installer_payload.zip ..\Instalar-PoupaPila.exe"
   ```
