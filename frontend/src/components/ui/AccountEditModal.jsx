import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useFinance } from '../../context/FinanceContext';
import { Button } from './Button';
import { X, Check } from 'lucide-react';
import './PaymentModal.css';
import './AccountEditModal.css';

const TYPE_LABELS = {
  checking: 'Conta Corrente',
  savings: 'Poupança',
  investment: 'Investimento',
  wallet: 'Carteira Física'
};

export function AccountEditModal({ account, onClose }) {
  const { updateAccount } = useFinance();

  const [name,    setName]    = useState(account.name);
  const [type,    setType]    = useState(account.type);
  const [color,   setColor]   = useState(account.color);

  const isDirty =
    name  !== account.name  ||
    type  !== account.type  ||
    color !== account.color;

  const handleSave = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    updateAccount(account.id, { name: name.trim(), type, color });
    onClose();
  };

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container acc-edit-container" onClick={e => e.stopPropagation()}>

        <div className="modal-header">
          <div className="modal-header-content">
            <h3>Editar Conta</h3>
            <p>Altere nome, tipo ou cor identificadora.</p>
          </div>
          <button className="close-btn" onClick={onClose} title="Fechar">
            <X size={18} />
          </button>
        </div>

        <form className="modal-body" onSubmit={handleSave}>

          {/* Preview da cor */}
          <div className="acc-color-preview" style={{ borderColor: color, boxShadow: `0 0 20px ${color}30` }}>
            <div className="acc-color-swatch" style={{ background: color }} />
            <span>{name || 'Nome da conta'}</span>
          </div>

          <div className="form-group">
            <label>Nome da Instituição / Conta</label>
            <input
              type="text"
              className="form-input"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ex: Nubank, Itaú, Carteira"
              autoFocus
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Tipo de Conta</label>
              <select
                className="form-select"
                value={type}
                onChange={e => setType(e.target.value)}
              >
                {Object.entries(TYPE_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>

            <div className="form-group acc-color-group">
              <label>Cor Identificadora</label>
              <div className="color-input-row">
                <input
                  type="color"
                  className="color-picker-input"
                  value={color}
                  onChange={e => setColor(e.target.value)}
                />
                <span className="color-hex">{color.toUpperCase()}</span>
              </div>
            </div>
          </div>
        </form>

        <div className="modal-footer">
          <Button variant="secondary" type="button" onClick={onClose}>Cancelar</Button>
          <Button
            variant="primary"
            icon={<Check size={16} />}
            onClick={handleSave}
            disabled={!isDirty || !name.trim()}
          >
            Salvar Alterações
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
