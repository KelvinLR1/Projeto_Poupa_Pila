import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Plus, Trash2, Check } from 'lucide-react';
import { Button } from './Button';
import { formatCurrency, formatDate } from '../../utils/formatters';
import './SplitTransactionModal.css';

export function SplitTransactionModal({ ofxTx, transactions, onConfirm, onClose }) {
  const categories = useMemo(() => 
    Array.from(new Set(transactions.map(t => t.category).filter(Boolean))).sort(),
    [transactions]
  );

  // Inicializa com duas linhas para incentivar a divisão
  const [splits, setSplits] = useState([
    { amount: (ofxTx.amount / 2).toFixed(2), category: '', description: ofxTx.description },
    { amount: (ofxTx.amount - (ofxTx.amount / 2)).toFixed(2), category: '', description: ofxTx.description }
  ]);

  const totalAllocated = useMemo(() => 
    splits.reduce((sum, s) => sum + (parseFloat(s.amount) || 0), 0),
    [splits]
  );

  const diff = ofxTx.amount - totalAllocated;
  const isOk = Math.abs(diff) < 0.01;
  const isOver = totalAllocated > ofxTx.amount + 0.01;

  const addSplitRow = () => {
    // Tenta alocar o valor restante na nova linha
    const remaining = Math.max(0, diff);
    setSplits(prev => [
      ...prev,
      { 
        amount: remaining > 0 ? remaining.toFixed(2) : '0.00', 
        category: '', 
        description: ofxTx.description 
      }
    ]);
  };

  const handleSplitChange = (index, field, val) => {
    setSplits(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: val };
      return next;
    });
  };

  const removeSplitRow = (index) => {
    if (splits.length > 1) {
      setSplits(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleConfirm = () => {
    if (!isOk) return;
    
    // Valida se todos os campos estão preenchidos e válidos
    const isValid = splits.every(s => 
      s.category.trim() !== '' && 
      !isNaN(parseFloat(s.amount)) && 
      parseFloat(s.amount) > 0
    );

    if (isValid) {
      onConfirm(splits.map(s => ({
        amount: parseFloat(s.amount),
        category: s.category.trim(),
        description: s.description.trim() || ofxTx.description
      })));
    }
  };

  const isFormInvalid = useMemo(() => {
    return !isOk || splits.some(s => 
      s.category.trim() === '' || 
      isNaN(parseFloat(s.amount)) || 
      parseFloat(s.amount) <= 0
    );
  }, [splits, isOk]);

  return createPortal(
    <div className="modal-overlay split-modal-overlay" onClick={onClose}>
      <div className="modal-container split-modal-container" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="modal-header">
          <div className="modal-header-content">
            <h3>Desmembrar Lançamento</h3>
            <p>Divida esta transação do extrato em múltiplas categorias do sistema.</p>
          </div>
          <button className="close-btn" onClick={onClose} title="Fechar">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body split-modal-body">
          {/* Info Lançamento Original */}
          <div className="ofx-split-info-box">
            <span className="split-info-badge">Original</span>
            <div className="split-info-row">
              <div className="split-info-details">
                <h4>{ofxTx.description}</h4>
                <p>{formatDate(ofxTx.date)}</p>
              </div>
              <div className="split-info-amount">
                {formatCurrency(ofxTx.amount)}
              </div>
            </div>
          </div>

          {/* Lista de Splits */}
          <div className="splits-list">
            <div className="splits-header-row">
              <span className="col-amount">Valor (R$)</span>
              <span className="col-category">Categoria</span>
              <span className="col-desc">Descrição do Lançamento</span>
              <span className="col-action"></span>
            </div>

            <div className="splits-scroll-area">
              {splits.map((s, idx) => (
                <div key={idx} className="split-row animate-row-in" style={{ animationDelay: `${idx * 40}ms` }}>
                  <div className="col-amount input-wrapper-sm">
                    <span className="prefix">R$</span>
                    <input
                      type="number"
                      className="split-input amount"
                      placeholder="0.00"
                      value={s.amount}
                      onChange={e => handleSplitChange(idx, 'amount', e.target.value)}
                      step="0.01"
                      min="0.01"
                    />
                  </div>

                  <div className="col-category">
                    <input
                      type="text"
                      className="split-input category"
                      placeholder="Categoria..."
                      value={s.category}
                      onChange={e => handleSplitChange(idx, 'category', e.target.value)}
                      list="split-modal-categories"
                    />
                  </div>

                  <div className="col-desc">
                    <input
                      type="text"
                      className="split-input description"
                      placeholder="Descrição customizada..."
                      value={s.description}
                      onChange={e => handleSplitChange(idx, 'description', e.target.value)}
                    />
                  </div>

                  <div className="col-action">
                    {splits.length > 1 && (
                      <button
                        className="delete-split-btn"
                        onClick={() => removeSplitRow(idx)}
                        title="Remover divisão"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <button type="button" className="add-split-line-btn" onClick={addSplitRow}>
              <Plus size={14} />
              <span>Adicionar Linha</span>
            </button>
          </div>

          {/* Painel de Fechamento de Valores */}
          <div className={`split-balance-panel ${isOk ? 'balance-ok' : isOver ? 'balance-over' : 'balance-under'}`}>
            <div className="balance-row">
              <span className="label">Total Distribuído:</span>
              <span className="value">{formatCurrency(totalAllocated)} / {formatCurrency(ofxTx.amount)}</span>
            </div>
            
            <div className="balance-status-row">
              {isOk ? (
                <span className="status-pill status-pill-ok">
                  <Check size={12} /> Soma confere
                </span>
              ) : isOver ? (
                <span className="status-pill status-pill-error">
                  Excede em {formatCurrency(Math.abs(diff))}
                </span>
              ) : (
                <span className="status-pill status-pill-warn">
                  Restam {formatCurrency(diff)} a distribuir
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <Button variant="secondary" type="button" onClick={onClose}>Cancelar</Button>
          <Button
            variant="primary"
            type="button"
            icon={<Check size={14} />}
            onClick={handleConfirm}
            disabled={isFormInvalid}
          >
            Confirmar Divisão
          </Button>
        </div>
      </div>

      <datalist id="split-modal-categories">
        {categories.map(cat => (
          <option key={cat} value={cat} />
        ))}
      </datalist>
    </div>,
    document.body
  );
}
