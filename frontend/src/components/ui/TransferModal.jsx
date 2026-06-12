import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useFinance } from '../../context/FinanceContext';
import { Button } from './Button';
import { CustomSelect } from './CustomSelect';
import { CustomDatePicker } from './CustomDatePicker';
import { maskCurrencyBRL, parseCurrencyBRL } from '../../utils/formatters';
import { X, ArrowRight, AlertCircle } from 'lucide-react';
import './TransferModal.css';

export function TransferModal({ onClose }) {
  const { accounts, transferFunds } = useFinance();
  const activeAccounts = accounts.filter(acc => acc.active !== false);

  const [fromAccountId, setFromAccountId] = useState('');
  const [toAccountId, setToAccountId] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [isClosing, setIsClosing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Set default accounts if available
  useEffect(() => {
    if (activeAccounts.length > 0) {
      setFromAccountId(activeAccounts[0].id);
      if (activeAccounts.length > 1) {
        setToAccountId(activeAccounts[1].id);
      }
    }
  }, [accounts]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 280);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const parsedAmount = parseCurrencyBRL(amount);
    if (!fromAccountId || !toAccountId || parsedAmount <= 0 || !date) {
      setError('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    if (fromAccountId === toAccountId) {
      setError('A conta de origem e destino devem ser diferentes.');
      return;
    }

    setIsSubmitting(true);
    try {
      await transferFunds({
        fromAccountId,
        toAccountId,
        amount: parsedAmount,
        date,
        description: description.trim() || undefined
      });
      handleClose();
    } catch (err) {
      setError(err.message || 'Erro ao realizar a transferência.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div className={`modal-overlay ${isClosing ? 'closing' : ''}`} onClick={handleClose}>
      <div className="modal-container transfer-modal-container animate-modal-in" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3>Transferência entre Contas</h3>
            <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Transfira saldo de uma conta para outra instantaneamente.
            </p>
          </div>
          <button className="close-btn" onClick={handleClose} title="Fechar"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body transfer-modal-body">
            {error && (
              <div className="error-alert">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <div className="transfer-accounts-flow">
              <div className="form-group flex-1">
                <label>Origem (Sai de)</label>
                <CustomSelect
                  value={fromAccountId}
                  onChange={(e) => {
                    setFromAccountId(e.target.value);
                    if (e.target.value === toAccountId) {
                      const nextOption = activeAccounts.find(acc => acc.id !== e.target.value);
                      setToAccountId(nextOption ? nextOption.id : '');
                    }
                  }}
                  options={activeAccounts.map(acc => ({ value: acc.id, label: acc.name }))}
                />
              </div>

              <div className="transfer-flow-arrow">
                <ArrowRight size={20} />
              </div>

              <div className="form-group flex-1">
                <label>Destino (Entra em)</label>
                <CustomSelect
                  value={toAccountId}
                  onChange={(e) => setToAccountId(e.target.value)}
                  options={activeAccounts
                    .filter(acc => acc.id !== fromAccountId)
                    .map(acc => ({ value: acc.id, label: acc.name }))}
                />
              </div>
            </div>

            <div className="form-row mt-16">
              <div className="form-group flex-1 amount-group">
                <label>Valor da Transferência</label>
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

              <div className="form-group flex-1">
                <label>Data</label>
                <CustomDatePicker
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group mt-16">
              <label>Descrição (Opcional)</label>
              <input
                type="text"
                className="form-input"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex: Ajuste de saldo, Transferência mensal"
              />
            </div>
          </div>

          <div className="modal-footer">
            <Button variant="secondary" type="button" onClick={handleClose} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button variant="primary" type="submit" disabled={isSubmitting || parseCurrencyBRL(amount) <= 0}>
              {isSubmitting ? 'Transferindo...' : 'Transferir Saldo'}
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
