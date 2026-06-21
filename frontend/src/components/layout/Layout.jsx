import React, { useState, useEffect } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { useAuth } from '../../context/AuthContext';
import {
  Eye, EyeOff, LayoutDashboard, Receipt, HandCoins, Wallet,
  FileInput, LogOut, KeyRound, TrendingUp, Settings, Menu, X,
  MoreHorizontal, BarChart2, Check
} from 'lucide-react';
import './Layout.css';
import { CustomSelect } from '../ui/CustomSelect';

// Primary nav items shown in the bottom bar (max 4) + "More" for the rest
const ALL_NAV_ITEMS = [
  { id: 'dashboard',    label: 'Visão Geral',    icon: <LayoutDashboard size={20} /> },
  { id: 'transactions', label: 'Extrato',         icon: <Receipt size={20} /> },
  { id: 'analytics',    label: 'Análises',        icon: <BarChart2 size={20} /> },
  { id: 'cashflow',     label: 'Fluxo',           icon: <TrendingUp size={20} /> },
  { id: 'loans',        label: 'Empréstimos',     icon: <HandCoins size={20} /> },
  { id: 'accounts',     label: 'Contas',          icon: <Wallet size={20} /> },
  { id: 'ofx',          label: 'Importar OFX',    icon: <FileInput size={20} /> },
  { id: 'vault',        label: 'Cofre',           icon: <KeyRound size={20} />, vault: true },
  { id: 'settings',     label: 'Config.',         icon: <Settings size={20} /> },
];

const BOTTOM_PRIMARY = ['dashboard', 'transactions', 'cashflow', 'loans'];

export function Layout({ children, activeTab, setActiveTab }) {
  const { hideValues, toggleHideValues } = useFinance();
  const { user, logout, activeWorkspace, availableWorkspaces, switchWorkspace } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  // Close sidebar on tab change (mobile)
  const handleTabChange = (id) => {
    setActiveTab(id);
    setSidebarOpen(false);
  };

  // Close sidebar on Escape key
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') setSidebarOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  // Prevent body scroll when drawer open
  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [sidebarOpen]);

  const primaryItems  = ALL_NAV_ITEMS.filter(i => BOTTOM_PRIMARY.includes(i.id));
  const isMoreActive  = !BOTTOM_PRIMARY.includes(activeTab);

  return (
    <div className="layout-container">

      {/* Mobile overlay backdrop */}
      <div
        className={`mobile-overlay ${sidebarOpen ? 'open' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar / Drawer */}
      <aside className={`sidebar glass ${sidebarOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header">
          <div className="logo-placeholder" />
          <h2>Poupa<span className="text-emerald">Pila</span></h2>
        </div>

        <nav className="sidebar-nav">
          {ALL_NAV_ITEMS.slice(0, 7).map(item => (
            <button
              key={item.id}
              className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => handleTabChange(item.id)}
            >
              {item.icon}
              <span>{item.label === 'Fluxo' ? 'Fluxo de Caixa' : item.label}</span>
            </button>
          ))}

          <div className="nav-divider">
            <span className="nav-divider-label">Segurança</span>
          </div>

          <button
            className={`nav-item nav-item-vault ${activeTab === 'vault' ? 'active vault-active' : ''}`}
            onClick={() => handleTabChange('vault')}
          >
            <KeyRound size={20} />
            <span>Cofre de Senhas</span>
          </button>

          <button
            className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => handleTabChange('settings')}
          >
            <Settings size={20} />
            <span>Configurações</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <button className="logout-btn" onClick={logout} title="Sair do sistema">
            <LogOut size={20} />
            <span>Sair</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="main-content">

        {/* Topbar */}
        <header className="topbar">
          {/* Hamburger — only visible on mobile */}
          <button
            className="mobile-menu-btn"
            onClick={() => setSidebarOpen(v => !v)}
            aria-label="Menu"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <div className="greeting">
            <h1>
              Bom dia, <span className="user-name">{user ? user.name : 'João'}</span>
              {user?.isLinked && (
                <span
                  className="linked-badge"
                  title={`Conta de ${user.ownerName} (${user.permissions === 'read_only' ? 'Apenas Leitura' : 'Leitura e Escrita'})`}
                >
                  Conta de {user.ownerName}{user.permissions === 'read_only' && ' 🔒'}
                </span>
              )}
            </h1>
            <p>
              {user?.isLinked
                ? (user.permissions === 'read_only'
                  ? `Leitura — dados de ${user.ownerName}`
                  : `Acesso completo — dados de ${user.ownerName}`)
                : 'Seu resumo financeiro está pronto.'}
            </p>
          </div>

          <div className="topbar-actions">
            <button
              className="action-btn glass"
              onClick={toggleHideValues}
              title={hideValues ? 'Mostrar valores' : 'Ocultar valores'}
            >
              {hideValues ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
            
            <div className="profile-menu-container">
              <button 
                className={`avatar-placeholder glass ${isProfileMenuOpen ? 'active' : ''}`}
                onClick={() => setIsProfileMenuOpen(v => !v)}
              >
                {user ? user.name.charAt(0).toUpperCase() : 'J'}
              </button>

              {isProfileMenuOpen && (
                <>
                  <div className="profile-menu-overlay" onClick={() => setIsProfileMenuOpen(false)}></div>
                  <div className="profile-dropdown animate-fade-in">
                    <div className="profile-dropdown-header">
                      <div className="profile-avatar-large">
                        {user ? user.name.charAt(0).toUpperCase() : 'J'}
                      </div>
                      <div className="profile-info">
                        <strong>{user ? user.name : 'Usuário'}</strong>
                        <span>{user?.email || 'email@exemplo.com'}</span>
                      </div>
                    </div>

                    <div className="profile-dropdown-section">
                      <span className="section-label">Contas & Acesso</span>
                      {availableWorkspaces && availableWorkspaces.length > 0 ? (
                        availableWorkspaces.map(w => {
                           const isMe = w.id === activeWorkspace;
                           return (
                             <button 
                               key={w.id}
                               className={`workspace-item ${isMe ? 'active' : ''}`}
                               onClick={() => { switchWorkspace(w.id); setIsProfileMenuOpen(false); }}
                             >
                               <div className="workspace-item-info">
                                 <span>{w.isLinked ? `Conta de ${w.name.replace('Conta de ', '')}` : 'Minha Conta Pessoal'}</span>
                                 {w.permissions === 'read_only' && <small>Apenas Leitura</small>}
                               </div>
                               {isMe && <Check size={16} className="text-emerald" />}
                             </button>
                           );
                        })
                      ) : (
                        <button className="workspace-item active">
                          <div className="workspace-item-info">
                            <span>Minha Conta Pessoal</span>
                          </div>
                          <Check size={16} className="text-emerald" />
                        </button>
                      )}
                    </div>

                    <div className="profile-dropdown-footer">
                      <button className="dropdown-action-btn" onClick={() => { handleTabChange('settings'); setIsProfileMenuOpen(false); }}>
                        <Settings size={16} /> Configurações
                      </button>
                      <button className="dropdown-action-btn logout-action" onClick={logout}>
                        <LogOut size={16} /> Sair do Sistema
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="page-wrapper animate-fade-in" key={activeTab}>
          {children}
        </main>
      </div>

      {/* Bottom navigation bar — mobile only */}
      <nav className="bottom-nav">
        {primaryItems.map(item => (
          <button
            key={item.id}
            className={`bottom-nav-item ${activeTab === item.id ? 'active' : ''}`}
            onClick={() => handleTabChange(item.id)}
          >
            <span className="bottom-nav-icon">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}

        {/* "More" button opens the sidebar drawer */}
        <button
          className={`bottom-nav-item more-btn ${isMoreActive ? 'active' : ''}`}
          onClick={() => setSidebarOpen(v => !v)}
        >
          <span className="bottom-nav-icon">
            {isMoreActive
              ? ALL_NAV_ITEMS.find(i => i.id === activeTab)?.icon ?? <MoreHorizontal size={20} />
              : <MoreHorizontal size={20} />}
          </span>
          <span>{isMoreActive ? ALL_NAV_ITEMS.find(i => i.id === activeTab)?.label ?? 'Mais' : 'Mais'}</span>
        </button>
      </nav>

    </div>
  );
}
