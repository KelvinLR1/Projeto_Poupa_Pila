const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');
const cryptoUtils = require('./crypto');

const dbPath = path.join(__dirname, 'poupa_pila.db');
const db = new DatabaseSync(dbPath);

// Habilita chaves estrangeiras
db.exec('PRAGMA foreign_keys = ON');

// Criação de tabelas
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    expires_at INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS accounts (
    id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    balance REAL NOT NULL,
    color TEXT NOT NULL,
    active INTEGER DEFAULT 1,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS transactions (
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
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (accountId) REFERENCES accounts (id) ON DELETE CASCADE
  );
`);

try {
  db.exec('ALTER TABLE transactions ADD COLUMN is_forecast INTEGER DEFAULT 0');
} catch (e) {
  // Column already exists, safe to ignore
}

try {
  db.exec('ALTER TABLE transactions ADD COLUMN transfer_id TEXT');
} catch (e) {
  // Column already exists, safe to ignore
}

db.exec(`
  CREATE TABLE IF NOT EXISTS settlements (
    id TEXT PRIMARY KEY,
    transaction_id TEXT NOT NULL,
    date TEXT NOT NULL,
    amount REAL NOT NULL,
    accountId TEXT NOT NULL,
    FOREIGN KEY (transaction_id) REFERENCES transactions (id) ON DELETE CASCADE
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS loans (
    id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    type TEXT NOT NULL,
    counterpart TEXT NOT NULL,
    totalAmount REAL NOT NULL,
    paidAmount REAL NOT NULL,
    dueDate TEXT,
    status TEXT NOT NULL,
    title TEXT,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
  );
`);

try {
  db.exec('ALTER TABLE loans ADD COLUMN title TEXT');
} catch (e) {
  // Column already exists, safe to ignore
}

db.exec(`
  CREATE TABLE IF NOT EXISTS loan_history (
    id TEXT PRIMARY KEY,
    loan_id TEXT NOT NULL,
    type TEXT NOT NULL,
    amount REAL NOT NULL,
    date TEXT NOT NULL,
    dueDate TEXT,
    description TEXT,
    direction TEXT NOT NULL,
    FOREIGN KEY (loan_id) REFERENCES loans (id) ON DELETE CASCADE
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS vault_groups (
    id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    color TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS vault_subgroups (
    id TEXT PRIMARY KEY,
    group_id TEXT NOT NULL,
    name TEXT NOT NULL,
    FOREIGN KEY (group_id) REFERENCES vault_groups (id) ON DELETE CASCADE
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS vault_entries (
    id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    group_id TEXT NOT NULL,
    subgroup_id TEXT,
    name TEXT NOT NULL,
    username TEXT,
    password TEXT,
    url TEXT,
    notes TEXT,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (group_id) REFERENCES vault_groups (id) ON DELETE CASCADE,
    FOREIGN KEY (subgroup_id) REFERENCES vault_subgroups (id) ON DELETE SET NULL
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS user_access (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    owner_id INTEGER NOT NULL,
    target_username TEXT NOT NULL,
    permissions TEXT NOT NULL DEFAULT 'read_write',
    FOREIGN KEY (owner_id) REFERENCES users (id) ON DELETE CASCADE
  );
`);

try {
  db.exec("ALTER TABLE user_access ADD COLUMN permissions TEXT DEFAULT 'read_write'");
} catch (e) {
  // Column already exists, safe to ignore
}

db.exec(`
  CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    rule_type TEXT,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
  );
`);

try {
  db.exec('ALTER TABLE categories ADD COLUMN rule_type TEXT');
  // Pre-populate existing categories based on keywords to avoid empty ones for existing users
  db.exec(`
    UPDATE categories 
    SET rule_type = 'necessity' 
    WHERE rule_type IS NULL 
      AND type = 'expense' 
      AND (
        LOWER(name) LIKE '%alimentação%' OR 
        LOWER(name) LIKE '%moradia%' OR 
        LOWER(name) LIKE '%transporte%' OR 
        LOWER(name) LIKE '%saúde%' OR 
        LOWER(name) LIKE '%educação%' OR 
        LOWER(name) LIKE '%contas%'
      )
  `);
  db.exec(`
    UPDATE categories 
    SET rule_type = 'investment' 
    WHERE rule_type IS NULL 
      AND type = 'expense' 
      AND (
        LOWER(name) LIKE '%investimento%' OR 
        LOWER(name) LIKE '%poupança%' OR 
        LOWER(name) LIKE '%reserva%' OR 
        LOWER(name) LIKE '%ações%' OR 
        LOWER(name) LIKE '%tesouro%'
      )
  `);
  db.exec(`
    UPDATE categories 
    SET rule_type = 'want' 
    WHERE rule_type IS NULL 
      AND type = 'expense'
  `);
} catch (e) {
  // Column already exists, safe to ignore
}

db.exec(`
  CREATE TABLE IF NOT EXISTS category_limits (
    id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    category_name TEXT NOT NULL,
    limit_amount REAL NOT NULL,
    period TEXT NOT NULL,
    alert_threshold REAL NOT NULL DEFAULT 80.0,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
  );
`);

function seedUserCategories(userId) {
  try {
    const checkCount = db.prepare('SELECT COUNT(*) as count FROM categories WHERE user_id = ?');
    const result = checkCount.all(userId)[0];
    if (result && result.count === 0) {
      const insert = db.prepare('INSERT INTO categories (id, user_id, name, type, rule_type) VALUES (?, ?, ?, ?, ?)');
      const defaults = [
        // Receitas (incomes)
        { name: 'Salário', type: 'income', rule_type: null },
        { name: 'Investimentos', type: 'income', rule_type: null },
        { name: 'Presentes', type: 'income', rule_type: null },
        { name: 'Receita', type: 'income', rule_type: null },
        { name: 'Recebimento de Empréstimo', type: 'income', rule_type: null },
        { name: 'Transferência', type: 'income', rule_type: null },
        // Despesas (expenses)
        { name: 'Alimentação', type: 'expense', rule_type: 'necessity' },
        { name: 'Moradia', type: 'expense', rule_type: 'necessity' },
        { name: 'Transporte', type: 'expense', rule_type: 'necessity' },
        { name: 'Lazer', type: 'expense', rule_type: 'want' },
        { name: 'Saúde', type: 'expense', rule_type: 'necessity' },
        { name: 'Educação', type: 'expense', rule_type: 'necessity' },
        { name: 'Despesa', type: 'expense', rule_type: 'want' },
        { name: 'Empréstimo', type: 'expense', rule_type: 'want' },
        { name: 'Transferência', type: 'expense', rule_type: null },
        { name: 'Outros', type: 'expense', rule_type: 'want' }
      ];
      defaults.forEach(cat => {
        const catId = Math.random().toString(36).substr(2, 9);
        insert.run(catId, userId, cat.name, cat.type, cat.rule_type);
      });
    }
  } catch (err) {
    console.error('Erro ao semear categorias para o usuário:', err);
  }
}

/**
 * Popula a conta de um novo usuário com os dados padrão originais do mockup.
 */
function seedDefaultData(userId, isClean = false) {
  // Inicializa as categorias
  seedUserCategories(userId);

  // ─── contas ───
  const insertAccount = db.prepare(`
    INSERT INTO accounts (id, user_id, name, type, balance, color, active)
    VALUES (?, ?, ?, ?, ?, ?, 1)
  `);
  if (isClean) {
    insertAccount.run('1', userId, 'Carteira', 'wallet', 0.0, '#10b981');
    return;
  }
  insertAccount.run('1', userId, 'Nubank', 'checking', 4500.50, '#8A05BE');
  insertAccount.run('2', userId, 'Itaú', 'checking', 1200.00, '#EC7000');
  insertAccount.run('3', userId, 'Carteira', 'wallet', 150.00, '#10b981');

  // ─── transações ───
  const insertTransaction = db.prepare(`
    INSERT INTO transactions (id, user_id, accountId, type, amount, category, description, date, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertTransaction.run('1', userId, '1', 'income', 5000.00, 'Salário', 'Salário Mensal', '2026-06-01', 'paid');
  insertTransaction.run('2', userId, '1', 'expense', 150.00, 'Alimentação', 'Mercado', '2026-06-02', 'paid');
  insertTransaction.run('3', userId, '2', 'expense', 1200.00, 'Moradia', 'Aluguel', '2026-06-05', 'pending');
  insertTransaction.run('4', userId, '1', 'expense', 80.00, 'Lazer', 'Netflix', '2026-06-10', 'pending');

  // ─── settlements ───
  const insertSettlement = db.prepare(`
    INSERT INTO settlements (id, transaction_id, date, amount, accountId)
    VALUES (?, ?, ?, ?, ?)
  `);
  insertSettlement.run('s1', '1', '2026-06-01', 5000.00, '1');
  insertSettlement.run('s2', '2', '2026-06-02', 150.00, '1');

  // ─── empréstimos ───
  const insertLoan = db.prepare(`
    INSERT INTO loans (id, user_id, type, counterpart, totalAmount, paidAmount, dueDate, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertLoan.run('1', userId, 'lent', 'João', 2350.00, 850.00, '2026-07-01', 'active');
  insertLoan.run('2', userId, 'borrowed', 'Mãe', 500.00, 500.00, '2026-05-20', 'settled');

  // ─── histórico de empréstimos ───
  const insertLoanHistory = db.prepare(`
    INSERT INTO loan_history (id, loan_id, type, amount, date, dueDate, description, direction)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertLoanHistory.run('h1', '1', 'loan', 800.00, '2026-04-10', '2026-06-10', 'Empréstimo inicial — aluguel atrasado', 'lent');
  insertLoanHistory.run('h2', '1', 'payment', 200.00, '2026-04-28', null, 'Devolução parcial (Pix)', 'lent');
  insertLoanHistory.run('h3', '1', 'loan', 350.00, '2026-05-05', '2026-06-30', 'Valor extra — conta de luz', 'lent');
  insertLoanHistory.run('h4', '1', 'payment', 300.00, '2026-05-15', null, 'Pagamento de maio', 'lent');
  insertLoanHistory.run('h5', '1', 'loan', 500.00, '2026-05-22', '2026-07-01', 'Conserto do carro', 'lent');
  insertLoanHistory.run('h6', '1', 'loan', 400.00, '2026-06-01', '2026-07-01', 'Mercado + remédio', 'lent');
  insertLoanHistory.run('h7', '1', 'payment', 350.00, '2026-06-03', null, 'Pix de hoje', 'lent');
  insertLoanHistory.run('h8', '1', 'loan', 300.00, '2026-06-03', '2026-07-15', 'Passagem de ônibus (mês)', 'lent');
  
  insertLoanHistory.run('h9', '2', 'loan', 500.00, '2026-05-01', '2026-05-20', 'Conserto do carro', 'borrowed');
  insertLoanHistory.run('h10', '2', 'payment', 500.00, '2026-05-15', null, 'Quitação total', 'borrowed');

  // ─── cofre de senhas (grupos, subgrupos e credenciais criptografadas) ───
  const insertGroup = db.prepare(`
    INSERT INTO vault_groups (id, user_id, name, color)
    VALUES (?, ?, ?, ?)
  `);
  insertGroup.run('g1', userId, 'Trabalho', '#6366f1');
  insertGroup.run('g2', userId, 'Pessoal', '#10b981');
  insertGroup.run('g3', userId, 'Financeiro', '#f59e0b');

  const insertSubgroup = db.prepare(`
    INSERT INTO vault_subgroups (id, group_id, name)
    VALUES (?, ?, ?)
  `);
  insertSubgroup.run('sg1', 'g1', 'E-mails');
  insertSubgroup.run('sg2', 'g1', 'Sistemas Internos');
  insertSubgroup.run('sg3', 'g2', 'Redes Sociais');

  const insertEntry = db.prepare(`
    INSERT INTO vault_entries (id, user_id, group_id, subgroup_id, name, username, password, url, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  // Trabalho -> E-mails
  insertEntry.run('e1', userId, 'g1', 'sg1', 'Gmail Corporativo', 'kelvin@empresa.com', cryptoUtils.encrypt('G0rp0Email#2024'), 'https://mail.google.com', '');
  // Trabalho -> Sistemas Internos
  insertEntry.run('e2', userId, 'g1', 'sg2', 'ERP da Empresa', 'kelvin.user', cryptoUtils.encrypt('Erp@Sys2024!'), 'https://erp.empresa.com.br', 'Trocar senha a cada 90 dias');
  // Pessoal -> Redes Sociais
  insertEntry.run('e3', userId, 'g2', 'sg3', 'Instagram', '@kelvin_lr', cryptoUtils.encrypt('Insta@P3ss0al!'), 'https://instagram.com', '');
  // Pessoal (sem subgrupo)
  insertEntry.run('e4', userId, 'g2', null, 'Netflix', 'kelvin@gmail.com', cryptoUtils.encrypt('Netf1ix#Casa'), 'https://netflix.com', 'Plano Premium');
  // Financeiro
  insertEntry.run('e5', userId, 'g3', null, 'Nubank', 'kelvin@gmail.com', cryptoUtils.encrypt('NuB@nk#2024!'), 'https://nubank.com.br', '');
  insertEntry.run('e6', userId, 'g3', null, 'Itaú Internet Banking', '0001.123456', cryptoUtils.encrypt('It@uBank2024'), 'https://itau.com.br', 'Agência 0001, Conta 123456-7');
}

module.exports = {
  db,
  seedDefaultData,
  seedUserCategories
};
