import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Button } from './Button';
import { X, Check, Landmark, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { CustomDatePicker } from './CustomDatePicker';
import { CustomSelect } from './CustomSelect';
import { formatCurrency, formatDate } from '../../utils/formatters';
import './OFXLoanLinkModal.css';
import './PaymentModal.css';

export function OFXLoanLinkModal({ ofxTx, loans = [], onConfirm, onClose }) {
  const [isClosing, setIsClosing] = useState(false);
  const [loanMode, setLoanMode] = useState(loans.length > 0 ? 'existing' : 'new');
  const [selectedLoanId, setSelectedLoanId] = useState('');
  
  // Limpa a descrição do OFX para usar como sugestão de nome de contato
  const cleanDescription = ofxTx.description
    ? ofxTx.description.replace(/\d+/g, '').trim()
    : '';
  const [loanCounterpart, setLoanCounterpart] = useState(cleanDescription);
  const [loanTitle, setLoanTitle] = useState('');
  const [loanDueDate, setLoanDueDate] = useState('');

  const isExpense = ofxTx.type === 'expense';
  
  const isValid = loanMode === 'existing' 
    ? selectedLoanId !== '' 
    : loanCounterpart.trim() !== '';

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 180);
  };

  const handleConfirm = () => {
    if (!isValid) return;
    setIsClosing(true);
    setTimeout(() => {
      onConfirm({
        mode: loanMode,
        loanId: loanMode === 'existing' ? selectedLoanId : null,
        loanCounterpart: loanMode === 'new' ? loanCounterpart.trim() : null,
        loanTitle: loanMode === 'new' ? loanTitle.trim() : null,
        loanDueDate: loanMode === 'new' ? loanDueDate || null : null
      });
    }, 180);
  };

  return createPortal(
    <div className={`modal-overlay ${isClosing ? 'closing' : ''}`} onClick={handleClose}>
      <div className="modal-container ofx-loan-link-modal-container" onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div className="modal-header">
          <div className="modal-header-content">
            <h3>Vincular a Empréstimo</h3>
            <p>Conecte esta transação bancária do extrato a um empréstimo.</p>
          </div>
          <button className="close-btn" onClick={handleClose} title="Fechar">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          {/* Info do Lançamento OFX */}
          <div className="ofx-split-info-box" style={{ marginBottom: '15px' }}>
            <span className="split-info-badge">Transação do Extrato</span>
            <div className="split-info-row">
              <div className="split-info-details">
                <h4>{ofxTx.description}</h4>
                <p>{formatDate(ofxTx.date)}</p>
              </div>
              <div className={`split-info-amount ${isExpense ? 'text-coral' : 'text-emerald'}`}>
                {isExpense ? '-' : '+'}{formatCurrency(ofxTx.amount)}
              </div>
            </div>
          </div>

          {/* Informativo sobre a natureza do Empréstimo */}
          <div className="partial-info" style={{ 
            background: isExpense ? 'rgba(244, 63, 94, 0.06)' : 'rgba(16, 185, 129, 0.06)', 
            border: isExpense ? '1px solid rgba(244, 63, 94, 0.18)' : '1px solid rgba(16, 185, 129, 0.18)', 
            color: isExpense ? 'var(--accent-coral)' : 'var(--accent-emerald)', 
            marginBottom: '15px',
            alignItems: 'center'
          }}>
            {isExpense ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
            <div style={{ flex: 1 }}>
              <strong style={{ display: 'block', fontSize: '0.85rem' }}>
                {isExpense ? 'Saída de Caixa (Você emprestou / devolveu)' : 'Entrada de Caixa (Você pegou / recebeu devolução)'}
              </strong>
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                {isExpense 
                  ? 'Como o dinheiro saiu da sua conta, isso registrará uma saída de valor (aumento de empréstimo concedido ou devolução de empréstimo pego).' 
                  : 'Como o dinheiro entrou na sua conta, isso registrará uma entrada de valor (recebimento de devolução ou novo valor pego emprestado).'}
              </p>
            </div>
          </div>

          {/* Seletor de Modo */}
          <div className="loan-checkbox-container" style={{ marginTop: 0 }}>
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
                <span className="radio-text">Vincular a Existente</span>
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
          </div>

          {/* Form Fields: Existing */}
          {loanMode === 'existing' && loans.length > 0 && (
            <div className="amount-input-group mt-12 animate-fade-in">
              <label>Selecione o Empréstimo Ativo</label>
              <CustomSelect
                value={selectedLoanId}
                onChange={(e) => setSelectedLoanId(e.target.value)}
                options={[
                  { value: '', label: 'Selecione um empréstimo...' },
                  ...loans.map(l => {
                    const balance = l.totalAmount - l.paidAmount;
                    const labelType = l.type === 'lent' ? 'A Receber' : 'A Pagar';
                    const displayBalance = balance > 0 ? `(Saldo: R$ ${balance.toFixed(2)} ${labelType})` : '(Quitado)';
                    return {
                      value: l.id,
                      label: `${l.counterpart} ${l.title ? `- ${l.title}` : ''} ${displayBalance}`
                    };
                  })
                ]}
              />
            </div>
          )}

          {/* Form Fields: New */}
          {loanMode === 'new' && (
            <div className="new-loan-fields mt-12 animate-fade-in">
              <div className="amount-input-group">
                <label>Nome do Contato / Pessoa</label>
                <input
                  type="text"
                  className="form-input"
                  value={loanCounterpart}
                  onChange={(e) => setLoanCounterpart(e.target.value)}
                  placeholder="Ex: Carlos Silva"
                  required
                />
              </div>
              <div className="amount-input-group mt-12">
                <label>Identificação / Título (Opcional)</label>
                <input
                  type="text"
                  className="form-input"
                  value={loanTitle}
                  onChange={(e) => setLoanTitle(e.target.value)}
                  placeholder="Ex: Empréstimo para reforma, Pix emergencial"
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

        {/* Footer */}
        <div className="modal-footer">
          <Button variant="secondary" onClick={handleClose} type="button">Cancelar</Button>
          <Button
            variant="primary"
            icon={<Check size={16} />}
            onClick={handleConfirm}
            disabled={!isValid}
          >
            Vincular Empréstimo
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
