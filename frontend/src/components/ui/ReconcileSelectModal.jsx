import React, { useState, useMemo, useLayoutEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Search, ArrowUpRight, ArrowDownRight, Check, SlidersHorizontal } from 'lucide-react';
import { Button } from './Button';
import { Badge } from './Badge';
import { CustomSelect } from './CustomSelect';
import { CustomDatePicker } from './CustomDatePicker';
import { formatCurrency, formatDate } from '../../utils/formatters';
import './PaymentModal.css';
import './ReconcileSelectModal.css';

function scoreText(haystack = '', needle = '') {
  if (!needle) return 0;
  const h = haystack.toLowerCase().trim();
  const n = needle.toLowerCase().trim();
  if (h === n) return 1;
  if (h.includes(n)) return 0.8;
  const words = n.split(/\s+/).filter(Boolean);
  const matchedWords = words.filter(w => h.includes(w));
  if (matchedWords.length > 0) return 0.4 + (matchedWords.length / words.length) * 0.3;
  return 0;
}

function highlight(text = '', query = '') {
  if (!query.trim()) return text;
  const regex = new RegExp(`(${query.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);
  return parts.map((part, i) =>
    regex.test(part) ? <mark key={i} className="search-highlight">{part}</mark> : part
  );
}

function ScoreBadge({ score }) {
  const pct = Math.round(score * 100);
  const tier = pct >= 70 ? 'high' : pct >= 40 ? 'mid' : 'low';
  return (
    <span className={`score-badge score-${tier}`} title={`Similaridade: ${pct}%`}>
      {pct}%
    </span>
  );
}

export function ReconcileSelectModal({ ofxTx, transactions, accounts, onSelect, onClose }) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [accountFilter, setAccountFilter] = useState('all');
  const [showNearValue, setShowNearValue] = useState(false);
  const [dateFilter, setDateFilter] = useState('');

  const ofxAmount = ofxTx.amount;
  const ofxDateVal = new Date(ofxTx.date).getTime();

  const accountOptions = [
    { value: 'all', label: 'Todas as contas' },
    ...accounts.map(a => ({ value: a.id, label: a.name })),
  ];

  const statusOptions = [
    { value: 'all', label: 'Qualquer status' },
    { value: 'pending', label: 'Pendentes' },
    { value: 'paid', label: 'Pagos' },
  ];

  const scored = useMemo(() => {
    return transactions
      .filter(t => t.type === ofxTx.type)
      .map(t => {
        const amountDiff = Math.abs(t.amount - ofxAmount);
        const amountScore = amountDiff < 0.01 ? 1 : amountDiff < ofxAmount * 0.05 ? 0.5 : amountDiff < ofxAmount * 0.2 ? 0.2 : 0;
        const dateDiffDays = Math.abs(new Date(t.date).getTime() - ofxDateVal) / (1000 * 60 * 60 * 24);
        const dateScore = dateDiffDays === 0 ? 1 : dateDiffDays <= 3 ? 0.8 : dateDiffDays <= 7 ? 0.5 : dateDiffDays <= 30 ? 0.2 : 0;
        const descScore = scoreText(t.description, search || ofxTx.description);
        return {
          ...t,
          _score: amountScore * 0.45 + dateScore * 0.3 + descScore * 0.25,
          _isExact: amountDiff < 0.01,
          _isNear: amountDiff < ofxAmount * 0.1,
        };
      });
  }, [transactions, ofxTx, ofxAmount, ofxDateVal, search]);

  const filtered = useMemo(() => {
    return scored.filter(t => {
      if (statusFilter !== 'all' && t.status !== statusFilter) return false;
      if (accountFilter !== 'all' && t.accountId !== accountFilter) return false;
      if (showNearValue && !t._isNear) return false;
      if (dateFilter && t.date !== dateFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const accountName = (accounts.find(a => a.id === t.accountId)?.name || '').toLowerCase();
        if (
          !(t.description || '').toLowerCase().includes(q) &&
          !formatCurrency(t.amount).includes(q) &&
          !String(t.amount).includes(q) &&
          !(t.date || '').includes(q) &&
          !accountName.includes(q)
        ) return false;
      }
      return true;
    });
  }, [scored, statusFilter, accountFilter, showNearValue, dateFilter, search, accounts]);

  const sortedCandidates = useMemo(() =>
    [...filtered].sort((a, b) => b._score - a._score),
    [filtered]
  );

  const hasActiveFilters = statusFilter !== 'all' || accountFilter !== 'all' || showNearValue || !!dateFilter || !!search;

  const clearAllFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setAccountFilter('all');
    setShowNearValue(false);
    setDateFilter('');
  };

  // Refs para animar a altura da lista
  const listWrapperRef = useRef(null);
  const listInnerRef = useRef(null);

  // Anima a altura do wrapper quando o número de resultados muda
  useLayoutEffect(() => {
    const wrapper = listWrapperRef.current;
    const inner = listInnerRef.current;
    if (!wrapper) return;
    const MAX_H = 320;
    const MIN_H = 80;
    const contentH = inner ? inner.scrollHeight : MIN_H;
    const targetH = Math.min(Math.max(contentH, MIN_H), MAX_H);
    wrapper.style.height = `${targetH}px`;
  }, [sortedCandidates.length]);

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container reconcile-select-container" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="modal-header">
          <div className="modal-header-content">
            <h3>Vincular a Lançamento Existente</h3>
            <p>Selecione o lançamento do sistema correspondente a este registro do extrato.</p>
          </div>
          <button className="close-btn" onClick={onClose} title="Fechar"><X size={18} /></button>
        </div>

        <div className="modal-body reconcile-select-body">

          {/* Painel OFX */}
          <div className="ofx-source-info">
            <span className="info-badge">Extrato OFX</span>
            <div className="ofx-source-row">
              <div className={`ofx-type-icon ${ofxTx.type}`}>
                {ofxTx.type === 'income'
                  ? <ArrowUpRight size={16} />
                  : <ArrowDownRight size={16} />}
              </div>
              <div className="ofx-source-details">
                <h4>{ofxTx.description}</h4>
                <p>{formatDate(ofxTx.date)}</p>
              </div>
              <div className={`ofx-source-amount ${ofxTx.type === 'income' ? 'income' : 'expense'}`}>
                {ofxTx.type === 'income' ? '+' : '-'}{formatCurrency(ofxTx.amount)}
              </div>
            </div>
          </div>

          {/* Busca */}
          <div className="search-bar-wrapper">
            <Search size={15} className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Buscar por descrição, valor ou conta..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              autoFocus
            />
            {search && (
              <button className="search-clear-btn" onClick={() => setSearch('')}>
                <X size={13} />
              </button>
            )}
          </div>

          {/* Filtros — tudo em uma linha */}
          <div className="filter-row">
            <SlidersHorizontal size={13} className="filter-icon-lead" />

            <CustomSelect
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              options={statusOptions}
              className="filter-select-sm"
            />

            <div className="filter-sep" />

            <button
              className={`filter-toggle ${showNearValue ? 'active' : ''}`}
              onClick={() => setShowNearValue(v => !v)}
            >
              ≈ Valor próximo
            </button>

            <div className="filter-sep" />

            {accounts.length > 1 && (
              <CustomSelect
                value={accountFilter}
                onChange={e => setAccountFilter(e.target.value)}
                options={accountOptions}
                className="filter-select-sm"
              />
            )}

            <div className="filter-sep" />

            <CustomDatePicker
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value)}
              placeholder="Qualquer data"
              className="filter-select-sm filter-datepicker"
            />
            {dateFilter && (
              <button className="filter-date-clear" onClick={() => setDateFilter('')} title="Limpar data">
                <X size={11} />
              </button>
            )}
          </div>

          {/* Linha de resultados abaixo dos filtros */}
          <div className="results-bar">
            <span className="results-count">
              {sortedCandidates.length} resultado{sortedCandidates.length !== 1 ? 's' : ''}
            </span>
            {hasActiveFilters && (
              <button className="clear-all-btn" onClick={clearAllFilters}>
                Limpar filtros
              </button>
            )}
          </div>

          {/* Lista */}
          <div className="candidates-list-wrapper" ref={listWrapperRef}>
            {sortedCandidates.length === 0 ? (
              <div className="empty-candidates" ref={listInnerRef}>
                <Search size={28} className="empty-icon" />
                <p>Nenhum lançamento encontrado.</p>
              </div>
            ) : (
              <div className="candidates-list" ref={listInnerRef}>
                {sortedCandidates.map((t, index) => {
                  const account = accounts.find(a => a.id === t.accountId);
                  return (
                    <div
                      key={t.id}
                      className={`candidate-item ${t._isExact ? 'exact-match' : ''}`}
                      style={{ animationDelay: `${index * 35}ms` }}
                    >

                      {/* Info */}
                      <div className="candidate-info">
                        <div className="candidate-top-row">
                          <h4 className="candidate-desc">
                            {highlight(t.description || 'Sem descrição', search)}
                          </h4>
                          {t._isExact && <span className="exact-pill">✓ Idêntico</span>}
                        </div>
                        <div className="candidate-meta">
                          <span>{formatDate(t.date)}</span>
                          <span className="meta-dot">·</span>
                          <span>{account?.name ?? 'Conta desconhecida'}</span>
                          <span className="meta-dot">·</span>
                          {t.status === 'paid'
                            ? <Badge variant="success">Pago</Badge>
                            : <Badge variant="warning">Pendente</Badge>}
                        </div>
                      </div>

                      {/* Direita: valor + score + botão */}
                      <div className="candidate-right">
                        <div className="candidate-amount-block">
                          <span className={`candidate-amount ${t.type === 'income' ? 'income' : 'expense'}`}>
                            {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                          </span>
                          <ScoreBadge score={t._score} />
                        </div>
                        <button
                          type="button"
                          className="select-candidate-btn"
                          onClick={() => onSelect(t)}
                        >
                          <Check size={13} /> Vincular
                        </button>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        <div className="modal-footer">
          <Button variant="secondary" type="button" onClick={onClose}>Cancelar</Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
