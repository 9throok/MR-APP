import { useState, useEffect } from 'react'
import { Sparkles, Star, Mic2, Users } from 'lucide-react'
import Header from './Header'
import Sidebar from './Sidebar'
import { apiGet, apiPost, apiPatch } from '../services/apiService'
import './KnowledgeUpload.css'
import './admin/AdminUI.css'
import {
  Badge,
  Banner,
  DataTable,
  Modal,
  StatCard,
  Toolbar,
  kolTierTone,
  sentimentTone,
  type DataTableColumn,
} from './admin'

interface KOLDashboardProps {
  onLogout: () => void
  onBack: () => void
  userName: string
  onNavigate: (page: string) => void
}

interface KOL {
  id: number
  doctor_id: number
  doctor_name: string
  specialty: string | null
  specialty_code: string | null
  territory: string | null
  commercial_tier: string | null
  kol_tier: 'T1' | 'T2' | 'T3' | 'emerging' | null
  influence_score: number | string | null
  advisory_board_member: boolean
  speaker_bureau: boolean
  publication_count: number
  sentiment_score: number | null
  last_engagement_at: string | null
  identified_by: 'human' | 'ai'
}

interface DoctorRow { id: number; name: string; specialty: string | null; territory: string | null }

interface KolSuggestion {
  recommended_tier: string
  influence_score: number
  rationale: string
  key_signals: string[]
  suggested_actions: string[]
  data_gaps: string[]
}

function KOLDashboard({ onLogout, onBack, userName, onNavigate }: KOLDashboardProps) {
  const [kols, setKols] = useState<KOL[]>([])
  const [stats, setStats] = useState<{ counters?: { total_kols: number; advisory_board_members: number; speaker_bureau_members: number; ai_suggested: number } }>({})
  const [doctors, setDoctors] = useState<DoctorRow[]>([])
  const [tierFilter, setTierFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showIdentify, setShowIdentify] = useState(false)
  const [identifyDoctorId, setIdentifyDoctorId] = useState('')
  const [suggestion, setSuggestion] = useState<KolSuggestion | null>(null)
  const [identifyLoading, setIdentifyLoading] = useState(false)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (tierFilter) params.append('tier', tierFilter)
      const [kolRes, statsRes, docs] = await Promise.all([
        apiGet(`/kols${params.toString() ? '?' + params.toString() : ''}`),
        apiGet('/kols/stats'),
        apiGet('/doctors'),
      ])
      setKols(kolRes.data || [])
      setStats(statsRes.data || {})
      setDoctors(docs.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { load() /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [tierFilter])

  const runIdentify = async () => {
    if (!identifyDoctorId) return
    setIdentifyLoading(true)
    setSuggestion(null)
    setError(null)
    try {
      const res = await apiPost(`/kols/identify/${identifyDoctorId}`, {})
      setSuggestion(res.data?.suggestion || null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'AI identify failed')
    } finally {
      setIdentifyLoading(false)
    }
  }

  const persistIdentify = async () => {
    if (!suggestion || !identifyDoctorId) return
    setIdentifyLoading(true)
    try {
      await apiPatch(`/kols/identify/${identifyDoctorId}`, { suggestion })
      setShowIdentify(false)
      setSuggestion(null)
      setIdentifyDoctorId('')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Persist failed')
    } finally {
      setIdentifyLoading(false)
    }
  }

  const closeIdentify = () => {
    setShowIdentify(false)
    setSuggestion(null)
    setIdentifyDoctorId('')
  }

  const columns: DataTableColumn<KOL>[] = [
    {
      key: 'doctor_name',
      label: 'Doctor',
      render: k => <span style={{ fontWeight: 600 }}>{k.doctor_name}</span>,
    },
    {
      key: 'specialty',
      label: 'Specialty',
      width: '160px',
      render: k => <span className="cell-muted">{k.specialty_code || k.specialty || '—'}</span>,
    },
    {
      key: 'territory',
      label: 'Territory',
      width: '130px',
      render: k => <span className="cell-muted">{k.territory || '—'}</span>,
    },
    {
      key: 'kol_tier',
      label: 'Tier',
      width: '100px',
      render: k => k.kol_tier ? <Badge tone={kolTierTone[k.kol_tier] || 'neutral'}>{k.kol_tier}</Badge> : <span className="cell-muted">—</span>,
    },
    {
      key: 'influence_score',
      label: 'Score',
      width: '70px',
      align: 'right',
      className: 'cell-num',
      render: k => k.influence_score ?? '—',
    },
    {
      key: 'advisory_board_member',
      label: 'Adv. board',
      width: '90px',
      render: k => k.advisory_board_member
        ? <Badge tone="success" icon={<Star size={11} fill="currentColor" />}>Yes</Badge>
        : <span className="cell-muted">—</span>,
    },
    {
      key: 'speaker_bureau',
      label: 'Speaker',
      width: '90px',
      render: k => k.speaker_bureau
        ? <Badge tone="info" icon={<Mic2 size={11} />}>Yes</Badge>
        : <span className="cell-muted">—</span>,
    },
    {
      key: 'publication_count',
      label: 'Pubs',
      width: '70px',
      align: 'right',
      className: 'cell-num',
      render: k => k.publication_count,
    },
    {
      key: 'sentiment',
      label: 'Sentiment',
      width: '110px',
      render: k => k.sentiment_score == null
        ? <span className="cell-muted">—</span>
        : <Badge tone={sentimentTone(k.sentiment_score)}>{k.sentiment_score > 0 ? '+' : ''}{k.sentiment_score}</Badge>,
    },
    {
      key: 'last_engagement_at',
      label: 'Last engagement',
      width: '140px',
      render: k => <span className="cell-muted">{k.last_engagement_at ? new Date(k.last_engagement_at).toLocaleDateString('en-IN') : '—'}</span>,
    },
    {
      key: 'identified_by',
      label: 'Source',
      width: '90px',
      render: k => k.identified_by === 'ai'
        ? <Badge tone="purple" icon={<Sparkles size={11} />}>AI</Badge>
        : <Badge tone="neutral">Human</Badge>,
    },
  ]

  return (
    <div className="knowledge-page">
      <Header onLogout={onLogout} onMenuClick={() => setSidebarOpen(true)} onNavigateHome={onBack} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} userName={userName} onNavigate={onNavigate} onLogout={onLogout} currentPage="kol-dashboard" />

      <div className="knowledge-content">
        <div className="admin-page-intro">
          <div>
            <h2 className="admin-page-title">KOL Dashboard</h2>
            <p className="admin-page-lead">
              Key Opinion Leaders ranked by influence score. Use AI Identify to score a candidate doctor based on visit history, RCPA, and affiliations.
            </p>
          </div>
          <button onClick={() => setShowIdentify(true)} className="btn btn-primary">
            <Sparkles size={14} />
            AI Identify KOL
          </button>
        </div>

        {error && <div className="admin-error">{error}</div>}

        {stats.counters && (
          <div className="admin-stat-grid">
            <StatCard label="Total KOLs" value={stats.counters.total_kols} icon={<Users size={12} />} />
            <StatCard label="Advisory board" value={stats.counters.advisory_board_members} icon={<Star size={12} />} />
            <StatCard label="Speaker bureau" value={stats.counters.speaker_bureau_members} icon={<Mic2 size={12} />} />
            <StatCard label="AI-suggested" value={stats.counters.ai_suggested} icon={<Sparkles size={12} />} />
          </div>
        )}

        <Toolbar>
          <Toolbar.Field label="Tier">
            <select value={tierFilter} onChange={e => setTierFilter(e.target.value)} className="admin-select" style={{ width: 140 }}>
              <option value="">All tiers</option>
              <option value="T1">T1</option>
              <option value="T2">T2</option>
              <option value="T3">T3</option>
              <option value="emerging">Emerging</option>
            </select>
          </Toolbar.Field>
          <button type="button" onClick={load} className="btn btn-secondary btn-sm">Refresh</button>
          <Toolbar.Spacer />
          <Toolbar.Count n={kols.length} noun="KOL" />
        </Toolbar>

        <DataTable
          columns={columns}
          rows={kols}
          rowKey={k => k.id}
          loading={loading}
          empty="No KOLs identified yet. Use AI Identify to score a candidate doctor."
        />
      </div>

      <Modal
        open={showIdentify}
        onClose={closeIdentify}
        title="AI KOL Identifier"
        subtitle="Pick a doctor; the AI bundles their DCR / RCPA / affiliation signals and suggests a tier."
        footer={
          suggestion ? (
            <>
              <button onClick={persistIdentify} disabled={identifyLoading} className="btn btn-primary btn-sm">
                {identifyLoading ? 'Saving…' : 'Confirm and persist'}
              </button>
              <button onClick={() => setSuggestion(null)} className="btn btn-secondary btn-sm">Discard</button>
              <span className="admin-modal-footer-spacer" />
              <button onClick={closeIdentify} className="btn btn-ghost btn-sm">Cancel</button>
            </>
          ) : (
            <>
              <button onClick={runIdentify} disabled={!identifyDoctorId || identifyLoading} className="btn btn-primary btn-sm">
                <Sparkles size={14} /> {identifyLoading ? 'Calling LLM…' : 'Run AI'}
              </button>
              <span className="admin-modal-footer-spacer" />
              <button onClick={closeIdentify} className="btn btn-secondary btn-sm">Cancel</button>
            </>
          )
        }
      >
        <div className="admin-stack-sm">
          <div>
            <label className="admin-field-label">Doctor</label>
            <select value={identifyDoctorId} onChange={e => setIdentifyDoctorId(e.target.value)} className="admin-select">
              <option value="">— select doctor —</option>
              {doctors.map(d => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.specialty || 'no specialty'} · {d.territory || 'no territory'})
                </option>
              ))}
            </select>
          </div>

          {suggestion && (
            <Banner tone="info" icon={<Sparkles size={16} />}>
              <div className="admin-stack-sm">
                <div className="admin-row" style={{ gap: 14 }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>Tier</div>
                    <Badge tone={kolTierTone[suggestion.recommended_tier] || 'neutral'}>{suggestion.recommended_tier}</Badge>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>Score</div>
                    <div style={{ fontSize: 18, fontWeight: 700 }}>{suggestion.influence_score}</div>
                  </div>
                </div>
                <div>
                  <strong>Rationale:</strong> {suggestion.rationale}
                </div>
                {suggestion.key_signals?.length > 0 && (
                  <div>
                    <strong>Signals:</strong> {suggestion.key_signals.join('; ')}
                  </div>
                )}
                {suggestion.suggested_actions?.length > 0 && (
                  <div>
                    <strong>Suggested actions:</strong>
                    <ul style={{ margin: '4px 0 0 20px' }}>
                      {suggestion.suggested_actions.map((a, i) => <li key={i}>{a}</li>)}
                    </ul>
                  </div>
                )}
                {suggestion.data_gaps?.length > 0 && (
                  <div style={{ fontSize: 12, color: '#92400e' }}>
                    <strong>Gaps:</strong> {suggestion.data_gaps.join('; ')}
                  </div>
                )}
              </div>
            </Banner>
          )}
        </div>
      </Modal>
    </div>
  )
}

export default KOLDashboard
