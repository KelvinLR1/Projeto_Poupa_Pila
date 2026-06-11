import React, { useState, useMemo, useEffect } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, Calendar, DollarSign } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import './CashFlow.css';

export function CashFlow() {
  const { accounts, transactions, loans, hideValues } = useFinance();
  const [projectionDays, setProjectionDays] = useState(30); // 30, 60, 90 dias
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [visibleEventsCount, setVisibleEventsCount] = useState(15);

  useEffect(() => {
    setVisibleEventsCount(15);
  }, [projectionDays]);

  // 1. Saldo Inicial (consolidado de todas as contas ativas)
  const initialBalance = useMemo(() => {
    return accounts.reduce((acc, curr) => acc + (curr.active ? curr.balance : 0), 0);
  }, [accounts]);

  // 2. Compilar eventos futuros de fluxo de caixa no período selecionado
  const projectionData = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const maxDate = new Date(today);
    maxDate.setDate(today.getDate() + projectionDays);

    const events = [];

    // Adiciona transações pendentes/parciais
    transactions.forEach(tx => {
      if (tx.status === 'paid') return; // Já liquidada, logo já está no saldo inicial

      const txDate = new Date(tx.date);
      txDate.setHours(0, 0, 0, 0);

      // Considera transações passadas que ainda estão pendentes como imediatas (hoje)
      const eventDate = txDate < today ? new Date(today) : txDate;

      if (eventDate <= maxDate) {
        const alreadyPaid = (tx.settlements || []).reduce((acc, s) => acc + s.amount, 0);
        const outstanding = tx.amount - alreadyPaid;

        if (outstanding > 0) {
          events.push({
            id: `tx-${tx.id}`,
            date: eventDate,
            dateStr: eventDate.toISOString().split('T')[0],
            description: tx.description || tx.category,
            category: tx.category,
            amount: outstanding,
            type: tx.type, // 'income' ou 'expense'
            source: 'transaction',
            is_forecast: tx.is_forecast === 1
          });
        }
      }
    });

    // Adiciona empréstimos ativos com vencimento no período
    loans.forEach(loan => {
      if (loan.status === 'settled' || !loan.dueDate) return;

      const loanDate = new Date(loan.dueDate);
      loanDate.setHours(0, 0, 0, 0);

      const eventDate = loanDate < today ? new Date(today) : loanDate;

      if (eventDate <= maxDate) {
        const remaining = loan.totalAmount - loan.paidAmount;
        if (remaining > 0) {
          events.push({
            id: `loan-${loan.id}`,
            date: eventDate,
            dateStr: eventDate.toISOString().split('T')[0],
            description: `Vcto. Empréstimo: ${loan.counterpart}`,
            category: 'Empréstimo',
            amount: remaining,
            type: loan.type === 'lent' ? 'income' : 'expense', // 'lent' é entrada prevista, 'borrowed' é saída
            source: 'loan'
          });
        }
      }
    });

    // Ordena os eventos por data de forma crescente
    events.sort((a, b) => a.date - b.date);

    // Calcular saldo acumulado dia a dia
    let currentCumulative = initialBalance;
    const dailyPoints = [];

    // Adiciona o ponto inicial (hoje)
    dailyPoints.push({
      dayOffset: 0,
      date: new Date(today),
      dateStr: today.toISOString().split('T')[0],
      balance: currentCumulative,
      inflow: 0,
      outflow: 0,
      events: []
    });

    // Cria mapa de eventos por dia relativo a hoje
    const dailyEventsMap = {};
    events.forEach(event => {
      const diffTime = Math.abs(event.date - today);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (!dailyEventsMap[diffDays]) {
        dailyEventsMap[diffDays] = [];
      }
      dailyEventsMap[diffDays].push(event);
    });

    let totalInflow = 0;
    let totalOutflow = 0;
    let deficitDate = null;
    let deficitAmount = null;

    // Popula a projeção para cada dia da janela
    for (let d = 1; d <= projectionDays; d++) {
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() + d);

      const dayEvents = dailyEventsMap[d] || [];
      let dayInflow = 0;
      let dayOutflow = 0;

      dayEvents.forEach(e => {
        if (e.type === 'income') {
          dayInflow += e.amount;
        } else {
          dayOutflow += e.amount;
        }
      });

      totalInflow += dayInflow;
      totalOutflow += dayOutflow;
      currentCumulative = currentCumulative + dayInflow - dayOutflow;

      // Detecta a primeira data de saldo negativo
      if (currentCumulative < 0 && deficitDate === null) {
        deficitDate = targetDate.toLocaleDateString('pt-BR');
        deficitAmount = currentCumulative;
      }

      dailyPoints.push({
        dayOffset: d,
        date: targetDate,
        dateStr: targetDate.toISOString().split('T')[0],
        balance: currentCumulative,
        inflow: dayInflow,
        outflow: dayOutflow,
        events: dayEvents
      });
    }

    return {
      dailyPoints,
      events,
      totalInflow,
      totalOutflow,
      deficitDate,
      deficitAmount,
      finalProjected: currentCumulative
    };
  }, [initialBalance, transactions, loans, projectionDays]);

  const { dailyPoints, events, totalInflow, totalOutflow, deficitDate, deficitAmount, finalProjected } = projectionData;

  // 3. Gerar coordenadas para o gráfico SVG
  const chartPathData = useMemo(() => {
    if (dailyPoints.length === 0) return { linePath: '', areaPath: '', points: [], zeroPercent: 100 };

    const width = 800;
    const height = 250;
    const padding = 20;

    const balances = dailyPoints.map(p => p.balance);
    const maxBal = Math.max(...balances, initialBalance, 100);
    const minBal = Math.min(...balances, initialBalance, 0);
    const range = maxBal - minBal || 1;

    const points = dailyPoints.map((p, idx) => {
      const x = padding + (idx / (dailyPoints.length - 1)) * (width - padding * 2);
      // Inverte o Y porque no SVG o 0 fica no topo
      const y = height - padding - ((p.balance - minBal) / range) * (height - padding * 2);
      return { x, y, ...p };
    });

    const linePath = points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const areaPath = `${linePath} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;

    const zeroPercent = (maxBal / range) * 100;

    return { linePath, areaPath, points, height, width, padding, minBal, range, zeroPercent };
  }, [dailyPoints, initialBalance]);

  const formatCurrency = (value) => {
    if (hideValues) return 'R$ ••••';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  return (
    <div className="cashflow-container">
      {/* Cabeçalho */}
      <div className="cashflow-header">
        <div>
          <h2 className="section-title">Fluxo de Caixa Projetado</h2>
          <p className="section-subtitle">Acompanhe as movimentações futuras e antecipe a saúde financeira do seu caixa.</p>
        </div>
        <div className="period-selector glass-card">
          <button 
            className={`period-btn ${projectionDays === 30 ? 'active' : ''}`} 
            onClick={() => setProjectionDays(30)}
          >
            30 Dias
          </button>
          <button 
            className={`period-btn ${projectionDays === 60 ? 'active' : ''}`} 
            onClick={() => setProjectionDays(60)}
          >
            60 Dias
          </button>
          <button 
            className={`period-btn ${projectionDays === 90 ? 'active' : ''}`} 
            onClick={() => setProjectionDays(90)}
          >
            90 Dias
          </button>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="cashflow-cards-grid">
        <div className="cashflow-card glass-card">
          <div className="card-header">
            <span className="card-title">Saldo Inicial (Hoje)</span>
            <Calendar size={18} className="text-emerald" />
          </div>
          <div className="card-value text-emerald">
            {formatCurrency(initialBalance)}
          </div>
          <p className="card-desc">Total disponível em contas ativas</p>
        </div>

        <div className="cashflow-card glass-card">
          <div className="card-header">
            <span className="card-title font-semibold text-slate-300">Entradas Futuras</span>
            <TrendingUp size={18} className="text-emerald" />
          </div>
          <div className="card-value text-emerald">
            + {formatCurrency(totalInflow)}
          </div>
          <p className="card-desc">Recebimentos previstos em {projectionDays} dias</p>
        </div>

        <div className="cashflow-card glass-card">
          <div className="card-header">
            <span className="card-title font-semibold text-slate-300">Saídas Futuras</span>
            <TrendingDown size={18} className="text-coral" />
          </div>
          <div className="card-value text-coral">
            - {formatCurrency(totalOutflow)}
          </div>
          <p className="card-desc">Despesas estimadas em {projectionDays} dias</p>
        </div>

        <div className="cashflow-card glass-card">
          <div className="card-header">
            <span className="card-title font-semibold text-slate-300">Saldo Final Estimado</span>
            <DollarSign size={18} className={finalProjected >= 0 ? "text-emerald" : "text-coral"} />
          </div>
          <div className={`card-value ${finalProjected >= 0 ? 'text-emerald' : 'text-coral'}`}>
            {formatCurrency(finalProjected)}
          </div>
          <p className="card-desc">Saldo projetado ao final do período</p>
        </div>
      </div>

      {/* Alerta de Saúde Financeira */}
      {deficitDate ? (
        <div className="cashflow-alert danger animate-pulse-glow">
          <AlertTriangle size={24} className="text-coral" />
          <div>
            <h4>Alerta de Saldo Negativo detectado!</h4>
            <p>
              Com base nos seus lançamentos, seu saldo consolidado ficará negativo em <strong>{deficitDate}</strong>, atingindo a estimativa de <strong>{formatCurrency(deficitAmount)}</strong>. Planeje o adiamento de contas ou antecipe recebimentos.
            </p>
          </div>
        </div>
      ) : (
        <div className="cashflow-alert success">
          <CheckCircle2 size={24} className="text-emerald" />
          <div>
            <h4>Fluxo de Caixa Saudável</h4>
            <p>
              Excelente! Com base nas receitas e despesas pendentes, seu saldo de caixa projetado deve se manter positivo durante os próximos <strong>{projectionDays} dias</strong>.
            </p>
          </div>
        </div>
      )}

      {/* Gráfico de Tendência */}
      <div className="chart-wrapper glass-card">
        <h3 className="chart-title">Projeção da Curva de Saldo Acumulado</h3>
        <div className="svg-container">
          <svg viewBox={`0 0 ${chartPathData.width} ${chartPathData.height}`} className="cashflow-svg">
            <defs>
              <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                <stop offset={`${chartPathData.zeroPercent}%`} stopColor="#10b981" stopOpacity="0.0" />
                <stop offset={`${chartPathData.zeroPercent}%`} stopColor="#ef4444" stopOpacity="0.0" />
                <stop offset="100%" stopColor="#ef4444" stopOpacity="0.25" />
              </linearGradient>

              <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset={`${chartPathData.zeroPercent}%`} stopColor="#10b981" />
                <stop offset={`${chartPathData.zeroPercent}%`} stopColor="#ef4444" />
                <stop offset="100%" stopColor="#ef4444" />
              </linearGradient>
            </defs>

            {/* Linha Zero (referência se o gráfico descer de 0) */}
            {chartPathData.minBal < 0 && (
              <line 
                x1={chartPathData.padding} 
                y1={chartPathData.height - chartPathData.padding - ((-chartPathData.minBal) / chartPathData.range) * (chartPathData.height - chartPathData.padding * 2)} 
                x2={chartPathData.width - chartPathData.padding} 
                y2={chartPathData.height - chartPathData.padding - ((-chartPathData.minBal) / chartPathData.range) * (chartPathData.height - chartPathData.padding * 2)} 
                className="zero-line" 
              />
            )}

            {/* Área Gradiente */}
            <path d={chartPathData.areaPath} fill="url(#areaGrad)" />

            {/* Linha da Curva */}
            <path d={chartPathData.linePath} className="chart-line" stroke="url(#lineGrad)" />

            {/* Pontos de Lançamentos */}
            {chartPathData.points.map((p, idx) => {
              const hasEvents = p.events.length > 0;
              if (idx === 0 || idx === chartPathData.points.length - 1 || hasEvents) {
                return (
                  <g key={idx}>
                    <circle 
                      cx={p.x} 
                      cy={p.y} 
                      r={hasEvents ? 5 : 3} 
                      className={`chart-point ${hasEvents ? 'has-events' : ''} ${p.balance < 0 ? 'negative' : ''}`}
                      onMouseEnter={() => setHoveredPoint(p)}
                      onMouseLeave={() => setHoveredPoint(null)}
                    />
                  </g>
                );
              }
              return null;
            })}
          </svg>

          {/* Tooltip do Gráfico */}
          {hoveredPoint && (
            <div 
              className="chart-tooltip glass-card"
              style={{
                left: `${(hoveredPoint.x / chartPathData.width) * 100}%`,
                top: `${(hoveredPoint.y / chartPathData.height) * 100 - 15}%`
              }}
            >
              <p className="tooltip-date">{new Date(hoveredPoint.dateStr).toLocaleDateString('pt-BR')}</p>
              <p className="tooltip-value">{formatCurrency(hoveredPoint.balance)}</p>
              {hoveredPoint.events.length > 0 && (
                <div className="tooltip-events">
                  {hoveredPoint.events.slice(0, 2).map((ev, i) => (
                    <span key={i} className={`tooltip-ev-tag ${ev.type}`}>
                      {ev.description.substring(0, 15)}...
                    </span>
                  ))}
                  {hoveredPoint.events.length > 2 && <span className="tooltip-ev-more">+{hoveredPoint.events.length - 2}</span>}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Tabela de Cronograma Financeiro */}
      <div className="timeline-wrapper glass-card">
        <h3 className="chart-title">Agenda e Lançamentos Futuros</h3>
        {events.length === 0 ? (
          <div className="empty-timeline">
            <p>Nenhuma despesa ou receita pendente para o período selecionado.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="timeline-table">
              <thead>
                <tr>
                  <th>Vencimento</th>
                  <th>Descrição</th>
                  <th>Categoria</th>
                  <th className="text-right">Valor</th>
                  <th>Origem</th>
                  <th className="text-right">Saldo Previsto</th>
                </tr>
              </thead>
              <tbody>
                {/* Calcula saldo progressivamente para a listagem */}
                {(() => {
                  let runningBalance = initialBalance;
                  const displayedEvents = events.slice(0, visibleEventsCount);
                  return displayedEvents.map((ev) => {
                    if (ev.type === 'income') {
                      runningBalance += ev.amount;
                    } else {
                      runningBalance -= ev.amount;
                    }
                    return (
                      <tr key={ev.id} className={runningBalance < 0 ? "deficit-row" : ""}>
                        <td className="whitespace-nowrap">
                          {new Date(ev.dateStr).toLocaleDateString('pt-BR')}
                        </td>
                        <td>{ev.description}</td>
                        <td>
                          <span className="category-badge">{ev.category}</span>
                        </td>
                        <td className={`text-right font-medium ${ev.type === 'income' ? 'text-emerald' : 'text-coral'}`}>
                          {ev.type === 'income' ? '+' : '-'} {formatCurrency(ev.amount)}
                        </td>
                        <td>
                          <span className={`source-badge ${ev.source} ${ev.is_forecast ? 'previsao' : ''}`}>
                            {ev.source === 'loan' ? 'Empréstimo' : (ev.is_forecast ? 'Previsão' : 'Lançamento')}
                          </span>
                        </td>
                        <td className={`text-right font-semibold ${runningBalance < 0 ? 'text-coral' : 'text-slate-300'}`}>
                          {formatCurrency(runningBalance)}
                        </td>
                      </tr>
                    );
                  });
                })()}
              </tbody>
            </table>
            {events.length > visibleEventsCount && (
              <div className="load-more-container">
                <Button 
                  variant="secondary" 
                  onClick={() => setVisibleEventsCount(prev => prev + 15)}
                  className="load-more-btn"
                >
                  Carregar Mais
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
