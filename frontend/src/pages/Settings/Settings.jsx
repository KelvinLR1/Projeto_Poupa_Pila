import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { useAuth } from '../../context/AuthContext';
import { GlassCard } from '../../components/ui/GlassCard';
import { Button } from '../../components/ui/Button';
import { CustomSelect } from '../../components/ui/CustomSelect';
import { 
  User, Shield, Database, Download, Upload, Trash2, 
  Check, AlertTriangle, Info, Moon, Sun, Globe, Palette, LayoutGrid,
  Users, UserPlus, Eye, EyeOff, Lock
} from 'lucide-react';
import './Settings.css';

const THEME_COLORS = [
  { name: 'Esmeralda', primary: '#10b981', glow: 'rgba(16, 185, 129, 0.4)', light: 'rgba(16, 185, 129, 0.1)' },
  { name: 'Menta', primary: '#06b6d4', glow: 'rgba(6, 182, 212, 0.4)', light: 'rgba(6, 182, 212, 0.1)' },
  { name: 'Celeste', primary: '#0ea5e9', glow: 'rgba(14, 165, 233, 0.4)', light: 'rgba(14, 165, 233, 0.1)' },
  { name: 'Safira', primary: '#3b82f6', glow: 'rgba(59, 130, 246, 0.4)', light: 'rgba(59, 130, 246, 0.1)' },
  { name: 'Royal Blue', primary: '#2563eb', glow: 'rgba(37, 99, 235, 0.4)', light: 'rgba(37, 99, 235, 0.1)' },
  { name: 'Índigo', primary: '#6366f1', glow: 'rgba(99, 102, 241, 0.4)', light: 'rgba(99, 102, 241, 0.1)' },
  { name: 'Violeta', primary: '#8b5cf6', glow: 'rgba(139, 92, 246, 0.4)', light: 'rgba(139, 92, 246, 0.1)' },
  { name: 'Púrpura', primary: '#7c3aed', glow: 'rgba(124, 58, 237, 0.4)', light: 'rgba(124, 58, 237, 0.1)' },
  { name: 'Ametista', primary: '#a21caf', glow: 'rgba(162, 28, 175, 0.4)', light: 'rgba(162, 28, 175, 0.1)' },
  { name: 'Orquídea', primary: '#d946ef', glow: 'rgba(217, 70, 239, 0.4)', light: 'rgba(217, 70, 239, 0.1)' },
  { name: 'Magenta', primary: '#ec4899', glow: 'rgba(236, 72, 153, 0.4)', light: 'rgba(236, 72, 153, 0.1)' },
  { name: 'Rose', primary: '#f472b6', glow: 'rgba(244, 114, 182, 0.4)', light: 'rgba(244, 114, 182, 0.1)' },
  { name: 'Carmim', primary: '#e11d48', glow: 'rgba(225, 29, 72, 0.4)', light: 'rgba(225, 29, 72, 0.1)' },
  { name: 'Coral', primary: '#f43f5e', glow: 'rgba(244, 63, 94, 0.4)', light: 'rgba(244, 63, 94, 0.1)' },
  { name: 'Laranja', primary: '#ff7e1b', glow: 'rgba(255, 126, 27, 0.4)', light: 'rgba(255, 126, 27, 0.1)' },
  { name: 'Pôr do Sol', primary: '#f97316', glow: 'rgba(249, 115, 22, 0.4)', light: 'rgba(249, 115, 22, 0.1)' },
  { name: 'Âmbar', primary: '#f59e0b', glow: 'rgba(245, 158, 11, 0.4)', light: 'rgba(245, 158, 11, 0.1)' },
  { name: 'Ouro', primary: '#fbbf24', glow: 'rgba(251, 191, 36, 0.4)', light: 'rgba(251, 191, 36, 0.1)' },
  { name: 'Limão', primary: '#84cc16', glow: 'rgba(132, 204, 22, 0.4)', light: 'rgba(132, 204, 22, 0.1)' },
  { name: 'Jade', primary: '#059669', glow: 'rgba(5, 150, 105, 0.4)', light: 'rgba(5, 150, 105, 0.1)' },
];

export function Settings() {
  const { user } = useAuth();
  const { accounts, transactions, loans, hideValues, toggleHideValues } = useFinance();
  
  const [activeTab, setActiveTab] = useState('profile'); // 'profile', 'customization', 'backup', 'system'
  const [profileName, setProfileName] = useState(user?.name || 'Administrador');
  const [profileEmail, setProfileEmail] = useState(user?.email || 'admin@poupapila.com');
  const [currency, setCurrency] = useState('BRL');
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('poupa_pila_theme_mode') || 'dark';
    if (saved === 'light') {
      document.documentElement.classList.add('light-theme');
    } else {
      document.documentElement.classList.remove('light-theme');
    }
    return saved;
  });

  const handleSetTheme = (mode) => {
    setTheme(mode);
    localStorage.setItem('poupa_pila_theme_mode', mode);
    if (mode === 'light') {
      document.documentElement.classList.add('light-theme');
    } else {
      document.documentElement.classList.remove('light-theme');
    }
  };
  const [saveStatus, setSaveStatus] = useState(null);

  const [selectedColorHex, setSelectedColorHex] = useState(() => {
    const saved = localStorage.getItem('poupa_pila_theme_color');
    if (saved) {
      try {
        return JSON.parse(saved).primary;
      } catch (e) {}
    }
    return '#10b981'; // default
  });

  const handleSelectColor = (colorObj) => {
    setSelectedColorHex(colorObj.primary);
    document.documentElement.style.setProperty('--accent-emerald', colorObj.primary);
    document.documentElement.style.setProperty('--accent-emerald-glow', colorObj.glow);
    document.documentElement.style.setProperty('--accent-emerald-light', colorObj.light);
    localStorage.setItem('poupa_pila_theme_color', JSON.stringify(colorObj));
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    setSaveStatus('success');
    setTimeout(() => setSaveStatus(null), 3000);
  };

  const [accessList, setAccessList] = useState([]);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedPermission, setSelectedPermission] = useState('read_write');
  const [accessError, setAccessError] = useState('');
  const [accessSuccess, setAccessSuccess] = useState('');
  const [isLoadingAccess, setIsLoadingAccess] = useState(false);

  const fetchAccessList = async () => {
    setIsLoadingAccess(true);
    try {
      const savedToken = localStorage.getItem('poupa_pila_token');
      const res = await fetch('/api/settings/access', {
        headers: {
          'Authorization': `Bearer ${savedToken}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setAccessList(data);
      }
    } catch (e) {
      console.error('Erro ao buscar lista de acessos:', e);
    } finally {
      setIsLoadingAccess(false);
    }
  };

  React.useEffect(() => {
    if (activeTab === 'access') {
      fetchAccessList();
      setAccessError('');
      setAccessSuccess('');
    }
  }, [activeTab]);

  const handleAddAccess = async (e) => {
    e.preventDefault();
    setAccessError('');
    setAccessSuccess('');
    
    if (!newUsername.trim()) {
      setAccessError('Digite um nome de usuário.');
      return;
    }

    try {
      const savedToken = localStorage.getItem('poupa_pila_token');
      const res = await fetch('/api/settings/access', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${savedToken}`
        },
        body: JSON.stringify({ 
          username: newUsername, 
          permissions: selectedPermission,
          password: newPassword.trim() || undefined
        })
      });
      
      const data = await res.json();
      if (!res.ok) {
        setAccessError(data.error || 'Erro ao conceder acesso.');
        return;
      }

      setAccessSuccess(`Acesso concedido com sucesso para "${newUsername}"!`);
      setNewUsername('');
      setNewPassword('');
      setShowPassword(false);
      setSelectedPermission('read_write');
      fetchAccessList();
    } catch (e) {
      setAccessError('Erro de conexão ao salvar.');
    }
  };

  const handleRevokeAccess = async (id, targetUser) => {
    if (!confirm(`Deseja realmente revogar o acesso de "${targetUser}"?`)) return;

    setAccessError('');
    setAccessSuccess('');

    try {
      const savedToken = localStorage.getItem('poupa_pila_token');
      const res = await fetch(`/api/settings/access/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${savedToken}`
        }
      });

      if (!res.ok) {
        setAccessError('Erro ao revogar acesso.');
        return;
      }

      setAccessSuccess(`Acesso revogado para "${targetUser}".`);
      fetchAccessList();
    } catch (e) {
      setAccessError('Erro de conexão ao remover.');
    }
  };

  const handleExportData = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(
      JSON.stringify({ accounts, transactions, loans }, null, 2)
    );
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `poupa_pila_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportData = (e) => {
    const fileReader = new FileReader();
    const file = e.target.files[0];
    if (!file) return;

    fileReader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        if (parsed.accounts && parsed.transactions) {
          alert("Backup lido com sucesso! Para persistir os dados no banco de dados, envie os dados via API (Modo de Demonstração).");
        } else {
          alert("Formato de backup inválido.");
        }
      } catch (err) {
        alert("Erro ao ler arquivo de backup.");
      }
    };
    fileReader.readAsText(file);
  };

  return (
    <div className="settings-page">
      <div className="page-header">
        <div>
          <h2 className="page-title">Configurações</h2>
          <p className="page-subtitle">Gerencie suas preferências, dados e segurança.</p>
        </div>
      </div>

      {/* Navegação de Abas */}
      <div className="settings-tabs-nav">
        <button 
          className={`settings-tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          <User size={18} />
          <span>Perfil & Preferências</span>
        </button>
        <button 
          className={`settings-tab-btn ${activeTab === 'customization' ? 'active' : ''}`}
          onClick={() => setActiveTab('customization')}
        >
          <Palette size={18} />
          <span>Customização & Temas</span>
        </button>
        <button 
          className={`settings-tab-btn ${activeTab === 'backup' ? 'active' : ''}`}
          onClick={() => setActiveTab('backup')}
        >
          <Database size={18} />
          <span>Backup de Dados</span>
        </button>
        <button 
          className={`settings-tab-btn ${activeTab === 'system' ? 'active' : ''}`}
          onClick={() => setActiveTab('system')}
        >
          <Shield size={18} />
          <span>Segurança & Sistema</span>
        </button>
        <button 
          className={`settings-tab-btn ${activeTab === 'access' ? 'active' : ''}`}
          onClick={() => setActiveTab('access')}
        >
          <Users size={18} />
          <span>Controle de Acesso</span>
        </button>
      </div>

      {/* Conteúdo das Abas */}
      <div className="settings-tab-content">
        {activeTab === 'profile' && (
          <div className="tab-pane-grid">
            <GlassCard className="settings-card">
              <div className="card-header-icon">
                <User size={20} className="text-emerald" />
                <h3>Perfil do Usuário</h3>
              </div>
              
              <form onSubmit={handleSaveProfile} className="settings-form">
                <div className="form-group">
                  <label>Nome Completo</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={profileName} 
                    onChange={e => setProfileName(e.target.value)} 
                  />
                </div>
                <div className="form-group">
                  <label>E-mail</label>
                  <input 
                    type="email" 
                    className="form-input" 
                    value={profileEmail} 
                    onChange={e => setProfileEmail(e.target.value)} 
                  />
                </div>
                
                <div className="settings-actions">
                  <Button type="submit" variant="primary" icon={<Check size={16} />}>
                    Salvar Perfil
                  </Button>
                  {saveStatus === 'success' && (
                    <span className="save-toast text-emerald">Alterações salvas!</span>
                  )}
                </div>
              </form>
            </GlassCard>

            <GlassCard className="settings-card">
              <div className="card-header-icon">
                <Globe size={20} className="text-emerald" />
                <h3>Preferências</h3>
              </div>

              <div className="settings-options-list">
                <div className="option-row">
                  <div className="option-info">
                    <h4>Ocultar valores por padrão</h4>
                    <p>Inicia o sistema com os saldos ocultos.</p>
                  </div>
                  <label className="switch-wrapper">
                    <input 
                      type="checkbox" 
                      checked={hideValues} 
                      onChange={toggleHideValues} 
                    />
                    <span className="switch-slider"></span>
                  </label>
                </div>

                <div className="option-row">
                  <div className="option-info">
                    <h4>Moeda Principal</h4>
                    <p>Unidade monetária padrão.</p>
                  </div>
                  <div className="option-control-select">
                    <CustomSelect 
                      value={currency} 
                      onChange={e => setCurrency(e.target.value)}
                      options={[
                        { value: 'BRL', label: 'Real (R$)' },
                        { value: 'USD', label: 'Dólar ($)' },
                        { value: 'EUR', label: 'Euro (€)' }
                      ]}
                    />
                  </div>
                </div>
              </div>
            </GlassCard>
          </div>
        )}

        {activeTab === 'customization' && (
          <GlassCard className="settings-card">
            <div className="card-header-icon">
              <Palette size={20} className="text-emerald" />
              <h3>Customização de Cores</h3>
            </div>
            
            <p className="card-description">
              Selecione sua cor de destaque favorita. O sistema adaptará automaticamente todos os botões, detalhes, ícones e gráficos para combinar com a sua identidade visual selecionada.
            </p>

            <div className="color-picker-grid">
              {THEME_COLORS.map((color, idx) => {
                const isActive = selectedColorHex.toLowerCase() === color.primary.toLowerCase();
                return (
                  <button
                    key={idx}
                    type="button"
                    className={`color-selector-btn ${isActive ? 'active' : ''}`}
                    onClick={() => handleSelectColor(color)}
                    style={{ '--color-primary': color.primary }}
                  >
                    <span className="color-preview-circle" style={{ backgroundColor: color.primary }}></span>
                    <span className="color-name">{color.name}</span>
                    {isActive && <Check size={14} className="color-active-check" />}
                  </button>
                );
              })}
            </div>

            <div className="customization-theme-mode mt-32">
              <h4 className="section-subtitle">Tema Visual do Sistema</h4>
              <div className="option-row mt-12">
                <div className="option-info">
                  <h4>Contraste de Fundo</h4>
                  <p>Alterne entre o visual Escuro Premium e o visual Claro.</p>
                </div>
                <div className="theme-toggle-group">
                  <button 
                    type="button" 
                    className={`theme-btn ${theme === 'dark' ? 'active' : ''}`}
                    onClick={() => handleSetTheme('dark')}
                  >
                    <Moon size={15} /> Escuro
                  </button>
                  <button 
                    type="button" 
                    className={`theme-btn ${theme === 'light' ? 'active' : ''}`}
                    onClick={() => handleSetTheme('light')}
                  >
                    <Sun size={15} /> Claro
                  </button>
                </div>
              </div>
            </div>
          </GlassCard>
        )}

        {activeTab === 'backup' && (
          <GlassCard className="settings-card">
            <div className="card-header-icon">
              <Database size={20} className="text-emerald" />
              <h3>Backup e Dados</h3>
            </div>

            <p className="card-description">
              Faça cópias de segurança locais e recupere seus lançamentos a qualquer momento.
            </p>

            <div className="backup-actions">
              <div className="backup-box">
                <h4>Exportar Backup</h4>
                <p>Baixe um arquivo JSON contendo todas as contas, transações e empréstimos cadastrados.</p>
                <Button variant="secondary" icon={<Download size={16} />} onClick={handleExportData}>
                  Exportar Dados
                </Button>
              </div>

              <div className="backup-box">
                <h4>Importar Backup</h4>
                <p>Carregue um arquivo JSON gerado anteriormente pelo Poupa Pila.</p>
                <label className="import-file-label">
                  <Upload size={16} /> Selecionar Arquivo
                  <input 
                    type="file" 
                    accept=".json" 
                    onChange={handleImportData}
                    style={{ display: 'none' }} 
                  />
                </label>
              </div>
            </div>
          </GlassCard>
        )}

        {activeTab === 'system' && (
          <div className="tab-pane-grid">
            <GlassCard className="settings-card">
              <div className="card-header-icon">
                <Shield size={20} className="text-emerald" />
                <h3>Segurança e Informações</h3>
              </div>

              <div className="system-info-list">
                <div className="info-item">
                  <span className="info-label">Banco de Dados</span>
                  <span className="info-value">SQLite (Local)</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Conexão Backend</span>
                  <span className="info-value text-emerald">Ativa / Conectado</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Versão do Sistema</span>
                  <span className="info-value">v1.2.4 (Premium)</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Status da Sessão</span>
                  <span className="info-value">Autenticado</span>
                </div>
              </div>
            </GlassCard>

            <GlassCard className="settings-card danger-card">
              <div className="card-header-icon">
                <AlertTriangle size={20} className="text-coral" />
                <h3 className="text-coral">Zona de Perigo</h3>
              </div>
              
              <div className="system-danger-zone" style={{ borderTop: 'none', paddingTop: 0, marginTop: 0 }}>
                <div className="danger-content">
                  <h4>Excluir Todos os Lançamentos</h4>
                  <p>Esta ação removerá permanentemente todos os registros do seu extrato financeiro local.</p>
                </div>
                <button type="button" className="danger-btn">
                  <Trash2 size={16} /> Limpar Banco de Dados
                </button>
              </div>
            </GlassCard>
          </div>
        )}

        {activeTab === 'access' && (
          <div className="tab-pane-grid">
            <GlassCard className="settings-card">
              <div className="card-header-icon">
                <Users size={20} className="text-emerald" />
                <h3>Usuários Vinculados / Acessos</h3>
              </div>
              
              <p className="card-description">
                Permita que outros usuários acessem e gerenciem seus dados financeiros utilizando as contas individuais deles.
              </p>

              <form onSubmit={handleAddAccess} className="settings-form">
                {accessError && (
                  <div className="access-banner access-banner--error">
                    <AlertTriangle size={16} />
                    <span>{accessError}</span>
                  </div>
                )}
                {accessSuccess && (
                  <div className="access-banner access-banner--success">
                    <Check size={16} />
                    <span>{accessSuccess}</span>
                  </div>
                )}

                <div className="form-group">
                  <label htmlFor="new-access-user">Nome do usuário</label>
                  <input
                    id="new-access-user"
                    type="text"
                    className="form-input"
                    placeholder="ex: joao"
                    value={newUsername}
                    onChange={e => setNewUsername(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="new-access-password">
                    <Lock size={13} style={{ marginRight: 5, opacity: 0.6 }} />
                    Senha de acesso
                  </label>
                  <div className="password-input-wrapper">
                    <input
                      id="new-access-password"
                      type={showPassword ? 'text' : 'password'}
                      className="form-input"
                      placeholder="Mín. 4 caracteres"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      className="password-eye-btn"
                      onClick={() => setShowPassword(v => !v)}
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <span className="field-hint">
                    Obrigatória apenas se o usuário ainda não tiver uma conta no sistema.
                  </span>
                </div>

                <div className="form-group">
                  <label>Nível de Permissão</label>
                  <div className="permission-toggle-row">
                    <button
                      type="button"
                      className={`permission-card ${selectedPermission === 'read_write' ? 'active-rw' : ''}`}
                      onClick={() => setSelectedPermission('read_write')}
                    >
                      <Check size={16} className="perm-icon" />
                      <div>
                        <strong>Leitura e Escrita</strong>
                        <p>Pode adicionar e editar dados</p>
                      </div>
                    </button>
                    <button
                      type="button"
                      className={`permission-card ${selectedPermission === 'read_only' ? 'active-ro' : ''}`}
                      onClick={() => setSelectedPermission('read_only')}
                    >
                      <Shield size={16} className="perm-icon" />
                      <div>
                        <strong>Apenas Leitura</strong>
                        <p>Somente visualização</p>
                      </div>
                    </button>
                  </div>
                </div>

                <button type="submit" className="access-submit-btn">
                  <UserPlus size={16} />
                  Permitir Acesso
                </button>
              </form>
            </GlassCard>
  
            <GlassCard className="settings-card">
              <div className="card-header-icon">
                <Users size={20} className="text-emerald" />
                <h3>Quem tem acesso a esta conta</h3>
              </div>
  
              {isLoadingAccess ? (
                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  Carregando...
                </div>
              ) : accessList.length === 0 ? (
                <div style={{ padding: '24px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  Nenhum usuário externo vinculado a esta conta ainda.
                </div>
              ) : (
                <div className="system-info-list" style={{ marginTop: '12px' }}>
                  {accessList.map(item => (
                    <div key={item.id} className="access-user-card">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-emerald)' }}></div>
                        <span style={{ fontWeight: '500', color: 'var(--text-primary)' }}>{item.target_username}</span>
                        <span style={{ 
                          fontSize: '0.75rem', 
                          padding: '2px 8px', 
                          borderRadius: '12px', 
                          background: item.permissions === 'read_only' ? 'rgba(245, 158, 11, 0.12)' : 'rgba(16, 185, 129, 0.12)', 
                          color: item.permissions === 'read_only' ? '#f59e0b' : 'var(--accent-emerald)', 
                          border: item.permissions === 'read_only' ? '1px solid rgba(245, 158, 11, 0.25)' : '1px solid rgba(16, 185, 129, 0.25)', 
                          marginLeft: '8px',
                          fontWeight: '600'
                        }}>
                          {item.permissions === 'read_only' ? 'Apenas Leitura' : 'Leitura e Escrita'}
                        </span>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => handleRevokeAccess(item.id, item.target_username)}
                        className="revoke-btn"
                      >
                        <Trash2 size={14} /> Revogar
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </GlassCard>
          </div>
        )}
      </div>
    </div>
  );
}
