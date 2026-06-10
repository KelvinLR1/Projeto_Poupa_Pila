const { db } = require('./db');

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

try {
  db.exec('BEGIN TRANSACTION');

  const loanId = '1';
  // Deleta o histórico antigo do João
  db.prepare('DELETE FROM loan_history WHERE loan_id = ?').run(loanId);

  const entries = [
    { type: 'loan', amount: 500, date: '2026-01-10', dueDate: '2026-02-10', description: 'Empréstimo inicial — conserto do celular' },
    { type: 'loan', amount: 200, date: '2026-01-15', dueDate: '2026-02-15', description: 'Ajuda para mercado da semana' },
    { type: 'payment', amount: 300, date: '2026-01-28', description: 'Pix parcial' },
    { type: 'loan', amount: 150, date: '2026-02-02', dueDate: '2026-03-02', description: 'Passagem de ônibus ida e volta' },
    { type: 'payment', amount: 400, date: '2026-02-10', description: 'Pagamento referente a janeiro' },
    { type: 'loan', amount: 350, date: '2026-02-15', dueDate: '2026-03-15', description: 'Compra de medicamentos na farmácia' },
    { type: 'loan', amount: 450, date: '2026-02-20', dueDate: '2026-03-20', description: 'Conta de energia atrasada' },
    { type: 'payment', amount: 250, date: '2026-02-28', description: 'Transferência bancária' },
    { type: 'loan', amount: 300, date: '2026-03-05', dueDate: '2026-04-05', description: 'Empréstimo para botijão de gás' },
    { type: 'payment', amount: 350, date: '2026-03-12', description: 'Devolução Pix' },
    { type: 'loan', amount: 800, date: '2026-03-15', dueDate: '2026-04-15', description: 'Conserto urgente do veículo' },
    { type: 'loan', amount: 250, date: '2026-03-20', dueDate: '2026-04-20', description: 'Supermercado mensal' },
    { type: 'payment', amount: 500, date: '2026-03-28', description: 'Pagamento parcial de março' },
    { type: 'loan', amount: 120, date: '2026-04-02', dueDate: '2026-05-02', description: 'Assinatura anual de curso' },
    { type: 'payment', amount: 300, date: '2026-04-05', description: 'Pix de domingo' },
    { type: 'loan', amount: 600, date: '2026-04-12', dueDate: '2026-05-12', description: 'Aluguel complementar' },
    { type: 'payment', amount: 400, date: '2026-04-18', description: 'Retorno parcial Pix' },
    { type: 'loan', amount: 400, date: '2026-04-25', dueDate: '2026-05-25', description: 'Exames médicos particulares' },
    { type: 'payment', amount: 200, date: '2026-04-30', description: 'Transferência Itaú' },
    { type: 'loan', amount: 150, date: '2026-05-02', dueDate: '2026-06-02', description: 'Combustível da semana' },
    { type: 'loan', amount: 350, date: '2026-05-05', dueDate: '2026-06-05', description: 'Valor extra para conta de luz' },
    { type: 'payment', amount: 450, date: '2026-05-10', description: 'Pagamento de maio' },
    { type: 'loan', amount: 500, date: '2026-05-18', dueDate: '2026-06-18', description: 'Compra de pneu traseiro' },
    { type: 'payment', amount: 200, date: '2026-05-25', description: 'Depósito em dinheiro' },
    { type: 'loan', amount: 300, date: '2026-06-01', dueDate: '2026-07-01', description: 'Mercado semanal + feira' },
    { type: 'payment', amount: 350, date: '2026-06-03', description: 'Devolução Pix de hoje' },
    { type: 'loan', amount: 300, date: '2026-06-04', dueDate: '2026-07-04', description: 'Passagem de ônibus (mês atual)' },
    { type: 'loan', amount: 450, date: '2026-06-05', dueDate: '2026-07-05', description: 'Consulta odontológica' },
    { type: 'payment', amount: 150, date: '2026-06-07', description: 'Pix parcial' },
    { type: 'payment', amount: 100, date: '2026-06-09', description: 'Pix final de teste' },
  ];

  const insertHistory = db.prepare(`
    INSERT INTO loan_history (id, loan_id, type, amount, date, dueDate, description, direction)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'lent')
  `);

  entries.forEach((item, index) => {
    const id = `h_j${index + 1}`;
    insertHistory.run(
      id,
      loanId,
      item.type,
      item.amount,
      item.date,
      item.dueDate || null,
      item.description
    );
  });

  const selectLoan = db.prepare('SELECT * FROM loans WHERE id = ?');
  const loan = selectLoan.all(loanId)[0];
  const history = db.prepare('SELECT * FROM loan_history WHERE loan_id = ?').all(loanId);

  const newState = recalculateLoanState(loan, history);

  const updateLoan = db.prepare(`
    UPDATE loans
    SET type = ?, totalAmount = ?, paidAmount = ?, dueDate = ?, status = ?
    WHERE id = ?
  `);
  updateLoan.run(
    newState.type,
    newState.totalAmount,
    newState.paidAmount,
    newState.dueDate || null,
    newState.status,
    loanId
  );

  db.exec('COMMIT');
  console.log('Successfully seeded 30 entries for João.');
  console.log('New state:', newState);
} catch (error) {
  db.exec('ROLLBACK');
  console.error('Error seeding data:', error);
}
