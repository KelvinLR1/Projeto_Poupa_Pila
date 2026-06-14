import React from 'react';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { GlassCard } from '../../components/ui/GlassCard';
import { Badge } from '../../components/ui/Badge';
import { ArrowUpRight, ArrowDownRight, Wallet, Activity, AlertTriangle, CheckCircle } from 'lucide-react';
import './Dashboard.css';

export function Dashboard({ setActiveTab, setFilterAccountId }) {
  const { accounts, transactions, totalBalance, hideValues, categoryLimits } = useFinance();
  const [activeAlertIndex, setActiveAlertIndex] = React.useState(0);
  const [userInteracted, setUserInteracted] = React.useState(false);

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
    });

  React.useEffect(() => {
    if (activeAlerts.length <= 1) return;
    
    const interval = setInterval(() => {
      setActiveAlertIndex(prev => (prev + 1) % activeAlerts.length);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [activeAlerts.length, userInteracted]);

  const handleSelectAlert = (index) => {
    setActiveAlertIndex(index);
    setUserInteracted(prev => !prev);
  };

  const activeAccounts = accounts.filter(a => a.active !== false);
  const transactionLimit = Math.max(5, Math.round((activeAccounts.length * 104 - 16) / 80));
  const recentTransactions = transactions.slice(0, transactionLimit);
  const currentAlertIndex = activeAlertIndex >= activeAlerts.length ? 0 : activeAlertIndex;

  const currentAlert = activeAlerts[currentAlertIndex];
  let containerStatusClass = '';
  if (currentAlert) {
    const limitExceeded = currentAlert.percentage >= 100;
    const alertTriggered = currentAlert.percentage >= currentAlert.alert_threshold;
    containerStatusClass = limitExceeded ? 'status-critical' : alertTriggered ? 'status-warning' : 'status-normal';
  }

  return (
    <div className="dashboard">
      {/* Seção de Saldo Total e Alertas */}
      <div className={`balance-alerts-wrapper ${activeAlerts.length === 0 ? 'no-alerts' : ''}`}>
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

        {activeAlerts.length > 0 && (
          <div className={`dashboard-limits-alerts-container ${containerStatusClass}`}>
            {/* Background dynamic radial glow */}
            <div className="alerts-container-glow"></div>

            {/* Lateral esquerda: mini menu de seleção */}
            <div className="alerts-sidebar-menu">
              {activeAlerts.map((alert, idx) => {
                const limitExceeded = alert.percentage >= 100;
                const alertTriggered = alert.percentage >= alert.alert_threshold;
                const itemStatus = limitExceeded ? 'critical' : alertTriggered ? 'warning' : 'normal';
                const isActive = idx === currentAlertIndex;
                return (
                  <button
                    key={alert.id}
                    type="button"
                    className={`alerts-menu-item ${isActive ? 'active' : ''} ${itemStatus}`}
                    onClick={() => handleSelectAlert(idx)}
                  >
                    <span className="alert-status-indicator"></span>
                    <span className="alert-menu-label">{alert.category_name}</span>
                  </button>
                );
              })}
            </div>

            {/* Conteúdo central: Card do Carrossel */}
            <div className="alert-carousel-viewport">
              {activeAlerts.map((alert, idx) => {
                const isActive = idx === currentAlertIndex;
                const limitExceeded = alert.percentage >= 100;
                const alertTriggered = alert.percentage >= alert.alert_threshold;
                const slideStatusClass = limitExceeded ? 'exceeded' : alertTriggered ? 'warning' : 'normal';
                
                const progressColor = limitExceeded 
                  ? 'var(--accent-coral, #f43f5e)' 
                  : alertTriggered
                    ? 'var(--accent-amber, #f59e0b)'
                    : 'var(--accent-emerald, #10b981)';
                
                const remaining = alert.limit_amount - alert.spent;
                const isOverLimit = remaining < 0;

                return (
                  <div 
                    key={alert.id} 
                    className={`alert-carousel-slide ${isActive ? 'active' : ''} ${slideStatusClass}`}
                  >
                    <div className="alert-slide-header">
                      <div className="alert-slide-category">
                        <div className="category-icon-container">
                          {limitExceeded || alertTriggered ? (
                            <AlertTriangle size={16} className="alert-slide-icon" />
                          ) : (
                            <CheckCircle size={16} className="alert-slide-icon" />
                          )}
                        </div>
                        <h4>{alert.category_name}</h4>
                      </div>
                      <span className="alert-slide-badge">
                        {limitExceeded ? 'Estourado' : alertTriggered ? 'Atenção' : 'Dentro do Limite'}
                      </span>
                    </div>

                    <div className="alert-slide-values">
                      <div className="value-block">
                        <span className="value-label">Gasto Atual</span>
                        <span className="value-amount">{formatCurrency(alert.spent)}</span>
                      </div>
                      <div className="value-block">
                        <span className="value-label">Limite Mensal</span>
                        <span className="value-amount">{formatCurrency(alert.limit_amount)}</span>
                      </div>
                      <div className="value-block">
                        <span className="value-label">{isOverLimit ? 'Excedido' : 'Disponível'}</span>
                        <span className={`value-amount ${isOverLimit ? 'text-coral' : 'text-emerald'}`}>
                          {formatCurrency(Math.abs(remaining))}
                        </span>
                      </div>
                    </div>

                    {/* Barra de Progresso */}
                    <div className="alert-slide-progress-container">
                      <div className="progress-labels">
                        <span>Progresso ({alert.percentage.toFixed(0)}%)</span>
                        <span>Alerta: {alert.alert_threshold}%</span>
                      </div>
                      <div className="alert-progress-bar-bg">
                        {/* Marcador de Alerta */}
                        <div 
                          className="progress-marker-line"
                          style={{ left: `${alert.alert_threshold}%` }}
                        ></div>
                        <div 
                          className="alert-progress-bar-fill"
                          style={{ 
                            width: `${Math.min(alert.percentage, 100)}%`,
                            backgroundColor: progressColor,
                            boxShadow: `0 0 8px ${progressColor}66`
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

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
            {activeAccounts.map(acc => (
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
