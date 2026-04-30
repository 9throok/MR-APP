import { useState, useEffect } from 'react'
import SplashScreen from './components/SplashScreen'
import Login from './components/Login'
import Home from './components/Home'
import Clients from './components/Clients'
import TourPlans from './components/TourPlans'
import EDetailing from './components/EDetailing'
import Leaves from './components/Leaves'
import Samples from './components/Samples'
import Profile from './components/Profile'
import Reports from './components/Reports'
// TodaysPlan removed — replaced by NextBestAction (NBA) page
import DCR from './components/DCR'
import Doctor360 from './components/Doctor360'
import ExpenseClaim from './components/ExpenseClaim'
import CreateExpenseClaim from './components/CreateExpenseClaim'
import OfflineRequests from './components/OfflineRequests'
import EnterRcpa from './components/EnterRcpa'
import OrderBooking from './components/OrderBooking'
import TourPlanRequests from './components/TourPlanRequests'
import MRList from './components/MRList'
import MRDetail from './components/MRDetail'
import MyDCRs from './components/MyDCRs'
import TerritoryGap from './components/TerritoryGap'
import ManagerInsights from './components/ManagerInsights'
import Chatbot from './components/Chatbot'
import FollowUpTasks from './components/FollowUpTasks'
import KnowledgeUpload from './components/KnowledgeUpload'
import AdverseEvents from './components/AdverseEvents'
import NextBestAction from './components/NextBestAction'
// DoctorManagement merged into Clients (My Customers)
import SalesEntry from './components/SalesEntry'
import SalesTargets from './components/SalesTargets'
import SalesDashboard from './components/SalesDashboard'
import ContentLibrary from './components/ContentLibrary'
import MLRReviewQueue from './components/MLRReviewQueue'
import AuditLog from './components/AuditLog'
import ConsentRegister from './components/ConsentRegister'
import RegulatoryDocs from './components/RegulatoryDocs'
import ComplianceInbox from './components/ComplianceInbox'
import Institutions from './components/Institutions'
import HCPDataQuality from './components/HCPDataQuality'
import MedicalQueries from './components/MedicalQueries'
import KOLDashboard from './components/KOLDashboard'
import MedicalEngagements from './components/MedicalEngagements'
import OfflineIndicator from './components/OfflineIndicator'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import './App.css'

type Page = 'home' | 'clients' | 'tour-plans' | 'edetailing' | 'leaves' | 'inventory' | 'profile' | 'reports' | 'todays-plan' | 'dcr' | 'doctor360' | 'expense-claim' | 'create-expense-claim' | 'offline-requests' | 'enter-rcpa' | 'order-booking' | 'tour-plan-requests' | 'mr-list' | 'mr-detail' | 'my-dcrs' | 'territory-gap' | 'manager-insights' | 'follow-up-tasks' | 'knowledge-upload' | 'adverse-events' | 'nba' | 'doctor-management' | 'sales-entry' | 'sales-targets' | 'sales-dashboard' | 'content-library' | 'mlr-queue' | 'audit-log' | 'consent-register' | 'regulatory-docs' | 'compliance-inbox' | 'institutions' | 'hcp-data-quality' | 'medical-queries' | 'kol-dashboard' | 'medical-engagements'

const ALL_PAGES: string[] = ['home', 'clients', 'tour-plans', 'edetailing', 'leaves', 'inventory', 'profile', 'reports', 'todays-plan', 'dcr', 'doctor360', 'expense-claim', 'create-expense-claim', 'offline-requests', 'enter-rcpa', 'order-booking', 'tour-plan-requests', 'mr-list', 'mr-detail', 'my-dcrs', 'territory-gap', 'manager-insights', 'follow-up-tasks', 'knowledge-upload', 'adverse-events', 'nba', 'doctor-management', 'sales-entry', 'sales-targets', 'sales-dashboard', 'content-library', 'mlr-queue', 'audit-log', 'consent-register', 'regulatory-docs', 'compliance-inbox', 'institutions', 'hcp-data-quality', 'medical-queries', 'kol-dashboard', 'medical-engagements']

function AppContent() {
  const { isAuthenticated, user, logout: authLogout, isLoading } = useAuth()
  const [showSplash, setShowSplash] = useState(true)
  const [splashComplete, setSplashComplete] = useState(false)

  const getPageFromURL = (): Page => {
    let path = window.location.pathname.replace(/^\//, '').replace(/\/$/, '')
    // Support /app prefix: /app/clients → clients, /app → home
    if (path.startsWith('app/')) path = path.slice(4)
    else if (path === 'app') path = ''
    if (path && ALL_PAGES.includes(path)) return path as Page
    return 'home'
  }

  const [currentPage, setCurrentPage] = useState<Page>(getPageFromURL)

  const userName = user?.name || (() => {
    try {
      return localStorage.getItem('userName') || 'Robert'
    } catch { return 'Robert' }
  })()

  const userEmail = user?.email || (() => {
    try {
      return localStorage.getItem('userEmail') || 'robert.johnson@zenrac.com'
    } catch { return 'robert.johnson@zenrac.com' }
  })()

  const userMobile = (() => {
    try {
      return localStorage.getItem('userMobile') || '+91 98765 43210'
    } catch { return '+91 98765 43210' }
  })()

  // Sync URL with current page — app lives under /app
  useEffect(() => {
    const urlPath = currentPage === 'home' ? '/app' : `/app/${currentPage}`
    if (window.location.pathname !== urlPath) {
      window.history.pushState({ page: currentPage }, '', urlPath)
    }
  }, [currentPage])

  // Handle browser back/forward
  useEffect(() => {
    const onPopState = () => {
      setCurrentPage(getPageFromURL())
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  // Persist authentication state to localStorage (for splash screen)
  useEffect(() => {
    if (splashComplete) {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          localStorage.setItem('isAuthenticated', String(isAuthenticated))
        }
      } catch (error) {
        console.error('Error writing to localStorage:', error)
      }
    }
  }, [isAuthenticated, splashComplete])

  const handleLogin = () => {
    setCurrentPage('home')
  }

  const handleLogout = () => {
    authLogout()
    setCurrentPage('home')
  }

  const handleNavigate = (page: string) => {
    if (ALL_PAGES.includes(page)) {
      if (page === 'doctor360' || page === 'enter-rcpa' || page === 'edetailing' || page === 'dcr' || page === 'mr-detail') {
        try {
          if (typeof window !== 'undefined' && window.sessionStorage) {
            sessionStorage.setItem('previousPage', currentPage)
          }
        } catch (error) {
          console.error('Error storing previous page:', error)
        }
      }
      setCurrentPage(page as Page)
    }
  }

  const handleBack = () => {
    if (window.history.length > 1) {
      window.history.back()
    } else {
      setCurrentPage('home')
    }
  }

  if (showSplash) {
    return <SplashScreen onComplete={() => {
      setShowSplash(false)
      setSplashComplete(true)
    }} />
  }

  if (isLoading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Loading...</div>
  }

  return (
    <>
      {isAuthenticated ? (
        <>
          {currentPage === 'clients' ? (
            <Clients onLogout={handleLogout} onBack={handleBack} userName={userName} onNavigate={handleNavigate} />
          ) : currentPage === 'tour-plans' ? (
            <TourPlans onLogout={handleLogout} onBack={handleBack} userName={userName} onNavigate={handleNavigate} />
          ) : currentPage === 'edetailing' ? (
            <EDetailing onLogout={handleLogout} onBack={handleBack} userName={userName} onNavigate={handleNavigate} />
          ) : currentPage === 'leaves' ? (
            <Leaves onLogout={handleLogout} onBack={handleBack} userName={userName} onNavigate={handleNavigate} />
          ) : currentPage === 'inventory' ? (
            <Samples onLogout={handleLogout} onBack={handleBack} userName={userName} onNavigate={handleNavigate} />
          ) : currentPage === 'profile' ? (
            <Profile onLogout={handleLogout} onBack={handleBack} userName={userName} onNavigate={handleNavigate} />
          ) : currentPage === 'reports' ? (
            <Reports onLogout={handleLogout} onBack={handleBack} userName={userName} onNavigate={handleNavigate} />
          ) : currentPage === 'todays-plan' ? (
            <NextBestAction onLogout={handleLogout} onBack={handleBack} userName={userName} onNavigate={handleNavigate} />
          ) : currentPage === 'dcr' ? (
            <DCR onLogout={handleLogout} onBack={handleBack} userName={userName} onNavigate={handleNavigate} />
          ) : currentPage === 'doctor360' ? (
            <Doctor360 onLogout={handleLogout} onBack={handleBack} userName={userName} onNavigate={handleNavigate} />
          ) : currentPage === 'expense-claim' ? (
            <ExpenseClaim onLogout={handleLogout} onBack={handleBack} userName={userName} onNavigate={handleNavigate} />
          ) : currentPage === 'create-expense-claim' ? (
            <CreateExpenseClaim onLogout={handleLogout} onBack={handleBack} userName={userName} onNavigate={handleNavigate} />
          ) : currentPage === 'offline-requests' ? (
            <OfflineRequests onLogout={handleLogout} onBack={handleBack} userName={userName} onNavigate={handleNavigate} />
          ) : currentPage === 'enter-rcpa' ? (
            <EnterRcpa onLogout={handleLogout} onBack={handleBack} userName={userName} onNavigate={handleNavigate} />
          ) : currentPage === 'order-booking' ? (
            <OrderBooking onLogout={handleLogout} onBack={handleBack} userName={userName} onNavigate={handleNavigate} />
          ) : currentPage === 'tour-plan-requests' ? (
            <TourPlanRequests onLogout={handleLogout} onBack={handleBack} userName={userName} onNavigate={handleNavigate} />
          ) : currentPage === 'mr-list' ? (
            <MRList onLogout={handleLogout} onBack={handleBack} userName={userName} onNavigate={handleNavigate} />
          ) : currentPage === 'mr-detail' ? (
            <MRDetail onLogout={handleLogout} onBack={() => handleNavigate('mr-list')} userName={userName} onNavigate={handleNavigate} />
          ) : currentPage === 'my-dcrs' ? (
            <MyDCRs onLogout={handleLogout} onBack={handleBack} userName={userName} onNavigate={handleNavigate} />
          ) : currentPage === 'territory-gap' ? (
            <TerritoryGap onLogout={handleLogout} onBack={handleBack} userName={userName} onNavigate={handleNavigate} />
          ) : currentPage === 'manager-insights' ? (
            <ManagerInsights onLogout={handleLogout} onBack={handleBack} userName={userName} onNavigate={handleNavigate} />
          ) : currentPage === 'follow-up-tasks' ? (
            <FollowUpTasks onLogout={handleLogout} onBack={handleBack} userName={userName} onNavigate={handleNavigate} />
          ) : currentPage === 'knowledge-upload' ? (
            <KnowledgeUpload onLogout={handleLogout} onBack={handleBack} userName={userName} onNavigate={handleNavigate} />
          ) : currentPage === 'adverse-events' ? (
            <AdverseEvents onLogout={handleLogout} onBack={handleBack} userName={userName} onNavigate={handleNavigate} />
          ) : currentPage === 'nba' ? (
            <NextBestAction onLogout={handleLogout} onBack={handleBack} userName={userName} onNavigate={handleNavigate} />
          ) : currentPage === 'doctor-management' ? (
            <Clients onLogout={handleLogout} onBack={handleBack} userName={userName} onNavigate={handleNavigate} />
          ) : currentPage === 'sales-entry' ? (
            <SalesEntry onLogout={handleLogout} onBack={handleBack} userName={userName} userEmail={userEmail} userMobile={userMobile} onNavigate={handleNavigate} />
          ) : currentPage === 'sales-targets' ? (
            <SalesTargets onLogout={handleLogout} onBack={handleBack} userName={userName} userEmail={userEmail} userMobile={userMobile} onNavigate={handleNavigate} />
          ) : currentPage === 'sales-dashboard' ? (
            <SalesDashboard onLogout={handleLogout} onBack={handleBack} userName={userName} userEmail={userEmail} userMobile={userMobile} onNavigate={handleNavigate} />
          ) : currentPage === 'content-library' ? (
            <ContentLibrary onLogout={handleLogout} onBack={handleBack} userName={userName} onNavigate={handleNavigate} />
          ) : currentPage === 'mlr-queue' ? (
            <MLRReviewQueue onLogout={handleLogout} onBack={handleBack} userName={userName} onNavigate={handleNavigate} />
          ) : currentPage === 'audit-log' ? (
            <AuditLog onLogout={handleLogout} onBack={handleBack} userName={userName} onNavigate={handleNavigate} />
          ) : currentPage === 'consent-register' ? (
            <ConsentRegister onLogout={handleLogout} onBack={handleBack} userName={userName} onNavigate={handleNavigate} />
          ) : currentPage === 'regulatory-docs' ? (
            <RegulatoryDocs onLogout={handleLogout} onBack={handleBack} userName={userName} onNavigate={handleNavigate} />
          ) : currentPage === 'compliance-inbox' ? (
            <ComplianceInbox onLogout={handleLogout} onBack={handleBack} userName={userName} onNavigate={handleNavigate} />
          ) : currentPage === 'institutions' ? (
            <Institutions onLogout={handleLogout} onBack={handleBack} userName={userName} onNavigate={handleNavigate} />
          ) : currentPage === 'hcp-data-quality' ? (
            <HCPDataQuality onLogout={handleLogout} onBack={handleBack} userName={userName} onNavigate={handleNavigate} />
          ) : currentPage === 'medical-queries' ? (
            <MedicalQueries onLogout={handleLogout} onBack={handleBack} userName={userName} onNavigate={handleNavigate} />
          ) : currentPage === 'kol-dashboard' ? (
            <KOLDashboard onLogout={handleLogout} onBack={handleBack} userName={userName} onNavigate={handleNavigate} />
          ) : currentPage === 'medical-engagements' ? (
            <MedicalEngagements onLogout={handleLogout} onBack={handleBack} userName={userName} onNavigate={handleNavigate} />
          ) : (
            <Home onLogout={handleLogout} onNavigate={handleNavigate} userName={userName} userEmail={userEmail} userMobile={userMobile} />
          )}
          <Chatbot />
        </>
      ) : (
        <Login onLogin={handleLogin} />
      )}
    </>
  )
}

function App() {
  // Redirect bare "/" to landing page (served as static HTML)
  if (window.location.pathname === '/' || window.location.pathname === '') {
    window.location.replace('/landing.html')
    return null
  }

  return (
    <AuthProvider>
      <AppContent />
      <OfflineIndicator />
    </AuthProvider>
  )
}

export default App
