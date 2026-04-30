import { useState, useEffect } from 'react'
import Header from './Header'
import Sidebar from './Sidebar'
import { apiGet, apiPost } from '../services/apiService'
import './KnowledgeUpload.css'

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
const STATUS_COLOR: Record<string, string> = {
  granted: '#15803d',
  revoked: '#b91c1c',
  withdrawn: '#b45309',
  no_consent: '#6b7280',
}

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

  return (
    <div className="knowledge-page">
      <Header onLogout={onLogout} onMenuClick={() => setSidebarOpen(true)} onNavigateHome={onBack} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} userName={userName} onNavigate={onNavigate} onLogout={onLogout} currentPage="consent-register" />

      <div className="knowledge-content">
        <div className="entries-section">
          <h2 style={{ marginTop: 0 }}>Doctor Consent Register</h2>
          <p style={{ color: '#6b7280', fontSize: 14 }}>Per-doctor consent state per channel. Append-only — every grant / revoke is a new row in the history.</p>

          {error && <div style={{ color: '#b91c1c', marginBottom: 12 }}>{error}</div>}

          <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 24 }}>
            {/* Doctor list */}
            <div>
              <input
                type="search"
                placeholder="Search doctors…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ width: '100%', padding: 8, marginBottom: 12, border: '1px solid #d1d5db', borderRadius: 4 }}
              />
              <div style={{ maxHeight: '60vh', overflow: 'auto', border: '1px solid #e5e7eb', borderRadius: 4 }}>
                {loading ? <div style={{ padding: 12 }}>Loading…</div> : filtered.map(d => (
                  <button
                    key={d.id}
                    onClick={() => loadDoctorState(d)}
                    style={{
                      display: 'block',
                      width: '100%',
                      textAlign: 'left',
                      padding: '10px 12px',
                      background: selectedDoctor?.id === d.id ? '#eff6ff' : 'white',
                      border: 'none',
                      borderBottom: '1px solid #f3f4f6',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{d.name}</div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>{d.specialty || '—'} · {d.territory || '—'}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Detail */}
            <div>
              {!selectedDoctor ? (
                <div style={{ color: '#6b7280', padding: 24 }}>Select a doctor on the left to view consent state.</div>
              ) : (
                <>
                  <h3 style={{ marginTop: 0 }}>{selectedDoctor.name}</h3>

                  <h4 style={{ marginBottom: 8 }}>Current consent per channel</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12, marginBottom: 24 }}>
                    {CHANNELS.map(ch => {
                      const s = state[ch] || { channel: ch, status: 'no_consent' }
                      return (
                        <div key={ch} style={{ padding: 12, border: '1px solid #e5e7eb', borderRadius: 6 }}>
                          <div style={{ fontSize: 12, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.5 }}>{ch.replace(/_/g, ' ')}</div>
                          <div style={{ fontSize: 16, fontWeight: 700, color: STATUS_COLOR[s.status] || '#374151', marginTop: 4 }}>{s.status.replace(/_/g, ' ')}</div>
                          {s.recorded_at && <div style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>since {new Date(s.recorded_at).toLocaleDateString('en-IN')}</div>}
                        </div>
                      )
                    })}
                  </div>

                  <button onClick={() => setShowForm(v => !v)} className="upload-btn" style={{ marginBottom: 16 }}>
                    {showForm ? 'Cancel' : '+ Record consent event'}
                  </button>

                  {showForm && (
                    <form onSubmit={submitConsent} style={{ background: '#f9fafb', padding: 16, borderRadius: 6, marginBottom: 24 }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                        <label>
                          Channel
                          <select value={formChannel} onChange={e => setFormChannel(e.target.value)} style={{ width: '100%', padding: 6, marginTop: 4 }}>
                            {CHANNELS.map(c => <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>)}
                          </select>
                        </label>
                        <label>
                          Status
                          <select value={formStatus} onChange={e => setFormStatus(e.target.value)} style={{ width: '100%', padding: 6, marginTop: 4 }}>
                            <option value="granted">granted</option>
                            <option value="revoked">revoked</option>
                            <option value="withdrawn">withdrawn</option>
                          </select>
                        </label>
                        <label>
                          Source
                          <select value={formSource} onChange={e => setFormSource(e.target.value)} style={{ width: '100%', padding: 6, marginTop: 4 }}>
                            <option value="verbal">verbal</option>
                            <option value="written">written</option>
                            <option value="digital_signature">digital signature</option>
                            <option value="imported">imported</option>
                          </select>
                        </label>
                      </div>
                      <label style={{ display: 'block', marginTop: 12 }}>
                        Notes
                        <textarea value={formNotes} onChange={e => setFormNotes(e.target.value)} rows={2} style={{ width: '100%', padding: 6, marginTop: 4, border: '1px solid #d1d5db', borderRadius: 4 }} />
                      </label>
                      <button type="submit" disabled={submitting} className="upload-btn" style={{ marginTop: 12 }}>
                        {submitting ? 'Recording…' : 'Record'}
                      </button>
                    </form>
                  )}

                  <h4 style={{ marginBottom: 8 }}>History</h4>
                  {history.length === 0 ? (
                    <div style={{ color: '#6b7280' }}>No consent events recorded yet.</div>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid #e5e7eb', textAlign: 'left' }}>
                          <th style={{ padding: 8 }}>When</th>
                          <th style={{ padding: 8 }}>Channel</th>
                          <th style={{ padding: 8 }}>Status</th>
                          <th style={{ padding: 8 }}>By</th>
                          <th style={{ padding: 8 }}>Source</th>
                          <th style={{ padding: 8 }}>Notes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {history.map(h => (
                          <tr key={h.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                            <td style={{ padding: 8, fontSize: 13 }}>{new Date(h.recorded_at).toLocaleDateString('en-IN')}</td>
                            <td style={{ padding: 8, fontSize: 13 }}>{h.channel.replace(/_/g, ' ')}</td>
                            <td style={{ padding: 8, fontSize: 13, color: STATUS_COLOR[h.status] || '#374151', fontWeight: 600 }}>{h.status}</td>
                            <td style={{ padding: 8, fontSize: 13 }}>{h.recorded_by}</td>
                            <td style={{ padding: 8, fontSize: 13 }}>{h.source || '—'}</td>
                            <td style={{ padding: 8, fontSize: 13, color: '#6b7280' }}>{h.notes || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ConsentRegister
