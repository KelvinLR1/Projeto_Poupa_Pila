import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { Button } from './Button';
import { Badge } from './Badge';
import { X, Calendar, Plus, Wallet, ArrowUpRight, ArrowDownRight, ArrowLeftRight } from 'lucide-react';
import './PaymentModal.css';
import './LoanDetailsModal.css';

export function LoanDetailsModal({ loan, onClose, onAddAmount, onRegisterPayment }) {
  const { toggleLoanType } = useFinance();
  const remaining    = loan.totalAmount - loan.paidAmount;
  const isSettled    = loan.status === 'settled';
  const progress     = Math.min((loan.paidAmount / loan.totalAmount) * 100, 100);

  const [showAllLoans,    setShowAllLoans]    = useState(false);
  const [showAllPayments, setShowAllPayments] = useState(false);

  const LIMIT = 4;

  // Filtra itens de saída (meu dinheiro indo para o outro)
  const outgoingEntries = loan.history
    .filter(h => {
      const dir = h.direction || loan.type;
      return (h.type === 'loan' && dir === 'lent') || (h.type === 'payment' && dir === 'borrowed');
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  // Filtra itens de entrada (dinheiro do outro vindo para mim)
  const incomingEntries = loan.history
    .filter(h => {
      const dir = h.direction || loan.type;
      return (h.type === 'loan' && dir === 'borrowed') || (h.type === 'payment' && dir === 'lent');
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const visibleLoans    = showAllLoans    ? outgoingEntries    : outgoingEntries.slice(0, LIMIT);
  const visiblePayments = showAllPayments ? incomingEntries : incomingEntries.slice(0, LIMIT);

  // Labels dinâmicas com base na natureza do empréstimo
  const metricTotalLabel = loan.type === 'lent' ? 'Total Emprestado' : 'Total Pegado';
  const metricPaidLabel  = loan.type === 'lent' ? 'Já Recebido' : 'Já Pago';
  const colLoanLabel     = loan.type === 'lent' ? 'Valores Emprestados' : 'Pagamentos Feitos';
  const colPayLabel      = loan.type === 'lent' ? 'Devoluções Recebidas' : 'Valores Recebidos';

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container loan-details-container" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="modal-header">
          <div className="modal-header-content">
            <div className="loan-detail-badge-row">
              <Badge variant={isSettled ? 'success' : 'warning'}>
                {isSettled ? 'Quitado' : 'Ativo'}
              </Badge>
              <span className="loan-type-label">
                {loan.type === 'lent' ? 'Você emprestou' : 'Você deve'}
              </span>
              <button 
                className="toggle-type-btn"
                title="Inverter sentido (De me devem para eu devo ou vice-versa)"
                onClick={() => toggleLoanType(loan.id)}
              >
                <ArrowLeftRight size={12} />
                <span>Inverter</span>
              </button>
            </div>
            <h3>{loan.counterpart}</h3>
          </div>
          <button className="close-btn" onClick={onClose} title="Fechar">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">

          {/* Métricas horizontais */}
          <div className="loan-metrics">
            <div className="loan-metric-item">
              <span className="loan-metric-label">{metricTotalLabel}</span>
              <strong className="loan-metric-value">{formatCurrency(loan.totalAmount)}</strong>
            </div>
            <div className="loan-metric-divider" />
            <div className="loan-metric-item">
              <span className="loan-metric-label">{metricPaidLabel}</span>
              <strong className="loan-metric-value text-emerald">{formatCurrency(loan.paidAmount)}</strong>
            </div>
            <div className="loan-metric-divider" />
            <div className="loan-metric-item">
              <span className="loan-metric-label">Saldo Restante</span>
              <strong className={`loan-metric-value ${remaining > 0 ? (loan.type === 'lent' ? 'text-coral' : 'text-emerald') : 'text-emerald'}`}>
                {formatCurrency(remaining)}
              </strong>
            </div>
          </div>

          {/* Barra de progresso */}
          <div className="loan-progress-block">
            <div className="loan-progress-header">
              <span>Progresso da Quitação</span>
              <strong>{progress.toFixed(0)}%</strong>
            </div>
            <div className="loan-progress-track">
              <div
                className={`loan-progress-fill ${loan.type === 'lent' ? 'fill-coral' : 'fill-emerald'}`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Duas colunas */}
          <div className="loan-columns">

            {/* Coluna Esquerda — Saídas / Fluxo de Saída */}
            <div className="loan-col">
              <div className="loan-col-header loan-col-header--out">
                <ArrowUpRight size={14} />
                <span>{colLoanLabel}</span>
                <strong className="loan-col-total">{formatCurrency(outgoingEntries.reduce((s, h) => s + h.amount, 0))}</strong>
              </div>

              <div className="loan-col-list">
                {outgoingEntries.length === 0 && (
                  <p className="loan-col-empty">Nenhum registro</p>
                )}
                {visibleLoans.map(item => (
                  <div key={item.id} className="loan-col-item">
                    <div className="loan-col-item-top">
                      <span className="loan-col-item-desc" title={item.description}>{item.description}</span>
                      <span className="loan-col-item-amount amount-out">{formatCurrency(item.amount)}</span>
                    </div>
                    <div className="loan-col-item-meta">
                      <span>{formatDate(item.date)}</span>
                      {item.dueDate && (
                        <span className="loan-col-due">
                          <Calendar size={10} />
                          {formatDate(item.dueDate)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                {outgoingEntries.length > LIMIT && (
                  <button className="col-toggle-btn" onClick={() => setShowAllLoans(p => !p)}>
                    {showAllLoans ? 'Ver menos' : `+${outgoingEntries.length - LIMIT} mais`}
                  </button>
                )}
              </div>
            </div>

            {/* Divider vertical */}
            <div className="loan-col-divider" />

            {/* Coluna Direita — Entradas / Fluxo de Entrada */}
            <div className="loan-col">
              <div className="loan-col-header loan-col-header--in">
                <ArrowDownRight size={14} />
                <span>{colPayLabel}</span>
                <strong className="loan-col-total">{formatCurrency(incomingEntries.reduce((s, h) => s + h.amount, 0))}</strong>
              </div>

              <div className="loan-col-list">
                {incomingEntries.length === 0 && (
                  <p className="loan-col-empty">Nenhum registro</p>
                )}
                {visiblePayments.map(item => (
                  <div key={item.id} className="loan-col-item">
                    <div className="loan-col-item-top">
                      <span className="loan-col-item-desc" title={item.description}>{item.description}</span>
                      <span className="loan-col-item-amount amount-in">{formatCurrency(item.amount)}</span>
                    </div>
                    <div className="loan-col-item-meta">
                      <span>{formatDate(item.date)}</span>
                    </div>
                  </div>
                ))}
                {incomingEntries.length > LIMIT && (
                  <button className="col-toggle-btn" onClick={() => setShowAllPayments(p => !p)}>
                    {showAllPayments ? 'Ver menos' : `+${incomingEntries.length - LIMIT} mais`}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer loan-details-footer">
          <Button
            variant="secondary"
            icon={<Plus size={15} />}
            onClick={() => onAddAmount(loan)}
          >
            Adicionar Valor
          </Button>

          {!isSettled && (
            <Button
              variant="primary"
              icon={<Wallet size={15} />}
              onClick={() => onRegisterPayment(loan)}
            >
              Registrar Parcela
            </Button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
