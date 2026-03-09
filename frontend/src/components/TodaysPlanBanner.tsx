import './TodaysPlanBanner.css'
import { useLanguage } from '../contexts/LanguageContext'

interface TodaysPlanBannerProps {
  onNavigate?: () => void
}

// This should match the data structure from TodaysPlan component
const todaysPlans = [
  {
    id: 1,
    name: 'Dr. Anil Doshi',
    type: 'doctor',
    specialization: 'Cardiologist',
    scheduledTime: '10:00 AM',
  },
  {
    id: 2,
    name: 'Dr. Navin Chaddha',
    type: 'doctor',
    specialization: 'Neurologist',
    scheduledTime: '11:30 AM',
  },
  {
    id: 3,
    name: 'MedPlus Pharmacy',
    type: 'pharmacy',
    scheduledTime: '2:00 PM',
  },
  {
    id: 4,
    name: 'Dr. Surbhi Rel',
    type: 'doctor',
    specialization: 'Gynecologist',
    scheduledTime: '3:30 PM',
  },
  {
    id: 5,
    name: 'Apollo Pharmacy',
    type: 'pharmacy',
    scheduledTime: '4:00 PM',
  },
  {
    id: 6,
    name: 'Dr. Naresh Patil',
    type: 'doctor',
    specialization: 'Neurologist',
    scheduledTime: '5:00 PM',
  },
]

function TodaysPlanBanner({ onNavigate }: TodaysPlanBannerProps) {
  const { t } = useLanguage()

  const totalPlans = todaysPlans.length
  const doctorCount = todaysPlans.filter(p => p.type === 'doctor').length
  const pharmacyCount = todaysPlans.filter(p => p.type === 'pharmacy').length

  // Get the next scheduled visit
  const now = new Date()
  const currentTime = now.getHours() * 60 + now.getMinutes() // Convert to minutes for comparison

  const getTimeInMinutes = (timeString: string): number => {
    const [time, period] = timeString.split(' ')
    const [hours, minutes] = time.split(':').map(Number)
    let totalMinutes = hours * 60 + minutes
    if (period === 'PM' && hours !== 12) totalMinutes += 12 * 60
    if (period === 'AM' && hours === 12) totalMinutes -= 12 * 60
    return totalMinutes
  }

  const upcomingVisits = todaysPlans
    .filter(plan => {
      const planTime = getTimeInMinutes(plan.scheduledTime || '')
      return planTime >= currentTime
    })
    .sort((a, b) => {
      const timeA = getTimeInMinutes(a.scheduledTime || '')
      const timeB = getTimeInMinutes(b.scheduledTime || '')
      return timeA - timeB
    })

  const nextVisit = upcomingVisits[0]

  return (
    <div 
      className="todays-plan-banner"
      onClick={onNavigate}
    >
      <div className="todays-plan-banner-content">
        <div className="banner-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 7V3M16 7V3M7 11H17M5 21H19C20.1046 21 21 20.1046 21 19V7C21 5.89543 20.1046 5 19 5H5C3.89543 5 3 5.89543 3 7V19C3 20.1046 3.89543 21 5 21Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <div className="banner-text">
          <h2 className="banner-title">{t('todaysPlanTitle') || "Today's Plan"}</h2>
          <div className="banner-stats">
            <div className="banner-stat-item">
              <span className="stat-value">{totalPlans}</span>
              <span className="stat-label">Total Visits</span>
            </div>
            <div className="banner-stat-divider"></div>
            <div className="banner-stat-item">
              <span className="stat-value">{doctorCount}</span>
              <span className="stat-label">Doctors</span>
            </div>
            <div className="banner-stat-divider"></div>
            <div className="banner-stat-item">
              <span className="stat-value">{pharmacyCount}</span>
              <span className="stat-label">Pharmacies</span>
            </div>
            {nextVisit && (
              <>
                <div className="banner-stat-divider"></div>
                <div className="banner-stat-item next-visit">
                  <span className="stat-value">{nextVisit.scheduledTime}</span>
                  <span className="stat-label">Next: {nextVisit.name}</span>
                </div>
              </>
            )}
          </div>
        </div>
        <button 
          className="banner-action-button"
          onClick={(e) => {
            e.stopPropagation()
            if (onNavigate) {
              onNavigate()
            }
          }}
        >
          <span>{t('viewTodaysPlan') || 'View Today\'s Plan'}</span>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
  )
}

export default TodaysPlanBanner
