import { useState, useEffect } from 'react'
import Header from './Header'
import Sidebar from './Sidebar'
import { apiGet } from '../services/apiService'
import './NextBestAction.css'

interface NextBestActionProps {
  onLogout: () => void
  onBack: () => void
  userName: string
  onNavigate: (page: string) => void
}

interface Recommendation {
  rank: number
  doctor: string
  specialty?: string
  tier?: string
  priority: 'high' | 'medium' | 'low'
  reason: string
  talking_points: string[]
  products_to_detail?: string[]
  pending_tasks?: string[]
  best_time?: string
}

interface NBAResult {
  recommendations: Recommendation[]
  territory_insight?: string
  total_recommended?: number
}

function NextBestAction({ onLogout, onBack, userName, onNavigate }: NextBestActionProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [result, setResult] = useState<NBAResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [cached, setCached] = useState(false)

  const userId = localStorage.getItem('userId') || 'mr_robert_003'

  useEffect(() => {
    fetchNBA()
  }, [])

  const fetchNBA = async (refresh = false) => {
    setLoading(true)
    setError('')
    try {
      const refreshParam = refresh ? '?refresh=true' : ''
      const data = await apiGet(`/ai/nba/${userId}${refreshParam}`)
      const recs = data.recommendations
      // Handle both direct array and nested object
      if (recs?.recommendations) {
        setResult(recs as NBAResult)
      } else if (Array.isArray(recs)) {
        setResult({ recommendations: recs })
      } else {
        setResult(recs)
      }
      setCached(data.cached || false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load recommendations')
    } finally {
      setLoading(false)
    }
  }

  const priorityColor: Record<string, string> = {
    high: '#ef4444',
    medium: '#f59e0b',
    low: '#22c55e',
  }

  const tierBadge: Record<string, string> = {
    A: '#8b5cf6',
    B: '#3b82f6',
    C: '#64748b',
  }

  return (
    <div className="nba-page">
      <Header onLogout={onLogout} onMenuClick={() => setSidebarOpen(true)} onNavigateHome={onBack} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} userName={userName} onNavigate={onNavigate} onLogout={onLogout} currentPage="nba" />

      <main className="nba-content">
        <div className="nba-page-header">
          <button className="back-button" onClick={onBack} aria-label="Go back">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div className="nba-header-content">
            <h1 className="nba-page-title">
              Today's Recommended Visits
              {cached && <span className="nba-cached-badge">Cached</span>}
            </h1>
            <p className="nba-page-subtitle">AI-powered visit recommendations for your territory</p>
          </div>
          <button className="nba-refresh-btn" onClick={() => fetchNBA(true)} disabled={loading}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M23 4V10H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M1 20V14H7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M3.51 9C4.01717 7.56678 4.87913 6.2854 6.01547 5.27542C7.1518 4.26543 8.52547 3.55976 10.0083 3.22426C11.4911 2.88875 13.0348 2.93434 14.4952 3.35677C15.9556 3.77921 17.2853 4.56471 18.36 5.64L23 10M1 14L5.64 18.36C6.71475 19.4353 8.04437 20.2208 9.50481 20.6432C10.9652 21.0657 12.5089 21.1112 13.9917 20.7757C15.4745 20.4402 16.8482 19.7346 17.9845 18.7246C19.1209 17.7146 19.9828 16.4332 20.49 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {loading ? 'Generating...' : 'Refresh'}
          </button>
        </div>

        {result?.territory_insight && (
          <div className="nba-insight">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 17L12 22L22 17" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 12L12 17L22 12" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {result.territory_insight}
          </div>
        )}

        {error && <div className="nba-error">{error}</div>}

        {loading ? (
          <div className="nba-loading">
            <div className="nba-spinner"></div>
            <p>Analyzing your territory and generating recommendations...</p>
          </div>
        ) : result?.recommendations && result.recommendations.length > 0 ? (
          <div className="nba-list">
            {result.recommendations.map((rec, idx) => (
              <div key={idx} className="nba-card">
                <div className="nba-card-top">
                  <div className="nba-card-rank-badge">#{rec.rank || idx + 1}</div>
                  <div className="nba-badges">
                    {rec.tier && (
                      <span className="nba-tier" style={{ background: tierBadge[rec.tier] || '#64748b' }}>
                        Tier {rec.tier}
                      </span>
                    )}
                    <span className="nba-priority" style={{ background: priorityColor[rec.priority] || '#64748b' }}>
                      {rec.priority}
                    </span>
                  </div>
                </div>

                <div className="nba-doctor-info">
                  <span className="nba-doctor-name">{rec.doctor}</span>
                  {rec.specialty && <span className="nba-specialty">{rec.specialty}</span>}
                </div>

                <div className="nba-reason">{rec.reason}</div>

                {rec.talking_points && rec.talking_points.length > 0 && (
                  <div className="nba-talking-points">
                    <div className="nba-tp-label">Talking Points:</div>
                    <ul>
                      {rec.talking_points.map((tp, i) => (
                        <li key={i}>{tp}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {rec.products_to_detail && rec.products_to_detail.length > 0 && (
                  <div className="nba-products">
                    {rec.products_to_detail.map((p, i) => (
                      <span key={i} className="nba-product-tag">{p}</span>
                    ))}
                  </div>
                )}

                <div className="nba-card-actions">
                  {rec.best_time && (
                    <span className="nba-time">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                        <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                      {rec.best_time}
                    </span>
                  )}
                  <button className="nba-start-dcr" onClick={() => {
                    sessionStorage.setItem('selectedDoctor', rec.doctor)
                    onNavigate('dcr')
                  }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Start DCR
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="nba-empty">No recommendations available. Try refreshing.</div>
        )}
      </main>
    </div>
  )
}

export default NextBestAction
