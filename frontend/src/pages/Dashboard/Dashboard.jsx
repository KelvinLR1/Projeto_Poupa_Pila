import React from 'react';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { GlassCard } from '../../components/ui/GlassCard';
import { Badge } from '../../components/ui/Badge';
import { ArrowUpRight, ArrowDownRight, Wallet, Activity } from 'lucide-react';
import './Dashboard.css';

export function Dashboard({ setActiveTab, setFilterAccountId }) {
  const { accounts, transactions, totalBalance, hideValues } = useFinance();

  const recentTransactions = transactions.slice(0, 5);

  return (
    <div className="dashboard">
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
