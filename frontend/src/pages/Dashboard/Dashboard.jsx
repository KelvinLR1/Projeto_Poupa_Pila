import React from 'react';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { GlassCard } from '../../components/ui/GlassCard';
import { Badge } from '../../components/ui/Badge';
import { ArrowUpRight, ArrowDownRight, Wallet, Activity, AlertTriangle } from 'lucide-react';
import './Dashboard.css';

export function Dashboard({ setActiveTab, setFilterAccountId }) {
  const { accounts, transactions, totalBalance, hideValues, categoryLimits } = useFinance();

  const getStartOfWeek = () => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    const start = new Date(today.setDate(diff));
    start.setHours(0,0,0,0);
    return start;
  };

  const calculateSpent = (categoryName, period) => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const startOfWeek = getStartOfWeek();

    return transactions
      .filter(t => t.type === 'expense' && t.category.toLowerCase().trim() === categoryName.toLowerCase().trim())
      .reduce((sum, t) => {
        if (period === 'monthly') {
          if (t.date.startsWith(`${year}-${month}`)) {
            return sum + t.amount;
          }
        } else if (period === 'weekly') {
          const tDate = new Date(t.date + 'T00:00:00');
          const endOfWeek = new Date(startOfWeek);
          endOfWeek.setDate(endOfWeek.getDate() + 7);
          if (tDate >= startOfWeek && tDate < endOfWeek) {
            return sum + t.amount;
          }
        } else {
          return sum + t.amount;
        }
        return sum;
      }, 0);
  };

  const activeAlerts = categoryLimits
    .map(lim => {
      const spent = calculateSpent(lim.category_name, lim.period);
      const percentage = lim.limit_amount > 0 ? (spent / lim.limit_amount) * 100 : 0;
      return {
        ...lim,
        spent,
        percentage
      };
    })
    .filter(lim => lim.percentage >= lim.alert_threshold);

  const recentTransactions = transactions.slice(0, 5);

  return (
    <div className="dashboard">
      {/* Alertas de Gastos */}
      {activeAlerts.length > 0 && (
        <section className="dashboard-limits-alerts" style={{ marginBottom: '24px' }}>
          {activeAlerts.map(alert => {
            const limitExceeded = alert.percentage >= 100;
            return (
              <GlassCard 
                key={alert.id} 
                className={`alert-card ${limitExceeded ? 'limit-exceeded-card' : 'limit-warning-card'}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  padding: '16px 20px',
                  border: limitExceeded ? '1px solid rgba(244, 63, 94, 0.2)' : '1px solid rgba(245, 158, 11, 0.2)',
                  background: limitExceeded 
                    ? 'linear-gradient(90deg, rgba(244, 63, 94, 0.08) 0%, rgba(244, 63, 94, 0.02) 100%)'
                    : 'linear-gradient(90deg, rgba(245, 158, 11, 0.08) 0%, rgba(245, 158, 11, 0.02) 100%)',
                  borderRadius: '16px',
                  marginBottom: '10px'
                }}
              >
                <div className="alert-icon-wrapper" style={{
                  background: limitExceeded ? 'rgba(244, 63, 94, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                  borderRadius: '12px',
                  width: '40px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <AlertTriangle size={20} style={{
                    color: limitExceeded ? 'var(--accent-coral, #f43f5e)' : 'var(--accent-amber, #f59e0b)'
                  }} />
                </div>
                <div style={{ flex: 1 }}>
                  <h4 style={{
                    margin: 0,
                    fontSize: '0.95rem',
                    fontWeight: '600',
                    color: limitExceeded ? 'var(--accent-coral, #f43f5e)' : 'var(--accent-amber, #f59e0b)'
                  }}>
                    {limitExceeded ? 'Limite de Gastos Estourado!' : 'Alerta de Limite de Gastos!'}
                  </h4>
                  <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    A categoria <strong>{alert.category_name}</strong> atingiu {alert.percentage.toFixed(0)}% do limite {alert.period === 'monthly' ? 'mensal' : alert.period === 'weekly' ? 'semanal' : 'total'} (R$ {alert.spent.toFixed(2)} de R$ {alert.limit_amount.toFixed(2)}).
                  </p>
                </div>
              </GlassCard>
            );
          })}
        </section>
      )}
      {/* Seção de Saldo Total */}
      <section className="balance-section">
        <GlassCard className="total-balance-card">
          <div className="balance-header">
            <div className="icon-wrapper glass">
              <Wallet size={24} className="text-emerald" />
            </div>
            <span>Saldo Total Consolidado</span>
          </div>
          <h2 className="balance-amount">{formatCurrency(totalBalance, hideValues)}</h2>
          <div className="balance-trend">
            <Badge variant="success" className="trend-badge">
              <ArrowUpRight size={14} /> +2.4%
            </Badge>
            <span className="trend-text">em relação ao mês passado</span>
          </div>
        </GlassCard>
      </section>

      {/* Alertas de Contas a Pagar/Receber */}
      <section className="alerts-section">
        <GlassCard className="alert-card alert-payable">
          <div className="alert-icon-wrapper">
            <ArrowDownRight size={20} className="text-coral" />
          </div>
          <div className="alert-content">
            <h4>Contas a Pagar</h4>
            <p><strong>{transactions.filter(t => t.type === 'expense' && t.status === 'pending').length}</strong> contas pendentes</p>
          </div>
        </GlassCard>
        
        <GlassCard className="alert-card alert-receivable">
          <div className="alert-icon-wrapper">
            <ArrowUpRight size={20} className="text-emerald" />
          </div>
          <div className="alert-content">
            <h4>Contas a Receber</h4>
            <p><strong>{transactions.filter(t => t.type === 'income' && t.status === 'pending').length}</strong> contas pendentes</p>
          </div>
        </GlassCard>
      </section>

      {/* Grid Inferior */}
      <div className="dashboard-grid">
        {/* Contas */}
        <section className="accounts-section">
          <div className="section-header">
            <h3 className="section-title">Minhas Contas</h3>
          </div>
          <div className="accounts-list">
            {accounts.map(acc => (
              <GlassCard 
                key={acc.id} 
                className="account-card clickable"
                onClick={() => {
                  setFilterAccountId(acc.id);
                  setActiveTab('transactions');
                }}
              >
                <div className="account-info">
                  <div className="account-color" style={{ backgroundColor: acc.color }}></div>
                  <div>
                    <h4>{acc.name}</h4>
                    <p>{acc.type === 'checking' ? 'Conta Corrente' : 'Carteira'}</p>
                  </div>
                </div>
                <div className="account-balance">
                  {formatCurrency(acc.balance, hideValues)}
                </div>
              </GlassCard>
            ))}
          </div>
        </section>

        {/* Últimas Transações */}
        <section className="recent-transactions">
          <div className="section-header">
            <h3 className="section-title">Últimas Movimentações</h3>
            <button className="view-all-btn" onClick={() => setActiveTab('transactions')}>
              Ver tudo
            </button>
          </div>
          
          <GlassCard className="transactions-card">
            {recentTransactions.map(tx => (
              <div key={tx.id} className="transaction-item">
                <div className="tx-icon glass">
                  {tx.type === 'income' ? (
                    <ArrowUpRight size={20} className="text-emerald" />
                  ) : (
                    <ArrowDownRight size={20} className="text-coral" />
                  )}
                </div>
                <div className="tx-details">
                  <h4>{tx.description}</h4>
                  <p>{tx.category} • {formatDate(tx.date)}</p>
                </div>
                <div className="tx-amount-col">
                  <span className={`tx-amount ${tx.type === 'income' ? 'text-emerald' : ''}`}>
                    {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount, hideValues)}
                  </span>
                  <Badge variant={tx.status === 'paid' ? 'success' : 'warning'}>
                    {tx.status === 'paid' ? 'Pago' : 'Pendente'}
                  </Badge>
                </div>
              </div>
            ))}
          </GlassCard>
        </section>
      </div>
    </div>
  );
}
