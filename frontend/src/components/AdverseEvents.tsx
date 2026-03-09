import { useState, useEffect } from 'react'
import { apiGet, apiPatch } from '../services/apiService'
import {
  PAGE_CONTENT,
  PAGE_TITLE,
  CARD,
  CARD_PADDING,
  STAT_CARD,
  STAT_VALUE,
  STAT_LABEL,
  FILTER_PILL_ACTIVE,
  FILTER_PILL_INACTIVE,
  BADGE_DEFAULT,
  BADGE_DANGER,
  BADGE_WARNING,
  BADGE_SUCCESS,
  TEXTAREA,
  BTN_PRIMARY,
  BTN_GHOST,
  EMPTY_STATE,
  EMPTY_TITLE,
} from '../styles/designSystem'

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

function AdverseEvents({ onLogout: _onLogout, onBack: _onBack, userName: _userName, onNavigate: _onNavigate }: AdverseEventsProps) {
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

  const severityBadge: Record<string, string> = {
    mild: BADGE_SUCCESS,
    moderate: BADGE_WARNING,
    severe: BADGE_DANGER,
    critical: BADGE_DANGER,
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className={PAGE_CONTENT}>
      <h2 className={`${PAGE_TITLE} mb-6`}>Adverse Events</h2>

      {stats && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className={STAT_CARD}>
            <div className={STAT_VALUE}>{stats.total}</div>
            <div className={STAT_LABEL}>Total</div>
          </div>
          <div className={STAT_CARD}>
            <div className={STAT_VALUE}>{stats.pending}</div>
            <div className={STAT_LABEL}>Pending</div>
          </div>
          <div className={STAT_CARD}>
            <div className={STAT_VALUE}>{stats.confirmed}</div>
            <div className={STAT_LABEL}>Confirmed</div>
          </div>
          <div className={STAT_CARD}>
            <div className={STAT_VALUE}>{stats.severe + stats.critical}</div>
            <div className={STAT_LABEL}>Severe+</div>
          </div>
        </div>
      )}

      <div className="flex gap-2 mb-4">
        {(['all', 'pending', 'confirmed', 'dismissed'] as const).map(f => (
          <button
            key={f}
            className={filter === f ? FILTER_PILL_ACTIVE : FILTER_PILL_INACTIVE}
            onClick={() => setFilter(f)}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12 text-slate-400">Loading adverse events...</div>
      ) : events.length === 0 ? (
        <div className={EMPTY_STATE}>
          <p className={EMPTY_TITLE}>No {filter !== 'all' ? filter : ''} adverse events found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map(ae => (
            <div key={ae.id} className={`${CARD} ${CARD_PADDING}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="text-base font-semibold text-slate-900">{ae.drug}</div>
                <span className={severityBadge[ae.severity] || BADGE_DEFAULT}>
                  {ae.severity.toUpperCase()}
                </span>
              </div>

              <div className="flex flex-wrap gap-2 mb-3">
                {ae.symptoms.map((s, i) => (
                  <span key={i} className={BADGE_DEFAULT}>{s}</span>
                ))}
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <span className="text-xs font-medium text-slate-400 uppercase tracking-wider w-24 shrink-0">Doctor:</span>
                  <span className="text-slate-600">{ae.doctor_name}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-xs font-medium text-slate-400 uppercase tracking-wider w-24 shrink-0">Reporter:</span>
                  <span className="text-slate-600">{ae.user_id}</span>
                </div>
                {ae.timeline && (
                  <div className="flex items-start gap-2">
                    <span className="text-xs font-medium text-slate-400 uppercase tracking-wider w-24 shrink-0">Timeline:</span>
                    <span className="text-slate-600">{ae.timeline}</span>
                  </div>
                )}
                <div className="flex items-start gap-2">
                  <span className="text-xs font-medium text-slate-400 uppercase tracking-wider w-24 shrink-0">Detected:</span>
                  <span className="text-slate-600">{formatDate(ae.detected_at)}</span>
                </div>
                {ae.call_summary && (
                  <div className="mt-2">
                    <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Call Context:</span>
                    <p className="text-slate-600 mt-1">{ae.call_summary}</p>
                  </div>
                )}
              </div>

              {ae.status === 'pending' && (
                <>
                  {reviewingId === ae.id ? (
                    <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
                      <textarea
                        value={reviewNotes}
                        onChange={e => setReviewNotes(e.target.value)}
                        placeholder="Add review notes (optional)..."
                        className={TEXTAREA}
                      />
                      <div className="flex gap-2">
                        <button className={`${BTN_PRIMARY} !px-3 !py-1.5 !text-xs`} onClick={() => handleReview(ae.id, 'confirmed')}>
                          Confirm AE
                        </button>
                        <button className={`${BTN_GHOST} !px-3 !py-1.5 !text-xs`} onClick={() => handleReview(ae.id, 'dismissed')}>
                          Dismiss
                        </button>
                        <button className={`${BTN_GHOST} !px-3 !py-1.5 !text-xs`} onClick={() => { setReviewingId(null); setReviewNotes('') }}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button className={`${BTN_GHOST} mt-3`} onClick={() => setReviewingId(ae.id)}>
                      Review this event
                    </button>
                  )}
                </>
              )}

              {ae.review_notes && ae.status !== 'pending' && (
                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-3">
                  <span className={ae.status === 'confirmed' || ae.status === 'reviewed' ? BADGE_SUCCESS : BADGE_WARNING}>
                    {ae.status}
                  </span>
                  <p className="text-sm text-slate-600">{ae.review_notes}</p>
                  {ae.reviewed_by && <span className="text-xs text-slate-400">by {ae.reviewed_by}</span>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default AdverseEvents
