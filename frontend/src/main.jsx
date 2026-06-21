import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/tokens.css'
import './styles/global.css'

// Interceptor global do fetch para injetar os headers de autenticação e workspace
const originalFetch = window.fetch;
window.fetch = async (url, options = {}) => {
  const token = localStorage.getItem('poupa_pila_token');
  const workspace = localStorage.getItem('poupa_pila_workspace') || 'personal';
  
  if (typeof url === 'string' && (url.startsWith('/api/') || url.startsWith('api/'))) {
    options.headers = options.headers || {};
    if (token && !options.headers['Authorization']) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }
    if (workspace && !options.headers['X-Workspace-Owner']) {
      options.headers['X-Workspace-Owner'] = workspace;
    }
  }
  return originalFetch(url, options);
};

import App from './App.jsx'

// Carregar cor tema customizada se existir no localStorage
const savedTheme = localStorage.getItem('poupa_pila_theme_color');
if (savedTheme) {
  try {
    const { primary, glow, light } = JSON.parse(savedTheme);
    document.documentElement.style.setProperty('--accent-emerald', primary);
    document.documentElement.style.setProperty('--accent-emerald-glow', glow);
    document.documentElement.style.setProperty('--accent-emerald-light', light);
  } catch (e) {
    console.error('Erro ao aplicar tema customizado:', e);
  }
}

// Carregar modo de tema (escuro/claro) do localStorage
const savedMode = localStorage.getItem('poupa_pila_theme_mode');
if (savedMode === 'light') {
  document.documentElement.classList.add('light-theme');
}

import { FinanceProvider } from './context/FinanceContext.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { VaultProvider } from './context/VaultContext.jsx'
import { ConfirmProvider } from './context/ConfirmContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <ConfirmProvider>
        <FinanceProvider>
          <VaultProvider>
            <App />
          </VaultProvider>
        </FinanceProvider>
      </ConfirmProvider>
    </AuthProvider>
  </StrictMode>,
)
