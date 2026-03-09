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
import './App.css'

type Page = 'home' | 'clients' | 'tour-plans' | 'edetailing' | 'leaves' | 'inventory' | 'profile' | 'reports' | 'todays-plan' | 'dcr' | 'doctor360' | 'expense-claim' | 'create-expense-claim' | 'offline-requests' | 'enter-rcpa' | 'order-booking' | 'tour-plan-requests' | 'mr-list' | 'mr-detail' | 'my-dcrs' | 'territory-gap' | 'manager-insights'

function App() {
  const [showSplash, setShowSplash] = useState(true)
  const [splashComplete, setSplashComplete] = useState(false)

  // Restore authentication state from localStorage
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const saved = localStorage.getItem('isAuthenticated')
        return saved === 'true'
      }
    } catch (error) {
      console.error('Error reading authentication state from localStorage:', error)
    }
    return false
  })
  const [currentPage, setCurrentPage] = useState<Page>(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const saved = localStorage.getItem('currentPage')
        if (saved && ['home', 'clients', 'tour-plans', 'edetailing', 'leaves', 'inventory', 'profile', 'reports', 'todays-plan', 'dcr', 'doctor360', 'expense-claim', 'create-expense-claim', 'offline-requests', 'enter-rcpa', 'order-booking', 'tour-plan-requests', 'mr-list', 'mr-detail', 'my-dcrs', 'territory-gap', 'manager-insights'].includes(saved)) {
          return saved as Page
        }
      }
    } catch (error) {
      console.error('Error reading from localStorage:', error)
    }
    return 'home'
  })
  const [userName] = useState<string>(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const saved = localStorage.getItem('userName')
        return saved || 'Robert'
      }
    } catch (error) {
      console.error('Error reading from localStorage:', error)
    }
    return 'Robert'
  })
  const [userEmail] = useState<string>(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const saved = localStorage.getItem('userEmail')
        return saved || 'robert.johnson@zenrac.com'
      }
    } catch (error) {
      console.error('Error reading from localStorage:', error)
    }
    return 'robert.johnson@zenrac.com'
  })
  const [userMobile] = useState<string>(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const saved = localStorage.getItem('userMobile')
        return saved || '+91 98765 43210'
      }
    } catch (error) {
      console.error('Error reading from localStorage:', error)
    }
    return '+91 98765 43210'
  })

  // Persist authentication state to localStorage
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

  // Persist user name to localStorage
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('userName', userName)
      }
    } catch (error) {
      console.error('Error writing to localStorage:', error)
    }
  }, [userName])

  const handleLogin = () => {
    setIsAuthenticated(true)
    setCurrentPage('home')
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    setCurrentPage('home')
    // Clear authentication data from localStorage
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.removeItem('isAuthenticated')
        localStorage.removeItem('currentPage')
      }
    } catch (error) {
      console.error('Error clearing localStorage:', error)
    }
  }

  const handleNavigate = (page: string) => {
    if (['home', 'clients', 'tour-plans', 'edetailing', 'leaves', 'inventory', 'profile', 'reports', 'todays-plan', 'dcr', 'doctor360', 'expense-claim', 'create-expense-claim', 'offline-requests', 'enter-rcpa', 'order-booking', 'tour-plan-requests', 'mr-list', 'mr-detail', 'my-dcrs', 'territory-gap', 'manager-insights'].includes(page)) {
      // Store previous page before navigating (especially for Doctor360, EnterRcpa, EDetailing, DCR, and MR Detail which are detail pages)
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

export default App
