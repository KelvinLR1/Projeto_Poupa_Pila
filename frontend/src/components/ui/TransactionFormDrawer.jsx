import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useFinance } from '../../context/FinanceContext';
import { Button } from './Button';
import { X, ArrowUpRight, ArrowDownRight, HelpCircle } from 'lucide-react';
import { CustomSelect } from './CustomSelect';
import { CustomDatePicker } from './CustomDatePicker';
import { maskCurrencyBRL, parseCurrencyBRL } from '../../utils/formatters';
import './TransactionFormDrawer.css';

export function TransactionFormDrawer({ onClose }) {
  const { addTransaction, accounts } = useFinance();
  const [type, setType] = useState('expense');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [accountId, setAccountId] = useState(accounts[0]?.id || '');
  const [status, setStatus] = useState('pending');
  const [isForecast, setIsForecast] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    const parsedAmount = parseCurrencyBRL(amount);
    if (parsedAmount <= 0 || !description || !category || !accountId) return;

    addTransaction({
      type,
      amount: parsedAmount,
      description,
      category,
      date,
      accountId,
      status: isForecast ? 'pending' : status,
      is_forecast: isForecast ? 1 : 0
    });

    onClose();
  };

  return createPortal(
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer-container animate-slide-left" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-header">
          <div>
            <h3>Nova Transação</h3>
            <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Preencha os dados do lançamento para atualizar seu controle financeiro.
            </p>
          </div>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        <form className="drawer-body" onSubmit={handleSubmit}>
          {/* Seção 1: Tipo e Valor */}
          <div className="drawer-section">
            <h4 className="section-title">Valor e Tipo</h4>
            <div className="form-row">
              <div className="form-group flex-1">
                <label>Tipo de Lançamento</label>
                <div className="type-selector">
                  <button 
                    type="button"
                    className={`type-btn ${type === 'expense' ? 'active-expense' : ''}`}
                    onClick={() => setType('expense')}
                  >
                    <ArrowDownRight size={18} /> Despesa
                  </button>
                  <button 
                    type="button"
                    className={`type-btn ${type === 'income' ? 'active-income' : ''}`}
                    onClick={() => setType('income')}
                  >
                    <ArrowUpRight size={18} /> Receita
                  </button>
                </div>
              </div>

              <div className="form-group flex-1 amount-group">
                <label>Valor</label>
                <div className="amount-input-wrapper">
                  <span className="currency-prefix">R$</span>
                  <input 
                    type="text" 
                    required
                    className="amount-input"
                    value={amount}
                    onChange={(e) => setAmount(maskCurrencyBRL(e.target.value))}
                    placeholder="0,00"
                    autoFocus
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Seção 2: Dados Gerais */}
          <div className="drawer-section">
            <h4 className="section-title">Dados Gerais</h4>
            <div className="form-row">
              <div className="form-group flex-2">
                <label>Descrição</label>
                <input 
                  type="text" 
                  required
                  className="form-input"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ex: Conta de Luz"
                />
              </div>
              <div className="form-group flex-1">
                <label>Categoria</label>
                <input 
                  type="text" 
                  required
                  className="form-input"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="Ex: Moradia"
                />
              </div>
            </div>

            <div className="form-row mt-16">
              <div className="form-group flex-1">
                <label>Data</label>
                <CustomDatePicker
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
              <div className="form-group flex-1">
                <label>Conta Vinculada</label>
                <CustomSelect
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  options={accounts.map(acc => ({ value: acc.id, label: acc.name }))}
                />
              </div>
            </div>
          </div>

          {/* Seção 3: Estado & Status */}
          <div className="drawer-section">
            <h4 className="section-title">Configurações & Status</h4>
            <div className="status-config-card">
              <div className="form-group checkbox-group">
                <label className="checkbox-label">
                  <input 
                    type="checkbox" 
                    checked={isForecast} 
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setIsForecast(checked);
                      if (checked) {
                        setStatus('pending');
                      }
                    }}
                  />
                  <div className="checkbox-custom"></div>
                  <div className="checkbox-text">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <strong>Marcar como Previsão (Valor Estimado)</strong>
                      <span className="tooltip-container">
                        <HelpCircle size={14} className="info-icon" />
                        <span className="tooltip-content">
                          Use esta opção se não souber o valor exato. Ela constará no fluxo de caixa e o valor real será solicitado ao quitar.
                        </span>
                      </span>
                    </div>
                  </div>
                </label>
              </div>

              <div className="status-divider"></div>

              <div className="form-group" style={{ opacity: isForecast ? 0.6 : 1, pointerEvents: isForecast ? 'none' : 'auto' }}>
                <label className="status-card-label">Status do Pagamento</label>
                <div className="status-cards-wrapper">
                  <label className={`status-card-option ${status === 'paid' && !isForecast ? 'active-paid' : ''}`}>
                    <input 
                      type="radio" 
                      name="status" 
                      value="paid" 
                      checked={status === 'paid'} 
                      disabled={isForecast}
                      onChange={(e) => setStatus(e.target.value)} 
                    />
                    <div className="radio-custom"></div>
                    <div className="radio-text">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <strong>Já Pago (Efetivado)</strong>
                        <span className="tooltip-container">
                          <HelpCircle size={13} className="info-icon" />
                          <span className="tooltip-content">
                            O saldo será atualizado imediatamente na conta.
                          </span>
                        </span>
                      </div>
                    </div>
                  </label>

                  <label className={`status-card-option ${status === 'pending' || isForecast ? 'active-pending' : ''}`}>
                    <input 
                      type="radio" 
                      name="status" 
                      value="pending" 
                      checked={status === 'pending' || isForecast} 
                      disabled={isForecast}
                      onChange={(e) => setStatus(e.target.value)} 
                    />
                    <div className="radio-custom"></div>
                    <div className="radio-text">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <strong>A Pagar / Pendente</strong>
                        <span className="tooltip-container">
                          <HelpCircle size={13} className="info-icon" />
                          <span className="tooltip-content">
                            O lançamento aguardará quitação futura.
                          </span>
                        </span>
                      </div>
                    </div>
                  </label>
                </div>
                {isForecast && (
                  <p className="forecast-notice">
                    * Lançamentos de previsão são necessariamente salvos como pendentes.
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="drawer-footer">
            <Button variant="secondary" onClick={onClose} type="button">Cancelar</Button>
            <Button variant="primary" type="submit">Salvar Transação</Button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
