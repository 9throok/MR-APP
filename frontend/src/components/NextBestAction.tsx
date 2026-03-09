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
        <div className="nba-header-row">
          <div>
            <h2 className="nba-title">Today's Recommended Visits</h2>
            {cached && <span className="nba-cached-badge">Cached</span>}
          </div>
          <button className="nba-refresh-btn" onClick={() => fetchNBA(true)} disabled={loading}>
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
                <div className="nba-card-rank">#{rec.rank || idx + 1}</div>
                <div className="nba-card-body">
                  <div className="nba-card-header">
                    <div className="nba-doctor-info">
                      <span className="nba-doctor-name">{rec.doctor}</span>
                      {rec.specialty && <span className="nba-specialty">{rec.specialty}</span>}
                    </div>
                    <div className="nba-badges">
                      {rec.tier && (
                        <span className="nba-tier" style={{ background: tierBadge[rec.tier] || '#64748b' }}>
                          {rec.tier}
                        </span>
                      )}
                      <span className="nba-priority" style={{ background: priorityColor[rec.priority] || '#64748b' }}>
                        {rec.priority}
                      </span>
                    </div>
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
                    {rec.best_time && <span className="nba-time">{rec.best_time}</span>}
                    <button className="nba-start-dcr" onClick={() => {
                      sessionStorage.setItem('selectedDoctor', rec.doctor)
                      onNavigate('dcr')
                    }}>
                      Start DCR
                    </button>
                  </div>
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
