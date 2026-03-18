import { useState, useEffect } from 'react'
import Header from './Header'
import Sidebar from './Sidebar'
import { apiGet, apiPost } from '../services/apiService'
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
  type?: 'doctor' | 'pharmacy'
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

interface PreCallBriefing {
  summary?: string
  lastVisit?: string
  pendingItems?: string[]
  talkingPoints?: string[]
  watchOut?: string[]
}

function NextBestAction({ onLogout, onBack, userName, onNavigate }: NextBestActionProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [result, setResult] = useState<NBAResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [cached, setCached] = useState(false)
  const [filter, setFilter] = useState<'all' | 'doctor' | 'pharmacy'>('all')

  // Skip visit state
  const [skipModalOpen, setSkipModalOpen] = useState(false)
  const [skipItem, setSkipItem] = useState<Recommendation | null>(null)
  const [skipReason, setSkipReason] = useState('')

  // Pre-call briefing expand state
  const [expandedCard, setExpandedCard] = useState<number | null>(null)
  const [briefing, setBriefing] = useState<PreCallBriefing | null>(null)
  const [briefingLoading, setBriefingLoading] = useState(false)

  const userId = localStorage.getItem('userId') || 'mr_robert_003'

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  useEffect(() => {
    fetchNBA()
  }, [])

  // Prevent body scroll when skip modal is open
  useEffect(() => {
    if (skipModalOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => { document.body.style.overflow = 'unset' }
  }, [skipModalOpen])

  const fetchNBA = async (refresh = false) => {
    setLoading(true)
    setError('')
    try {
      const refreshParam = refresh ? '?refresh=true' : ''
      const data = await apiGet(`/ai/nba/${userId}${refreshParam}`)
      const recs = data.recommendations
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

  const handleCardClick = async (idx: number, rec: Recommendation) => {
    if (expandedCard === idx) {
      setExpandedCard(null)
      setBriefing(null)
      return
    }
    setExpandedCard(idx)
    setBriefing(null)

    setBriefingLoading(true)
    try {
      const isPharm = rec.type === 'pharmacy'
      const endpoint = isPharm ? '/ai/pharmacy-briefing' : '/ai/precall-briefing'
      const body = isPharm
        ? { user_id: userId, pharmacy_name: rec.doctor }
        : { user_id: userId, doctor_name: rec.doctor }
      const data = await apiPost(endpoint, body)
      setBriefing(data.briefing || null)
    } catch {
      setBriefing(null)
    } finally {
      setBriefingLoading(false)
    }
  }

  const handleSkipVisit = (e: React.MouseEvent, rec: Recommendation) => {
    e.stopPropagation()
    setSkipItem(rec)
    setSkipModalOpen(true)
    setSkipReason('')
  }

  const handleSubmitSkip = () => {
    if (!skipReason.trim()) return
    console.log('Skipping visit to:', skipItem?.doctor, 'Reason:', skipReason)
    setSkipModalOpen(false)
    setSkipItem(null)
    setSkipReason('')
  }

  const handleStartDCR = (e: React.MouseEvent, rec: Recommendation) => {
    e.stopPropagation()
    sessionStorage.setItem('selectedDoctor', rec.doctor)
    onNavigate('dcr')
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

  const allRecs = result?.recommendations || []
  const filteredRecs = filter === 'all'
    ? allRecs
    : allRecs.filter(r => (r.type || 'doctor') === filter)

  const doctorCount = allRecs.filter(r => (r.type || 'doctor') === 'doctor').length
  const pharmacyCount = allRecs.filter(r => r.type === 'pharmacy').length

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
          <p className="nba-date">{today}</p>
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

        {/* Filter Tabs */}
        {!loading && allRecs.length > 0 && (
          <div className="nba-filter-tabs">
            <button
              className={`nba-filter-tab ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All ({allRecs.length})
            </button>
            <button
              className={`nba-filter-tab ${filter === 'doctor' ? 'active' : ''}`}
              onClick={() => setFilter('doctor')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21M13 7C13 9.20914 11.2091 11 9 11C6.79086 11 5 9.20914 5 7C5 4.79086 6.79086 3 9 3C11.2091 3 13 4.79086 13 7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Doctors ({doctorCount})
            </button>
            <button
              className={`nba-filter-tab ${filter === 'pharmacy' ? 'active' : ''}`}
              onClick={() => setFilter('pharmacy')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 3L4 7V11C4 16.55 7.84 21.74 12 23C16.16 21.74 20 16.55 20 11V7L12 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Pharmacy ({pharmacyCount})
            </button>
          </div>
        )}

        {error && <div className="nba-error">{error}</div>}

        {loading ? (
          <div className="nba-loading">
            <div className="nba-spinner"></div>
            <p>Analyzing your territory and generating recommendations...</p>
          </div>
        ) : filteredRecs.length > 0 ? (
          <div className="nba-list">
            {filteredRecs.map((rec, idx) => {
              const isPharmacy = rec.type === 'pharmacy'
              const isExpanded = expandedCard === idx
              return (
                <div key={idx} className={`nba-card ${isPharmacy ? 'nba-card-pharmacy' : ''} ${isExpanded ? 'nba-card-expanded' : ''}`}>
                  <div className="nba-card-clickable" onClick={() => handleCardClick(idx, rec)}>
                    <div className="nba-card-top">
                      <div className="nba-card-rank-badge">
                        #{rec.rank || idx + 1}
                      </div>
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
                      <span className="nba-specialty">{isPharmacy ? 'Pharmacy' : (rec.specialty || '')}</span>
                    </div>

                    <div className="nba-reason">{rec.reason}</div>

                    {rec.products_to_detail && rec.products_to_detail.length > 0 && (
                      <div className="nba-products">
                        {rec.products_to_detail.map((p, i) => (
                          <span key={i} className={`nba-product-tag ${isPharmacy ? 'pharmacy' : ''}`}>{p}</span>
                        ))}
                      </div>
                    )}

                    <div className="nba-card-expand-hint">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d={isExpanded ? "M18 15L12 9L6 15" : "M6 9L12 15L18 9"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      {isExpanded ? 'Collapse' : (isPharmacy ? 'View pre-visit briefing' : 'View pre-call briefing')}
                    </div>
                  </div>

                  {/* Expanded Pre-Call Briefing */}
                  {isExpanded && (
                    <div className="nba-briefing-section">
                      {briefingLoading ? (
                        <div className="nba-briefing-loading">
                          <div className="nba-spinner small"></div>
                          <span>Loading briefing...</span>
                        </div>
                      ) : briefing ? (
                        <div className="nba-briefing-content">
                          <h4 className={`nba-briefing-title ${isPharmacy ? 'pharmacy' : ''}`}>
                            {isPharmacy ? (
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 3L4 7V11C4 16.55 7.84 21.74 12 23C16.16 21.74 20 16.55 20 11V7L12 3Z" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                            ) : (
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="#00C853" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                            )}
                            {isPharmacy ? 'Pre-Visit Briefing' : 'Pre-Call Briefing'}
                          </h4>
                          {briefing.summary && (
                            <div className="nba-briefing-item summary">
                              <span className="nba-briefing-label">Summary</span>
                              <p>{briefing.summary}</p>
                            </div>
                          )}
                          {briefing.lastVisit && (
                            <div className="nba-briefing-item last-visit">
                              <span className="nba-briefing-label">Last Visit</span>
                              <p>{briefing.lastVisit}</p>
                            </div>
                          )}
                          {briefing.pendingItems && briefing.pendingItems.length > 0 && (
                            <div className="nba-briefing-item pending">
                              <span className="nba-briefing-label">Pending Items</span>
                              <ul>{briefing.pendingItems.map((item, i) => <li key={i}>{item}</li>)}</ul>
                            </div>
                          )}
                          {briefing.talkingPoints && briefing.talkingPoints.length > 0 && (
                            <div className="nba-briefing-item talking">
                              <span className="nba-briefing-label">Recommended Talking Points</span>
                              <ul>{briefing.talkingPoints.map((tp, i) => <li key={i}>{tp}</li>)}</ul>
                            </div>
                          )}
                          {briefing.watchOut && briefing.watchOut.length > 0 && (
                            <div className="nba-briefing-item watchout">
                              <span className="nba-briefing-label">Watch Out</span>
                              <ul>{briefing.watchOut.map((wo, i) => <li key={i}>{wo}</li>)}</ul>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="nba-briefing-empty">
                          No visit history available for briefing.
                        </div>
                      )}

                      <div className="nba-briefing-actions">
                        <button className="nba-start-dcr" onClick={(e) => handleStartDCR(e, rec)}>
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          Start DCR
                        </button>
                        <button className="nba-skip-btn" onClick={(e) => handleSkipVisit(e, rec)}>
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          Skip Visit
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Collapsed Card Actions */}
                  {!isExpanded && (
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
                      <div className="nba-action-btns">
                        <button className="nba-start-dcr" onClick={(e) => handleStartDCR(e, rec)}>
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          Start DCR
                        </button>
                        <button className="nba-skip-btn" onClick={(e) => handleSkipVisit(e, rec)}>
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          Skip
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <div className="nba-empty">No recommendations available. Try refreshing.</div>
        )}
      </main>

      {/* Skip Visit Modal */}
      {skipModalOpen && skipItem && (
        <div className="nba-skip-overlay" onClick={() => setSkipModalOpen(false)}>
          <div className="nba-skip-modal" onClick={(e) => e.stopPropagation()}>
            <div className="nba-skip-modal-header">
              <h2>Skip Visit</h2>
              <button className="nba-skip-modal-close" onClick={() => setSkipModalOpen(false)} aria-label="Close">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
            <div className="nba-skip-modal-body">
              <div className="nba-skip-visit-info">
                <p className="nba-skip-label">Skipping visit to:</p>
                <p className="nba-skip-name">{skipItem.doctor}</p>
                {skipItem.specialty && <p className="nba-skip-specialty">{skipItem.specialty}</p>}
              </div>
              <div className="nba-skip-reason-field">
                <label htmlFor="skip-reason">
                  Reason for skipping visit <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <textarea
                  id="skip-reason"
                  placeholder="Enter the reason for skipping this visit..."
                  value={skipReason}
                  onChange={(e) => setSkipReason(e.target.value)}
                  rows={4}
                />
              </div>
            </div>
            <div className="nba-skip-modal-footer">
              <button className="nba-skip-cancel" onClick={() => setSkipModalOpen(false)}>Cancel</button>
              <button className="nba-skip-submit" onClick={handleSubmitSkip}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default NextBestAction
