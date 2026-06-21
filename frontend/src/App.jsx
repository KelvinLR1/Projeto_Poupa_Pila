import React, { useState } from 'react'
import { Layout } from './components/layout/Layout'
import { Dashboard } from './pages/Dashboard/Dashboard'
import { Transactions } from './pages/Transactions/Transactions'
import { Loans } from './pages/Loans/Loans'
import { Accounts } from './pages/Accounts/Accounts'
import { OFXImport } from './pages/OFXImport/OFXImport'
import { Vault } from './pages/Vault/Vault'
import { CashFlow } from './pages/CashFlow/CashFlow'
import { useAuth } from './context/AuthContext'
import { Login } from './pages/Login/Login'
import { Settings } from './pages/Settings/Settings'
import { Analytics } from './pages/Analytics/Analytics'
import { GlobalConfirmModal } from './components/ui/ConfirmModal'

function App() {
  const { isAuthenticated, loading } = useAuth()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [filterAccountId, setFilterAccountId] = useState('all')
  const [transactionsFilterTab, setTransactionsFilterTab] = useState('all')

  if (loading) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#050505',
        color: '#ffffff'
      }}>
        <div className="spinner"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Login />
  }

  const handleNavClick = (tabId) => {
    // Clear the transaction page filters when navigating via the sidebar/bottom-nav
    setTransactionsFilterTab('all')
    setFilterAccountId('all')
    setActiveTab(tabId)
  }

  return (
    <Layout activeTab={activeTab} setActiveTab={handleNavClick}>
      {activeTab === 'dashboard' && (
        <Dashboard setActiveTab={setActiveTab} setFilterAccountId={setFilterAccountId} setTransactionsFilterTab={setTransactionsFilterTab} />
      )}
      {activeTab === 'transactions' && (
        <Transactions filterAccountId={filterAccountId} setFilterAccountId={setFilterAccountId} filterTab={transactionsFilterTab} setFilterTab={setTransactionsFilterTab} />
      )}
      {activeTab === 'loans' && <Loans />}
      {activeTab === 'cashflow' && <CashFlow />}
      {activeTab === 'accounts' && <Accounts />}
      {activeTab === 'analytics' && <Analytics />}
      {activeTab === 'ofx' && <OFXImport />}
      {activeTab === 'vault' && <Vault />}
      {activeTab === 'settings' && <Settings />}
      <GlobalConfirmModal />
    </Layout>
  )
}

export default App
