import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { formatCurrency } from '../../utils/formatters';
import { Button } from './Button';
import { Check, Wallet, X } from 'lucide-react';
import './PaymentModal.css';
import './LoanFormModal.css'; /* reaproveitamos type-btn/type-selector */

export function LoanPaymentModal({ loan, onConfirm, onCancel }) {
  const remaining = loan.totalAmount - loan.paidAmount;
  const [amount, setAmount] = useState(remaining.toFixed(2));
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const parsedAmount = parseFloat(amount) || 0;
  const isValid = parsedAmount > 0 && parsedAmount <= remaining;

  const handleConfirm = () => {
    if (!isValid) return;
    onConfirm(loan.id, parsedAmount, date, description || (loan.type === 'lent' ? 'Recebimento de parcela' : 'Pagamento de parcela'));
  };

  return createPortal(
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-container animate-slide-up" onClick={(e) => e.stopPropagation()}>
        
        <div className="modal-header">
          <div className="modal-header-content">
            <h3>{loan.type === 'lent' ? 'Registrar Recebimento' : 'Registrar Pagamento'}</h3>
            <p>{loan.type === 'lent' ? 'Recebimento de' : 'Pagamento para'} <strong style={{ color: 'var(--text-primary)' }}>{loan.counterpart}</strong></p>
          </div>
          <button className="close-btn" onClick={onCancel} title="Fechar">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <div className="tx-summary">
            <div className="tx-summary-row">
              <span>Valor Total</span>
              <strong>{formatCurrency(loan.totalAmount)}</strong>
            </div>
            {loan.paidAmount > 0 && (
              <div className="tx-summary-row" style={{ marginTop: '8px', color: 'var(--text-muted)' }}>
                <span>Já quitado</span>
                <span>{formatCurrency(loan.paidAmount)}</span>
              </div>
            )}
            <div className="tx-summary-row" style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <span>Saldo pendente</span>
              <strong className={loan.type === 'lent' ? 'text-emerald' : 'text-coral'}>
                {formatCurrency(remaining)}
              </strong>
            </div>
          </div>

          <div className="amount-input-group">
            <label>Valor desta parcela</label>
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

          <div className="form-group" style={{ marginTop: '16px' }}>
            <label>Descrição / Referência</label>
            <input 
              type="text"
              className="form-input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Parcela de Junho, Pix de volta, etc."
            />
          </div>

          <div className="form-group" style={{ marginTop: '16px' }}>
            <label>Data da Baixa</label>
            <input 
              type="date"
              required
              className="form-input"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          {parsedAmount === remaining && isValid && (
            <div className="full-info">
              <Check size={16} />
              <span>Esta parcela <strong>quitará</strong> o empréstimo por completo.</span>
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
            variant={loan.type === 'lent' ? 'success' : 'primary'}
            icon={<Wallet size={18} />}
            onClick={handleConfirm}
            disabled={!isValid}
          >
            Registrar Pagamento
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
