import React from 'react';
import { useFinance } from '../../context/FinanceContext';
import { Eye, EyeOff, LayoutDashboard, Receipt, HandCoins, Wallet, FileInput } from 'lucide-react';
import './Layout.css';

export function Layout({ children, activeTab, setActiveTab }) {
  const { hideValues, toggleHideValues } = useFinance();

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
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="main-content">
        {/* Topbar */}
        <header className="topbar">
          <div className="greeting">
            <h1>Bom dia, <span className="user-name">João</span></h1>
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
            <div className="avatar-placeholder glass">J</div>
          </div>
        </header>

        {/* Page Content */}
        <main className="page-wrapper animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
}
