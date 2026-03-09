import { useLanguage } from '../contexts/LanguageContext'
import TodaysPlanBanner from './TodaysPlanBanner'
import Shortcuts from './Shortcuts'
import DashboardReports from './DashboardReports'
import { useNavigation } from '../contexts/NavigationContext'

interface HomeProps {
  onLogout: () => void
  onNavigate?: (page: string) => void
  userName: string
  userEmail?: string
  userMobile?: string
}

function Home({ userName }: HomeProps) {
  const { t } = useLanguage()
  const { navigateTo } = useNavigation()

  return (
    <div className="max-w-[1400px] mx-auto px-6 py-6">
      {/* Greeting */}
      <h1 className="text-2xl font-semibold text-slate-900 mb-6">
        {t('hello')} {userName},
      </h1>

      {/* Today's Plan Banner */}
      <TodaysPlanBanner onNavigate={() => navigateTo('todays-plan')} />

      {/* Quick Actions */}
      <Shortcuts onNavigate={navigateTo} />

      {/* Dashboard Reports */}
      <h2 className="text-lg font-semibold text-slate-800 mb-4 mt-8">Dashboards</h2>
      <DashboardReports />
    </div>
  )
}

export default Home
