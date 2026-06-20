# 🗄️ Banco de Dados - Schema e Estrutura

## Visão Geral

O Poupa Pila utiliza **SQLite** como banco de dados local. O arquivo é armazenado em `backend/poupa_pila.db` e é criado automaticamente na primeira execução.

---

## 📋 Tabelas

### 1. `users`
Armazena informações dos usuários cadastrados.

```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL
);
```

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | INTEGER | Identificador único (auto-incrementado) |
| `username` | TEXT | Nome de usuário único |
| `password_hash` | TEXT | Hash bcrypt da senha |
| `name` | TEXT | Nome completo do usuário |

**Exemplo**:
```json
{
  "id": 1,
  "username": "joao_silva",
  "password_hash": "$2b$10$...",
  "name": "João Silva"
}
```

---

### 2. `sessions`
Armazena sessões ativas de autenticação.

```sql
CREATE TABLE sessions (
  token TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);
```

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `token` | TEXT | Token de autenticação (chave primária) |
| `user_id` | INTEGER | Referência ao usuário |
| `expires_at` | INTEGER | Timestamp quando a sessão expira |

**Exemplo**:
```json
{
  "token": "abc123def456...",
  "user_id": 1,
  "expires_at": 1718462400000
}
```

---

### 3. `accounts`
Armazena contas bancárias dos usuários.

```sql
CREATE TABLE accounts (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  balance REAL NOT NULL,
  color TEXT NOT NULL,
  active INTEGER DEFAULT 1,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);
```

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | TEXT | ID único (gerado aleatoriamente no frontend) |
| `user_id` | INTEGER | Proprietário da conta |
| `name` | TEXT | Nome da conta (ex: "Bradesco Corrente") |
| `type` | TEXT | Tipo (Corrente, Poupança, Cartão, etc) |
| `balance` | REAL | Saldo atual |
| `color` | TEXT | Cor para UI (hex ou nome) |
| `active` | INTEGER | 1 = ativa, 0 = inativa |

**Exemplo**:
```json
{
  "id": "acc_xyz123",
  "user_id": 1,
  "name": "Conta Corrente",
  "type": "Corrente",
  "balance": 5000.50,
  "color": "#FF5733",
  "active": 1
}
```

---

### 4. `transactions`
Armazena todas as transações (receitas e despesas).

```sql
CREATE TABLE transactions (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  accountId TEXT NOT NULL,
  type TEXT NOT NULL,
  amount REAL NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  date TEXT NOT NULL,
  status TEXT NOT NULL,
  is_forecast INTEGER DEFAULT 0,
  transfer_id TEXT,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  FOREIGN KEY (accountId) REFERENCES accounts (id) ON DELETE CASCADE
);
```

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | TEXT | ID único |
| `user_id` | INTEGER | Proprietário |
| `accountId` | TEXT | Conta afetada |
| `type` | TEXT | "income" ou "expense" |
| `amount` | REAL | Valor (positivo) |
| `category` | TEXT | Categoria da transação |
| `description` | TEXT | Descrição/detalhes |
| `date` | TEXT | Data ISO (YYYY-MM-DD) |
| `status` | TEXT | "pending", "confirmed", "canceled" |
| `is_forecast` | INTEGER | 1 = previsão, 0 = realizada |
| `transfer_id` | TEXT | ID se for transferência entre contas |

**Exemplo**:
```json
{
  "id": "tx_abc123",
  "user_id": 1,
  "accountId": "acc_xyz123",
  "type": "expense",
  "amount": 150.00,
  "category": "Alimentação",
  "description": "Mercado XYZ",
  "date": "2024-06-14",
  "status": "confirmed",
  "is_forecast": 0,
  "transfer_id": null
}
```

---

### 5. `loans`
Armazena informações de empréstimos.

```sql
CREATE TABLE loans (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  description TEXT NOT NULL,
  type TEXT NOT NULL,
  principal REAL NOT NULL,
  interest_rate REAL NOT NULL,
  term_months INTEGER NOT NULL,
  start_date TEXT NOT NULL,
  status TEXT NOT NULL,
  account_id TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  FOREIGN KEY (account_id) REFERENCES accounts (id) ON DELETE CASCADE
);
```

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | TEXT | ID único |
| `user_id` | INTEGER | Proprietário |
| `description` | TEXT | Descrição do empréstimo |
| `type` | TEXT | Tipo (Pessoal, Veicular, Imobiliário) |
| `principal` | REAL | Valor original |
| `interest_rate` | REAL | Taxa mensal (%) |
| `term_months` | INTEGER | Duração em meses |
| `start_date` | TEXT | Data de início (ISO) |
| `status` | TEXT | "active", "paid", "canceled" |
| `account_id` | TEXT | Conta para pagamentos |

**Exemplo**:
```json
{
  "id": "ln_xyz789",
  "user_id": 1,
  "description": "Empréstimo Pessoal Banco X",
  "type": "Pessoal",
  "principal": 10000.00,
  "interest_rate": 2.5,
  "term_months": 24,
  "start_date": "2024-01-15",
  "status": "active",
  "account_id": "acc_xyz123"
}
```

---

### 6. `settlements`
Armazena pagamentos/amortizações de empréstimos.

```sql
CREATE TABLE settlements (
  id TEXT PRIMARY KEY,
  transaction_id TEXT NOT NULL,
  date TEXT NOT NULL,
  amount REAL NOT NULL,
  accountId TEXT NOT NULL,
  FOREIGN KEY (transaction_id) REFERENCES transactions (id) ON DELETE CASCADE
);
```

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | TEXT | ID único |
| `transaction_id` | TEXT | Referência à transação |
| `date` | TEXT | Data do pagamento (ISO) |
| `amount` | REAL | Valor pago |
| `accountId` | TEXT | Conta debitada |

---

### 7. `categories`
Armazena categorias disponíveis para transações.

```sql
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  color TEXT,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);
```

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | TEXT | ID único |
| `user_id` | INTEGER | Proprietário |
| `name` | TEXT | Nome da categoria |
| `color` | TEXT | Cor para UI |

**Categorias Padrão**:
- Alimentação
- Transporte
- Saúde
- Educação
- Diversão
- Conta e Serviços
- Compras
- Salário (receita)
- Investimento

---

### 8. `category_limits`
Armazena limites de orçamento por categoria.

```sql
CREATE TABLE IF NOT EXISTS category_limits (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  category TEXT NOT NULL,
  limit_amount REAL NOT NULL,
  period TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);
```

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | TEXT | ID único |
| `user_id` | INTEGER | Proprietário |
| `category` | TEXT | Nome da categoria |
| `limit_amount` | REAL | Limite de gasto |
| `period` | TEXT | "monthly", "quarterly", "yearly" |

---

### 9. `vault_entries`
Armazena dados sensíveis no cofre (criptografados).

```sql
CREATE TABLE IF NOT EXISTS vault_entries (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  type TEXT NOT NULL,
  description TEXT NOT NULL,
  content TEXT NOT NULL,
  group_name TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);
```

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | TEXT | ID único |
| `user_id` | INTEGER | Proprietário |
| `type` | TEXT | "password", "document", "card", "note" |
| `description` | TEXT | Descrição do item |
| `content` | TEXT | Dados criptografados |
| `group_name` | TEXT | Grupo/categoria |
| `created_at` | TEXT | Data de criação |

---

### 10. `user_access`
Armazena compartilhamento de acesso entre usuários.

```sql
CREATE TABLE IF NOT EXISTS user_access (
  id TEXT PRIMARY KEY,
  owner_id INTEGER NOT NULL,
  target_username TEXT NOT NULL,
  permissions TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (owner_id) REFERENCES users (id) ON DELETE CASCADE
);
```

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | TEXT | ID único |
| `owner_id` | INTEGER | Dono da conta |
| `target_username` | TEXT | Username do usuário convidado |
| `permissions` | TEXT | "read_only" ou "read_write" |
| `created_at` | TEXT | Data de compartilhamento |

---

## 🔗 Relacionamentos

```
users (1) ──→ (N) sessions
users (1) ──→ (N) accounts
users (1) ──→ (N) transactions
users (1) ──→ (N) loans
users (1) ──→ (N) categories
users (1) ──→ (N) category_limits
users (1) ──→ (N) vault_entries
users (1) ──→ (N) user_access

accounts (1) ──→ (N) transactions
accounts (1) ──→ (N) loans
accounts (1) ──→ (N) settlements

transactions (1) ──→ (N) settlements

loans (1) ──→ (N) settlements
```

---

## 🔐 Constraints

### Foreign Keys
- Todas as chaves estrangeiras têm `ON DELETE CASCADE`
- Exemplo: Deletar um usuário deleta todas suas transações

### Unique Constraints
- `users.username` - Único por usuário

### Primary Keys
- Todas as tabelas têm chave primária (texto ou auto-increment)

---

## 🏗️ Scripts de Inicialização

### Criar Tabelas
Executadas automaticamente em `db.js`:

```javascript
db.exec(`CREATE TABLE IF NOT EXISTS users (...)`);
db.exec(`CREATE TABLE IF NOT EXISTS sessions (...)`);
// etc...
```

### Adicionar Coluna (Migration)
```javascript
try {
  db.exec('ALTER TABLE transactions ADD COLUMN is_forecast INTEGER DEFAULT 0');
} catch (e) {
  // Column already exists, safe to ignore
}
```

---

## 📊 Seed Data

Execute `seed_30_loans.js` para popular dados de teste:

```bash
cd backend
node seed_30_loans.js
```

Cria:
- 1 usuário de teste
- 3 contas
- Múltiplas transações
- 30 empréstimos com diferentes taxas e prazos

---

## 🔍 Queries Úteis

### Saldo Total por Usuário
```sql
SELECT user_id, SUM(balance) as total_balance
FROM accounts
WHERE active = 1
GROUP BY user_id;
```

### Despesas do Mês
```sql
SELECT category, SUM(amount) as total
FROM transactions
WHERE user_id = ? AND type = 'expense' 
  AND strftime('%Y-%m', date) = '2024-06'
GROUP BY category;
```

### Empréstimos Ativos
```sql
SELECT *
FROM loans
WHERE user_id = ? AND status = 'active';
```

### Transações Pendentes
```sql
SELECT *
FROM transactions
WHERE user_id = ? AND status = 'pending'
ORDER BY date DESC;
```

---

## 📈 Performance

### Índices Recomendados
Para otimizar queries (não implementado atualmente):

```sql
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_date ON transactions(date);
CREATE INDEX idx_accounts_user_id ON accounts(user_id);
CREATE INDEX idx_loans_user_id ON loans(user_id);
```

---

## 🔄 Backup e Restauração

### Backup
```bash
# Copiar arquivo de banco
cp backend/poupa_pila.db backup_$(date +%Y%m%d).db
```

### Restauração
```bash
cp backup_20240614.db backend/poupa_pila.db
```

---

**Próximo**: Veja [API.md](./API.md) para documentação dos endpoints.
