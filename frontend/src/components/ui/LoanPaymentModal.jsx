import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency, maskCurrencyBRL, parseCurrencyBRL } from '../../utils/formatters';
import { Button } from './Button';
import { Check, Wallet, X } from 'lucide-react';
import { CustomDatePicker } from './CustomDatePicker';
import { CustomSelect } from './CustomSelect';
import './PaymentModal.css';
import './LoanFormModal.css'; /* reaproveitamos type-btn/type-selector */

export function LoanPaymentModal({ loan, onConfirm, onCancel }) {
  const { accounts, categories } = useFinance();
  const remaining = loan.totalAmount - loan.paidAmount;
  const [amount, setAmount] = useState(maskCurrencyBRL(remaining));
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  
  const activeAccounts = accounts.filter(a => a.active !== false);
  const [accountId, setAccountId] = useState(activeAccounts[0]?.id || '');
  const [category, setCategory] = useState('');
  const [createTransaction, setCreateTransaction] = useState(true);

  const [isClosing, setIsClosing] = useState(false);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onCancel();
    }, 180);
  };

  // Sincroniza conta padrão se as contas carregarem depois
  useEffect(() => {
    if (activeAccounts.length > 0 && !accountId) {
      setAccountId(activeAccounts[0].id);
    }
  }, [accounts, accountId]);

  // Define categoria padrão de acordo com o tipo de empréstimo
  // Se loan.type === 'lent', estamos recebendo dinheiro de volta (Recebimento de Empréstimo)
  // Se loan.type === 'borrowed', estamos pagando dinheiro de volta (Empréstimo)
  useEffect(() => {
    if (categories.length > 0) {
      const defaultCat = loan.type === 'lent'
        ? categories.find(c => c.active !== false && c.name === 'Recebimento de Empréstimo' && c.type === 'income')?.name || categories.filter(c => c.active !== false && c.type === 'income')[0]?.name || ''
        : categories.find(c => c.active !== false && c.name === 'Empréstimo' && c.type === 'expense')?.name || categories.filter(c => c.active !== false && c.type === 'expense')[0]?.name || '';
      setCategory(defaultCat);
    }
  }, [categories, loan.type]);

  const parsedAmount = parseCurrencyBRL(amount);
  const isValid = parsedAmount > 0;

  const handleConfirm = () => {
    if (!isValid || (createTransaction && (!accountId || !category))) return;
    onConfirm(
      loan.id, 
      parsedAmount, 
      date, 
      description || (loan.type === 'lent' ? 'Recebimento de parcela' : 'Pagamento de parcela'),
      accountId,
      category,
      createTransaction
    );
    handleClose();
  };

  return createPortal(
    <div className={`modal-overlay ${isClosing ? 'closing' : ''}`} onClick={handleClose}>
      <div className="modal-container payment-modal-container animate-slide-up" onClick={(e) => e.stopPropagation()}>
        
        <div className="modal-header">
          <div className="modal-header-content">
            <h3>{loan.type === 'lent' ? 'Registrar Recebimento' : 'Registrar Pagamento'}</h3>
            <p>{loan.type === 'lent' ? 'Recebimento de' : 'Pagamento para'} <strong style={{ color: 'var(--text-primary)' }}>{loan.counterpart}</strong></p>
          </div>
          <button className="close-btn" onClick={handleClose} title="Fechar">
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
                type="text"
                value={amount}
                onChange={(e) => setAmount(maskCurrencyBRL(e.target.value))}
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
            <CustomDatePicker
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div className="loan-checkbox-container" style={{ margin: '16px 0' }}>
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

          <div className={`form-row ${!createTransaction ? 'disabled-opacity' : ''}`} style={{ display: 'flex', gap: '16px', transition: 'opacity 0.3s' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Conta Vinculada</label>
              <CustomSelect
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                options={activeAccounts.map(a => ({ value: a.id, label: a.name }))}
                disabled={!createTransaction}
              />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Categoria</label>
              <CustomSelect
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                options={categories
                  .filter(c => c.active !== false && c.type === (loan.type === 'lent' ? 'income' : 'expense'))
                  .map(c => ({ value: c.name, label: c.name }))}
                disabled={!createTransaction}
              />
            </div>
          </div>

          {parsedAmount === remaining && isValid && (
            <div className="full-info">
              <Check size={16} />
              <span>Esta parcela <strong>quitará</strong> o empréstimo por completo.</span>
            </div>
          )}

          {parsedAmount > remaining && (
            <div className="partial-info" style={{ backgroundColor: 'rgba(168, 85, 247, 0.06)', borderColor: 'rgba(168, 85, 247, 0.2)', color: '#c084fc' }}>
              <strong>Inversão de Empréstimo Automática</strong>
              <p>O valor excede o saldo pendente. A diferença ({formatCurrency(parsedAmount - remaining)}) converterá o registro em <b>{loan.type === 'lent' ? 'um valor que você deve' : 'um valor que lhe devem'}</b>.</p>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <Button variant="secondary" onClick={handleClose}>Cancelar</Button>
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
