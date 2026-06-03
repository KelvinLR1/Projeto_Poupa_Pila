import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency } from '../../utils/formatters';
import { GlassCard } from '../../components/ui/GlassCard';
import { Button } from '../../components/ui/Button';
import { Plus, Wallet, Building2, Landmark, Check, Activity } from 'lucide-react';
import './Accounts.css';

export function Accounts() {
  const { accounts, addAccount, hideValues } = useFinance();
  const [isAdding, setIsAdding] = useState(false);
  const [newAccount, setNewAccount] = useState({ name: '', type: 'checking', color: '#10b981', initialBalance: 0 });

  const handleAdd = (e) => {
    e.preventDefault();
    if (!newAccount.name) return;
    
    addAccount(newAccount);
    setIsAdding(false);
    setNewAccount({ name: '', type: 'checking', color: '#10b981', initialBalance: 0 });
  };

  const getIconForType = (type) => {
    switch(type) {
      case 'wallet': return <Wallet size={24} />;
      case 'savings': return <Landmark size={24} />;
      case 'investment': return <Activity size={24} />;
      default: return <Building2 size={24} />;
    }
  };

  return (
    <div className="accounts-page">
      <div className="page-header">
        <div>
          <h2 className="page-title">Minhas Contas</h2>
          <p className="page-subtitle">Gerencie suas carteiras e contas bancárias.</p>
        </div>
        <div className="page-actions">
          {!isAdding && (
            <Button variant="primary" icon={<Plus size={18} />} onClick={() => setIsAdding(true)}>
              Nova Conta
            </Button>
          )}
        </div>
      </div>

      {isAdding && (
        <GlassCard className="add-account-form animate-slide-up">
          <h3>Adicionar Nova Conta</h3>
          <form onSubmit={handleAdd}>
            <div className="form-group">
              <label>Nome da Instituição / Conta</label>
              <input 
                type="text" 
                placeholder="Ex: Nubank, Bradesco, Carteira Física" 
                value={newAccount.name}
                onChange={(e) => setNewAccount({...newAccount, name: e.target.value})}
                autoFocus
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Tipo de Conta</label>
                <select 
                  value={newAccount.type}
                  onChange={(e) => setNewAccount({...newAccount, type: e.target.value})}
                >
                  <option value="checking">Conta Corrente</option>
                  <option value="savings">Poupança</option>
                  <option value="investment">Investimento</option>
                  <option value="wallet">Carteira Física</option>
                </select>
              </div>
              <div className="form-group">
                <label>Saldo Inicial (R$)</label>
                <input 
                  type="number" 
                  step="0.01"
                  value={newAccount.initialBalance}
                  onChange={(e) => setNewAccount({...newAccount, initialBalance: parseFloat(e.target.value) || 0})}
                />
              </div>
              <div className="form-group">
                <label>Cor Identificadora</label>
                <input 
                  type="color" 
                  value={newAccount.color}
                  onChange={(e) => setNewAccount({...newAccount, color: e.target.value})}
                  className="color-picker"
                />
              </div>
            </div>
            <div className="form-actions">
              <Button type="button" variant="secondary" onClick={() => setIsAdding(false)}>Cancelar</Button>
              <Button type="submit" variant="success" icon={<Check size={18} />}>Salvar Conta</Button>
            </div>
          </form>
        </GlassCard>
      )}

      <div className="accounts-grid">
        {accounts.map(acc => (
          <GlassCard key={acc.id} className="account-details-card">
            <div className="acc-card-header">
              <div 
                className="acc-icon" 
                style={{ 
                  color: acc.color,
                  background: `${acc.color}15`,
                  border: `1px solid ${acc.color}30`,
                  boxShadow: `0 0 16px ${acc.color}25`
                }}
              >
                {getIconForType(acc.type)}
              </div>
              <div className="acc-title">
                <h4>{acc.name}</h4>
                <p>
                  {acc.type === 'checking' && 'Conta Corrente'}
                  {acc.type === 'savings' && 'Poupança'}
                  {acc.type === 'investment' && 'Investimento'}
                  {acc.type === 'wallet' && 'Carteira Física'}
                </p>
              </div>
            </div>
            <div className="acc-card-body">
              <p>Saldo Atual</p>
              <h2 style={{ filter: acc.balance < 0 ? 'none' : undefined, color: acc.balance < 0 ? 'var(--accent-coral)' : undefined, WebkitTextFillColor: acc.balance < 0 ? 'var(--accent-coral)' : undefined }}>
                {formatCurrency(acc.balance, hideValues)}
              </h2>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
