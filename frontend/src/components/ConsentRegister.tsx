import { useState, useEffect } from 'react'
import { Search, Plus, UserCheck } from 'lucide-react'
import Header from './Header'
import Sidebar from './Sidebar'
import { apiGet, apiPost } from '../services/apiService'
import './KnowledgeUpload.css'
import './admin/AdminUI.css'
import {
  Badge,
  DataTable,
  consentStatusTone,
  humanise,
  type DataTableColumn,
} from './admin'

interface ConsentRegisterProps {
  onLogout: () => void
  onBack: () => void
  userName: string
  onNavigate: (page: string) => void
}

interface Doctor {
  id: number
  name: string
  specialty: string | null
  territory: string | null
}

interface ChannelState {
  channel: string
  status: string
  recorded_at?: string
  effective_until?: string | null
}

interface HistoryRow {
  id: number
  channel: string
  status: string
  recorded_by: string
  source: string | null
  notes: string | null
  effective_from: string | null
  effective_until: string | null
  recorded_at: string
}

const CHANNELS = ['marketing_email', 'marketing_visit', 'sample_distribution', 'data_processing']

function ConsentRegister({ onLogout, onBack, userName, onNavigate }: ConsentRegisterProps) {
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null)
  const [state, setState] = useState<Record<string, ChannelState>>({})
  const [history, setHistory] = useState<HistoryRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [formChannel, setFormChannel] = useState('marketing_visit')
  const [formStatus, setFormStatus] = useState('granted')
  const [formNotes, setFormNotes] = useState('')
  const [formSource, setFormSource] = useState('verbal')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    apiGet('/doctors').then(r => setDoctors(r.data || [])).catch(err => setError(err.message)).finally(() => setLoading(false))
  }, [])

  const loadDoctorState = async (doc: Doctor) => {
    setSelectedDoctor(doc)
    setError(null)
    setShowForm(false)
    try {
      const [s, h] = await Promise.all([
        apiGet(`/consent/doctor/${doc.id}`),
        apiGet(`/consent/doctor/${doc.id}/history`),
      ])
      setState(s.data?.channels || {})
      setHistory(h.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load')
    }
  }

  const submitConsent = async (ev: React.FormEvent) => {
    ev.preventDefault()
    if (!selectedDoctor) return
    setSubmitting(true)
    setError(null)
    try {
      await apiPost('/consent', {
        doctor_id: selectedDoctor.id,
        channel: formChannel,
        status: formStatus,
        source: formSource,
        notes: formNotes,
      })
      setShowForm(false)
      setFormNotes('')
      await loadDoctorState(selectedDoctor)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to record consent')
    } finally {
      setSubmitting(false)
    }
  }

  const filtered = doctors.filter(d => !search || d.name.toLowerCase().includes(search.toLowerCase()))

  const historyColumns: DataTableColumn<HistoryRow>[] = [
    {
      key: 'recorded_at',
      label: 'When',
      width: '120px',
      render: h => <span className="cell-muted">{new Date(h.recorded_at).toLocaleDateString('en-IN')}</span>,
    },
    {
      key: 'channel',
      label: 'Channel',
      render: h => humanise(h.channel),
    },
    {
      key: 'status',
      label: 'Status',
      width: '120px',
      render: h => <Badge tone={consentStatusTone[h.status] || 'neutral'}>{h.status}</Badge>,
    },
    {
      key: 'recorded_by',
      label: 'Recorded by',
      render: h => <span className="cell-muted">{h.recorded_by}</span>,
    },
    {
      key: 'source',
      label: 'Source',
      render: h => h.source ? humanise(h.source) : '—',
    },
    {
      key: 'notes',
      label: 'Notes',
      className: 'cell-truncate',
      render: h => <span className="cell-muted">{h.notes || '—'}</span>,
    },
  ]

  return (
    <div className="knowledge-page">
      <Header onLogout={onLogout} onMenuClick={() => setSidebarOpen(true)} onNavigateHome={onBack} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} userName={userName} onNavigate={onNavigate} onLogout={onLogout} currentPage="consent-register" />

      <div className="knowledge-content">
        <div className="admin-page-intro">
          <div>
            <h2 className="admin-page-title">Doctor Consent Register</h2>
            <p className="admin-page-lead">
              Per-doctor consent state per channel. Append-only — every grant, revoke or withdrawal is preserved as a new history row.
            </p>
          </div>
        </div>

        {error && <div className="admin-error">{error}</div>}

        <div className="admin-split">
          {/* Master list */}
          <div className="admin-card-flat" style={{ padding: 14 }}>
            <div className="admin-row" style={{ position: 'relative', marginBottom: 12 }}>
              <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
              <input
                type="search"
                placeholder="Search doctors…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="admin-input"
                style={{ paddingLeft: 36 }}
              />
            </div>
            <div style={{ maxHeight: '60vh', overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
              {loading ? (
                <div className="admin-helper-text">Loading…</div>
              ) : filtered.length === 0 ? (
                <div className="admin-helper-text">No doctors match your search.</div>
              ) : filtered.map(d => {
                const isActive = selectedDoctor?.id === d.id
                return (
                  <button
                    key={d.id}
                    onClick={() => loadDoctorState(d)}
                    className="btn"
                    style={{
                      justifyContent: 'flex-start',
                      textAlign: 'left',
                      padding: '10px 12px',
                      background: isActive ? '#ecfdf5' : 'white',
                      borderColor: isActive ? '#86efac' : 'var(--border-color)',
                      color: 'var(--text-primary)',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      gap: 2,
                    }}
                  >
                    <span style={{ fontWeight: 600, fontSize: 13 }}>{d.name}</span>
                    <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-secondary)' }}>
                      {d.specialty || '—'} · {d.territory || '—'}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Detail */}
          <div className="admin-stack">
            {!selectedDoctor ? (
              <div className="admin-empty">
                <div className="admin-empty-icon"><UserCheck size={20} /></div>
                <div className="admin-empty-title">Select a doctor</div>
                <p className="admin-empty-hint">Pick a name on the left to view consent state and history.</p>
              </div>
            ) : (
              <>
                <div className="admin-card">
                  <div className="admin-row-spread" style={{ marginBottom: 16 }}>
                    <div>
                      <h3 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 700 }}>{selectedDoctor.name}</h3>
                      <div className="admin-stat-hint">{selectedDoctor.specialty || '—'} · {selectedDoctor.territory || '—'}</div>
                    </div>
                    <button onClick={() => setShowForm(v => !v)} className="btn btn-primary btn-sm">
                      <Plus size={14} />
                      {showForm ? 'Cancel' : 'Record consent event'}
                    </button>
                  </div>

                  <div className="admin-section-title">Current consent per channel</div>
                  <div className="admin-stat-grid" style={{ marginBottom: 0 }}>
                    {CHANNELS.map(ch => {
                      const s = state[ch] || { channel: ch, status: 'no_consent' }
                      const tone = s.status === 'granted' ? 'success'
                        : s.status === 'revoked' ? 'danger'
                        : s.status === 'withdrawn' ? 'warning' : 'default'
                      return (
                        <div key={ch} className={`admin-stat-card ${tone === 'default' ? '' : `tone-${tone}`}`}>
                          <div className="admin-stat-label">{humanise(ch)}</div>
                          <div className="admin-stat-value" style={{ fontSize: 20 }}>
                            {humanise(s.status)}
                          </div>
                          {s.recorded_at && <div className="admin-stat-hint">since {new Date(s.recorded_at).toLocaleDateString('en-IN')}</div>}
                        </div>
                      )
                    })}
                  </div>
                </div>

                {showForm && (
                  <form onSubmit={submitConsent} className="admin-card">
                    <div className="admin-section-title">Record consent event</div>
                    <div className="admin-form-grid">
                      <div>
                        <label className="admin-field-label">Channel</label>
                        <select value={formChannel} onChange={e => setFormChannel(e.target.value)} className="admin-select">
                          {CHANNELS.map(c => <option key={c} value={c}>{humanise(c)}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="admin-field-label">Status</label>
                        <select value={formStatus} onChange={e => setFormStatus(e.target.value)} className="admin-select">
                          <option value="granted">Granted</option>
                          <option value="revoked">Revoked</option>
                          <option value="withdrawn">Withdrawn</option>
                        </select>
                      </div>
                      <div>
                        <label className="admin-field-label">Source</label>
                        <select value={formSource} onChange={e => setFormSource(e.target.value)} className="admin-select">
                          <option value="verbal">Verbal</option>
                          <option value="written">Written</option>
                          <option value="digital_signature">Digital signature</option>
                          <option value="imported">Imported</option>
                        </select>
                      </div>
                    </div>
                    <div className="admin-form-grid" style={{ marginTop: 14 }}>
                      <div className="admin-field-wide">
                        <label className="admin-field-label">Notes</label>
                        <textarea value={formNotes} onChange={e => setFormNotes(e.target.value)} rows={2} className="admin-textarea" />
                      </div>
                    </div>
                    <div className="admin-row" style={{ marginTop: 14, justifyContent: 'flex-end' }}>
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowForm(false)}>Cancel</button>
                      <button type="submit" disabled={submitting} className="btn btn-primary btn-sm">
                        {submitting ? 'Recording…' : 'Record event'}
                      </button>
                    </div>
                  </form>
                )}

                <div>
                  <div className="admin-row-spread" style={{ marginBottom: 12 }}>
                    <div className="admin-section-title" style={{ margin: 0 }}>History</div>
                    <span className="admin-count-pill">{history.length} events</span>
                  </div>
                  <DataTable
                    columns={historyColumns}
                    rows={history}
                    rowKey={h => h.id}
                    empty="No consent events recorded yet."
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ConsentRegister
