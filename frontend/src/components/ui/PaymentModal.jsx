import React, { useState, useRef, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { formatCurrency, maskCurrencyBRL, parseCurrencyBRL } from '../../utils/formatters';
import { Button } from '../ui/Button';
import { Check, Split, X } from 'lucide-react';
import { CustomSelect } from './CustomSelect';
import { CustomDatePicker } from './CustomDatePicker';
import './PaymentModal.css';

export function PaymentModal({ transaction, onConfirm, onCancel, loans = [] }) {
  const [isClosing, setIsClosing] = useState(false);
  const containerRef = useRef(null);
  const lastHeightRef = useRef(null);

  useLayoutEffect(() => {
    if (containerRef.current) {
      const element = containerRef.current;
      const currentAnimatedHeight = element.offsetHeight;
      
      const prevTransition = element.style.transition;
      element.style.transition = 'none';
      element.style.height = '';
      const newHeight = element.offsetHeight;
      
      if (lastHeightRef.current !== null && lastHeightRef.current !== newHeight) {
        element.style.height = `${currentAnimatedHeight}px`;
        element.offsetHeight; // force reflow
        
        element.style.transition = 'height 300ms cubic-bezier(0.16, 1, 0.3, 1)';
        element.style.height = `${newHeight}px`;
        
        const timer = setTimeout(() => {
          // Verify if we are still at the target height before resetting
          // This prevents resetting if another animation started
          if (element.style.height === `${newHeight}px`) {
            element.style.height = '';
            element.style.transition = '';
          }
        }, 320);
        
        lastHeightRef.current = newHeight;
        return () => clearTimeout(timer);
      } else {
        element.style.transition = prevTransition;
        // Don't restore height if we are not animating, let it be auto
        if (element.style.height !== '') {
           element.style.height = '';
        }
        lastHeightRef.current = newHeight;
      }
    }
  });
  const settlements = transaction.settlements || [];
  const alreadyPaid = settlements.reduce((acc, s) => acc + s.amount, 0);
  const remaining = transaction.amount - alreadyPaid;

  const isForecast = transaction.is_forecast === 1;

  const [actualAmount, setActualAmount] = useState(maskCurrencyBRL(transaction.amount));
  const [amount, setAmount] = useState(maskCurrencyBRL(remaining));

  const [asLoan, setAsLoan] = useState(false);
  const [loanMode, setLoanMode] = useState(loans.length > 0 ? 'existing' : 'new');
  const [selectedLoanId, setSelectedLoanId] = useState('');
  const [loanCounterpart, setLoanCounterpart] = useState('');
  const [loanDueDate, setLoanDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [loanTitle, setLoanTitle] = useState('');

  const [interest, setInterest] = useState('');
  const [discount, setDiscount] = useState('');
  const [showExtras, setShowExtras] = useState(false);

  const parsedActualAmount = parseCurrencyBRL(actualAmount);
  const parsedAmount = parseCurrencyBRL(amount);
  const parsedInterest = parseCurrencyBRL(interest) || 0;
  const parsedDiscount = parseCurrencyBRL(discount) || 0;
  const effectiveAmount = parsedAmount + parsedInterest - parsedDiscount;

  const currentRemaining = isForecast ? Math.max(0, parsedActualAmount - alreadyPaid) : remaining;

  const isPartial = parsedAmount < currentRemaining && parsedAmount > 0;
  
  const isLoanValid = !asLoan || (
    (loanMode === 'existing' && selectedLoanId !== '') ||
    (loanMode === 'new' && loanCounterpart.trim() !== '')
  );

  const isValid = isForecast
    ? (parsedActualAmount > 0 && parsedAmount > 0 && parsedAmount <= currentRemaining && effectiveAmount >= 0 && isLoanValid)
    : (parsedAmount > 0 && parsedAmount <= remaining && effectiveAmount >= 0 && isLoanValid);

  const handleActualAmountChange = (val) => {
    const maskedVal = maskCurrencyBRL(val);
    setActualAmount(maskedVal);
    const parsedVal = parseCurrencyBRL(maskedVal);
    const newRemaining = Math.max(0, parsedVal - alreadyPaid);
    setAmount(maskCurrencyBRL(newRemaining));
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onCancel();
    }, 180);
  };

  const handleConfirm = () => {
    if (!isValid) return;
    setIsClosing(true);
    setTimeout(() => {
      onConfirm({
        transaction,
        paidAmount: parsedAmount,
        actualAmount: isForecast ? parsedActualAmount : null,
        interest: parsedInterest > 0 ? parsedInterest : null,
        discount: parsedDiscount > 0 ? parsedDiscount : null,
        asLoan,
        loanId: asLoan && loanMode === 'existing' ? selectedLoanId : null,
        loanCounterpart: asLoan && loanMode === 'new' ? loanCounterpart : null,
        loanDueDate: asLoan && loanMode === 'new' ? loanDueDate : null,
        loanTitle: asLoan && loanMode === 'new' ? loanTitle : null
      });
    }, 180);
  };

  return createPortal(
    <div className={`modal-overlay ${isClosing ? 'closing' : ''}`} onClick={handleClose}>
      <div ref={containerRef} className="modal-container payment-modal-container animate-slide-up" onClick={(e) => e.stopPropagation()}>
        
        <div className="modal-header">
          <div className="modal-header-content">
            <h3>Dar Baixa no Lançamento</h3>
            <p>{transaction.description}</p>
          </div>
          <button className="close-btn" onClick={handleClose} title="Fechar">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {isForecast && (
            <div className="partial-info" style={{ background: 'rgba(139, 92, 246, 0.08)', border: '1px solid rgba(139, 92, 246, 0.2)', color: '#c084fc', marginBottom: '15px' }}>
              <Split size={16} style={{ color: '#c084fc' }} />
              <div>
                <strong>Lançamento de Previsão</strong>
                <p style={{ margin: 0, fontSize: '0.8rem' }}>
                  Este lançamento possui um valor estimado. Por favor, insira o valor real/final no campo abaixo para atualizar o lançamento e quitá-lo.
                </p>
              </div>
            </div>
          )}

          <div className="tx-summary">
            <div className="tx-summary-row">
              <span>{isForecast ? 'Valor estimado original' : 'Valor original'}</span>
              <strong>{formatCurrency(transaction.amount)}</strong>
            </div>
            {alreadyPaid > 0 && (
              <div className="tx-summary-row tx-summary-row--muted">
                <span>Já pago anteriormente</span>
                <span>{formatCurrency(alreadyPaid)}</span>
              </div>
            )}
            <div className="tx-summary-row tx-summary-row--divider">
              <span>Saldo pendente</span>
              <strong className="text-coral">{formatCurrency(currentRemaining)}</strong>
            </div>
          </div>

          {isForecast && (
            <div className="amount-input-group" style={{ marginBottom: '15px' }}>
              <label>Valor Real / Final (Total do Lançamento)</label>
              <div className="amount-input-wrapper" style={{ borderColor: 'rgba(139, 92, 246, 0.4)' }}>
                <span className="currency-prefix" style={{ color: '#a78bfa' }}>R$</span>
                <input
                  type="text"
                  value={actualAmount}
                  onChange={(e) => handleActualAmountChange(e.target.value)}
                  autoFocus
                  className="amount-input"
                  style={{ color: '#f8fafc' }}
                />
              </div>
            </div>
          )}

          <div className="amount-input-group">
            <label>{isForecast ? 'Valor pago nesta quitação' : 'Valor que está sendo pago'}</label>
            <div className="amount-input-wrapper">
              <span className="currency-prefix">R$</span>
              <input
                type="text"
                value={amount}
                onChange={(e) => setAmount(maskCurrencyBRL(e.target.value))}
                autoFocus={!isForecast}
                className="amount-input"
              />
            </div>
          </div>

          <div style={{ marginTop: '16px', marginBottom: '16px' }}>
            <button 
              className="phi-btn" 
              onClick={() => setShowExtras(!showExtras)}
              style={{ width: '100%', padding: '8px', textAlign: 'center', background: 'rgba(255,255,255,0.03)' }}
            >
              {showExtras ? 'Ocultar Acréscimos / Descontos' : 'Adicionar Juros / Multa ou Desconto'}
            </button>
            
            {showExtras && (
              <div className="animate-slide-up" style={{ display: 'flex', gap: '16px', marginTop: '16px' }}>
                <div className="amount-input-group" style={{ flex: 1 }}>
                  <label>Juros / Multa</label>
                  <div className="amount-input-wrapper">
                    <span className="currency-prefix">R$</span>
                    <input
                      type="text"
                      value={interest}
                      onChange={(e) => setInterest(maskCurrencyBRL(e.target.value))}
                      className="amount-input"
                    />
                  </div>
                </div>
                <div className="amount-input-group" style={{ flex: 1 }}>
                  <label>Desconto</label>
                  <div className="amount-input-wrapper">
                    <span className="currency-prefix">R$</span>
                    <input
                      type="text"
                      value={discount}
                      onChange={(e) => setDiscount(maskCurrencyBRL(e.target.value))}
                      className="amount-input"
                    />
                  </div>
                </div>
              </div>
            )}

            {(parsedInterest > 0 || parsedDiscount > 0) && (
              <div className="animate-fade-in" style={{ marginTop: '16px', padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                  <span>Valor que abate a conta:</span>
                  <span>{formatCurrency(parsedAmount)}</span>
                </div>
                {parsedInterest > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--accent-coral)', marginBottom: '8px' }}>
                    <span>+ Juros / Multa:</span>
                    <span>{formatCurrency(parsedInterest)}</span>
                  </div>
                )}
                {parsedDiscount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--accent-emerald)', marginBottom: '8px' }}>
                    <span>- Desconto:</span>
                    <span>{formatCurrency(parsedDiscount)}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', color: 'var(--text-primary)', fontWeight: 'bold', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                  <span>Total movimentado no banco:</span>
                  <span>{formatCurrency(effectiveAmount)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Opção de Quitar via Empréstimo */}
          <div className="loan-checkbox-container">
            <label className="checkbox-label">
              <input 
                type="checkbox" 
                checked={asLoan} 
                onChange={(e) => setAsLoan(e.target.checked)} 
              />
              <div className="checkbox-custom"></div>
              <div className="checkbox-text">
                <strong>Quitar via Empréstimo</strong>
                <span>O valor será adicionado a um empréstimo em vez de debitar/creditar sua conta.</span>
              </div>
            </label>
          </div>

          {asLoan && (
            <div className="loan-fields-container animate-fade-in">
              <div className="loan-mode-selector">
                <label className={`loan-mode-option ${loanMode === 'existing' ? 'active' : ''} ${loans.length === 0 ? 'disabled' : ''}`}>
                  <input
                    type="radio"
                    name="loanMode"
                    value="existing"
                    disabled={loans.length === 0}
                    checked={loanMode === 'existing'}
                    onChange={() => setLoanMode('existing')}
                  />
                  <span className="radio-text">Vincular a Empréstimo Existente</span>
                </label>
                <label className={`loan-mode-option ${loanMode === 'new' ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="loanMode"
                    value="new"
                    checked={loanMode === 'new'}
                    onChange={() => setLoanMode('new')}
                  />
                  <span className="radio-text">Criar Novo Empréstimo</span>
                </label>
              </div>

              {loanMode === 'existing' && loans.length > 0 && (
                <div className="amount-input-group mt-12">
                  <label>Selecione o Empréstimo</label>
                  <CustomSelect
                    value={selectedLoanId}
                    onChange={(e) => setSelectedLoanId(e.target.value)}
                    options={[
                      { value: '', label: 'Selecione um empréstimo...' },
                      ...loans.map(l => {
                        const balance = l.totalAmount - l.paidAmount;
                        const labelType = l.type === 'lent' ? 'A Receber' : 'A Pagar';
                        const displayBalance = balance > 0 ? `(Saldo: ${formatCurrency(balance)} ${labelType})` : '(Quitado)';
                        return {
                          value: l.id,
                          label: `${l.counterpart} ${displayBalance}`
                        };
                      })
                    ]}
                  />
                </div>
              )}

              {loanMode === 'new' && (
                <div className="new-loan-fields mt-12">
                  <div className="amount-input-group">
                    <label>Nome do Contato / Pessoa</label>
                    <input
                      type="text"
                      className="form-input"
                      value={loanCounterpart}
                      onChange={(e) => setLoanCounterpart(e.target.value)}
                      placeholder="Ex: Carlos Silva"
                    />
                  </div>
                  <div className="amount-input-group mt-12">
                    <label>Identificação / Título (Opcional)</label>
                    <input
                      type="text"
                      className="form-input"
                      value={loanTitle}
                      onChange={(e) => setLoanTitle(e.target.value)}
                      placeholder="Ex: Empréstimo para reforma, Viagem, etc."
                    />
                  </div>
                  <div className="amount-input-group mt-12">
                    <label>Vencimento do Empréstimo (Opcional)</label>
                    <CustomDatePicker
                      value={loanDueDate}
                      onChange={(e) => setLoanDueDate(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Feedback visual */}
          {isPartial && (
            <div className="partial-info">
              <Split size={16} />
              <div>
                <strong>Pagamento parcial</strong>
                <p>
                  O saldo pendente será de: <span className="text-coral">{formatCurrency(currentRemaining - parsedAmount)}</span>.
                </p>
              </div>
            </div>
          )}

          {!isPartial && isValid && (
            <div className="full-info">
              <Check size={16} />
              <span>Quitação total — o lançamento será marcado como <strong>Pago</strong>.</span>
            </div>
          )}

          {parsedAmount > currentRemaining && (
            <div className="error-info">
              O valor não pode ser maior que o saldo pendente ({formatCurrency(currentRemaining)}).
            </div>
          )}
        </div>

        <div className="modal-footer">
          <Button variant="secondary" onClick={handleClose}>Cancelar</Button>
          <Button
            variant="success"
            icon={isPartial ? <Split size={18} /> : <Check size={18} />}
            onClick={handleConfirm}
            disabled={!isValid}
          >
            {isPartial ? 'Quitar Parcialmente' : 'Quitar Total'}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
