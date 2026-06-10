import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const FinanceContext = createContext();

export function FinanceProvider({ children }) {
  const { token, isAuthenticated } = useAuth();
  
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loans, setLoans] = useState([]);
  const [hideValues, setHideValues] = useState(false);

  const toggleHideValues = () => setHideValues(prev => !prev);

  // Calcula o saldo total consolidado localmente a partir dos saldos atualizados
  const totalBalance = accounts.reduce((acc, curr) => acc + curr.balance, 0);

  const generateId = () => Math.random().toString(36).substr(2, 9);

  // Função para buscar todos os dados financeiros do backend
  const fetchFinanceData = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/finance/data', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setAccounts(data.accounts || []);
        setTransactions(data.transactions || []);
        setLoans(data.loans || []);
      }
    } catch (e) {
      console.error('Erro ao buscar dados financeiros do backend:', e);
    }
  };

  // Carrega os dados sempre que o token for ativado/alterado
  useEffect(() => {
    if (isAuthenticated && token) {
      fetchFinanceData();
    } else {
      // Limpa dados caso o usuário faça logout
      setAccounts([]);
      setTransactions([]);
      setLoans([]);
    }
  }, [isAuthenticated, token]);

  const addAccount = async (newAccount) => {
    const id = generateId();
    try {
      const res = await fetch('/api/finance/accounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ id, ...newAccount, balance: newAccount.initialBalance || 0 })
      });
      if (res.ok) {
        await fetchFinanceData();
      }
    } catch (e) {
      console.error('Erro ao adicionar conta:', e);
    }
  };

  const updateAccount = async (id, changes) => {
    try {
      const res = await fetch(`/api/finance/accounts/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(changes)
      });
      if (res.ok) {
        await fetchFinanceData();
      }
    } catch (e) {
      console.error('Erro ao editar conta:', e);
    }
  };

  const toggleAccountStatus = async (id) => {
    try {
      const res = await fetch(`/api/finance/accounts/${id}/toggle`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        await fetchFinanceData();
      }
    } catch (e) {
      console.error('Erro ao alternar status da conta:', e);
    }
  };

  const addTransaction = async (newTx) => {
    const id = generateId();
    try {
      const res = await fetch('/api/finance/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ id, ...newTx })
      });
      if (res.ok) {
        await fetchFinanceData();
      }
    } catch (e) {
      console.error('Erro ao adicionar transação:', e);
    }
  };

  const markTransactionAsPaid = async (transactionId, paidAmount = null, actualAmount = null) => {
    try {
      const res = await fetch(`/api/finance/transactions/${transactionId}/pay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ paidAmount, actualAmount })
      });
      if (res.ok) {
        await fetchFinanceData();
      }
    } catch (e) {
      console.error('Erro ao quitar transação:', e);
    }
  };

  const addLoan = async (newLoanData) => {
    const id = generateId();
    try {
      const res = await fetch('/api/finance/loans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ id, ...newLoanData })
      });
      if (res.ok) {
        await fetchFinanceData();
      }
    } catch (e) {
      console.error('Erro ao criar empréstimo:', e);
    }
  };

  const payLoan = async (loanId, amount, date, description) => {
    try {
      const res = await fetch(`/api/finance/loans/${loanId}/pay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ amount, date, description })
      });
      if (res.ok) {
        await fetchFinanceData();
      }
    } catch (e) {
      console.error('Erro ao pagar empréstimo:', e);
    }
  };

  const toggleLoanType = async (loanId) => {
    try {
      const res = await fetch(`/api/finance/loans/${loanId}/toggle-type`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        await fetchFinanceData();
      }
    } catch (e) {
      console.error('Erro ao inverter tipo do empréstimo:', e);
    }
  };

  const deleteLoanHistoryItem = async (historyId) => {
    try {
      const res = await fetch(`/api/finance/loans/history/${historyId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        await fetchFinanceData();
        return data;
      }
    } catch (e) {
      console.error('Erro ao excluir lançamento de empréstimo:', e);
    }
    return null;
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
      toggleLoanType,
      deleteLoanHistoryItem
    }}>
      {children}
    </FinanceContext.Provider>
  );
}

export function useFinance() {
  return useContext(FinanceContext);
}

