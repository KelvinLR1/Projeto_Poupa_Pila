import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/tokens.css'
import './styles/global.css'
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

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <FinanceProvider>
        <VaultProvider>
          <App />
        </VaultProvider>
      </FinanceProvider>
    </AuthProvider>
  </StrictMode>,
)
