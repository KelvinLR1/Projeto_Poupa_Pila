# 📡 API REST - Documentação Completa

## Base URL

```
http://localhost:3001
```

## Autenticação

Todos os endpoints (exceto login/registro) requerem token:

```
Authorization: Bearer <token>
```

---

## 🔐 Autenticação

### POST `/api/auth/login`
Login ou registro de novo usuário.

**Request**:
```json
{
  "username": "joao_silva",
  "password": "senha123",
  "confirmRegister": false  // true para registrar novo usuário
}
```

**Response (200)**:
```json
{
  "token": "abc123def456...",
  "user": {
    "id": 1,
    "username": "joao_silva",
    "name": "João Silva"
  }
}
```

**Errors**:
- `400` - Usuário/senha obrigatórios
- `401` - Usuário/senha incorretos
- `409` - Usuário já existe (ao registrar)

---

### GET `/api/auth/me`
Validar token e obter dados do usuário atual.

**Response (200)**:
```json
{
  "user": {
    "id": 1,
    "username": "joao_silva",
    "name": "João Silva"
  }
}
```

**Errors**:
- `401` - Token não fornecido ou inválido
- `401` - Sessão expirada

---

### POST `/api/auth/logout`
Encerrar sessão.

**Response (200)**:
```json
{
  "message": "Logout realizado com sucesso"
}
```

---

## 💼 Dados Financeiros

### GET `/api/finance/data`
Obter todos os dados financeiros do usuário (one-shot).

**Response (200)**:
```json
{
  "accounts": [...],
  "transactions": [...],
  "loans": [...],
  "categories": [...],
  "categoryLimits": [...]
}
```

---

## 💰 Contas (Accounts)

### GET `/api/accounts`
Listar todas as contas do usuário.

**Response (200)**:
```json
[
  {
    "id": "acc_xyz123",
    "name": "Conta Corrente",
    "type": "Corrente",
    "balance": 5000.50,
    "color": "#FF5733",
    "active": 1
  },
  {
    "id": "acc_xyz456",
    "name": "Poupança",
    "type": "Poupança",
    "balance": 10000.00,
    "color": "#33FF57",
    "active": 1
  }
]
```

---

### GET `/api/accounts/:id`
Obter detalhes de uma conta específica.

**Response (200)**:
```json
{
  "id": "acc_xyz123",
  "name": "Conta Corrente",
  "type": "Corrente",
  "balance": 5000.50,
  "color": "#FF5733",
  "active": 1,
  "transactionCount": 42
}
```

---

### POST `/api/accounts`
Criar nova conta.

**Request**:
```json
{
  "id": "acc_xyz123",
  "name": "Nova Conta",
  "type": "Corrente",
  "balance": 1000.00,
  "color": "#FF5733"
}
```

**Response (201)**:
```json
{
  "id": "acc_xyz123",
  "name": "Nova Conta",
  "type": "Corrente",
  "balance": 1000.00,
  "color": "#FF5733",
  "active": 1
}
```

---

### PUT `/api/accounts/:id`
Atualizar conta existente.

**Request**:
```json
{
  "name": "Conta Atualizada",
  "type": "Poupança",
  "color": "#33FF57",
  "active": 1
}
```

**Response (200)**:
```json
{
  "id": "acc_xyz123",
  "name": "Conta Atualizada",
  ...
}
```

---

### DELETE `/api/accounts/:id`
Deletar conta.

**Response (200)**:
```json
{
  "message": "Conta deletada com sucesso"
}
```

**Errors**:
- `400` - Conta não pode ser deletada se tem saldo

---

## 📝 Transações (Transactions)

### GET `/api/transactions`
Listar transações com filtros opcionais.

**Query Params**:
- `accountId` - Filtrar por conta
- `startDate` - Data inicial (YYYY-MM-DD)
- `endDate` - Data final (YYYY-MM-DD)
- `category` - Filtrar por categoria
- `type` - "income" ou "expense"
- `status` - "pending", "confirmed", "canceled"

**Response (200)**:
```json
[
  {
    "id": "tx_abc123",
    "accountId": "acc_xyz123",
    "type": "expense",
    "amount": 150.00,
    "category": "Alimentação",
    "description": "Mercado XYZ",
    "date": "2024-06-14",
    "status": "confirmed"
  }
]
```

---

### GET `/api/transactions/:id`
Obter detalhes de uma transação.

**Response (200)**:
```json
{
  "id": "tx_abc123",
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

### POST `/api/transactions`
Criar nova transação.

**Request**:
```json
{
  "id": "tx_xyz789",
  "accountId": "acc_xyz123",
  "type": "expense",
  "amount": 150.00,
  "category": "Alimentação",
  "description": "Mercado XYZ",
  "date": "2024-06-14",
  "status": "confirmed"
}
```

**Response (201)**:
```json
{
  "id": "tx_xyz789",
  "accountId": "acc_xyz123",
  ...
}
```

---

### PUT `/api/transactions/:id`
Atualizar transação.

**Request**:
```json
{
  "amount": 200.00,
  "category": "Compras",
  "status": "pending"
}
```

**Response (200)**:
```json
{
  "id": "tx_abc123",
  ...
}
```

---

### DELETE `/api/transactions/:id`
Deletar transação.

**Response (200)**:
```json
{
  "message": "Transação deletada com sucesso"
}
```

---

### POST `/api/transactions/transfer`
Criar transferência entre contas.

**Request**:
```json
{
  "amount": 500.00,
  "fromAccountId": "acc_xyz123",
  "toAccountId": "acc_xyz456",
  "description": "Transferência",
  "date": "2024-06-14"
}
```

**Response (201)**:
```json
{
  "transferId": "tr_abc123",
  "transactions": [
    { "id": "tx_123", "accountId": "acc_xyz123", "type": "expense", ... },
    { "id": "tx_456", "accountId": "acc_xyz456", "type": "income", ... }
  ]
}
```

---

### POST `/api/transactions/import-ofx`
Importar transações de arquivo OFX.

**Request** (multipart/form-data):
```
Content-Type: multipart/form-data

file: <arquivo.ofx>
accountId: acc_xyz123 (opcional, para linkar automaticamente)
```

**Response (200)**:
```json
{
  "imported": 15,
  "duplicates": 2,
  "transactions": [
    { "id": "tx_ofx_1", ... }
  ]
}
```

---

## 🏦 Empréstimos (Loans)

### GET `/api/loans`
Listar todos os empréstimos.

**Response (200)**:
```json
[
  {
    "id": "ln_xyz789",
    "description": "Empréstimo Pessoal",
    "type": "Pessoal",
    "principal": 10000.00,
    "interest_rate": 2.5,
    "term_months": 24,
    "start_date": "2024-01-15",
    "status": "active",
    "account_id": "acc_xyz123"
  }
]
```

---

### GET `/api/loans/:id`
Obter detalhes de um empréstimo.

**Response (200)**:
```json
{
  "id": "ln_xyz789",
  "description": "Empréstimo Pessoal",
  "principal": 10000.00,
  "interest_rate": 2.5,
  "term_months": 24,
  "start_date": "2024-01-15",
  "status": "active",
  "balance": 8500.00,
  "paid": 1500.00,
  "next_payment": {
    "date": "2024-07-15",
    "amount": 435.50
  },
  "amortization_schedule": [
    { "month": 1, "payment": 435.50, "interest": 250.00, "principal": 185.50, "balance": 9814.50 },
    { "month": 2, "payment": 435.50, "interest": 245.36, "principal": 190.14, "balance": 9624.36 }
  ]
}
```

---

### POST `/api/loans`
Criar novo empréstimo.

**Request**:
```json
{
  "id": "ln_abc123",
  "description": "Empréstimo Pessoal",
  "type": "Pessoal",
  "principal": 10000.00,
  "interest_rate": 2.5,
  "term_months": 24,
  "start_date": "2024-01-15",
  "status": "active",
  "account_id": "acc_xyz123"
}
```

**Response (201)**:
```json
{
  "id": "ln_abc123",
  ...
}
```

---

### PUT `/api/loans/:id`
Atualizar empréstimo.

**Request**:
```json
{
  "status": "canceled",
  "description": "Empréstimo Atualizado"
}
```

**Response (200)**:
```json
{
  "id": "ln_xyz789",
  ...
}
```

---

### DELETE `/api/loans/:id`
Deletar empréstimo.

**Response (200)**:
```json
{
  "message": "Empréstimo deletado com sucesso"
}
```

---

### POST `/api/loans/:id/payment`
Registrar pagamento de empréstimo.

**Request**:
```json
{
  "amount": 435.50,
  "date": "2024-06-14"
}
```

**Response (200)**:
```json
{
  "payment_id": "sp_xyz123",
  "loan_id": "ln_xyz789",
  "amount": 435.50,
  "new_balance": 8064.50,
  "transaction": {
    "id": "tx_payment_123",
    "accountId": "acc_xyz123",
    "type": "expense",
    "amount": 435.50,
    "category": "Empréstimos"
  }
}
```

---

## 🏷️ Categorias (Categories)

### GET `/api/categories`
Listar categorias disponíveis.

**Response (200)**:
```json
[
  {
    "id": "cat_1",
    "name": "Alimentação",
    "color": "#FF5733"
  },
  {
    "id": "cat_2",
    "name": "Transporte",
    "color": "#33FF57"
  }
]
```

---

### POST `/api/categories`
Criar nova categoria.

**Request**:
```json
{
  "id": "cat_custom_1",
  "name": "Minha Categoria",
  "color": "#3357FF"
}
```

**Response (201)**:
```json
{
  "id": "cat_custom_1",
  "name": "Minha Categoria",
  "color": "#3357FF"
}
```

---

### PUT `/api/categories/:id`
Atualizar categoria.

**Request**:
```json
{
  "name": "Categoria Atualizada",
  "color": "#FF33A1"
}
```

**Response (200)**:
```json
{
  "id": "cat_1",
  ...
}
```

---

### DELETE `/api/categories/:id`
Deletar categoria.

**Response (200)**:
```json
{
  "message": "Categoria deletada com sucesso"
}
```

---

## 🔐 Cofre (Vault)

### GET `/api/vault`
Listar itens do cofre.

**Response (200)**:
```json
[
  {
    "id": "vault_1",
    "type": "password",
    "description": "Gmail",
    "group_name": "Emails",
    "created_at": "2024-06-14"
  }
]
```

---

### GET `/api/vault/:id`
Obter detalhes de item do cofre (descriptografado).

**Response (200)**:
```json
{
  "id": "vault_1",
  "type": "password",
  "description": "Gmail",
  "content": "minha_senha_secreta",
  "group_name": "Emails",
  "created_at": "2024-06-14"
}
```

---

### POST `/api/vault`
Adicionar item ao cofre.

**Request**:
```json
{
  "id": "vault_new_1",
  "type": "password",
  "description": "GitHub",
  "content": "minha_senha_github",
  "group_name": "Desenvolvimento"
}
```

**Response (201)**:
```json
{
  "id": "vault_new_1",
  "type": "password",
  "description": "GitHub",
  "group_name": "Desenvolvimento",
  "created_at": "2024-06-14"
}
```

---

### PUT `/api/vault/:id`
Atualizar item do cofre.

**Request**:
```json
{
  "content": "nova_senha",
  "description": "GitHub (atualizado)"
}
```

**Response (200)**:
```json
{
  "id": "vault_1",
  ...
}
```

---

### DELETE `/api/vault/:id`
Deletar item do cofre.

**Response (200)**:
```json
{
  "message": "Item deletado com sucesso"
}
```

---

## 👥 Acesso Compartilhado

### GET `/api/user-access`
Listar acessos compartilhados.

**Response (200)**:
```json
[
  {
    "id": "access_1",
    "target_username": "maria_silva",
    "permissions": "read_write",
    "created_at": "2024-06-14"
  }
]
```

---

### POST `/api/user-access`
Compartilhar acesso com outro usuário.

**Request**:
```json
{
  "target_username": "maria_silva",
  "permissions": "read_write"
}
```

**Response (201)**:
```json
{
  "id": "access_1",
  "target_username": "maria_silva",
  "permissions": "read_write",
  "created_at": "2024-06-14"
}
```

---

### DELETE `/api/user-access/:id`
Revogar acesso compartilhado.

**Response (200)**:
```json
{
  "message": "Acesso revogado com sucesso"
}
```

---

## ⚠️ Status de Erro

### Códigos HTTP

| Código | Significado |
|--------|-------------|
| `200` | OK - Sucesso |
| `201` | Created - Recurso criado |
| `400` | Bad Request - Dados inválidos |
| `401` | Unauthorized - Autenticação necessária |
| `403` | Forbidden - Acesso negado/permissão insuficiente |
| `404` | Not Found - Recurso não encontrado |
| `409` | Conflict - Conflito (ex: usuário já existe) |
| `500` | Internal Server Error - Erro no servidor |

### Formato de Erro

```json
{
  "error": "Mensagem de erro descritiva"
}
```

---

## 🔗 Exemplos com curl

### Login

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "joao_silva",
    "password": "senha123",
    "confirmRegister": false
  }'
```

### Listar Contas

```bash
curl -X GET http://localhost:3001/api/accounts \
  -H "Authorization: Bearer abc123def456..."
```

### Criar Transação

```bash
curl -X POST http://localhost:3001/api/transactions \
  -H "Authorization: Bearer abc123def456..." \
  -H "Content-Type: application/json" \
  -d '{
    "id": "tx_xyz123",
    "accountId": "acc_xyz123",
    "type": "expense",
    "amount": 150.00,
    "category": "Alimentação",
    "description": "Mercado",
    "date": "2024-06-14",
    "status": "confirmed"
  }'
```

---

**Próximo**: Veja [COMPONENTES.md](./COMPONENTES.md) para documentação dos componentes React.
