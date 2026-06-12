import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const FinanceContext = createContext();

export function FinanceProvider({ children }) {
  const { token, isAuthenticated } = useAuth();
  
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loans, setLoans] = useState([]);
  const [categories, setCategories] = useState([]);
  const [categoryLimits, setCategoryLimits] = useState([]);
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
        setCategories(data.categories || []);
        setCategoryLimits(data.categoryLimits || []);
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
      setCategories([]);
      setCategoryLimits([]);
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

  const markTransactionAsPaid = async (transactionId, paidAmount = null, actualAmount = null, asLoan = false, loanId = null, loanCounterpart = null, loanDueDate = null, loanTitle = null) => {
    try {
      const res = await fetch(`/api/finance/transactions/${transactionId}/pay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ paidAmount, actualAmount, asLoan, loanId, loanCounterpart, loanDueDate, loanTitle })
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

  const deleteSettlement = async (settlementId) => {
    try {
      const res = await fetch(`/api/finance/settlements/${settlementId}`, {
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
      console.error('Erro ao excluir quitação:', e);
    }
    return null;
  };

  const addCategory = async (newCat) => {
    try {
      const res = await fetch('/api/finance/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newCat)
      });
      if (res.ok) {
        await fetchFinanceData();
      } else {
        const data = await res.json();
        throw new Error(data.error || 'Erro ao adicionar categoria');
      }
    } catch (e) {
      console.error('Erro ao adicionar categoria:', e);
      throw e;
    }
  };

  const deleteCategory = async (id) => {
    try {
      const res = await fetch(`/api/finance/categories/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        await fetchFinanceData();
      } else {
        const data = await res.json();
        throw new Error(data.error || 'Erro ao deletar categoria');
      }
    } catch (e) {
      console.error('Erro ao deletar categoria:', e);
      throw e;
    }
  };

  const updateCategory = async (id, updatedFields) => {
    try {
      const res = await fetch(`/api/finance/categories/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updatedFields)
      });
      if (res.ok) {
        await fetchFinanceData();
      } else {
        const data = await res.json();
        throw new Error(data.error || 'Erro ao atualizar categoria');
      }
    } catch (e) {
      console.error('Erro ao atualizar categoria:', e);
      throw e;
    }
  };

  const addCategoryLimit = async (newLimit) => {
    try {
      const res = await fetch('/api/finance/category-limits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newLimit)
      });
      if (res.ok) {
        await fetchFinanceData();
      } else {
        const data = await res.json();
        throw new Error(data.error || 'Erro ao salvar limite');
      }
    } catch (e) {
      console.error('Erro ao salvar limite de gastos:', e);
      throw e;
    }
  };

  const deleteCategoryLimit = async (id) => {
    try {
      const res = await fetch(`/api/finance/category-limits/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        await fetchFinanceData();
      } else {
        const data = await res.json();
        throw new Error(data.error || 'Erro ao deletar limite');
      }
    } catch (e) {
      console.error('Erro ao deletar limite de gastos:', e);
      throw e;
    }
  };

  return (
    <FinanceContext.Provider value={{
      accounts,
      transactions,
      loans,
      categories,
      categoryLimits,
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
      deleteLoanHistoryItem,
      deleteSettlement,
      addCategory,
      deleteCategory,
      updateCategory,
      addCategoryLimit,
      deleteCategoryLimit
    }}>
      {children}
    </FinanceContext.Provider>
  );
}

export function useFinance() {
  return useContext(FinanceContext);
}

