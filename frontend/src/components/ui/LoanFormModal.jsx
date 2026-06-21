import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useFinance } from '../../context/FinanceContext';
import { Button } from './Button';
import { X, ArrowUpRight, ArrowDownRight, Info } from 'lucide-react';
import { CustomDatePicker } from './CustomDatePicker';
import { CustomSelect } from './CustomSelect';
import { maskCurrencyBRL, parseCurrencyBRL } from '../../utils/formatters';
import './LoanFormModal.css';
import './PaymentModal.css';

export function LoanFormModal({ onClose, initialCounterpart = '', initialType = 'lent' }) {
  const { addLoan, loans, accounts, categories } = useFinance();
  const [type, setType] = useState(initialType);
  const [counterpart, setCounterpart] = useState(initialCounterpart);
  const [totalAmount, setTotalAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [loanTitle, setLoanTitle] = useState('');

  const activeAccounts = accounts.filter(a => a.active !== false);
  const [accountId, setAccountId] = useState(activeAccounts[0]?.id || '');
  const [category, setCategory] = useState('');
  const [createTransaction, setCreateTransaction] = useState(true);

  const [isClosing, setIsClosing] = useState(false);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 180);
  };

  // Sincroniza conta padrão se as contas carregarem depois
  useEffect(() => {
    if (activeAccounts.length > 0 && !accountId) {
      setAccountId(activeAccounts[0].id);
    }
  }, [accounts, accountId]);

  // Define categoria padrão de acordo com o tipo de empréstimo
  useEffect(() => {
    if (categories.length > 0) {
      const defaultCat = type === 'lent'
        ? categories.find(c => c.active !== false && c.name === 'Empréstimo' && c.type === 'expense')?.name || categories.filter(c => c.active !== false && c.type === 'expense')[0]?.name || ''
        : categories.find(c => c.active !== false && c.name === 'Recebimento de Empréstimo' && c.type === 'income')?.name || categories.filter(c => c.active !== false && c.type === 'income')[0]?.name || '';
      setCategory(defaultCat);
    }
  }, [categories, type]);

  const isDuplicate = !initialCounterpart && loans.some(
    l => l.counterpart.toLowerCase().trim() === counterpart.toLowerCase().trim() && l.type === type
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    const parsedAmount = parseCurrencyBRL(totalAmount);
    if (!counterpart || parsedAmount <= 0 || !date || (createTransaction && (!accountId || !category))) return;

    addLoan({
      type,
      counterpart,
      title: loanTitle,
      amount: parsedAmount,
      date,
      dueDate,
      description: description || (type === 'lent' ? 'Valor emprestado' : 'Valor pego emprestado'),
      accountId,
      category,
      createTransaction
    });

    handleClose();
  };

  const title = initialCounterpart
    ? `Adicionar Valor — ${initialCounterpart}`
    : 'Novo Empréstimo';

  const subtitle = initialCounterpart
    ? `O valor será anexado ao registro existente de ${initialCounterpart}.`
    : 'Registre dinheiro emprestado ou que você pegou emprestado.';

  return createPortal(
    <div className={`modal-overlay ${isClosing ? 'closing' : ''}`} onClick={handleClose}>
      <div className="modal-container loan-form-modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-header-content">
            <h3>{title}</h3>
            <p>{subtitle}</p>
          </div>
          <button className="close-btn" onClick={handleClose} title="Fechar">
            <X size={18} />
          </button>
        </div>

        <form className="modal-body loan-form-modal-body" onSubmit={handleSubmit}>
          <div className="loan-section">
            <div className="form-row">
              <div className="form-group flex-1">
                <label>Tipo de Empréstimo</label>
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
                    <ArrowDownRight size={18} /> Peguei
                  </button>
                </div>
              </div>

              <div className="form-group flex-1">
                <label>Valor Principal</label>
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
            </div>
          </div>

          <div className="loan-section">
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

            {!initialCounterpart && (
              <div className="form-group mt-12">
                <label>Identificação / Título (Opcional)</label>
                <input 
                  type="text" 
                  className="form-input"
                  value={loanTitle}
                  onChange={(e) => setLoanTitle(e.target.value)}
                  placeholder="Ex: Reforma da casa, Viagem, etc."
                />
              </div>
            )}

            <div className="form-group mt-12">
              <label>Descrição / Motivo (Opcional)</label>
              <input 
                type="text" 
                className="form-input"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex: Conserto do carro, mercado, etc."
              />
            </div>
          </div>

          <div className="loan-section">
            <div className="loan-checkbox-container" style={{ marginBottom: '16px', marginTop: '16px' }}>
              <label className="checkbox-label">
                <input 
                  type="checkbox" 
                  checked={createTransaction}
                  onChange={(e) => setCreateTransaction(e.target.checked)}
                />
                <div className="checkbox-custom"></div>
                <div className="checkbox-text">
                  <strong>Contabilizar no saldo e extrato</strong>
                  <span>Gera um lançamento financeiro real que afeta o saldo da conta, Análises e Fluxo de Caixa.</span>
                </div>
              </label>
            </div>

            <div className={`form-row ${!createTransaction ? 'disabled-opacity' : ''}`} style={{ transition: 'opacity 0.3s' }}>
              <div className="form-group flex-1">
                <label>Conta Vinculada</label>
                <CustomSelect
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  options={activeAccounts.map(a => ({ value: a.id, label: a.name }))}
                  disabled={!createTransaction}
                />
              </div>
              <div className="form-group flex-1">
                <label>Categoria</label>
                <CustomSelect
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  options={categories
                    .filter(c => c.active !== false && c.type === (type === 'lent' ? 'expense' : 'income'))
                    .map(c => ({ value: c.name, label: c.name }))}
                  disabled={!createTransaction}
                />
              </div>
            </div>

            <div className="form-row mt-12">
              <div className="form-group flex-1">
                <label>Data de Registro</label>
                <CustomDatePicker
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
              <div className="form-group flex-1">
                <label>Vencimento (Opcional)</label>
                <CustomDatePicker
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  placeholder="Sem vencimento"
                />
              </div>
            </div>
          </div>
        </form>

        <div className="modal-footer">
          <Button variant="secondary" onClick={handleClose} type="button">Cancelar</Button>
          <Button variant="primary" onClick={handleSubmit}>Criar Registro</Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
