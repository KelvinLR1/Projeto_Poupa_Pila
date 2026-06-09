import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useFinance } from '../../context/FinanceContext';
import { Button } from './Button';
import { X, ArrowUpRight, ArrowDownRight } from 'lucide-react';
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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!amount || !description || !category || !accountId) return;

    addTransaction({
      type,
      amount: parseFloat(amount),
      description,
      category,
      date,
      accountId,
      status
    });

    onClose();
  };

  return createPortal(
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer-container animate-slide-left" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-header">
          <h3>Nova Transação</h3>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        <form className="drawer-body" onSubmit={handleSubmit}>
          {/* Tipo Selector */}
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

          <div className="form-group amount-group">
            <label>Valor</label>
            <div className="amount-input-wrapper">
              <span className="currency-prefix">R$</span>
              <input 
                type="number" 
                step="0.01" 
                min="0.01"
                required
                className="amount-input"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0,00"
                autoFocus
              />
            </div>
          </div>

          <div className="form-group">
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

          <div className="form-row">
            <div className="form-group">
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
            <div className="form-group">
              <label>Data</label>
              <input 
                type="date" 
                required
                className="form-input"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Conta Vinculada</label>
            <select 
              className="form-select"
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              required
            >
              {accounts.map(acc => (
                <option key={acc.id} value={acc.id}>{acc.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Status</label>
            <div className="status-selector">
              <label className="radio-label">
                <input 
                  type="radio" 
                  name="status" 
                  value="paid" 
                  checked={status === 'paid'} 
                  onChange={(e) => setStatus(e.target.value)} 
                />
                Já Pago (Efetivado)
              </label>
              <label className="radio-label">
                <input 
                  type="radio" 
                  name="status" 
                  value="pending" 
                  checked={status === 'pending'} 
                  onChange={(e) => setStatus(e.target.value)} 
                />
                A Pagar / Pendente
              </label>
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
