import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useFinance } from '../../context/FinanceContext';
import { Button } from './Button';
import { X, ArrowUpRight, ArrowDownRight, HelpCircle, AlertCircle } from 'lucide-react';
import { CustomSelect } from './CustomSelect';
import { CustomDatePicker } from './CustomDatePicker';
import { maskCurrencyBRL, parseCurrencyBRL } from '../../utils/formatters';
import './TransactionFormDrawer.css';

function addMonthsHelper(dateStr, months) {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1 + months, 1);
  const maxDays = new Date(year, month + months, 0).getDate();
  d.setDate(Math.min(day, maxDays));
  
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function TransactionFormDrawer({ onClose }) {
  const { addTransaction, accounts, categories, addCategory } = useFinance();
  const [type, setType] = useState('expense');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [accountId, setAccountId] = useState(accounts[0]?.id || '');
  const [status, setStatus] = useState('pending');
  const [isForecast, setIsForecast] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isInstallment, setIsInstallment] = useState(false);
  const [installmentsCount, setInstallmentsCount] = useState('2');
  const [installmentValueMode, setInstallmentValueMode] = useState('total');
  const [installments, setInstallments] = useState([]);
  
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatRuleType, setNewCatRuleType] = useState('want');
  const [catError, setCatError] = useState('');

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 280);
  };

  const recalculateInstallmentsSync = (totalAmount, countStr, valueMode, baseDate) => {
    const count = parseInt(countStr, 10);
    if (isNaN(count) || count < 2 || totalAmount <= 0) {
      setInstallments([]);
      return;
    }

    const isTotalMode = valueMode === 'total';
    const baseInstallmentAmount = isTotalMode 
      ? Math.round((totalAmount / count) * 100) / 100
      : totalAmount;

    const newInstallments = [];
    for (let i = 1; i <= count; i++) {
      let currentAmount = baseInstallmentAmount;
      if (isTotalMode && i === count) {
        currentAmount = Math.round((totalAmount - (baseInstallmentAmount * (count - 1))) * 100) / 100;
      }

      const instDate = addMonthsHelper(baseDate, i - 1);

      newInstallments.push({
        index: i,
        date: instDate,
        amount: currentAmount,
        maskedAmount: maskCurrencyBRL(currentAmount.toFixed(2))
      });
    }

    setInstallments(newInstallments);
  };

  const handleAmountChange = (val) => {
    const masked = maskCurrencyBRL(val);
    setAmount(masked);
    if (isInstallment) {
      const totalAmount = parseCurrencyBRL(masked);
      recalculateInstallmentsSync(totalAmount, installmentsCount, installmentValueMode, date);
    }
  };

  const handleIsInstallmentChange = (checked) => {
    setIsInstallment(checked);
    if (checked) {
      const totalAmount = parseCurrencyBRL(amount);
      recalculateInstallmentsSync(totalAmount, installmentsCount, installmentValueMode, date);
    } else {
      setInstallments([]);
    }
  };

  const handleInstallmentsCountChange = (val) => {
    setInstallmentsCount(val);
    if (isInstallment) {
      const totalAmount = parseCurrencyBRL(amount);
      recalculateInstallmentsSync(totalAmount, val, installmentValueMode, date);
    }
  };

  const handleValueModeChange = (val) => {
    setInstallmentValueMode(val);
    if (isInstallment) {
      const totalAmount = parseCurrencyBRL(amount);
      recalculateInstallmentsSync(totalAmount, installmentsCount, val, date);
    }
  };

  const handleDateChange = (val) => {
    setDate(val);
    if (isInstallment) {
      const totalAmount = parseCurrencyBRL(amount);
      recalculateInstallmentsSync(totalAmount, installmentsCount, installmentValueMode, val);
    }
  };

  const handleAdjustTotalToSum = () => {
    const sum = installments.reduce((acc, inst) => acc + inst.amount, 0);
    setAmount(maskCurrencyBRL(sum.toFixed(2)));
  };

  const handleRedistribute = () => {
    const totalAmount = parseCurrencyBRL(amount);
    recalculateInstallmentsSync(totalAmount, installmentsCount, installmentValueMode, date);
  };

  const handleInstallmentChange = (idx, field, value) => {
    const newInst = [...installments];
    if (field === 'amount') {
      const masked = maskCurrencyBRL(value);
      newInst[idx].maskedAmount = masked;
      newInst[idx].amount = parseCurrencyBRL(masked);
    } else if (field === 'date') {
      newInst[idx].date = value;
    }
    setInstallments(newInst);
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    setCatError('');
    if (!newCatName.trim()) return;

    try {
      await addCategory({
        name: newCatName.trim(),
        type: type,
        rule_type: type === 'expense' ? newCatRuleType : null
      });
      setCategory(newCatName.trim());
      setIsAddingCategory(false);
      setNewCatName('');
    } catch (err) {
      setCatError(err.message || 'Erro ao criar categoria.');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const parsedAmount = parseCurrencyBRL(amount);
    if (parsedAmount <= 0 || !description || !category || !accountId) return;

    const hasEmptyInst = isInstallment && installments.some(inst => inst.amount <= 0);
    const sum = installments.reduce((acc, inst) => acc + inst.amount, 0);
    const hasDiff = isInstallment && installmentValueMode === 'total' && Math.abs(sum - parsedAmount) > 0.01;
    if (hasEmptyInst || hasDiff) return;

    const actualIsInstallment = isInstallment && installments && installments.length >= 2;

    addTransaction({
      type,
      amount: parsedAmount,
      description,
      category,
      date,
      accountId,
      status: isForecast ? 'pending' : status,
      is_forecast: isForecast ? 1 : 0,
      isInstallment: actualIsInstallment,
      installments: actualIsInstallment ? installments.map(i => ({ index: i.index, date: i.date, amount: i.amount })) : null
    });

    handleClose();
  };

  const totalAmountVal = parseCurrencyBRL(amount);
  const sumAmountVal = installments.reduce((acc, inst) => acc + inst.amount, 0);
  const hasInstallmentDifference = isInstallment && installmentValueMode === 'total' && Math.abs(sumAmountVal - totalAmountVal) > 0.01;
  const hasEmptyInstallment = isInstallment && installments.some(inst => inst.amount <= 0);
  const isSubmitDisabled = hasInstallmentDifference || hasEmptyInstallment;

  return createPortal(
    <div className={`drawer-overlay ${isClosing ? 'closing' : ''}`} onClick={handleClose}>
      <div className={`drawer-container ${isClosing ? 'animate-slide-out' : 'animate-slide-left'}`} onClick={(e) => e.stopPropagation()}>
        <div className="drawer-header">
          <div>
            <h3>Nova Transação</h3>
            <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Preencha os dados do lançamento para atualizar seu controle financeiro.
            </p>
          </div>
          <button className="close-btn" onClick={handleClose}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="drawer-form-wrapper">
          <div className="drawer-body">
            {/* Seção 1: Tipo, Valor e Parcelamento */}
            <div className="drawer-section">
              <h4 className="drawer-section-title">Tipo da Transação</h4>
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
                      onChange={(e) => handleAmountChange(e.target.value)}
                      placeholder="0,00"
                      autoFocus
                    />
                  </div>
                </div>
              </div>

              <div className="form-group checkbox-group mt-16">
                <label className="checkbox-label">
                  <input 
                    type="checkbox" 
                    checked={isInstallment} 
                    onChange={(e) => handleIsInstallmentChange(e.target.checked)}
                  />
                  <div className="checkbox-custom"></div>
                  <div className="checkbox-text">
                    <strong>Lançamento Parcelado</strong>
                  </div>
                </label>
              </div>

              <div className={`installment-container ${isInstallment ? 'open' : ''}`}>
                <div className="installment-content">
                  <div className="installment-fields">
                    <div className="form-row">
                      <div className="form-group flex-1">
                        <label>Número de Parcelas</label>
                        <input
                          type="number"
                          min="2"
                          max="72"
                          required={isInstallment}
                          className="form-input"
                          value={installmentsCount}
                          onChange={(e) => handleInstallmentsCountChange(e.target.value)}
                        />
                      </div>
                      <div className="form-group flex-1">
                        <label>Divisão do Valor</label>
                        <CustomSelect
                          value={installmentValueMode}
                          onChange={(e) => handleValueModeChange(e.target.value)}
                          options={[
                            { value: 'total', label: 'Dividir o valor total' },
                            { value: 'per_installment', label: 'Valor fixo por parcela' }
                          ]}
                        />
                      </div>
                    </div>

                    <div className={`installments-preview-wrapper ${installments.length > 0 ? 'expanded' : ''}`}>
                      <div className="installments-preview-list">
                        <label className="preview-list-title">Ajuste das Parcelas</label>
                        <div className="installments-preview-header">
                          <span>Parcela</span>
                          <span>Vencimento</span>
                          <span>Valor (R$)</span>
                        </div>
                        {installments.map((inst, idx) => (
                          <div key={idx} className="installment-preview-row">
                            <span className="installment-num">#{inst.index}</span>
                            <div className="installment-date-col">
                              <CustomDatePicker
                                value={inst.date}
                                onChange={(e) => handleInstallmentChange(idx, 'date', e.target.value)}
                              />
                            </div>
                            <div className="installment-amount-col">
                              <div className={`amount-input-wrapper sm ${inst.amount <= 0 ? 'has-error' : ''}`}>
                                <span className="currency-prefix">R$</span>
                                <input
                                  type="text"
                                  className="amount-input sm-input"
                                  value={inst.maskedAmount}
                                  onChange={(e) => handleInstallmentChange(idx, 'amount', e.target.value)}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {hasEmptyInstallment && (
                      <div className="installment-warning mt-12">
                        <div className="warning-message-row">
                          <AlertCircle size={16} />
                          <span>Por favor, preencha o valor de todas as parcelas (deve ser maior que R$ 0,00).</span>
                        </div>
                      </div>
                    )}

                    {!hasEmptyInstallment && hasInstallmentDifference && (
                      <div className="installment-warning mt-12">
                        <div className="warning-message-row">
                          <AlertCircle size={16} />
                          <span>
                            A soma das parcelas (<strong>R$ {maskCurrencyBRL(sumAmountVal.toFixed(2))}</strong>) difere do valor total (<strong>R$ {maskCurrencyBRL(totalAmountVal.toFixed(2))}</strong>).
                          </span>
                        </div>
                        <div className="warning-actions">
                          <button type="button" onClick={handleAdjustTotalToSum} className="warning-action-btn">
                            Ajustar Valor Total
                          </button>
                          <button type="button" onClick={handleRedistribute} className="warning-action-btn">
                            Refazer Divisão
                          </button>
                        </div>
                      </div>
                    )}

                    {status === 'paid' && !isForecast && (
                      <p className="installment-notice mt-12">
                        * A primeira parcela será criada como Paga (efetivada) e as {installments.length - 1 || 'demais'} parcelas seguintes como Pendentes.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Seção 2: Dados Gerais */}
            <div className="drawer-section">
              <h4 className="drawer-section-title">Detalhes da Transação</h4>
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
                <div className="form-group flex-1" style={{ position: 'relative' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label>Categoria</label>
                    {!isAddingCategory ? (
                      <button
                        type="button"
                        onClick={() => {
                          setIsAddingCategory(true);
                          setCatError('');
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--accent-emerald)',
                          fontSize: '0.78rem',
                          fontWeight: '600',
                          cursor: 'pointer',
                          padding: '0 0 4px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          transition: 'opacity 0.2s'
                        }}
                        className="btn-add-cat-toggle"
                      >
                        + Nova Categoria
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setIsAddingCategory(false)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--text-muted)',
                          fontSize: '0.78rem',
                          fontWeight: '600',
                          cursor: 'pointer',
                          padding: '0 0 4px'
                        }}
                      >
                        Cancelar
                      </button>
                    )}
                  </div>

                  {!isAddingCategory ? (
                    <>
                      <CustomSelect
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        placeholder="Selecione uma categoria..."
                        options={categories
                          .filter(c => c.active !== false && c.type === type)
                          .map(c => ({ value: c.name, label: c.name }))}
                      />
                    </>
                  ) : (
                    <div className="inline-add-category-box" style={{
                      padding: '12px',
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      animation: 'slideDownFast 0.2s ease-out'
                    }}>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <input
                          type="text"
                          className="form-input sm-input"
                          style={{ height: '36px', padding: '6px 10px', fontSize: '0.85rem', flex: 1 }}
                          placeholder="Nome da categoria"
                          value={newCatName}
                          onChange={(e) => setNewCatName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleCreateCategory(e);
                            }
                          }}
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={handleCreateCategory}
                          disabled={!newCatName.trim()}
                          style={{
                            height: '36px',
                            padding: '0 12px',
                            background: 'var(--accent-emerald)',
                            color: '#000',
                            borderRadius: '6px',
                            fontWeight: '700',
                            fontSize: '0.8rem',
                            cursor: newCatName.trim() ? 'pointer' : 'not-allowed',
                            opacity: newCatName.trim() ? 1 : 0.6
                          }}
                        >
                          Salvar
                        </button>
                      </div>

                      {type === 'expense' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Classificação 50/30/20</span>
                          <div style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.02)', padding: '2px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.04)' }}>
                            <button
                              type="button"
                              onClick={() => setNewCatRuleType('necessity')}
                              style={{
                                flex: 1,
                                fontSize: '0.75rem',
                                padding: '4px 2px',
                                borderRadius: '4px',
                                background: newCatRuleType === 'necessity' ? 'rgba(255,255,255,0.08)' : 'transparent',
                                color: newCatRuleType === 'necessity' ? 'var(--text-primary)' : 'var(--text-muted)',
                                fontWeight: newCatRuleType === 'necessity' ? '600' : '400'
                              }}
                            >
                              Meta 50%
                            </button>
                            <button
                              type="button"
                              onClick={() => setNewCatRuleType('want')}
                              style={{
                                flex: 1,
                                fontSize: '0.75rem',
                                padding: '4px 2px',
                                borderRadius: '4px',
                                background: newCatRuleType === 'want' ? 'rgba(255,255,255,0.08)' : 'transparent',
                                color: newCatRuleType === 'want' ? 'var(--text-primary)' : 'var(--text-muted)',
                                fontWeight: newCatRuleType === 'want' ? '600' : '400'
                              }}
                            >
                              Meta 30%
                            </button>
                            <button
                              type="button"
                              onClick={() => setNewCatRuleType('investment')}
                              style={{
                                flex: 1,
                                fontSize: '0.75rem',
                                padding: '4px 2px',
                                borderRadius: '4px',
                                background: newCatRuleType === 'investment' ? 'rgba(255,255,255,0.08)' : 'transparent',
                                color: newCatRuleType === 'investment' ? 'var(--text-primary)' : 'var(--text-muted)',
                                fontWeight: newCatRuleType === 'investment' ? '600' : '400'
                              }}
                            >
                              Meta 20%
                            </button>
                          </div>
                        </div>
                      )}

                      {catError && (
                        <span style={{ fontSize: '0.75rem', color: 'var(--accent-coral)', display: 'block' }}>{catError}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="form-row mt-16">
                <div className="form-group flex-1">
                  <label>Data</label>
                  <CustomDatePicker
                    value={date}
                    onChange={(e) => handleDateChange(e.target.value)}
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
          </div>

          <div className="drawer-footer">
            <Button variant="secondary" onClick={handleClose} type="button">Cancelar</Button>
            <Button variant="primary" type="submit" disabled={isSubmitDisabled}>Salvar Transação</Button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
