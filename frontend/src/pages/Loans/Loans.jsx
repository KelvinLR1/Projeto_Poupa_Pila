import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { GlassCard } from '../../components/ui/GlassCard';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { LoanFormModal } from '../../components/ui/LoanFormModal';
import { LoanPaymentModal } from '../../components/ui/LoanPaymentModal';
import { LoanDetailsModal } from '../../components/ui/LoanDetailsModal';
import { Plus, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import './Loans.css';

export function Loans() {
  const { loans, hideValues, payLoan } = useFinance();
  const [isAddingLoan, setIsAddingLoan] = useState(false);
  const [selectedLoanForPayment, setSelectedLoanForPayment] = useState(null);
  const [selectedLoanForDetails, setSelectedLoanForDetails] = useState(null);
  const [prefillCounterpart, setPrefillCounterpart] = useState('');
  const [prefillType, setPrefillType] = useState('lent');

  const lentLoans = loans.filter(l => l.type === 'lent');
  const borrowedLoans = loans.filter(l => l.type === 'borrowed');

  const renderLoanCard = (loan) => {
    const progress = (loan.paidAmount / loan.totalAmount) * 100;
    
    return (
      <GlassCard 
        key={loan.id} 
        className="loan-card clickable"
        onClick={() => setSelectedLoanForDetails(loan)}
      >
        <div className="loan-header">
          <div className="loan-counterpart">
            <div className={`loan-icon glass ${loan.type === 'lent' ? 'text-emerald' : 'text-coral'}`}>
              {loan.type === 'lent' ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}
            </div>
            <div>
              <h4>{loan.counterpart}</h4>
              <p>{loan.type === 'lent' ? 'Me deve' : 'Eu devo'}</p>
            </div>
          </div>
          <Badge variant={loan.status === 'active' ? 'warning' : 'success'}>
            {loan.status === 'active' ? 'Ativo' : 'Quitado'}
          </Badge>
        </div>

        <div className="loan-amounts">
          <div>
            <p>Valor Total</p>
            <h4>{formatCurrency(loan.totalAmount, hideValues)}</h4>
          </div>
          <div className="text-right">
            <p>Restante</p>
            <h4>{formatCurrency(loan.totalAmount - loan.paidAmount, hideValues)}</h4>
          </div>
        </div>

        <div className="loan-progress">
          <div className="progress-info">
            <span>Progresso</span>
            <span>{progress.toFixed(0)}%</span>
          </div>
          <div className="progress-bar-bg">
            <div 
              className={`progress-bar-fill ${loan.type === 'lent' ? 'bg-emerald' : 'bg-coral'}`} 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        <div className="loan-footer">
          <p>Vencimento: {formatDate(loan.dueDate)}</p>
          {loan.status === 'active' && (
            <Button 
              variant="secondary" 
              size="sm" 
              onClick={(e) => {
                e.stopPropagation();
                setSelectedLoanForPayment(loan);
              }}
            >
              Registrar Parcela
            </Button>
          )}
        </div>
      </GlassCard>
    );
  };

  return (
    <div className="loans-page">
      <div className="page-header">
        <div>
          <h2 className="page-title">Controle de Empréstimos</h2>
          <p className="page-subtitle">Gerencie o dinheiro que você emprestou ou pegou emprestado.</p>
        </div>
        <div className="page-actions">
          <Button variant="primary" icon={<Plus size={18} />} onClick={() => setIsAddingLoan(true)}>
            Novo Empréstimo
          </Button>
        </div>
      </div>

      <div className="loans-grid">
        <section className="loans-column">
          <h3 className="column-title text-emerald">Pessoas que me devem</h3>
          <div className="loans-list">
            {lentLoans.map(renderLoanCard)}
            {lentLoans.length === 0 && <p className="empty-state">Nenhum empréstimo concedido.</p>}
          </div>
        </section>

        <section className="loans-column">
          <h3 className="column-title text-coral">Pessoas que eu devo</h3>
          <div className="loans-list">
            {borrowedLoans.map(renderLoanCard)}
            {borrowedLoans.length === 0 && <p className="empty-state">Nenhum empréstimo tomado.</p>}
          </div>
        </section>
      </div>

      {isAddingLoan && (
        <LoanFormModal 
          onClose={() => {
            setIsAddingLoan(false);
            setPrefillCounterpart('');
            setPrefillType('lent');
          }}
          initialCounterpart={prefillCounterpart}
          initialType={prefillType}
        />
      )}

      {selectedLoanForPayment && (
        <LoanPaymentModal 
          loan={selectedLoanForPayment} 
          onConfirm={(loanId, amount, date, description) => {
            payLoan(loanId, amount, date, description);
            setSelectedLoanForPayment(null);
          }}
          onCancel={() => setSelectedLoanForPayment(null)} 
        />
      )}

      {selectedLoanForDetails && (
        <LoanDetailsModal 
          loan={loans.find(l => l.id === selectedLoanForDetails.id) || selectedLoanForDetails}
          onClose={() => setSelectedLoanForDetails(null)}
          onAddAmount={(loan) => {
            setPrefillCounterpart(loan.counterpart);
            setPrefillType(loan.type);
            setIsAddingLoan(true);
          }}
          onRegisterPayment={(loan) => {
            setSelectedLoanForPayment(loan);
          }}
        />
      )}
    </div>
  );
}
