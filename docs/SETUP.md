# 🚀 Guia de Setup e Instalação

## Requisitos

- **Node.js** 18.0 ou superior
- **npm** 9.0 ou superior
- **Git** (opcional, para clonar o repositório)

---

## 📦 Instalação

### Passo 1: Clonar/Preparar o Projeto

```bash
# Se estiver clonando
git clone <seu-repositorio>
cd Projeto_Poupa_Pila

# Ou simplesmente entre na pasta do projeto
cd Projeto_Poupa_Pila
```

### Passo 2: Instalar Dependências do Backend

```bash
cd backend
npm install
```

**Dependências instaladas:**
- `express` - Framework web
- `cors` - Controle de requisições
- `dotenv` - Variáveis de ambiente

### Passo 3: Instalar Dependências do Frontend

```bash
cd ../frontend
npm install
```

**Dependências instaladas:**
- `react` - Biblioteca UI
- `react-dom` - DOM para React
- `lucide-react` - Ícones
- Dependências de desenvolvimento (Vite, ESLint, etc.)

---

## 🔧 Configuração

### Backend

1. **Arquivo `.env` (opcional)**

Na pasta `backend/`, você pode criar um arquivo `.env`:

```env
PORT=3001
NODE_ENV=development
```

Se não criar, o backend rodará na porta `3001` por padrão.

### Frontend

O frontend está configurado para fazer requisições para `http://localhost:3001` (proxy no Vite pode ser necessário para desenvolvimento).

Verifique o arquivo `vite.config.js` para ajustar a URL da API se necessário.

---

## ▶️ Executando o Projeto

### Opção 1: Dois Terminais Separados (Recomendado)

**Terminal 1 - Backend:**
```bash
cd backend
npm start
```

Ou com auto-reload em desenvolvimento:
```bash
npm run dev
```

Resposta esperada:
```
Backend rodando em http://localhost:3001
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

Resposta esperada:
```
VITE v8.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
```

Acesse `http://localhost:5173` no navegador.

---

### Opção 2: Usar Ferramentas de Gerenciador de Processos

**Usando npm-run-all (opcional)**

Instale globalmente:
```bash
npm install -g npm-run-all
```

Na pasta raiz, crie um `package.json`:
```json
{
  "scripts": {
    "dev": "npm-run-all --parallel backend:dev frontend:dev",
    "backend:dev": "cd backend && npm run dev",
    "frontend:dev": "cd frontend && npm run dev"
  }
}
```

Depois execute:
```bash
npm run dev
```

---

## 🗄️ Banco de Dados

### Inicialização Automática

O banco de dados SQLite é criado automaticamente na primeira execução do backend:
- Arquivo: `backend/poupa_pila.db`
- Tabelas são criadas automaticamente no primeiro acesso

### Populando Dados de Teste

Execute o script de seed (opcional):

```bash
cd backend
node seed_30_loans.js
```

Este script cria dados de teste incluindo:
- Usuários de teste
- Contas bancárias
- Transações
- 30 empréstimos de exemplo

---

## 🔐 Primeiro Acesso

### Criar Usuário

1. Acesse `http://localhost:5173`
2. Na tela de login, marque a opção **"Registrar novo usuário"**
3. Preencha:
   - **Username**: Seu nome de usuário
   - **Senha**: Sua senha (segura)
   - **Nome**: Seu nome completo
4. Clique em **Login/Registrar**

### Usar Dados de Teste (após seed)

Se executou `seed_30_loans.js`, pode usar:
- **Username**: `testuser`
- **Senha**: `test123`

---

## ✅ Verificação de Status

Após iniciar backend e frontend, verifique:

1. **Backend está rodando?**
   ```bash
   curl http://localhost:3001
   ```
   Resposta esperada: Erro 404 (isso é normal, não há rota raiz)

2. **Frontend está acessível?**
   Abra `http://localhost:5173` no navegador

3. **Comunicação Frontend ↔ Backend?**
   Tente fazer login. Se funcionar, está tudo ok!

---

## 🛑 Problemas Comuns

### Porta 3001 já em uso

```bash
# Encontrar processo usando a porta (Windows)
netstat -ano | findstr :3001

# Usar outra porta (backend)
PORT=3002 npm start
```

### Porta 5173 já em uso

Vite automaticamente tenta a próxima porta disponível.

### Erro de CORS

Se o frontend não conseguir comunicar com o backend:
- Verifique se o backend está rodando em `3001`
- Verifique a URL da API no arquivo de configuração do frontend

### Banco de dados corrompido

Delete o arquivo `backend/poupa_pila.db` e reinicie o backend. Ele será recriado.

---

## 🏗️ Build para Produção

### Frontend

```bash
cd frontend
npm run build
```

Cria pasta `dist/` com arquivos otimizados.

### Backend

Não precisa de build especial. Apenas copie os arquivos `.js` para o servidor.

---

## 📋 Checklist de Setup

- [ ] Node.js 18+ instalado
- [ ] Backend dependências instaladas (`npm install` em `backend/`)
- [ ] Frontend dependências instaladas (`npm install` em `frontend/`)
- [ ] Backend rodando em `http://localhost:3001`
- [ ] Frontend rodando em `http://localhost:5173`
- [ ] Banco de dados criado (`backend/poupa_pila.db`)
- [ ] Consegue fazer login/registrar novo usuário

---

## 🚀 Próximos Passos

Após o setup:
1. Leia [ARQUITETURA.md](./ARQUITETURA.md) para entender a estrutura
2. Explore [FUNCIONALIDADES.md](./FUNCIONALIDADES.md) para ver tudo que pode fazer
3. Consulte [API.md](./API.md) para integrar novas features

---

**Precisa de ajuda?** Verifique os logs do terminal para mensagens de erro e consulte [DESENVOLVIMENTO.md](./DESENVOLVIMENTO.md).
