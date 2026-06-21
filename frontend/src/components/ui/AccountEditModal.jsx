import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useFinance } from '../../context/FinanceContext';
import { Button } from './Button';
import { X, Check } from 'lucide-react';
import { CustomSelect } from './CustomSelect';
import './PaymentModal.css';
import './AccountEditModal.css';

const TYPE_LABELS = {
  checking: 'Conta Corrente',
  savings: 'Poupança',
  investment: 'Investimento',
  wallet: 'Carteira Física'
};

const PRESET_COLORS = [
  '#10b981', '#f43f5e', '#3b82f6', '#8b5cf6',
  '#f59e0b', '#0ea5e9', '#ec4899', '#64748b'
];

export function AccountEditModal({ account, onClose }) {
  const { updateAccount } = useFinance();

  const [name,    setName]    = useState(account.name);
  const [type,    setType]    = useState(account.type);
  const [color,   setColor]   = useState(account.color);
  const [isClosing, setIsClosing] = useState(false);

  const isDirty =
    name  !== account.name  ||
    type  !== account.type  ||
    color !== account.color;

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 180);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    updateAccount(account.id, { name: name.trim(), type, color });
    handleClose();
  };

  return createPortal(
    <div className={`modal-overlay ${isClosing ? 'closing' : ''}`} onClick={handleClose}>
      <div className="modal-container acc-edit-container" onClick={e => e.stopPropagation()}>

        <div className="modal-header">
          <div className="modal-header-content">
            <h3>Editar Conta</h3>
            <p>Altere nome, tipo ou cor identificadora.</p>
          </div>
          <button className="close-btn" onClick={handleClose} title="Fechar">
            <X size={18} />
          </button>
        </div>

        <form className="modal-body acc-edit-body" onSubmit={handleSave}>

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
              <CustomSelect
                value={type}
                onChange={e => setType(e.target.value)}
                options={Object.entries(TYPE_LABELS).map(([val, label]) => ({ value: val, label }))}
              />
            </div>

            <div className="form-group acc-color-group">
              <label>Cor Identificadora</label>
              <div className="color-palette-row">
                {PRESET_COLORS.map(c => (
                  <button 
                    key={c}
                    type="button"
                    className={`color-swatch-btn ${color === c ? 'active' : ''}`}
                    style={{ backgroundColor: c }}
                    onClick={() => setColor(c)}
                  />
                ))}
                <div className="custom-color-wrapper" title="Cor Personalizada">
                  <input 
                    type="color" 
                    value={color}
                    onChange={e => setColor(e.target.value)}
                    className="custom-color-input-hidden"
                  />
                  <button type="button" className="custom-color-btn" style={{ backgroundColor: PRESET_COLORS.includes(color) ? 'transparent' : color, borderStyle: PRESET_COLORS.includes(color) ? 'dashed' : 'solid', borderColor: PRESET_COLORS.includes(color) ? 'rgba(255,255,255,0.4)' : '#fff' }}>
                    {PRESET_COLORS.includes(color) ? '+' : ''}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </form>

        <div className="modal-footer">
          <Button variant="secondary" type="button" onClick={handleClose}>Cancelar</Button>
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
