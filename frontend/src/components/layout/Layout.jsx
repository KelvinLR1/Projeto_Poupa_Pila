import React from 'react';
import { useFinance } from '../../context/FinanceContext';
import { useAuth } from '../../context/AuthContext';
import { Eye, EyeOff, LayoutDashboard, Receipt, HandCoins, Wallet, FileInput, LogOut, KeyRound } from 'lucide-react';
import './Layout.css';

export function Layout({ children, activeTab, setActiveTab }) {
  const { hideValues, toggleHideValues } = useFinance();
  const { user, logout } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Visão Geral', icon: <LayoutDashboard size={20} /> },
    { id: 'transactions', label: 'Extrato', icon: <Receipt size={20} /> },
    { id: 'loans', label: 'Empréstimos', icon: <HandCoins size={20} /> },
    { id: 'accounts', label: 'Minhas Contas', icon: <Wallet size={20} /> },
    { id: 'ofx', label: 'Importar OFX', icon: <FileInput size={20} /> },
  ];

  return (
    <div className="layout-container">
      {/* Sidebar */}
      <aside className="sidebar glass">
        <div className="sidebar-header">
          <div className="logo-placeholder"></div>
          <h2>Finance<span className="text-emerald">Premium</span></h2>
        </div>

        <nav className="sidebar-nav">
          {navItems.map(item => (
            <button
              key={item.id}
              className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => setActiveTab(item.id)}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}

          {/* Separador */}
          <div className="nav-divider">
            <span className="nav-divider-label">Segurança</span>
          </div>

          <button
            className={`nav-item nav-item-vault ${activeTab === 'vault' ? 'active vault-active' : ''}`}
            onClick={() => setActiveTab('vault')}
          >
            <KeyRound size={20} />
            <span>Cofre de Senhas</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <button className="logout-btn" onClick={logout} title="Sair do sistema">
            <LogOut size={20} />
            <span>Sair</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="main-content">
        {/* Topbar */}
        <header className="topbar">
          <div className="greeting">
            <h1>Bom dia, <span className="user-name">{user ? user.name : 'João'}</span></h1>
            <p>Seu resumo financeiro está pronto.</p>
          </div>
          <div className="topbar-actions">
            <button 
              className="action-btn glass" 
              onClick={toggleHideValues}
              title={hideValues ? "Mostrar valores" : "Ocultar valores"}
            >
              {hideValues ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
            <div className="avatar-placeholder glass">{user ? user.name.charAt(0).toUpperCase() : 'J'}</div>
          </div>
        </header>

        {/* Page Content */}
        <main className="page-wrapper animate-fade-in" key={activeTab}>
          {children}
        </main>
      </div>
    </div>
  );
}
