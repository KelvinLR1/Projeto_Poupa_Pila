import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { formatCurrency } from '../../utils/formatters';
import { Button } from '../ui/Button';
import { Check, Split, X } from 'lucide-react';
import './PaymentModal.css';

export function PaymentModal({ transaction, onConfirm, onCancel }) {
  const settlements = transaction.settlements || [];
  const alreadyPaid = settlements.reduce((acc, s) => acc + s.amount, 0);
  const remaining = transaction.amount - alreadyPaid;

  const [amount, setAmount] = useState(remaining.toFixed(2));
  const parsedAmount = parseFloat(amount) || 0;
  const isPartial = parsedAmount < remaining && parsedAmount > 0;
  const isValid = parsedAmount > 0 && parsedAmount <= remaining;

  const handleConfirm = () => {
    if (!isValid) return;
    onConfirm({ transaction, paidAmount: parsedAmount });
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
          <div className="tx-summary">
            <div className="tx-summary-row">
              <span>Valor original</span>
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
              <strong className="text-coral">{formatCurrency(remaining)}</strong>
            </div>
          </div>

          <div className="amount-input-group">
            <label>Valor que está sendo pago</label>
            <div className="amount-input-wrapper">
              <span className="currency-prefix">R$</span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                max={remaining}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                autoFocus
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
                  O saldo pendente será de: <span className="text-coral">{formatCurrency(remaining - parsedAmount)}</span>.
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

          {parsedAmount > remaining && (
            <div className="error-info">
              O valor não pode ser maior que o saldo pendente ({formatCurrency(remaining)}).
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
