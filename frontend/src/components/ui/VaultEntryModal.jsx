import React, { useState, useEffect } from 'react';
import { useVault } from '../../context/VaultContext';
import { X, Eye, EyeOff, RefreshCw } from 'lucide-react';
import { CustomSelect } from './CustomSelect';
import './VaultEntryModal.css';

function generatePassword(length = 16) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*';
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export function VaultEntryModal({ mode, groupId, subgroupId, entry, onClose }) {
  const { vault, addEntry, editEntry } = useVault();
  const [form, setForm] = useState({
    name: entry?.name || '',
    username: entry?.username || '',
    password: entry?.password || '',
    url: entry?.url || '',
    notes: entry?.notes || '',
    targetGroupId: groupId || vault[0]?.id || '',
    targetSubgroupId: subgroupId || '',
  });
  const [showPw, setShowPw] = useState(false);

  const selectedGroup = vault.find(g => g.id === form.targetGroupId);
  const subgroupOptions = selectedGroup?.subgroups || [];

  const handleChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleGroupChange = (gId) => {
    setForm(prev => ({ ...prev, targetGroupId: gId, targetSubgroupId: '' }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.targetGroupId) return;
    const data = {
      name: form.name.trim(),
      username: form.username.trim(),
      password: form.password,
      url: form.url.trim(),
      notes: form.notes.trim(),
    };
    if (mode === 'add') {
      addEntry(form.targetGroupId, form.targetSubgroupId || null, data);
    } else {
      editEntry(form.targetGroupId, subgroupId || null, entry.id, data);
    }
    onClose();
  };

  return (
    <div className="vault-modal-overlay" onClick={onClose}>
      <div className="vault-modal" onClick={e => e.stopPropagation()}>
        <div className="vault-modal-header">
          <h3>{mode === 'add' ? 'Nova Credencial' : 'Editar Credencial'}</h3>
          <button className="vault-modal-close" onClick={onClose}><X size={20} /></button>
        </div>

        <form className="vault-modal-form" onSubmit={handleSubmit}>
          {/* Destino: grupo + subgrupo */}
          <div className="vault-modal-row">
            <div className="form-group">
              <label>Grupo</label>
              <CustomSelect
                value={form.targetGroupId}
                onChange={e => handleGroupChange(e.target.value)}
                placeholder="Selecione..."
                options={vault.map(g => ({ value: g.id, label: g.name }))}
              />
            </div>
            <div className="form-group">
              <label>Subgrupo <span className="label-optional">(opcional)</span></label>
              <CustomSelect
                value={form.targetSubgroupId}
                onChange={e => handleChange('targetSubgroupId', e.target.value)}
                placeholder="— Diretamente no grupo —"
                options={subgroupOptions.map(sg => ({ value: sg.id, label: sg.name }))}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Nome / Serviço *</label>
            <input
              type="text"
              className="form-input"
              placeholder="ex: Gmail, Nubank, VPN..."
              value={form.name}
              onChange={e => handleChange('name', e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label>URL / Site</label>
            <input
              type="text"
              className="form-input"
              placeholder="https://..."
              value={form.url}
              onChange={e => handleChange('url', e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Usuário / E-mail</label>
            <input
              type="text"
              className="form-input"
              placeholder="seu@email.com ou nome de usuário"
              value={form.username}
              onChange={e => handleChange('username', e.target.value)}
              autoComplete="off"
            />
          </div>

          <div className="form-group">
            <label>Senha</label>
            <div className="vault-pw-input-wrapper">
              <input
                type={showPw ? 'text' : 'password'}
                className="form-input vault-pw-input"
                placeholder="••••••••"
                value={form.password}
                onChange={e => handleChange('password', e.target.value)}
                autoComplete="new-password"
              />
              <button type="button" className="vault-pw-toggle" onClick={() => setShowPw(p => !p)} title="Ver/Ocultar">
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
              <button
                type="button"
                className="vault-pw-generate"
                onClick={() => { handleChange('password', generatePassword()); setShowPw(true); }}
                title="Gerar senha segura"
              >
                <RefreshCw size={16} />
              </button>
            </div>
          </div>

          <div className="form-group">
            <label>Notas</label>
            <textarea
              className="form-input vault-textarea"
              placeholder="Observações opcionais..."
              value={form.notes}
              onChange={e => handleChange('notes', e.target.value)}
              rows={3}
            />
          </div>

          <div className="vault-modal-footer">
            <button type="button" className="btn-cancel" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn-save">{mode === 'add' ? 'Salvar' : 'Atualizar'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
