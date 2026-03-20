import { useState, useEffect } from 'react'
import { apiGet } from '../services/apiService'
import './ManagerPulseBanner.css'

interface ManagerPulseBannerProps {
  onNavigate?: (page: string) => void
}

function ManagerPulseBanner({ onNavigate }: ManagerPulseBannerProps) {
  const [teamCallsToday, setTeamCallsToday] = useState(0)
  const [pendingApprovals, setPendingApprovals] = useState(0)
  const [safetyAlerts, setSafetyAlerts] = useState(0)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const fetchPulse = async () => {
      try {
        const [dcrRes, drStats, aeStats] = await Promise.all([
          apiGet('/dcr'),
          apiGet('/doctor-requests/stats'),
          apiGet('/adverse-events/stats'),
        ])

        // Count today's DCRs across all MRs
        const today = new Date().toISOString().slice(0, 10)
        const dcrs = Array.isArray(dcrRes) ? dcrRes : dcrRes.data || []
        const todayCount = dcrs.filter((d: any) => d.date?.startsWith(today)).length
        setTeamCallsToday(todayCount)

        setPendingApprovals(drStats.stats?.pending || drStats.pending || 0)
        setSafetyAlerts(aeStats.stats?.pending || aeStats.pending || 0)
        setLoaded(true)
      } catch {
        setLoaded(true)
      }
    }

    fetchPulse()
  }, [])

  return (
    <div
      className="manager-pulse-banner"
      onClick={() => onNavigate?.('manager-insights')}
    >
      <div className="manager-pulse-banner-content">
        <div className="pulse-banner-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22 12H18L15 21L9 3L6 12H2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <div className="pulse-banner-text">
          <h2 className="pulse-banner-title">Team Pulse</h2>
          {loaded ? (
            <div className="pulse-banner-stats">
              <div className="pulse-stat-item">
                <span className="pulse-stat-value">{teamCallsToday}</span>
                <span className="pulse-stat-label">Calls Today</span>
              </div>
              <div className="pulse-stat-divider"></div>
              <div className="pulse-stat-item">
                <span className={`pulse-stat-value ${pendingApprovals > 0 ? 'has-items' : ''}`}>{pendingApprovals}</span>
                <span className="pulse-stat-label">Pending Approvals</span>
              </div>
              <div className="pulse-stat-divider"></div>
              <div className={`pulse-stat-item ${safetyAlerts > 0 ? 'alert-active' : ''}`}>
                <span className={`pulse-stat-value ${safetyAlerts > 0 ? 'has-alerts' : ''}`}>{safetyAlerts}</span>
                <span className="pulse-stat-label">Safety Alerts</span>
              </div>
            </div>
          ) : (
            <div className="pulse-banner-stats">
              <div className="pulse-stat-item">
                <span className="pulse-stat-label">Loading...</span>
              </div>
            </div>
          )}
        </div>
        <button
          className="pulse-banner-action-button"
          onClick={(e) => {
            e.stopPropagation()
            onNavigate?.('manager-insights')
          }}
        >
          <span>View Team Insights</span>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
  )
}

export default ManagerPulseBanner
