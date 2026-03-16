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

// ── Competitor Intelligence types ─────────────────────────────────
interface CompetitorTop {
  company: string
  mentions: number
  brands: string[]
  threat_level: 'high' | 'medium' | 'low'
  key_insight: string
}

interface CompetitorSegment {
  segment: string
  our_brand: string
  competitor_brand: string
  competitor_company: string
  insight: string
}

interface DoctorFeedbackTheme {
  theme: string
  frequency: string
  example: string
  action: string
}

interface MarketShareInsight {
  our_brand: string
  competitor_brand: string
  competitor_company: string
  our_value: number
  competitor_value: number
  gap_pct: number
  recommendation: string
}

interface CompetitorAnalysis {
  topCompetitors: CompetitorTop[]
  competitorBySegment: CompetitorSegment[]
  doctorFeedbackThemes: DoctorFeedbackTheme[]
  marketShareInsights: MarketShareInsight[]
  strategicRecommendations: string[]
  summary: string
}

interface CompetitorResponse {
  success: boolean
  period: string
  dcrMentionsCount: number
  rcpaRecords: number
  analysis: CompetitorAnalysis
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
  const [activeTab, setActiveTab] = useState<'query' | 'signals' | 'competitor'>('query')

  const ALL_MRS: { id: string; name: string; territory: string }[] = [
    { id: 'mr_rahul_001', name: 'Rahul Sharma', territory: 'Mumbai North' },
    { id: 'mr_priya_002', name: 'Priya Patel', territory: 'Mumbai South' },
    { id: 'mr_robert_003', name: 'Robert Johnson', territory: 'Delhi NCR' },
  ]

  // Manager Query state
  const [queryText, setQueryText] = useState('')
  const [querySelectedMRs, setQuerySelectedMRs] = useState<string[]>([])
  const [queryMRDropdownOpen, setQueryMRDropdownOpen] = useState(false)
  const [queryFromDate, setQueryFromDate] = useState('')
  const [queryToDate, setQueryToDate] = useState('')
  const [queryLoading, setQueryLoading] = useState(false)
  const [queryError, setQueryError] = useState<string | null>(null)
  const [queryResult, setQueryResult] = useState<QueryResponse | null>(null)

  // Product Signals state
  const [sigFromDate, setSigFromDate] = useState('')
  const [sigToDate, setSigToDate] = useState('')
  const [sigSelectedMRs, setSigSelectedMRs] = useState<string[]>([])
  const [sigMRDropdownOpen, setSigMRDropdownOpen] = useState(false)
  const [sigSelectedProducts, setSigSelectedProducts] = useState<string[]>([])
  const [sigProductDropdownOpen, setSigProductDropdownOpen] = useState(false)
  const [sigLoading, setSigLoading] = useState(false)
  const [sigError, setSigError] = useState<string | null>(null)
  const [sigResult, setSigResult] = useState<SignalsResponse | null>(null)

  // Competitor Intelligence state
  const [compFromDate, setCompFromDate] = useState('')
  const [compToDate, setCompToDate] = useState('')
  const [compSelectedMRs, setCompSelectedMRs] = useState<string[]>([])
  const [compMRDropdownOpen, setCompMRDropdownOpen] = useState(false)
  const [compLoading, setCompLoading] = useState(false)
  const [compError, setCompError] = useState<string | null>(null)
  const [compResult, setCompResult] = useState<CompetitorResponse | null>(null)

  const ALL_PRODUCTS = [
    'Derise 10mg', 'Derise 20mg', 'Derise 50mg',
    'Rilast Tablet', 'Rilast Capsule', 'Rilast Syrup',
    'Bevaas 5mg', 'Bevaas 10mg', 'Bevaas 20mg',
  ]

  const toggleProduct = (product: string) => {
    setSigSelectedProducts(prev =>
      prev.includes(product) ? prev.filter(p => p !== product) : [...prev, product]
    )
  }

  const toggleMR = (list: string[], setList: (v: string[]) => void, id: string) => {
    setList(list.includes(id) ? list.filter(x => x !== id) : [...list, id])
  }

  const getMRLabel = (ids: string[]) => {
    if (ids.length === 0) return 'All MRs'
    if (ids.length === 1) {
      const mr = ALL_MRS.find(m => m.id === ids[0])
      return mr ? mr.name : ids[0]
    }
    return `${ids.length} MRs selected`
  }

  // ── Manager Query submit ──────────────────────────────────────
  const handleQuerySubmit = async () => {
    if (!queryText.trim()) return
    setQueryLoading(true)
    setQueryError(null)
    setQueryResult(null)
    try {
      const body: Record<string, unknown> = { query: queryText.trim() }
      if (querySelectedMRs.length > 0) {
        body.user_ids = querySelectedMRs
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
      if (sigSelectedMRs.length > 0) params.set('user_ids', sigSelectedMRs.join(','))
      if (sigSelectedProducts.length > 0) params.set('products', sigSelectedProducts.join(','))
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

  // ── Competitor Intelligence fetch ─────────────────────────────
  const handleCompetitorFetch = async () => {
    setCompLoading(true)
    setCompError(null)
    setCompResult(null)
    try {
      const params = new URLSearchParams()
      if (compFromDate) params.set('from_date', compFromDate)
      if (compToDate) params.set('to_date', compToDate)
      if (compSelectedMRs.length > 0) params.set('user_ids', compSelectedMRs.join(','))
      const qs = params.toString() ? `?${params.toString()}` : ''

      const json = await apiGet(`/ai/competitor-intel${qs}`) as CompetitorResponse
      if (!json.success) throw new Error('Competitor intel fetch failed')
      setCompResult(json)
    } catch (err) {
      setCompError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setCompLoading(false)
    }
  }

  const threatColor: Record<string, string> = {
    high: '#ef4444',
    medium: '#f59e0b',
    low: '#22c55e',
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
          <button
            className={`mi-tab ${activeTab === 'competitor' ? 'mi-tab-active competitor-tab' : ''}`}
            onClick={() => setActiveTab('competitor')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M17 21V19C17 17.9 16.1 17 15 17H5C3.9 17 3 17.9 3 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="10" cy="11" r="4" stroke="currentColor" strokeWidth="2"/>
              <path d="M23 21V19C22.99 18.13 22.42 17.36 21.6 17.07" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M17.6 3.07C18.42 3.36 18.99 4.13 19 5C19 5.87 18.42 6.64 17.6 6.93" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Competitor Intel
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
                  <span className="mi-filter-label">MR Representatives</span>
                  <div className="mi-mr-dropdown">
                    <button
                      type="button"
                      className="mi-mr-dropdown-trigger"
                      onClick={() => setQueryMRDropdownOpen(prev => !prev)}
                    >
                      <span className="mi-mr-dropdown-text">{getMRLabel(querySelectedMRs)}</span>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className={`mi-product-chevron ${queryMRDropdownOpen ? 'open' : ''}`}>
                        <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                    {queryMRDropdownOpen && (
                      <div className="mi-product-dropdown-menu">
                        <button
                          type="button"
                          className="mi-product-option mi-mr-clear"
                          onClick={() => { setQuerySelectedMRs([]); setQueryMRDropdownOpen(false) }}
                        >
                          All MRs (clear filter)
                        </button>
                        {ALL_MRS.map(mr => (
                          <label key={mr.id} className="mi-product-option">
                            <input
                              type="checkbox"
                              checked={querySelectedMRs.includes(mr.id)}
                              onChange={() => toggleMR(querySelectedMRs, setQuerySelectedMRs, mr.id)}
                            />
                            <span className="mi-mr-option-info">
                              <span className="mi-mr-option-name">{mr.name}</span>
                              <span className="mi-mr-option-territory">{mr.territory}</span>
                            </span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                  {querySelectedMRs.length > 0 && (
                    <div className="mi-mr-tags">
                      {querySelectedMRs.map(id => {
                        const mr = ALL_MRS.find(m => m.id === id)
                        return (
                          <span key={id} className="mi-mr-tag">
                            {mr?.name || id}
                            <button type="button" onClick={() => toggleMR(querySelectedMRs, setQuerySelectedMRs, id)} className="mi-product-tag-remove">&times;</button>
                          </span>
                        )
                      })}
                    </div>
                  )}
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
                  <span className="mi-filter-label">MR Representatives</span>
                  <div className="mi-mr-dropdown">
                    <button
                      type="button"
                      className="mi-mr-dropdown-trigger"
                      onClick={() => setSigMRDropdownOpen(prev => !prev)}
                    >
                      <span className="mi-mr-dropdown-text">{getMRLabel(sigSelectedMRs)}</span>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className={`mi-product-chevron ${sigMRDropdownOpen ? 'open' : ''}`}>
                        <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                    {sigMRDropdownOpen && (
                      <div className="mi-product-dropdown-menu">
                        <button
                          type="button"
                          className="mi-product-option mi-mr-clear"
                          onClick={() => { setSigSelectedMRs([]); setSigMRDropdownOpen(false) }}
                        >
                          All MRs (clear filter)
                        </button>
                        {ALL_MRS.map(mr => (
                          <label key={mr.id} className="mi-product-option">
                            <input
                              type="checkbox"
                              checked={sigSelectedMRs.includes(mr.id)}
                              onChange={() => toggleMR(sigSelectedMRs, setSigSelectedMRs, mr.id)}
                            />
                            <span className="mi-mr-option-info">
                              <span className="mi-mr-option-name">{mr.name}</span>
                              <span className="mi-mr-option-territory">{mr.territory}</span>
                            </span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                  {sigSelectedMRs.length > 0 && (
                    <div className="mi-mr-tags">
                      {sigSelectedMRs.map(id => {
                        const mr = ALL_MRS.find(m => m.id === id)
                        return (
                          <span key={id} className="mi-mr-tag">
                            {mr?.name || id}
                            <button type="button" onClick={() => toggleMR(sigSelectedMRs, setSigSelectedMRs, id)} className="mi-product-tag-remove">&times;</button>
                          </span>
                        )
                      })}
                    </div>
                  )}
                </div>
                <div className="mi-filter-group full-width">
                  <span className="mi-filter-label">Products</span>
                  <div className="mi-product-dropdown">
                    <button
                      type="button"
                      className="mi-product-dropdown-trigger"
                      onClick={() => setSigProductDropdownOpen(prev => !prev)}
                    >
                      <span className="mi-product-dropdown-text">
                        {sigSelectedProducts.length === 0
                          ? 'All products'
                          : sigSelectedProducts.length === 1
                            ? sigSelectedProducts[0]
                            : `${sigSelectedProducts.length} products selected`}
                      </span>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className={`mi-product-chevron ${sigProductDropdownOpen ? 'open' : ''}`}>
                        <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                    {sigProductDropdownOpen && (
                      <div className="mi-product-dropdown-menu">
                        <button
                          type="button"
                          className="mi-product-option mi-product-clear"
                          onClick={() => { setSigSelectedProducts([]); setSigProductDropdownOpen(false) }}
                        >
                          All products (clear filter)
                        </button>
                        {ALL_PRODUCTS.map(product => (
                          <label key={product} className="mi-product-option">
                            <input
                              type="checkbox"
                              checked={sigSelectedProducts.includes(product)}
                              onChange={() => toggleProduct(product)}
                            />
                            <span>{product}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                  {sigSelectedProducts.length > 0 && (
                    <div className="mi-product-tags">
                      {sigSelectedProducts.map(p => (
                        <span key={p} className="mi-product-tag">
                          {p}
                          <button type="button" onClick={() => toggleProduct(p)} className="mi-product-tag-remove">&times;</button>
                        </span>
                      ))}
                    </div>
                  )}
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

        {/* ══════════════════ TAB 3 — Competitor Intelligence ═══════ */}
        {activeTab === 'competitor' && (
          <>
            {/* Filters */}
            <div className="mi-filter-card">
              <p className="mi-filter-title">Filters (all optional)</p>
              <div className="mi-filter-grid">
                <div className="mi-filter-group">
                  <span className="mi-filter-label">From Date</span>
                  <input type="date" className="mi-filter-input" value={compFromDate} onChange={e => setCompFromDate(e.target.value)} />
                </div>
                <div className="mi-filter-group">
                  <span className="mi-filter-label">To Date</span>
                  <input type="date" className="mi-filter-input" value={compToDate} onChange={e => setCompToDate(e.target.value)} />
                </div>
                <div className="mi-filter-group full-width">
                  <span className="mi-filter-label">MR Representatives</span>
                  <div className="mi-mr-dropdown">
                    <button
                      type="button"
                      className="mi-mr-dropdown-trigger"
                      onClick={() => setCompMRDropdownOpen(prev => !prev)}
                    >
                      <span className="mi-mr-dropdown-text">{getMRLabel(compSelectedMRs)}</span>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className={`mi-product-chevron ${compMRDropdownOpen ? 'open' : ''}`}>
                        <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                    {compMRDropdownOpen && (
                      <div className="mi-product-dropdown-menu">
                        <button
                          type="button"
                          className="mi-product-option mi-mr-clear"
                          onClick={() => { setCompSelectedMRs([]); setCompMRDropdownOpen(false) }}
                        >
                          All MRs (clear filter)
                        </button>
                        {ALL_MRS.map(mr => (
                          <label key={mr.id} className="mi-product-option">
                            <input
                              type="checkbox"
                              checked={compSelectedMRs.includes(mr.id)}
                              onChange={() => toggleMR(compSelectedMRs, setCompSelectedMRs, mr.id)}
                            />
                            <span className="mi-mr-option-info">
                              <span className="mi-mr-option-name">{mr.name}</span>
                              <span className="mi-mr-option-territory">{mr.territory}</span>
                            </span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                  {compSelectedMRs.length > 0 && (
                    <div className="mi-mr-tags">
                      {compSelectedMRs.map(id => {
                        const mr = ALL_MRS.find(m => m.id === id)
                        return (
                          <span key={id} className="mi-mr-tag">
                            {mr?.name || id}
                            <button type="button" onClick={() => toggleMR(compSelectedMRs, setCompSelectedMRs, id)} className="mi-product-tag-remove">&times;</button>
                          </span>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
              <button
                className="mi-submit-btn competitor"
                onClick={handleCompetitorFetch}
                disabled={compLoading}
              >
                {compLoading ? <Spinner /> : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M17 21V19C17 17.9 16.1 17 15 17H5C3.9 17 3 17.9 3 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="10" cy="11" r="4" stroke="currentColor" strokeWidth="2"/>
                    <path d="M23 21V19C22.99 18.13 22.42 17.36 21.6 17.07" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
                {compLoading ? 'Analysing…' : 'Run Competitor Analysis'}
              </button>
            </div>

            {/* Error */}
            {compError && (
              <div className="mi-error">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                  <path d="M12 8V12M12 16H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                {compError}
              </div>
            )}

            {/* Loading */}
            {compLoading && (
              <div className="mi-loading">
                <div className="mi-loading-icon competitor">
                  <Spinner />
                </div>
                <div>
                  <p className="mi-loading-title">Scanning competitor landscape…</p>
                  <p className="mi-loading-sub">Analysing DCR mentions and RCPA prescription data</p>
                </div>
              </div>
            )}

            {/* Results */}
            {!compLoading && compResult && compResult.analysis && (
              <>
                {/* Executive Summary */}
                <div className="ci-summary-card">
                  <div className="mi-answer-header">
                    <div className="ci-summary-icon">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <path d="M17 21V19C17 17.9 16.1 17 15 17H5C3.9 17 3 17.9 3 19V21" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <circle cx="10" cy="11" r="4" stroke="white" strokeWidth="2"/>
                      </svg>
                    </div>
                    <span className="ci-summary-label">Competitor Intelligence Summary</span>
                    <span className="mi-answer-meta">{compResult.dcrMentionsCount} DCR mentions · {compResult.rcpaRecords} RCPA records</span>
                  </div>
                  <p className="ci-summary-text">{compResult.analysis.summary}</p>
                </div>

                {/* Top Competitors */}
                {compResult.analysis.topCompetitors?.length > 0 && (
                  <div className="ci-section">
                    <p className="mi-card-title ci-section-title">Top Competitors</p>
                    <div className="ci-competitors-grid">
                      {compResult.analysis.topCompetitors.map((comp, i) => (
                        <div key={i} className="ci-competitor-card">
                          <div className="ci-competitor-header">
                            <span className="ci-competitor-rank">#{i + 1}</span>
                            <span className="ci-competitor-name">{comp.company}</span>
                            <span className="ci-threat-badge" style={{ background: threatColor[comp.threat_level] || '#94a3b8' }}>
                              {comp.threat_level?.toUpperCase()}
                            </span>
                          </div>
                          <div className="ci-competitor-mentions">{comp.mentions} mention{comp.mentions !== 1 ? 's' : ''}</div>
                          <div className="ci-competitor-brands">
                            {comp.brands?.map((b, j) => (
                              <span key={j} className="ci-brand-tag">{b}</span>
                            ))}
                          </div>
                          <p className="ci-competitor-insight">{comp.key_insight}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Market Share Insights */}
                {compResult.analysis.marketShareInsights?.length > 0 && (
                  <div className="ci-section">
                    <p className="mi-card-title ci-section-title">Market Share Gaps</p>
                    <div className="ci-market-grid">
                      {compResult.analysis.marketShareInsights.map((ms, i) => (
                        <div key={i} className="ci-market-card">
                          <div className="ci-market-header">
                            <span className="ci-market-our">{ms.our_brand}</span>
                            <span className="ci-market-vs">vs</span>
                            <span className="ci-market-comp">{ms.competitor_brand}</span>
                          </div>
                          <div className="ci-market-bars">
                            <div className="ci-bar-row">
                              <span className="ci-bar-label">Ours</span>
                              <div className="ci-bar-track">
                                <div
                                  className="ci-bar-fill ours"
                                  style={{ width: `${Math.min(100, (ms.our_value / Math.max(ms.our_value, ms.competitor_value)) * 100)}%` }}
                                />
                              </div>
                              <span className="ci-bar-value">{ms.our_value}</span>
                            </div>
                            <div className="ci-bar-row">
                              <span className="ci-bar-label">Theirs</span>
                              <div className="ci-bar-track">
                                <div
                                  className="ci-bar-fill theirs"
                                  style={{ width: `${Math.min(100, (ms.competitor_value / Math.max(ms.our_value, ms.competitor_value)) * 100)}%` }}
                                />
                              </div>
                              <span className="ci-bar-value">{ms.competitor_value}</span>
                            </div>
                          </div>
                          {ms.gap_pct > 0 && <div className="ci-gap-badge">{Math.round(ms.gap_pct)}% gap</div>}
                          <p className="ci-market-rec">{ms.recommendation}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Segment Analysis */}
                {compResult.analysis.competitorBySegment?.length > 0 && (
                  <div className="ci-section">
                    <p className="mi-card-title ci-section-title">Competitor by Segment</p>
                    <div className="ci-segments-list">
                      {compResult.analysis.competitorBySegment.map((seg, i) => (
                        <div key={i} className="ci-segment-card">
                          <div className="ci-segment-header">
                            <span className="ci-segment-name">{seg.segment}</span>
                          </div>
                          <div className="ci-segment-matchup">
                            <span className="ci-segment-our">{seg.our_brand}</span>
                            <span className="ci-segment-vs">vs</span>
                            <span className="ci-segment-comp">{seg.competitor_brand} ({seg.competitor_company})</span>
                          </div>
                          <p className="ci-segment-insight">{seg.insight}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Doctor Feedback Themes */}
                {compResult.analysis.doctorFeedbackThemes?.length > 0 && (
                  <div className="ci-section">
                    <p className="mi-card-title ci-section-title">Doctor Feedback Themes</p>
                    <div className="ci-themes-list">
                      {compResult.analysis.doctorFeedbackThemes.map((theme, i) => (
                        <div key={i} className="ci-theme-card">
                          <div className="ci-theme-header">
                            <span className="ci-theme-name">{theme.theme}</span>
                            <span className="ci-theme-freq">{theme.frequency}</span>
                          </div>
                          <p className="ci-theme-example">"{theme.example}"</p>
                          <p className="ci-theme-action">{theme.action}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Strategic Recommendations */}
                {compResult.analysis.strategicRecommendations?.length > 0 && (
                  <div className="ci-section">
                    <p className="mi-card-title ci-section-title">Strategic Recommendations</p>
                    <div className="ci-recommendations">
                      {compResult.analysis.strategicRecommendations.map((rec, i) => (
                        <div key={i} className="ci-rec-item">
                          <span className="ci-rec-number">{i + 1}</span>
                          <p className="ci-rec-text">{rec}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Idle state */}
            {!compLoading && !compResult && !compError && (
              <div className="mi-idle">
                <div className="mi-idle-icon competitor">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                    <path d="M17 21V19C17 17.9 16.1 17 15 17H5C3.9 17 3 17.9 3 19V21" stroke="#e11d48" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="10" cy="11" r="4" stroke="#e11d48" strokeWidth="1.5"/>
                    <path d="M23 21V19C22.99 18.13 22.42 17.36 21.6 17.07" stroke="#e11d48" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <p className="mi-idle-title">Run a competitor intelligence scan</p>
                <p className="mi-idle-sub">Analyses DCR call reports for competitor mentions and RCPA prescription data to surface competitive threats, market share gaps, and strategic recommendations.</p>
              </div>
            )}
          </>
        )}

      </main>
    </div>
  )
}

export default ManagerInsights
