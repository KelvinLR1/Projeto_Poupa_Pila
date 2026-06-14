import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency } from '../../utils/formatters';
import { GlassCard } from '../../components/ui/GlassCard';
import { CustomSelect } from '../../components/ui/CustomSelect';
import { 
  TrendingUp, ArrowUpRight, ArrowDownRight, Award, 
  DollarSign, Calendar, Percent, Target, HelpCircle 
} from 'lucide-react';
import './Analytics.css';

const CHART_COLORS = [
  '#6366f1', // Indigo
  '#10b981', // Emerald
  '#f43f5e', // Coral
  '#f59e0b', // Amber
  '#06b6d4', // Cyan
  '#d946ef', // Orchid
  '#3b82f6', // Sapphire
  '#84cc16'  // Lime
];

export function Analytics() {
  const { accounts = [], transactions, categoryLimits, totalBalance, categories = [] } = useFinance();
  const [period, setPeriod] = useState('current_month'); // 'current_month', 'last_3_months', 'last_6_months'
  const [selectedAccountId, setSelectedAccountId] = useState('all_accounts');
  const [hoveredCategory, setHoveredCategory] = useState(null);
  const [hoveredBarMonth, setHoveredBarMonth] = useState(null);

  // --- 1. Filtro de Transações por Período ---
  const getPeriodFilter = () => {
    const today = new Date();
    const curYear = today.getFullYear();
    const curMonth = today.getMonth(); // 0-indexed

    const startOfMonth = new Date(curYear, curMonth, 1);
    
    if (period === 'current_month') {
      return { start: startOfMonth, label: 'Mês Atual' };
    } else if (period === 'last_3_months') {
      const start = new Date(curYear, curMonth - 2, 1);
      return { start, label: 'Últimos 3 Meses' };
    } else {
      const start = new Date(curYear, curMonth - 5, 1);
      return { start, label: 'Últimos 6 Meses' };
    }
  };

  const { start: periodStartDate } = getPeriodFilter();

  const activeAccounts = accounts.filter(a => a.active !== false);

  const filteredTransactions = transactions.filter(t => {
    const tDate = new Date(t.date + 'T00:00:00');
    const matchesPeriod = tDate >= periodStartDate;
    const matchesAccount = selectedAccountId === 'all_accounts' || t.accountId === selectedAccountId;
    return matchesPeriod && matchesAccount;
  });

  // --- 2. Cálculos Financeiros (KPIs) ---
  const totalIncome = filteredTransactions
    .filter(t => t.type === 'income' && t.category.toLowerCase().trim() !== 'transferência')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = filteredTransactions
    .filter(t => t.type === 'expense' && t.category.toLowerCase().trim() !== 'transferência')
    .reduce((sum, t) => sum + t.amount, 0);

  const savings = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? (savings / totalIncome) * 100 : 0;

  // Média de Gastos
  const daysInPeriod = () => {
    const today = new Date();
    const diffTime = Math.abs(today - periodStartDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
    return diffDays;
  };
  const dailyAverage = totalExpense / daysInPeriod();
  const weeklyAverage = dailyAverage * 7;

  // Projeção a 30 dias (Salto estimado base em Previsões pendentes do usuário)
  const startBalance = selectedAccountId === 'all_accounts'
    ? totalBalance
    : (accounts.find(a => a.id === selectedAccountId)?.balance || 0);

  const pendingForecastsIncome = transactions
    .filter(t => t.type === 'income' && t.status === 'pending' && t.is_forecast === 1 && (selectedAccountId === 'all_accounts' || t.accountId === selectedAccountId))
    .reduce((sum, t) => sum + t.amount, 0);

  const pendingForecastsExpense = transactions
    .filter(t => t.type === 'expense' && t.status === 'pending' && t.is_forecast === 1 && (selectedAccountId === 'all_accounts' || t.accountId === selectedAccountId))
    .reduce((sum, t) => sum + t.amount, 0);

  const projectedBalance30Days = startBalance + pendingForecastsIncome - pendingForecastsExpense;

  // --- 3. Rosca SVG: Distribuição por Categoria ---
  const expenseByCategory = filteredTransactions
    .filter(t => t.type === 'expense' && t.category.toLowerCase().trim() !== 'transferência')
    .reduce((acc, t) => {
      const cat = t.category.trim();
      acc[cat] = (acc[cat] || 0) + t.amount;
      return acc;
    }, {});

  const categoryExpensesList = Object.keys(expenseByCategory)
    .map(name => ({
      name,
      amount: expenseByCategory[name]
    }))
    .sort((a, b) => b.amount - a.amount);

  const totalExpenseInList = categoryExpensesList.reduce((s, c) => s + c.amount, 0);

  let cumulativePercent = 0;
  const donutSegments = categoryExpensesList.map((cat, index) => {
    const percentage = totalExpenseInList > 0 ? (cat.amount / totalExpenseInList) * 100 : 0;
    const strokeLength = (percentage / 100) * 314.16; // Circunferência de raio 50 = 2 * PI * 50 = 314.16
    const strokeOffset = 314.16 - (cumulativePercent / 100) * 314.16;
    cumulativePercent += percentage;
    return {
      ...cat,
      color: CHART_COLORS[index % CHART_COLORS.length],
      strokeDasharray: `${strokeLength} ${314.16 - strokeLength}`,
      strokeDashoffset: strokeOffset,
      percentage
    };
  });

  // --- 4. Gráfico Histórico 6 Meses (Receita vs Despesa) ---
  const getMonthsRangeList = () => {
    const list = [];
    const today = new Date();
    const monthsNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const year = d.getFullYear();
      const monthNum = d.getMonth();
      const key = `${year}-${String(monthNum + 1).padStart(2, '0')}`;
      list.push({
        key,
        label: `${monthsNames[monthNum]}/${String(year).substring(2)}`,
        income: 0,
        expense: 0
      });
    }
    return list;
  };

  const monthlyTotals = getMonthsRangeList();
  transactions.forEach(t => {
    if (t.category.toLowerCase().trim() === 'transferência') return;
    const matchesAccount = selectedAccountId === 'all_accounts' || t.accountId === selectedAccountId;
    if (!matchesAccount) return;

    const tMonthKey = t.date.substring(0, 7); // YYYY-MM
    const foundMonth = monthlyTotals.find(m => m.key === tMonthKey);
    if (foundMonth) {
      if (t.type === 'income') {
        foundMonth.income += t.amount;
      } else if (t.type === 'expense') {
        foundMonth.expense += t.amount;
      }
    }
  });

  const maxVal = Math.max(...monthlyTotals.map(m => Math.max(m.income, m.expense)), 100);

  // --- 5. Análise 50/30/20 ---
  // Necessidades (Essenciais): Alimentação, Moradia, Transporte, Saúde, Educação
  // Desejos/Lazer (Variáveis): Lazer, Presentes, Outros (padrão)
  // Poupança/Investimento: Investimentos e Poupança
  const rulesBreakdown = filteredTransactions
    .filter(t => t.type === 'expense' && t.category.toLowerCase().trim() !== 'transferência')
    .reduce((acc, t) => {
      const catName = (t.category || '').toLowerCase().trim();
      const categoryObj = categories.find(c => (c.name || '').toLowerCase().trim() === catName);
      const ruleType = categoryObj ? categoryObj.rule_type : null;

      if (ruleType === 'necessity') {
        acc.needs += t.amount;
      } else if (ruleType === 'investment') {
        acc.savings += t.amount;
      } else if (ruleType === 'want') {
        acc.wants += t.amount;
      } else {
        // Fallback matching to preserve behavior for untagged / legacy categories
        if (['alimentação', 'moradia', 'transporte', 'saúde', 'educação', 'contas'].some(k => catName.includes(k))) {
          acc.needs += t.amount;
        } else if (['investimento', 'poupança'].some(k => catName.includes(k))) {
          acc.savings += t.amount;
        } else {
          acc.wants += t.amount;
        }
      }
      return acc;
    }, { needs: 0, wants: 0, savings: 0 });

  // Adiciona a economia real sob poupança
  if (savings > 0) {
    rulesBreakdown.savings += savings;
  }

  const rulesTotal = rulesBreakdown.needs + rulesBreakdown.wants + rulesBreakdown.savings || 1;
  const needsPct = (rulesBreakdown.needs / rulesTotal) * 100;
  const wantsPct = (rulesBreakdown.wants / rulesTotal) * 100;
  const savingsPct = (rulesBreakdown.savings / rulesTotal) * 100;

  return (
    <div className="analytics-page">
      <div className="page-header">
        <div>
          <h2 className="page-title">Análises e Insights</h2>
          <p className="page-subtitle">Acompanhe relatórios visuais sobre despesas, receitas e progresso.</p>
        </div>
      </div>

      {/* Cartão de Filtro */}
      <GlassCard className="analytics-filters-card">
        <div className="analytics-filter-item">
          <label>Intervalo dos Dados:</label>
          <div className="analytics-select-wrapper">
            <CustomSelect 
              value={period}
              onChange={e => setPeriod(e.target.value)}
              options={[
                { value: 'current_month', label: 'Mês Atual' },
                { value: 'last_3_months', label: 'Últimos 3 Meses' },
                { value: 'last_6_months', label: 'Últimos 6 Meses' }
              ]}
            />
          </div>
        </div>

        <div className="analytics-filter-item">
          <label>Filtrar por Conta:</label>
          <div className="analytics-select-wrapper">
            <CustomSelect 
              value={selectedAccountId}
              onChange={e => setSelectedAccountId(e.target.value)}
              options={[
                { value: 'all_accounts', label: 'Todas as Contas' },
                ...activeAccounts.map(acc => ({
                  value: acc.id,
                  label: acc.name
                }))
              ]}
            />
          </div>
        </div>
      </GlassCard>

      {/* KPIs Grid */}
      <div className="analytics-kpis-grid">
        {/* Economia */}
        <GlassCard className="kpi-card">
          <div className="kpi-icon-wrapper">
            <Percent size={20} className="text-emerald" />
          </div>
          <div className="kpi-details">
            <div className="kpi-title-wrapper">
              <span className="kpi-title-label">Taxa de Poupança</span>
              <span className="tooltip-container">
                <HelpCircle size={14} className="info-icon" />
                <span className="tooltip-content">
                  Porcentagem da receita mensal que sobra após o pagamento de todas as despesas. Meta recomendada: acima de 20%.
                </span>
              </span>
            </div>
            <h3>{savingsRate.toFixed(1)}%</h3>
            <p>Economizado: {formatCurrency(Math.max(savings, 0))}</p>
          </div>
          <div className="kpi-progress-circle-wrapper">
            <svg width="56" height="56" viewBox="0 0 56 56">
              <circle className="kpi-progress-circle-bg" cx="28" cy="28" r="20" />
              <circle 
                className="kpi-progress-circle-val" 
                cx="28" 
                cy="28" 
                r="20"
                strokeDasharray="125.66"
                strokeDashoffset={125.66 - (Math.max(Math.min(savingsRate, 100), 0) / 100) * 125.66}
              />
            </svg>
            <span className="kpi-progress-text">{savingsRate.toFixed(0)}%</span>
          </div>
        </GlassCard>

        {/* Gasto Médio */}
        <GlassCard className="kpi-card">
          <div className="kpi-icon-wrapper">
            <ArrowDownRight size={20} className="text-coral" />
          </div>
          <div className="kpi-details">
            <div className="kpi-title-wrapper">
              <span className="kpi-title-label">Média de Despesa</span>
              <span className="tooltip-container">
                <HelpCircle size={14} className="info-icon" />
                <span className="tooltip-content">
                  Média de gastos calculada semanalmente e diariamente para o período selecionado.
                </span>
              </span>
            </div>
            <h3>{formatCurrency(weeklyAverage)}</h3>
            <p>Média diária de {formatCurrency(dailyAverage)}</p>
          </div>
        </GlassCard>

        {/* Projeção */}
        <GlassCard className="kpi-card">
          <div className="kpi-icon-wrapper">
            <TrendingUp size={20} className="text-purple" style={{ color: 'var(--accent-purple, #a78bfa)' }} />
          </div>
          <div className="kpi-details">
            <div className="kpi-title-wrapper">
              <span className="kpi-title-label">Projeção para 30 Dias</span>
              <span className="tooltip-container">
                <HelpCircle size={14} className="info-icon" />
                <span className="tooltip-content">
                  Estimativa do seu saldo ao final dos próximos 30 dias, somando receitas e subtraindo despesas futuras e parcelas ativas cadastradas.
                </span>
              </span>
            </div>
            <h3>{formatCurrency(projectedBalance30Days)}</h3>
            <p>Com base em previsões futuras</p>
          </div>
        </GlassCard>
      </div>

      {/* Grid de Gráficos */}
      <div className="analytics-main-grid">
        {/* Distribuição de Despesas */}
        <GlassCard className="chart-card">
          <div className="chart-card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ margin: 0 }}>Despesas por Categoria</h3>
              <span className="tooltip-container">
                <HelpCircle size={15} className="info-icon" />
                <span className="tooltip-content">
                  Distribuição proporcional de todas as suas despesas por categoria no período selecionado.
                </span>
              </span>
            </div>
            <p style={{ marginTop: '4px' }}>Participação das despesas por tipo no período selecionado.</p>
          </div>

          <div className="donut-chart-container">
            {/* Gráfico Donut SVG */}
            <div className="donut-svg-wrapper">
              <svg width="180" height="180" viewBox="0 0 120 120">
                {totalExpenseInList === 0 ? (
                  <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255, 255, 255, 0.05)" strokeWidth="14" />
                ) : (
                  donutSegments.map((segment, idx) => (
                    <circle 
                      key={idx}
                      className="donut-segment"
                      cx="60"
                      cy="60"
                      r="50"
                      stroke={segment.color}
                      strokeDasharray={segment.strokeDasharray}
                      strokeDashoffset={segment.strokeDashoffset}
                      style={{
                        transformOrigin: 'center',
                        transform: hoveredCategory === segment.name ? 'scale(1.03)' : 'scale(1)'
                      }}
                      onMouseEnter={() => setHoveredCategory(segment.name)}
                      onMouseLeave={() => setHoveredCategory(null)}
                    />
                  ))
                )}
              </svg>
              <div className="donut-center-info">
                <span>Total Gasto</span>
                <h4>{formatCurrency(totalExpense)}</h4>
              </div>
            </div>

            {/* Legenda */}
            <div className="donut-legend">
              {categoryExpensesList.length === 0 ? (
                <p className="text-muted" style={{ fontSize: '0.85rem' }}>Nenhum gasto registrado.</p>
              ) : (
                donutSegments.map(seg => (
                  <div 
                    key={seg.name} 
                    className={`donut-legend-item ${hoveredCategory === seg.name ? 'highlighted' : ''}`}
                    onMouseEnter={() => setHoveredCategory(seg.name)}
                    onMouseLeave={() => setHoveredCategory(null)}
                  >
                    <div className="donut-legend-label">
                      <span className="legend-color-dot" style={{ backgroundColor: seg.color }}></span>
                      <span className="legend-category-name">{seg.name}</span>
                    </div>
                    <div className="donut-legend-values">
                      <span className="legend-percent">{seg.percentage.toFixed(0)}%</span>
                      <span className="legend-amount">{formatCurrency(seg.amount)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </GlassCard>

        {/* Histórico Receita vs Despesa */}
        <GlassCard className="chart-card" style={{ position: 'relative' }}>
          <div className="chart-card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ margin: 0 }}>Evolução Mensal (Receita vs Despesa)</h3>
              <span className="tooltip-container">
                <HelpCircle size={15} className="info-icon" />
                <span className="tooltip-content">
                  Comparativo mensal entre o total de receitas (verde) e despesas (vermelho) nos últimos 6 meses.
                </span>
              </span>
            </div>
            <p style={{ marginTop: '4px' }}>Comparativo de entradas e saídas dos últimos 6 meses.</p>
          </div>

          <div className="bar-chart-container">
            {/* Tooltip flutuante */}
            {hoveredBarMonth && (
              <div className="analytics-chart-tooltip">
                <span className="tooltip-title">{hoveredBarMonth.label}</span>
                <span className="tooltip-row income">
                  <span>Receitas:</span> <strong>{formatCurrency(hoveredBarMonth.income)}</strong>
                </span>
                <span className="tooltip-row expense">
                  <span>Despesas:</span> <strong>{formatCurrency(hoveredBarMonth.expense)}</strong>
                </span>
              </div>
            )}

            <div className="bar-chart-grid">
              {monthlyTotals.map(item => {
                const incomeHeightPct = (item.income / maxVal) * 100;
                const expenseHeightPct = (item.expense / maxVal) * 100;

                return (
                  <div 
                    key={item.key} 
                    className="bar-group-wrapper"
                    onMouseEnter={() => setHoveredBarMonth(item)}
                    onMouseLeave={() => setHoveredBarMonth(null)}
                  >
                    <div className="bar-pair">
                      {/* Barra de Receitas */}
                      <div 
                        className="chart-bar income-bar"
                        style={{ height: `${Math.max(incomeHeightPct, 2)}%` }}
                      ></div>
                      {/* Barra de Despesas */}
                      <div 
                        className="chart-bar expense-bar"
                        style={{ height: `${Math.max(expenseHeightPct, 2)}%` }}
                      ></div>
                    </div>
                    <span className="bar-month-label">{item.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Regra 50/30/20 */}
      <GlassCard className="insight-rule-card">
        <div className="chart-card-header" style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Target size={20} className="text-emerald" />
              <h3 style={{ margin: 0 }}>Distribuição do Orçamento (Regra 50/30/20)</h3>
            </div>
            <span className="tooltip-container">
              <HelpCircle size={15} className="info-icon" />
              <span className="tooltip-content">
                Metodologia financeira que sugere dividir sua renda líquida em: 50% para Necessidades, 30% para Desejos e Lazer, e 20% para Poupança e Investimentos.
              </span>
            </span>
          </div>
          <p style={{ marginTop: '4px' }}>Comparação de seus gastos atuais com a regra clássica de finanças.</p>
        </div>

        <div className="rule-bars-container">
          {/* Necessidades - Target 50% */}
          <div className="rule-bar-row">
            <div className="rule-bar-header">
              <span>Necessidades Essenciais (Meta: 50%)</span>
              <span>{needsPct.toFixed(0)}% ({formatCurrency(rulesBreakdown.needs)})</span>
            </div>
            <div className="rule-bar-track">
              <div className="rule-progress-bar-bg">
                <div 
                  className="rule-progress-bar-fill"
                  style={{ 
                    width: `${Math.min(needsPct, 100)}%`, 
                    backgroundColor: needsPct > 50 ? 'var(--accent-coral, #f43f5e)' : 'var(--accent-emerald, #10b981)' 
                  }}
                ></div>
              </div>
              <div className="rule-target-line" style={{ left: '50%' }}>
                <span className="rule-target-label">50%</span>
              </div>
            </div>
          </div>

          {/* Desejos - Target 30% */}
          <div className="rule-bar-row">
            <div className="rule-bar-header">
              <span>Desejos & Lazer (Meta: 30%)</span>
              <span>{wantsPct.toFixed(0)}% ({formatCurrency(rulesBreakdown.wants)})</span>
            </div>
            <div className="rule-bar-track">
              <div className="rule-progress-bar-bg">
                <div 
                  className="rule-progress-bar-fill"
                  style={{ 
                    width: `${Math.min(wantsPct, 100)}%`, 
                    backgroundColor: wantsPct > 30 ? 'var(--accent-amber, #f59e0b)' : 'var(--accent-emerald, #10b981)' 
                  }}
                ></div>
              </div>
              <div className="rule-target-line" style={{ left: '30%' }}>
                <span className="rule-target-label">30%</span>
              </div>
            </div>
          </div>

          {/* Poupança/Investimentos - Target 20% */}
          <div className="rule-bar-row">
            <div className="rule-bar-header">
              <span>Investimentos & Economia (Meta: 20%)</span>
              <span>{savingsPct.toFixed(0)}% ({formatCurrency(rulesBreakdown.savings)})</span>
            </div>
            <div className="rule-bar-track">
              <div className="rule-progress-bar-bg">
                <div 
                  className="rule-progress-bar-fill"
                  style={{ 
                    width: `${Math.min(savingsPct, 100)}%`, 
                    backgroundColor: savingsPct >= 20 ? 'var(--accent-emerald, #10b981)' : 'rgba(255, 255, 255, 0.15)' 
                  }}
                ></div>
              </div>
              <div className="rule-target-line" style={{ left: '20%' }}>
                <span className="rule-target-label">20%</span>
              </div>
            </div>
          </div>
        </div>

        <p className="rule-desc">
          <Award size={14} style={{ marginRight: '6px', color: 'var(--accent-emerald)', verticalAlign: 'middle' }} />
          <strong>Dica do Poupa Pila:</strong> 
          {needsPct > 55 ? (
            ' Suas despesas essenciais (Necessidades) estão acima da recomendação de 50%. Tente renegociar contratos ou diminuir despesas fixas para liberar margem de poupança.'
          ) : wantsPct > 35 ? (
            ' Seus gastos com Lazer e Desejos estão acima dos 30% recomendados. Tente estabelecer limites mensais nas categorias de lazer para manter as economias nos trilhos.'
          ) : savingsPct < 15 ? (
            ' Sua taxa de poupança está abaixo dos 20%. Guardar dinheiro no início do mês (pagar-se primeiro) é um excelente hábito para acelerar seus investimentos!'
          ) : (
            ' Parabéns! Sua distribuição financeira está equilibrada de acordo com as melhores práticas de saúde financeira do mercado.'
          )}
        </p>
      </GlassCard>
    </div>
  );
}
