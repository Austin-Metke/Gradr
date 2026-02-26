import { useState } from 'react'
import { Dashboard } from './pages/Dashboard'
import { Settings } from './pages/Settings'

type Page = 'dashboard' | 'settings'

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard')

  return (
    <div className="h-screen bg-slate-900">
      {currentPage === 'dashboard' && (
        <Dashboard onNavigate={setCurrentPage} />
      )}
      {currentPage === 'settings' && (
        <Settings onNavigate={setCurrentPage} />
      )}
    </div>
  )
}

export default App