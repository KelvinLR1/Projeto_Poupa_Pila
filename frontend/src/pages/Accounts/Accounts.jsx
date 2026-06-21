import React, { useState, useEffect, useRef } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency, maskCurrencyBRL, parseCurrencyBRL } from '../../utils/formatters';
import { GlassCard } from '../../components/ui/GlassCard';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { AccountEditModal } from '../../components/ui/AccountEditModal';
import { Plus, Wallet, Building2, Landmark, Check, Activity, Pencil, EyeOff, Eye, ArrowLeftRight } from 'lucide-react';
import { CustomSelect } from '../../components/ui/CustomSelect';
import { TransferModal } from '../../components/ui/TransferModal';
import './Accounts.css';

const PRESET_COLORS = [
  '#10b981', '#f43f5e', '#3b82f6', '#8b5cf6',
  '#f59e0b', '#0ea5e9', '#ec4899', '#64748b'
];

export function Accounts() {
  const { accounts, addAccount, toggleAccountStatus, hideValues } = useFinance();
  const [isAdding, setIsAdding]           = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [newAccount, setNewAccount]       = useState({ name: '', type: 'checking', color: '#10b981', initialBalance: '' });
  const [animatingAccountId, setAnimatingAccountId] = useState(null);

  const handleToggleStatus = (id) => {
    setAnimatingAccountId(id);
    setTimeout(() => {
      toggleAccountStatus(id);
      setAnimatingAccountId(null);
    }, 300);
  };

  const inputRef = useRef(null);

  useEffect(() => {
    if (isAdding && inputRef.current) {
      const timer = setTimeout(() => {
        inputRef.current.focus();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isAdding]);

  const handleAdd = (e) => {
    e.preventDefault();
    if (!newAccount.name) return;
    const parsedBalance = parseCurrencyBRL(newAccount.initialBalance);
    addAccount({ ...newAccount, initialBalance: parsedBalance });
    setIsAdding(false);
    setNewAccount({ name: '', type: 'checking', color: '#10b981', initialBalance: '' });
  };

  const getIconForType = (type) => {
    switch (type) {
      case 'wallet':     return <Wallet size={24} />;
      case 'savings':    return <Landmark size={24} />;
      case 'investment': return <Activity size={24} />;
      default:           return <Building2 size={24} />;
    }
  };

  const TYPE_LABELS = {
    checking:   'Conta Corrente',
    savings:    'Poupança',
    investment: 'Investimento',
    wallet:     'Carteira Física'
  };

  const activeAccounts   = accounts.filter(a => a.active !== false);
  const inactiveAccounts = accounts.filter(a => a.active === false);

  const renderCard = (acc) => {
    const isInactive = acc.active === false;
    const isAnimating = acc.id === animatingAccountId;

    return (
      <GlassCard key={acc.id} className={`account-details-card ${isInactive ? 'acc-inactive' : ''} ${isAnimating ? 'is-toggling-out' : ''}`}>
        {/* Header do card */}
        <div className="acc-card-header">
          <div
            className="acc-icon"
            style={{
              color: isInactive ? 'var(--text-muted)' : acc.color,
              background: isInactive ? 'rgba(255,255,255,0.03)' : `${acc.color}15`,
              border: `1px solid ${isInactive ? 'rgba(255,255,255,0.07)' : acc.color + '30'}`,
              boxShadow: isInactive ? 'none' : `0 0 16px ${acc.color}25`
            }}
          >
            {getIconForType(acc.type)}
          </div>
          <div className="acc-title" style={{ flex: 1 }}>
            <h4>{acc.name}</h4>
            <p>{TYPE_LABELS[acc.type] || 'Conta'}</p>
          </div>

          {/* Ações do card */}
          <div className="acc-card-actions">
            <button
              className="acc-action-btn"
              title="Editar conta"
              onClick={() => setEditingAccount(acc)}
            >
              <Pencil size={15} />
            </button>
            <button
              className={`acc-action-btn ${isInactive ? 'acc-action-activate' : 'acc-action-deactivate'}`}
              title={isInactive ? 'Reativar conta' : 'Inativar conta'}
              onClick={() => handleToggleStatus(acc.id)}
            >
              {isInactive ? <Eye size={15} /> : <EyeOff size={15} />}
            </button>
          </div>
        </div>

        {/* Saldo */}
        <div className="acc-card-body">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <p style={{ margin: 0 }}>Saldo Atual</p>
            {isInactive && <Badge variant="default">Inativa</Badge>}
          </div>
          <h2
            style={{
              color: isInactive ? 'var(--text-muted)'
                : acc.balance < 0 ? 'var(--accent-coral)' : undefined,
              WebkitTextFillColor: isInactive ? 'var(--text-muted)'
                : acc.balance < 0 ? 'var(--accent-coral)' : undefined,
              opacity: isInactive ? 0.5 : 1
            }}
          >
            {formatCurrency(acc.balance, hideValues)}
          </h2>
        </div>
      </GlassCard>
    );
  };

  return (
    <div className="accounts-page">
      <div className="page-header">
        <div>
          <h2 className="page-title">Minhas Contas</h2>
          <p className="page-subtitle">Gerencie suas carteiras e contas bancárias.</p>
        </div>
        <div className="page-actions" style={{ display: 'flex', gap: '12px' }}>
          <Button variant="secondary" icon={<ArrowLeftRight size={18} />} onClick={() => setIsTransferring(true)}>
            Transferir Saldo
          </Button>
          {!isAdding && (
            <Button variant="primary" icon={<Plus size={18} />} onClick={() => setIsAdding(true)}>
              Nova Conta
            </Button>
          )}
        </div>
      </div>

      {/* Formulário de nova conta */}
      <div className={`add-account-wrapper ${isAdding ? 'open' : ''}`}>
        <div className="add-account-inner">
          <GlassCard className="add-account-form">
            <h3>Adicionar Nova Conta</h3>
            <form onSubmit={handleAdd}>
              <div className="form-group">
                <label>Nome da Instituição / Conta</label>
                <input
                  ref={inputRef}
                  type="text"
                  className="form-input"
                  placeholder="Ex: Nubank, Bradesco, Carteira Física"
                  value={newAccount.name}
                  onChange={(e) => setNewAccount({ ...newAccount, name: e.target.value })}
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Tipo de Conta</label>
                  <CustomSelect
                    value={newAccount.type}
                    onChange={(e) => setNewAccount({ ...newAccount, type: e.target.value })}
                    options={[
                      { value: 'checking', label: 'Conta Corrente' },
                      { value: 'savings', label: 'Poupança' },
                      { value: 'investment', label: 'Investimento' },
                      { value: 'wallet', label: 'Carteira Física' }
                    ]}
                  />
                </div>
                <div className="form-group">
                  <label>Saldo Inicial (R$)</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newAccount.initialBalance}
                    onChange={(e) => setNewAccount({ ...newAccount, initialBalance: maskCurrencyBRL(e.target.value) })}
                    placeholder="0,00"
                  />
                </div>
                <div className="form-group">
                  <label>Cor Identificadora</label>
                  <div className="color-palette-row">
                    {PRESET_COLORS.map(c => (
                      <button 
                        key={c}
                        type="button"
                        className={`color-swatch-btn ${newAccount.color === c ? 'active' : ''}`}
                        style={{ backgroundColor: c }}
                        onClick={() => setNewAccount({ ...newAccount, color: c })}
                      />
                    ))}
                    <div className="custom-color-wrapper" title="Cor Personalizada">
                      <input 
                        type="color" 
                        value={newAccount.color}
                        onChange={(e) => setNewAccount({ ...newAccount, color: e.target.value })}
                        className="custom-color-input-hidden"
                      />
                      <button type="button" className="custom-color-btn" style={{ backgroundColor: PRESET_COLORS.includes(newAccount.color) ? 'transparent' : newAccount.color, borderStyle: PRESET_COLORS.includes(newAccount.color) ? 'dashed' : 'solid', borderColor: PRESET_COLORS.includes(newAccount.color) ? 'rgba(255,255,255,0.4)' : '#fff' }}>
                        {PRESET_COLORS.includes(newAccount.color) ? '+' : ''}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <div className="form-actions">
                <Button type="button" variant="secondary" onClick={() => setIsAdding(false)}>Cancelar</Button>
                <Button type="submit" variant="success" icon={<Check size={18} />}>Salvar Conta</Button>
              </div>
            </form>
          </GlassCard>
        </div>
      </div>

      {/* Contas Ativas */}
      {activeAccounts.length > 0 && (
        <section>
          <div className="accounts-grid">
            {activeAccounts.map(renderCard)}
          </div>
        </section>
      )}

      {/* Contas Inativas */}
      {inactiveAccounts.length > 0 && (
        <section>
          <h3 className="acc-section-title">
            <EyeOff size={15} />
            Contas Inativas ({inactiveAccounts.length})
          </h3>
          <div className="accounts-grid">
            {inactiveAccounts.map(renderCard)}
          </div>
        </section>
      )}

      {/* Modal de edição */}
      {editingAccount && (
        <AccountEditModal
          account={editingAccount}
          onClose={() => setEditingAccount(null)}
        />
      )}

      {/* Modal de transferência */}
      {isTransferring && (
        <TransferModal
          onClose={() => setIsTransferring(false)}
        />
      )}
    </div>
  );
}
