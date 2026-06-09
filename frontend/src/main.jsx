import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/tokens.css'
import './styles/global.css'
import App from './App.jsx'

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
