import { useState, useEffect } from 'react'
import Header from './Header'
import Sidebar from './Sidebar'
import { apiGet } from '../services/apiService'
import './TerritoryGap.css'

interface TerritoryGapProps {
  onLogout: () => void
  onBack: () => void
  userName: string
  onNavigate?: (page: string) => void
}

interface ColdDoctor {
  name: string
  daysSince: number
  urgency: 'low' | 'medium' | 'high'
  reason: string
}

interface AtRiskDoctor {
  name: string
  daysSince: number
  concern: string
}

interface TerritoryAnalysis {
  coldDoctors: ColdDoctor[]
  atRiskDoctors: AtRiskDoctor[]
  insight: string
  recommendation: string
}

interface TerritoryGapData {
  success: boolean
  user_id: string
  thresholdDays: number
  totalDoctors: number
  analysis: TerritoryAnalysis
}

function TerritoryGap({ onLogout, onBack, userName, onNavigate }: TerritoryGapProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [data, setData] = useState<TerritoryGapData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [thresholdDays, setThresholdDays] = useState(30)
  const [pendingThreshold, setPendingThreshold] = useState(30)

  const userId = (() => {
    try { return localStorage.getItem('userId') || localStorage.getItem('user_id') || 'mr_rahul_001' } catch { return 'mr_rahul_001' }
  })()

  const fetchData = (threshold: number) => {
    setLoading(true)
    setError(null)
    apiGet(`/ai/territory-gap/${encodeURIComponent(userId)}?threshold_days=${threshold}`)
      .then(json => {
        if (json.success) setData(json)
        else throw new Error('Analysis failed')
      })
      .catch(err => setError(err instanceof Error ? err.message : 'Something went wrong'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchData(thresholdDays) }, [])

  const handleApplyThreshold = () => {
    const clamped = Math.max(1, Math.min(180, pendingThreshold))
    setPendingThreshold(clamped)
    setThresholdDays(clamped)
    fetchData(clamped)
  }

  const urgencyClass: Record<string, string> = {
    high: 'urgency-high',
    medium: 'urgency-medium',
    low: 'urgency-low',
  }

  const urgencyLabel: Record<string, string> = {
    high: 'High', medium: 'Medium', low: 'Low',
  }

  return (
    <div className="territory-gap-container">
      <Header
        onLogout={onLogout}
        onMenuClick={() => setSidebarOpen(true)}
        onNavigateHome={() => onNavigate?.('home')}
        onNavigateOfflineRequests={() => onNavigate?.('offline-requests')}
      />
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        userName={userName}
        onNavigate={onNavigate}
        onLogout={onLogout}
        currentPage="territory-gap"
      />

      <main className="territory-gap-content">

        {/* Page header */}
        <div className="tg-page-header">
          <button className="tg-back-btn" onClick={onBack} aria-label="Go back">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div>
            <h1 className="tg-page-title">Visit Coverage</h1>
            <p className="tg-page-subtitle">
              {loading ? 'Analysing your territory…' : data ? `${data.totalDoctors} doctor${data.totalDoctors !== 1 ? 's' : ''} analysed` : 'AI-powered doctor visit intelligence'}
            </p>
          </div>
        </div>

        {/* Threshold control */}
        <div className="tg-threshold-bar">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
            <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="#6366f1" strokeWidth="2"/>
            <path d="M12 6V12L16 14" stroke="#6366f1" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <span className="tg-threshold-label">Flag doctors not visited for</span>
          <div className="tg-threshold-controls">
            <input
              type="number"
              min={7}
              max={180}
              className="tg-threshold-input"
              value={pendingThreshold}
              onChange={e => setPendingThreshold(Number(e.target.value) || 0)}
            />
            <span className="tg-threshold-unit">days</span>
            <button
              className="tg-apply-btn"
              onClick={handleApplyThreshold}
              disabled={loading}
            >
              Apply
            </button>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="tg-loading">
            <div className="tg-loading-icon">
              <svg width="24" height="24" viewBox="0 0 48 48" fill="none">
                <circle cx="24" cy="24" r="18" stroke="rgba(255,255,255,.3)" strokeWidth="4"/>
                <circle cx="24" cy="24" r="18" stroke="white" strokeWidth="4" strokeLinecap="round" strokeDasharray="28 56">
                  <animateTransform attributeName="transform" type="rotate" from="0 24 24" to="360 24 24" dur=".8s" repeatCount="indefinite"/>
                </circle>
              </svg>
            </div>
            <div>
              <p className="tg-loading-title">Analysing your territory…</p>
              <p className="tg-loading-sub">Running AI on your DCR history</p>
            </div>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="tg-error-card">
            <div className="tg-error-emoji">⚠️</div>
            <p className="tg-error-title">Could not load analysis</p>
            <p className="tg-error-msg">{error}</p>
            <button className="tg-retry-btn" onClick={() => fetchData(thresholdDays)}>Retry</button>
          </div>
        )}

        {/* Results */}
        {!loading && data && !data.analysis && (
          <div className="tg-all-clear">
            <div className="tg-all-clear-emoji">📋</div>
            <p className="tg-all-clear-title">No DCR data found</p>
            <p className="tg-all-clear-sub">This user has no visit records to analyse. Territory gap analysis requires DCR submissions.</p>
          </div>
        )}
        {!loading && data && data.analysis && (
          <>
            {/* Summary bar */}
            <div className="tg-summary-bar">
              <div className="tg-stat-card">
                <div className="tg-stat-number">{data.totalDoctors}</div>
                <div className="tg-stat-label">Total Doctors</div>
              </div>
              <div className="tg-stat-card cold">
                <div className="tg-stat-number">{data.analysis.coldDoctors.length}</div>
                <div className="tg-stat-label">Cold ({data.thresholdDays}+ days)</div>
              </div>
              <div className="tg-stat-card at-risk">
                <div className="tg-stat-number">{data.analysis.atRiskDoctors.length}</div>
                <div className="tg-stat-label">At Risk</div>
              </div>
            </div>

            {/* AI Insight card */}
            <div className="tg-insight-card">
              <div className="tg-insight-header">
                <div className="tg-insight-icon">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="white"/>
                  </svg>
                </div>
                <span className="tg-insight-label">AI Insight</span>
              </div>
              <p className="tg-insight-text">{data.analysis.insight}</p>
              <div className="tg-recommendation">
                <div className="tg-recommendation-label">🎯 This Week's Recommendation</div>
                <p className="tg-recommendation-text">{data.analysis.recommendation}</p>
              </div>
            </div>

            {/* Cold Doctors */}
            {data.analysis.coldDoctors.length > 0 && (
              <div className="tg-section">
                <div className="tg-section-header">
                  <span className="tg-section-dot" style={{ background: '#ef4444' }} />
                  <span className="tg-section-title">Cold Doctors</span>
                  <span className="tg-section-badge cold">Not visited {data.thresholdDays}+ days</span>
                </div>
                <div className="tg-doctor-list">
                  {data.analysis.coldDoctors.map((doc, i) => (
                    <div key={i} className="tg-doctor-card cold">
                      <div className="tg-doctor-card-top">
                        <span className="tg-doctor-name">{doc.name}</span>
                        <div className="tg-doctor-badges">
                          <span className="tg-badge days">{doc.daysSince}d ago</span>
                          <span className={`tg-badge ${urgencyClass[doc.urgency] || 'urgency-medium'}`}>
                            {urgencyLabel[doc.urgency] || doc.urgency}
                          </span>
                        </div>
                      </div>
                      <p className="tg-doctor-reason">{doc.reason}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* At-Risk Doctors */}
            {data.analysis.atRiskDoctors.length > 0 && (
              <div className="tg-section">
                <div className="tg-section-header">
                  <span className="tg-section-dot" style={{ background: '#f59e0b' }} />
                  <span className="tg-section-title">At-Risk Doctors</span>
                  <span className="tg-section-badge at-risk">Approaching threshold</span>
                </div>
                <div className="tg-doctor-list">
                  {data.analysis.atRiskDoctors.map((doc, i) => (
                    <div key={i} className="tg-doctor-card at-risk">
                      <div className="tg-doctor-card-top">
                        <span className="tg-doctor-name">{doc.name}</span>
                        <span className="tg-badge days-ar">{doc.daysSince}d ago</span>
                      </div>
                      <p className="tg-doctor-reason">{doc.concern}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* All clear */}
            {data.analysis.coldDoctors.length === 0 && data.analysis.atRiskDoctors.length === 0 && (
              <div className="tg-all-clear">
                <div className="tg-all-clear-emoji">✅</div>
                <p className="tg-all-clear-title">Territory looks healthy!</p>
                <p className="tg-all-clear-sub">All doctors visited within the last {data.thresholdDays} days.</p>
              </div>
            )}
          </>
        )}

      </main>
    </div>
  )
}

export default TerritoryGap
