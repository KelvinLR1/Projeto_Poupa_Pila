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

function App() {
  const { isAuthenticated, loading } = useAuth()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [filterAccountId, setFilterAccountId] = useState('all')

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

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {activeTab === 'dashboard' && (
        <Dashboard setActiveTab={setActiveTab} setFilterAccountId={setFilterAccountId} />
      )}
      {activeTab === 'transactions' && (
        <Transactions filterAccountId={filterAccountId} setFilterAccountId={setFilterAccountId} />
      )}
      {activeTab === 'loans' && <Loans />}
      {activeTab === 'cashflow' && <CashFlow />}
      {activeTab === 'accounts' && <Accounts />}
      {activeTab === 'analytics' && <Analytics />}
      {activeTab === 'ofx' && <OFXImport />}
      {activeTab === 'vault' && <Vault />}
      {activeTab === 'settings' && <Settings />}
    </Layout>
  )
}

export default App
