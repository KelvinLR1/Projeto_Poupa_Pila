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

// Calcula a similaridade entre dois textos (para conciliação)
function similarity(a = '', b = '') {
  const na = a.toLowerCase().trim();
  const nb = b.toLowerCase().trim();
  if (na === nb) return 1;
  if (na.includes(nb) || nb.includes(na)) return 0.7;
  return 0;
}

export function OFXImport() {
  const { transactions, accounts, addTransaction } = useFinance();
  const [isDragging, setIsDragging] = useState(false);
  const [parsed, setParsed] = useState(null); // { transactions, balance, bankId }
  const [accountId, setAccountId] = useState(accounts[0]?.id || '');
  const [step, setStep] = useState('upload'); // 'upload' | 'review' | 'done'
  const [selectedTx, setSelectedTx] = useState({}); // fitId → boolean (selecionado para importar)
  const [error, setError] = useState(null);

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

  // Importa as transações selecionadas
  const handleImport = () => {
    const toImport = parsed.transactions.filter(tx => selectedTx[tx.fitId]);
    let importedCount = 0;
    toImport.forEach(tx => {
      const match = findMatch(tx);
      if (!match) {
        // Adiciona ao contexto como nova transação
        addTransaction({
          accountId: accountId,
          type: tx.type,
          amount: tx.amount,
          category: tx.type === 'income' ? 'Receita OFX' : 'Despesa OFX',
          description: tx.description,
          date: tx.date,
          status: 'paid', // Importado do banco = já foi processado
        });
        importedCount++;
      }
    });
    setStep('done');
    setParsed(prev => ({ ...prev, importedCount }));
  };

  const reset = () => {
    setParsed(null);
    setStep('upload');
    setError(null);
    setSelectedTx({});
  };

  const toggleSelect = (fitId) => {
    setSelectedTx(prev => ({ ...prev, [fitId]: !prev[fitId] }));
  };

  const selectedCount = Object.values(selectedTx).filter(Boolean).length;
  const newCount = parsed?.transactions.filter(tx => selectedTx[tx.fitId] && !findMatch(tx)).length || 0;
  const duplicateCount = parsed?.transactions.filter(tx => selectedTx[tx.fitId] && findMatch(tx)).length || 0;

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
              const match = findMatch(tx);
              const isSelected = !!selectedTx[tx.fitId];

              return (
                <div
                  key={tx.fitId}
                  className={`ofx-tx-item ${isSelected ? 'selected' : 'unselected'} ${match ? 'is-duplicate' : ''}`}
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
                    {match
                      ? <Badge variant="warning">Já existe</Badge>
                      : <Badge variant="success">Nova</Badge>
                    }
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
              disabled={newCount === 0}
            >
              Importar {newCount} transação(ões) nova(s)
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
          <h3>{parsed.importedCount} transação(ões) importada(s) com sucesso!</h3>
          <p>Os lançamentos foram adicionados ao seu extrato e o saldo da conta foi atualizado.</p>
          <Button variant="primary" onClick={reset} icon={<Upload size={18} />}>
            Importar Outro Arquivo
          </Button>
        </GlassCard>
      )}
    </div>
  );
}
