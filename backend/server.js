const express = require('express');
const cors = require('cors');
const crypto = require('node:crypto');
const { db, seedUserCategories } = require('./db');
const cryptoUtils = require('./crypto');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// CORS - Permitir conexões do frontend (especialmente para o ambiente dev)
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : '*';

app.use(cors({
  origin: allowedOrigins,
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

    // Guardar ID original e verificar vinculo em user_access
    user.original_id = user.id;
    user.isLinked = false;
    user.permissions = 'admin';

    const requestedWorkspace = req.headers['x-workspace-owner'];
    if (requestedWorkspace && requestedWorkspace !== 'personal') {
      const ownerId = parseInt(requestedWorkspace, 10);
      if (!isNaN(ownerId)) {
        const selectLink = db.prepare('SELECT owner_id, permissions FROM user_access WHERE target_username = ? AND owner_id = ?');
        const links = selectLink.all(user.username.toLowerCase(), ownerId);
        if (links.length > 0) {
          user.id = links[0].owner_id;
          user.isLinked = true;
          user.permissions = links[0].permissions || 'read_write';
          
          const ownerQuery = db.prepare('SELECT name FROM users WHERE id = ?');
          const owners = ownerQuery.all(links[0].owner_id);
          if (owners.length > 0) {
            user.ownerName = owners[0].name;
          }
        } else {
          return res.status(403).json({ error: 'Acesso negado a esta conta compartilhada.' });
        }
      } else {
        return res.status(400).json({ error: 'Workspace inválido.' });
      }
    }

    req.user = user;
    req.token = token;

    // Se for apenas leitura e tentar modificar dados em rotas restritas
    const isWrite = ['POST', 'PUT', 'DELETE'].includes(req.method);
    const isRestrictedPath = req.path.startsWith('/api/finance') ||
                             req.path.startsWith('/api/vault') ||
                             (req.path.startsWith('/api/settings') && req.path !== '/api/settings/change-password');

    if (user.isLinked && user.permissions === 'read_only' && isWrite && isRestrictedPath) {
      return res.status(403).json({ 
        error: 'Acesso apenas leitura. Você não tem permissão para realizar esta operação.' 
      });
    }

    next();
  } catch (error) {
    console.error('Erro na autenticação:', error);
    res.status(500).json({ error: 'Erro interno no servidor.' });
  }
}

// ─── Rotas de Autenticação ───

app.post('/api/auth/login', (req, res) => {
  const { username, password, confirmRegister } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: 'Usuário e senha são obrigatórios.' });
  }

  const lowerUser = username.toLowerCase().trim();

  try {
    const selectUser = db.prepare('SELECT * FROM users WHERE username = ?');
    const users = selectUser.all(lowerUser);
    let user = users[0];

    // Se o usuário não existir
    if (!user) {
      // Verificar se está vinculado a alguma conta
      const selectLink = db.prepare('SELECT owner_id FROM user_access WHERE target_username = ?');
      const links = selectLink.all(lowerUser);
      const isLinked = links.length > 0;

      // Se não está vinculado e não confirmou cadastro, retorna status para perguntar no front
      if (!isLinked && !confirmRegister) {
        return res.json({ 
          status: 'ask_register', 
          message: 'Usuário não encontrado no sistema. Deseja criar uma conta?' 
        });
      }

      // Se está vinculado OU se confirmou o cadastro no prompt: cria o usuário
      let name = username.charAt(0).toUpperCase() + username.slice(1);
      const hash = cryptoUtils.hashPassword(password);
      const insertUser = db.prepare('INSERT INTO users (username, password_hash, name) VALUES (?, ?, ?)');
      const result = insertUser.run(lowerUser, hash, name);
      
      const newUserId = result.lastInsertRowid;
      
      // Se NÃO for conta vinculada, gera as contas padrões com saldo zerado
      if (!isLinked) {
        const { seedDefaultData } = require('./db');
        seedDefaultData(newUserId, true);
      }

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

    // Se o usuário estiver vinculado, envia informações de vinculo
    const selectLink = db.prepare('SELECT owner_id, permissions FROM user_access WHERE target_username = ?');
    const links = selectLink.all(user.username.toLowerCase());
    let isLinked = false;
    let ownerName = null;
    let permissions = 'admin';
    if (links.length > 0) {
      isLinked = true;
      permissions = links[0].permissions || 'read_write';
      const ownerQuery = db.prepare('SELECT name FROM users WHERE id = ?');
      const owners = ownerQuery.all(links[0].owner_id);
      if (owners.length > 0) {
        ownerName = owners[0].name;
      }
    }

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        isLinked,
        ownerName,
        permissions
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

app.get('/api/auth/workspaces', authenticate, (req, res) => {
  try {
    const userId = req.user.original_id || req.user.id;
    const username = req.user.username.toLowerCase();

    // 1. Sua conta pessoal
    const workspaces = [
      {
        id: 'personal',
        name: 'Minha Conta Pessoal',
        ownerId: userId,
        isLinked: false,
        permissions: 'admin'
      }
    ];

    // 2. Contas compartilhadas
    const links = db.prepare('SELECT owner_id, permissions FROM user_access WHERE target_username = ?').all(username);
    for (const link of links) {
      const owner = db.prepare('SELECT name FROM users WHERE id = ?').all(link.owner_id);
      if (owner.length > 0) {
        workspaces.push({
          id: String(link.owner_id),
          name: `Conta de ${owner[0].name}`,
          ownerId: link.owner_id,
          isLinked: true,
          permissions: link.permissions || 'read_write'
        });
      }
    }

    res.json(workspaces);
  } catch (error) {
    console.error('Erro ao buscar workspaces:', error);
    res.status(500).json({ error: 'Erro ao buscar áreas de trabalho.' });
  }
});
app.post('/api/settings/change-password', authenticate, (req, res) => {
  const { currentPassword, newPassword } = req.body;
  
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Senha atual e nova senha são obrigatórias.' });
  }

  if (newPassword.trim().length < 4) {
    return res.status(400).json({ error: 'A nova senha deve ter pelo menos 4 caracteres.' });
  }

  const userId = req.user.original_id || req.user.id;

  try {
    const userQuery = db.prepare('SELECT password_hash FROM users WHERE id = ?');
    const user = userQuery.all(userId)[0];

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    const isPasswordValid = cryptoUtils.verifyPassword(currentPassword, user.password_hash);
    if (!isPasswordValid) {
      return res.status(400).json({ error: 'Senha atual incorreta.' });
    }

    const newHash = cryptoUtils.hashPassword(newPassword.trim());
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(newHash, userId);

    res.json({ success: true, message: 'Senha atualizada com sucesso!' });
  } catch (error) {
    console.error('Erro ao alterar senha:', error);
    res.status(500).json({ error: 'Erro interno no servidor ao alterar senha.' });
  }
});

// ─── Rotas de Gerenciamento de Acessos Compartilhados ───

app.get('/api/settings/access', authenticate, (req, res) => {
  try {
    const ownerId = req.user.original_id || req.user.id;
    const accessList = db.prepare('SELECT id, target_username, permissions FROM user_access WHERE owner_id = ?').all(ownerId);
    res.json(accessList);
  } catch (error) {
    console.error('Erro ao buscar acessos:', error);
    res.status(500).json({ error: 'Erro ao buscar acessos compartilhados.' });
  }
});

app.post('/api/settings/access', authenticate, (req, res) => {
  const { username, permissions, password } = req.body;
  if (!username) {
    return res.status(400).json({ error: 'Nome de usuário é obrigatório.' });
  }
  const lowerUser = username.toLowerCase().trim();
  const ownerId = req.user.original_id || req.user.id;
  const finalPerms = ['read_write', 'read_only'].includes(permissions) ? permissions : 'read_write';

  try {
    // Impede que o dono se adicione
    const ownerQuery = db.prepare('SELECT username FROM users WHERE id = ?');
    const owner = ownerQuery.all(ownerId)[0];
    if (owner && owner.username.toLowerCase() === lowerUser) {
      return res.status(400).json({ error: 'Não é possível dar acesso ao seu próprio usuário.' });
    }

    // Verifica se já tem vínculo
    const checkQuery = db.prepare('SELECT id FROM user_access WHERE owner_id = ? AND target_username = ?');
    const exists = checkQuery.all(ownerId, lowerUser);
    if (exists.length > 0) {
      return res.status(400).json({ error: 'Este usuário já possui acesso a esta conta.' });
    }

    // Verifica se o usuário alvo já existe
    const findUser = db.prepare('SELECT id FROM users WHERE username = ?');
    const targetUser = findUser.all(lowerUser)[0];

    if (!targetUser) {
      // Usuário não existe: precisa de senha para criar a conta
      if (!password || password.trim().length < 4) {
        return res.status(400).json({
          error: 'Este usuário ainda não tem conta. Defina uma senha (mín. 4 caracteres) para criá-la.'
        });
      }
      const hash = cryptoUtils.hashPassword(password.trim());
      const name = lowerUser.charAt(0).toUpperCase() + lowerUser.slice(1);
      const insertUser = db.prepare('INSERT INTO users (username, password_hash, name) VALUES (?, ?, ?)');
      insertUser.run(lowerUser, hash, name);
      // Conta de convidado: sem dados padrão
    }

    // Cria o vínculo de acesso
    const insertAccess = db.prepare('INSERT INTO user_access (owner_id, target_username, permissions) VALUES (?, ?, ?)');
    insertAccess.run(ownerId, lowerUser, finalPerms);
    res.json({ success: true });
  } catch (error) {
    console.error('Erro ao adicionar acesso:', error);
    res.status(500).json({ error: 'Erro ao adicionar acesso.' });
  }
});

app.delete('/api/settings/access/:id', authenticate, (req, res) => {
  const { id } = req.params;
  const ownerId = req.user.original_id || req.user.id;
  try {
    const deleteAccess = db.prepare('DELETE FROM user_access WHERE id = ? AND owner_id = ?');
    deleteAccess.run(id, ownerId);
    res.json({ success: true });
  } catch (error) {
    console.error('Erro ao remover acesso:', error);
    res.status(500).json({ error: 'Erro ao remover acesso.' });
  }
});

app.post('/api/settings/clear-data', authenticate, (req, res) => {
  try {
    db.exec('BEGIN TRANSACTION');
    
    // Exclui todas as contas, transações, empréstimos, cofre e limites do usuário
    // Mantemos apenas o registro do usuário em si
    const userId = req.user.id;
    
    db.prepare('DELETE FROM accounts WHERE user_id = ?').run(userId);
    db.prepare('DELETE FROM transactions WHERE user_id = ?').run(userId);
    db.prepare('DELETE FROM loans WHERE user_id = ?').run(userId);
    db.prepare('DELETE FROM vault_groups WHERE user_id = ?').run(userId);
    db.prepare('DELETE FROM categories WHERE user_id = ?').run(userId);
    db.prepare('DELETE FROM category_limits WHERE user_id = ?').run(userId);
    
    // Semeia novamente os dados limpos padrão (conta Carteira)
    const { seedDefaultData } = require('./db');
    seedDefaultData(userId, true);
    
    db.exec('COMMIT');
    res.json({ success: true, message: 'Todos os lançamentos e dados da conta foram limpos.' });
  } catch (error) {
    db.exec('ROLLBACK');
    console.error('Erro ao limpar dados:', error);
    res.status(500).json({ error: 'Erro ao limpar dados da conta.' });
  }
});

app.post('/api/settings/import-data', authenticate, (req, res) => {
  const { accounts, transactions, loans } = req.body;

  if (!Array.isArray(accounts) || !Array.isArray(transactions) || !Array.isArray(loans)) {
    return res.status(400).json({ error: 'Formato de backup inválido.' });
  }

  const userId = req.user.id;

  try {
    db.exec('BEGIN TRANSACTION');

    // 1. Limpar dados financeiros atuais do usuário
    db.prepare('DELETE FROM accounts WHERE user_id = ?').run(userId);
    db.prepare('DELETE FROM transactions WHERE user_id = ?').run(userId);
    db.prepare('DELETE FROM loans WHERE user_id = ?').run(userId);
    db.prepare('DELETE FROM categories WHERE user_id = ?').run(userId);
    db.prepare('DELETE FROM category_limits WHERE user_id = ?').run(userId);

    // 2. Semear as categorias essenciais do sistema
    const { seedUserCategories } = require('./db');
    seedUserCategories(userId);

    // 3. Cadastrar as categorias adicionais encontradas nas transações do backup
    const insertCategory = db.prepare('INSERT INTO categories (id, user_id, name, type, active) VALUES (?, ?, ?, ?, 1)');
    const selectCategory = db.prepare('SELECT id FROM categories WHERE user_id = ? AND LOWER(TRIM(name)) = LOWER(TRIM(?)) AND type = ?');

    transactions.forEach(tx => {
      if (!tx.category) return;
      const catName = tx.category.trim();
      const catType = tx.type;
      const exists = selectCategory.all(userId, catName, catType)[0];
      if (!exists) {
        const catId = Math.random().toString(36).substr(2, 9);
        insertCategory.run(catId, userId, catName, catType);
      }
    });

    // 4. Inserir contas
    const insertAccount = db.prepare(`
      INSERT INTO accounts (id, user_id, name, type, balance, color, active)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    accounts.forEach(acc => {
      insertAccount.run(
        acc.id,
        userId,
        acc.name.trim(),
        acc.type,
        parseFloat(acc.balance),
        acc.color,
        acc.active ? 1 : 0
      );
    });

    // 5. Inserir transações e seus settlements
    const insertTx = db.prepare(`
      INSERT INTO transactions (id, user_id, accountId, type, amount, category, description, date, competence_date, status, is_forecast, transfer_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const insertSettlement = db.prepare(`
      INSERT INTO settlements (id, transaction_id, date, amount, accountId)
      VALUES (?, ?, ?, ?, ?)
    `);

    transactions.forEach(tx => {
      insertTx.run(
        tx.id,
        userId,
        tx.accountId,
        tx.type,
        parseFloat(tx.amount),
        tx.category,
        tx.description || '',
        tx.date,
        tx.competence_date || tx.date,
        tx.status,
        tx.is_forecast ? 1 : 0,
        tx.transfer_id || null
      );

      if (Array.isArray(tx.settlements)) {
        tx.settlements.forEach(s => {
          insertSettlement.run(
            s.id,
            tx.id,
            s.date,
            parseFloat(s.amount),
            s.accountId
          );
        });
      }
    });

    // 6. Inserir empréstimos e seu histórico
    const insertLoan = db.prepare(`
      INSERT INTO loans (id, user_id, type, counterpart, totalAmount, paidAmount, dueDate, status, title)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const insertLoanHistory = db.prepare(`
      INSERT INTO loan_history (id, loan_id, type, amount, date, dueDate, description, direction, transaction_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    loans.forEach(loan => {
      insertLoan.run(
        loan.id,
        userId,
        loan.type,
        loan.counterpart.trim(),
        parseFloat(loan.totalAmount),
        parseFloat(loan.paidAmount),
        loan.dueDate || null,
        loan.status,
        loan.title || null
      );

      if (Array.isArray(loan.history)) {
        loan.history.forEach(h => {
          insertLoanHistory.run(
            h.id,
            loan.id,
            h.type,
            parseFloat(h.amount),
            h.date,
            h.dueDate || null,
            h.description || '',
            h.direction || loan.type,
            h.transaction_id || null
          );
        });
      }
    });

    db.exec('COMMIT');
    res.json({ success: true, message: 'Backup importado com sucesso!' });
  } catch (error) {
    db.exec('ROLLBACK');
    console.error('Erro ao importar backup:', error);
    res.status(500).json({ error: 'Erro ao importar os dados do backup.' });
  }
});


app.delete('/api/settings/account', authenticate, (req, res) => {
  try {
    db.exec('BEGIN TRANSACTION');
    
    // Como ON DELETE CASCADE está ativo no banco, deletar o usuário
    // removerá automaticamente todos os dados associados.
    const userId = req.user.original_id || req.user.id; // Deleta a conta real do dono
    
    db.prepare('DELETE FROM users WHERE id = ?').run(userId);
    
    db.exec('COMMIT');
    res.json({ success: true, message: 'Conta excluída com sucesso.' });
  } catch (error) {
    db.exec('ROLLBACK');
    console.error('Erro ao excluir conta:', error);
    res.status(500).json({ error: 'Erro ao excluir conta.' });
  }
});

// ─── Rotas de Finanças ───

app.get('/api/finance/data', authenticate, (req, res) => {
  try {
    // Garante que o usuário possua as categorias iniciais
    seedUserCategories(req.user.id);

    // 1. Contas
    const accounts = db.prepare('SELECT * FROM accounts WHERE user_id = ?').all(req.user.id);
    // Converter o active do SQLite (0/1) para boolean
    const formattedAccounts = accounts.map(a => ({ ...a, active: a.active !== 0 }));

    // 2. Transações
    const transactions = db.prepare('SELECT * FROM transactions WHERE user_id = ?').all(req.user.id);
    
    // Buscar settlements de cada transação
    const formattedTransactions = transactions.map(t => {
      const settlements = db.prepare('SELECT id, date, amount, accountId, interest, discount FROM settlements WHERE transaction_id = ?').all(t.id);
      return { ...t, settlements };
    });

    // 3. Empréstimos
    const loans = db.prepare('SELECT * FROM loans WHERE user_id = ?').all(req.user.id);
    
    // Buscar histórico de cada empréstimo
    const formattedLoans = loans.map(l => {
      const history = db.prepare('SELECT id, type, amount, date, dueDate, description, direction FROM loan_history WHERE loan_id = ?').all(l.id);
      return { ...l, history };
    });

    // 4. Categorias do usuário
    const categories = db.prepare('SELECT * FROM categories WHERE user_id = ?').all(req.user.id);
    const formattedCategories = categories.map(c => ({ ...c, active: c.active !== 0 }));

    // 5. Limites de Gastos / Orçamentos
    const categoryLimits = db.prepare('SELECT * FROM category_limits WHERE user_id = ?').all(req.user.id);

    res.json({
      accounts: formattedAccounts,
      transactions: formattedTransactions,
      loans: formattedLoans,
      categories: formattedCategories,
      categoryLimits
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
    const updateAccount = db.prepare(`
      UPDATE accounts 
      SET name = ?, type = ?, color = ?
      WHERE id = ? AND user_id = ?
    `);
    updateAccount.run(name, type, color, id, req.user.id);
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

function addMonths(dateStr, months) {
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1 + months, 1);
  const maxDays = new Date(year, month + months, 0).getDate();
  d.setDate(Math.min(day, maxDays));
  
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

app.post('/api/finance/transactions', authenticate, (req, res) => {
  const { id, accountId, type, amount, category, description, date, competence_date, status, is_forecast, isInstallment, installments } = req.body;
  if (!id || !accountId || !type || !amount || !category || !date || !status) {
    return res.status(400).json({ error: 'Campos obrigatórios ausentes.' });
  }

  // Validar se a conta pertence ao usuário
  const accountCheck = db.prepare('SELECT id FROM accounts WHERE id = ? AND user_id = ?').all(accountId, req.user.id)[0];
  if (!accountCheck) {
    return res.status(403).json({ error: 'Conta inválida ou não pertence ao usuário.' });
  }

  try {
    // Executa em bloco
    db.exec('BEGIN TRANSACTION');

    // Auto-registra a categoria caso ela ainda não exista
    const catCheck = db.prepare('SELECT id FROM categories WHERE user_id = ? AND LOWER(TRIM(name)) = LOWER(TRIM(?)) AND type = ?').all(req.user.id, category, type)[0];
    if (!catCheck) {
      const newCatId = Math.random().toString(36).substr(2, 9);
      db.prepare('INSERT INTO categories (id, user_id, name, type) VALUES (?, ?, ?, ?)')
        .run(newCatId, req.user.id, category.trim(), type);
    }

    const insertTx = db.prepare(`
      INSERT INTO transactions (id, user_id, accountId, type, amount, category, description, date, competence_date, status, is_forecast)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    let settlements = [];

    if (isInstallment) {
      if (!Array.isArray(installments) || installments.length < 2) {
        db.exec('ROLLBACK');
        return res.status(400).json({ error: 'Lista de parcelas inválida.' });
      }

      for (let i = 0; i < installments.length; i++) {
        const inst = installments[i];
        const installmentId = inst.index === 1 ? id : Math.random().toString(36).substr(2, 9);
        const installmentDate = inst.date;
        const installmentAmount = parseFloat(inst.amount);
        const installmentDesc = description ? `${description} (${inst.index}/${installments.length})` : `Parcela (${inst.index}/${installments.length})`;
        
        const installmentStatus = (inst.index === 1 && status === 'paid' && !is_forecast) ? 'paid' : 'pending';

        insertTx.run(
          installmentId,
          req.user.id,
          accountId,
          type,
          installmentAmount,
          category,
          installmentDesc,
          installmentDate,
          competence_date || date,
          installmentStatus,
          is_forecast ? 1 : 0
        );

        if (installmentStatus === 'paid') {
          const settlementId = Math.random().toString(36).substr(2, 9);
          const insertSettlement = db.prepare(`
            INSERT INTO settlements (id, transaction_id, date, amount, accountId)
            VALUES (?, ?, ?, ?, ?)
          `);
          insertSettlement.run(settlementId, installmentId, installmentDate, installmentAmount, accountId);
          settlements.push({ id: settlementId, date: installmentDate, amount: installmentAmount, accountId });

          // Atualiza o saldo da conta
          const amountChange = type === 'income' ? installmentAmount : -installmentAmount;
          const updateBalance = db.prepare('UPDATE accounts SET balance = balance + ? WHERE id = ? AND user_id = ?');
          updateBalance.run(amountChange, accountId, req.user.id);
        }
      }
    } else {
      insertTx.run(id, req.user.id, accountId, type, parseFloat(amount), category, description || '', date, competence_date || date, status, is_forecast ? 1 : 0);

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
    }

    db.exec('COMMIT');
    res.json({ success: true, settlements });
  } catch (error) {
    db.exec('ROLLBACK');
    console.error('Erro ao adicionar transação:', error);
    res.status(500).json({ error: 'Erro ao criar transação.' });
  }
});

app.post('/api/finance/transfers', authenticate, (req, res) => {
  const { fromAccountId, toAccountId, amount, date, description } = req.body;
  if (!fromAccountId || !toAccountId || amount === undefined || !date) {
    return res.status(400).json({ error: 'Campos obrigatórios ausentes.' });
  }

  const parsedAmount = parseFloat(amount);
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    return res.status(400).json({ error: 'Valor da transferência inválido.' });
  }

  if (fromAccountId === toAccountId) {
    return res.status(400).json({ error: 'As contas de origem e destino devem ser diferentes.' });
  }

  try {
    db.exec('BEGIN TRANSACTION');

    // 1. Verificar contas
    const selectAccount = db.prepare('SELECT * FROM accounts WHERE id = ? AND user_id = ?');
    const fromAcc = selectAccount.all(fromAccountId, req.user.id)[0];
    const toAcc = selectAccount.all(toAccountId, req.user.id)[0];

    if (!fromAcc || !toAcc) {
      db.exec('ROLLBACK');
      return res.status(404).json({ error: 'Uma ou ambas as contas não foram encontradas.' });
    }

    if (fromAcc.active === 0 || toAcc.active === 0) {
      db.exec('ROLLBACK');
      return res.status(400).json({ error: 'Não é possível transferir para/de contas inativas.' });
    }

    // Gerar IDs únicos
    const transferId = Math.random().toString(36).substr(2, 9);
    const expenseTxId = Math.random().toString(36).substr(2, 9);
    const incomeTxId = Math.random().toString(36).substr(2, 9);
    const expenseSettlementId = Math.random().toString(36).substr(2, 9);
    const incomeSettlementId = Math.random().toString(36).substr(2, 9);

    // Auto-registrar categoria "Transferência" se necessário
    const categoryName = 'Transferência';
    const catCheckExpense = db.prepare('SELECT id FROM categories WHERE user_id = ? AND name = ? AND type = ?').all(req.user.id, categoryName, 'expense')[0];
    if (!catCheckExpense) {
      const newCatId = Math.random().toString(36).substr(2, 9);
      db.prepare('INSERT INTO categories (id, user_id, name, type) VALUES (?, ?, ?, ?)')
        .run(newCatId, req.user.id, categoryName, 'expense');
    }
    const catCheckIncome = db.prepare('SELECT id FROM categories WHERE user_id = ? AND name = ? AND type = ?').all(req.user.id, categoryName, 'income')[0];
    if (!catCheckIncome) {
      const newCatId = Math.random().toString(36).substr(2, 9);
      db.prepare('INSERT INTO categories (id, user_id, name, type) VALUES (?, ?, ?, ?)')
        .run(newCatId, req.user.id, categoryName, 'income');
    }

    const defaultDesc = `Transferência de ${fromAcc.name} para ${toAcc.name}`;
    const finalDesc = description && description.trim() ? description.trim() : defaultDesc;

    // 2. Criar Transação de Despesa (Origem)
    const insertTx = db.prepare(`
      INSERT INTO transactions (id, user_id, accountId, type, amount, category, description, date, status, is_forecast, transfer_id)
      VALUES (?, ?, ?, 'expense', ?, ?, ?, ?, 'paid', 0, ?)
    `);
    insertTx.run(expenseTxId, req.user.id, fromAccountId, parsedAmount, categoryName, finalDesc, date, transferId);

    // Criar Baixa de Despesa
    const insertSettlement = db.prepare(`
      INSERT INTO settlements (id, transaction_id, date, amount, accountId)
      VALUES (?, ?, ?, ?, ?)
    `);
    insertSettlement.run(expenseSettlementId, expenseTxId, date, parsedAmount, fromAccountId);

    // 3. Criar Transação de Receita (Destino)
    const insertTxIncome = db.prepare(`
      INSERT INTO transactions (id, user_id, accountId, type, amount, category, description, date, status, is_forecast, transfer_id)
      VALUES (?, ?, ?, 'income', ?, ?, ?, ?, 'paid', 0, ?)
    `);
    insertTxIncome.run(incomeTxId, req.user.id, toAccountId, parsedAmount, categoryName, finalDesc, date, transferId);

    // Criar Baixa de Receita
    insertSettlement.run(incomeSettlementId, incomeTxId, date, parsedAmount, toAccountId);

    // 4. Atualizar Saldos das Contas
    const updateBalance = db.prepare('UPDATE accounts SET balance = balance + ? WHERE id = ? AND user_id = ?');
    updateBalance.run(-parsedAmount, fromAccountId, req.user.id);
    updateBalance.run(parsedAmount, toAccountId, req.user.id);

    db.exec('COMMIT');
    res.json({ success: true, transferId });
  } catch (error) {
    db.exec('ROLLBACK');
    console.error('Erro ao realizar transferência:', error);
    res.status(500).json({ error: 'Erro ao processar transferência.' });
  }
});

app.post('/api/finance/transactions/:id/pay', authenticate, (req, res) => {
  const { id } = req.params;
  const { paidAmount, actualAmount, interest, discount, asLoan, loanId, loanCounterpart, loanDueDate, loanTitle } = req.body;

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

    // Se for uma transação de previsão e um valor real/final for fornecido, atualiza o valor original
    if (actualAmount !== undefined && actualAmount !== null) {
      const newAmount = parseFloat(actualAmount);
      const updateTxAmount = db.prepare('UPDATE transactions SET amount = ?, is_forecast = 0 WHERE id = ?');
      updateTxAmount.run(newAmount, id);
      tx.amount = newAmount;
      tx.is_forecast = 0;
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
    const interestVal = parseFloat(interest) || 0;
    const discountVal = parseFloat(discount) || 0;
    
    const insertSettlement = db.prepare(`
      INSERT INTO settlements (id, transaction_id, date, amount, accountId, interest, discount)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    insertSettlement.run(newSettlementId, id, todayStr, valueToSettle, tx.accountId, interestVal, discountVal);

    const newTotalPaid = alreadyPaid + valueToSettle;
    const newStatus = Math.abs(tx.amount - newTotalPaid) < 0.01 ? 'paid' : 'partial';

    const updateTx = db.prepare('UPDATE transactions SET status = ? WHERE id = ?');
    updateTx.run(newStatus, id);

    if (asLoan) {
      const loanType = tx.type === 'expense' ? 'borrowed' : 'lent';
      const historyId = Math.random().toString(36).substr(2, 9);
      const dateStr = todayStr;

      if (loanId) {
        // Vincular a empréstimo existente por ID
        const selectLoan = db.prepare('SELECT * FROM loans WHERE id = ? AND user_id = ?');
        const existingLoan = selectLoan.all(loanId, req.user.id)[0];
        if (!existingLoan) {
          db.exec('ROLLBACK');
          return res.status(404).json({ error: 'Empréstimo associado não encontrado.' });
        }

        // Insere no histórico
        const insertHistory = db.prepare(`
          INSERT INTO loan_history (id, loan_id, type, amount, date, dueDate, description, direction)
          VALUES (?, ?, 'loan', ?, ?, ?, ?, ?)
        `);
        insertHistory.run(
          historyId,
          existingLoan.id,
          valueToSettle,
          dateStr,
          existingLoan.dueDate || null,
          `Quitação de despesa/receita: ${tx.description}`,
          loanType
        );

        // Recalcula o estado do empréstimo
        const history = db.prepare('SELECT * FROM loan_history WHERE loan_id = ?').all(existingLoan.id);
        const newState = recalculateLoanState(existingLoan, history);

        // Atualiza a tabela de empréstimos
        const updateLoan = db.prepare(`
          UPDATE loans
          SET type = ?, totalAmount = ?, paidAmount = ?, dueDate = ?, status = ?
          WHERE id = ?
        `);
        updateLoan.run(newState.type, newState.totalAmount, newState.paidAmount, newState.dueDate || null, newState.status, existingLoan.id);
      } else {
        // Criar novo empréstimo separado
        if (!loanCounterpart || !loanCounterpart.trim()) {
          db.exec('ROLLBACK');
          return res.status(400).json({ error: 'Nome do contato do empréstimo é obrigatório.' });
        }
        const counterpartTrimmed = loanCounterpart.trim();
        const newLoanId = Math.random().toString(36).substr(2, 9);

        const insertNewLoan = db.prepare(`
          INSERT INTO loans (id, user_id, type, counterpart, totalAmount, paidAmount, dueDate, status, title)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        insertNewLoan.run(newLoanId, req.user.id, loanType, counterpartTrimmed, valueToSettle, 0, loanDueDate || null, 'active', loanTitle || null);

        const insertHistory = db.prepare(`
          INSERT INTO loan_history (id, loan_id, type, amount, date, dueDate, description, direction)
          VALUES (?, ?, 'loan', ?, ?, ?, ?, ?)
        `);
        insertHistory.run(
          historyId,
          newLoanId,
          valueToSettle,
          dateStr,
          loanDueDate || null,
          `Quitação de despesa/receita: ${tx.description}`,
          loanType
        );

        // Recalcula o estado do novo empréstimo
        const history = db.prepare('SELECT * FROM loan_history WHERE loan_id = ?').all(newLoanId);
        const newState = recalculateLoanState({ type: loanType, dueDate: loanDueDate }, history);

        const updateLoan = db.prepare(`
          UPDATE loans
          SET type = ?, totalAmount = ?, paidAmount = ?, dueDate = ?, status = ?
          WHERE id = ?
        `);
        updateLoan.run(newState.type, newState.totalAmount, newState.paidAmount, newState.dueDate || null, newState.status, newLoanId);
      }
    } else {
      // Fluxo normal: atualiza saldo da conta bancária
      // Valor efetivo que movimenta a conta: Principal + Juros - Descontos
      const effectiveAmount = valueToSettle + interestVal - discountVal;
      const amountChange = tx.type === 'income' ? effectiveAmount : -effectiveAmount;
      const updateBalance = db.prepare('UPDATE accounts SET balance = balance + ? WHERE id = ?');
      updateBalance.run(amountChange, tx.accountId);
    }

    db.exec('COMMIT');
    
    const updatedSettlements = db.prepare('SELECT id, date, amount, accountId, interest, discount FROM settlements WHERE transaction_id = ?').all(id);
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
  const { id, type, counterpart, amount, date, dueDate, description, title, accountId, category } = req.body;
  if (!counterpart || amount === undefined || !type || !accountId || !category) {
    return res.status(400).json({ error: 'Campos obrigatórios ausentes.' });
  }

  // Validar se a conta pertence ao usuário
  const accountCheck = db.prepare('SELECT id FROM accounts WHERE id = ? AND user_id = ?').all(accountId, req.user.id)[0];
  if (!accountCheck) {
    return res.status(403).json({ error: 'Conta inválida ou não pertence ao usuário.' });
  }

  try {
    db.exec('BEGIN TRANSACTION');

    // Busca se existe empréstimo desse counterpart
    const selectLoan = db.prepare('SELECT * FROM loans WHERE LOWER(TRIM(counterpart)) = LOWER(TRIM(?)) AND user_id = ?');
    const existingLoan = selectLoan.all(counterpart, req.user.id)[0];

    const historyId = Math.random().toString(36).substr(2, 9);
    const dateStr = date || new Date().toISOString().split('T')[0];

    // Ajusta saldo da conta e insere transação no extrato apenas se solicitado
    const txType = type === 'lent' ? 'expense' : 'income';
    let txId = null;
    if (req.body.createTransaction !== false) {
      txId = Math.random().toString(36).substr(2, 9);
      
      const amountChange = txType === 'income' ? parseFloat(amount) : -parseFloat(amount);
      const updateBalance = db.prepare('UPDATE accounts SET balance = balance + ? WHERE id = ? AND user_id = ?');
      updateBalance.run(amountChange, accountId, req.user.id);

      const insertTx = db.prepare(`
        INSERT INTO transactions (id, user_id, accountId, type, amount, category, description, date, status, is_forecast)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'paid', 0)
      `);
      const txDescription = type === 'lent'
        ? `Empréstimo feito para ${counterpart.trim()}${title ? ` (${title})` : ''}`
        : `Empréstimo pego com ${counterpart.trim()}${title ? ` (${title})` : ''}`;
      insertTx.run(txId, req.user.id, accountId, txType, parseFloat(amount), category, description || txDescription, dateStr);
    }

    if (existingLoan) {
      // 1. Insere histórico
      const insertHistory = db.prepare(`
        INSERT INTO loan_history (id, loan_id, type, amount, date, dueDate, description, direction, transaction_id)
        VALUES (?, ?, 'loan', ?, ?, ?, ?, ?, ?)
      `);
      insertHistory.run(historyId, existingLoan.id, parseFloat(amount), dateStr, dueDate || null, description || 'Empréstimo adicional', type, txId);

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
        INSERT INTO loans (id, user_id, type, counterpart, totalAmount, paidAmount, dueDate, status, title)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      insertNewLoan.run(newLoanId, req.user.id, type, counterpart.trim(), parseFloat(amount), 0, dueDate || null, 'active', title || null);

      const insertHistory = db.prepare(`
        INSERT INTO loan_history (id, loan_id, type, amount, date, dueDate, description, direction, transaction_id)
        VALUES (?, ?, 'loan', ?, ?, ?, ?, ?, ?)
      `);
      insertHistory.run(historyId, newLoanId, parseFloat(amount), dateStr, dueDate || null, description || 'Empréstimo inicial', type, txId);

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
  const { amount, date, description, accountId, category } = req.body;

  if (amount === undefined || !accountId || !category) {
    return res.status(400).json({ error: 'Campos obrigatórios ausentes.' });
  }

  // Validar se a conta pertence ao usuário
  const accountCheck = db.prepare('SELECT id FROM accounts WHERE id = ? AND user_id = ?').all(accountId, req.user.id)[0];
  if (!accountCheck) {
    return res.status(403).json({ error: 'Conta inválida ou não pertence ao usuário.' });
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

    // Ajusta saldo da conta e insere transação no extrato apenas se solicitado
    const txType = loan.type === 'lent' ? 'income' : 'expense';
    let txId = null;
    if (req.body.createTransaction !== false) {
      txId = Math.random().toString(36).substr(2, 9);
      
      const amountChange = txType === 'income' ? parseFloat(amount) : -parseFloat(amount);
      const updateBalance = db.prepare('UPDATE accounts SET balance = balance + ? WHERE id = ? AND user_id = ?');
      updateBalance.run(amountChange, accountId, req.user.id);

      const insertTx = db.prepare(`
        INSERT INTO transactions (id, user_id, accountId, type, amount, category, description, date, status, is_forecast)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'paid', 0)
      `);
      const txDescription = loan.type === 'lent'
        ? `Recebimento de parcela de ${loan.counterpart}`
        : `Pagamento de parcela para ${loan.counterpart}`;
      insertTx.run(txId, req.user.id, accountId, txType, parseFloat(amount), category, description || txDescription, dateStr);
    }

    // Adiciona histórico de pagamento
    const insertHistory = db.prepare(`
      INSERT INTO loan_history (id, loan_id, type, amount, date, dueDate, description, direction, transaction_id)
      VALUES (?, ?, 'payment', ?, ?, null, ?, ?, ?)
    `);
    insertHistory.run(historyId, id, parseFloat(amount), dateStr, description || 'Pagamento recebido/efetuado', loan.type, txId);

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

      // Inverte a transação correspondente no extrato se existir
      if (item.transaction_id) {
        const selectTx = db.prepare('SELECT * FROM transactions WHERE id = ? AND user_id = ?');
        const tx = selectTx.all(item.transaction_id, req.user.id)[0];
        if (tx) {
          const oldType = tx.type;
          const newType = oldType === 'income' ? 'expense' : 'income';
          const newCategory = newType === 'income' ? 'Recebimento de Empréstimo' : 'Empréstimo';
          
          // Reverte o saldo da transação antiga e aplica o novo saldo
          const balanceAdjustment = oldType === 'income' ? -2 * tx.amount : 2 * tx.amount;
          
          db.prepare('UPDATE accounts SET balance = balance + ? WHERE id = ? AND user_id = ?')
            .run(balanceAdjustment, tx.accountId, req.user.id);
            
          db.prepare('UPDATE transactions SET type = ?, category = ? WHERE id = ?')
            .run(newType, newCategory, tx.id);
        }
      }
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

app.delete('/api/finance/loans/history/:historyId', authenticate, (req, res) => {
  const { historyId } = req.params;
  try {
    db.exec('BEGIN TRANSACTION');
    
    // Busca o item no histórico
    const selectHistory = db.prepare('SELECT * FROM loan_history WHERE id = ?');
    const historyItem = selectHistory.all(historyId)[0];
    if (!historyItem) {
      db.exec('ROLLBACK');
      return res.status(404).json({ error: 'Lançamento não encontrado.' });
    }
    
    // Busca o empréstimo associado e valida o usuário
    const selectLoan = db.prepare('SELECT * FROM loans WHERE id = ? AND user_id = ?');
    const loan = selectLoan.all(historyItem.loan_id, req.user.id)[0];
    if (!loan) {
      db.exec('ROLLBACK');
      return res.status(403).json({ error: 'Acesso negado.' });
    }
    
    // Se houver transação associada, deleta e reverte o saldo da conta
    if (historyItem.transaction_id) {
      const selectTx = db.prepare('SELECT * FROM transactions WHERE id = ? AND user_id = ?');
      const tx = selectTx.all(historyItem.transaction_id, req.user.id)[0];
      if (tx) {
        const amountChange = tx.type === 'income' ? -tx.amount : tx.amount;
        const updateBalance = db.prepare('UPDATE accounts SET balance = balance + ? WHERE id = ? AND user_id = ?');
        updateBalance.run(amountChange, tx.accountId, req.user.id);
        
        const deleteTx = db.prepare('DELETE FROM transactions WHERE id = ?');
        deleteTx.run(tx.id);
      }
    }

    // Exclui o item do histórico
    const deleteHistory = db.prepare('DELETE FROM loan_history WHERE id = ?');
    deleteHistory.run(historyId);
    
    // Busca os itens restantes
    const remainingHistory = db.prepare('SELECT * FROM loan_history WHERE loan_id = ?').all(loan.id);
    
    if (remainingHistory.length === 0) {
      // Se não sobrou nenhum registro, exclui o empréstimo por completo
      const deleteLoan = db.prepare('DELETE FROM loans WHERE id = ?');
      deleteLoan.run(loan.id);
      db.exec('COMMIT');
      return res.json({ success: true, loanDeleted: true });
    } else {
      // Recalcula o estado do empréstimo
      const newState = recalculateLoanState(loan, remainingHistory);
      const updateLoan = db.prepare(`
        UPDATE loans
        SET type = ?, totalAmount = ?, paidAmount = ?, dueDate = ?, status = ?
        WHERE id = ?
      `);
      updateLoan.run(newState.type, newState.totalAmount, newState.paidAmount, newState.dueDate || null, newState.status, loan.id);
      db.exec('COMMIT');
      return res.json({ success: true, loanDeleted: false });
    }
  } catch (error) {
    db.exec('ROLLBACK');
    console.error('Erro ao excluir lançamento de empréstimo:', error);
    res.status(500).json({ error: 'Erro ao excluir lançamento.' });
  }
});
app.delete('/api/finance/transactions/:id', authenticate, (req, res) => {
  const { id } = req.params;
  try {
    db.exec('BEGIN TRANSACTION');

    const selectTx = db.prepare('SELECT * FROM transactions WHERE id = ? AND user_id = ?');
    const tx = selectTx.all(id, req.user.id)[0];
    if (!tx) {
      db.exec('ROLLBACK');
      return res.status(404).json({ error: 'Transação não encontrada.' });
    }

    const settlements = db.prepare('SELECT * FROM settlements WHERE transaction_id = ?').all(tx.id);
    if (settlements.length > 0) {
      db.exec('ROLLBACK');
      return res.status(400).json({ error: 'Não é possível excluir uma transação que possui pagamentos.' });
    }

    if (tx.transfer_id) {
       db.exec('ROLLBACK');
       return res.status(400).json({ error: 'Não é possível excluir uma transferência por aqui.' });
    }

    const deleteTx = db.prepare('DELETE FROM transactions WHERE id = ?');
    deleteTx.run(tx.id);

    db.exec('COMMIT');
    res.json({ success: true });
  } catch (error) {
    db.exec('ROLLBACK');
    console.error('Erro ao excluir transação:', error);
    res.status(500).json({ error: 'Erro ao excluir transação.' });
  }
});

app.delete('/api/finance/settlements/:settlementId', authenticate, (req, res) => {
  const { settlementId } = req.params;
  try {
    db.exec('BEGIN TRANSACTION');

    // Busca o settlement
    const selectSettlement = db.prepare('SELECT * FROM settlements WHERE id = ?');
    const settlement = selectSettlement.all(settlementId)[0];
    if (!settlement) {
      db.exec('ROLLBACK');
      return res.status(404).json({ error: 'Quitação não encontrada.' });
    }

    // Busca a transação associada para validar permissão
    const selectTx = db.prepare('SELECT * FROM transactions WHERE id = ? AND user_id = ?');
    const tx = selectTx.all(settlement.transaction_id, req.user.id)[0];
    if (!tx) {
      db.exec('ROLLBACK');
      return res.status(403).json({ error: 'Acesso negado.' });
    }

    if (tx.transfer_id) {
      // É uma transferência: removemos AMBOS os lados (transações e quitações) e revertemos saldos
      const selectTransferTxs = db.prepare('SELECT * FROM transactions WHERE transfer_id = ? AND user_id = ?');
      const transferTxs = selectTransferTxs.all(tx.transfer_id, req.user.id);

      for (const t of transferTxs) {
        // Encontra todas as quitações desta transação
        const tSettlements = db.prepare('SELECT * FROM settlements WHERE transaction_id = ?').all(t.id);
        for (const s of tSettlements) {
          // Reverte o saldo da conta associada à quitação
          const amountChange = t.type === 'income' ? -s.amount : s.amount;
          db.prepare('UPDATE accounts SET balance = balance + ? WHERE id = ? AND user_id = ?')
            .run(amountChange, s.accountId, req.user.id);
          // Deleta a quitação
          db.prepare('DELETE FROM settlements WHERE id = ?').run(s.id);
        }
        // Deleta a transação
        db.prepare('DELETE FROM transactions WHERE id = ?').run(t.id);
      }

      db.exec('COMMIT');
      return res.json({ success: true, isTransferRollback: true, status: 'deleted', settlements: [] });
    }

    // Exclui o settlement
    const deleteSettlement = db.prepare('DELETE FROM settlements WHERE id = ?');
    deleteSettlement.run(settlementId);

    // Reverte o saldo da conta usando o valor efetivo
    const interestVal = settlement.interest || 0;
    const discountVal = settlement.discount || 0;
    const effectiveAmount = settlement.amount + interestVal - discountVal;
    
    const amountChange = tx.type === 'income' ? -effectiveAmount : effectiveAmount;
    const updateBalance = db.prepare('UPDATE accounts SET balance = balance + ? WHERE id = ? AND user_id = ?');
    updateBalance.run(amountChange, settlement.accountId, req.user.id);

    // Recalcula o status da transação
    const remainingSettlements = db.prepare('SELECT amount FROM settlements WHERE transaction_id = ?').all(tx.id);
    const newTotalPaid = remainingSettlements.reduce((sum, s) => sum + s.amount, 0);

    let newStatus = 'pending';
    if (newTotalPaid > 0) {
      newStatus = Math.abs(tx.amount - newTotalPaid) < 0.01 ? 'paid' : 'partial';
    }

    const updateTxStatus = db.prepare('UPDATE transactions SET status = ? WHERE id = ?');
    updateTxStatus.run(newStatus, tx.id);

    db.exec('COMMIT');

    // Retorna a lista atualizada de settlements e o novo status
    const updatedSettlements = db.prepare('SELECT id, date, amount, accountId FROM settlements WHERE transaction_id = ?').all(tx.id);
    res.json({ success: true, status: newStatus, settlements: updatedSettlements });
  } catch (error) {
    db.exec('ROLLBACK');
    console.error('Erro ao excluir quitação:', error);
    res.status(500).json({ error: 'Erro ao excluir quitação.' });
  }
});

// ─── Rotas de Categorias & Limites de Gastos ───

app.post('/api/finance/categories', authenticate, (req, res) => {
  const { id, name, type, rule_type } = req.body;
  if (!name || !type) {
    return res.status(400).json({ error: 'Nome e tipo são obrigatórios.' });
  }

  try {
    const trimmedName = name.trim();
    const exists = db.prepare('SELECT id, active FROM categories WHERE user_id = ? AND LOWER(TRIM(name)) = LOWER(TRIM(?)) AND type = ?').all(req.user.id, trimmedName, type)[0];
    if (exists) {
      if (exists.active === 0) {
        db.prepare('UPDATE categories SET active = 1, rule_type = ? WHERE id = ?').run(rule_type || null, exists.id);
        return res.json({ success: true, category: { id: exists.id, name: trimmedName, type, rule_type: rule_type || null, active: true } });
      }
      return res.status(400).json({ error: 'Esta categoria já existe.' });
    }

    const newId = id || Math.random().toString(36).substr(2, 9);
    const insert = db.prepare('INSERT INTO categories (id, user_id, name, type, rule_type, active) VALUES (?, ?, ?, ?, ?, 1)');
    insert.run(newId, req.user.id, trimmedName, type, rule_type || null);

    res.json({ success: true, category: { id: newId, name: trimmedName, type, rule_type: rule_type || null, active: true } });
  } catch (error) {
    console.error('Erro ao adicionar categoria:', error);
    res.status(500).json({ error: 'Erro ao adicionar categoria.' });
  }
});

app.put('/api/finance/categories/:id', authenticate, (req, res) => {
  const { id } = req.params;
  const { name, type, rule_type } = req.body;
  try {
    const category = db.prepare('SELECT * FROM categories WHERE id = ? AND user_id = ?').all(id, req.user.id)[0];
    if (!category) {
      return res.status(404).json({ error: 'Categoria não encontrada.' });
    }

    const updatedName = name !== undefined ? name.trim() : category.name;
    const updatedType = type !== undefined ? type : category.type;
    const updatedRuleType = rule_type !== undefined ? rule_type : category.rule_type;

    db.prepare('UPDATE categories SET name = ?, type = ?, rule_type = ? WHERE id = ?').run(updatedName, updatedType, updatedRuleType, id);
    res.json({ success: true });
  } catch (error) {
    console.error('Erro ao atualizar categoria:', error);
    res.status(500).json({ error: 'Erro ao atualizar categoria.' });
  }
});

app.delete('/api/finance/categories/:id', authenticate, (req, res) => {
  const { id } = req.params;
  try {
    const category = db.prepare('SELECT * FROM categories WHERE id = ? AND user_id = ?').all(id, req.user.id)[0];
    if (!category) {
      return res.status(404).json({ error: 'Categoria não encontrada.' });
    }

    // Verifica se existem transações vinculadas a esta categoria
    const txCheck = db.prepare('SELECT COUNT(*) as count FROM transactions WHERE user_id = ? AND LOWER(TRIM(category)) = LOWER(TRIM(?))').all(req.user.id, category.name)[0];

    if (txCheck && txCheck.count > 0) {
      // Inativa em vez de deletar
      db.prepare('UPDATE categories SET active = 0 WHERE id = ?').run(id);
      res.json({ success: true, deactivated: true });
    } else {
      // Deleta fisicamente
      db.prepare('DELETE FROM categories WHERE id = ?').run(id);
      res.json({ success: true, deleted: true });
    }
  } catch (error) {
    console.error('Erro ao deletar/inativar categoria:', error);
    res.status(500).json({ error: 'Erro ao processar remoção da categoria.' });
  }
});

app.post('/api/finance/category-limits', authenticate, (req, res) => {
  const { id, category_name, limit_amount, period, alert_threshold } = req.body;
  if (!category_name || limit_amount === undefined || !period) {
    return res.status(400).json({ error: 'Campos obrigatórios ausentes.' });
  }

  const amt = parseFloat(limit_amount);
  const thresh = alert_threshold !== undefined ? parseFloat(alert_threshold) : 80.0;

  try {
    const exists = db.prepare('SELECT id FROM category_limits WHERE user_id = ? AND category_name = ? AND period = ?').all(req.user.id, category_name, period)[0];
    
    if (exists) {
      const update = db.prepare('UPDATE category_limits SET limit_amount = ?, alert_threshold = ? WHERE id = ?');
      update.run(amt, thresh, exists.id);
      res.json({ success: true, id: exists.id });
    } else {
      const newId = id || Math.random().toString(36).substr(2, 9);
      const insert = db.prepare('INSERT INTO category_limits (id, user_id, category_name, limit_amount, period, alert_threshold) VALUES (?, ?, ?, ?, ?, ?)');
      insert.run(newId, req.user.id, category_name, amt, period, thresh);
      res.json({ success: true, id: newId });
    }
  } catch (error) {
    console.error('Erro ao salvar limite de gastos:', error);
    res.status(500).json({ error: 'Erro ao salvar limite de gastos.' });
  }
});

app.delete('/api/finance/category-limits/:id', authenticate, (req, res) => {
  const { id } = req.params;
  try {
    const limit = db.prepare('SELECT * FROM category_limits WHERE id = ? AND user_id = ?').all(id, req.user.id)[0];
    if (!limit) {
      return res.status(404).json({ error: 'Limite não encontrado.' });
    }

    db.prepare('DELETE FROM category_limits WHERE id = ?').run(id);
    res.json({ success: true });
  } catch (error) {
    console.error('Erro ao deletar limite de gastos:', error);
    res.status(500).json({ error: 'Erro ao deletar limite de gastos.' });
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

// Servir arquivos estáticos do frontend em produção ou se a pasta dist existir
const fs = require('node:fs');
const path = require('node:path');
const frontendDistPath = path.join(__dirname, '../frontend/dist');

if (process.env.NODE_ENV === 'production' || fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));
  
  // Rota genérica para suporte a roteamento SPA (React Router) no frontend
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) {
      return next();
    }
    res.sendFile(path.join(frontendDistPath, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
