import React from 'react';
import { createPortal } from 'react-dom';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { Button } from './Button';
import { Badge } from './Badge';
import { X, Calendar, ArrowUpRight, ArrowDownRight, Activity, Check, Trash2, AlertTriangle } from 'lucide-react';
import './PaymentModal.css';
import './TransactionDetailsModal.css';

export function TransactionDetailsModal({ transaction, onCancel, onPayRemaining, onDeleteSettlement }) {
  const [isClosing, setIsClosing] = React.useState(false);
  const containerRef = React.useRef(null);
  const lastHeightRef = React.useRef(null);

  React.useLayoutEffect(() => {
    if (containerRef.current) {
      const element = containerRef.current;
      const prevHeightStyle = element.style.height;
      element.style.height = '';
      const newHeight = element.offsetHeight;
      
      if (lastHeightRef.current !== null && lastHeightRef.current !== newHeight) {
        const oldHeight = lastHeightRef.current;
        
        element.style.transition = 'none';
        element.style.height = `${oldHeight}px`;
        element.offsetHeight; // force reflow
        
        element.style.transition = 'height 0.3s cubic-bezier(0.16, 1, 0.3, 1)';
        element.style.height = `${newHeight}px`;
        
        const timer = setTimeout(() => {
          element.style.height = '';
          element.style.transition = '';
        }, 300);
        
        lastHeightRef.current = newHeight;
        return () => clearTimeout(timer);
      } else {
        element.style.height = prevHeightStyle;
        lastHeightRef.current = newHeight;
      }
    }
  });
  const [confirmDeleteId, setConfirmDeleteId] = React.useState(null);
  const [removingId, setRemovingId] = React.useState(null);
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(false);
    const timer = setTimeout(() => {
      setIsMounted(true);
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  React.useEffect(() => {
    if (transaction) {
      setIsClosing(false);
      setConfirmDeleteId(null);
      setRemovingId(null);
    }
  }, [transaction]);

  if (!transaction) return null;

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onCancel();
    }, 180);
  };

  const handleDeleteSettlement = async (settlementId) => {
    setRemovingId(settlementId);
    // Aguarda a animação de saída (380ms no CSS) antes de chamar o backend
    setTimeout(async () => {
      try {
        if (onDeleteSettlement) {
          await onDeleteSettlement(transaction.id, settlementId);
        }
      } catch (error) {
        console.error("Erro ao excluir baixa:", error);
      } finally {
        setRemovingId(null);
        setConfirmDeleteId(null);
      }
    }, 380);
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
      <div ref={containerRef} className="modal-container tx-details-container" onClick={e => e.stopPropagation()}>

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

          {/* Barra de progresso */}
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
              <div className={`tx-timeline-empty ${!isMounted ? 'no-transition' : ''}`}>
                Nenhum pagamento registrado ainda.
              </div>
            ) : (
              <div className="tx-timeline">
                {settlements.map((s, idx) => (
                  <div key={s.id} className={`tx-timeline-slot${removingId === s.id ? ' removing' : ''}`}>
                    <div className={`tx-timeline-dot ${idx === settlements.length - 1 ? 'dot-active' : ''}`} />
                    <div className="tx-timeline-slot-inner">
                      <div className="tx-timeline-item">
                        <div className="tx-timeline-content">
                          <div className="tx-timeline-row">
                            <strong>Baixa {idx + 1}</strong>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span className="tx-timeline-amt">{formatCurrency(s.amount)}</span>
                              {onDeleteSettlement && (
                                <button
                                  className="loan-item-delete-btn"
                                  title="Excluir esta baixa"
                                  onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(s.id); }}
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    color: 'var(--text-muted)',
                                    cursor: 'pointer',
                                    padding: '2px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                  }}
                                >
                                  <Trash2 size={12} />
                                </button>
                              )}
                            </div>
                          </div>
                          <p className="tx-timeline-date">{formatDate(s.date)}</p>

                          {/* Confirmação inline com transição suave */}
                          <div className={`tx-settlement-confirm-wrapper ${confirmDeleteId === s.id ? 'open' : ''}`}>
                            <div className="tx-settlement-confirm-inner">
                              <div className="tx-settlement-confirm">
                                <AlertTriangle size={13} style={{ color: 'var(--accent-gold)', flexShrink: 0 }} />
                                <span>Excluir esta baixa e restaurar o saldo?</span>
                                <div className="tx-settlement-confirm-btns">
                                  <button
                                    className="tx-confirm-btn tx-confirm-yes"
                                    onClick={(e) => { e.stopPropagation(); handleDeleteSettlement(s.id); }}
                                  >
                                    Sim
                                  </button>
                                  <button
                                    className="tx-confirm-btn tx-confirm-no"
                                    onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(null); }}
                                  >
                                    Não
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

            )}
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <Button variant="secondary" onClick={handleClose}>Fechar</Button>
          <div className={`tx-pay-remaining-wrapper ${remaining > 0 ? 'visible' : ''} ${!isMounted ? 'no-transition' : ''}`}>
            <Button
              variant="primary"
              icon={<Check size={16} />}
              onClick={() => onPayRemaining(transaction)}
            >
              Pagar Restante ({formatCurrency(remaining)})
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
