import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useFinance } from '../../context/FinanceContext';
import { Button } from './Button';
import { X, ArrowUpRight, ArrowDownRight, Info } from 'lucide-react';
import { CustomDatePicker } from './CustomDatePicker';
import { maskCurrencyBRL, parseCurrencyBRL } from '../../utils/formatters';
import './LoanFormModal.css';
import './PaymentModal.css';

export function LoanFormModal({ onClose, initialCounterpart = '', initialType = 'lent' }) {
  const { addLoan, loans } = useFinance();
  const [type, setType] = useState(initialType);
  const [counterpart, setCounterpart] = useState(initialCounterpart);
  const [totalAmount, setTotalAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');

  const isDuplicate = !initialCounterpart && loans.some(
    l => l.counterpart.toLowerCase().trim() === counterpart.toLowerCase().trim() && l.type === type
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    const parsedAmount = parseCurrencyBRL(totalAmount);
    if (!counterpart || parsedAmount <= 0 || !dueDate) return;

    addLoan({
      type,
      counterpart,
      amount: parsedAmount,
      date,
      dueDate,
      description: description || (type === 'lent' ? 'Valor emprestado' : 'Valor pego emprestado')
    });

    onClose();
  };

  const title = initialCounterpart
    ? `Adicionar Valor — ${initialCounterpart}`
    : 'Novo Empréstimo';

  const subtitle = initialCounterpart
    ? `O valor será anexado ao registro existente de ${initialCounterpart}.`
    : 'Registre dinheiro emprestado ou que você pegou emprestado.';

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-header-content">
            <h3>{title}</h3>
            <p>{subtitle}</p>
          </div>
          <button className="close-btn" onClick={onClose} title="Fechar">
            <X size={18} />
          </button>
        </div>

        <form className="modal-body" onSubmit={handleSubmit}>
          {/* Type Selector */}
          <div className="type-selector">
            <button 
              type="button"
              className={`type-btn ${type === 'lent' ? 'active-income' : ''}`}
              onClick={() => setType('lent')}
              disabled={!!initialCounterpart}
            >
              <ArrowUpRight size={18} /> Emprestei
            </button>
            <button 
              type="button"
              className={`type-btn ${type === 'borrowed' ? 'active-expense' : ''}`}
              onClick={() => setType('borrowed')}
              disabled={!!initialCounterpart}
            >
              <ArrowDownRight size={18} /> Peguei Emprestado
            </button>
          </div>

          <div className="form-group">
            <label>{type === 'lent' ? 'Para quem você emprestou?' : 'De quem você pegou emprestado?'}</label>
            <input 
              type="text" 
              required
              className="form-input"
              value={counterpart}
              onChange={(e) => setCounterpart(e.target.value)}
              placeholder="Nome da pessoa ou empresa"
              autoFocus={!initialCounterpart}
              disabled={!!initialCounterpart}
            />
            {isDuplicate && (
              <div className="duplicate-hint">
                <Info size={13} />
                Já existe um registro ativo. O valor será anexado à conta de <strong>{counterpart}</strong>.
              </div>
            )}
          </div>

          <div className="form-group">
            <label>Descrição / Motivo</label>
            <input 
              type="text" 
              className="form-input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Conserto do carro, mercado, etc."
            />
          </div>

          <div className="form-group">
            <label>Valor</label>
            <div className="amount-input-wrapper">
              <span className="currency-prefix">R$</span>
              <input 
                type="text" 
                required
                className="amount-input"
                value={totalAmount}
                onChange={(e) => setTotalAmount(maskCurrencyBRL(e.target.value))}
                placeholder="0,00"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Data de Registro</label>
              <CustomDatePicker
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Data de Vencimento</label>
              <CustomDatePicker
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>
        </form>

        <div className="modal-footer">
          <Button variant="secondary" onClick={onClose} type="button">Cancelar</Button>
          <Button variant="primary" onClick={handleSubmit}>Criar Registro</Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
