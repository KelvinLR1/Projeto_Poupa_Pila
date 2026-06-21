import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { Button } from './Button';
import { Badge } from './Badge';
import { X, Calendar, ArrowUpRight, ArrowDownRight, Activity, Check, Trash2, AlertTriangle } from 'lucide-react';
import './PaymentModal.css';
import './TransactionDetailsModal.css';

const PaymentHistoryItem = ({ settlement, idx, isLast, onDelete, isRemoving }) => {
  const [confirming, setConfirming] = useState(false);
  const hasExtras = (settlement.interest > 0) || (settlement.discount > 0);
  const effectiveAmount = settlement.amount + (settlement.interest || 0) - (settlement.discount || 0);

  return (
    <div className={`phi-item ${isRemoving ? 'is-removing' : ''}`}>
      <div className="phi-connector">
        <div className={`phi-dot ${isLast ? 'active' : ''}`} />
        {!isLast && <div className="phi-line" />}
      </div>
      <div className="phi-content glass">
        {confirming ? (
          <div className="phi-confirm animate-fade-in">
             <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
               <AlertTriangle size={14} />
               <span>Excluir baixa?</span>
             </div>
             <div className="phi-actions">
               <button 
                 className="phi-btn phi-btn-danger" 
                 onClick={(e) => { e.stopPropagation(); onDelete(settlement.id); }}
               >
                 Sim
               </button>
               <button 
                 className="phi-btn" 
                 onClick={(e) => { e.stopPropagation(); setConfirming(false); }}
               >
                 Não
               </button>
             </div>
          </div>
        ) : (
          <div className="phi-info animate-fade-in">
            <div className="phi-header">
              <strong>Baixa {idx + 1}</strong>
              <div style={{display: 'flex', gap: '8px', alignItems: 'center'}}>
                <span className="phi-amount" title="Valor que abata a conta original">{formatCurrency(settlement.amount)}</span>
                <button className="phi-delete-btn" onClick={(e) => { e.stopPropagation(); setConfirming(true); }} title="Excluir">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            <span className="phi-date">{formatDate(settlement.date)}</span>
            
            {hasExtras && (
              <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px dashed rgba(255,255,255,0.08)', fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {settlement.interest > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--accent-coral)' }}>
                    <span>+ Juros / Multa:</span>
                    <span>{formatCurrency(settlement.interest)}</span>
                  </div>
                )}
                {settlement.discount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--accent-emerald)' }}>
                    <span>- Desconto:</span>
                    <span>{formatCurrency(settlement.discount)}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', fontWeight: 600, marginTop: '2px' }}>
                  <span>Total no banco:</span>
                  <span>{formatCurrency(effectiveAmount)}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export function TransactionDetailsModal({ transaction, onCancel, onPayRemaining, onDeleteSettlement, onDeleteTransaction }) {
  const [isClosing, setIsClosing] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [removingId, setRemovingId] = useState(null);

  useEffect(() => {
    setIsMounted(false);
    const timer = setTimeout(() => {
      setIsMounted(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (transaction) {
      setIsClosing(false);
      setRemovingId(null);
    }
  }, [transaction]);

  if (!transaction) return null;

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onCancel();
    }, 280);
  };

  const handleDeleteSettlement = async (settlementId) => {
    setRemovingId(settlementId);
    // Aguarda a animação CSS (350ms)
    setTimeout(async () => {
      try {
        if (onDeleteSettlement) {
          await onDeleteSettlement(transaction.id, settlementId);
        }
      } catch (error) {
        console.error("Erro ao excluir baixa:", error);
      } finally {
        setRemovingId(null);
      }
    }, 350);
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
                <span className="tx-date-chip" title="Data de Vencimento">
                  <Calendar size={12} />
                  Venc: {formatDate(transaction.date)}
                </span>
                {transaction.competence_date && transaction.competence_date !== transaction.date && (
                  <span className="tx-date-chip" title="Data da Compra" style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                    <Calendar size={12} />
                    Compra: {formatDate(transaction.competence_date)}
                  </span>
                )}
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
              <div className="tx-timeline-empty">
                Nenhum pagamento registrado ainda.
              </div>
            ) : (
              <div className="phi-list">
                {settlements.map((s, idx) => (
                  <PaymentHistoryItem 
                    key={s.id} 
                    settlement={s} 
                    idx={idx} 
                    isLast={idx === settlements.length - 1}
                    onDelete={handleDeleteSettlement}
                    isRemoving={removingId === s.id}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer" style={{ display: 'flex', gap: '10px' }}>
          {settlements.length === 0 ? (
            <Button 
              variant="secondary" 
              onClick={() => onDeleteTransaction && onDeleteTransaction(transaction.id)}
              style={{ 
                marginRight: 'auto', 
                background: 'rgba(244, 63, 94, 0.08)', 
                color: 'var(--accent-coral)', 
                borderColor: 'rgba(244, 63, 94, 0.15)',
                transition: 'all 200ms ease'
              }}
              icon={<Trash2 size={16} />}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(244, 63, 94, 0.15)';
                e.currentTarget.style.borderColor = 'rgba(244, 63, 94, 0.25)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(244, 63, 94, 0.08)';
                e.currentTarget.style.borderColor = 'rgba(244, 63, 94, 0.15)';
              }}
            >
              Excluir
            </Button>
          ) : (
            <Button variant="secondary" onClick={handleClose} style={{ marginRight: 'auto' }}>Fechar</Button>
          )}
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
