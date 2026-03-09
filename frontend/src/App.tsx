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
import TodaysPlan from './components/TodaysPlan'
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
import DoctorManagement from './components/DoctorManagement'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import './App.css'

type Page = 'home' | 'clients' | 'tour-plans' | 'edetailing' | 'leaves' | 'inventory' | 'profile' | 'reports' | 'todays-plan' | 'dcr' | 'doctor360' | 'expense-claim' | 'create-expense-claim' | 'offline-requests' | 'enter-rcpa' | 'order-booking' | 'tour-plan-requests' | 'mr-list' | 'mr-detail' | 'my-dcrs' | 'territory-gap' | 'manager-insights' | 'follow-up-tasks' | 'knowledge-upload' | 'adverse-events' | 'nba' | 'doctor-management'

const ALL_PAGES: string[] = ['home', 'clients', 'tour-plans', 'edetailing', 'leaves', 'inventory', 'profile', 'reports', 'todays-plan', 'dcr', 'doctor360', 'expense-claim', 'create-expense-claim', 'offline-requests', 'enter-rcpa', 'order-booking', 'tour-plan-requests', 'mr-list', 'mr-detail', 'my-dcrs', 'territory-gap', 'manager-insights', 'follow-up-tasks', 'knowledge-upload', 'adverse-events', 'nba', 'doctor-management']

function AppContent() {
  const { isAuthenticated, user, logout: authLogout, isLoading } = useAuth()
  const [showSplash, setShowSplash] = useState(true)
  const [splashComplete, setSplashComplete] = useState(false)

  const [currentPage, setCurrentPage] = useState<Page>(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const saved = localStorage.getItem('currentPage')
        if (saved && ALL_PAGES.includes(saved)) {
          return saved as Page
        }
      }
    } catch (error) {
      console.error('Error reading from localStorage:', error)
    }
    return 'home'
  })

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

  // Persist current page to localStorage
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('currentPage', currentPage)
      }
    } catch (error) {
      console.error('Error writing to localStorage:', error)
    }
  }, [currentPage])

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
    setCurrentPage('home')
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
            <TodaysPlan onLogout={handleLogout} onBack={handleBack} userName={userName} onNavigate={handleNavigate} />
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
            <DoctorManagement onLogout={handleLogout} onBack={handleBack} userName={userName} onNavigate={handleNavigate} />
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
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App
