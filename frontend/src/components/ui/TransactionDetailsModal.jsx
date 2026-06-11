import React from 'react';
import { createPortal } from 'react-dom';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { Button } from './Button';
import { Badge } from './Badge';
import { X, Calendar, ArrowUpRight, ArrowDownRight, Activity, Check } from 'lucide-react';
import './PaymentModal.css';
import './TransactionDetailsModal.css';

export function TransactionDetailsModal({ transaction, onCancel, onPayRemaining }) {
  const [isClosing, setIsClosing] = React.useState(false);

  React.useEffect(() => {
    if (transaction) {
      setIsClosing(false);
    }
  }, [transaction]);

  if (!transaction) return null;

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onCancel();
    }, 180);
  };

  const settlements = transaction.settlements || [];
  const alreadyPaid = settlements.reduce((acc, s) => acc + s.amount, 0);
  const remaining = transaction.amount - alreadyPaid;
  const isPaid = transaction.status === 'paid';
  const isIncome = transaction.type === 'income';
  const progress = Math.min((alreadyPaid / transaction.amount) * 100, 100);

  const statusVariant = isPaid ? 'success' : transaction.status === 'partial' ? 'warning' : 'danger';
  const statusLabel  = isPaid ? 'Quitado' : transaction.status === 'partial' ? 'Parcial' : 'Pendente';

  return createPortal(
    <div className={`modal-overlay ${isClosing ? 'closing' : ''}`} onClick={handleClose}>
      <div className="modal-container tx-details-container" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="modal-header">
          <div className="tx-header-left">
            <div className={`tx-type-icon ${isIncome ? 'icon-income' : 'icon-expense'}`}>
              {isIncome
                ? <ArrowUpRight size={18} />
                : <ArrowDownRight size={18} />
              }
            </div>
            <div className="modal-header-content">
              <h3>{transaction.description}</h3>
              <div className="tx-header-meta">
                <Badge variant="default">{transaction.category}</Badge>
                {transaction.is_forecast === 1 && (
                  <Badge variant="purple">Previsão</Badge>
                )}
                <span className="tx-date-chip">
                  <Calendar size={12} />
                  {formatDate(transaction.date)}
                </span>
              </div>
            </div>
          </div>
          <button className="close-btn" onClick={handleClose} title="Fechar">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">

          {/* Resumo financeiro */}
          <div className="tx-financial-summary">
            <div className="tx-summary-main">
              <span className="tx-summary-label">
                {transaction.is_forecast === 1 ? 'Valor Total Estimado' : 'Valor Total'}
              </span>
              <strong className={`tx-summary-amount ${isIncome ? 'text-emerald' : ''}`}>
                {isIncome ? '+' : '−'}{formatCurrency(transaction.amount)}
              </strong>
            </div>
            <div className="tx-summary-status">
              <Badge variant={statusVariant}>{statusLabel}</Badge>
            </div>
          </div>

          {/* Barra de progresso (só se não for totalmente pago ou se tiver histórico) */}
          {(settlements.length > 0 || !isPaid) && (
            <div className="tx-progress-block">
              <div className="tx-progress-header">
                <span>{formatCurrency(alreadyPaid)} pago</span>
                <span className="tx-progress-pct">{progress.toFixed(0)}%</span>
              </div>
              <div className="tx-progress-track">
                <div
                  className={`tx-progress-fill ${isIncome ? 'fill-emerald' : 'fill-coral'}`}
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="tx-progress-footer">
                <span>de {formatCurrency(transaction.amount)} total</span>
                {!isPaid && <span className="tx-remaining">{formatCurrency(remaining)} restante</span>}
              </div>
            </div>
          )}

          {/* Timeline de quitações */}
          <div className="tx-timeline-section">
            <h4 className="tx-timeline-title">
              <Activity size={13} />
              Histórico de Pagamentos
            </h4>

            {settlements.length === 0 ? (
              <div className="tx-timeline-empty">
                Nenhum pagamento registrado ainda.
              </div>
            ) : (
              <div className="tx-timeline">
                {settlements.map((s, idx) => (
                  <div key={s.id} className="tx-timeline-item">
                    <div className={`tx-timeline-dot ${idx === settlements.length - 1 ? 'dot-active' : ''}`} />
                    <div className="tx-timeline-content">
                      <div className="tx-timeline-row">
                        <strong>Baixa {idx + 1}</strong>
                        <span className="tx-timeline-amt">{formatCurrency(s.amount)}</span>
                      </div>
                      <p className="tx-timeline-date">{formatDate(s.date)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          {remaining > 0 ? (
            <>
              <Button variant="secondary" onClick={handleClose}>Fechar</Button>
              <Button
                variant="primary"
                icon={<Check size={16} />}
                onClick={() => onPayRemaining(transaction)}
              >
                Pagar Restante ({formatCurrency(remaining)})
              </Button>
            </>
          ) : (
            <Button variant="secondary" onClick={handleClose}>Fechar</Button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
