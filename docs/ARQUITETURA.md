# 🏗️ Arquitetura do Projeto

## 📐 Visão Geral

O Poupa Pila segue uma arquitetura **client-server** padrão com separação clara entre frontend e backend.

```
┌─────────────────────────────────────────────────┐
│           Navegador (Cliente)                   │
│  ┌───────────────────────────────────────────┐  │
│  │         React Application (Vite)          │  │
│  │  ┌─────────────────────────────────────┐  │  │
│  │  │  Pages (Dashboard, Transactions...)  │  │  │
│  │  └─────────────────────────────────────┘  │  │
│  │  ┌─────────────────────────────────────┐  │  │
│  │  │  Context API (Auth, Finance, Vault) │  │  │
│  │  └─────────────────────────────────────┘  │  │
│  │  ┌─────────────────────────────────────┐  │  │
│  │  │  Components (UI, Modals, Forms...)   │  │  │
│  │  └─────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────┘  │
└──────────────────┬──────────────────────────────┘
                   │ HTTP/HTTPS + Token
                   ↓
┌──────────────────────────────────────────────────┐
│         Servidor Node.js (Backend)               │
│  ┌──────────────────────────────────────────┐   │
│  │  Express.js Server (porta 3001)          │   │
│  │  ┌────────────────────────────────────┐  │   │
│  │  │  Middleware (CORS, Auth, JSON)     │  │   │
│  │  └────────────────────────────────────┘  │   │
│  │  ┌────────────────────────────────────┐  │   │
│  │  │  Rotas de API (/api/*)             │  │   │
│  │  │  • Autenticação                    │  │   │
│  │  │  • Contas                          │  │   │
│  │  │  │  • Transações                   │  │   │
│  │  │  │  • Empréstimos                  │  │   │
│  │  │  │  • Cofre                        │  │   │
│  │  │  │  • Categorias                   │  │   │
│  │  │  └────────────────────────────────┘  │   │
│  │  ┌────────────────────────────────────┐  │   │
│  │  │  Lógica de Negócio                 │  │   │
│  │  │  • Processamento de transações     │  │   │
│  │  │  • Cálculos financeiros            │  │   │
│  │  │  • Validações                      │  │   │
│  │  └────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────┐   │
│  │  SQLite Database                         │   │
│  │  └────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────┘   │
└──────────────────────────────────────────────────┘
```

---

## 🗂️ Estrutura de Diretórios

### Backend

```
backend/
├── server.js              # Arquivo principal com todas as rotas
├── db.js                  # Inicialização e schema do banco de dados
├── crypto.js              # Funções de criptografia e hash
├── seed_30_loans.js       # Script para popular dados de teste
├── poupa_pila.db          # Banco de dados SQLite (criado ao iniciar)
├── package.json           # Dependências
├── .env                   # Variáveis de ambiente (opcional)
└── node_modules/          # Dependências instaladas
```

### Frontend

```
frontend/
├── src/
│   ├── App.jsx                    # Componente raiz com navegação
│   ├── main.jsx                   # Entrada da aplicação
│   ├── index.html                 # HTML base
│   ├── context/                   # Context API
│   │   ├── AuthContext.jsx        # Autenticação e usuário
│   │   ├── FinanceContext.jsx     # Dados financeiros (contas, transações, empréstimos)
│   │   └── VaultContext.jsx       # Dados do cofre
│   ├── pages/                     # Páginas principais
│   │   ├── Dashboard/             # Dashboard principal
│   │   ├── Transactions/          # Listagem e gerenciamento de transações
│   │   ├── Loans/                 # Gerenciamento de empréstimos
│   │   ├── Accounts/              # Gerenciamento de contas
│   │   ├── OFXImport/             # Importação de extratos OFX
│   │   ├── CashFlow/              # Análise de fluxo de caixa
│   │   ├── Analytics/             # Gráficos e análises
│   │   ├── Vault/                 # Cofre de dados sensíveis
│   │   ├── Settings/              # Configurações
│   │   └── Login/                 # Tela de login
│   ├── components/                # Componentes reutilizáveis
│   │   ├── layout/                # Layout (header, menu, etc)
│   │   └── ui/                    # Componentes UI (botões, modais, cards, etc)
│   ├── utils/                     # Funções utilitárias
│   │   ├── formatters.js          # Formatação de valores, datas, etc
│   │   └── parseOFX.js            # Parser para arquivos OFX
│   ├── styles/                    # Estilos globais
│   │   ├── global.css             # Estilos gerais
│   │   └── tokens.css             # Variáveis CSS (cores, fontes, espaçamentos)
│   └── assets/                    # Imagens, ícones, etc
├── vite.config.js                 # Configuração do Vite
├── eslint.config.js               # Configuração do ESLint
├── package.json                   # Dependências
└── node_modules/                  # Dependências instaladas
```

---

## 🔄 Fluxo de Dados

### Ciclo de Requisição Autenticada

```
1. Usuário interage com UI (React)
   ↓
2. Componente chamada função do Context
   ↓
3. Context API faz fetch para backend
   ↓
4. Backend recebe requisição com token no header
   ↓
5. Middleware de autenticação valida token
   ↓
6. Rota processa requisição
   ↓
7. Interação com banco de dados (SQLite)
   ↓
8. Response retorna ao frontend
   ↓
9. Context API atualiza estado React
   ↓
10. Componentes são re-renderizados com novos dados
```

---

## 🔐 Fluxo de Autenticação

```
Login/Registro
    ↓
Usuário envia username + password
    ↓
Backend valida credenciais
    ↓
Se novo: cria usuário (password hasheado com bcrypt)
Se existente: compara hash
    ↓
Cria token JWT-like
    ↓
Retorna token ao frontend
    ↓
Frontend salva em localStorage
    ↓
Token incluído no header de todas requisições: Authorization: Bearer <token>
    ↓
Backend valida token em cada requisição
```

---

## 📡 Arquitetura da API

### Padrão de Requisições

```
GET    /api/section                    # Listar recursos
GET    /api/section/:id                # Obter um recurso
POST   /api/section                    # Criar recurso
PUT    /api/section/:id                # Atualizar recurso
DELETE /api/section/:id                # Deletar recurso
```

### Estrutura de Response

**Sucesso (200)**:
```json
{
  "id": "123",
  "name": "Exemplo",
  ...
}
```

**Erro (4xx/5xx)**:
```json
{
  "error": "Mensagem de erro descritiva"
}
```

---

## 🗄️ Camadas de Banco de Dados

### Tabelas Principais

| Tabela | Função |
|--------|--------|
| `users` | Usuários cadastrados |
| `sessions` | Sessões ativas |
| `accounts` | Contas bancárias |
| `transactions` | Transações |
| `loans` | Empréstimos |
| `categories` | Categorias de transações |
| `vault_entries` | Dados do cofre |
| `settlements` | Pagamentos de empréstimos |
| `user_access` | Acesso compartilhado entre usuários |

### Relações

```
users (1) ──→ (N) sessions
users (1) ──→ (N) accounts
users (1) ──→ (N) transactions
users (1) ──→ (N) loans
accounts (1) ──→ (N) transactions
transactions (1) ──→ (N) settlements
loans (1) ──→ (N) settlements
users (1) ──→ (N) vault_entries
users (1) ──→ (N) user_access
```

---

## 🎨 Camada de Apresentação

### Estado Global (Context API)

#### AuthContext
- `user` - Dados do usuário autenticado
- `token` - Token de autenticação
- `loading` - Estado de carregamento
- Funções: `login()`, `logout()`, `register()`

#### FinanceContext
- `accounts` - Lista de contas
- `transactions` - Lista de transações
- `loans` - Lista de empréstimos
- `categories` - Categorias disponíveis
- `categoryLimits` - Limites por categoria
- Funções: `addAccount()`, `updateTransaction()`, `addLoan()`, etc.

#### VaultContext
- `vaultEntries` - Dados armazenados no cofre
- Funções: `addEntry()`, `updateEntry()`, `deleteEntry()`

---

## 🔌 Componentes e Organização

### Páginas

Cada página é uma view completa com seu próprio estilo e lógica:
- `Dashboard` - Visão geral financeira
- `Transactions` - Gerenciamento de transações
- `Loans` - Gerenciamento de empréstimos
- `Accounts` - Gerenciamento de contas
- `OFXImport` - Importação de extratos
- `CashFlow` - Projeção de fluxo de caixa
- `Analytics` - Gráficos e relatórios
- `Vault` - Armazenamento seguro
- `Settings` - Configurações
- `Login` - Autenticação

### Componentes Reutilizáveis

#### Layout
- `Layout` - Container principal com menu lateral

#### UI
- `Button` - Botões estilizados
- `GlassCard` - Cartão com efeito glass-morphism
- `Badge` - Badges de status
- `CustomSelect` - Select customizado
- `CustomDatePicker` - Seletor de data
- `Modal` - Modais (genéricos e específicos)
  - `AccountEditModal`
  - `LoanDetailsModal`
  - `LoanFormModal`
  - `PaymentModal`
  - `TransactionDetailsModal`
  - `TransactionFormDrawer`
  - E mais...

---

## 🔄 Fluxo de Atualização de Dados

```
Backend faz mudança no BD
    ↓
Retorna dados atualizados
    ↓
Frontend recebe response
    ↓
Context atualiza estado (useState)
    ↓
React detecta mudança
    ↓
Componentes inscritos no Context recebem novos dados
    ↓
Components re-renderizam
    ↓
UI atualiza
```

---

## 🔐 Segurança

### Autenticação
- Token armazenado em `localStorage`
- Token validado em cada requisição

### Autorização
- Middleware verifica permissões por usuário
- Acesso compartilhado com permissões (read-only, read-write)

### Dados Sensíveis
- Senhas hasheadas com bcrypt
- Cofre para dados sensíveis
- CORS configurado

---

## 📊 Padrões de Projeto

### Context API
Usado para estado global (autenticação e dados financeiros)

### Composition
Componentes menores reutilizáveis em componentes maiores

### Unidirectional Data Flow
Dados fluem de forma previsível através da hierarquia de componentes

### RESTful API
Padrão REST para comunicação client-server

---

## ⚡ Performance

### Frontend
- Lazy loading de componentes
- Otimização de re-renders via Context
- Build otimizado com Vite

### Backend
- Queries eficientes com SQLite
- Validações rápidas
- Respostas em JSON

---

## 🚀 Escalabilidade

Para escalar a aplicação:

1. **Backend**: Migrar para PostgreSQL
2. **Frontend**: Implementar code-splitting
3. **Autenticação**: Usar OAuth2/SSO
4. **Cache**: Adicionar Redis
5. **Mensageria**: Implementar WebSockets para real-time

---

**Próximo**: Veja [API.md](./API.md) para documentação de endpoints.
