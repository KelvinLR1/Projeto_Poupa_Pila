import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { Button } from './Button';
import { Badge } from './Badge';
import { X, Calendar, Plus, Wallet, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import './PaymentModal.css';
import './LoanDetailsModal.css';

export function LoanDetailsModal({ loan, onClose, onAddAmount, onRegisterPayment }) {
  const remaining = loan.totalAmount - loan.paidAmount;
  const isSettled = loan.status === 'settled';
  const progress = Math.min((loan.paidAmount / loan.totalAmount) * 100, 100);
  const [showAll, setShowAll] = useState(false);

  const VISIBLE_LIMIT = 3;
  const sortedHistory = [...loan.history].sort((a, b) => new Date(b.date) - new Date(a.date));
  const visibleHistory = showAll ? sortedHistory : sortedHistory.slice(0, VISIBLE_LIMIT);
  const hasMore = sortedHistory.length > VISIBLE_LIMIT;

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
            </div>
            <h3>{loan.counterpart}</h3>
          </div>
          <button className="close-btn" onClick={onClose} title="Fechar">
            <X size={18} />
          </button>
        </div>

        {/* Body com scroll */}
        <div className="modal-body">

          {/* Métricas */}
          <div className="loan-metrics">
            <div className="loan-metric-item">
              <span className="loan-metric-label">Total Emprestado</span>
              <strong className="loan-metric-value">{formatCurrency(loan.totalAmount)}</strong>
            </div>
            <div className="loan-metric-divider" />
            <div className="loan-metric-item">
              <span className="loan-metric-label">Já Quitado</span>
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

          {/* Timeline */}
          <div className="loan-timeline-section">
            <h4 className="loan-timeline-title">Linha do Tempo</h4>
            <div className="loan-timeline">
              {visibleHistory.map(item => {
                const isLoanEntry = item.type === 'loan';
                const isIncoming = (isLoanEntry && loan.type === 'borrowed') || (!isLoanEntry && loan.type === 'lent');
                return (
                  <div key={item.id} className="loan-timeline-item">
                    <div className={`loan-timeline-icon ${isIncoming ? 'icon-incoming' : 'icon-outgoing'}`}>
                      {isIncoming
                        ? <ArrowDownRight size={14} />
                        : <ArrowUpRight size={14} />
                      }
                    </div>
                    <div className="loan-timeline-content">
                      <div className="loan-timeline-row">
                        <span className="loan-timeline-desc">{item.description}</span>
                        <span className={`loan-timeline-amount ${isLoanEntry ? '' : 'amount-paid'}`}>
                          {isLoanEntry ? '+' : '−'}{formatCurrency(item.amount)}
                        </span>
                      </div>
                      <div className="loan-timeline-meta">
                        <span>{formatDate(item.date)}</span>
                        {isLoanEntry && item.dueDate && (
                          <span className="loan-timeline-due">
                            <Calendar size={11} />
                            Vence: {formatDate(item.dueDate)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {hasMore && (
              <button
                className="timeline-toggle-btn"
                onClick={() => setShowAll(prev => !prev)}
              >
                {showAll
                  ? 'Mostrar menos'
                  : `Ver todos os ${sortedHistory.length} lançamentos`
                }
              </button>
            )}
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
