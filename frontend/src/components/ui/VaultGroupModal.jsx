import React, { useState } from 'react';
import { useVault } from '../../context/VaultContext';
import { X } from 'lucide-react';
import './VaultEntryModal.css';

export function VaultGroupModal({ mode, type, groupId, onClose }) {
  const { vault, addGroup, addSubgroup, VAULT_COLORS } = useVault();
  const [name, setName] = useState('');
  const [color, setColor] = useState(VAULT_COLORS[0]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (type === 'group') {
      addGroup({ name, color });
    } else {
      addSubgroup(groupId, { name });
    }
    onClose();
  };

  const groupName = vault.find(g => g.id === groupId)?.name;

  return (
    <div className="vault-modal-overlay" onClick={onClose}>
      <div className="vault-modal" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
        <div className="vault-modal-header">
          <h3>
            {type === 'group' ? 'Novo Grupo' : `Novo Subgrupo em "${groupName}"`}
          </h3>
          <button className="vault-modal-close" onClick={onClose}><X size={20} /></button>
        </div>

        <form className="vault-modal-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nome {type === 'group' ? 'do Grupo' : 'do Subgrupo'}</label>
            <input
              type="text"
              className="form-input"
              placeholder={type === 'group' ? 'ex: Trabalho, Pessoal...' : 'ex: E-mails, Redes Sociais...'}
              value={name}
              onChange={e => setName(e.target.value)}
              required
              autoFocus
            />
          </div>

          {type === 'group' && (
            <div className="form-group">
              <label>Cor do Grupo</label>
              <div className="vault-color-grid">
                {VAULT_COLORS.map(c => (
                  <button
                    key={c}
                    type="button"
                    className={`vault-color-swatch ${color === c ? 'selected' : ''}`}
                    style={{ backgroundColor: c }}
                    onClick={() => setColor(c)}
                    title={c}
                  />
                ))}
              </div>
            </div>
          )}

          <div className="vault-modal-footer">
            <button type="button" className="btn-cancel" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn-save">Criar</button>
          </div>
        </form>
      </div>
    </div>
  );
}
