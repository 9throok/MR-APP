import { useState, useEffect } from 'react'
import { apiGet } from '../services/apiService'
import {
  PAGE_CONTENT, PAGE_TITLE, PAGE_SUBTITLE, BACK_BUTTON,
  CARD, CARD_PADDING, CARD_SM_PADDING,
  BTN_PRIMARY, INPUT,
  BADGE_DANGER, BADGE_WARNING, BADGE_SUCCESS,
  STAT_CARD, STAT_VALUE, STAT_LABEL,
  SECTION_TITLE,
  EMPTY_STATE, EMPTY_TITLE, EMPTY_DESC,
} from '../styles/designSystem'

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

function TerritoryGap({ onLogout: _onLogout, onBack, userName: _userName, onNavigate: _onNavigate }: TerritoryGapProps) {
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
    setThresholdDays(pendingThreshold)
    fetchData(pendingThreshold)
  }

  const urgencyBadge: Record<string, string> = {
    high: BADGE_DANGER,
    medium: BADGE_WARNING,
    low: BADGE_SUCCESS,
  }

  const urgencyLabel: Record<string, string> = {
    high: 'High', medium: 'Medium', low: 'Low',
  }

  return (
    <div className={PAGE_CONTENT}>
      <main>

        {/* Page header */}
        <div className="flex items-center gap-3 mb-1">
          <button className={BACK_BUTTON} onClick={onBack} aria-label="Go back">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div>
            <h1 className={PAGE_TITLE}>Territory Gap Analysis</h1>
            <p className={`${PAGE_SUBTITLE} mb-6`}>
              {loading ? 'Analysing your territory…' : data ? `${data.totalDoctors} doctor${data.totalDoctors !== 1 ? 's' : ''} analysed` : 'AI-powered doctor visit intelligence'}
            </p>
          </div>
        </div>

        {/* Threshold control */}
        <div className={`${CARD} ${CARD_SM_PADDING} flex items-center gap-4 mb-6`}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="shrink-0">
            <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="#6366f1" strokeWidth="2"/>
            <path d="M12 6V12L16 14" stroke="#6366f1" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <span className="text-sm font-medium text-slate-700">Flag doctors not visited for</span>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={7}
              max={180}
              className={`w-20 ${INPUT} text-center`}
              value={pendingThreshold}
              onChange={e => setPendingThreshold(Math.max(7, Math.min(180, Number(e.target.value))))}
            />
            <span className="text-sm text-slate-500">days</span>
            <button
              className={`${BTN_PRIMARY} px-3 py-1.5 text-xs`}
              onClick={handleApplyThreshold}
              disabled={loading}
            >
              Apply
            </button>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-12 text-slate-400">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shrink-0 mr-3">
              <svg width="24" height="24" viewBox="0 0 48 48" fill="none">
                <circle cx="24" cy="24" r="18" stroke="rgba(255,255,255,.3)" strokeWidth="4"/>
                <circle cx="24" cy="24" r="18" stroke="white" strokeWidth="4" strokeLinecap="round" strokeDasharray="28 56">
                  <animateTransform attributeName="transform" type="rotate" from="0 24 24" to="360 24 24" dur=".8s" repeatCount="indefinite"/>
                </circle>
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-700">Analysing your territory…</p>
              <p className="text-xs text-slate-400">Running AI on your DCR history</p>
            </div>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="text-red-600 bg-red-50 rounded-lg px-4 py-3">
            <div className="text-2xl mb-2">⚠️</div>
            <p className="text-sm font-semibold text-red-700">Could not load analysis</p>
            <p className="text-sm text-red-600 mt-1">{error}</p>
            <button className={`${BTN_PRIMARY} mt-3`} onClick={() => fetchData(thresholdDays)}>Retry</button>
          </div>
        )}

        {/* Results */}
        {!loading && data && (
          <>
            {/* Summary bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className={STAT_CARD}>
                <div className={STAT_VALUE}>{data.totalDoctors}</div>
                <div className={STAT_LABEL}>Total Doctors</div>
              </div>
              <div className={STAT_CARD}>
                <div className={STAT_VALUE}>{data.analysis.coldDoctors.length}</div>
                <div className={STAT_LABEL}>Cold ({data.thresholdDays}+ days)</div>
              </div>
              <div className={STAT_CARD}>
                <div className={STAT_VALUE}>{data.analysis.atRiskDoctors.length}</div>
                <div className={STAT_LABEL}>At Risk</div>
              </div>
            </div>

            {/* AI Insight card */}
            <div className={`${CARD} ${CARD_PADDING} mb-6 bg-indigo-50 border-indigo-100`}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="white"/>
                  </svg>
                </div>
                <span className="text-sm font-semibold text-indigo-700">AI Insight</span>
              </div>
              <p className="text-sm text-slate-700 leading-relaxed">{data.analysis.insight}</p>
              <div className="mt-4 bg-white/60 rounded-lg px-4 py-3">
                <div className="text-xs font-semibold text-indigo-700 mb-1">🎯 This Week's Recommendation</div>
                <p className="text-sm text-slate-700">{data.analysis.recommendation}</p>
              </div>
            </div>

            {/* Cold Doctors */}
            {data.analysis.coldDoctors.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0" />
                  <span className={SECTION_TITLE}> Cold Doctors</span>
                  <span className={BADGE_DANGER}>Not visited {data.thresholdDays}+ days</span>
                </div>
                <div className="space-y-3">
                  {data.analysis.coldDoctors.map((doc, i) => (
                    <div key={i} className={`${CARD} ${CARD_PADDING}`}>
                      <div className="flex items-center justify-between">
                        <span className="text-base font-semibold text-slate-900">{doc.name}</span>
                        <div className="flex items-center gap-2">
                          <span className={BADGE_WARNING}>{doc.daysSince}d ago</span>
                          <span className={urgencyBadge[doc.urgency] || BADGE_WARNING}>
                            {urgencyLabel[doc.urgency] || doc.urgency}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-slate-500 mt-1">{doc.reason}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* At-Risk Doctors */}
            {data.analysis.atRiskDoctors.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                  <span className={SECTION_TITLE}>At-Risk Doctors</span>
                  <span className={BADGE_WARNING}>Approaching threshold</span>
                </div>
                <div className="space-y-3">
                  {data.analysis.atRiskDoctors.map((doc, i) => (
                    <div key={i} className={`${CARD} ${CARD_PADDING}`}>
                      <div className="flex items-center justify-between">
                        <span className="text-base font-semibold text-slate-900">{doc.name}</span>
                        <span className={BADGE_WARNING}>{doc.daysSince}d ago</span>
                      </div>
                      <p className="text-sm text-slate-500 mt-1">{doc.concern}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* All clear */}
            {data.analysis.coldDoctors.length === 0 && data.analysis.atRiskDoctors.length === 0 && (
              <div className={EMPTY_STATE}>
                <div className="text-4xl mb-4">✅</div>
                <p className={EMPTY_TITLE}>Territory looks healthy!</p>
                <p className={EMPTY_DESC}>All doctors visited within the last {data.thresholdDays} days.</p>
              </div>
            )}
          </>
        )}

      </main>
    </div>
  )
}

export default TerritoryGap
