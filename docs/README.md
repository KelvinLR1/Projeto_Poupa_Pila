# Poupa Pila - Documentação Completa

## 📋 Visão Geral do Projeto

**Poupa Pila** é uma aplicação completa de gerenciamento financeiro pessoal que permite aos usuários controlar suas contas, transações, empréstimos, importação de extratos bancários (OFX) e muito mais.

A aplicação é construída com uma arquitetura moderna **client-server** com:
- **Frontend**: React + Vite (interface responsiva e moderna)
- **Backend**: Node.js + Express + SQLite (API RESTful)
- **Autenticação**: Baseada em tokens (JWT-like)
- **Banco de Dados**: SQLite com suporte a múltiplos usuários

---

## 📚 Documentação

1. **[SETUP.md](./SETUP.md)** - Como configurar e executar o projeto
2. **[ARQUITETURA.md](./ARQUITETURA.md)** - Estrutura geral da aplicação
3. **[FUNCIONALIDADES.md](./FUNCIONALIDADES.md)** - Features principais e descrições
4. **[BANCO_DE_DADOS.md](./BANCO_DE_DADOS.md)** - Schema e estrutura de dados
5. **[API.md](./API.md)** - Documentação completa dos endpoints
6. **[COMPONENTES.md](./COMPONENTES.md)** - Componentes React e estrutura frontend
7. **[DESENVOLVIMENTO.md](./DESENVOLVIMENTO.md)** - Guia para desenvolvedores

---

## 🚀 Quick Start

### Backend
```bash
cd backend
npm install
npm start
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

A aplicação estará disponível em `http://localhost:5173` com o backend em `http://localhost:3001`

---

## 🎯 Principais Características

✅ **Gerenciamento de Contas** - Criar e gerenciar múltiplas contas bancárias
✅ **Transações** - Registrar despesas e receitas com categorias
✅ **Empréstimos** - Controlar empréstimos e amortizações
✅ **Importação OFX** - Importar extratos bancários diretos
✅ **Análise Financeira** - Visualizar gráficos e relatórios
✅ **Cofre (Vault)** - Guardar dados sensíveis com segurança
✅ **Acesso Compartilhado** - Compartilhar contas com outro usuários
✅ **Fluxo de Caixa** - Visualizar fluxo de caixa futuro

---

## 👤 Autenticação

O sistema utiliza autenticação baseada em **tokens**:
- Usuários fazem login com username e password
- Recebem um token que valida nas requisições subsequentes
- Token armazenado no `localStorage` do navegador

---

## 💾 Banco de Dados

SQLite local com as seguintes tabelas principais:
- `users` - Usuários cadastrados
- `sessions` - Sessões ativas
- `accounts` - Contas bancárias
- `transactions` - Transações
- `loans` - Empréstimos
- `categories` - Categorias de transações
- `vault_entries` - Dados do cofre
- E mais... (veja [BANCO_DE_DADOS.md](./BANCO_DE_DADOS.md))

---

## 📁 Estrutura do Projeto

```
Projeto_Poupa_Pila/
├── backend/                 # Servidor Node.js
│   ├── server.js           # Arquivo principal
│   ├── db.js               # Configuração banco de dados
│   ├── crypto.js           # Utilitários de criptografia
│   ├── seed_30_loans.js    # Script para popular dados teste
│   └── package.json        # Dependências
├── frontend/               # Aplicação React
│   ├── src/
│   │   ├── App.jsx         # Componente principal
│   │   ├── context/        # Context API (Auth, Finance, Vault)
│   │   ├── pages/          # Páginas principais
│   │   ├── components/     # Componentes reutilizáveis
│   │   ├── utils/          # Funções utilitárias
│   │   └── styles/         # Estilos CSS
│   ├── vite.config.js      # Configuração Vite
│   └── package.json        # Dependências
└── docs/                   # Documentação (este arquivo)
```

---

## 🔐 Segurança

- Senhas são **hasheadas** com bcrypt
- Tokens armazenados de forma segura
- Permissões verificadas em cada requisição
- Suporte a acesso compartilhado com permissões (read-only ou read-write)
- Foreign keys habilitadas no banco de dados

---

## 🛠️ Tecnologias Utilizadas

### Backend
- **Express.js** - Framework web
- **SQLite** - Banco de dados
- **dotenv** - Variáveis de ambiente
- **CORS** - Controle de requisições cross-origin

### Frontend
- **React 19** - Biblioteca UI
- **Vite** - Build tool
- **Lucide React** - Ícones
- **CSS3** - Estilos nativos

---

## 📞 Suporte

Para dúvidas sobre o desenvolvimento, consulte:
- [DESENVOLVIMENTO.md](./DESENVOLVIMENTO.md) - Guia de desenvolvimento
- [API.md](./API.md) - Referência de endpoints
- [BANCO_DE_DADOS.md](./BANCO_DE_DADOS.md) - Schema de dados

---

**Última atualização**: Junho 2024
