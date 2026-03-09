import { useState } from 'react'
import Header from './Header'
import Sidebar from './Sidebar'
import { useLanguage } from '../contexts/LanguageContext'
import './OfflineRequests.css'

interface OfflineRequestsProps {
  onLogout: () => void
  onBack: () => void
  userName?: string
  onNavigate?: (page: string) => void
}

function OfflineRequests({ onLogout, onBack, userName, onNavigate }: OfflineRequestsProps) {
  const { t } = useLanguage()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleMenuClick = () => {
    setSidebarOpen(true)
  }

  const handleSidebarClose = () => {
    setSidebarOpen(false)
  }

  return (
    <div className="offline-requests-container">
      <Header onLogout={onLogout} onMenuClick={handleMenuClick} onNavigateHome={() => onNavigate?.('home')} onNavigateOfflineRequests={() => onNavigate?.('offline-requests')} />
      <Sidebar isOpen={sidebarOpen} onClose={handleSidebarClose} userName={userName} onNavigate={onNavigate} onLogout={onLogout} />
      <main className="offline-requests-content">
        <div className="offline-requests-header">
          <button className="back-button" onClick={onBack} aria-label="Go back">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <h1 className="offline-requests-title">{t('offlineRequests')}</h1>
        </div>

        <div className="offline-requests-empty">
          <div className="empty-state">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="empty-icon">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="currentColor" opacity="0.3"/>
            </svg>
            <h2 className="empty-title">{t('noOfflineRequests')}</h2>
            <p className="empty-description">{t('noOfflineRequestsDescription')}</p>
          </div>
        </div>
      </main>
    </div>
  )
}

export default OfflineRequests

