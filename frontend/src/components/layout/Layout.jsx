import React, { useState, useEffect } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { useAuth } from '../../context/AuthContext';
import {
  Eye, EyeOff, LayoutDashboard, Receipt, HandCoins, Wallet,
  FileInput, LogOut, KeyRound, TrendingUp, Settings, Menu, X,
  MoreHorizontal, BarChart2
} from 'lucide-react';
import './Layout.css';

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
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
            <button
              className={`action-btn glass ${activeTab === 'settings' ? 'active-topbar' : ''}`}
              onClick={() => handleTabChange('settings')}
              title="Configurações"
            >
              <Settings size={20} />
            </button>
            <div className="avatar-placeholder glass">
              {user ? user.name.charAt(0).toUpperCase() : 'J'}
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
