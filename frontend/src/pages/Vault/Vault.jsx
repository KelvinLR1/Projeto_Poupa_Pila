import React, { useState } from 'react';
import { useVault } from '../../context/VaultContext';
import { useConfirm } from '../../context/ConfirmContext';
import { GlassCard } from '../../components/ui/GlassCard';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { VaultEntryModal } from '../../components/ui/VaultEntryModal';
import { VaultGroupModal } from '../../components/ui/VaultGroupModal';
import {
  KeyRound, Search, Plus, Copy, Eye, EyeOff,
  ChevronRight, ChevronDown, Folder, FolderOpen,
  Globe, User, Lock, FileText, Pencil, Trash2,
  ShieldCheck, FolderPlus, FilePlus
} from 'lucide-react';
import './Vault.css';

function copyToClipboard(text, setCopied, key) {
  navigator.clipboard.writeText(text).then(() => {
    setCopied(key);
    setTimeout(() => setCopied(null), 1800);
  });
}

export function Vault() {
  const { vault, deleteEntry, deleteGroup, deleteSubgroup } = useVault();
  const { confirm } = useConfirm();

  const [search, setSearch] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [selectedSubgroupId, setSelectedSubgroupId] = useState(null);
  const [expandedGroups, setExpandedGroups] = useState({});
  const [visiblePasswords, setVisiblePasswords] = useState({});
  const [copied, setCopied] = useState(null);

  // Modals
  const [entryModal, setEntryModal] = useState(null);   // null | { mode:'add'|'edit', groupId, subgroupId, entry? }
  const [groupModal, setGroupModal] = useState(null);   // null | { mode:'add'|'edit', type:'group'|'subgroup', groupId?, group?, subgroup? }

  const toggleGroup = (id) =>
    setExpandedGroups(prev => ({ ...prev, [id]: !prev[id] }));

  const togglePassword = (id) =>
    setVisiblePasswords(prev => ({ ...prev, [id]: !prev[id] }));

  // Derived: which entries to show on the right panel
  const getDisplayedEntries = () => {
    if (search.trim()) {
      const q = search.toLowerCase();
      const results = [];
      vault.forEach(group => {
        const checkEntries = (entries, subgroupName = null) => {
          entries.forEach(e => {
            if (
              e.name.toLowerCase().includes(q) ||
              (e.username || '').toLowerCase().includes(q) ||
              (e.url || '').toLowerCase().includes(q) ||
              group.name.toLowerCase().includes(q) ||
              (subgroupName || '').toLowerCase().includes(q)
            ) {
              results.push({ ...e, _groupId: group.id, _groupName: group.name, _subgroupId: subgroupName ? group.subgroups?.find(s => s.name === subgroupName)?.id : null, _subgroupName: subgroupName });
            }
          });
        };
        checkEntries(group.entries || []);
        (group.subgroups || []).forEach(sg => checkEntries(sg.entries || [], sg.name));
      });
      return results;
    }

    if (selectedSubgroupId) {
      const group = vault.find(g => g.id === selectedGroupId);
      const sg = group?.subgroups?.find(s => s.id === selectedSubgroupId);
      return (sg?.entries || []).map(e => ({ ...e, _groupId: group.id, _groupName: group.name, _subgroupId: sg.id, _subgroupName: sg.name }));
    }

    if (selectedGroupId) {
      const group = vault.find(g => g.id === selectedGroupId);
      if (!group) return [];
      const direct = (group.entries || []).map(e => ({ ...e, _groupId: group.id, _groupName: group.name }));
      const sub = (group.subgroups || []).flatMap(sg =>
        (sg.entries || []).map(e => ({ ...e, _groupId: group.id, _groupName: group.name, _subgroupId: sg.id, _subgroupName: sg.name }))
      );
      return [...direct, ...sub];
    }

    // All entries
    return vault.flatMap(group => {
      const direct = (group.entries || []).map(e => ({ ...e, _groupId: group.id, _groupName: group.name }));
      const sub = (group.subgroups || []).flatMap(sg =>
        (sg.entries || []).map(e => ({ ...e, _groupId: group.id, _groupName: group.name, _subgroupId: sg.id, _subgroupName: sg.name }))
      );
      return [...direct, ...sub];
    });
  };

  const displayedEntries = getDisplayedEntries();

  const totalEntries = vault.reduce((acc, g) => {
    return acc + (g.entries?.length || 0) + (g.subgroups || []).reduce((a, sg) => a + (sg.entries?.length || 0), 0);
  }, 0);

  return (
    <div className="vault-page">
      {/* Header */}
      <div className="vault-header">
        <div className="vault-header-left">
          <div className="vault-title-row">
            <ShieldCheck size={28} className="vault-shield-icon" />
            <div>
              <h2 className="page-title">Cofre de Senhas</h2>
              <p className="page-subtitle">{totalEntries} credencial{totalEntries !== 1 ? 'is' : ''} armazenada{totalEntries !== 1 ? 's' : ''}</p>
            </div>
          </div>
        </div>
        <div className="vault-header-actions">
          <Button variant="ghost" icon={<FolderPlus size={18} />} onClick={() => setGroupModal({ mode: 'add', type: 'group' })}>
            Novo Grupo
          </Button>
          <Button variant="primary" icon={<FilePlus size={18} />} onClick={() => setEntryModal({ mode: 'add', groupId: selectedGroupId || vault[0]?.id, subgroupId: selectedSubgroupId })}>
            Nova Credencial
          </Button>
        </div>
      </div>

      <div className="vault-layout">
        {/* Sidebar: Tree */}
        <aside className="vault-sidebar glass">
          <div className="vault-search-box">
            <Search size={16} className="vault-search-icon" />
            <input
              type="text"
              placeholder="Buscar credenciais..."
              className="vault-search-input"
              value={search}
              onChange={e => { setSearch(e.target.value); setSelectedGroupId(null); setSelectedSubgroupId(null); }}
            />
          </div>

          <nav className="vault-tree">
            {/* "Todos" item */}
            <button
              className={`vault-tree-item ${!selectedGroupId && !search ? 'active' : ''}`}
              onClick={() => { setSelectedGroupId(null); setSelectedSubgroupId(null); setSearch(''); }}
            >
              <KeyRound size={16} />
              <span>Todas as Credenciais</span>
              <span className="vault-tree-count">{totalEntries}</span>
            </button>

            <div className="vault-tree-divider" />

            {vault.map(group => {
              const groupCount = (group.entries?.length || 0) + (group.subgroups || []).reduce((a, sg) => a + (sg.entries?.length || 0), 0);
              const isExpanded = expandedGroups[group.id];
              const isSelected = selectedGroupId === group.id && !selectedSubgroupId;

              return (
                <div key={group.id} className="vault-group-block">
                  <div className={`vault-tree-item vault-group-item ${isSelected ? 'active' : ''}`}>
                    <button
                      className="vault-group-expand"
                      onClick={() => toggleGroup(group.id)}
                    >
                      {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </button>
                    <button
                      className="vault-group-name-btn"
                      onClick={() => { setSelectedGroupId(group.id); setSelectedSubgroupId(null); setSearch(''); }}
                    >
                      {isSelected ? <FolderOpen size={16} style={{ color: group.color }} /> : <Folder size={16} style={{ color: group.color }} />}
                      <span>{group.name}</span>
                    </button>
                    <div className="vault-group-actions-right">
                      <span className="vault-tree-count">{groupCount}</span>
                      <button
                        className="vault-tree-action-btn"
                        title="Adicionar subgrupo"
                        onClick={(e) => { e.stopPropagation(); setGroupModal({ mode: 'add', type: 'subgroup', groupId: group.id }); }}
                      >
                        <Plus size={12} />
                      </button>
                      <button
                        className="vault-tree-action-btn danger"
                        title="Excluir grupo"
                        onClick={async (e) => { 
                          e.stopPropagation(); 
                          if (await confirm({ title: 'Excluir Grupo', message: `Tem certeza que deseja excluir o grupo "${group.name}" e todas as suas credenciais?` })) {
                            deleteGroup(group.id); 
                          }
                        }}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>

                  {isExpanded && (group.subgroups || []).map(sg => {
                    const sgCount = sg.entries?.length || 0;
                    const isSgSelected = selectedSubgroupId === sg.id;
                    return (
                      <div key={sg.id} className={`vault-tree-item vault-subgroup-item ${isSgSelected ? 'active' : ''}`}>
                        <button
                          className="vault-subgroup-name-btn"
                          onClick={() => { setSelectedGroupId(group.id); setSelectedSubgroupId(sg.id); setSearch(''); }}
                        >
                          <span className="vault-subgroup-dot" style={{ backgroundColor: group.color }} />
                          <span>{sg.name}</span>
                        </button>
                        <div className="vault-group-actions-right">
                          <span className="vault-tree-count">{sgCount}</span>
                          <button
                            className="vault-tree-action-btn danger"
                            title="Excluir subgrupo"
                            onClick={async (e) => { 
                              e.stopPropagation(); 
                              if (await confirm({ title: 'Excluir Subgrupo', message: `Tem certeza que deseja excluir o subgrupo "${sg.name}"?` })) {
                                deleteSubgroup(group.id, sg.id); 
                              }
                            }}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}

            {vault.length === 0 && (
              <p className="vault-empty-tree">Nenhum grupo criado ainda.</p>
            )}
          </nav>
        </aside>

        {/* Main Content: Credentials Grid */}
        <main className="vault-content">
          {displayedEntries.length === 0 ? (
            <div className="vault-empty-state">
              <ShieldCheck size={56} className="vault-empty-icon" />
              <h3>Nenhuma credencial aqui</h3>
              <p>Adicione uma nova credencial para começar.</p>
              <Button
                variant="primary"
                icon={<Plus size={18} />}
                onClick={() => setEntryModal({ mode: 'add', groupId: selectedGroupId || vault[0]?.id, subgroupId: selectedSubgroupId })}
              >
                Nova Credencial
              </Button>
            </div>
          ) : (
            <div className="vault-entries-grid">
              {displayedEntries.map(entry => {
                const isPwVisible = visiblePasswords[entry.id];
                const group = vault.find(g => g.id === entry._groupId);
                return (
                  <GlassCard key={entry.id} className="vault-entry-card">
                    {/* Card Header */}
                    <div className="vault-entry-header">
                      <div className="vault-entry-icon" style={{ background: group?.color ? `${group.color}22` : undefined, border: `1px solid ${group?.color || 'var(--border-color)'}44` }}>
                        <Globe size={20} style={{ color: group?.color || 'var(--accent-emerald)' }} />
                      </div>
                      <div className="vault-entry-title">
                        <h4>{entry.name}</h4>
                        <div className="vault-entry-breadcrumb">
                          <span style={{ color: group?.color }}>{entry._groupName}</span>
                          {entry._subgroupName && <><span className="breadcrumb-sep">›</span><span>{entry._subgroupName}</span></>}
                        </div>
                      </div>
                      <div className="vault-entry-actions">
                        <button className="vault-icon-btn" title="Editar" onClick={() => setEntryModal({ mode: 'edit', groupId: entry._groupId, subgroupId: entry._subgroupId || null, entry })}>
                          <Pencil size={15} />
                        </button>
                        <button className="vault-icon-btn danger" title="Excluir" onClick={async () => { 
                          if (await confirm({ title: 'Excluir Credencial', message: `Tem certeza que deseja excluir a credencial "${entry.name}"?` })) {
                            deleteEntry(entry._groupId, entry._subgroupId || null, entry.id); 
                          }
                        }}>
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>

                    {/* Fields */}
                    <div className="vault-entry-fields">
                      {entry.url && (
                        <div className="vault-field">
                          <Globe size={14} className="vault-field-icon" />
                          <span className="vault-field-value vault-field-url">
                            <a href={entry.url.startsWith('http') ? entry.url : `https://${entry.url}`} target="_blank" rel="noopener noreferrer">
                              {entry.url}
                            </a>
                          </span>
                        </div>
                      )}

                      <div className="vault-field">
                        <User size={14} className="vault-field-icon" />
                        <span className="vault-field-value">{entry.username || '—'}</span>
                        {entry.username && (
                          <button
                            className={`vault-copy-btn ${copied === `u-${entry.id}` ? 'copied' : ''}`}
                            onClick={() => copyToClipboard(entry.username, setCopied, `u-${entry.id}`)}
                            title="Copiar usuário"
                          >
                            {copied === `u-${entry.id}` ? '✓' : <Copy size={13} />}
                          </button>
                        )}
                      </div>

                      <div className="vault-field">
                        <Lock size={14} className="vault-field-icon" />
                        <span className="vault-field-value vault-password-value">
                          {isPwVisible ? entry.password : '••••••••••'}
                        </span>
                        <button
                          className="vault-copy-btn"
                          onClick={() => togglePassword(entry.id)}
                          title={isPwVisible ? 'Ocultar senha' : 'Ver senha'}
                        >
                          {isPwVisible ? <EyeOff size={13} /> : <Eye size={13} />}
                        </button>
                        {entry.password && (
                          <button
                            className={`vault-copy-btn ${copied === `p-${entry.id}` ? 'copied' : ''}`}
                            onClick={() => copyToClipboard(entry.password, setCopied, `p-${entry.id}`)}
                            title="Copiar senha"
                          >
                            {copied === `p-${entry.id}` ? '✓' : <Copy size={13} />}
                          </button>
                        )}
                      </div>

                      {entry.notes && (
                        <div className="vault-field vault-field-notes">
                          <FileText size={14} className="vault-field-icon" />
                          <span className="vault-field-value vault-notes-text">{entry.notes}</span>
                        </div>
                      )}
                    </div>
                  </GlassCard>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* Entry Modal */}
      {entryModal && (
        <VaultEntryModal
          mode={entryModal.mode}
          groupId={entryModal.groupId}
          subgroupId={entryModal.subgroupId}
          entry={entryModal.entry}
          onClose={() => setEntryModal(null)}
        />
      )}

      {/* Group/Subgroup Modal */}
      {groupModal && (
        <VaultGroupModal
          mode={groupModal.mode}
          type={groupModal.type}
          groupId={groupModal.groupId}
          onClose={() => setGroupModal(null)}
        />
      )}
    </div>
  );
}
