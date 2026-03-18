import { useState, useEffect } from 'react'
import { apiGet } from '../services/apiService'
import { useLanguage } from '../contexts/LanguageContext'
import './TodaysPlanBanner.css'

interface TodaysPlanBannerProps {
  onNavigate?: () => void
}

interface BannerRec {
  doctor: string
  type?: string
  best_time?: string
}

function TodaysPlanBanner({ onNavigate }: TodaysPlanBannerProps) {
  const { t } = useLanguage()
  const [totalPlans, setTotalPlans] = useState(0)
  const [doctorCount, setDoctorCount] = useState(0)
  const [pharmacyCount, setPharmacyCount] = useState(0)
  const [nextVisitName, setNextVisitName] = useState('')
  const [nextVisitTime, setNextVisitTime] = useState('')
  const [loaded, setLoaded] = useState(false)

  const userId = localStorage.getItem('userId') || 'mr_robert_003'

  useEffect(() => {
    const fetchBannerData = async () => {
      try {
        const data = await apiGet(`/ai/nba/${userId}`)
        const recs: BannerRec[] = data.recommendations?.recommendations || data.recommendations || []
        if (!Array.isArray(recs)) return

        setTotalPlans(recs.length)
        setDoctorCount(recs.filter(r => (r.type || 'doctor') === 'doctor').length)
        setPharmacyCount(recs.filter(r => r.type === 'pharmacy').length)

        // Find next upcoming visit by best_time
        const now = new Date()
        const currentMinutes = now.getHours() * 60 + now.getMinutes()

        const getMinutes = (timeStr: string): number => {
          const [time, period] = timeStr.split(' ')
          const [h, m] = time.split(':').map(Number)
          let mins = h * 60 + m
          if (period === 'PM' && h !== 12) mins += 720
          if (period === 'AM' && h === 12) mins -= 720
          return mins
        }

        const upcoming = recs
          .filter(r => r.best_time && getMinutes(r.best_time) >= currentMinutes)
          .sort((a, b) => getMinutes(a.best_time!) - getMinutes(b.best_time!))

        if (upcoming.length > 0) {
          setNextVisitName(upcoming[0].doctor)
          setNextVisitTime(upcoming[0].best_time!)
        }

        setLoaded(true)
      } catch {
        // If API fails, show the banner without stats
        setLoaded(true)
      }
    }

    fetchBannerData()
  }, [userId])

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
          {loaded && totalPlans > 0 ? (
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
              {nextVisitName && (
                <>
                  <div className="banner-stat-divider"></div>
                  <div className="banner-stat-item next-visit">
                    <span className="stat-value">{nextVisitTime}</span>
                    <span className="stat-label">Next: {nextVisitName}</span>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="banner-stats">
              <div className="banner-stat-item">
                <span className="stat-label">{loaded ? 'No visits scheduled' : 'Loading...'}</span>
              </div>
            </div>
          )}
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
