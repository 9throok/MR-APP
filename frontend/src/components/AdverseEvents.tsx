import { useState, useEffect } from 'react'
import Header from './Header'
import Sidebar from './Sidebar'
import { apiGet, apiPatch } from '../services/apiService'
import './AdverseEvents.css'

interface AdverseEventsProps {
  onLogout: () => void
  onBack: () => void
  userName: string
  onNavigate: (page: string) => void
}

interface AE {
  id: number
  dcr_id: number | null
  user_id: string
  doctor_name: string
  drug: string
  symptoms: string[]
  severity: 'mild' | 'moderate' | 'severe' | 'critical'
  patient_info: Record<string, string> | null
  timeline: string | null
  status: 'pending' | 'reviewed' | 'confirmed' | 'dismissed'
  detected_at: string
  reviewed_by: string | null
  review_notes: string | null
  call_summary: string | null
  doctor_feedback: string | null
}

interface Stats {
  total: number
  pending: number
  confirmed: number
  dismissed: number
  mild: number
  moderate: number
  severe: number
  critical: number
}

function AdverseEvents({ onLogout, onBack, userName, onNavigate }: AdverseEventsProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [events, setEvents] = useState<AE[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'dismissed'>('pending')
  const [reviewingId, setReviewingId] = useState<number | null>(null)
  const [reviewNotes, setReviewNotes] = useState('')

  useEffect(() => {
    loadData()
  }, [filter])

  const loadData = async () => {
    setLoading(true)
    try {
      const statusParam = filter !== 'all' ? `?status=${filter}` : ''
      const [eventsData, statsData] = await Promise.all([
        apiGet(`/adverse-events${statusParam}`),
        apiGet('/adverse-events/stats')
      ])
      setEvents(eventsData.data || [])
      setStats(statsData.stats || null)
    } catch (err) {
      console.error('Error loading AE data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleReview = async (id: number, status: 'confirmed' | 'dismissed') => {
    try {
      await apiPatch(`/adverse-events/${id}/review`, {
        status,
        review_notes: reviewNotes
      })
      setReviewingId(null)
      setReviewNotes('')
      loadData()
    } catch (err) {
      console.error('Error reviewing AE:', err)
    }
  }

  const severityColor: Record<string, string> = {
    mild: '#22c55e',
    moderate: '#f59e0b',
    severe: '#f97316',
    critical: '#ef4444',
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="ae-page">
      <Header onLogout={onLogout} onMenuClick={() => setSidebarOpen(true)} onNavigateHome={onBack} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} userName={userName} onNavigate={onNavigate} onLogout={onLogout} currentPage="adverse-events" />

      <main className="ae-content">
        {stats && (
          <div className="ae-stats-row">
            <div className="ae-stat">
              <div className="ae-stat-value">{stats.total}</div>
              <div className="ae-stat-label">Total</div>
            </div>
            <div className="ae-stat pending">
              <div className="ae-stat-value">{stats.pending}</div>
              <div className="ae-stat-label">Pending</div>
            </div>
            <div className="ae-stat confirmed">
              <div className="ae-stat-value">{stats.confirmed}</div>
              <div className="ae-stat-label">Confirmed</div>
            </div>
            <div className="ae-stat severe-stat">
              <div className="ae-stat-value">{stats.severe + stats.critical}</div>
              <div className="ae-stat-label">Severe+</div>
            </div>
          </div>
        )}

        <div className="ae-filter-bar">
          {(['all', 'pending', 'confirmed', 'dismissed'] as const).map(f => (
            <button
              key={f}
              className={`filter-btn ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="ae-loading">Loading adverse events...</div>
        ) : events.length === 0 ? (
          <div className="ae-empty">No {filter !== 'all' ? filter : ''} adverse events found</div>
        ) : (
          <div className="ae-list">
            {events.map(ae => (
              <div key={ae.id} className={`ae-card ${ae.status}`}>
                <div className="ae-card-header">
                  <div className="ae-drug">{ae.drug}</div>
                  <span className="ae-severity-badge" style={{ background: severityColor[ae.severity] || '#94a3b8' }}>
                    {ae.severity.toUpperCase()}
                  </span>
                </div>

                <div className="ae-symptoms">
                  {ae.symptoms.map((s, i) => (
                    <span key={i} className="ae-symptom-tag">{s}</span>
                  ))}
                </div>

                <div className="ae-details">
                  <div className="ae-detail-row">
                    <span className="ae-label">Doctor:</span> {ae.doctor_name}
                  </div>
                  <div className="ae-detail-row">
                    <span className="ae-label">Reporter:</span> {ae.user_id}
                  </div>
                  {ae.timeline && (
                    <div className="ae-detail-row">
                      <span className="ae-label">Timeline:</span> {ae.timeline}
                    </div>
                  )}
                  <div className="ae-detail-row">
                    <span className="ae-label">Detected:</span> {formatDate(ae.detected_at)}
                  </div>
                  {ae.call_summary && (
                    <div className="ae-context">
                      <span className="ae-label">Call Context:</span>
                      <p>{ae.call_summary}</p>
                    </div>
                  )}
                </div>

                {ae.status === 'pending' && (
                  <>
                    {reviewingId === ae.id ? (
                      <div className="ae-review-form">
                        <textarea
                          value={reviewNotes}
                          onChange={e => setReviewNotes(e.target.value)}
                          placeholder="Add review notes (optional)..."
                          className="review-textarea"
                        />
                        <div className="review-actions">
                          <button className="review-btn confirm" onClick={() => handleReview(ae.id, 'confirmed')}>
                            Confirm AE
                          </button>
                          <button className="review-btn dismiss" onClick={() => handleReview(ae.id, 'dismissed')}>
                            Dismiss
                          </button>
                          <button className="review-btn cancel" onClick={() => { setReviewingId(null); setReviewNotes('') }}>
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button className="review-trigger" onClick={() => setReviewingId(ae.id)}>
                        Review this event
                      </button>
                    )}
                  </>
                )}

                {ae.review_notes && ae.status !== 'pending' && (
                  <div className="ae-review-result">
                    <span className={`ae-status-badge ${ae.status}`}>{ae.status}</span>
                    <p className="ae-review-notes">{ae.review_notes}</p>
                    {ae.reviewed_by && <span className="ae-reviewer">by {ae.reviewed_by}</span>}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

export default AdverseEvents
