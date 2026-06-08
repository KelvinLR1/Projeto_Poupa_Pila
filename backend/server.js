const express = require('express');
const cors = require('cors');
const crypto = require('node:crypto');
const { db } = require('./db');
const cryptoUtils = require('./crypto');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// CORS - Permitir conexões do frontend (especialmente para o ambiente dev)
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// ─── Middleware de Autenticação ───
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token não fornecido.' });
  }

  const token = authHeader.split(' ')[1];
  
  try {
    const sessionQuery = db.prepare('SELECT * FROM sessions WHERE token = ? AND expires_at > ?');
    const sessions = sessionQuery.all(token, Date.now());
    const session = sessions[0];
    
    if (!session) {
      return res.status(401).json({ error: 'Sessão inválida ou expirada.' });
    }

    const userQuery = db.prepare('SELECT id, username, name FROM users WHERE id = ?');
    const users = userQuery.all(session.user_id);
    const user = users[0];

    if (!user) {
      return res.status(401).json({ error: 'Usuário não encontrado.' });
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    console.error('Erro na autenticação:', error);
    res.status(500).json({ error: 'Erro interno no servidor.' });
  }
}

// ─── Rotas de Autenticação ───

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: 'Usuário e senha são obrigatórios.' });
  }

  const lowerUser = username.toLowerCase().trim();

  try {
    const selectUser = db.prepare('SELECT * FROM users WHERE username = ?');
    const users = selectUser.all(lowerUser);
    let user = users[0];

    // Se o usuário não existir, faz o Auto-Cadastro (Frictionless Onboarding)
    if (!user) {
      // Determina o nome de exibição de forma amigável
      let name = '';
      if (lowerUser === 'joao' || lowerUser === 'joão') {
        name = 'João';
      } else if (lowerUser === 'kelvin') {
        name = 'Kelvin';
      } else if (lowerUser === 'admin') {
        name = 'Administrador';
      } else {
        name = username.charAt(0).toUpperCase() + username.slice(1);
      }

      const hash = cryptoUtils.hashPassword(password);
      const insertUser = db.prepare('INSERT INTO users (username, password_hash, name) VALUES (?, ?, ?)');
      const result = insertUser.run(lowerUser, hash, name);
      
      const newUserId = result.lastInsertRowid;
      
      // Novo usuário registrado com sucesso, começa do zero

      // Busca o usuário recém-criado
      const selectNewUser = db.prepare('SELECT * FROM users WHERE id = ?');
      user = selectNewUser.all(newUserId)[0];
    } else {
      // Se já existe, verifica a senha
      const isPasswordValid = cryptoUtils.verifyPassword(password, user.password_hash);
      if (!isPasswordValid) {
        return res.status(401).json({ error: 'Usuário ou senha incorretos.' });
      }
    }

    // Cria uma sessão (Válida por 7 dias)
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;
    
    const insertSession = db.prepare('INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)');
    insertSession.run(token, user.id, expiresAt);

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name
      }
    });
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ error: 'Erro interno no servidor.' });
  }
});

app.post('/api/auth/logout', authenticate, (req, res) => {
  try {
    const deleteSession = db.prepare('DELETE FROM sessions WHERE token = ?');
    deleteSession.run(req.token);
    res.json({ success: true });
  } catch (error) {
    console.error('Erro no logout:', error);
    res.status(500).json({ error: 'Erro interno no servidor.' });
  }
});

app.get('/api/auth/me', authenticate, (req, res) => {
  res.json({ user: req.user });
});

// ─── Rotas de Finanças ───

app.get('/api/finance/data', authenticate, (req, res) => {
  try {
    // 1. Contas
    const accounts = db.prepare('SELECT * FROM accounts WHERE user_id = ?').all(req.user.id);
    // Converter o active do SQLite (0/1) para boolean
    const formattedAccounts = accounts.map(a => ({ ...a, active: a.active !== 0 }));

    // 2. Transações
    const transactions = db.prepare('SELECT * FROM transactions WHERE user_id = ?').all(req.user.id);
    
    // Buscar settlements de cada transação
    const formattedTransactions = transactions.map(t => {
      const settlements = db.prepare('SELECT id, date, amount, accountId FROM settlements WHERE transaction_id = ?').all(t.id);
      return { ...t, settlements };
    });

    // 3. Empréstimos
    const loans = db.prepare('SELECT * FROM loans WHERE user_id = ?').all(req.user.id);
    
    // Buscar histórico de cada empréstimo
    const formattedLoans = loans.map(l => {
      const history = db.prepare('SELECT id, type, amount, date, dueDate, description, direction FROM loan_history WHERE loan_id = ?').all(l.id);
      return { ...l, history };
    });

    res.json({
      accounts: formattedAccounts,
      transactions: formattedTransactions,
      loans: formattedLoans
    });
  } catch (error) {
    console.error('Erro ao buscar dados financeiros:', error);
    res.status(500).json({ error: 'Erro ao buscar dados financeiros.' });
  }
});

app.post('/api/finance/accounts', authenticate, (req, res) => {
  const { id, name, type, balance, color } = req.body;
  if (!id || !name || !type || balance === undefined || !color) {
    return res.status(400).json({ error: 'Dados incompletos.' });
  }
  try {
    const insertAccount = db.prepare(`
      INSERT INTO accounts (id, user_id, name, type, balance, color, active)
      VALUES (?, ?, ?, ?, ?, ?, 1)
    `);
    insertAccount.run(id, req.user.id, name.trim(), type, parseFloat(balance), color);
    res.json({ success: true });
  } catch (error) {
    console.error('Erro ao adicionar conta:', error);
    res.status(500).json({ error: 'Erro ao adicionar conta.' });
  }
});

app.put('/api/finance/accounts/:id', authenticate, (req, res) => {
  const { id } = req.params;
  const { name, type, balance, color } = req.body;
  try {
    // Monta o update de forma simples
    const updateAccount = db.prepare(`
      UPDATE accounts 
      SET name = ?, type = ?, balance = ?, color = ?
      WHERE id = ? AND user_id = ?
    `);
    updateAccount.run(name, type, parseFloat(balance), color, id, req.user.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Erro ao editar conta:', error);
    res.status(500).json({ error: 'Erro ao editar conta.' });
  }
});

app.put('/api/finance/accounts/:id/toggle', authenticate, (req, res) => {
  const { id } = req.params;
  try {
    const selectAccount = db.prepare('SELECT active FROM accounts WHERE id = ? AND user_id = ?');
    const account = selectAccount.all(id, req.user.id)[0];
    if (!account) return res.status(404).json({ error: 'Conta não encontrada.' });

    const newActive = account.active === 1 ? 0 : 1;
    const updateActive = db.prepare('UPDATE accounts SET active = ? WHERE id = ? AND user_id = ?');
    updateActive.run(newActive, id, req.user.id);
    
    res.json({ success: true, active: newActive === 1 });
  } catch (error) {
    console.error('Erro ao alterar status da conta:', error);
    res.status(500).json({ error: 'Erro ao alterar status.' });
  }
});

app.post('/api/finance/transactions', authenticate, (req, res) => {
  const { id, accountId, type, amount, category, description, date, status } = req.body;
  if (!id || !accountId || !type || !amount || !category || !date || !status) {
    return res.status(400).json({ error: 'Campos obrigatórios ausentes.' });
  }

  try {
    // Executa em bloco
    db.exec('BEGIN TRANSACTION');

    const insertTx = db.prepare(`
      INSERT INTO transactions (id, user_id, accountId, type, amount, category, description, date, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertTx.run(id, req.user.id, accountId, type, parseFloat(amount), category, description || '', date, status);

    let settlements = [];
    if (status === 'paid') {
      const settlementId = Math.random().toString(36).substr(2, 9);
      const insertSettlement = db.prepare(`
        INSERT INTO settlements (id, transaction_id, date, amount, accountId)
        VALUES (?, ?, ?, ?, ?)
      `);
      insertSettlement.run(settlementId, id, date, parseFloat(amount), accountId);
      settlements.push({ id: settlementId, date, amount: parseFloat(amount), accountId });

      // Atualiza o saldo da conta
      const amountChange = type === 'income' ? parseFloat(amount) : -parseFloat(amount);
      const updateBalance = db.prepare('UPDATE accounts SET balance = balance + ? WHERE id = ? AND user_id = ?');
      updateBalance.run(amountChange, accountId, req.user.id);
    }

    db.exec('COMMIT');
    res.json({ success: true, settlements });
  } catch (error) {
    db.exec('ROLLBACK');
    console.error('Erro ao adicionar transação:', error);
    res.status(500).json({ error: 'Erro ao criar transação.' });
  }
});

app.post('/api/finance/transactions/:id/pay', authenticate, (req, res) => {
  const { id } = req.params;
  const { paidAmount } = req.body;

  try {
    db.exec('BEGIN TRANSACTION');

    const selectTx = db.prepare('SELECT * FROM transactions WHERE id = ? AND user_id = ?');
    const tx = selectTx.all(id, req.user.id)[0];
    if (!tx) {
      db.exec('ROLLBACK');
      return res.status(404).json({ error: 'Transação não encontrada.' });
    }
    if (tx.status === 'paid') {
      db.exec('ROLLBACK');
      return res.status(400).json({ error: 'Transação já está paga.' });
    }

    const settlements = db.prepare('SELECT amount FROM settlements WHERE transaction_id = ?').all(id);
    const alreadyPaid = settlements.reduce((sum, s) => sum + s.amount, 0);
    const remainingToPay = tx.amount - alreadyPaid;

    const valueToSettle = paidAmount !== undefined && paidAmount !== null 
      ? Math.min(parseFloat(paidAmount), remainingToPay) 
      : remainingToPay;

    if (valueToSettle <= 0) {
      db.exec('ROLLBACK');
      return res.status(400).json({ error: 'Valor de quitação inválido.' });
    }

    const newSettlementId = Math.random().toString(36).substr(2, 9);
    const todayStr = new Date().toISOString().split('T')[0];
    
    const insertSettlement = db.prepare(`
      INSERT INTO settlements (id, transaction_id, date, amount, accountId)
      VALUES (?, ?, ?, ?, ?)
    `);
    insertSettlement.run(newSettlementId, id, todayStr, valueToSettle, tx.accountId);

    const newTotalPaid = alreadyPaid + valueToSettle;
    const newStatus = Math.abs(tx.amount - newTotalPaid) < 0.01 ? 'paid' : 'partial';

    const updateTx = db.prepare('UPDATE transactions SET status = ? WHERE id = ?');
    updateTx.run(newStatus, id);

    const amountChange = tx.type === 'income' ? valueToSettle : -valueToSettle;
    const updateBalance = db.prepare('UPDATE accounts SET balance = balance + ? WHERE id = ?');
    updateBalance.run(amountChange, tx.accountId);

    db.exec('COMMIT');
    
    const updatedSettlements = db.prepare('SELECT id, date, amount, accountId FROM settlements WHERE transaction_id = ?').all(id);
    res.json({ success: true, status: newStatus, settlements: updatedSettlements });
  } catch (error) {
    db.exec('ROLLBACK');
    console.error('Erro ao quitar transação:', error);
    res.status(500).json({ error: 'Erro ao quitar transação.' });
  }
});

// Helper de Recálculo de Empréstimo (1:1 com frontend)
function recalculateLoanState(loan, historyItems) {
  let outgoingSum = 0;
  let incomingSum = 0;

  historyItems.forEach(item => {
    const dir = item.direction || loan.type;
    if (item.type === 'loan') {
      if (dir === 'lent') {
        outgoingSum += item.amount;
      } else {
        incomingSum += item.amount;
      }
    } else if (item.type === 'payment') {
      if (dir === 'lent') {
        incomingSum += item.amount;
      } else {
        outgoingSum += item.amount;
      }
    }
  });

  const netBalance = outgoingSum - incomingSum;
  let newType = loan.type;
  let totalAmount = 0;
  let paidAmount = 0;
  let status = 'active';

  if (netBalance > 0) {
    newType = 'lent';
    totalAmount = outgoingSum;
    paidAmount = incomingSum;
  } else if (netBalance < 0) {
    newType = 'borrowed';
    totalAmount = incomingSum;
    paidAmount = outgoingSum;
  } else {
    totalAmount = Math.max(outgoingSum, incomingSum);
    paidAmount = totalAmount;
    status = 'settled';
  }

  if (netBalance !== 0) {
    status = 'active';
  }

  const loanDates = historyItems
    .filter(h => h.type === 'loan' && (h.direction || loan.type) === newType)
    .map(h => h.dueDate)
    .filter(Boolean);
    
  const dueDate = loanDates.length > 0 ? loanDates.reduce((closest, curr) => {
    if (!closest) return curr;
    return new Date(curr) < new Date(closest) ? curr : closest;
  }, '') : loan.dueDate;

  return {
    type: newType,
    totalAmount,
    paidAmount,
    dueDate,
    status
  };
}

app.post('/api/finance/loans', authenticate, (req, res) => {
  const { id, type, counterpart, amount, date, dueDate, description } = req.body;
  if (!counterpart || amount === undefined || !type) {
    return res.status(400).json({ error: 'Campos obrigatórios ausentes.' });
  }

  try {
    db.exec('BEGIN TRANSACTION');

    // Busca se existe empréstimo desse counterpart
    const selectLoan = db.prepare('SELECT * FROM loans WHERE LOWER(TRIM(counterpart)) = LOWER(TRIM(?)) AND user_id = ?');
    const existingLoan = selectLoan.all(counterpart, req.user.id)[0];

    const historyId = Math.random().toString(36).substr(2, 9);
    const dateStr = date || new Date().toISOString().split('T')[0];

    if (existingLoan) {
      // 1. Insere histórico
      const insertHistory = db.prepare(`
        INSERT INTO loan_history (id, loan_id, type, amount, date, dueDate, description, direction)
        VALUES (?, ?, 'loan', ?, ?, ?, ?, ?)
      `);
      insertHistory.run(historyId, existingLoan.id, parseFloat(amount), dateStr, dueDate || null, description || 'Empréstimo adicional', type);

      // 2. Busca histórico completo para recalcular
      const history = db.prepare('SELECT * FROM loan_history WHERE loan_id = ?').all(existingLoan.id);
      const newState = recalculateLoanState(existingLoan, history);

      // 3. Atualiza empréstimo
      const updateLoan = db.prepare(`
        UPDATE loans
        SET type = ?, totalAmount = ?, paidAmount = ?, dueDate = ?, status = ?
        WHERE id = ?
      `);
      updateLoan.run(newState.type, newState.totalAmount, newState.paidAmount, newState.dueDate || null, newState.status, existingLoan.id);

      db.exec('COMMIT');
      res.json({ success: true, loanId: existingLoan.id });
    } else {
      // Cria novo empréstimo
      const newLoanId = id || Math.random().toString(36).substr(2, 9);
      
      const insertNewLoan = db.prepare(`
        INSERT INTO loans (id, user_id, type, counterpart, totalAmount, paidAmount, dueDate, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      insertNewLoan.run(newLoanId, req.user.id, type, counterpart.trim(), parseFloat(amount), 0, dueDate || null, 'active');

      const insertHistory = db.prepare(`
        INSERT INTO loan_history (id, loan_id, type, amount, date, dueDate, description, direction)
        VALUES (?, ?, 'loan', ?, ?, ?, ?, ?)
      `);
      insertHistory.run(historyId, newLoanId, parseFloat(amount), dateStr, dueDate || null, description || 'Empréstimo inicial', type);

      // Recalcula imediatamente (opcional mas garante consistência)
      const history = db.prepare('SELECT * FROM loan_history WHERE loan_id = ?').all(newLoanId);
      const newState = recalculateLoanState({ type, dueDate }, history);

      const updateLoan = db.prepare(`
        UPDATE loans
        SET type = ?, totalAmount = ?, paidAmount = ?, dueDate = ?, status = ?
        WHERE id = ?
      `);
      updateLoan.run(newState.type, newState.totalAmount, newState.paidAmount, newState.dueDate || null, newState.status, newLoanId);

      db.exec('COMMIT');
      res.json({ success: true, loanId: newLoanId });
    }
  } catch (error) {
    db.exec('ROLLBACK');
    console.error('Erro ao adicionar empréstimo:', error);
    res.status(500).json({ error: 'Erro ao criar empréstimo.' });
  }
});

app.post('/api/finance/loans/:id/pay', authenticate, (req, res) => {
  const { id } = req.params;
  const { amount, date, description } = req.body;

  if (amount === undefined) {
    return res.status(400).json({ error: 'Valor de pagamento é obrigatório.' });
  }

  try {
    db.exec('BEGIN TRANSACTION');

    const selectLoan = db.prepare('SELECT * FROM loans WHERE id = ? AND user_id = ?');
    const loan = selectLoan.all(id, req.user.id)[0];
    if (!loan) {
      db.exec('ROLLBACK');
      return res.status(404).json({ error: 'Empréstimo não encontrado.' });
    }

    const historyId = Math.random().toString(36).substr(2, 9);
    const dateStr = date || new Date().toISOString().split('T')[0];

    // Adiciona histórico de pagamento
    const insertHistory = db.prepare(`
      INSERT INTO loan_history (id, loan_id, type, amount, date, dueDate, description, direction)
      VALUES (?, ?, 'payment', ?, ?, null, ?, ?)
    `);
    insertHistory.run(historyId, id, parseFloat(amount), dateStr, description || 'Pagamento recebido/efetuado', loan.type);

    // Recalcula empréstimo
    const history = db.prepare('SELECT * FROM loan_history WHERE loan_id = ?').all(id);
    const newState = recalculateLoanState(loan, history);

    // Atualiza
    const updateLoan = db.prepare(`
      UPDATE loans
      SET type = ?, totalAmount = ?, paidAmount = ?, dueDate = ?, status = ?
      WHERE id = ?
    `);
    updateLoan.run(newState.type, newState.totalAmount, newState.paidAmount, newState.dueDate || null, newState.status, id);

    db.exec('COMMIT');
    res.json({ success: true });
  } catch (error) {
    db.exec('ROLLBACK');
    console.error('Erro ao pagar empréstimo:', error);
    res.status(500).json({ error: 'Erro ao realizar pagamento do empréstimo.' });
  }
});

app.post('/api/finance/loans/:id/toggle-type', authenticate, (req, res) => {
  const { id } = req.params;

  try {
    db.exec('BEGIN TRANSACTION');

    const selectLoan = db.prepare('SELECT * FROM loans WHERE id = ? AND user_id = ?');
    const loan = selectLoan.all(id, req.user.id)[0];
    if (!loan) {
      db.exec('ROLLBACK');
      return res.status(404).json({ error: 'Empréstimo não encontrado.' });
    }

    // Altera a direção de todos os itens do histórico para esse empréstimo
    const history = db.prepare('SELECT * FROM loan_history WHERE loan_id = ?').all(id);
    
    const updateHistoryItem = db.prepare('UPDATE loan_history SET direction = ? WHERE id = ?');
    
    history.forEach(item => {
      const currentDir = item.direction || loan.type;
      const newDir = currentDir === 'lent' ? 'borrowed' : 'lent';
      updateHistoryItem.run(newDir, item.id);
    });

    const newLoanType = loan.type === 'lent' ? 'borrowed' : 'lent';
    const updatedHistory = db.prepare('SELECT * FROM loan_history WHERE loan_id = ?').all(id);
    const newState = recalculateLoanState({ ...loan, type: newLoanType }, updatedHistory);

    const updateLoan = db.prepare(`
      UPDATE loans
      SET type = ?, totalAmount = ?, paidAmount = ?, dueDate = ?, status = ?
      WHERE id = ?
    `);
    updateLoan.run(newState.type, newState.totalAmount, newState.paidAmount, newState.dueDate || null, newState.status, id);

    db.exec('COMMIT');
    res.json({ success: true });
  } catch (error) {
    db.exec('ROLLBACK');
    console.error('Erro ao inverter tipo de empréstimo:', error);
    res.status(500).json({ error: 'Erro ao alternar tipo de empréstimo.' });
  }
});

// ─── Rotas do Cofre de Senhas ───

app.get('/api/vault/data', authenticate, (req, res) => {
  try {
    // Busca grupos
    const groups = db.prepare('SELECT * FROM vault_groups WHERE user_id = ?').all(req.user.id);
    
    const formattedVault = groups.map(g => {
      // Busca subgrupos
      const subgroups = db.prepare('SELECT * FROM vault_subgroups WHERE group_id = ?').all(g.id);
      
      const formattedSubgroups = subgroups.map(sg => {
        // Busca entries do subgrupo
        const entries = db.prepare('SELECT * FROM vault_entries WHERE group_id = ? AND subgroup_id = ? AND user_id = ?').all(g.id, sg.id, req.user.id);
        
        const decryptedEntries = entries.map(e => ({
          ...e,
          password: cryptoUtils.decrypt(e.password)
        }));
        return {
          id: sg.id,
          name: sg.name,
          entries: decryptedEntries
        };
      });

      // Busca entries diretas (sem subgrupo)
      const directEntries = db.prepare('SELECT * FROM vault_entries WHERE group_id = ? AND subgroup_id IS NULL AND user_id = ?').all(g.id, req.user.id);
      
      const decryptedDirectEntries = directEntries.map(e => ({
        ...e,
        password: cryptoUtils.decrypt(e.password)
      }));

      return {
        id: g.id,
        name: g.name,
        color: g.color,
        subgroups: formattedSubgroups,
        entries: decryptedDirectEntries
      };
    });

    res.json(formattedVault);
  } catch (error) {
    console.error('Erro ao buscar cofre:', error);
    res.status(500).json({ error: 'Erro ao buscar cofre.' });
  }
});

app.post('/api/vault/groups', authenticate, (req, res) => {
  const { id, name, color } = req.body;
  if (!id || !name) {
    return res.status(400).json({ error: 'ID e Nome são obrigatórios.' });
  }

  try {
    const insertGroup = db.prepare('INSERT INTO vault_groups (id, user_id, name, color) VALUES (?, ?, ?, ?)');
    insertGroup.run(id, req.user.id, name.trim(), color || '#6366f1');
    res.json({ success: true });
  } catch (error) {
    console.error('Erro ao adicionar grupo:', error);
    res.status(500).json({ error: 'Erro ao adicionar grupo.' });
  }
});

app.delete('/api/vault/groups/:id', authenticate, (req, res) => {
  const { id } = req.params;
  try {
    // Como PRAGMA foreign_keys = ON está ativo, deletar o grupo causará cascade delete nos subgrupos e entries.
    const deleteGroup = db.prepare('DELETE FROM vault_groups WHERE id = ? AND user_id = ?');
    deleteGroup.run(id, req.user.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Erro ao deletar grupo:', error);
    res.status(500).json({ error: 'Erro ao deletar grupo.' });
  }
});

app.post('/api/vault/subgroups', authenticate, (req, res) => {
  const { id, groupId, name } = req.body;
  if (!id || !groupId || !name) {
    return res.status(400).json({ error: 'ID, Group ID e Nome são obrigatórios.' });
  }

  try {
    // Verifica se o grupo pertence ao usuário
    const selectGroup = db.prepare('SELECT id FROM vault_groups WHERE id = ? AND user_id = ?');
    const groupExists = selectGroup.all(groupId, req.user.id)[0];
    if (!groupExists) return res.status(404).json({ error: 'Grupo não encontrado ou sem permissão.' });

    const insertSg = db.prepare('INSERT INTO vault_subgroups (id, group_id, name) VALUES (?, ?, ?)');
    insertSg.run(id, groupId, name.trim());
    res.json({ success: true });
  } catch (error) {
    console.error('Erro ao adicionar subgrupo:', error);
    res.status(500).json({ error: 'Erro ao adicionar subgrupo.' });
  }
});

app.delete('/api/vault/subgroups/:groupId/:subgroupId', authenticate, (req, res) => {
  const { groupId, subgroupId } = req.params;
  try {
    // Verifica permissão do grupo
    const selectGroup = db.prepare('SELECT id FROM vault_groups WHERE id = ? AND user_id = ?');
    const groupExists = selectGroup.all(groupId, req.user.id)[0];
    if (!groupExists) return res.status(403).json({ error: 'Sem permissão.' });

    const deleteSg = db.prepare('DELETE FROM vault_subgroups WHERE id = ? AND group_id = ?');
    deleteSg.run(subgroupId, groupId);
    res.json({ success: true });
  } catch (error) {
    console.error('Erro ao deletar subgrupo:', error);
    res.status(500).json({ error: 'Erro ao deletar subgrupo.' });
  }
});

app.post('/api/vault/entries', authenticate, (req, res) => {
  const { id, groupId, subgroupId, name, username, password, url, notes } = req.body;
  if (!id || !groupId || !name) {
    return res.status(400).json({ error: 'ID, Group ID e Nome são obrigatórios.' });
  }

  try {
    // Verifica permissão do grupo
    const selectGroup = db.prepare('SELECT id FROM vault_groups WHERE id = ? AND user_id = ?');
    const groupExists = selectGroup.all(groupId, req.user.id)[0];
    if (!groupExists) return res.status(403).json({ error: 'Grupo não pertence ao usuário.' });

    const encryptedPassword = cryptoUtils.encrypt(password || '');

    const insertEntry = db.prepare(`
      INSERT INTO vault_entries (id, user_id, group_id, subgroup_id, name, username, password, url, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertEntry.run(id, req.user.id, groupId, subgroupId || null, name.trim(), username || '', encryptedPassword, url || '', notes || '');
    res.json({ success: true });
  } catch (error) {
    console.error('Erro ao criar credencial:', error);
    res.status(500).json({ error: 'Erro ao salvar credencial.' });
  }
});

app.put('/api/vault/entries/:entryId', authenticate, (req, res) => {
  const { entryId } = req.params;
  const { name, username, password, url, notes } = req.body;

  if (!name) return res.status(400).json({ error: 'Nome é obrigatório.' });

  try {
    const selectEntry = db.prepare('SELECT * FROM vault_entries WHERE id = ? AND user_id = ?');
    const entry = selectEntry.all(entryId, req.user.id)[0];
    if (!entry) return res.status(404).json({ error: 'Credencial não encontrada.' });

    const encryptedPassword = cryptoUtils.encrypt(password || '');

    const updateEntry = db.prepare(`
      UPDATE vault_entries
      SET name = ?, username = ?, password = ?, url = ?, notes = ?
      WHERE id = ? AND user_id = ?
    `);
    updateEntry.run(name.trim(), username || '', encryptedPassword, url || '', notes || '', entryId, req.user.id);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Erro ao atualizar credencial:', error);
    res.status(500).json({ error: 'Erro ao salvar alterações.' });
  }
});

app.delete('/api/vault/entries/:groupId/:subgroupId/:entryId', authenticate, (req, res) => {
  const { entryId } = req.params;
  try {
    const deleteEntry = db.prepare('DELETE FROM vault_entries WHERE id = ? AND user_id = ?');
    deleteEntry.run(entryId, req.user.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Erro ao deletar credencial:', error);
    res.status(500).json({ error: 'Erro ao excluir credencial.' });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
