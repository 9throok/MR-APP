import { useState, useEffect } from 'react'
import Header from './Header'
import Sidebar from './Sidebar'
import { useAuth } from '../contexts/AuthContext'
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
  mrName?: string
}

interface AtRiskDoctor {
  name: string
  daysSince: number
  concern: string
  mrName?: string
}

interface MRSummary {
  mrName: string
  totalDoctors: number
  coldCount: number
  atRiskCount: number
}

interface TerritoryAnalysis {
  coldDoctors: ColdDoctor[]
  atRiskDoctors: AtRiskDoctor[]
  insight: string
  recommendation: string
  mrSummaries?: MRSummary[]
}

interface MRInfo {
  user_id: string
  name: string
}

interface TerritoryGapData {
  success: boolean
  user_id?: string
  thresholdDays: number
  totalDoctors: number
  analysis: TerritoryAnalysis
  mrs?: MRInfo[]
}

function TerritoryGap({ onLogout, onBack, userName, onNavigate }: TerritoryGapProps) {
  const { user } = useAuth()
  const isManager = user?.role === 'manager' || user?.role === 'admin'

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [data, setData] = useState<TerritoryGapData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [thresholdDays, setThresholdDays] = useState(30)
  const [pendingThreshold, setPendingThreshold] = useState(30)
  const [selectedMR, setSelectedMR] = useState<string>('all')

  const userId = (() => {
    try { return localStorage.getItem('userId') || localStorage.getItem('user_id') || 'mr_rahul_001' } catch { return 'mr_rahul_001' }
  })()

  const fetchData = (threshold: number, mrFilter?: string) => {
    setLoading(true)
    setError(null)

    const url = isManager
      ? `/ai/territory-gap-team?threshold_days=${threshold}${mrFilter && mrFilter !== 'all' ? `&mr_user_id=${encodeURIComponent(mrFilter)}` : ''}`
      : `/ai/territory-gap/${encodeURIComponent(userId)}?threshold_days=${threshold}`

    apiGet(url)
      .then(json => {
        if (json.success) setData(json)
        else throw new Error('Analysis failed')
      })
      .catch(err => setError(err instanceof Error ? err.message : 'Something went wrong'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchData(thresholdDays, selectedMR) }, [])

  const handleApplyThreshold = () => {
    const clamped = Math.max(1, Math.min(180, pendingThreshold))
    setPendingThreshold(clamped)
    setThresholdDays(clamped)
    fetchData(clamped, selectedMR)
  }

  const handleMRChange = (mrUserId: string) => {
    setSelectedMR(mrUserId)
    fetchData(thresholdDays, mrUserId)
  }

  const urgencyClass: Record<string, string> = {
    high: 'urgency-high',
    medium: 'urgency-medium',
    low: 'urgency-low',
  }

  const urgencyLabel: Record<string, string> = {
    high: 'High', medium: 'Medium', low: 'Low',
  }

  const analysis = data?.analysis
  const mrSummaries = analysis?.mrSummaries || []

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
            <h1 className="tg-page-title">{isManager ? 'Team Visit Coverage' : 'Visit Coverage'}</h1>
            <p className="tg-page-subtitle">
              {loading
                ? (isManager ? 'Analysing your team\'s territory...' : 'Analysing your territory...')
                : data?.totalDoctors
                  ? `${data.totalDoctors} doctor${data.totalDoctors !== 1 ? 's' : ''} analysed${isManager && selectedMR === 'all' ? ' across team' : ''}`
                  : (isManager ? 'Team territory gap analysis' : 'AI-powered doctor visit intelligence')}
            </p>
          </div>
        </div>

        {/* Manager: MR filter */}
        {isManager && data?.mrs && data.mrs.length > 0 && (
          <div className="tg-mr-filter">
            <label className="tg-mr-filter-label">Filter by MR:</label>
            <select
              className="tg-mr-filter-select"
              value={selectedMR}
              onChange={e => handleMRChange(e.target.value)}
            >
              <option value="all">All MRs</option>
              {data.mrs.map(mr => (
                <option key={mr.user_id} value={mr.user_id}>{mr.name}</option>
              ))}
            </select>
          </div>
        )}

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
              <p className="tg-loading-title">{isManager ? 'Analysing your team\'s territory...' : 'Analysing your territory...'}</p>
              <p className="tg-loading-sub">Running AI on {isManager ? 'team' : 'your'} DCR history</p>
            </div>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="tg-error-card">
            <div className="tg-error-emoji">&#x26A0;&#xFE0F;</div>
            <p className="tg-error-title">Could not load analysis</p>
            <p className="tg-error-msg">{error}</p>
            <button className="tg-retry-btn" onClick={() => fetchData(thresholdDays, selectedMR)}>Retry</button>
          </div>
        )}

        {/* No data */}
        {!loading && data && !analysis && (
          <div className="tg-all-clear">
            <div className="tg-all-clear-emoji">&#x1F4CB;</div>
            <p className="tg-all-clear-title">No DCR data found</p>
            <p className="tg-all-clear-sub">
              {isManager
                ? 'No visit records found for any MR. Territory gap analysis requires DCR submissions.'
                : 'This user has no visit records to analyse. Territory gap analysis requires DCR submissions.'}
            </p>
          </div>
        )}

        {/* Results */}
        {!loading && data && analysis && (
          <>
            {/* Manager: MR Summary cards */}
            {isManager && mrSummaries.length > 0 && selectedMR === 'all' && (
              <div className="tg-mr-summaries">
                {mrSummaries.map((mr, i) => (
                  <div key={i} className="tg-mr-summary-card">
                    <div className="tg-mr-summary-name">{mr.mrName}</div>
                    <div className="tg-mr-summary-stats">
                      <span className="tg-mr-stat">{mr.totalDoctors} <small>doctors</small></span>
                      <span className="tg-mr-stat cold">{mr.coldCount} <small>cold</small></span>
                      <span className="tg-mr-stat at-risk">{mr.atRiskCount} <small>at risk</small></span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Summary bar */}
            <div className="tg-summary-bar">
              <div className="tg-stat-card">
                <div className="tg-stat-number">{data.totalDoctors}</div>
                <div className="tg-stat-label">Total Doctors</div>
              </div>
              <div className="tg-stat-card cold">
                <div className="tg-stat-number">{analysis.coldDoctors.length}</div>
                <div className="tg-stat-label">Cold ({data.thresholdDays}+ days)</div>
              </div>
              <div className="tg-stat-card at-risk">
                <div className="tg-stat-number">{analysis.atRiskDoctors.length}</div>
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
              <p className="tg-insight-text">{analysis.insight}</p>
              <div className="tg-recommendation">
                <div className="tg-recommendation-label">&#x1F3AF; This Week's Recommendation</div>
                <p className="tg-recommendation-text">{analysis.recommendation}</p>
              </div>
            </div>

            {/* Cold Doctors */}
            {analysis.coldDoctors.length > 0 && (
              <div className="tg-section">
                <div className="tg-section-header">
                  <span className="tg-section-dot" style={{ background: '#ef4444' }} />
                  <span className="tg-section-title">Cold Doctors</span>
                  <span className="tg-section-badge cold">Not visited {data.thresholdDays}+ days</span>
                </div>
                <div className="tg-doctor-list">
                  {analysis.coldDoctors.map((doc, i) => (
                    <div key={i} className="tg-doctor-card cold">
                      <div className="tg-doctor-card-top">
                        <span className="tg-doctor-name">{doc.name}</span>
                        <div className="tg-doctor-badges">
                          {isManager && doc.mrName && <span className="tg-badge tg-mr-badge">{doc.mrName}</span>}
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
            {analysis.atRiskDoctors.length > 0 && (
              <div className="tg-section">
                <div className="tg-section-header">
                  <span className="tg-section-dot" style={{ background: '#f59e0b' }} />
                  <span className="tg-section-title">At-Risk Doctors</span>
                  <span className="tg-section-badge at-risk">Approaching threshold</span>
                </div>
                <div className="tg-doctor-list">
                  {analysis.atRiskDoctors.map((doc, i) => (
                    <div key={i} className="tg-doctor-card at-risk">
                      <div className="tg-doctor-card-top">
                        <span className="tg-doctor-name">{doc.name}</span>
                        <div className="tg-doctor-badges">
                          {isManager && doc.mrName && <span className="tg-badge tg-mr-badge">{doc.mrName}</span>}
                          <span className="tg-badge days-ar">{doc.daysSince}d ago</span>
                        </div>
                      </div>
                      <p className="tg-doctor-reason">{doc.concern}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* All clear */}
            {analysis.coldDoctors.length === 0 && analysis.atRiskDoctors.length === 0 && (
              <div className="tg-all-clear">
                <div className="tg-all-clear-emoji">&#x2705;</div>
                <p className="tg-all-clear-title">{isManager ? 'Team territory looks healthy!' : 'Territory looks healthy!'}</p>
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
