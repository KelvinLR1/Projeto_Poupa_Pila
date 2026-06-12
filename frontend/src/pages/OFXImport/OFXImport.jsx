import React, { useState, useCallback, useEffect } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { parseOFX } from '../../utils/parseOFX';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { GlassCard } from '../../components/ui/GlassCard';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import {
  Upload, FileUp, ArrowUpRight, ArrowDownRight, Check,
  RefreshCw, AlertTriangle, CheckCircle, XCircle, Landmark
} from 'lucide-react';
import './OFXImport.css';
import { CustomSelect } from '../../components/ui/CustomSelect';
import { ReconcileSelectModal, getRemainingAmount } from '../../components/ui/ReconcileSelectModal';
import { SplitTransactionModal } from '../../components/ui/SplitTransactionModal';
import { OFXLoanLinkModal } from '../../components/ui/OFXLoanLinkModal';

// Calcula a similaridade entre dois textos (para conciliação)
function similarity(a = '', b = '') {
  const na = a.toLowerCase().trim();
  const nb = b.toLowerCase().trim();
  if (na === nb) return 1;
  if (na.includes(nb) || nb.includes(na)) return 0.7;
  return 0;
}

export function OFXImport() {
  const { transactions, accounts, loans, addTransaction, markTransactionAsPaid, addLoan, payLoan } = useFinance();
  const [isDragging, setIsDragging] = useState(false);
  const [parsed, setParsed] = useState(null); // { transactions, balance, bankId }
  const [accountId, setAccountId] = useState(accounts[0]?.id || '');
  const [step, setStep] = useState('upload'); // 'upload' | 'review' | 'done'
  const [selectedTx, setSelectedTx] = useState({}); // fitId → boolean (selecionado para importar)
  const [error, setError] = useState(null);
  const [manualLinks, setManualLinks] = useState({}); // fitId -> sysTx.id ou null (caso explicitamente desvinculado)
  const [selectingFitId, setSelectingFitId] = useState(null);
  const [splittingFitId, setSplittingFitId] = useState(null);
  const [linkingLoanFitId, setLinkingLoanFitId] = useState(null);
  const [loanLinks, setLoanLinks] = useState({}); // fitId -> loanLinkData
  const [txCategories, setTxCategories] = useState({}); // fitId -> categoria personalizada

  // Preenche categorias sugeridas com base no histórico
  useEffect(() => {
    if (!parsed || !parsed.transactions) return;

    const suggested = { ...txCategories };
    let changed = false;

    parsed.transactions.forEach(tx => {
      if (!suggested[tx.fitId]) {
        // Tenta encontrar uma transação antiga com descrição similar
        const similarTx = transactions.find(sysTx => 
          similarity(sysTx.description, tx.description) >= 0.7
        );
        
        if (similarTx) {
          suggested[tx.fitId] = similarTx.category;
        } else {
          suggested[tx.fitId] = tx.type === 'income' ? 'Receita' : 'Despesa';
        }
        changed = true;
      }
    });

    if (changed) {
      setTxCategories(suggested);
    }
  }, [parsed, transactions]);

  const processOFXText = useCallback((text) => {
    try {
      const result = parseOFX(text);
      if (result.transactions.length === 0) {
        setError('Nenhuma transação encontrada no arquivo.');
        return;
      }
      // Pré-seleciona todas as transações para importar
      const initial = {};
      result.transactions.forEach(tx => { initial[tx.fitId] = true; });
      setSelectedTx(initial);
      setParsed(result);
      setStep('review');
    } catch (err) {
      setError(`Erro ao processar arquivo: ${err.message}`);
    }
  }, []);

  // Processa o arquivo OFX
  const processFile = useCallback((file) => {
    if (!file || !file.name.match(/\.(ofx|OFX)$/i)) {
      setError('Por favor, selecione um arquivo .OFX válido.');
      return;
    }
    setError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      processOFXText(e.target.result);
    };
    reader.readAsText(file, 'ISO-8859-1'); // Bancos brasileiros usam Latin-1
  }, [processOFXText]);

  // Drag and Drop
  const onDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    processFile(file);
  }, [processFile]);

  const onDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const onDragLeave = () => setIsDragging(false);

  // Verifica conciliação: encontra transação já existente no sistema
  const findMatch = useCallback((ofxTx) => {
    return transactions.find(sysTx =>
      sysTx.type === ofxTx.type &&
      sysTx.amount === ofxTx.amount &&
      sysTx.date === ofxTx.date
    ) || transactions.find(sysTx =>
      sysTx.type === ofxTx.type &&
      Math.abs(sysTx.amount - ofxTx.amount) < 0.01 &&
      similarity(sysTx.description, ofxTx.description) >= 0.7
    );
  }, [transactions]);

  // Retorna TODOS os vínculos ativos (suporte a multi-conciliação)
  const getActiveMatches = useCallback((tx) => {
    if (loanLinks[tx.fitId]) return [];
    if (manualLinks[tx.fitId] === null) return [];
    const link = manualLinks[tx.fitId];
    
    if (link) {
      const linksArray = Array.isArray(link) ? link : [link];
      return linksArray.map(item => {
        const id = typeof item === 'string' ? item : item.id;
        const reconciledAmount = (typeof item === 'object' && item !== null && 'reconciledAmount' in item)
          ? item.reconciledAmount 
          : null;
        const found = transactions.find(t => t.id === id);
        if (!found) return null;
        
        let finalAmt = reconciledAmount;
        if (finalAmt === null) {
          finalAmt = getRemainingAmount(found);
        }
        return {
          transaction: found,
          reconciledAmount: finalAmt
        };
      }).filter(Boolean);
    }

    const auto = findMatch(tx);
    if (auto) {
      return [{
        transaction: auto,
        reconciledAmount: getRemainingAmount(auto)
      }];
    }
    return [];
  }, [manualLinks, transactions, findMatch]);

  // Retorna o primeiro vínculo ativo (para checagem de "tem correspondência")
  const getActiveMatch = useCallback((tx) => {
    const matches = getActiveMatches(tx);
    return matches.length > 0 ? matches[0].transaction : null;
  }, [getActiveMatches]);

  // Importa as transações selecionadas
  const handleImport = async () => {
    const toImport = parsed.transactions.filter(tx => selectedTx[tx.fitId]);
    let importedCount = 0;

    for (const tx of toImport) {
      const manualLink = manualLinks[tx.fitId];
      const loanLink = loanLinks[tx.fitId];
      
      if (manualLink && manualLink.isNewSplit) {
        // Importa desmembrado em múltiplas novas transações
        for (const split of manualLink.splits) {
          await addTransaction({
            accountId: accountId,
            type: tx.type,
            amount: split.amount,
            category: split.category,
            description: split.description,
            date: tx.date,
            status: 'paid',
          });
        }
        importedCount++;
      } else if (loanLink) {
        // Vínculo com empréstimo:
        // 1. Cria a transação correspondente na conta bancária (atualiza o saldo bancário)
        const cat = tx.type === 'income' ? 'Recebimento de Empréstimo' : 'Empréstimo';
        await addTransaction({
          accountId: accountId,
          type: tx.type,
          amount: tx.amount,
          category: cat,
          description: tx.description,
          date: tx.date,
          status: 'paid',
        });

        // 2. Registra o histórico no empréstimo
        if (loanLink.mode === 'existing') {
          const loan = loans.find(l => l.id === loanLink.loanId);
          if (loan) {
            const isPayment = (tx.type === 'income' && loan.type === 'lent') || 
                              (tx.type === 'expense' && loan.type === 'borrowed');
            
            if (isPayment) {
              await payLoan(loan.id, tx.amount, tx.date, tx.description);
            } else {
              await addLoan({
                type: loan.type,
                counterpart: loan.counterpart,
                title: loan.title,
                amount: tx.amount,
                date: tx.date,
                dueDate: loan.dueDate || null,
                description: tx.description
              });
            }
          }
        } else if (loanLink.mode === 'new') {
          const newLoanType = tx.type === 'expense' ? 'lent' : 'borrowed';
          await addLoan({
            type: newLoanType,
            counterpart: loanLink.loanCounterpart,
            title: loanLink.loanTitle,
            amount: tx.amount,
            date: tx.date,
            dueDate: loanLink.loanDueDate || null,
            description: tx.description
          });
        }
        importedCount++;
      } else {
        const matches = getActiveMatches(tx);
        if (matches.length > 0) {
          // Marca todos os lançamentos vinculados (1 ou N) como pagos (com o valor parcial se aplicável)
          let totalMatchedAmount = 0;
          for (const { transaction, reconciledAmount } of matches) {
            if (transaction.status !== 'paid') {
              await markTransactionAsPaid(transaction.id, reconciledAmount);
            }
            totalMatchedAmount += reconciledAmount;
          }

          // Se a soma dos vínculos for menor que o valor do extrato (sobra de valor no extrato)
          const difference = tx.amount - totalMatchedAmount;
          if (difference > 0.01) {
            // Cria um lançamento residual automático para a diferença
            const cat = txCategories[tx.fitId] || (tx.type === 'income' ? 'Receita' : 'Despesa');
            await addTransaction({
              accountId: accountId,
              type: tx.type,
              amount: difference,
              category: cat,
              description: `${tx.description} (Resíduo de Conciliação)`,
              date: tx.date,
              status: 'paid',
            });
          }
          importedCount++;
        } else {
          // Sem correspondência: adiciona como nova transação paga
          const cat = txCategories[tx.fitId] || (tx.type === 'income' ? 'Receita' : 'Despesa');
          await addTransaction({
            accountId: accountId,
            type: tx.type,
            amount: tx.amount,
            category: cat,
            description: tx.description,
            date: tx.date,
            status: 'paid',
          });
          importedCount++;
        }
      }
    }

    setStep('done');
    setParsed(prev => ({ ...prev, importedCount }));
  };

  const reset = () => {
    setParsed(null);
    setStep('upload');
    setError(null);
    setSelectedTx({});
    setManualLinks({});
    setSelectingFitId(null);
    setSplittingFitId(null);
    setLinkingLoanFitId(null);
    setLoanLinks({});
    setTxCategories({});
  };

  const toggleSelect = (fitId) => {
    setSelectedTx(prev => ({ ...prev, [fitId]: !prev[fitId] }));
  };

  const selectedCount = Object.values(selectedTx).filter(Boolean).length;
  const newCount = parsed?.transactions.filter(tx => selectedTx[tx.fitId] && !getActiveMatch(tx)).length || 0;
  const duplicateCount = parsed?.transactions.filter(tx => selectedTx[tx.fitId] && getActiveMatch(tx)).length || 0;

  return (
    <div className="ofx-page">
      <div className="page-header">
        <div>
          <h2 className="page-title">Importar Extrato OFX</h2>
          <p className="page-subtitle">Importe o arquivo .OFX do seu banco e concilie automaticamente os lançamentos.</p>
        </div>
        {step !== 'upload' && (
          <Button variant="secondary" icon={<RefreshCw size={16} />} onClick={reset}>
            Nova Importação
          </Button>
        )}
      </div>

      {/* STEP 1: Upload */}
      {step === 'upload' && (
        <div
          className={`drop-zone ${isDragging ? 'dragging' : ''}`}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
        >
          <div className="drop-zone-icon">
            <FileUp size={48} />
          </div>
          <h3>Arraste o arquivo OFX aqui</h3>
          <p>ou clique para selecionar o arquivo do seu computador</p>
          <input
            type="file"
            accept=".ofx,.OFX"
            id="ofx-file-input"
            style={{ display: 'none' }}
            onChange={(e) => processFile(e.target.files[0])}
          />
          <label htmlFor="ofx-file-input" className="upload-btn">
            <Upload size={18} />
            Selecionar Arquivo .OFX
          </label>
          {error && (
            <div className="error-msg">
              <AlertTriangle size={16} />
              {error}
            </div>
          )}
        </div>
      )}

      {/* STEP 2: Review */}
      {step === 'review' && parsed && (
        <>
          {/* Resumo */}
          <div className="ofx-summary">
            <GlassCard className="summary-card">
              <Landmark size={20} className="text-emerald" />
              <div>
                <p>Banco / Instituição</p>
                <h4>{parsed.bankId}</h4>
              </div>
            </GlassCard>
            <GlassCard className="summary-card">
              <ArrowUpRight size={20} className="text-emerald" />
              <div>
                <p>Transações no arquivo</p>
                <h4>{parsed.transactions.length}</h4>
              </div>
            </GlassCard>
            <GlassCard className="summary-card new">
              <CheckCircle size={20} className="text-emerald" />
              <div>
                <p>Novas (a importar)</p>
                <h4>{newCount}</h4>
              </div>
            </GlassCard>
            <GlassCard className="summary-card duplicate">
              <XCircle size={20} />
              <div>
                <p>Duplicadas (já existem)</p>
                <h4>{duplicateCount}</h4>
              </div>
            </GlassCard>
          </div>

          {/* Seleção de conta */}
          <GlassCard className="account-selector-card">
            <label>Vincular transações à conta:</label>
            <CustomSelect
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="account-select-custom"
              options={accounts.map(acc => ({ value: acc.id, label: acc.name }))}
            />
          </GlassCard>

          {/* Lista de transações */}
          <GlassCard className="ofx-tx-list-card">
            <div className="ofx-list-header">
              <span>{selectedCount} de {parsed.transactions.length} selecionadas</span>
              <div className="ofx-list-actions">
                <button className="link-btn" onClick={() => {
                  const all = {};
                  parsed.transactions.forEach(tx => { all[tx.fitId] = true; });
                  setSelectedTx(all);
                }}>Selecionar todas</button>
                <button className="link-btn" onClick={() => setSelectedTx({})}>Desmarcar todas</button>
              </div>
            </div>

            {parsed.transactions.map((tx) => {
              const activeMatch = getActiveMatch(tx);
              const activeMatches = getActiveMatches(tx);
              const isMultiLink = activeMatches.length > 1;
              const isSelected = !!selectedTx[tx.fitId];
              
              const manualLink = manualLinks[tx.fitId];
              const isNewSplit = manualLink && manualLink.isNewSplit;
              const loanLink = loanLinks[tx.fitId];

              return (
                <div
                  key={tx.fitId}
                  className={`ofx-tx-item-wrapper ${isSelected ? 'selected' : 'unselected'} ${activeMatch ? 'has-match' : 'no-match'}`}
                >
                  <div
                    className={`ofx-tx-item ${activeMatch ? 'is-duplicate' : ''}`}
                    onClick={() => toggleSelect(tx.fitId)}
                  >
                    <div className="ofx-tx-checkbox">
                      {isSelected ? <Check size={14} /> : null}
                    </div>
                    <div className="tx-icon glass">
                      {tx.type === 'income'
                        ? <ArrowUpRight size={18} className="text-emerald" />
                        : <ArrowDownRight size={18} className="text-coral" />
                      }
                    </div>
                    <div className="tx-details">
                      <h4>{tx.description}</h4>
                      <p>{formatDate(tx.date)}</p>
                    </div>
                    <div className="tx-amount-col">
                      <span className={`tx-amount ${tx.type === 'income' ? 'text-emerald' : ''}`}>
                        {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                      </span>
                      {isNewSplit
                        ? <Badge variant="warning">Desmembrado</Badge>
                        : loanLink
                        ? <Badge variant="purple">Empréstimo</Badge>
                        : isMultiLink
                        ? <Badge variant="warning">{activeMatches.length} vínculos</Badge>
                        : activeMatch
                        ? <Badge variant="warning">Já existe</Badge>
                        : <Badge variant="success">Nova</Badge>
                      }
                    </div>
                  </div>

                  {/* Informações de Conciliação */}
                  <div className="reconciliation-info">
                    {loanLink ? (
                      // Vinculado a empréstimo
                      <div className="rec-matched-container rec-loan-container">
                        <div className="rec-match-details">
                          <span className="rec-label rec-label-loan" style={{ color: 'var(--accent-purple, #a78bfa)' }}>Empréstimo:</span>
                          <span className="rec-text-desc">
                            {loanLink.mode === 'existing' ? (
                              <>
                                Vincular ao empréstimo existente de:{' '}
                                <strong>{loans.find(l => l.id === loanLink.loanId)?.counterpart || 'Desconhecido'}</strong>
                              </>
                            ) : (
                              <>
                                Criar novo empréstimo para:{' '}
                                <strong>{loanLink.loanCounterpart}</strong>
                                {loanLink.loanTitle && ` (${loanLink.loanTitle})`}
                              </>
                            )}
                          </span>
                        </div>
                        <div className="rec-actions">
                          <button
                            type="button"
                            className="rec-action-btn unlink-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              setLoanLinks(prev => {
                                const next = { ...prev };
                                delete next[tx.fitId];
                                return next;
                              });
                            }}
                          >
                            Desvincular
                          </button>
                        </div>
                      </div>
                    ) : isNewSplit ? (
                      // Desmembrado em múltiplas categorias
                      <div className="rec-matched-container rec-split-container">
                        <div className="rec-match-details">
                          <span className="rec-label rec-label-split">Lançamento Desmembrado ({manualLink.splits.length} partes):</span>
                          <div className="rec-split-list">
                            {manualLink.splits.map((split, i) => (
                              <span key={i} className="rec-split-item">
                                <span className="rec-split-item-cat">[{split.category}]</span>{' '}
                                <span className="rec-split-item-desc">{split.description}</span>{' '}
                                <span className="rec-split-item-amount">{formatCurrency(split.amount)}</span>
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="rec-actions">
                          <button
                            type="button"
                            className="rec-action-btn change-btn"
                            onClick={(e) => { e.stopPropagation(); setSplittingFitId(tx.fitId); }}
                          >
                            Alterar divisão
                          </button>
                          <span className="divider">|</span>
                          <button
                            type="button"
                            className="rec-action-btn unlink-btn"
                            onClick={(e) => { e.stopPropagation(); setManualLinks(prev => ({ ...prev, [tx.fitId]: null })); }}
                          >
                            Desvincular
                          </button>
                        </div>
                      </div>
                    ) : isMultiLink ? (
                      // Multi-vínculo: N lançamentos vinculados
                      <div className="rec-matched-container rec-multi-container">
                        <div className="rec-match-details">
                          <span className="rec-label rec-label-multi">Multi-vínculo ({activeMatches.length} lançamentos):</span>
                          <div className="rec-multi-list">
                            {activeMatches.map(({ transaction: m, reconciledAmount }) => (
                              <span key={m.id} className="rec-multi-item">
                                <span className="rec-multi-item-desc">{m.description || 'Sem descrição'}</span>
                                <span className="rec-multi-item-amount">
                                  {reconciledAmount < m.amount ? (
                                    <>
                                      <span className="partial-badge">Parcial</span> {formatCurrency(reconciledAmount)} <span className="total-val">de {formatCurrency(m.amount)}</span>
                                    </>
                                  ) : (
                                    formatCurrency(m.amount)
                                  )}
                                </span>
                              </span>
                            ))}
                            <span className="rec-multi-total">
                              Soma: {formatCurrency(activeMatches.reduce((s, item) => s + item.reconciledAmount, 0))}
                              {tx.amount - activeMatches.reduce((s, item) => s + item.reconciledAmount, 0) > 0.01 && (
                                <span className="rec-multi-residual-warning">
                                  (Resíduo de {formatCurrency(tx.amount - activeMatches.reduce((s, item) => s + item.reconciledAmount, 0))} será criado como lançamento pago)
                                </span>
                              )}
                            </span>
                          </div>
                        </div>
                        <div className="rec-actions">
                          <button
                            type="button"
                            className="rec-action-btn change-btn"
                            onClick={(e) => { e.stopPropagation(); setSelectingFitId(tx.fitId); }}
                          >
                            Alterar vínculo
                          </button>
                          <span className="divider">|</span>
                          <button
                            type="button"
                            className="rec-action-btn unlink-btn"
                            onClick={(e) => { e.stopPropagation(); setManualLinks(prev => ({ ...prev, [tx.fitId]: null })); }}
                          >
                            Desvincular
                          </button>
                        </div>
                      </div>
                    ) : activeMatch ? (
                      // Vínculo único
                      <div className="rec-matched-container">
                        <div className="rec-match-details">
                          <span className="rec-label">Correspondência:</span>
                          <span className="rec-text-desc">
                            {activeMatch.description || 'Sem descrição'} ({formatDate(activeMatch.date)}) —{' '}
                            {(() => {
                              const matchObj = activeMatches[0];
                              const recAmt = matchObj ? matchObj.reconciledAmount : activeMatch.amount;
                              if (recAmt < activeMatch.amount) {
                                return (
                                  <>
                                    <span className="partial-badge">Parcial</span> <strong>{formatCurrency(recAmt)}</strong> <span className="total-val">de {formatCurrency(activeMatch.amount)}</span>
                                  </>
                                );
                              }
                              return <strong>{formatCurrency(activeMatch.amount)}</strong>;
                            })()}{' '}
                            ({accounts.find(a => a.id === activeMatch.accountId)?.name || 'Conta desconhecida'})
                          </span>
                          {tx.amount - activeMatches.reduce((s, item) => s + item.reconciledAmount, 0) > 0.01 && (
                            <span className="rec-multi-residual-warning" style={{ display: 'block', width: '100%', marginTop: '4px' }}>
                              (Resíduo de {formatCurrency(tx.amount - activeMatches.reduce((s, item) => s + item.reconciledAmount, 0))} será criado como lançamento pago)
                            </span>
                          )}
                        </div>
                        <div className="rec-actions">
                          <button
                            type="button"
                            className="rec-action-btn change-btn"
                            onClick={(e) => { e.stopPropagation(); setSelectingFitId(tx.fitId); }}
                          >
                            Alterar vínculo
                          </button>
                          <span className="divider">|</span>
                          <button
                            type="button"
                            className="rec-action-btn unlink-btn"
                            onClick={(e) => { e.stopPropagation(); setManualLinks(prev => ({ ...prev, [tx.fitId]: null })); }}
                          >
                            Desvincular (Importar como nova)
                          </button>
                        </div>
                      </div>
                    ) : (
                      // Sem correspondência
                      <div className="rec-unmatched-container">
                        <div className="unmatched-row">
                          <span className="rec-text-desc text-muted">
                            Sem correspondência (será importada como nova transação)
                          </span>
                          <div className="ofx-category-select-wrapper">
                            <span className="ofx-category-label">Categoria:</span>
                            <input
                              type="text"
                              list="existing-categories"
                              className="ofx-category-input"
                              value={txCategories[tx.fitId] || ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                setTxCategories(prev => ({ ...prev, [tx.fitId]: val }));
                              }}
                              onClick={(e) => e.stopPropagation()}
                              placeholder="Selecione ou digite..."
                            />
                          </div>
                        </div>
                        <div className="rec-actions">
                          <button
                            type="button"
                            className="rec-action-btn link-btn-text"
                            onClick={(e) => { e.stopPropagation(); setSelectingFitId(tx.fitId); }}
                          >
                            Vincular a lançamento existente
                          </button>
                          <span className="divider">|</span>
                          <button
                            type="button"
                            className="rec-action-btn link-btn-text text-purple"
                            onClick={(e) => { e.stopPropagation(); setSplittingFitId(tx.fitId); }}
                          >
                            Dividir em categorias
                          </button>
                          <span className="divider">|</span>
                          <button
                            type="button"
                            className="rec-action-btn link-btn-text text-purple"
                            onClick={(e) => { e.stopPropagation(); setLinkingLoanFitId(tx.fitId); }}
                          >
                            Vincular a empréstimo
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </GlassCard>

          <div className="import-actions">
            <Button variant="secondary" onClick={reset}>Cancelar</Button>
            <Button
              variant="primary"
              icon={<Check size={18} />}
              onClick={handleImport}
              disabled={selectedCount === 0}
            >
              Confirmar Importação ({selectedCount})
            </Button>
          </div>
        </>
      )}

      {/* STEP 3: Done */}
      {step === 'done' && (
        <GlassCard className="done-card animate-slide-up">
          <div className="done-icon">
            <CheckCircle size={64} className="text-emerald" />
          </div>
          <h3>{parsed.importedCount} transação(ões) importada(s)/conciliada(s) com sucesso!</h3>
          <p>Os lançamentos foram atualizados e consolidados no seu extrato.</p>
          <Button variant="primary" onClick={reset} icon={<Upload size={18} />}>
            Importar Outro Extrato
          </Button>
        </GlassCard>
      )}

      {selectingFitId && (
        <ReconcileSelectModal
          ofxTx={parsed.transactions.find(t => t.fitId === selectingFitId)}
          transactions={transactions}
          accounts={accounts}
          onSelect={(sysTxOrArray) => {
            if (Array.isArray(sysTxOrArray)) {
              // Multi-vínculo: salva array de objetos { id, reconciledAmount }
              setManualLinks(prev => ({
                ...prev,
                [selectingFitId]: sysTxOrArray.map(item => ({
                  id: item.transaction.id,
                  reconciledAmount: item.reconciledAmount
                }))
              }));
            } else {
              // Vínculo único
              setManualLinks(prev => ({ ...prev, [selectingFitId]: sysTxOrArray.id }));
            }
            setSelectingFitId(null);
          }}
          onClose={() => setSelectingFitId(null)}
        />
      )}

      {splittingFitId && (
        <SplitTransactionModal
          ofxTx={parsed.transactions.find(t => t.fitId === splittingFitId)}
          transactions={transactions}
          onConfirm={(splits) => {
            setManualLinks(prev => ({
              ...prev,
              [splittingFitId]: {
                isNewSplit: true,
                splits: splits
              }
            }));
            setSplittingFitId(null);
          }}
          onClose={() => setSplittingFitId(null)}
        />
      )}

      {linkingLoanFitId && (
        <OFXLoanLinkModal
          ofxTx={parsed.transactions.find(t => t.fitId === linkingLoanFitId)}
          loans={loans}
          onConfirm={(loanLinkData) => {
            setLoanLinks(prev => ({
              ...prev,
              [linkingLoanFitId]: loanLinkData
            }));
            // Limpa correspondências automáticas ou manuais caso o empréstimo seja vinculado
            setManualLinks(prev => ({ ...prev, [linkingLoanFitId]: null }));
            setLinkingLoanFitId(null);
          }}
          onClose={() => setLinkingLoanFitId(null)}
        />
      )}

      <datalist id="existing-categories">
        {Array.from(new Set(transactions.map(t => t.category).filter(Boolean))).map(cat => (
          <option key={cat} value={cat} />
        ))}
      </datalist>
    </div>
  );
}
