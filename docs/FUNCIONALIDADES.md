# ✨ Funcionalidades Principais

## 📊 Dashboard

**Local**: Página principal após login

### O que você vê
- **Saldo Total** - Soma de todos as contas
- **Últimas Transações** - 5 últimas movimentações
- **Resumo Mensal** - Gastos e receitas do mês
- **Alertas** - Categorias acima do limite
- **Links rápidos** - Acesso às principais seções

### Ações disponíveis
- Ver todas as transações
- Criar nova transação
- Editar conta
- Visualizar detalhes de empréstimos

---

## 💰 Contas (Accounts)

**Local**: Menu lateral → Contas

### Criar Conta
1. Clique em "Nova Conta"
2. Preencha:
   - **Nome** - Ex: "Conta Corrente Bradesco"
   - **Tipo** - Corrente, Poupança, Cartão, etc
   - **Saldo Inicial** - Valor inicial da conta
   - **Cor** - Para identificação visual
3. Clique em "Criar"

### Gerenciar Contas
- **Editar** - Mudar nome, tipo, cor
- **Deletar** - Remover conta (com confirmação)
- **Ativar/Desativar** - Ocultar conta temporariamente
- **Ver transações** - Filtrar por conta específica

### Informações Exibidas
- Saldo atual
- Tipo de conta
- Data de criação
- Número de transações

---

## 📝 Transações (Transactions)

**Local**: Menu lateral → Transações

### Criar Transação
1. Clique em "Nova Transação"
2. Preencha:
   - **Conta** - Qual conta será afetada
   - **Tipo** - Despesa ou Receita
   - **Valor** - Montante
   - **Categoria** - Alimentação, Transporte, Salário, etc
   - **Descrição** - Detalhes (ex: "Mercado XYZ")
   - **Data** - Quando ocorreu
   - **Status** - Pendente, Confirmado, etc
3. Clique em "Salvar"

### Gerenciar Transações
- **Listar** - Ver todas com filtros
- **Filtrar por**:
  - Conta específica
  - Período (data inicial/final)
  - Categoria
  - Tipo (receita/despesa)
  - Status
- **Editar** - Modificar transação existente
- **Deletar** - Remover transação
- **Detalhar** - Ver informações completas

### Funcionalidades Especiais

#### Importação OFX
- Importar extratos bancários (formato OFX)
- Sistema tenta linkar automaticamente com contas
- Possibilidade de vincular manualmente
- Detecta e avisa sobre transações duplicadas

#### Transferências
- Transferir entre suas próprias contas
- Registro automático em ambas contas
- Mantém rastreamento com ID de transferência

#### Reconciliação
- Marcar transações como reconciliadas
- Identificar discrepâncias
- Visualizar transações reconciliadas

#### Divisão de Despesas
- Dividir uma transação entre múltiplas categorias
- Percentual ou valor fixo
- Útil para despesas mistas

---

## 🏦 Empréstimos (Loans)

**Local**: Menu lateral → Empréstimos

### Criar Empréstimo
1. Clique em "Novo Empréstimo"
2. Preencha:
   - **Descrição** - Ex: "Empréstimo Pessoal XYZ"
   - **Tipo** - Pessoal, Veicular, Imobiliário, etc
   - **Valor Principal** - Montante original
   - **Taxa de Juros (% a.m.)** - Juros mensais
   - **Prazo (meses)** - Duração do empréstimo
   - **Data de Início** - Quando começou
   - **Status** - Ativo, Pago, Cancelado
   - **Conta para Pagamentos** - Qual conta pagar de
3. Clique em "Criar"

### Gerenciar Empréstimos
- **Visualizar** - Ver detalhes completos
- **Editar** - Modificar informações
- **Registrar Pagamento** - Pagar parcela
- **Ver Amortização** - Cronograma de pagamentos
- **Deletar** - Remover empréstimo

### Funcionalidades

#### Visualização de Detalhes
- Saldo devedor
- Próxima parcela (data e valor)
- Total pago até agora
- Total de juros
- Cronograma completo

#### Registrar Pagamento
- Valor pago
- Data do pagamento
- Conta debitada
- Adicionar nota
- Registra automaticamente no saldo devedor

#### Importação de OFX
- Detecta pagamentos automáticos de empréstimos
- Oferece vincular com empréstimo conhecido
- Aviso se pagamento não corresponder ao esperado

---

## 📊 Análise Financeira (Analytics)

**Local**: Menu lateral → Análises

### Gráficos e Visualizações
- **Distribuição de Gastos** - Pizza chart por categoria
- **Fluxo Mensal** - Barras com receitas e despesas
- **Evolução do Saldo** - Linha temporal
- **Categorias Top** - Top 5 categorias de gasto
- **Comparativo Mensal** - Mês a mês

### Filtros
- Período (mês, trimestre, ano, customizado)
- Conta específica
- Tipo de transação
- Categoria

### Exportação
- Exportar gráficos como imagem
- Exportar dados como CSV

---

## 💸 Fluxo de Caixa (CashFlow)

**Local**: Menu lateral → Fluxo de Caixa

### Projeção
- Visualizar saldo futuro baseado em transações recorrentes
- Identificar meses com déficit
- Planejamento financeiro

### Análise
- Receitas estimadas
- Despesas fixas
- Saldo projetado por mês
- Alertas de período difícil

---

## 🔐 Cofre (Vault)

**Local**: Menu lateral → Cofre

### Armazenar Dados Sensíveis
1. Clique em "Novo Item"
2. Preencha:
   - **Tipo** - Senha, Documento, Cartão, Nota, etc
   - **Descrição** - O que está sendo guardado
   - **Conteúdo** - Dados sensíveis (criptografado)
   - **Grupo** - Organizar em categorias
3. Clique em "Salvar"

### Gerenciar Items
- **Visualizar** - Criptografia protegida
- **Editar** - Modificar dados
- **Copiar** - Copiar para clipboard
- **Deletar** - Remover item
- **Buscar** - Procurar por item específico
- **Agrupar** - Organizar por categoria

### Segurança
- Dados criptografados localmente
- Requer confirmar senha ao copiar
- Sessão de timeout

---

## ⚙️ Configurações (Settings)

**Local**: Menu lateral → Configurações

### Perfil
- **Nome** - Seu nome completo
- **Username** - Username (não editável)
- **Email** - Email (se necessário)
- **Mudar Senha** - Alterar senha

### Categorias
- **Criar Categoria** - Nova categoria de transação
- **Editar** - Modificar categoria
- **Deletar** - Remover categoria
- **Cor** - Identificação visual

### Limites de Orçamento
- **Definir Limite** - Por categoria
- **Período** - Mensal, trimestral, anual
- **Alerta** - Notificação ao atingir 80% do limite

### Compartilhamento
- **Compartilhar com Outro Usuário**:
  - Escolher usuário
  - Definir permissões:
    - **Read-Only** - Apenas visualizar dados
    - **Read-Write** - Visualizar e modificar
  - Usuário recebe acesso a suas contas

### Preferências
- **Ocultação de Valores** - Esconder valores monetários na tela
- **Tema** - Dark/Light (se aplicável)
- **Idioma** - Português, Inglês, etc

### Dados
- **Backup** - Exportar dados como JSON
- **Restaurar** - Importar dados de backup
- **Deletar Dados** - Limpar todos os dados (irreversível)
- **Deletar Conta** - Remover usuário (irreversível)

---

## 👥 Acesso Compartilhado

**Local**: Configurações → Compartilhamento

### Compartilhar Contas
1. Em Configurações → Compartilhamento
2. Clique "Compartilhar com Novo Usuário"
3. Digite o username do outro usuário
4. Selecione permissões:
   - **Read-Only** - Apenas visualizar
   - **Read-Write** - Editar e modificar
5. Confirme

### Aceitar Compartilhamento
- Outro usuário vê opção na página inicial
- Clica em aceitar
- Agora tem acesso às suas contas

### Gerenciar Acesso
- Ver quem tem acesso
- Revogar acesso (remover pessoa)
- Mudar permissões

---

## 🔄 Operações Avançadas

### Reconciliação
- Comparar saldo com extrato bancário
- Marcar transações como reconciliadas
- Identificar transações não confirmadas

### Transferências
- Transferir entre suas contas
- Automático em ambas contas
- Rastreamento com ID único

### Divisão de Transações
- Uma transação afetando múltiplas categorias
- Percentual ou valor fixo
- Útil para despesas mistas

### Transações Recorrentes
- Marcar transações como recorrentes
- Automático gera transações futuras
- Configurável: diária, semanal, mensal, anual

### Previsão
- Baseada em transações históricas
- Mostra saíde previsto
- Útil para orçamentação

---

## 📱 Interface Responsiva

- **Desktop** - Vista completa com todos os recursos
- **Tablet** - Layout adaptado, menu colapsado
- **Mobile** - Versão mobile completa

---

## 🔔 Notificações e Alertas

- **Limite de Categoria Excedido** - Alerta visual
- **Transação Incomum** - Valor muito acima da média
- **Vencimento de Empréstimo** - Alerta antecipado
- **Conta Inativa** - Aviso se saldo negativo
- **Sessão Expirada** - Necessário fazer login novamente

---

**Próximo**: Consulte [API.md](./API.md) para detalhes técnicos dos endpoints.
