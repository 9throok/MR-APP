import './Sidebar.css'
import { useLanguage } from '../contexts/LanguageContext'
import { useAuth } from '../contexts/AuthContext'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
  userName?: string
  userEmail?: string
  userMobile?: string
  onNavigate?: (page: string) => void
  onLogout?: () => void
  currentPage?: string
}

function Sidebar({ isOpen, onClose, userName, userEmail, userMobile, onNavigate, onLogout, currentPage = 'home' }: SidebarProps) {
  const { t } = useLanguage()
  const { user } = useAuth()
  const role = user?.role || 'mr'
  const isMR = role === 'mr'
  const isManagerOrAdmin = role === 'manager' || role === 'admin'
  const isAdmin = role === 'admin'
  // MLR reviewer roles ship with Phase B. Any of the three roles (medical /
  // legal / regulatory) sees the MLR queue link.
  const isReviewer = role === 'medical_reviewer' || role === 'legal_reviewer' || role === 'regulatory_reviewer'

  const handleNavClick = (page: string) => {
    if (onNavigate) {
      onNavigate(page)
    }
    onClose()
  }

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!userName) return 'U'
    const names = userName.split(' ')
    if (names.length >= 2) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase()
    }
    return userName.substring(0, 2).toUpperCase()
  }

  return (
    <>
      {isOpen && <div className="sidebar-overlay" onClick={onClose} />}
      <aside className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}>
        <button className="sidebar-close-btn" onClick={onClose} aria-label="Close menu">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        
        <div className="sidebar-profile-section">
          <div className="sidebar-avatar-wrapper">
            <div className="sidebar-avatar">
              {getUserInitials()}
            </div>
          </div>
          {userName && (
            <div className="sidebar-user-name">
              {userName}
              <span className={`sidebar-role-badge sidebar-role-${role}`}>
                {role === 'mr' ? 'MR' : role === 'manager' ? 'Manager' : 'Admin'}
              </span>
            </div>
          )}
          {userMobile && <div className="sidebar-user-mobile">{userMobile}</div>}
          {userEmail && <div className="sidebar-user-email">{userEmail}</div>}
        </div>

        <div className="sidebar-divider"></div>

        <nav className="sidebar-nav">
          {/* ── Common ── */}
          <button onClick={() => handleNavClick('home')} className={`sidebar-item ${currentPage === 'home' ? 'sidebar-item-active' : ''}`}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 12L5 10M5 10L12 3L19 10M5 10V20C5 20.5523 5.44772 21 6 21H9M19 10L21 12M19 10V20C19 20.5523 18.5523 21 18 21H15M9 21C9.55228 21 10 20.5523 10 20V16C10 15.4477 10.4477 15 11 15H13C13.5523 15 14 15.4477 14 16V20C14 20.5523 14.4477 21 15 21M9 21H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>{t('home')}</span>
          </button>

          {/* ── MR Field Work ── */}
          {isMR && (
            <>
              <div className="sidebar-divider"></div>
              <div className="sidebar-section-label">Field Work</div>

              <button onClick={() => handleNavClick('tour-plans')} className={`sidebar-item ${currentPage === 'tour-plans' ? 'sidebar-item-active' : ''}`}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M21 10C21 17 12 23 12 23C12 23 3 17 3 10C3 7.61305 3.94821 5.32387 5.63604 3.63604C7.32387 1.94821 9.61305 1 12 1C14.3869 1 16.6761 1.94821 18.364 3.63604C20.0518 5.32387 21 7.61305 21 10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 13C13.6569 13 15 11.6569 15 10C15 8.34315 13.6569 7 12 7C10.3431 7 9 8.34315 9 10C9 11.6569 10.3431 13 12 13Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>{t('tourPlans')}</span>
              </button>
              <button onClick={() => handleNavClick('my-dcrs')} className={`sidebar-item ${currentPage === 'my-dcrs' ? 'sidebar-item-active' : ''}`}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 5H7C5.89543 5 5 5.89543 5 7V19C5 20.1046 5.89543 21 7 21H17C18.1046 21 19 20.1046 19 19V7C19 5.89543 18.1046 5 17 5H15M9 5C9 6.10457 9.89543 7 11 7H13C14.1046 7 15 6.10457 15 5M9 5C9 3.89543 9.89543 3 11 3H13C14.1046 3 15 3.89543 15 5M12 12H15M12 16H15M9 12H9.01M9 16H9.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>My DCRs</span>
              </button>
              <button onClick={() => handleNavClick('edetailing')} className={`sidebar-item ${currentPage === 'edetailing' ? 'sidebar-item-active' : ''}`}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>{t('eDetailing')}</span>
              </button>
              <button onClick={() => handleNavClick('inventory')} className={`sidebar-item ${currentPage === 'inventory' ? 'sidebar-item-active' : ''}`}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M21 16V8C20.9996 7.64928 20.9071 7.30481 20.7315 7.00116C20.556 6.69751 20.3037 6.44536 20 6.27L13 2.27C12.696 2.09446 12.3511 2.00205 12 2.00205C11.6489 2.00205 11.304 2.09446 11 2.27L4 6.27C3.69626 6.44536 3.44398 6.69751 3.26846 7.00116C3.09294 7.30481 3.00036 7.64928 3 8V16C3.00036 16.3507 3.09294 16.6952 3.26846 16.9988C3.44398 17.3025 3.69626 17.5546 4 17.73L11 21.73C11.304 21.9055 11.6489 21.9979 12 21.9979C12.3511 21.9979 12.696 21.9055 13 21.73L20 17.73C20.3037 17.5546 20.556 17.3025 20.7315 16.9988C20.9071 16.6952 20.9996 16.3507 21 16Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M3.27002 6.96L12 12.01L20.73 6.96" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 22.08V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>{t('samples')}</span>
              </button>
              <button onClick={() => handleNavClick('enter-rcpa')} className={`sidebar-item ${currentPage === 'enter-rcpa' ? 'sidebar-item-active' : ''}`}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 18V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M9 15H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>{t('rcpa') || 'RCPA'}</span>
              </button>
              <button onClick={() => handleNavClick('order-booking')} className={`sidebar-item ${currentPage === 'order-booking' ? 'sidebar-item-active' : ''}`}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16 11V7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7V11M5 9H19L20 21H4L5 9Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M9 11V9C9 7.89543 9.89543 7 11 7H13C14.1046 7 15 7.89543 15 9V11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>{t('orderBooking')}</span>
              </button>
              <button onClick={() => handleNavClick('expense-claim')} className={`sidebar-item ${currentPage === 'expense-claim' ? 'sidebar-item-active' : ''}`}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M16 13H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M16 17H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M10 9H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>{t('expenseClaim') || 'Expense Claim'}</span>
              </button>
            </>
          )}

          {/* ── Manager / Admin: Team Management ── */}
          {isManagerOrAdmin && (
            <>
              <div className="sidebar-divider"></div>
              <div className="sidebar-section-label">Team Management</div>

              <button onClick={() => handleNavClick('mr-list')} className={`sidebar-item ${currentPage === 'mr-list' || currentPage === 'mr-detail' ? 'sidebar-item-active' : ''}`}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89318 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88M13 7C13 9.20914 11.2091 11 9 11C6.79086 11 5 9.20914 5 7C5 4.79086 6.79086 3 9 3C11.2091 3 13 4.79086 13 7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>MR List</span>
              </button>
              <button onClick={() => handleNavClick('tour-plan-requests')} className={`sidebar-item ${currentPage === 'tour-plan-requests' ? 'sidebar-item-active' : ''}`}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 5H7C5.89543 5 5 5.89543 5 7V19C5 20.1046 5.89543 21 7 21H17C18.1046 21 19 20.1046 19 19V7C19 5.89543 18.1046 5 17 5H15M9 5C9 6.10457 9.89543 7 11 7H13C14.1046 7 15 6.10457 15 5M9 5C9 3.89543 9.89543 3 11 3H13C14.1046 3 15 3.89543 15 5M12 12H15M12 16H15M9 12H9.01M9 16H9.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>Tour Plan Requests</span>
              </button>
              <button onClick={() => handleNavClick('sales-entry')} className={`sidebar-item ${currentPage === 'sales-entry' ? 'sidebar-item-active' : ''}`}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 1V23M17 5H9.5C8.57174 5 7.6815 5.36875 7.02513 6.02513C6.36875 6.6815 6 7.57174 6 8.5C6 9.42826 6.36875 10.3185 7.02513 10.9749C7.6815 11.6313 8.57174 12 9.5 12H14.5C15.4283 12 16.3185 12.3687 16.9749 13.0251C17.6313 13.6815 18 14.5717 18 15.5C18 16.4283 17.6313 17.3185 16.9749 17.9749C16.3185 18.6313 15.4283 19 14.5 19H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>Sales Entry</span>
              </button>
              <button onClick={() => handleNavClick('sales-targets')} className={`sidebar-item ${currentPage === 'sales-targets' ? 'sidebar-item-active' : ''}`}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                  <circle cx="12" cy="12" r="6" stroke="currentColor" strokeWidth="2"/>
                  <circle cx="12" cy="12" r="2" stroke="currentColor" strokeWidth="2"/>
                </svg>
                <span>Sales Targets</span>
              </button>
              <button onClick={() => handleNavClick('manager-insights')} className={`sidebar-item ${currentPage === 'manager-insights' ? 'sidebar-item-active' : ''}`}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>Manager Insights</span>
              </button>
              <button onClick={() => handleNavClick('leaves')} className={`sidebar-item ${currentPage === 'leaves' ? 'sidebar-item-active' : ''}`}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M8 7V3M16 7V3M7 11H17M5 21H19C20.1046 21 21 20.1046 21 19V7C21 5.89543 20.1046 5 19 5H5C3.89543 5 3 5.89543 3 7V19C3 20.1046 3.89543 21 5 21Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>{t('leaves')}</span>
              </button>
            </>
          )}

          {/* ── Common: Customers & Reports ── */}
          <div className="sidebar-divider"></div>
          <div className="sidebar-section-label">Insights</div>

          <button onClick={() => handleNavClick('clients')} className={`sidebar-item ${currentPage === 'clients' ? 'sidebar-item-active' : ''}`}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89318 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88M13 7C13 9.20914 11.2091 11 9 11C6.79086 11 5 9.20914 5 7C5 4.79086 6.79086 3 9 3C11.2091 3 13 4.79086 13 7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>My Customers</span>
          </button>
          <button onClick={() => handleNavClick('sales-dashboard')} className={`sidebar-item ${currentPage === 'sales-dashboard' ? 'sidebar-item-active' : ''}`}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 20V10M12 20V4M6 20V14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>Sales Dashboard</span>
          </button>
          <button onClick={() => handleNavClick('territory-gap')} className={`sidebar-item ${currentPage === 'territory-gap' ? 'sidebar-item-active' : ''}`}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>Visit Coverage</span>
          </button>
          <button onClick={() => handleNavClick('reports')} className={`sidebar-item ${currentPage === 'reports' ? 'sidebar-item-active' : ''}`}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M16 13H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M16 17H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M10 9H9H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>{t('reports')}</span>
          </button>

          {/* ── Smart Actions ── */}
          <div className="sidebar-divider"></div>
          <div className="sidebar-section-label">Smart Actions</div>

          {isMR && (
            <>
              <button onClick={() => handleNavClick('nba')} className={`sidebar-item ${currentPage === 'nba' ? 'sidebar-item-active' : ''}`}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>Today's Plan</span>
              </button>
              <button onClick={() => handleNavClick('follow-up-tasks')} className={`sidebar-item ${currentPage === 'follow-up-tasks' ? 'sidebar-item-active' : ''}`}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 11L12 14L22 4M21 12V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V5C3 3.89543 3.89543 3 5 3H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>Follow-up Tasks</span>
              </button>
            </>
          )}

          {isManagerOrAdmin && (
            <>
              <button onClick={() => handleNavClick('adverse-events')} className={`sidebar-item ${currentPage === 'adverse-events' ? 'sidebar-item-active' : ''}`}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>Drug Safety</span>
              </button>
              <button onClick={() => handleNavClick('knowledge-upload')} className={`sidebar-item ${currentPage === 'knowledge-upload' ? 'sidebar-item-active' : ''}`}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4 19.5A2.5 2.5 0 016.5 17H20M4 19.5A2.5 2.5 0 014 17V5a2 2 0 012-2h10l6 6v8a2 2 0 01-2 2H6.5A2.5 2.5 0 014 19.5zM14 3v6h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>Knowledge Base</span>
              </button>
              <button onClick={() => handleNavClick('content-library')} className={`sidebar-item ${currentPage === 'content-library' ? 'sidebar-item-active' : ''}`}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2 3H8C9.06087 3 10.0783 3.42143 10.8284 4.17157C11.5786 4.92172 12 5.93913 12 7V21C12 20.2044 11.6839 19.4413 11.1213 18.8787C10.5587 18.3161 9.79565 18 9 18H2V3Z M22 3H16C14.9391 3 13.9217 3.42143 13.1716 4.17157C12.4214 4.92172 12 5.93913 12 7V21C12 20.2044 12.3161 19.4413 12.8787 18.8787C13.4413 18.3161 14.2044 18 15 18H22V3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>Content Library</span>
              </button>
              {isAdmin && (
                <button onClick={() => handleNavClick('mlr-queue')} className={`sidebar-item ${currentPage === 'mlr-queue' ? 'sidebar-item-active' : ''}`}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span>MLR Queue (Admin)</span>
                </button>
              )}
            </>
          )}

          {/* ── Compliance (admin/manager) — Phase C.1 ── */}
          {isManagerOrAdmin && (
            <>
              <div className="sidebar-divider"></div>
              <div className="sidebar-section-label">Compliance</div>
              <button onClick={() => handleNavClick('compliance-inbox')} className={`sidebar-item ${currentPage === 'compliance-inbox' ? 'sidebar-item-active' : ''}`}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 9V13M12 17H12.01M10.29 3.86L1.82 18A2 2 0 003.53 21H20.47A2 2 0 0022.18 18L13.71 3.86A2 2 0 0010.29 3.86Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>Compliance Inbox</span>
              </button>
              <button onClick={() => handleNavClick('consent-register')} className={`sidebar-item ${currentPage === 'consent-register' ? 'sidebar-item-active' : ''}`}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 12L11 14L15 10M21 12C21 16.97 16.97 21 12 21C7.03 21 3 16.97 3 12C3 7.03 7.03 3 12 3C16.97 3 21 7.03 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>Consent Register</span>
              </button>
              <button onClick={() => handleNavClick('regulatory-docs')} className={`sidebar-item ${currentPage === 'regulatory-docs' ? 'sidebar-item-active' : ''}`}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M14 2H6C4.89 2 4 2.9 4 4V20C4 21.1 4.89 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>Regulatory Docs</span>
              </button>
              {isAdmin && (
                <button onClick={() => handleNavClick('audit-log')} className={`sidebar-item ${currentPage === 'audit-log' ? 'sidebar-item-active' : ''}`}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 5H7C5.89 5 5 5.89 5 7V19C5 20.1 5.89 21 7 21H17C18.1 21 19 20.1 19 19V7C19 5.89 18.1 5 17 5H15M9 5C9 6.1 9.89 7 11 7H13C14.1 7 15 6.1 15 5M9 5C9 3.89 9.89 3 11 3H13C14.1 3 15 3.89 15 5M9 12H15M9 16H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span>Audit Log</span>
                </button>
              )}
            </>
          )}

          {/* ── HCP Master Data (admin/manager) — Phase C.3 ── */}
          {isManagerOrAdmin && (
            <>
              <div className="sidebar-divider"></div>
              <div className="sidebar-section-label">HCP Master Data</div>
              <button onClick={() => handleNavClick('institutions')} className={`sidebar-item ${currentPage === 'institutions' ? 'sidebar-item-active' : ''}`}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 21H21M5 21V7L13 3V21M19 21V11L13 7M9 9H9.01M9 12H9.01M9 15H9.01M9 18H9.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>Institutions</span>
              </button>
              <button onClick={() => handleNavClick('hcp-data-quality')} className={`sidebar-item ${currentPage === 'hcp-data-quality' ? 'sidebar-item-active' : ''}`}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 8V12L14.5 14.5M21 12C21 16.97 16.97 21 12 21C7.03 21 3 16.97 3 12C3 7.03 7.03 3 12 3C16.97 3 21 7.03 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>HCP Data Quality</span>
              </button>
            </>
          )}

          {/* ── MLR Reviewers (medical/legal/regulatory) ── */}
          {isReviewer && (
            <>
              <div className="sidebar-divider"></div>
              <div className="sidebar-section-label">MLR Review</div>
              <button onClick={() => handleNavClick('mlr-queue')} className={`sidebar-item ${currentPage === 'mlr-queue' ? 'sidebar-item-active' : ''}`}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>Review Queue</span>
              </button>
            </>
          )}

          {/* ── Account ── */}
          <div className="sidebar-divider"></div>

          <button onClick={() => handleNavClick('profile')} className={`sidebar-item ${currentPage === 'profile' ? 'sidebar-item-active' : ''}`}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M16 21V19C16 17.9391 15.5786 16.9217 14.8284 16.1716C14.0783 15.4214 13.0609 15 12 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13M18 10C18 12.2091 16.2091 14 14 14C11.7909 14 10 12.2091 10 10C10 7.79086 11.7909 6 14 6C16.2091 6 18 7.79086 18 10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>{t('profile')}</span>
          </button>
          {onLogout && (
            <button onClick={() => { onLogout(); onClose(); }} className="sidebar-item sidebar-logout">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9M16 17L21 12M21 12L16 7M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>{t('logout')}</span>
            </button>
          )}
        </nav>
      </aside>
    </>
  )
}

export default Sidebar

