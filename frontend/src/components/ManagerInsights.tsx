import { useState } from 'react'
import Header from './Header'
import Sidebar from './Sidebar'
import { apiPost, apiGet } from '../services/apiService'
import './ManagerInsights.css'

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
function ManagerInsights({ onLogout, onBack, userName, onNavigate }: ManagerInsightsProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
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
    <div className="mi-container">
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
        currentPage="manager-insights"
      />

      <main className="mi-content">

        {/* Page header */}
        <div className="mi-page-header">
          <button className="mi-back-btn" onClick={onBack} aria-label="Go back">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div>
            <h1 className="mi-page-title">Manager Insights</h1>
            <p className="mi-page-subtitle">AI-powered team intelligence &amp; product performance</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="mi-tabs">
          <button
            className={`mi-tab ${activeTab === 'query' ? 'mi-tab-active' : ''}`}
            onClick={() => setActiveTab('query')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Manager Query
          </button>
          <button
            className={`mi-tab ${activeTab === 'signals' ? 'mi-tab-active signals-tab' : ''}`}
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
            <div className="mi-query-card">
              <label className="mi-query-label">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="#0ea5e9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Ask a question about your team
              </label>
              <textarea
                className="mi-query-textarea"
                rows={4}
                placeholder='e.g. "How is Lipidex performing across the team?" or "Which MR had the most calls last week?"'
                value={queryText}
                onChange={e => setQueryText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleQuerySubmit() }}
              />
            </div>

            {/* Optional filters */}
            <div className="mi-filter-card">
              <p className="mi-filter-title">Optional Filters</p>
              <div className="mi-filter-grid">
                <div className="mi-filter-group">
                  <span className="mi-filter-label">From Date</span>
                  <input type="date" className="mi-filter-input" value={queryFromDate} onChange={e => setQueryFromDate(e.target.value)} />
                </div>
                <div className="mi-filter-group">
                  <span className="mi-filter-label">To Date</span>
                  <input type="date" className="mi-filter-input" value={queryToDate} onChange={e => setQueryToDate(e.target.value)} />
                </div>
                <div className="mi-filter-group full-width">
                  <span className="mi-filter-label">MR User IDs (comma-separated)</span>
                  <input
                    type="text"
                    className="mi-filter-input"
                    placeholder="e.g. mr_rahul_001, mr_priya_002"
                    value={queryUserIds}
                    onChange={e => setQueryUserIds(e.target.value)}
                  />
                </div>
              </div>
              <button
                className="mi-submit-btn"
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
              <div className="mi-error">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                  <path d="M12 8V12M12 16H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                {queryError}
              </div>
            )}

            {/* Loading */}
            {queryLoading && (
              <div className="mi-loading">
                <div className="mi-loading-icon query">
                  <Spinner />
                </div>
                <div>
                  <p className="mi-loading-title">Thinking…</p>
                  <p className="mi-loading-sub">Fetching DCRs and running AI analysis</p>
                </div>
              </div>
            )}

            {/* Result */}
            {!queryLoading && queryResult && (
              <>
                {/* Answer */}
                <div className="mi-answer-card">
                  <div className="mi-answer-header">
                    <div className="mi-answer-icon">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" fill="white"/>
                      </svg>
                    </div>
                    <span className="mi-answer-label">AI Answer</span>
                    <span className="mi-answer-meta">{queryResult.recordsAnalysed} records analysed</span>
                  </div>
                  <p className="mi-answer-text">{queryResult.result.answer}</p>
                </div>

                {/* Supporting data */}
                {queryResult.result.supportingData.length > 0 && (
                  <div className="mi-support-card">
                    <p className="mi-card-title">Supporting Data</p>
                    <ul className="mi-data-list">
                      {queryResult.result.supportingData.map((point, i) => (
                        <li key={i} className="mi-data-item">
                          <span className="mi-data-dot" />
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Follow-up suggestions */}
                {queryResult.result.followUpSuggestions.length > 0 && (
                  <div className="mi-followup-card">
                    <p className="mi-card-title" style={{ color: '#059669' }}>Suggested Follow-ups</p>
                    <ul className="mi-followup-list">
                      {queryResult.result.followUpSuggestions.map((s, i) => (
                        <li key={i} className="mi-followup-item" onClick={() => handleFollowUp(s)}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          {s}
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="mi-followup-arrow">
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
              <div className="mi-idle">
                <div className="mi-idle-icon query">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="#0ea5e9" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <p className="mi-idle-title">Ask anything about your team</p>
                <p className="mi-idle-sub">Type a question above and the AI will analyse your team's DCR data to answer it.</p>
              </div>
            )}
          </>
        )}

        {/* ══════════════════ TAB 2 — Product Signals ════════════════ */}
        {activeTab === 'signals' && (
          <>
            {/* Filters */}
            <div className="mi-filter-card">
              <p className="mi-filter-title">Filters (all optional)</p>
              <div className="mi-filter-grid">
                <div className="mi-filter-group">
                  <span className="mi-filter-label">From Date</span>
                  <input type="date" className="mi-filter-input" value={sigFromDate} onChange={e => setSigFromDate(e.target.value)} />
                </div>
                <div className="mi-filter-group">
                  <span className="mi-filter-label">To Date</span>
                  <input type="date" className="mi-filter-input" value={sigToDate} onChange={e => setSigToDate(e.target.value)} />
                </div>
                <div className="mi-filter-group full-width">
                  <span className="mi-filter-label">MR User IDs (comma-separated)</span>
                  <input
                    type="text"
                    className="mi-filter-input"
                    placeholder="e.g. mr_rahul_001, mr_priya_002  (leave blank for all)"
                    value={sigUserIds}
                    onChange={e => setSigUserIds(e.target.value)}
                  />
                </div>
              </div>
              <button
                className="mi-submit-btn signals"
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
              <div className="mi-error">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                  <path d="M12 8V12M12 16H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                {sigError}
              </div>
            )}

            {/* Loading */}
            {sigLoading && (
              <div className="mi-loading">
                <div className="mi-loading-icon signals">
                  <Spinner />
                </div>
                <div>
                  <p className="mi-loading-title">Analysing products…</p>
                  <p className="mi-loading-sub">Aggregating team DCR data and running AI</p>
                </div>
              </div>
            )}

            {/* Results */}
            {!sigLoading && sigResult && (
              <>
                {/* AI Summary */}
                <div className="mi-summary-card">
                  <div className="mi-answer-header">
                    <div className="mi-summary-icon">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <path d="M22 12h-4l-3 9L9 3l-3 9H2" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <span className="mi-summary-label">AI Summary</span>
                    <span className="mi-answer-meta">{sigResult.productsAnalysed} products · {sigResult.period}</span>
                  </div>
                  <p className="mi-summary-text">{sigResult.analysis.summary}</p>
                </div>

                {/* Top & Under performers */}
                {(sigResult.analysis.topPerformers.length > 0 || sigResult.analysis.underperformers.length > 0) && (
                  <div className="mi-performers-grid">
                    {sigResult.analysis.topPerformers.map((p, i) => (
                      <div key={i} className="mi-performer-card top">
                        <div className="mi-performer-header">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="#22c55e"/>
                          </svg>
                          <span className="mi-performer-label">Top Performer</span>
                        </div>
                        <div className="mi-performer-name">{p.product}</div>
                        <p className="mi-performer-reason">{p.reason}</p>
                      </div>
                    ))}
                    {sigResult.analysis.underperformers.map((p, i) => (
                      <div key={i} className="mi-performer-card under">
                        <div className="mi-performer-header">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="#ef4444"/>
                          </svg>
                          <span className="mi-performer-label">Underperformer</span>
                        </div>
                        <div className="mi-performer-name">{p.product}</div>
                        <p className="mi-performer-reason">{p.concern}</p>
                        {p.suggestion && <p className="mi-performer-suggestion">💡 {p.suggestion}</p>}
                      </div>
                    ))}
                  </div>
                )}

                {/* Signals */}
                {sigResult.analysis.signals.length > 0 && (
                  <div className="mi-signals-card">
                    <p className="mi-card-title" style={{ color: '#b45309' }}>⚡ Notable Signals</p>
                    <ul className="mi-signals-list">
                      {sigResult.analysis.signals.map((s, i) => (
                        <li key={i} className="mi-signal-item">
                          <span className="mi-signal-dot" />
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Raw stats table */}
                {sigResult.rawStats.length > 0 && (
                  <div className="mi-stats-card">
                    <div style={{ padding: '14px 16px 10px', borderBottom: '1px solid #e2e8f0' }}>
                      <p className="mi-card-title" style={{ margin: 0 }}>Raw Stats per Product</p>
                    </div>
                    <div className="mi-stats-table-wrap">
                      <table className="mi-stats-table">
                        <thead>
                          <tr>
                            <th>Product</th>
                            <th>Calls</th>
                            <th>Samples</th>
                            <th>Doctors</th>
                            <th>MRs</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sigResult.rawStats.map((row, i) => (
                            <tr key={i}>
                              <td>{row.product}</td>
                              <td>{row.totalCalls}</td>
                              <td>{row.callsWithSamples}</td>
                              <td>{row.uniqueDoctors}</td>
                              <td>{row.uniqueMRs}</td>
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
              <div className="mi-idle">
                <div className="mi-idle-icon signals">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2" stroke="#8b5cf6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <p className="mi-idle-title">Run a product performance scan</p>
                <p className="mi-idle-sub">Apply optional filters and click "Run Product Signals" to see which products are thriving or struggling.</p>
              </div>
            )}
          </>
        )}

      </main>
    </div>
  )
}

export default ManagerInsights
