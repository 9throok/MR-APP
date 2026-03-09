
import './Header.css'
import zenracLogo from '../assets//images/ZenApp.png'
import LanguageSelector from './LanguageSelector'
import { useLanguage } from '../contexts/LanguageContext'

interface HeaderProps {
  onLogout: () => void
  onMenuClick: () => void
  onNavigateHome?: () => void
  onNavigateOfflineRequests?: () => void
}

function Header({ onLogout, onMenuClick, onNavigateHome, onNavigateOfflineRequests }: HeaderProps) {
  const { t } = useLanguage()
  const handleLogoClick = () => {
    if (onNavigateHome) {
      onNavigateHome()
    }
  }

  return (
    <header className="app-header">
      <div className="header-left">
        <button className="menu-button" onClick={onMenuClick} aria-label="Open menu">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 12H21M3 6H21M3 18H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <button className="logo-wrapper logo-button" onClick={handleLogoClick} aria-label="Go to home">
          <img src={zenracLogo} alt="ZenApp Logo" className="header-logo" />
        </button>
      </div>
      <div className="header-right">
        <button className="offline-requests-button" onClick={onNavigateOfflineRequests} aria-label={t('offlineRequests')}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM17 13l-5-5-5 5h3v4h4v-4h3z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
          </svg>
        </button>
        <LanguageSelector />
        <button className="logout-button" onClick={onLogout} aria-label={t('logout')}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </header>
  )
}

export default Header

