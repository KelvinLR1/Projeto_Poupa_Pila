import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { formatCurrency, maskCurrencyBRL, parseCurrencyBRL } from '../../utils/formatters';
import { Button } from '../ui/Button';
import { Check, Split, X } from 'lucide-react';
import './PaymentModal.css';

export function PaymentModal({ transaction, onConfirm, onCancel }) {
  const settlements = transaction.settlements || [];
  const alreadyPaid = settlements.reduce((acc, s) => acc + s.amount, 0);
  const remaining = transaction.amount - alreadyPaid;

  const isForecast = transaction.is_forecast === 1;

  const [actualAmount, setActualAmount] = useState(maskCurrencyBRL(transaction.amount));
  const [amount, setAmount] = useState(maskCurrencyBRL(remaining));

  const parsedActualAmount = parseCurrencyBRL(actualAmount);
  const parsedAmount = parseCurrencyBRL(amount);

  const currentRemaining = isForecast ? Math.max(0, parsedActualAmount - alreadyPaid) : remaining;

  const isPartial = parsedAmount < currentRemaining && parsedAmount > 0;
  const isValid = isForecast
    ? (parsedActualAmount > 0 && parsedAmount > 0 && parsedAmount <= currentRemaining)
    : (parsedAmount > 0 && parsedAmount <= remaining);

  const handleActualAmountChange = (val) => {
    const maskedVal = maskCurrencyBRL(val);
    setActualAmount(maskedVal);
    const parsedVal = parseCurrencyBRL(maskedVal);
    const newRemaining = Math.max(0, parsedVal - alreadyPaid);
    setAmount(maskCurrencyBRL(newRemaining));
  };

  const handleConfirm = () => {
    if (!isValid) return;
    onConfirm({ transaction, paidAmount: parsedAmount, actualAmount: isForecast ? parsedActualAmount : null });
  };

  return createPortal(
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-container animate-slide-up" onClick={(e) => e.stopPropagation()}>
        
        <div className="modal-header">
          <div className="modal-header-content">
            <h3>Dar Baixa no Lançamento</h3>
            <p>{transaction.description}</p>
          </div>
          <button className="close-btn" onClick={onCancel} title="Fechar">
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
          <Button variant="secondary" onClick={onCancel}>Cancelar</Button>
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
