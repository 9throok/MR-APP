import { useState, useEffect } from 'react'
import Header from './Header'
import Sidebar from './Sidebar'
import { apiGet, apiPost, apiPatch } from '../services/apiService'
import './KnowledgeUpload.css'

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

const TIER_COLOR: Record<string, string> = {
  T1: '#7f1d1d',
  T2: '#b45309',
  T3: '#374151',
  emerging: '#2563eb',
}

function KOLDashboard({ onLogout, onBack, userName, onNavigate }: KOLDashboardProps) {
  const [kols, setKols] = useState<KOL[]>([])
  const [stats, setStats] = useState<{ byTier?: { kol_tier: string | null; total: number }[]; counters?: { total_kols: number; advisory_board_members: number; speaker_bureau_members: number; ai_suggested: number } }>({})
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

  return (
    <div className="knowledge-page">
      <Header onLogout={onLogout} onMenuClick={() => setSidebarOpen(true)} onNavigateHome={onBack} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} userName={userName} onNavigate={onNavigate} onLogout={onLogout} currentPage="kol-dashboard" />

      <div className="knowledge-content">
        <div className="entries-section">
          <h2 style={{ marginTop: 0 }}>KOL Dashboard</h2>
          <p style={{ color: '#6b7280', fontSize: 14 }}>Key Opinion Leaders ranked by influence score. Use AI Identify to score a candidate doctor based on visit history, RCPA, and affiliations.</p>

          {error && <div style={{ color: '#b91c1c', marginBottom: 12 }}>{error}</div>}

          {stats.counters && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12, marginBottom: 24 }}>
              <Counter label="Total KOLs" value={stats.counters.total_kols} />
              <Counter label="Advisory board" value={stats.counters.advisory_board_members} />
              <Counter label="Speaker bureau" value={stats.counters.speaker_bureau_members} />
              <Counter label="AI-suggested" value={stats.counters.ai_suggested} />
            </div>
          )}

          <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
            <select value={tierFilter} onChange={e => setTierFilter(e.target.value)} style={{ padding: 8, border: '1px solid #d1d5db', borderRadius: 4 }}>
              <option value="">All tiers</option>
              <option value="T1">T1</option>
              <option value="T2">T2</option>
              <option value="T3">T3</option>
              <option value="emerging">emerging</option>
            </select>
            <button onClick={load} className="upload-btn" style={{ padding: '8px 16px' }}>Refresh</button>
            <button onClick={() => setShowIdentify(v => !v)} className="upload-btn" style={{ padding: '8px 16px', marginLeft: 'auto' }}>{showIdentify ? 'Cancel' : '⚡ AI Identify KOL'}</button>
          </div>

          {showIdentify && (
            <div style={{ background: '#f9fafb', padding: 16, borderRadius: 6, marginBottom: 24 }}>
              <h4 style={{ marginTop: 0 }}>AI KOL Identifier</h4>
              <p style={{ fontSize: 13, color: '#6b7280' }}>Pick a doctor; the AI bundles their DCR / RCPA / affiliation signals and suggests a tier.</p>
              <div style={{ display: 'flex', gap: 8 }}>
                <select value={identifyDoctorId} onChange={e => setIdentifyDoctorId(e.target.value)} style={{ flex: 1, padding: 6, border: '1px solid #d1d5db', borderRadius: 4 }}>
                  <option value="">— select doctor —</option>
                  {doctors.map(d => <option key={d.id} value={d.id}>{d.name} ({d.specialty || 'no specialty'} · {d.territory || 'no territory'})</option>)}
                </select>
                <button onClick={runIdentify} disabled={!identifyDoctorId || identifyLoading} className="upload-btn">{identifyLoading ? 'Calling LLM…' : 'Run'}</button>
              </div>

              {suggestion && (
                <div style={{ marginTop: 16, padding: 12, background: 'white', border: '1px solid #e5e7eb', borderRadius: 4 }}>
                  <div style={{ marginBottom: 8 }}>
                    <strong>Tier suggestion:</strong> <span style={{ color: TIER_COLOR[suggestion.recommended_tier] || '#374151', fontWeight: 700 }}>{suggestion.recommended_tier}</span>
                    {' · '}
                    <strong>Score:</strong> {suggestion.influence_score}
                  </div>
                  <div style={{ marginBottom: 8 }}><strong>Rationale:</strong> {suggestion.rationale}</div>
                  {suggestion.key_signals?.length > 0 && (
                    <div style={{ marginBottom: 8 }}><strong>Signals:</strong> {suggestion.key_signals.join('; ')}</div>
                  )}
                  {suggestion.suggested_actions?.length > 0 && (
                    <div style={{ marginBottom: 8 }}><strong>Suggested actions:</strong>
                      <ul style={{ margin: '4px 0 0 20px' }}>
                        {suggestion.suggested_actions.map((a, i) => <li key={i} style={{ fontSize: 13 }}>{a}</li>)}
                      </ul>
                    </div>
                  )}
                  {suggestion.data_gaps?.length > 0 && (
                    <div style={{ fontSize: 12, color: '#b45309' }}>Gaps: {suggestion.data_gaps.join('; ')}</div>
                  )}
                  <div style={{ marginTop: 12 }}>
                    <button onClick={persistIdentify} disabled={identifyLoading} style={{ padding: '8px 14px', background: '#15803d', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Confirm + persist</button>
                    <button onClick={() => setSuggestion(null)} style={{ padding: '8px 14px', marginLeft: 8, background: 'white', color: '#374151', border: '1px solid #d1d5db', borderRadius: 4, cursor: 'pointer' }}>Discard</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {loading ? <div>Loading…</div> : kols.length === 0 ? (
            <div style={{ color: '#6b7280', padding: 24, textAlign: 'center' }}>No KOLs identified yet.</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e5e7eb', textAlign: 'left' }}>
                  <th style={{ padding: 8 }}>Doctor</th>
                  <th style={{ padding: 8 }}>Specialty</th>
                  <th style={{ padding: 8 }}>Territory</th>
                  <th style={{ padding: 8 }}>Tier</th>
                  <th style={{ padding: 8 }}>Score</th>
                  <th style={{ padding: 8 }}>Adv. board</th>
                  <th style={{ padding: 8 }}>Speaker</th>
                  <th style={{ padding: 8 }}>Pubs</th>
                  <th style={{ padding: 8 }}>Last engagement</th>
                  <th style={{ padding: 8 }}>Source</th>
                </tr>
              </thead>
              <tbody>
                {kols.map(k => (
                  <tr key={k.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: 8, fontSize: 13, fontWeight: 600 }}>{k.doctor_name}</td>
                    <td style={{ padding: 8, fontSize: 13 }}>{k.specialty_code || k.specialty || '—'}</td>
                    <td style={{ padding: 8, fontSize: 13 }}>{k.territory || '—'}</td>
                    <td style={{ padding: 8, fontSize: 13, color: k.kol_tier ? TIER_COLOR[k.kol_tier] : '#6b7280', fontWeight: 700 }}>{k.kol_tier || '—'}</td>
                    <td style={{ padding: 8, fontSize: 13 }}>{k.influence_score ?? '—'}</td>
                    <td style={{ padding: 8, fontSize: 13 }}>{k.advisory_board_member ? '✓' : '—'}</td>
                    <td style={{ padding: 8, fontSize: 13 }}>{k.speaker_bureau ? '✓' : '—'}</td>
                    <td style={{ padding: 8, fontSize: 13 }}>{k.publication_count}</td>
                    <td style={{ padding: 8, fontSize: 12 }}>{k.last_engagement_at ? new Date(k.last_engagement_at).toLocaleDateString('en-IN') : '—'}</td>
                    <td style={{ padding: 8, fontSize: 12 }}>{k.identified_by}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}

function Counter({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ padding: 12, background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 6 }}>
      <div style={{ fontSize: 12, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: '#111827' }}>{value}</div>
    </div>
  )
}

export default KOLDashboard
