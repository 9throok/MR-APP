import { useState } from 'react'
import { apiPost, apiGet } from '../services/apiService'
import {
  PAGE_CONTENT, PAGE_TITLE, PAGE_SUBTITLE, BACK_BUTTON,
  CARD, CARD_PADDING, CARD_SM_PADDING, CARD_TITLE,
  BTN_PRIMARY, INPUT, TEXTAREA, LABEL,
  TAB_CONTAINER, TAB_ITEM, TAB_ACTIVE,
  EMPTY_STATE, EMPTY_TITLE, EMPTY_DESC,
  TABLE_WRAPPER, TABLE, TABLE_HEAD, TABLE_TH, TABLE_TD, TABLE_ROW,
} from '../styles/designSystem'

interface ManagerInsightsProps {
  onLogout: () => void
  onBack: () => void
  userName: string
  onNavigate?: (page: string) => void
}

// ── Manager Query types ──────────────────────────────────────────
interface QueryResult {
  answer: string
  supportingData: string[]
  followUpSuggestions: string[]
}

interface QueryResponse {
  success: boolean
  query: string
  recordsAnalysed: number
  result: QueryResult
}

// ── Product Signals types ────────────────────────────────────────
interface RawStat {
  product: string
  totalCalls: number
  callsWithSamples: number
  avgRating: string
  highRatingCalls: number
  lowRatingCalls: number
  uniqueDoctors: number
  uniqueMRs: number
}

interface TopPerformer {
  product: string
  reason: string
}

interface Underperformer {
  product: string
  concern: string
  suggestion: string
}

interface SignalsAnalysis {
  topPerformers: TopPerformer[]
  underperformers: Underperformer[]
  signals: string[]
  summary: string
}

interface SignalsResponse {
  success: boolean
  period: string
  productsAnalysed: number
  rawStats: RawStat[]
  analysis: SignalsAnalysis
}

// ── Spinner SVG ──────────────────────────────────────────────────
function Spinner() {
  return (
    <svg width="24" height="24" viewBox="0 0 48 48" fill="none">
      <circle cx="24" cy="24" r="18" stroke="rgba(255,255,255,.35)" strokeWidth="4"/>
      <circle cx="24" cy="24" r="18" stroke="white" strokeWidth="4" strokeLinecap="round" strokeDasharray="28 56">
        <animateTransform attributeName="transform" type="rotate" from="0 24 24" to="360 24 24" dur=".8s" repeatCount="indefinite"/>
      </circle>
    </svg>
  )
}

// ── Main component ───────────────────────────────────────────────
function ManagerInsights({ onLogout: _onLogout, onBack, userName: _userName, onNavigate: _onNavigate }: ManagerInsightsProps) {
  const [activeTab, setActiveTab] = useState<'query' | 'signals'>('query')

  // Manager Query state
  const [queryText, setQueryText] = useState('')
  const [queryUserIds, setQueryUserIds] = useState('')
  const [queryFromDate, setQueryFromDate] = useState('')
  const [queryToDate, setQueryToDate] = useState('')
  const [queryLoading, setQueryLoading] = useState(false)
  const [queryError, setQueryError] = useState<string | null>(null)
  const [queryResult, setQueryResult] = useState<QueryResponse | null>(null)

  // Product Signals state
  const [sigFromDate, setSigFromDate] = useState('')
  const [sigToDate, setSigToDate] = useState('')
  const [sigUserIds, setSigUserIds] = useState('')
  const [sigLoading, setSigLoading] = useState(false)
  const [sigError, setSigError] = useState<string | null>(null)
  const [sigResult, setSigResult] = useState<SignalsResponse | null>(null)

  // ── Manager Query submit ──────────────────────────────────────
  const handleQuerySubmit = async () => {
    if (!queryText.trim()) return
    setQueryLoading(true)
    setQueryError(null)
    setQueryResult(null)
    try {
      const body: Record<string, unknown> = { query: queryText.trim() }
      if (queryUserIds.trim()) {
        body.user_ids = queryUserIds.split(',').map(s => s.trim()).filter(Boolean)
      }
      if (queryFromDate) body.from_date = queryFromDate
      if (queryToDate) body.to_date = queryToDate

      const json = await apiPost('/ai/manager-query', body) as QueryResponse
      if (!json.success) throw new Error('Query failed')
      setQueryResult(json)
    } catch (err) {
      setQueryError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setQueryLoading(false)
    }
  }

  // Use a follow-up suggestion as the next query
  const handleFollowUp = (suggestion: string) => {
    setQueryText(suggestion)
    setQueryResult(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // ── Product Signals fetch ─────────────────────────────────────
  const handleSignalsFetch = async () => {
    setSigLoading(true)
    setSigError(null)
    setSigResult(null)
    try {
      const params = new URLSearchParams()
      if (sigFromDate) params.set('from_date', sigFromDate)
      if (sigToDate) params.set('to_date', sigToDate)
      if (sigUserIds.trim()) params.set('user_ids', sigUserIds.trim())
      const qs = params.toString() ? `?${params.toString()}` : ''

      const json = await apiGet(`/ai/product-signals${qs}`) as SignalsResponse
      if (!json.success) throw new Error('Signals fetch failed')
      setSigResult(json)
    } catch (err) {
      setSigError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSigLoading(false)
    }
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
            <h1 className={PAGE_TITLE}>Manager Insights</h1>
            <p className={`${PAGE_SUBTITLE} mb-6`}>AI-powered team intelligence &amp; product performance</p>
          </div>
        </div>

        {/* Tabs */}
        <div className={TAB_CONTAINER}>
          <button
            className={activeTab === 'query' ? TAB_ACTIVE : TAB_ITEM}
            onClick={() => setActiveTab('query')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Manager Query
          </button>
          <button
            className={activeTab === 'signals' ? TAB_ACTIVE : TAB_ITEM}
            onClick={() => setActiveTab('signals')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Product Signals
          </button>
        </div>

        {/* ══════════════════ TAB 1 — Manager Query ══════════════════ */}
        {activeTab === 'query' && (
          <>
            {/* Question input */}
            <div className={`${CARD} ${CARD_PADDING} mb-4`}>
              <label className={LABEL}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="inline-block mr-1 -mt-0.5">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="#0ea5e9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Ask a question about your team
              </label>
              <textarea
                className={TEXTAREA}
                rows={4}
                placeholder='e.g. "How is Lipidex performing across the team?" or "Which MR had the most calls last week?"'
                value={queryText}
                onChange={e => setQueryText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleQuerySubmit() }}
              />
            </div>

            {/* Optional filters */}
            <div className={`${CARD} ${CARD_SM_PADDING} mb-4`}>
              <p className="text-sm font-semibold text-slate-900 mb-3">Optional Filters</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <span className={LABEL}>From Date</span>
                  <input type="date" className={INPUT} value={queryFromDate} onChange={e => setQueryFromDate(e.target.value)} />
                </div>
                <div>
                  <span className={LABEL}>To Date</span>
                  <input type="date" className={INPUT} value={queryToDate} onChange={e => setQueryToDate(e.target.value)} />
                </div>
                <div className="md:col-span-3">
                  <span className={LABEL}>MR User IDs (comma-separated)</span>
                  <input
                    type="text"
                    className={INPUT}
                    placeholder="e.g. mr_rahul_001, mr_priya_002"
                    value={queryUserIds}
                    onChange={e => setQueryUserIds(e.target.value)}
                  />
                </div>
              </div>
              <button
                className={`${BTN_PRIMARY} mt-4`}
                onClick={handleQuerySubmit}
                disabled={queryLoading || !queryText.trim()}
              >
                {queryLoading ? <Spinner /> : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M22 2L11 13M22 2L15 22L11 13M11 13L2 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
                {queryLoading ? 'Analysing…' : 'Ask AI'}
              </button>
            </div>

            {/* Error */}
            {queryError && (
              <div className="text-red-600 bg-red-50 rounded-lg px-4 py-3 mb-4 flex items-center gap-2">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="shrink-0">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                  <path d="M12 8V12M12 16H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                {queryError}
              </div>
            )}

            {/* Loading */}
            {queryLoading && (
              <div className="flex flex-col items-center justify-center py-12 gap-3 text-slate-400">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center">
                  <Spinner />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-slate-700">Thinking…</p>
                  <p className="text-xs text-slate-400">Fetching DCRs and running AI analysis</p>
                </div>
              </div>
            )}

            {/* Result */}
            {!queryLoading && queryResult && (
              <>
                {/* Answer */}
                <div className={`${CARD} ${CARD_PADDING} mb-4`}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" fill="currentColor"/>
                      </svg>
                    </div>
                    <span className="text-base font-semibold text-slate-900">AI Answer</span>
                    <span className="text-xs text-slate-400">{queryResult.recordsAnalysed} records analysed</span>
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed">{queryResult.result.answer}</p>
                </div>

                {/* Supporting data */}
                {queryResult.result.supportingData.length > 0 && (
                  <div className={`${CARD} ${CARD_SM_PADDING} mb-4`}>
                    <p className={CARD_TITLE}>Supporting Data</p>
                    <ul className="space-y-2 mt-3">
                      {queryResult.result.supportingData.map((point, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Follow-up suggestions */}
                {queryResult.result.followUpSuggestions.length > 0 && (
                  <div className={`${CARD} ${CARD_SM_PADDING}`}>
                    <p className={`${CARD_TITLE} text-emerald-600`}>Suggested Follow-ups</p>
                    <ul className="space-y-1 mt-3">
                      {queryResult.result.followUpSuggestions.map((s, i) => (
                        <li key={i} className="flex items-center gap-2 px-3 py-2 text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg cursor-pointer transition-colors" onClick={() => handleFollowUp(s)}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="shrink-0">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          {s}
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-indigo-400 ml-auto shrink-0">
                            <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}

            {/* Idle state */}
            {!queryLoading && !queryResult && !queryError && (
              <div className={EMPTY_STATE}>
                <div className="w-16 h-16 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-4">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <p className={EMPTY_TITLE}>Ask anything about your team</p>
                <p className={EMPTY_DESC}>Type a question above and the AI will analyse your team's DCR data to answer it.</p>
              </div>
            )}
          </>
        )}

        {/* ══════════════════ TAB 2 — Product Signals ════════════════ */}
        {activeTab === 'signals' && (
          <>
            {/* Filters */}
            <div className={`${CARD} ${CARD_SM_PADDING} mb-4`}>
              <p className="text-sm font-semibold text-slate-900 mb-3">Filters (all optional)</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <span className={LABEL}>From Date</span>
                  <input type="date" className={INPUT} value={sigFromDate} onChange={e => setSigFromDate(e.target.value)} />
                </div>
                <div>
                  <span className={LABEL}>To Date</span>
                  <input type="date" className={INPUT} value={sigToDate} onChange={e => setSigToDate(e.target.value)} />
                </div>
                <div className="md:col-span-3">
                  <span className={LABEL}>MR User IDs (comma-separated)</span>
                  <input
                    type="text"
                    className={INPUT}
                    placeholder="e.g. mr_rahul_001, mr_priya_002  (leave blank for all)"
                    value={sigUserIds}
                    onChange={e => setSigUserIds(e.target.value)}
                  />
                </div>
              </div>
              <button
                className={`${BTN_PRIMARY} mt-4`}
                onClick={handleSignalsFetch}
                disabled={sigLoading}
              >
                {sigLoading ? <Spinner /> : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
                {sigLoading ? 'Analysing…' : 'Run Product Signals'}
              </button>
            </div>

            {/* Error */}
            {sigError && (
              <div className="text-red-600 bg-red-50 rounded-lg px-4 py-3 mb-4 flex items-center gap-2">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="shrink-0">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                  <path d="M12 8V12M12 16H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                {sigError}
              </div>
            )}

            {/* Loading */}
            {sigLoading && (
              <div className="flex flex-col items-center justify-center py-12 gap-3 text-slate-400">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center">
                  <Spinner />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-slate-700">Analysing products…</p>
                  <p className="text-xs text-slate-400">Aggregating team DCR data and running AI</p>
                </div>
              </div>
            )}

            {/* Results */}
            {!sigLoading && sigResult && (
              <>
                {/* AI Summary */}
                <div className={`${CARD} ${CARD_PADDING} mb-4`}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <path d="M22 12h-4l-3 9L9 3l-3 9H2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <span className="text-base font-semibold text-slate-900">AI Summary</span>
                    <span className="text-xs text-slate-400">{sigResult.productsAnalysed} products · {sigResult.period}</span>
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed">{sigResult.analysis.summary}</p>
                </div>

                {/* Top & Under performers */}
                {(sigResult.analysis.topPerformers.length > 0 || sigResult.analysis.underperformers.length > 0) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    {sigResult.analysis.topPerformers.map((p, i) => (
                      <div key={i} className={`${CARD} ${CARD_PADDING}`}>
                        <div className="flex items-center gap-3 mb-3">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="#22c55e"/>
                          </svg>
                          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Top Performer</span>
                        </div>
                        <div className="text-lg font-semibold text-slate-900">{p.product}</div>
                        <p className="text-sm text-slate-600 mb-2">{p.reason}</p>
                      </div>
                    ))}
                    {sigResult.analysis.underperformers.map((p, i) => (
                      <div key={i} className={`${CARD} ${CARD_PADDING}`}>
                        <div className="flex items-center gap-3 mb-3">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="#ef4444"/>
                          </svg>
                          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Underperformer</span>
                        </div>
                        <div className="text-lg font-semibold text-slate-900">{p.product}</div>
                        <p className="text-sm text-slate-600 mb-2">{p.concern}</p>
                        {p.suggestion && <p className="text-sm text-indigo-600 bg-indigo-50 rounded-lg px-3 py-2">💡 {p.suggestion}</p>}
                      </div>
                    ))}
                  </div>
                )}

                {/* Signals */}
                {sigResult.analysis.signals.length > 0 && (
                  <div className={`${CARD} ${CARD_PADDING} mb-4`}>
                    <p className={`${CARD_TITLE} text-amber-700`}>⚡ Notable Signals</p>
                    <ul className="space-y-2 mt-3">
                      {sigResult.analysis.signals.map((s, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm">
                          <span className="w-2 h-2 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                          <span className="text-slate-600">{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Raw stats table */}
                {sigResult.rawStats.length > 0 && (
                  <div className={`${CARD} overflow-hidden mb-4`}>
                    <div className="px-4 py-3.5 border-b border-slate-200">
                      <p className={CARD_TITLE}>Raw Stats per Product</p>
                    </div>
                    <div className={TABLE_WRAPPER}>
                      <table className={TABLE}>
                        <thead className={TABLE_HEAD}>
                          <tr>
                            <th className={TABLE_TH}>Product</th>
                            <th className={TABLE_TH}>Calls</th>
                            <th className={TABLE_TH}>Samples</th>
                            <th className={TABLE_TH}>Doctors</th>
                            <th className={TABLE_TH}>MRs</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sigResult.rawStats.map((row, i) => (
                            <tr key={i} className={TABLE_ROW}>
                              <td className={TABLE_TD}>{row.product}</td>
                              <td className={TABLE_TD}>{row.totalCalls}</td>
                              <td className={TABLE_TD}>{row.callsWithSamples}</td>
                              <td className={TABLE_TD}>{row.uniqueDoctors}</td>
                              <td className={TABLE_TD}>{row.uniqueMRs}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Idle state */}
            {!sigLoading && !sigResult && !sigError && (
              <div className={EMPTY_STATE}>
                <div className="w-16 h-16 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-4">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <p className={EMPTY_TITLE}>Run a product performance scan</p>
                <p className={EMPTY_DESC}>Apply optional filters and click "Run Product Signals" to see which products are thriving or struggling.</p>
              </div>
            )}
          </>
        )}

      </main>
    </div>
  )
}

export default ManagerInsights
