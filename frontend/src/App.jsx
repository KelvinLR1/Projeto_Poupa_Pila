import React, { useState } from 'react'
import { Layout } from './components/layout/Layout'
import { Dashboard } from './pages/Dashboard/Dashboard'
import { Transactions } from './pages/Transactions/Transactions'
import { Loans } from './pages/Loans/Loans'
import { Accounts } from './pages/Accounts/Accounts'
import { OFXImport } from './pages/OFXImport/OFXImport'

function App() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [filterAccountId, setFilterAccountId] = useState('all')

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {activeTab === 'dashboard' && (
        <Dashboard setActiveTab={setActiveTab} setFilterAccountId={setFilterAccountId} />
      )}
      {activeTab === 'transactions' && (
        <Transactions filterAccountId={filterAccountId} setFilterAccountId={setFilterAccountId} />
      )}
      {activeTab === 'loans' && <Loans />}
      {activeTab === 'accounts' && <Accounts />}
      {activeTab === 'ofx' && <OFXImport />}
    </Layout>
  )
}

export default App
