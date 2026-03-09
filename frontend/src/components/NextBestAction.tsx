import { useState, useEffect } from 'react'
import { apiGet } from '../services/apiService'
import {
  PAGE_CONTENT,
  PAGE_TITLE,
  BADGE_DEFAULT,
  BADGE_PRIMARY,
  BADGE_DANGER,
  BADGE_WARNING,
  BADGE_SUCCESS,
  BADGE_INFO,
  BTN_GHOST,
  BTN_PRIMARY,
  CARD,
  CARD_PADDING,
  EMPTY_STATE,
  EMPTY_TITLE,
} from '../styles/designSystem'

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

function NextBestAction({ onLogout: _onLogout, onBack: _onBack, userName: _userName, onNavigate }: NextBestActionProps) {
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

  const priorityBadge: Record<string, string> = {
    high: BADGE_DANGER,
    medium: BADGE_WARNING,
    low: BADGE_SUCCESS,
  }

  return (
    <div className={PAGE_CONTENT}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h2 className={PAGE_TITLE}>Today's Recommended Visits</h2>
          {cached && <span className={BADGE_DEFAULT}>Cached</span>}
        </div>
        <button className={BTN_GHOST} onClick={() => fetchNBA(true)} disabled={loading}>
          {loading ? 'Generating...' : 'Refresh'}
        </button>
      </div>

      {result?.territory_insight && (
        <div className="text-sm text-slate-600 bg-indigo-50 rounded-lg px-4 py-3 mb-4 border border-indigo-100 flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="shrink-0">
            <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 17L12 22L22 17" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 12L12 17L22 12" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {result.territory_insight}
        </div>
      )}

      {error && <div className="text-red-600 bg-red-50 rounded-lg px-4 py-3">{error}</div>}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3 text-slate-400">
          <svg className="animate-spin h-8 w-8 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-sm">Analyzing your territory and generating recommendations...</p>
        </div>
      ) : result?.recommendations && result.recommendations.length > 0 ? (
        <div className="space-y-3">
          {result.recommendations.map((rec, idx) => (
            <div key={idx} className={`${CARD} ${CARD_PADDING} flex gap-4`}>
              <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center text-lg font-bold shrink-0">
                #{rec.rank || idx + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <div>
                    <span className="text-base font-semibold text-slate-900">{rec.doctor}</span>
                    {rec.specialty && <span className="text-sm text-slate-500 ml-2">{rec.specialty}</span>}
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {rec.tier && (
                      <span className={BADGE_PRIMARY}>
                        {rec.tier}
                      </span>
                    )}
                    <span className={priorityBadge[rec.priority] || BADGE_DEFAULT}>
                      {rec.priority}
                    </span>
                  </div>
                </div>

                <div className="text-sm text-slate-600 mt-2">{rec.reason}</div>

                {rec.talking_points && rec.talking_points.length > 0 && (
                  <div className="mt-3">
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Talking Points:</div>
                    <ul className="list-disc list-inside text-sm text-slate-600 space-y-0.5">
                      {rec.talking_points.map((tp, i) => (
                        <li key={i}>{tp}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {rec.products_to_detail && rec.products_to_detail.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {rec.products_to_detail.map((p, i) => (
                      <span key={i} className={BADGE_INFO}>{p}</span>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                  {rec.best_time && <span className="text-xs text-slate-400">{rec.best_time}</span>}
                  <button className={`${BTN_PRIMARY} !px-3 !py-1.5 !text-xs`} onClick={() => {
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
        <div className={EMPTY_STATE}>
          <p className={EMPTY_TITLE}>No recommendations available. Try refreshing.</p>
        </div>
      )}
    </div>
  )
}

export default NextBestAction
