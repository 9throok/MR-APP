import { useState, useEffect } from 'react'
import { Plus, Calendar, MapPin } from 'lucide-react'
import Header from './Header'
import Sidebar from './Sidebar'
import { apiGet, apiPost } from '../services/apiService'
import './KnowledgeUpload.css'
import './admin/AdminUI.css'
import {
  Badge,
  DataTable,
  Modal,
  engagementStatusTone,
  kolTierTone,
  humanise,
  type DataTableColumn,
} from './admin'

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
      const res = await apiGet(`/medical-engagements/${selected.id}`)
      setAttendees(res.data?.attendees || [])
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add attendee')
    }
  }

  const columns: DataTableColumn<Engagement>[] = [
    {
      key: 'title',
      label: 'Title',
      render: e => <span style={{ fontWeight: 600 }}>{e.title}</span>,
    },
    {
      key: 'engagement_type',
      label: 'Type',
      width: '170px',
      render: e => <Badge tone="purple">{humanise(e.engagement_type)}</Badge>,
    },
    {
      key: 'scheduled_at',
      label: 'Scheduled',
      width: '170px',
      render: e => <span className="cell-muted">{e.scheduled_at ? new Date(e.scheduled_at).toLocaleString('en-IN') : '—'}</span>,
    },
    {
      key: 'location',
      label: 'Location',
      render: e => <span className="cell-muted">{e.location || '—'}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      width: '120px',
      render: e => <Badge tone={engagementStatusTone[e.status] || 'neutral'}>{humanise(e.status)}</Badge>,
    },
    {
      key: 'attendee_count',
      label: 'Attendees',
      width: '100px',
      align: 'right',
      className: 'cell-num',
      render: e => e.attendee_count,
    },
  ]

  const attendeeColumns: DataTableColumn<Attendee>[] = [
    {
      key: 'doctor_name',
      label: 'Doctor',
      render: a => <span style={{ fontWeight: 600 }}>{a.doctor_name}</span>,
    },
    {
      key: 'attendee_role',
      label: 'Role',
      width: '110px',
      render: a => <Badge tone="info">{humanise(a.attendee_role)}</Badge>,
    },
    {
      key: 'kol_tier',
      label: 'KOL tier',
      width: '100px',
      render: a => a.kol_tier ? <Badge tone={kolTierTone[a.kol_tier] || 'neutral'}>{a.kol_tier}</Badge> : <span className="cell-muted">—</span>,
    },
    {
      key: 'honorarium',
      label: 'Honorarium',
      width: '140px',
      align: 'right',
      className: 'cell-num',
      render: a => a.honorarium_amt ? `${a.honorarium_ccy || 'INR'} ${a.honorarium_amt.toLocaleString('en-IN')}` : <span className="cell-muted">—</span>,
    },
  ]

  return (
    <div className="knowledge-page">
      <Header onLogout={onLogout} onMenuClick={() => setSidebarOpen(true)} onNavigateHome={onBack} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} userName={userName} onNavigate={onNavigate} onLogout={onLogout} currentPage="medical-engagements" />

      <div className="knowledge-content">
        <div className="admin-page-intro">
          <div>
            <h2 className="admin-page-title">Medical Engagements</h2>
            <p className="admin-page-lead">
              Advisory boards, speaker programs, symposia. Track attendees, roles, honoraria, and outcomes.
            </p>
          </div>
          <button onClick={() => setShowForm(v => !v)} className="btn btn-primary">
            <Plus size={14} />
            {showForm ? 'Cancel' : 'New engagement'}
          </button>
        </div>

        {error && <div className="admin-error">{error}</div>}

        {showForm && (
          <form onSubmit={submitCreate} className="admin-card" style={{ marginBottom: 18 }}>
            <div className="admin-section-title">New engagement</div>
            <div className="admin-form-grid-2">
              <div className="admin-field-wide">
                <label className="admin-field-label">Title*</label>
                <input value={title} onChange={e => setTitle(e.target.value)} required className="admin-input" />
              </div>
              <div>
                <label className="admin-field-label">Type*</label>
                <select value={type} onChange={e => setType(e.target.value)} className="admin-select">
                  {TYPES.map(t => <option key={t} value={t}>{humanise(t)}</option>)}
                </select>
              </div>
              <div>
                <label className="admin-field-label">Product</label>
                <input value={product} onChange={e => setProduct(e.target.value)} className="admin-input" />
              </div>
              <div>
                <label className="admin-field-label">Location</label>
                <input value={location} onChange={e => setLocation(e.target.value)} className="admin-input" />
              </div>
              <div>
                <label className="admin-field-label">Scheduled</label>
                <input type="datetime-local" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)} className="admin-input" />
              </div>
              <div className="admin-field-wide">
                <label className="admin-field-label">Topic</label>
                <textarea value={topic} onChange={e => setTopic(e.target.value)} rows={2} className="admin-textarea" />
              </div>
            </div>
            <div className="admin-row" style={{ marginTop: 14, justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setShowForm(false)} className="btn btn-ghost btn-sm">Cancel</button>
              <button type="submit" disabled={submitting} className="btn btn-primary btn-sm">
                {submitting ? 'Saving…' : 'Create engagement'}
              </button>
            </div>
          </form>
        )}

        <div className="admin-row-spread" style={{ marginBottom: 12 }}>
          <div className="admin-section-title" style={{ margin: 0 }}>All engagements</div>
          <span className="admin-count-pill">{list.length} engagement{list.length === 1 ? '' : 's'}</span>
        </div>

        <DataTable
          columns={columns}
          rows={list}
          rowKey={e => e.id}
          loading={loading}
          empty="No engagements scheduled. Create the first one above."
          onRowClick={openDetail}
        />
      </div>

      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        width="wide"
        title={selected?.title || ''}
        subtitle={selected ? (
          <span className="admin-row" style={{ gap: 8 }}>
            <Badge tone="purple">{humanise(selected.engagement_type)}</Badge>
            <Badge tone={engagementStatusTone[selected.status] || 'neutral'}>{humanise(selected.status)}</Badge>
            {selected.scheduled_at && (
              <span className="admin-row" style={{ gap: 4 }}>
                <Calendar size={13} /> {new Date(selected.scheduled_at).toLocaleString('en-IN')}
              </span>
            )}
            {selected.location && (
              <span className="admin-row" style={{ gap: 4 }}>
                <MapPin size={13} /> {selected.location}
              </span>
            )}
          </span>
        ) : undefined}
      >
        {selected && (
          <div className="admin-stack">
            {selected.topic && (
              <div>
                <div className="admin-section-title">Topic</div>
                <div className="admin-card-flat" style={{ background: 'var(--bg-secondary)' }}>{selected.topic}</div>
              </div>
            )}

            <div>
              <div className="admin-row-spread" style={{ marginBottom: 10 }}>
                <div className="admin-section-title" style={{ margin: 0 }}>Attendees</div>
                <span className="admin-count-pill">{attendees.length} attendee{attendees.length === 1 ? '' : 's'}</span>
              </div>
              <DataTable
                columns={attendeeColumns}
                rows={attendees}
                rowKey={a => a.id}
                empty="No attendees yet — add one below."
              />
            </div>

            <form onSubmit={addAttendee} className="admin-card-flat">
              <div className="admin-section-title">Add attendee</div>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: 10, alignItems: 'end' }}>
                <div>
                  <label className="admin-field-label">Doctor</label>
                  <select value={addDoctorId} onChange={e => setAddDoctorId(e.target.value)} className="admin-select">
                    <option value="">— select —</option>
                    {doctors.map(d => <option key={d.id} value={d.id}>{d.name} ({d.specialty || '—'})</option>)}
                  </select>
                </div>
                <div>
                  <label className="admin-field-label">Role</label>
                  <select value={addRole} onChange={e => setAddRole(e.target.value)} className="admin-select">
                    {ROLES.map(r => <option key={r} value={r}>{humanise(r)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="admin-field-label">Honorarium (INR)</label>
                  <input type="number" value={addHonorarium} onChange={e => setAddHonorarium(e.target.value)} className="admin-input" />
                </div>
                <button type="submit" disabled={!addDoctorId} className="btn btn-primary btn-sm">Add</button>
              </div>
            </form>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default MedicalEngagements
