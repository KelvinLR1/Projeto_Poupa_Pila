import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency } from '../../utils/formatters';
import { GlassCard } from '../../components/ui/GlassCard';
import { Button } from '../../components/ui/Button';
import { CustomSelect } from '../../components/ui/CustomSelect';
import { 
  User, Shield, Database, Download, Upload, Trash2, 
  Check, AlertTriangle, Info, Moon, Sun, Globe, Palette, LayoutGrid,
  Users, UserPlus, Eye, EyeOff, Lock, X
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
  const { user, logout } = useAuth();
  const { 
    accounts, transactions, loans, hideValues, toggleHideValues,
    categories, categoryLimits, addCategory, deleteCategory, updateCategory, addCategoryLimit, deleteCategoryLimit 
  } = useFinance();
  
  const [activeTab, setActiveTab] = useState('profile'); // 'profile', 'customization', 'backup', 'system'
  const [profileName, setProfileName] = useState(user?.name || 'Administrador');
  const [profileEmail, setProfileEmail] = useState(user?.email || 'admin@poupapila.com');
  const [currency, setCurrency] = useState('BRL');

  const [confirmInputVal, setConfirmInputVal] = useState('');

  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info', // 'info', 'danger', 'success'
    confirmText: 'Confirmar',
    cancelText: 'Cancelar',
    requiredInputText: '',
    onConfirm: null,
    onCancel: null
  });

  const showCustomConfirm = (title, message, confirmText, onConfirm, type = 'danger', requiredInputText = '') => {
    setConfirmInputVal('');
    setConfirmModal({
      isOpen: true,
      title,
      message,
      type,
      confirmText,
      cancelText: 'Cancelar',
      requiredInputText,
      onConfirm: () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        onConfirm();
      },
      onCancel: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
    });
  };

  const showCustomAlert = (title, message, type = 'info', onOk = null) => {
    setConfirmInputVal('');
    setConfirmModal({
      isOpen: true,
      title,
      message,
      type,
      confirmText: 'Ok',
      cancelText: '',
      requiredInputText: '',
      onConfirm: () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        if (onOk) onOk();
      },
      onCancel: null
    });
  };


  const [currentPassword, setCurrentPassword] = useState('');
  const [newChangePassword, setNewChangePassword] = useState('');
  const [confirmChangePassword, setConfirmChangePassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (newChangePassword.length < 4) {
      setPasswordError('A nova senha deve ter pelo menos 4 caracteres.');
      return;
    }

    if (newChangePassword !== confirmChangePassword) {
      setPasswordError('As senhas digitadas não coincidem.');
      return;
    }

    try {
      const savedToken = localStorage.getItem('poupa_pila_token');
      const res = await fetch('/api/settings/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${savedToken}`
        },
        body: JSON.stringify({ currentPassword, newPassword: newChangePassword })
      });

      const data = await res.json();

      if (res.ok) {
        setPasswordSuccess('Senha alterada com sucesso!');
        setCurrentPassword('');
        setNewChangePassword('');
        setConfirmChangePassword('');
      } else {
        setPasswordError(data.error || 'Erro ao alterar senha.');
      }
    } catch (err) {
      setPasswordError('Erro de conexão ao alterar senha.');
    }
  };

  // Para adicionar categoria
  const [newCatName, setNewCatName] = useState('');
  const [newCatType, setNewCatType] = useState('expense');
  const [newCatRuleType, setNewCatRuleType] = useState('want');
  const [catError, setCatError] = useState('');
  const [catSuccess, setCatSuccess] = useState('');

  // Para adicionar limite
  const [limitCategory, setLimitCategory] = useState('');
  const [limitAmount, setLimitAmount] = useState('');
  const [limitPeriod, setLimitPeriod] = useState('monthly');
  const [limitThreshold, setLimitThreshold] = useState(80);
  const [limitError, setLimitError] = useState('');
  const [limitSuccess, setLimitSuccess] = useState('');

  // Helper para verificar se uma transação pertence ao período do limite
  const getStartOfWeek = () => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    const start = new Date(today.setDate(diff));
    start.setHours(0,0,0,0);
    return start;
  };

  const calculateSpent = (categoryName, period) => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const startOfWeek = getStartOfWeek();

    return transactions
      .filter(t => t.type === 'expense' && t.category.toLowerCase().trim() === categoryName.toLowerCase().trim())
      .reduce((sum, t) => {
        if (period === 'monthly') {
          if (t.date.startsWith(`${year}-${month}`)) {
            return sum + t.amount;
          }
        } else if (period === 'weekly') {
          const tDate = new Date(t.date + 'T00:00:00');
          const endOfWeek = new Date(startOfWeek);
          endOfWeek.setDate(endOfWeek.getDate() + 7);
          if (tDate >= startOfWeek && tDate < endOfWeek) {
            return sum + t.amount;
          }
        } else {
          return sum + t.amount;
        }
        return sum;
      }, 0);
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    setCatError('');
    setCatSuccess('');
    if (!newCatName.trim()) return;

    try {
      await addCategory({ 
        name: newCatName, 
        type: newCatType, 
        rule_type: newCatType === 'expense' ? newCatRuleType : null 
      });
      setCatSuccess('Categoria criada com sucesso!');
      setNewCatName('');
    } catch (err) {
      setCatError(err.message || 'Erro ao criar categoria.');
    }
  };

  const handleUpdateCategoryRuleType = async (id, rule_type) => {
    setCatError('');
    setCatSuccess('');
    try {
      await updateCategory(id, { rule_type });
      setCatSuccess('Classificação da categoria atualizada!');
    } catch (err) {
      setCatError(err.message || 'Erro ao atualizar categoria.');
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!confirm('Tem certeza que deseja remover esta categoria?')) return;
    setCatError('');
    setCatSuccess('');
    try {
      await deleteCategory(id);
      setCatSuccess('Categoria removida com sucesso!');
    } catch (err) {
      setCatError(err.message || 'Erro ao remover categoria.');
    }
  };

  const handleCreateLimit = async (e) => {
    e.preventDefault();
    setLimitError('');
    setLimitSuccess('');
    if (!limitCategory) {
      setLimitError('Selecione uma categoria.');
      return;
    }
    const parsedAmt = parseFloat(limitAmount);
    if (isNaN(parsedAmt) || parsedAmt <= 0) {
      setLimitError('Digite um valor limite válido.');
      return;
    }

    try {
      await addCategoryLimit({
        category_name: limitCategory,
        limit_amount: parsedAmt,
        period: limitPeriod,
        alert_threshold: parseFloat(limitThreshold)
      });
      setLimitSuccess('Limite de gastos salvo!');
      setLimitAmount('');
      setLimitCategory('');
    } catch (err) {
      setLimitError(err.message || 'Erro ao salvar limite.');
    }
  };

  const handleDeleteLimit = async (id) => {
    if (!confirm('Tem certeza que deseja remover este limite?')) return;
    setLimitError('');
    setLimitSuccess('');
    try {
      await deleteCategoryLimit(id);
      setLimitSuccess('Limite removido com sucesso!');
    } catch (err) {
      setLimitError(err.message || 'Erro ao remover limite.');
    }
  };
  
  const executeClearData = async () => {
    try {
      const savedToken = localStorage.getItem('poupa_pila_token');
      const res = await fetch('/api/settings/clear-data', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${savedToken}`
        }
      });
      
      if (res.ok) {
        showCustomAlert(
          'Dados Limpos', 
          'Dados limpos com sucesso! O sistema foi reiniciado com os valores padrão.',
          'success',
          () => window.location.reload()
        );
      } else {
        const data = await res.json();
        showCustomAlert('Erro', data.error || 'Erro ao limpar dados.', 'danger');
      }
    } catch (e) {
      showCustomAlert('Erro', 'Erro de conexão ao limpar dados.', 'danger');
    }
  };

  const handleClearData = () => {
    showCustomConfirm(
      'Limpar Todos os Lançamentos',
      'ATENÇÃO: Isso apagará permanentemente todas as suas transações, contas e histórico, mas manterá seu usuário ativo. Esta ação NÃO pode ser desfeita.',
      'Limpar Dados',
      executeClearData,
      'danger',
      'limpar'
    );
  };

  const executeDeleteAccount = async () => {
    try {
      const savedToken = localStorage.getItem('poupa_pila_token');
      const res = await fetch('/api/settings/account', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${savedToken}`
        }
      });
      
      if (res.ok) {
        showCustomAlert(
          'Conta Excluída',
          'Sua conta foi excluída definitivamente.',
          'success',
          async () => {
            await logout();
          }
        );
      } else {
        const data = await res.json();
        showCustomAlert('Erro', data.error || 'Erro ao excluir conta.', 'danger');
      }
    } catch (e) {
      showCustomAlert('Erro', 'Erro de conexão ao excluir conta.', 'danger');
    }
  };

  const handleDeleteAccount = () => {
    showCustomConfirm(
      'Excluir Minha Conta',
      'ATENÇÃO CRÍTICA: Isso apagará permanentemente sua conta, seu usuário e todos os seus lançamentos. Você perderá o acesso e precisará criar uma nova conta se quiser usar o sistema novamente.',
      'Prosseguir',
      () => {
        setTimeout(() => {
          showCustomConfirm(
            'Confirmar Exclusão Definitiva',
            'Deseja realmente prosseguir? Esta ação é irreversível. Para confirmar a exclusão definitiva de sua conta, digite seu nome de usuário.',
            'Excluir Minha Conta Definitivamente',
            executeDeleteAccount,
            'danger',
            user?.username || 'excluir'
          );
        }, 150);
      },
      'danger'
    );
  };
  

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
          parsed.loans = parsed.loans || [];

          const executeImport = async () => {
            try {
              const savedToken = localStorage.getItem('poupa_pila_token');
              const res = await fetch('/api/settings/import-data', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${savedToken}`
                },
                body: JSON.stringify(parsed)
              });

              if (res.ok) {
                showCustomAlert(
                  'Backup Importado',
                  'Seus dados de backup foram importados e salvos com sucesso no banco de dados!',
                  'success',
                  () => window.location.reload()
                );
              } else {
                const data = await res.json();
                showCustomAlert('Erro', data.error || 'Erro ao importar dados.', 'danger');
              }
            } catch (err) {
              showCustomAlert('Erro', 'Erro de conexão ao importar dados.', 'danger');
            }
          };

          showCustomConfirm(
            'Importar Backup',
            'ATENÇÃO: Importar um backup substituirá completamente todos os seus dados atuais (contas, transações e empréstimos). Deseja realmente prosseguir?',
            'Importar e Substituir',
            executeImport,
            'danger',
            'confirmar'
          );
        } else {
          showCustomAlert('Erro', 'Formato de backup inválido.', 'danger');
        }
      } catch (err) {
        showCustomAlert('Erro', 'Erro ao ler arquivo de backup.', 'danger');
      }
    };
    fileReader.readAsText(file);
    e.target.value = ''; // Reset input selection
  };

  const DEFAULT_CAT_NAMES = ['Empréstimo', 'Recebimento de Empréstimo', 'Salário', 'Despesa', 'Receita', 'Transferência'];

  const renderCategoryItem = (cat) => {
    const isDefault = DEFAULT_CAT_NAMES.includes(cat.name);
    return (
      <div key={cat.id} className="category-item-row">
        {/* Col 1: Nome e Marcador */}
        <div className="cat-item-col-name">
          <span className={`cat-item-dot ${cat.type === 'income' ? 'income' : 'expense'}`}></span>
          <span className="cat-item-name">{cat.name}</span>
        </div>

        {/* Col 2: Tipo de Transação */}
        <div className="cat-item-col-type">
          <span className={`cat-item-type-badge ${cat.type === 'income' ? 'income' : 'expense'}`}>
            {cat.type === 'income' ? 'Receita' : 'Despesa'}
          </span>
        </div>

        {/* Col 3: Regra e Ações */}
        <div className="cat-item-col-actions">
          {cat.type === 'expense' && (
            <select
              value={cat.rule_type || 'want'}
              onChange={(e) => handleUpdateCategoryRuleType(cat.id, e.target.value)}
              className="cat-item-rule-select"
            >
              <option value="necessity">Necessidade (50%)</option>
              <option value="want">Desejo/Lazer (30%)</option>
              <option value="investment">Investimento (20%)</option>
            </select>
          )}

          <div className="cat-item-action-wrapper">
            {isDefault ? (
              <span className="cat-item-system-label">Sistema</span>
            ) : (
              <button
                type="button"
                onClick={() => handleDeleteCategory(cat.id)}
                className="cat-item-delete-btn"
                title="Excluir Categoria"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        </div>
      </div>
    );
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
        <button 
          className={`settings-tab-btn ${activeTab === 'categories_limits' ? 'active' : ''}`}
          onClick={() => setActiveTab('categories_limits')}
        >
          <LayoutGrid size={18} />
          <span>Categorias & Limites</span>
        </button>
      </div>

      {/* Conteúdo das Abas */}
      <div className="settings-tab-content">
        {activeTab === 'profile' && (
          <div className="tab-pane-grid settings-tab-pane">
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
          <GlassCard className="settings-card settings-tab-pane">
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
          <GlassCard className="settings-card settings-tab-pane">
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
          <div className="tab-pane-grid settings-tab-pane">
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

            <GlassCard className="settings-card">
              <div className="card-header-icon">
                <Lock size={20} className="text-emerald" />
                <h3>Alterar Senha de Acesso</h3>
              </div>

              <form onSubmit={handleChangePassword} className="settings-form">
                {passwordError && (
                  <div className="access-banner access-banner--error" style={{ marginBottom: '10px' }}>
                    <AlertTriangle size={16} />
                    <span>{passwordError}</span>
                  </div>
                )}
                {passwordSuccess && (
                  <div className="access-banner access-banner--success" style={{ marginBottom: '10px' }}>
                    <Check size={16} />
                    <span>{passwordSuccess}</span>
                  </div>
                )}

                <div className="form-group">
                  <label htmlFor="current-password-input">Senha Atual</label>
                  <input 
                    id="current-password-input"
                    type="password" 
                    className="form-input" 
                    value={currentPassword} 
                    onChange={e => setCurrentPassword(e.target.value)} 
                    placeholder="Digite sua senha atual"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="new-password-input">Nova Senha</label>
                  <input 
                    id="new-password-input"
                    type="password" 
                    className="form-input" 
                    value={newChangePassword} 
                    onChange={e => setNewChangePassword(e.target.value)} 
                    placeholder="Mínimo 4 caracteres"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="confirm-password-input">Confirmar Nova Senha</label>
                  <input 
                    id="confirm-password-input"
                    type="password" 
                    className="form-input" 
                    value={confirmChangePassword} 
                    onChange={e => setConfirmChangePassword(e.target.value)} 
                    placeholder="Repita a nova senha"
                    required
                  />
                </div>

                <div className="settings-actions">
                  <Button type="submit" variant="primary" icon={<Check size={16} />}>
                    Atualizar Senha
                  </Button>
                </div>
              </form>
            </GlassCard>

            <GlassCard className="settings-card danger-card grid-colspan-2">
              <div className="card-header-icon">
                <AlertTriangle size={20} className="text-coral" />
                <h3 className="text-coral">Zona de Perigo</h3>
              </div>
              
              <div className="system-danger-zone" style={{ borderTop: 'none', paddingTop: 0, marginTop: 0, display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
                <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center', textAlign: 'left', gap: '16px' }}>
                  <div className="danger-content" style={{ flex: 1 }}>
                    <h4>Excluir Todos os Lançamentos</h4>
                    <p style={{ margin: '4px 0 0 0', fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>Remove transações, contas e histórico, mantendo seu usuário ativo.</p>
                  </div>
                  <button type="button" className="danger-btn" onClick={handleClearData} style={{ flexShrink: 0 }}>
                    <Trash2 size={16} /> Limpar Dados
                  </button>
                </div>

                <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center', textAlign: 'left', borderTop: '1px solid rgba(244, 63, 94, 0.15)', paddingTop: '20px', gap: '16px' }}>
                  <div className="danger-content" style={{ flex: 1 }}>
                    <h4>Excluir Minha Conta</h4>
                    <p style={{ margin: '4px 0 0 0', fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>Apaga permanentemente todos os lançamentos e deleta seu login e senha.</p>
                  </div>
                  <button type="button" className="danger-btn" onClick={handleDeleteAccount} style={{ flexShrink: 0 }}>
                    <AlertTriangle size={16} /> Excluir Conta
                  </button>
                </div>
              </div>
            </GlassCard>
          </div>
        )}

        {activeTab === 'access' && (
          <div className="tab-pane-grid settings-tab-pane">
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

        {activeTab === 'categories_limits' && (
          <div className="tab-pane-grid settings-tab-pane">
            {/* Coluna 1: Gerenciar Categorias */}
            <GlassCard className="settings-card animate-fade-in">
              <div className="card-header-icon">
                <LayoutGrid size={20} className="text-emerald" />
                <h3>Gerenciar Categorias</h3>
              </div>
              <p className="card-description">
                Crie e gerencie as categorias para classificar suas receitas e despesas.
              </p>

              <form onSubmit={handleCreateCategory} className="settings-form" style={{ marginBottom: '24px' }}>
                {catError && <div className="access-banner access-banner--error">{catError}</div>}
                {catSuccess && <div className="access-banner access-banner--success">{catSuccess}</div>}

                <div className="form-group">
                  <label>Nome da Categoria</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ex: Assinaturas, Mercado"
                    value={newCatName}
                    onChange={e => setNewCatName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Tipo de Transação</label>
                  <div className="theme-toggle-group" style={{ width: 'fit-content' }}>
                    <button
                      type="button"
                      className={`theme-btn ${newCatType === 'expense' ? 'active' : ''}`}
                      onClick={() => setNewCatType('expense')}
                    >
                      Despesa
                    </button>
                    <button
                      type="button"
                      className={`theme-btn ${newCatType === 'income' ? 'active' : ''}`}
                      onClick={() => setNewCatType('income')}
                    >
                      Receita
                    </button>
                  </div>
                </div>

                {newCatType === 'expense' && (
                  <div className="form-group animate-fade-in" style={{ marginTop: '12px' }}>
                    <label>Regra 50/30/20 (Classificação)</label>
                    <div className="theme-toggle-group" style={{ width: '100%', display: 'flex', gap: '4px', padding: '3px' }}>
                      <button
                        type="button"
                        className={`theme-btn ${newCatRuleType === 'necessity' ? 'active' : ''}`}
                        onClick={() => setNewCatRuleType('necessity')}
                        style={{ flex: 1, justifyContent: 'center', fontSize: '0.8rem', padding: '6px 4px' }}
                      >
                        Necessidade (50%)
                      </button>
                      <button
                        type="button"
                        className={`theme-btn ${newCatRuleType === 'want' ? 'active' : ''}`}
                        onClick={() => setNewCatRuleType('want')}
                        style={{ flex: 1, justifyContent: 'center', fontSize: '0.8rem', padding: '6px 4px' }}
                      >
                        Desejo (30%)
                      </button>
                      <button
                        type="button"
                        className={`theme-btn ${newCatRuleType === 'investment' ? 'active' : ''}`}
                        onClick={() => setNewCatRuleType('investment')}
                        style={{ flex: 1, justifyContent: 'center', fontSize: '0.8rem', padding: '6px 4px' }}
                      >
                        Investimento (20%)
                      </button>
                    </div>
                  </div>
                )}

                <Button type="submit" variant="primary">Adicionar Categoria</Button>
              </form>

              <div className="categories-list-container">
                <h4 className="section-subtitle">Categorias Ativas</h4>
                {categories.length === 0 ? (
                  <div className="categories-list-scroll mt-12">
                    <p className="text-muted" style={{ fontSize: '0.85rem' }}>Nenhuma categoria cadastrada.</p>
                  </div>
                ) : (() => {
                  const defaultCats = categories
                    .filter(cat => cat.active !== false && DEFAULT_CAT_NAMES.includes(cat.name))
                    .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' }));

                  const customCats = categories
                    .filter(cat => cat.active !== false && !DEFAULT_CAT_NAMES.includes(cat.name))
                    .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' }));

                  return (
                    <div className="categories-list-scroll mt-12">
                      {/* Categorias Personalizadas */}
                      <div>
                        <h5 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px', letterSpacing: '0.05em', fontWeight: 700 }}>
                          Categorias do Usuário ({customCats.length})
                        </h5>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {customCats.length === 0 ? (
                            <p className="text-muted" style={{ fontSize: '0.8rem', paddingLeft: '4px' }}>Nenhuma categoria personalizada criada.</p>
                          ) : (
                            customCats.map(renderCategoryItem)
                          )}
                        </div>
                      </div>

                      {/* Categorias Padrão */}
                      <div>
                        <h5 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px', letterSpacing: '0.05em', fontWeight: 700 }}>
                          Categorias do Sistema ({defaultCats.length})
                        </h5>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {defaultCats.map(renderCategoryItem)}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </GlassCard>

            {/* Coluna 2: Limites de Gastos & Alertas */}
            <GlassCard className="settings-card animate-fade-in">
              <div className="card-header-icon">
                <AlertTriangle size={20} className="text-coral" />
                <h3>Limites & Alertas</h3>
              </div>
              <p className="card-description">
                Defina limites para controle de despesas e seja alertado ao atingir a porcentagem desejada.
              </p>

              <form onSubmit={handleCreateLimit} className="settings-form" style={{ marginBottom: '24px' }}>
                {limitError && <div className="access-banner access-banner--error">{limitError}</div>}
                {limitSuccess && <div className="access-banner access-banner--success">{limitSuccess}</div>}

                <div className="form-row" style={{ display: 'flex', gap: '12px' }}>
                  <div className="form-group flex-1">
                    <label>Categoria de Despesa</label>
                    <CustomSelect
                      value={limitCategory}
                      onChange={e => setLimitCategory(e.target.value)}
                      options={[
                        { value: '', label: 'Selecione...' },
                        ...categories
                          .filter(c => c.active !== false && c.type === 'expense')
                          .map(c => ({ value: c.name, label: c.name }))
                      ]}
                      required
                    />
                  </div>
                  
                  <div className="form-group flex-1">
                    <label>Período</label>
                    <CustomSelect
                      value={limitPeriod}
                      onChange={e => setLimitPeriod(e.target.value)}
                      options={[
                        { value: 'weekly', label: 'Semanal' },
                        { value: 'monthly', label: 'Mensal' },
                        { value: 'total', label: 'Total Acumulado' }
                      ]}
                      required
                    />
                  </div>
                </div>

                <div className="form-row mt-12" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div className="form-group flex-1">
                    <label>Valor Limite (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      className="form-input"
                      placeholder="Ex: 500.00"
                      value={limitAmount}
                      onChange={e => setLimitAmount(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group flex-1">
                    <label>Alerta ao atingir (%): {limitThreshold}%</label>
                    <input
                      type="range"
                      min="50"
                      max="100"
                      step="5"
                      value={limitThreshold}
                      onChange={e => setLimitThreshold(e.target.value)}
                      style={{ accentColor: 'var(--accent-emerald)' }}
                    />
                  </div>
                </div>

                <Button type="submit" variant="primary">Salvar Limite</Button>
              </form>

              <div className="limits-list-container">
                <h4 className="section-subtitle">Limites Configurados</h4>
                <div className="limits-list-scroll mt-12">
                  {categoryLimits.length === 0 ? (
                    <p className="text-muted" style={{ fontSize: '0.85rem' }}>Nenhum limite configurado.</p>
                  ) : (
                    categoryLimits.map(lim => {
                      const spent = calculateSpent(lim.category_name, lim.period);
                      const percentage = lim.limit_amount > 0 ? (spent / lim.limit_amount) * 100 : 0;
                      const thresholdReached = percentage >= lim.alert_threshold;
                      const limitExceeded = percentage >= 100;

                      let progressColor = 'var(--accent-emerald, #10b981)'; // green
                      if (limitExceeded) {
                        progressColor = 'var(--accent-coral, #f43f5e)'; // red
                      } else if (thresholdReached) {
                        progressColor = 'var(--accent-amber, #f59e0b)'; // yellow
                      }

                      return (
                        <div key={lim.id} className="limit-item-card" style={{
                          padding: '14px',
                          background: 'rgba(255, 255, 255, 0.01)',
                          border: '1px solid rgba(255, 255, 255, 0.03)',
                          borderRadius: '12px'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', alignItems: 'center' }}>
                            <div>
                              <strong style={{ fontSize: '0.92rem', color: 'var(--text-primary)' }}>{lim.category_name}</strong>
                              <span style={{
                                fontSize: '0.7rem',
                                marginLeft: '8px',
                                padding: '1px 6px',
                                borderRadius: '6px',
                                background: 'rgba(255, 255, 255, 0.06)',
                                color: 'var(--text-secondary)',
                                textTransform: 'uppercase'
                              }}>
                                {lim.period === 'monthly' ? 'Mensal' : lim.period === 'weekly' ? 'Semanal' : 'Total'}
                              </span>
                            </div>
                            
                            <button
                              type="button"
                              onClick={() => handleDeleteLimit(lim.id)}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--accent-coral, #f43f5e)',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                padding: '4px',
                                borderRadius: '4px'
                              }}
                              className="revoke-btn"
                              title="Excluir Limite"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                            <span>Gasto: {formatCurrency(spent)} / {formatCurrency(lim.limit_amount)}</span>
                            <span style={{ fontWeight: '600', color: progressColor }}>
                              {percentage.toFixed(0)}%
                            </span>
                          </div>

                          {/* Progresso */}
                          <div style={{
                            width: '100%',
                            height: '6px',
                            background: 'rgba(255, 255, 255, 0.06)',
                            borderRadius: '3px',
                            overflow: 'hidden',
                            marginBottom: '6px'
                          }}>
                            <div style={{
                              width: `${Math.min(percentage, 100)}%`,
                              height: '100%',
                              background: progressColor,
                              borderRadius: '3px',
                              transition: 'width 0.3s ease'
                            }}></div>
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Alerta em {lim.alert_threshold}%</span>
                            {limitExceeded ? (
                              <span style={{ fontSize: '0.72rem', color: 'var(--accent-coral)', fontWeight: '600' }}>Excedido!</span>
                            ) : thresholdReached ? (
                              <span style={{ fontSize: '0.72rem', color: 'var(--accent-amber)', fontWeight: '600' }}>Limite próximo</span>
                            ) : null}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </GlassCard>
          </div>
        )}
      </div>
      {/* Modal de Confirmação customizado */}
      {confirmModal.isOpen && (
        <div className="settings-modal-overlay" onClick={confirmModal.onCancel || (() => {})}>
          <div 
            className={`settings-modal ${confirmModal.type === 'danger' ? 'danger-modal' : ''}`} 
            onClick={e => e.stopPropagation()}
          >
            <div className="settings-modal-header">
              <h3>
                {confirmModal.type === 'danger' && <AlertTriangle size={18} className="text-coral" />}
                {confirmModal.type === 'success' && <Check size={18} className="text-emerald" />}
                {confirmModal.type === 'info' && <Info size={18} className="text-emerald" />}
                <span>{confirmModal.title}</span>
              </h3>
              {confirmModal.onCancel && (
                <button className="settings-modal-close" onClick={confirmModal.onCancel}>
                  <X size={18} />
                </button>
              )}
            </div>
            
            <div className="settings-modal-body">
              <p>{confirmModal.message}</p>
              {confirmModal.requiredInputText && (
                <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Digite <strong style={{ color: 'var(--accent-coral, #f43f5e)', textTransform: 'none' }}>{confirmModal.requiredInputText}</strong> para habilitar a confirmação:
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    style={{
                      borderColor: confirmInputVal.toLowerCase() === confirmModal.requiredInputText.toLowerCase()
                        ? 'var(--accent-emerald)'
                        : 'rgba(244, 63, 94, 0.4)',
                      background: 'rgba(0, 0, 0, 0.2)',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      color: 'var(--text-primary)',
                      outline: 'none',
                      transition: 'all 0.2s ease',
                      marginTop: '4px'
                    }}
                    value={confirmInputVal}
                    onChange={e => setConfirmInputVal(e.target.value)}
                    placeholder={confirmModal.requiredInputText}
                    autoFocus
                  />
                </div>
              )}
            </div>
            
            <div className="settings-modal-footer">
              {confirmModal.onCancel && (
                <button className="settings-modal-btn-cancel" onClick={confirmModal.onCancel}>
                  {confirmModal.cancelText || 'Cancelar'}
                </button>
              )}
              {(() => {
                const isConfirmDisabled = confirmModal.requiredInputText && 
                  confirmInputVal.trim().toLowerCase() !== confirmModal.requiredInputText.toLowerCase();
                return (
                  <button 
                    className={confirmModal.type === 'danger' ? 'settings-modal-btn-danger' : 'settings-modal-btn-confirm'}
                    onClick={confirmModal.onConfirm}
                    disabled={isConfirmDisabled}
                    style={{
                      opacity: isConfirmDisabled ? 0.35 : 1,
                      cursor: isConfirmDisabled ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {confirmModal.confirmText}
                  </button>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
