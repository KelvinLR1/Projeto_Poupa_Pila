import React, { useState, useCallback } from 'react';
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
import { ReconcileSelectModal } from '../../components/ui/ReconcileSelectModal';

// Calcula a similaridade entre dois textos (para conciliação)
function similarity(a = '', b = '') {
  const na = a.toLowerCase().trim();
  const nb = b.toLowerCase().trim();
  if (na === nb) return 1;
  if (na.includes(nb) || nb.includes(na)) return 0.7;
  return 0;
}

export function OFXImport() {
  const { transactions, accounts, addTransaction, markTransactionAsPaid } = useFinance();
  const [isDragging, setIsDragging] = useState(false);
  const [parsed, setParsed] = useState(null); // { transactions, balance, bankId }
  const [accountId, setAccountId] = useState(accounts[0]?.id || '');
  const [step, setStep] = useState('upload'); // 'upload' | 'review' | 'done'
  const [selectedTx, setSelectedTx] = useState({}); // fitId → boolean (selecionado para importar)
  const [error, setError] = useState(null);
  const [manualLinks, setManualLinks] = useState({}); // fitId -> sysTx.id ou null (caso explicitamente desvinculado)
  const [selectingFitId, setSelectingFitId] = useState(null);

  // Processa o arquivo OFX
  const processFile = useCallback((file) => {
    if (!file || !file.name.match(/\.(ofx|OFX)$/i)) {
      setError('Por favor, selecione um arquivo .OFX válido.');
      return;
    }
    setError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const result = parseOFX(e.target.result);
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
    };
    reader.readAsText(file, 'ISO-8859-1'); // Bancos brasileiros usam Latin-1
  }, []);

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

  // Retorna o vínculo ativo da transação OFX (seja automático ou configurado manualmente)
  const getActiveMatch = useCallback((tx) => {
    if (manualLinks[tx.fitId] === null) return null; // Usuário desvinculou explicitamente
    if (manualLinks[tx.fitId]) {
      return transactions.find(t => t.id === manualLinks[tx.fitId]);
    }
    return findMatch(tx);
  }, [manualLinks, transactions, findMatch]);

  // Importa as transações selecionadas
  const handleImport = async () => {
    const toImport = parsed.transactions.filter(tx => selectedTx[tx.fitId]);
    let importedCount = 0;

    for (const tx of toImport) {
      const match = getActiveMatch(tx);
      if (match) {
        // Se já existe e está como pendente no sistema, quita/marca como paga
        if (match.status === 'pending') {
          await markTransactionAsPaid(match.id);
        }
        // Se já está paga, apenas ignora para não criar duplicado
      } else {
        // Sem correspondência: adiciona como nova transação paga
        await addTransaction({
          accountId: accountId,
          type: tx.type,
          amount: tx.amount,
          category: tx.type === 'income' ? 'Receita OFX' : 'Despesa OFX',
          description: tx.description,
          date: tx.date,
          status: 'paid', // Transações consolidadas do extrato já são pagas
        });
        importedCount++;
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
              const isSelected = !!selectedTx[tx.fitId];

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
                      {activeMatch
                        ? <Badge variant="warning">Já existe</Badge>
                        : <Badge variant="success">Nova</Badge>
                      }
                    </div>
                  </div>

                  {/* Informações de Conciliação */}
                  <div className="reconciliation-info">
                    {activeMatch ? (
                      <div className="rec-matched-container">
                        <div className="rec-match-details">
                          <span className="rec-label">Correspondência:</span>
                          <span className="rec-text-desc">
                            {activeMatch.description || 'Sem descrição'} ({formatDate(activeMatch.date)}) — {formatCurrency(activeMatch.amount)} ({accounts.find(a => a.id === activeMatch.accountId)?.name || 'Conta desconhecida'})
                          </span>
                        </div>
                        <div className="rec-actions">
                          <button
                            type="button"
                            className="rec-action-btn change-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectingFitId(tx.fitId);
                            }}
                          >
                            Alterar vínculo
                          </button>
                          <span className="divider">|</span>
                          <button
                            type="button"
                            className="rec-action-btn unlink-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              setManualLinks(prev => ({ ...prev, [tx.fitId]: null }));
                            }}
                          >
                            Desvincular (Importar como nova)
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="rec-unmatched-container">
                        <span className="rec-text-desc text-muted">
                          Sem correspondência (será importada como nova transação quitada)
                        </span>
                        <div className="rec-actions">
                          <button
                            type="button"
                            className="rec-action-btn link-btn-text"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectingFitId(tx.fitId);
                            }}
                          >
                            Vincular a lançamento existente
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
          onSelect={(sysTx) => {
            setManualLinks(prev => ({ ...prev, [selectingFitId]: sysTx.id }));
            setSelectingFitId(null);
          }}
          onClose={() => setSelectingFitId(null)}
        />
      )}
    </div>
  );
}
