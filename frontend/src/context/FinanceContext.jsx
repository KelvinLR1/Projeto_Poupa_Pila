import React, { createContext, useContext, useState } from 'react';

const FinanceContext = createContext();

const initialAccounts = [
  { id: '1', name: 'Nubank', type: 'checking', balance: 4500.50, color: '#8A05BE' },
  { id: '2', name: 'Itaú', type: 'checking', balance: 1200.00, color: '#EC7000' },
  { id: '3', name: 'Carteira', type: 'wallet', balance: 150.00, color: '#10b981' }
];

const initialTransactions = [
  { id: '1', accountId: '1', type: 'income', amount: 5000, category: 'Salário', description: 'Salário Mensal', date: '2026-06-01', status: 'paid', settlements: [{ id: 's1', date: '2026-06-01', amount: 5000, accountId: '1' }] },
  { id: '2', accountId: '1', type: 'expense', amount: 150, category: 'Alimentação', description: 'Mercado', date: '2026-06-02', status: 'paid', settlements: [{ id: 's2', date: '2026-06-02', amount: 150, accountId: '1' }] },
  { id: '3', accountId: '2', type: 'expense', amount: 1200, category: 'Moradia', description: 'Aluguel', date: '2026-06-05', status: 'pending', settlements: [] },
  { id: '4', accountId: '1', type: 'expense', amount: 80, category: 'Lazer', description: 'Netflix', date: '2026-06-10', status: 'pending', settlements: [] }
];

const initialLoans = [
  { 
    id: '1', 
    type: 'lent', 
    counterpart: 'João', 
    totalAmount: 2350, 
    paidAmount: 850, 
    dueDate: '2026-07-01', 
    status: 'active',
    history: [
      { id: 'h1', type: 'loan',    amount: 800,  date: '2026-04-10', dueDate: '2026-06-10', description: 'Empréstimo inicial — aluguel atrasado' },
      { id: 'h2', type: 'payment', amount: 200,  date: '2026-04-28', description: 'Devolução parcial (Pix)' },
      { id: 'h3', type: 'loan',    amount: 350,  date: '2026-05-05', dueDate: '2026-06-30', description: 'Valor extra — conta de luz' },
      { id: 'h4', type: 'payment', amount: 300,  date: '2026-05-15', description: 'Pagamento de maio' },
      { id: 'h5', type: 'loan',    amount: 500,  date: '2026-05-22', dueDate: '2026-07-01', description: 'Conserto do carro' },
      { id: 'h6', type: 'loan',    amount: 400,  date: '2026-06-01', dueDate: '2026-07-01', description: 'Mercado + remédio' },
      { id: 'h7', type: 'payment', amount: 350,  date: '2026-06-03', description: 'Pix de hoje' },
      { id: 'h8', type: 'loan',    amount: 300,  date: '2026-06-03', dueDate: '2026-07-15', description: 'Passagem de ônibus (mês)' }
    ]
  },
  { 
    id: '2', 
    type: 'borrowed', 
    counterpart: 'Mãe', 
    totalAmount: 500, 
    paidAmount: 500, 
    dueDate: '2026-05-20', 
    status: 'settled',
    history: [
      { id: 'h9',  type: 'loan',    amount: 500, date: '2026-05-01', dueDate: '2026-05-20', description: 'Conserto do carro' },
      { id: 'h10', type: 'payment', amount: 500, date: '2026-05-15', description: 'Quitação total' }
    ]
  }
];

export function FinanceProvider({ children }) {
  const [accounts, setAccounts] = useState(initialAccounts);
  const [transactions, setTransactions] = useState(initialTransactions);
  const [loans, setLoans] = useState(initialLoans);
  const [hideValues, setHideValues] = useState(false);

  const toggleHideValues = () => setHideValues(prev => !prev);

  // Calcula o saldo total consolidado
  const totalBalance = accounts.reduce((acc, curr) => acc + curr.balance, 0);

  /**
   * Dá baixa total ou parcial em uma transação pendente registrando no histórico.
   */
  const markTransactionAsPaid = (transactionId, paidAmount = null) => {
    const tx = transactions.find(t => t.id === transactionId);
    if (!tx || tx.status === 'paid') return;

    // Garante que settlements é um array
    const currentSettlements = tx.settlements || [];
    
    // Calcula o valor total já pago antes dessa nova quitação
    const alreadyPaid = currentSettlements.reduce((acc, s) => acc + s.amount, 0);
    const remainingToPay = tx.amount - alreadyPaid;
    
    // O valor a ser quitado não pode ser maior que o restante
    const valueToSettle = paidAmount !== null ? Math.min(paidAmount, remainingToPay) : remainingToPay;

    if (valueToSettle <= 0) return;

    const newSettlement = {
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString().split('T')[0], // Hoje
      amount: valueToSettle,
      accountId: tx.accountId
    };

    const updatedSettlements = [...currentSettlements, newSettlement];
    const newTotalPaid = alreadyPaid + valueToSettle;
    
    // Atualiza o status da transação
    // Considerando uma tolerância de 1 centavo por conta de arredondamentos JS
    const newStatus = Math.abs(tx.amount - newTotalPaid) < 0.01 ? 'paid' : 'partial';

    setTransactions(prev => prev.map(t =>
      t.id === transactionId
        ? { ...t, status: newStatus, settlements: updatedSettlements }
        : t
    ));

    // Atualiza o saldo da conta com o valor desta parcela
    setAccounts(prev => prev.map(acc => {
      if (acc.id === tx.accountId) {
        const amountChange = tx.type === 'income' ? valueToSettle : -valueToSettle;
        return { ...acc, balance: acc.balance + amountChange };
      }
      return acc;
    }));
  };

  const addAccount = (newAccount) => {
    const account = {
      ...newAccount,
      id: Math.random().toString(36).substr(2, 9),
      balance: newAccount.initialBalance || 0,
      active: true
    };
    setAccounts(prev => [...prev, account]);
  };

  const updateAccount = (id, changes) => {
    setAccounts(prev => prev.map(acc =>
      acc.id === id ? { ...acc, ...changes } : acc
    ));
  };

  const toggleAccountStatus = (id) => {
    setAccounts(prev => prev.map(acc =>
      acc.id === id ? { ...acc, active: acc.active === false ? true : false } : acc
    ));
  };

  const addTransaction = (newTx) => {
    const tx = {
      ...newTx,
      id: Math.random().toString(36).substr(2, 9),
      settlements: [],
    };

    // Se a transação já entra como paga (ex: OFX)
    if (tx.status === 'paid') {
      tx.settlements = [{
        id: Math.random().toString(36).substr(2, 9),
        date: tx.date,
        amount: tx.amount,
        accountId: tx.accountId
      }];
      setAccounts(prev => prev.map(acc => {
        if (acc.id === tx.accountId) {
          const amountChange = tx.type === 'income' ? tx.amount : -tx.amount;
          return { ...acc, balance: acc.balance + amountChange };
        }
        return acc;
      }));
    }

    setTransactions(prev => [...prev, tx]);
  };

  const addLoan = (newLoanData) => {
    const { type, counterpart, amount, date, dueDate, description } = newLoanData;

    setLoans(prev => {
      const existingIdx = prev.findIndex(
        l => l.counterpart.toLowerCase().trim() === counterpart.toLowerCase().trim() && l.type === type
      );

      const historyItem = {
        id: Math.random().toString(36).substr(2, 9),
        type: 'loan',
        amount: parseFloat(amount),
        date: date || new Date().toISOString().split('T')[0],
        dueDate,
        description: description || 'Empréstimo adicional'
      };

      if (existingIdx !== -1) {
        const updated = [...prev];
        const currentLoan = updated[existingIdx];
        
        const newHistory = [...currentLoan.history, historyItem];
        const newTotalAmount = currentLoan.totalAmount + parseFloat(amount);
        const newPaidAmount = currentLoan.paidAmount;
        
        const loanDates = newHistory
          .filter(h => h.type === 'loan')
          .map(h => h.dueDate)
          .filter(Boolean);
        const newDueDate = loanDates.length > 0 ? loanDates.reduce((closest, curr) => {
          if (!closest) return curr;
          return new Date(curr) < new Date(closest) ? curr : closest;
        }, '') : dueDate;

        updated[existingIdx] = {
          ...currentLoan,
          totalAmount: newTotalAmount,
          dueDate: newDueDate,
          status: newPaidAmount >= newTotalAmount ? 'settled' : 'active',
          history: newHistory
        };
        return updated;
      } else {
        const newRecord = {
          id: Math.random().toString(36).substr(2, 9),
          type,
          counterpart: counterpart.trim(),
          totalAmount: parseFloat(amount),
          paidAmount: 0,
          dueDate,
          status: 'active',
          history: [historyItem]
        };
        return [...prev, newRecord];
      }
    });
  };

  const payLoan = (loanId, amount, date, description) => {
    setLoans(prev => prev.map(loan => {
      if (loan.id === loanId) {
        const paymentItem = {
          id: Math.random().toString(36).substr(2, 9),
          type: 'payment',
          amount: parseFloat(amount),
          date: date || new Date().toISOString().split('T')[0],
          description: description || 'Pagamento recebido'
        };

        const newHistory = [...loan.history, paymentItem];
        const newPaidAmount = loan.paidAmount + parseFloat(amount);
        const status = newPaidAmount >= loan.totalAmount ? 'settled' : 'active';

        return {
          ...loan,
          paidAmount: newPaidAmount,
          status,
          history: newHistory
        };
      }
      return loan;
    }));
  };
  const toggleLoanType = (loanId) => {
    setLoans(prev => prev.map(loan => {
      if (loan.id === loanId) {
        return {
          ...loan,
          type: loan.type === 'lent' ? 'borrowed' : 'lent'
        };
      }
      return loan;
    }));
  };
  return (
    <FinanceContext.Provider value={{
      accounts,
      transactions,
      loans,
      hideValues,
      toggleHideValues,
      totalBalance,
      markTransactionAsPaid,
      addAccount,
      updateAccount,
      toggleAccountStatus,
      addTransaction,
      addLoan,
      payLoan,
      toggleLoanType
    }}>
      {children}
    </FinanceContext.Provider>
  );
}

export function useFinance() {
  return useContext(FinanceContext);
}
