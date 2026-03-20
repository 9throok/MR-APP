import { useState } from 'react'
import Header from './Header'
import Sidebar from './Sidebar'
import TodaysPlanBanner from './TodaysPlanBanner'
import ManagerPulseBanner from './ManagerPulseBanner'
import Shortcuts from './Shortcuts'
import DashboardReports from './DashboardReports'
import ManagerDashboardReports from './ManagerDashboardReports'
import { useLanguage } from '../contexts/LanguageContext'
import { useAuth } from '../contexts/AuthContext'
import './Home.css'

interface HomeProps {
  onLogout: () => void
  onNavigate?: (page: string) => void
  userName: string
  userEmail?: string
  userMobile?: string
}

function Home({ onLogout, onNavigate, userName, userEmail, userMobile }: HomeProps) {
  const { t } = useLanguage()
  const { user } = useAuth()
  const isManager = user?.role === 'manager' || user?.role === 'admin'
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleMenuClick = () => {
    setSidebarOpen(true)
  }

  const handleSidebarClose = () => {
    setSidebarOpen(false)
  }

  const handleTodaysPlanClick = () => {
    if (onNavigate) {
      onNavigate('nba')
    }
  }

  const handleNavigateHome = () => {
    if (onNavigate) {
      onNavigate('home')
    }
  }

  return (
    <div className="home-container">
      <Header onLogout={onLogout} onMenuClick={handleMenuClick} onNavigateHome={handleNavigateHome} onNavigateOfflineRequests={() => onNavigate?.('offline-requests')} />
      <Sidebar isOpen={sidebarOpen} onClose={handleSidebarClose} userName={userName} userEmail={userEmail} userMobile={userMobile} onNavigate={onNavigate} onLogout={onLogout} currentPage="home" />
      <main className="home-content">
        <div className="welcome-greeting">
          <h1>{t('hello')} {userName},</h1>
        </div>
        {isManager ? (
          <ManagerPulseBanner onNavigate={onNavigate} />
        ) : (
          <TodaysPlanBanner onNavigate={handleTodaysPlanClick} />
        )}
        <Shortcuts onNavigate={onNavigate} />
        <h2 className="dashboards-heading">Dashboards</h2>
        {isManager ? (
          <ManagerDashboardReports onNavigate={onNavigate} />
        ) : (
          <DashboardReports />
        )}
        {/* <div className="welcome-section">
          <h1>Welcome to ZenX Global</h1>
          <p>Your medical application dashboard</p>
        </div> */}
        {/* Add more content here as needed */}
      </main>
    </div>
  )
}

export default Home

