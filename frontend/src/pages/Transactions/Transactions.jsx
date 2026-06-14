import React, { useState, useRef, useEffect } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { GlassCard } from '../../components/ui/GlassCard';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { PaymentModal } from '../../components/ui/PaymentModal';
import { TransactionDetailsModal } from '../../components/ui/TransactionDetailsModal';
import { TransactionFormDrawer } from '../../components/ui/TransactionFormDrawer';
import { ArrowUpRight, ArrowDownRight, Search, Filter, Plus, Check } from 'lucide-react';
import './Transactions.css';
import { CustomSelect } from '../../components/ui/CustomSelect';
import { CustomDatePicker } from '../../components/ui/CustomDatePicker';

// Helper helper to get start of current month and today's date in YYYY-MM-DD format
const getInitialDates = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  
  return {
    start: `${year}-${month}-01`,
    end: `${year}-${month}-${day}`
  };
};

export function Transactions({ filterAccountId, setFilterAccountId }) {
  const { transactions, accounts, loans, hideValues, markTransactionAsPaid, deleteSettlement, categories } = useFinance();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'payable', 'receivable'
  const [filterCategory, setFilterCategory] = useState('all');
  const [selectedTxForPayment, setSelectedTxForPayment] = useState(null);
  const [selectedTxForDetailsId, setSelectedTxForDetailsId] = useState(null);
  const [isAddingTransaction, setIsAddingTransaction] = useState(false);
  const [visibleCount, setVisibleCount] = useState(20);

  const selectedTxForDetails = transactions.find(t => t.id === selectedTxForDetailsId) || null;

  const initialDates = getInitialDates();
  const [startDate, setStartDate] = useState(initialDates.start);
  const [endDate, setEndDate] = useState(initialDates.end);
  const [ignoreDate, setIgnoreDate] = useState(false);

  useEffect(() => {
    setVisibleCount(20);
  }, [searchTerm, filterAccountId, activeTab, startDate, endDate, filterCategory, ignoreDate]);

  const allRef = useRef(null);
  const payableRef = useRef(null);
  const receivableRef = useRef(null);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });

  useEffect(() => {
    const updateIndicator = () => {
      let activeRef;
      if (activeTab === 'all') activeRef = allRef;
      else if (activeTab === 'payable') activeRef = payableRef;
      else if (activeTab === 'receivable') activeRef = receivableRef;

      if (activeRef && activeRef.current) {
        const el = activeRef.current;
        setIndicatorStyle({
          left: el.offsetLeft,
          width: el.offsetWidth
        });
      }
    };

    updateIndicator();
    // Add a tiny delay to ensure font-rendering is done and layouts are stable
    const timer = setTimeout(updateIndicator, 50);

    window.addEventListener('resize', updateIndicator);
    return () => {
      window.removeEventListener('resize', updateIndicator);
      clearTimeout(timer);
    };
  }, [activeTab]);

  const handleConfirmPayment = ({ transaction, paidAmount, actualAmount, asLoan, loanId, loanCounterpart, loanDueDate, loanTitle }) => {
    markTransactionAsPaid(transaction.id, paidAmount, actualAmount, asLoan, loanId, loanCounterpart, loanDueDate, loanTitle);
    setSelectedTxForPayment(null);
  };

  const handlePayRemaining = (transaction) => {
    setSelectedTxForPayment(transaction);
  };

  const uniqueCategories = Array.from(
    new Set([
      ...(categories || []).map(cat => cat.name),
      ...transactions.map(tx => tx.category)
    ].filter(Boolean))
  ).sort();

  const filteredTransactions = transactions
    .filter(tx => {
      const matchesTab = activeTab === 'payable' ? (tx.type === 'expense' && tx.status === 'pending') :
                         activeTab === 'receivable' ? (tx.type === 'income' && tx.status === 'pending') : true;
      
      const matchesAccount = filterAccountId === 'all' || tx.accountId === filterAccountId;
      
      const matchesCategory = filterCategory === 'all' || tx.category === filterCategory;
      
      const matchesSearch = tx.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            tx.category.toLowerCase().includes(searchTerm.toLowerCase());
                            
      const matchesDate = ignoreDate || ((!startDate || tx.date >= startDate) && (!endDate || tx.date <= endDate));
                            
      return matchesTab && matchesAccount && matchesCategory && matchesSearch && matchesDate;
    })
    .sort((a, b) => b.date.localeCompare(a.date));

  const displayedTransactions = filteredTransactions.slice(0, visibleCount);

  return (
    <div className="transactions-page">
      <div className="page-header">
        <div>
          <h2 className="page-title">
            {activeTab === 'all' && 'Extrato Global'}
            {activeTab === 'payable' && 'Contas a Pagar'}
            {activeTab === 'receivable' && 'Contas a Receber'}
          </h2>
          <p className="page-subtitle">Acompanhe todas as suas movimentações financeiras.</p>
        </div>
        <div className="page-actions">
          <Button variant="primary" icon={<Plus size={18} />} onClick={() => setIsAddingTransaction(true)}>
            Nova Transação
          </Button>
        </div>
      </div>

      {/* Navegação de Abas Internas */}
      <div className="transactions-tabs">
        <button 
          ref={allRef}
          className={`tx-tab ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          Extrato Completo
        </button>
        <button 
          ref={payableRef}
          className={`tx-tab ${activeTab === 'payable' ? 'active text-coral' : ''}`}
          onClick={() => setActiveTab('payable')}
        >
          Contas a Pagar
          <Badge variant="danger" className="ml-2">
            {transactions.filter(t => t.type === 'expense' && t.status === 'pending').length}
          </Badge>
        </button>
        <button 
          ref={receivableRef}
          className={`tx-tab ${activeTab === 'receivable' ? 'active text-emerald' : ''}`}
          onClick={() => setActiveTab('receivable')}
        >
          Contas a Receber
          <Badge variant="success" className="ml-2">
            {transactions.filter(t => t.type === 'income' && t.status === 'pending').length}
          </Badge>
        </button>
        <div 
          className={`tx-tab-indicator ${activeTab}`}
          style={{
            width: indicatorStyle.width,
            transform: `translateX(${indicatorStyle.left}px)`
          }}
        />
      </div>

      <GlassCard className="transactions-list-card">
        <div className="filters-bar">
          <div className="search-box glass">
            <Search size={18} className="text-muted" />
            <input 
              type="text" 
              placeholder="Buscar transação..." 
              className="search-input" 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="right-filters">
            <div className={`date-filter-flow-container ${ignoreDate ? 'collapsed-gap' : ''}`}>
              <div className="date-filter-toggle glass">
                <button
                  type="button"
                  className={`date-toggle-btn ${!ignoreDate ? 'active' : ''}`}
                  onClick={() => setIgnoreDate(false)}
                >
                  Por Período
                </button>
                <button
                  type="button"
                  className={`date-toggle-btn ${ignoreDate ? 'active' : ''}`}
                  onClick={() => setIgnoreDate(true)}
                >
                  Todo o Período
                </button>
              </div>

              <div className={`date-filter-inputs-wrapper ${ignoreDate ? 'collapsed' : ''}`}>
                <CustomDatePicker
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  placeholder="Data Inicial"
                  className="date-picker-custom"
                />
                <span className="date-separator">até</span>
                <CustomDatePicker
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  placeholder="Data Final"
                  className="date-picker-custom"
                />
              </div>
            </div>

            <div className="category-select-wrapper">
              <CustomSelect
                className="category-filter-select-custom"
                value={filterCategory}
                onChange={e => setFilterCategory(e.target.value)}
                options={[
                  { value: 'all', label: 'Todas as Categorias' },
                  ...uniqueCategories.map(cat => ({ value: cat, label: cat }))
                ]}
              />
            </div>
            
            <div className="account-select-wrapper">
              <CustomSelect
                className="account-filter-select-custom"
                value={filterAccountId}
                onChange={e => setFilterAccountId(e.target.value)}
                options={[
                  { value: 'all', label: 'Todas as Contas' },
                  ...accounts.map(acc => ({ value: String(acc.id), label: acc.name }))
                ]}
              />
            </div>
          </div>
        </div>

        <div className="transactions-table animate-fade-in" key={activeTab}>
          {displayedTransactions.map(tx => (
             <div 
               key={tx.id} 
               className="transaction-item" 
               style={{ cursor: 'pointer' }}
               onClick={() => setSelectedTxForDetailsId(tx.id)}
             >
              <div className="tx-icon glass">
                {tx.type === 'income' ? (
                  <ArrowUpRight size={20} className="text-emerald" />
                ) : (
                  <ArrowDownRight size={20} className="text-coral" />
                )}
              </div>
              <div className="tx-details">
                <h4>{tx.description}</h4>
                <p>
                  {tx.category}
                  {accounts.find(a => a.id === tx.accountId) && ` • ${accounts.find(a => a.id === tx.accountId).name}`}
                </p>
              </div>
              <div className="tx-date">
                {formatDate(tx.date)}
              </div>
              <div className="tx-amount-col">
                <span className={`tx-amount ${tx.type === 'income' ? 'text-emerald' : ''}`}>
                  {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount, hideValues)}
                </span>
                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                  {tx.is_forecast === 1 && (
                    <Badge variant="purple">Previsão</Badge>
                  )}
                  <Badge variant={tx.status === 'paid' ? 'success' : (tx.status === 'partial' ? 'warning' : 'danger')}>
                    {tx.status === 'paid' ? 'Pago' : (tx.status === 'partial' ? 'Parcial' : 'Pendente')}
                  </Badge>
                </div>
              </div>
              <div className="tx-actions">
                {tx.status !== 'paid' && (
                  <button 
                    className="action-btn glass" 
                    title="Dar Baixa"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedTxForPayment(tx);
                    }}
                    style={{ width: '36px', height: '36px', color: 'var(--accent-emerald)' }}
                  >
                    <Check size={18} />
                  </button>
                )}
              </div>
            </div>
          ))}
          {filteredTransactions.length === 0 && (
            <div className="empty-state">Nenhuma transação encontrada nesta categoria.</div>
          )}
          {filteredTransactions.length > visibleCount && (
            <div className="load-more-container">
              <Button 
                variant="secondary" 
                onClick={() => setVisibleCount(prev => prev + 20)}
                className="load-more-btn"
              >
                Carregar Mais
              </Button>
            </div>
          )}
        </div>
      </GlassCard>

      <TransactionDetailsModal
        key={selectedTxForDetailsId || 'closed'}
        transaction={selectedTxForDetails}
        onCancel={() => setSelectedTxForDetailsId(null)}
        onPayRemaining={handlePayRemaining}
        onDeleteSettlement={async (txId, settlementId) => {
          await deleteSettlement(settlementId);
        }}
      />

      {selectedTxForPayment && (
        <PaymentModal
          transaction={selectedTxForPayment}
          onConfirm={handleConfirmPayment}
          onCancel={() => setSelectedTxForPayment(null)}
          loans={loans}
        />
      )}

      {isAddingTransaction && (
        <TransactionFormDrawer onClose={() => setIsAddingTransaction(false)} />
      )}
    </div>
  );
}
