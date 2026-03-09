import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { ReactNode } from 'react'

export type Page = 'home' | 'clients' | 'tour-plans' | 'edetailing' | 'leaves' | 'inventory' | 'profile' | 'reports' | 'todays-plan' | 'dcr' | 'doctor360' | 'expense-claim' | 'create-expense-claim' | 'offline-requests' | 'enter-rcpa' | 'order-booking' | 'tour-plan-requests' | 'mr-list' | 'mr-detail' | 'my-dcrs' | 'territory-gap' | 'manager-insights' | 'follow-up-tasks' | 'knowledge-upload' | 'adverse-events' | 'nba' | 'doctor-management'

export const ALL_PAGES: Page[] = ['home', 'clients', 'tour-plans', 'edetailing', 'leaves', 'inventory', 'profile', 'reports', 'todays-plan', 'dcr', 'doctor360', 'expense-claim', 'create-expense-claim', 'offline-requests', 'enter-rcpa', 'order-booking', 'tour-plan-requests', 'mr-list', 'mr-detail', 'my-dcrs', 'territory-gap', 'manager-insights', 'follow-up-tasks', 'knowledge-upload', 'adverse-events', 'nba', 'doctor-management']

interface PageMeta {
  label: string
  parent?: Page
}

export const PAGE_META: Record<Page, PageMeta> = {
  home: { label: 'Home' },
  clients: { label: 'Customers', parent: 'home' },
  'tour-plans': { label: 'Tour Plans', parent: 'home' },
  edetailing: { label: 'E-Detailing', parent: 'home' },
  leaves: { label: 'Leaves', parent: 'home' },
  inventory: { label: 'Samples', parent: 'home' },
  profile: { label: 'Profile', parent: 'home' },
  reports: { label: 'Reports', parent: 'home' },
  'todays-plan': { label: "Today's Plan", parent: 'home' },
  dcr: { label: 'DCR', parent: 'todays-plan' },
  doctor360: { label: 'Doctor 360', parent: 'clients' },
  'expense-claim': { label: 'Expense Claims', parent: 'home' },
  'create-expense-claim': { label: 'New Expense Claim', parent: 'expense-claim' },
  'offline-requests': { label: 'Offline Requests', parent: 'home' },
  'enter-rcpa': { label: 'RCPA', parent: 'home' },
  'order-booking': { label: 'Order Booking', parent: 'home' },
  'tour-plan-requests': { label: 'Tour Plan Requests', parent: 'home' },
  'mr-list': { label: 'MR List', parent: 'home' },
  'mr-detail': { label: 'MR Detail', parent: 'mr-list' },
  'my-dcrs': { label: 'My DCRs', parent: 'home' },
  'territory-gap': { label: 'Territory Gap', parent: 'home' },
  'manager-insights': { label: 'Manager Insights', parent: 'home' },
  'follow-up-tasks': { label: 'Follow-up Tasks', parent: 'home' },
  'knowledge-upload': { label: 'Knowledge Base', parent: 'home' },
  'adverse-events': { label: 'Adverse Events', parent: 'home' },
  nba: { label: 'AI Plan', parent: 'home' },
  'doctor-management': { label: 'Doctors', parent: 'home' },
}

interface Breadcrumb {
  label: string
  page: Page
}

interface NavigationContextType {
  currentPage: Page
  navigateTo: (page: string) => void
  goBack: () => void
  previousPage: Page | null
  breadcrumbs: Breadcrumb[]
}

const NavigationContext = createContext<NavigationContextType | null>(null)

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [currentPage, setCurrentPage] = useState<Page>(() => {
    try {
      const saved = localStorage.getItem('currentPage')
      if (saved && ALL_PAGES.includes(saved as Page)) {
        return saved as Page
      }
    } catch { /* ignore */ }
    return 'home'
  })

  const [previousPage, setPreviousPage] = useState<Page | null>(null)

  useEffect(() => {
    try {
      localStorage.setItem('currentPage', currentPage)
    } catch { /* ignore */ }
  }, [currentPage])

  const navigateTo = useCallback((page: string) => {
    if (ALL_PAGES.includes(page as Page)) {
      setPreviousPage(currentPage)
      setCurrentPage(page as Page)
    }
  }, [currentPage])

  const goBack = useCallback(() => {
    if (previousPage) {
      setCurrentPage(previousPage)
      setPreviousPage(null)
    } else {
      const parent = PAGE_META[currentPage]?.parent
      setCurrentPage(parent || 'home')
    }
  }, [previousPage, currentPage])

  const breadcrumbs: Breadcrumb[] = []
  let page: Page | undefined = currentPage
  while (page) {
    breadcrumbs.unshift({ label: PAGE_META[page].label, page })
    page = PAGE_META[page].parent
  }

  return (
    <NavigationContext.Provider value={{ currentPage, navigateTo, goBack, previousPage, breadcrumbs }}>
      {children}
    </NavigationContext.Provider>
  )
}

export function useNavigation() {
  const context = useContext(NavigationContext)
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider')
  }
  return context
}

export default NavigationContext
