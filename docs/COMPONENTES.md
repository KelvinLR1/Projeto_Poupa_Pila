# 🧩 Componentes React - Documentação

## Estrutura de Componentes

```
components/
├── layout/
│   └── Layout.jsx          # Container principal
└── ui/
    ├── Button.jsx
    ├── GlassCard.jsx
    ├── Badge.jsx
    ├── CustomSelect.jsx
    ├── CustomDatePicker.jsx
    ├── Modals (múltiplos)
    └── ...
```

---

## 📐 Layout

### `Layout.jsx`
Componente container principal que envolve toda a aplicação.

**Props**:
- `activeTab` - Aba ativa atual
- `setActiveTab` - Função para mudar aba
- `children` - Conteúdo principal

**Responsabilidades**:
- Menu lateral com navegação
- Header com informações do usuário
- Renderizar conteúdo principal

---

## 🎨 Componentes UI

### `Button.jsx`
Botão reutilizável com variações.

**Props**:
```jsx
<Button
  variant="primary"        // "primary", "secondary", "danger", "success"
  size="md"               // "sm", "md", "lg"
  onClick={handleClick}   // Função callback
  disabled={false}        // Desabilitar botão
  loading={false}         // Estado de carregamento
  children="Clique aqui"  // Texto do botão
/>
```

---

### `GlassCard.jsx`
Card com efeito glass-morphism.

**Props**:
```jsx
<GlassCard
  title="Título"
  icon={<IconComponent />}
  onClick={handleClick}
  children={<div>Conteúdo</div>}
/>
```

---

### `Badge.jsx`
Badge/etiqueta para status e categorias.

**Props**:
```jsx
<Badge
  text="Confirmado"
  type="success"  // "success", "warning", "danger", "info"
/>
```

---

### `CustomSelect.jsx`
Select customizado com opções.

**Props**:
```jsx
<CustomSelect
  label="Selecione uma conta"
  options={[
    { id: "1", label: "Conta 1" },
    { id: "2", label: "Conta 2" }
  ]}
  value={selectedId}
  onChange={handleChange}
  placeholder="Escolha..."
/>
```

---

### `CustomDatePicker.jsx`
Seletor de data customizado.

**Props**:
```jsx
<CustomDatePicker
  label="Data"
  value={date}
  onChange={handleDateChange}
  min="2024-01-01"
  max="2024-12-31"
/>
```

---

## 📋 Modais

### Modal Base
Todos os modais seguem um padrão comum:

```jsx
interface ModalProps {
  isOpen: boolean;           // Modal visível?
  onClose: () => void;       // Callback ao fechar
  title: string;             // Título do modal
  children: React.ReactNode; // Conteúdo
}
```

### Modais Disponíveis

#### `AccountEditModal.jsx`
Editar informações de conta.

```jsx
<AccountEditModal
  isOpen={isOpen}
  onClose={handleClose}
  account={account}
  onSave={handleSave}
/>
```

**Campos**:
- Nome da conta
- Tipo de conta
- Cor
- Status (ativo/inativo)

---

#### `TransactionFormDrawer.jsx`
Criar/editar transação (usa Drawer em vez de Modal).

```jsx
<TransactionFormDrawer
  isOpen={isOpen}
  onClose={handleClose}
  transaction={transaction}
  accounts={accounts}
  categories={categories}
  onSave={handleSave}
/>
```

**Campos**:
- Conta
- Tipo (receita/despesa)
- Valor
- Categoria
- Descrição
- Data
- Status

---

#### `LoanFormModal.jsx`
Criar novo empréstimo.

```jsx
<LoanFormModal
  isOpen={isOpen}
  onClose={handleClose}
  accounts={accounts}
  onSave={handleSave}
/>
```

**Campos**:
- Descrição
- Tipo
- Valor principal
- Taxa de juros
- Prazo
- Data de início
- Conta para pagamentos

---

#### `LoanDetailsModal.jsx`
Visualizar detalhes de empréstimo.

```jsx
<LoanDetailsModal
  isOpen={isOpen}
  onClose={handleClose}
  loan={loan}
/>
```

**Exibe**:
- Informações gerais
- Amortization schedule
- Saldo devedor
- Próxima parcela

---

#### `PaymentModal.jsx`
Registrar pagamento de empréstimo.

```jsx
<PaymentModal
  isOpen={isOpen}
  onClose={handleClose}
  loan={loan}
  onSave={handleSave}
/>
```

**Campos**:
- Valor
- Data
- Observações

---

#### `TransactionDetailsModal.jsx`
Visualizar detalhes de transação.

```jsx
<TransactionDetailsModal
  isOpen={isOpen}
  onClose={handleClose}
  transaction={transaction}
/>
```

---

#### `OFXLoanLinkModal.jsx`
Vincular pagamento OFX com empréstimo.

```jsx
<OFXLoanLinkModal
  isOpen={isOpen}
  onClose={handleClose}
  transaction={transaction}
  loans={loans}
  onLink={handleLink}
/>
```

---

#### `TransferModal.jsx`
Criar transferência entre contas.

```jsx
<TransferModal
  isOpen={isOpen}
  onClose={handleClose}
  accounts={accounts}
  onSave={handleSave}
/>
```

**Campos**:
- Conta de origem
- Conta de destino
- Valor
- Descrição
- Data

---

#### `SplitTransactionModal.jsx`
Dividir transação entre múltiplas categorias.

```jsx
<SplitTransactionModal
  isOpen={isOpen}
  onClose={handleClose}
  transaction={transaction}
  categories={categories}
  onSave={handleSave}
/>
```

---

#### `ReconcileSelectModal.jsx`
Selecionar transações para reconciliação.

```jsx
<ReconcileSelectModal
  isOpen={isOpen}
  onClose={handleClose}
  transactions={transactions}
  onReconcile={handleReconcile}
/>
```

---

#### `VaultEntryModal.jsx`
Criar/editar item do cofre.

```jsx
<VaultEntryModal
  isOpen={isOpen}
  onClose={handleClose}
  entry={entry}
  onSave={handleSave}
/>
```

**Campos**:
- Tipo
- Descrição
- Conteúdo
- Grupo

---

#### `VaultGroupModal.jsx`
Gerenciar grupos do cofre.

```jsx
<VaultGroupModal
  isOpen={isOpen}
  onClose={handleClose}
  onSave={handleSave}
/>
```

---

## 📄 Páginas (Pages)

### `Dashboard.jsx`
Página principal com overview financeiro.

**Props**:
```jsx
{
  setActiveTab,      // Função para mudar aba
  setFilterAccountId  // Função para filtrar por conta
}
```

**Componentes Internos**:
- Saldo total
- Resumo mensal
- Últimas transações
- Alertas
- Links rápidos

---

### `Transactions.jsx`
Página de gerenciamento de transações.

**Props**:
```jsx
{
  filterAccountId,       // ID da conta para filtrar
  setFilterAccountId     // Função para mudar filtro
}
```

**Funcionalidades**:
- Listar transações
- Filtrar por conta, data, categoria, tipo
- Criar/editar/deletar
- Importar OFX
- Transferências
- Reconciliação

---

### `Loans.jsx`
Página de gerenciamento de empréstimos.

**Funcionalidades**:
- Listar empréstimos
- Criar novo
- Editar
- Ver detalhes
- Registrar pagamento
- Amortization schedule

---

### `Accounts.jsx`
Página de gerenciamento de contas.

**Funcionalidades**:
- Listar contas
- Criar nova
- Editar
- Ativar/desativar
- Deletar
- Ver transações por conta

---

### `OFXImport.jsx`
Página de importação de extratos OFX.

**Funcionalidades**:
- Upload de arquivo OFX
- Preview das transações
- Vinculação com contas
- Detecção de duplicatas
- Importar

---

### `CashFlow.jsx`
Página de análise de fluxo de caixa.

**Funcionalidades**:
- Projeção de saldo futuro
- Gráfico de fluxo
- Transações recorrentes
- Alertas de período difícil

---

### `Analytics.jsx`
Página de gráficos e análises.

**Gráficos**:
- Distribuição de gastos (pie chart)
- Fluxo mensal (bar chart)
- Evolução de saldo (line chart)
- Categorias top (ranking)
- Comparativo mensal

**Filtros**:
- Período
- Conta
- Categoria

---

### `Vault.jsx`
Página do cofre de dados sensíveis.

**Funcionalidades**:
- Listar itens
- Criar novo
- Editar
- Deletar
- Agrupar por categoria
- Copiar para clipboard

---

### `Settings.jsx`
Página de configurações.

**Seções**:
- Perfil (nome, username, mudar senha)
- Categorias (criar, editar, deletar)
- Limites de orçamento
- Compartilhamento
- Preferências
- Dados (backup, restaurar)

---

### `Login.jsx`
Página de autenticação.

**Funcionalidades**:
- Login
- Registro de novo usuário
- Validação
- Mensagens de erro

---

## 🎨 Estilos

### `global.css`
Estilos globais da aplicação:
- Reset CSS
- Variáveis globais
- Tipografia base
- Animações comuns

### `tokens.css`
Design tokens:
- Cores
- Fontes
- Espaçamentos
- Sombras
- Breakpoints

**Exemplo**:
```css
:root {
  --primary: #3357FF;
  --success: #33FF57;
  --danger: #FF5733;
  --warning: #FFD700;
  
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
}
```

---

## 🔌 Context API

### `AuthContext.jsx`
Gerencia autenticação e dados do usuário.

**Estado**:
```jsx
{
  user,      // Dados do usuário { id, username, name }
  token,     // Token de autenticação
  loading,   // Estado de carregamento
  authError  // Erro de autenticação
}
```

**Funções**:
- `login(username, password)` - Fazer login
- `logout()` - Fazer logout
- `register(username, password, name)` - Registrar novo usuário

**Uso**:
```jsx
const { user, token, isAuthenticated, login, logout } = useAuth();
```

---

### `FinanceContext.jsx`
Gerencia dados financeiros.

**Estado**:
```jsx
{
  accounts,
  transactions,
  loans,
  categories,
  categoryLimits,
  hideValues
}
```

**Funções**:
- `addAccount(account)` - Criar conta
- `updateAccount(id, changes)` - Atualizar conta
- `deleteAccount(id)` - Deletar conta
- `addTransaction(transaction)` - Criar transação
- `updateTransaction(id, changes)` - Atualizar transação
- `deleteTransaction(id)` - Deletar transação
- `addLoan(loan)` - Criar empréstimo
- `updateLoan(id, changes)` - Atualizar empréstimo
- `paymentLoan(id, payment)` - Registrar pagamento
- E mais...

**Uso**:
```jsx
const { accounts, addTransaction } = useFinance();
```

---

### `VaultContext.jsx`
Gerencia dados do cofre.

**Estado**:
```jsx
{
  vaultEntries
}
```

**Funções**:
- `addEntry(entry)` - Adicionar item
- `updateEntry(id, changes)` - Atualizar item
- `deleteEntry(id)` - Deletar item
- `getEntry(id)` - Obter item

**Uso**:
```jsx
const { vaultEntries, addEntry } = useVault();
```

---

## 🛠️ Utilitários

### `formatters.js`
Funções de formatação:

```javascript
// Formatação de moeda
formatCurrency(1500.50)  // "R$ 1.500,50"

// Formatação de data
formatDate("2024-06-14")  // "14/06/2024"

// Formatação de percentual
formatPercent(25.5)  // "25,5%"

// Formatação de categoria
formatCategory("alimentacao")  // "Alimentação"
```

### `parseOFX.js`
Parser para arquivos OFX:

```javascript
// Ler arquivo OFX
parseOFXFile(file)  // Retorna array de transações

// Detecção de duplicatas
detectDuplicates(transactions, existingTransactions)
```

---

## 🎯 Padrões de Componente

### Componente Funcional com Hooks

```jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useFinance } from '../context/FinanceContext';

export function MyComponent({ prop1, prop2 }) {
  const { user } = useAuth();
  const { accounts } = useFinance();
  
  const [localState, setLocalState] = useState(initialValue);

  useEffect(() => {
    // Setup effect
    return () => {
      // Cleanup
    };
  }, [dependency]);

  const handleAction = () => {
    // Handler logic
  };

  return (
    <div className="component">
      {/* JSX */}
    </div>
  );
}
```

### Componente com Props Validation

```jsx
MyComponent.propTypes = {
  title: PropTypes.string.isRequired,
  items: PropTypes.arrayOf(PropTypes.object),
  onClick: PropTypes.func,
};

MyComponent.defaultProps = {
  items: [],
  onClick: () => {},
};
```

---

## 📦 Dependências Externas

### `lucide-react`
Ícones SVG:

```jsx
import { ChevronDown, Settings, LogOut } from 'lucide-react';

<Settings size={24} />
```

---

**Próximo**: Veja [DESENVOLVIMENTO.md](./DESENVOLVIMENTO.md) para guia de desenvolvimento.
