import { useState, useEffect } from 'react'
import Header from './Header'
import Sidebar from './Sidebar'
import { apiGet, apiPost } from '../services/apiService'
import './KnowledgeUpload.css'

interface MedicalEngagementsProps {
  onLogout: () => void
  onBack: () => void
  userName: string
  onNavigate: (page: string) => void
}

interface Engagement {
  id: number
  title: string
  engagement_type: string
  product: string | null
  topic: string | null
  location: string | null
  scheduled_at: string | null
  duration_minutes: number | null
  status: 'planned' | 'confirmed' | 'completed' | 'cancelled'
  attendee_count: number
}

interface Attendee {
  id: number
  doctor_id: number
  doctor_name: string
  specialty: string | null
  territory: string | null
  attendee_role: string
  attended: boolean | null
  honorarium_amt: number | null
  honorarium_ccy: string | null
  kol_tier: string | null
  influence_score: number | null
}

interface DoctorRow { id: number; name: string; specialty: string | null; territory: string | null }

const TYPES = ['advisory_board', 'speaker_program', 'symposium', 'consultation', 'investigator_meeting', 'roundtable', 'other']
const STATUS_COLOR: Record<string, string> = {
  planned: '#374151',
  confirmed: '#2563eb',
  completed: '#15803d',
  cancelled: '#6b7280',
}
const ROLES = ['attendee', 'speaker', 'chair', 'panelist', 'organiser']

function MedicalEngagements({ onLogout, onBack, userName, onNavigate }: MedicalEngagementsProps) {
  const [list, setList] = useState<Engagement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [selected, setSelected] = useState<Engagement | null>(null)
  const [attendees, setAttendees] = useState<Attendee[]>([])
  const [doctors, setDoctors] = useState<DoctorRow[]>([])

  // form state
  const [title, setTitle] = useState('')
  const [type, setType] = useState('advisory_board')
  const [product, setProduct] = useState('')
  const [topic, setTopic] = useState('')
  const [location, setLocation] = useState('')
  const [scheduledAt, setScheduledAt] = useState('')

  // attendee form state
  const [addDoctorId, setAddDoctorId] = useState('')
  const [addRole, setAddRole] = useState('attendee')
  const [addHonorarium, setAddHonorarium] = useState('')

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const [eng, docs] = await Promise.all([
        apiGet('/medical-engagements'),
        apiGet('/doctors'),
      ])
      setList(eng.data || [])
      setDoctors(docs.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { load() }, [])

  const openDetail = async (e: Engagement) => {
    setSelected(e)
    try {
      const res = await apiGet(`/medical-engagements/${e.id}`)
      setAttendees(res.data?.attendees || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load detail')
    }
  }

  const submitCreate = async (ev: React.FormEvent) => {
    ev.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      await apiPost('/medical-engagements', {
        title,
        engagement_type: type,
        product: product || undefined,
        topic: topic || undefined,
        location: location || undefined,
        scheduled_at: scheduledAt || undefined,
      })
      setTitle(''); setProduct(''); setTopic(''); setLocation(''); setScheduledAt('')
      setShowForm(false)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create')
    } finally {
      setSubmitting(false)
    }
  }

  const addAttendee = async (ev: React.FormEvent) => {
    ev.preventDefault()
    if (!selected || !addDoctorId) return
    try {
      await apiPost(`/medical-engagements/${selected.id}/attendees`, {
        doctor_id: Number(addDoctorId),
        attendee_role: addRole,
        honorarium_amt: addHonorarium ? Number(addHonorarium) : undefined,
      })
      setAddDoctorId(''); setAddRole('attendee'); setAddHonorarium('')
      // reload detail
      const res = await apiGet(`/medical-engagements/${selected.id}`)
      setAttendees(res.data?.attendees || [])
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add attendee')
    }
  }

  return (
    <div className="knowledge-page">
      <Header onLogout={onLogout} onMenuClick={() => setSidebarOpen(true)} onNavigateHome={onBack} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} userName={userName} onNavigate={onNavigate} onLogout={onLogout} currentPage="medical-engagements" />

      <div className="knowledge-content">
        <div className="entries-section">
          <h2 style={{ marginTop: 0 }}>Medical Engagements</h2>
          <p style={{ color: '#6b7280', fontSize: 14 }}>Advisory boards, speaker programs, symposia. Track attendees, roles, honoraria, and outcomes.</p>

          {error && <div style={{ color: '#b91c1c', marginBottom: 12 }}>{error}</div>}

          <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
            <button onClick={load} className="upload-btn" style={{ padding: '8px 16px' }}>Refresh</button>
            <button onClick={() => setShowForm(v => !v)} className="upload-btn" style={{ padding: '8px 16px', marginLeft: 'auto' }}>{showForm ? 'Cancel' : '+ New engagement'}</button>
          </div>

          {showForm && (
            <form onSubmit={submitCreate} style={{ background: '#f9fafb', padding: 16, borderRadius: 6, marginBottom: 24 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
                <label>Title*<input value={title} onChange={e => setTitle(e.target.value)} required style={{ width: '100%', padding: 6, marginTop: 4, border: '1px solid #d1d5db', borderRadius: 4 }} /></label>
                <label>Type*<select value={type} onChange={e => setType(e.target.value)} style={{ width: '100%', padding: 6, marginTop: 4 }}>{TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}</select></label>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginTop: 12 }}>
                <label>Product<input value={product} onChange={e => setProduct(e.target.value)} style={{ width: '100%', padding: 6, marginTop: 4, border: '1px solid #d1d5db', borderRadius: 4 }} /></label>
                <label>Location<input value={location} onChange={e => setLocation(e.target.value)} style={{ width: '100%', padding: 6, marginTop: 4, border: '1px solid #d1d5db', borderRadius: 4 }} /></label>
                <label>Scheduled<input type="datetime-local" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)} style={{ width: '100%', padding: 6, marginTop: 4, border: '1px solid #d1d5db', borderRadius: 4 }} /></label>
              </div>
              <label style={{ display: 'block', marginTop: 12 }}>Topic<textarea value={topic} onChange={e => setTopic(e.target.value)} rows={2} style={{ width: '100%', padding: 6, marginTop: 4, border: '1px solid #d1d5db', borderRadius: 4 }} /></label>
              <button type="submit" disabled={submitting} className="upload-btn" style={{ marginTop: 12 }}>{submitting ? 'Saving…' : 'Create'}</button>
            </form>
          )}

          {loading ? <div>Loading…</div> : list.length === 0 ? (
            <div style={{ color: '#6b7280', padding: 24, textAlign: 'center' }}>No engagements scheduled.</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e5e7eb', textAlign: 'left' }}>
                  <th style={{ padding: 8 }}>Title</th>
                  <th style={{ padding: 8 }}>Type</th>
                  <th style={{ padding: 8 }}>Scheduled</th>
                  <th style={{ padding: 8 }}>Location</th>
                  <th style={{ padding: 8 }}>Status</th>
                  <th style={{ padding: 8 }}>Attendees</th>
                  <th style={{ padding: 8 }}></th>
                </tr>
              </thead>
              <tbody>
                {list.map(e => (
                  <tr key={e.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: 8, fontSize: 13, fontWeight: 600 }}>{e.title}</td>
                    <td style={{ padding: 8, fontSize: 13 }}>{e.engagement_type.replace(/_/g, ' ')}</td>
                    <td style={{ padding: 8, fontSize: 12 }}>{e.scheduled_at ? new Date(e.scheduled_at).toLocaleString('en-IN') : '—'}</td>
                    <td style={{ padding: 8, fontSize: 13 }}>{e.location || '—'}</td>
                    <td style={{ padding: 8, fontSize: 12, color: STATUS_COLOR[e.status], fontWeight: 600 }}>{e.status}</td>
                    <td style={{ padding: 8, fontSize: 13 }}>{e.attendee_count}</td>
                    <td style={{ padding: 8 }}>
                      <button onClick={() => openDetail(e)} style={{ background: 'none', border: '1px solid #d1d5db', padding: '4px 10px', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}>Open</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {selected && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setSelected(null)}>
            <div style={{ background: 'white', maxWidth: 800, width: '100%', maxHeight: '92vh', overflow: 'auto', borderRadius: 8, padding: 24 }} onClick={ev => ev.stopPropagation()}>
              <h3 style={{ marginTop: 0 }}>{selected.title}</h3>
              <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 16 }}>
                {selected.engagement_type.replace(/_/g, ' ')} · {selected.scheduled_at ? new Date(selected.scheduled_at).toLocaleString('en-IN') : 'unscheduled'} · {selected.location || 'no location'} · status <span style={{ color: STATUS_COLOR[selected.status], fontWeight: 600 }}>{selected.status}</span>
              </div>

              <h4>Attendees ({attendees.length})</h4>
              {attendees.length === 0 ? (
                <div style={{ color: '#6b7280', marginBottom: 12 }}>No attendees yet.</div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, marginBottom: 16 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #e5e7eb', textAlign: 'left' }}>
                      <th style={{ padding: 6 }}>Doctor</th>
                      <th style={{ padding: 6 }}>Role</th>
                      <th style={{ padding: 6 }}>KOL tier</th>
                      <th style={{ padding: 6 }}>Honorarium</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendees.map(a => (
                      <tr key={a.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                        <td style={{ padding: 6 }}>{a.doctor_name}</td>
                        <td style={{ padding: 6 }}>{a.attendee_role}</td>
                        <td style={{ padding: 6 }}>{a.kol_tier || '—'}</td>
                        <td style={{ padding: 6 }}>{a.honorarium_amt ? `${a.honorarium_ccy || 'INR'} ${a.honorarium_amt}` : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              <h4>Add attendee</h4>
              <form onSubmit={addAttendee} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: 8, alignItems: 'end' }}>
                <label style={{ fontSize: 12 }}>Doctor
                  <select value={addDoctorId} onChange={e => setAddDoctorId(e.target.value)} style={{ width: '100%', padding: 6, marginTop: 2 }}>
                    <option value="">— select —</option>
                    {doctors.map(d => <option key={d.id} value={d.id}>{d.name} ({d.specialty || '—'})</option>)}
                  </select>
                </label>
                <label style={{ fontSize: 12 }}>Role
                  <select value={addRole} onChange={e => setAddRole(e.target.value)} style={{ width: '100%', padding: 6, marginTop: 2 }}>
                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </label>
                <label style={{ fontSize: 12 }}>Honorarium (INR)
                  <input type="number" value={addHonorarium} onChange={e => setAddHonorarium(e.target.value)} style={{ width: '100%', padding: 6, marginTop: 2, border: '1px solid #d1d5db', borderRadius: 4 }} />
                </label>
                <button type="submit" disabled={!addDoctorId} className="upload-btn">Add</button>
              </form>

              <button onClick={() => setSelected(null)} style={{ marginTop: 16, padding: '8px 20px', background: '#374151', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Close</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default MedicalEngagements
