import { useLanguage } from '../contexts/LanguageContext'
import {
  PAGE_CONTENT,
  BACK_BUTTON,
  PAGE_TITLE,
  EMPTY_STATE,
  EMPTY_ICON,
  EMPTY_TITLE,
  EMPTY_DESC,
} from '../styles/designSystem'

interface OfflineRequestsProps {
  onLogout: () => void
  onBack: () => void
  userName?: string
  onNavigate?: (page: string) => void
}

function OfflineRequests({ onLogout: _onLogout, onBack, userName: _userName, onNavigate: _onNavigate }: OfflineRequestsProps) {
  const { t } = useLanguage()

  return (
    <div className={PAGE_CONTENT}>
      <div className="flex items-center gap-3 mb-6">
        <button className={BACK_BUTTON} onClick={onBack} aria-label="Go back">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <h1 className={PAGE_TITLE}>{t('offlineRequests')}</h1>
      </div>

      <div className={EMPTY_STATE}>
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={EMPTY_ICON}>
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="currentColor" opacity="0.3"/>
        </svg>
        <h2 className={EMPTY_TITLE}>{t('noOfflineRequests')}</h2>
        <p className={EMPTY_DESC}>{t('noOfflineRequestsDescription')}</p>
      </div>
    </div>
  )
}

export default OfflineRequests
