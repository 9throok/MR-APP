import { useLanguage } from '../contexts/LanguageContext'
import { BTN_PRIMARY } from '../styles/designSystem'

interface TodaysPlanBannerProps {
  onNavigate?: () => void
}

const todaysPlans = [
  { id: 1, name: 'Dr. Anil Doshi', type: 'doctor', specialization: 'Cardiologist', scheduledTime: '10:00 AM' },
  { id: 2, name: 'Dr. Navin Chaddha', type: 'doctor', specialization: 'Neurologist', scheduledTime: '11:30 AM' },
  { id: 3, name: 'MedPlus Pharmacy', type: 'pharmacy', scheduledTime: '2:00 PM' },
  { id: 4, name: 'Dr. Surbhi Rel', type: 'doctor', specialization: 'Gynecologist', scheduledTime: '3:30 PM' },
  { id: 5, name: 'Apollo Pharmacy', type: 'pharmacy', scheduledTime: '4:00 PM' },
  { id: 6, name: 'Dr. Naresh Patil', type: 'doctor', specialization: 'Neurologist', scheduledTime: '5:00 PM' },
]

function TodaysPlanBanner({ onNavigate }: TodaysPlanBannerProps) {
  const { t } = useLanguage()

  const totalPlans = todaysPlans.length
  const doctorCount = todaysPlans.filter(p => p.type === 'doctor').length
  const pharmacyCount = todaysPlans.filter(p => p.type === 'pharmacy').length

  const now = new Date()
  const currentTime = now.getHours() * 60 + now.getMinutes()

  const getTimeInMinutes = (timeString: string): number => {
    const [time, period] = timeString.split(' ')
    const [hours, minutes] = time.split(':').map(Number)
    let totalMinutes = hours * 60 + minutes
    if (period === 'PM' && hours !== 12) totalMinutes += 12 * 60
    if (period === 'AM' && hours === 12) totalMinutes -= 12 * 60
    return totalMinutes
  }

  const upcomingVisits = todaysPlans
    .filter(plan => getTimeInMinutes(plan.scheduledTime) >= currentTime)
    .sort((a, b) => getTimeInMinutes(a.scheduledTime) - getTimeInMinutes(b.scheduledTime))

  const nextVisit = upcomingVisits[0]

  return (
    <div
      className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 mb-6 cursor-pointer hover:shadow-md transition-shadow"
      onClick={onNavigate}
    >
      <div className="flex items-center gap-5">
        {/* Icon */}
        <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 7V3M16 7V3M7 11H17M5 21H19C20.1046 21 21 20.1046 21 19V7C21 5.89543 20.1046 5 19 5H5C3.89543 5 3 5.89543 3 7V19C3 20.1046 3.89543 21 5 21Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-semibold text-slate-900 mb-2">{t('todaysPlanTitle') || "Today's Plan"}</h2>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-bold text-slate-900">{totalPlans}</span>
              <span className="text-sm text-slate-500">Total Visits</span>
            </div>
            <div className="w-px h-6 bg-slate-200"></div>
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-bold text-indigo-600">{doctorCount}</span>
              <span className="text-sm text-slate-500">Doctors</span>
            </div>
            <div className="w-px h-6 bg-slate-200"></div>
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-bold text-emerald-600">{pharmacyCount}</span>
              <span className="text-sm text-slate-500">Pharmacies</span>
            </div>
            {nextVisit && (
              <>
                <div className="w-px h-6 bg-slate-200"></div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xl font-bold text-amber-600">{nextVisit.scheduledTime}</span>
                  <span className="text-sm text-slate-500 truncate">Next: {nextVisit.name}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* CTA */}
        <button
          className={`${BTN_PRIMARY} shrink-0`}
          onClick={(e) => { e.stopPropagation(); onNavigate?.() }}
        >
          <span>{t('viewTodaysPlan') || "View Today's Plan"}</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
  )
}

export default TodaysPlanBanner
