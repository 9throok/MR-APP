import { useState, useEffect } from 'react'
import { Plus, Search, Building2 } from 'lucide-react'
import Header from './Header'
import Sidebar from './Sidebar'
import { apiGet, apiPost } from '../services/apiService'
import './KnowledgeUpload.css'
import './admin/AdminUI.css'
import {
  Badge,
  DataTable,
  Modal,
  Toolbar,
  humanise,
  type DataTableColumn,
} from './admin'

interface InstitutionsProps {
  onLogout: () => void
  onBack: () => void
  userName: string
  onNavigate: (page: string) => void
}

interface Institution {
  id: number
  name: string
  institution_type: string
  bed_count: number | null
  city: string | null
  state: string | null
  territory: string | null
  tier: string | null
  active_doctor_count: number
}

interface AffiliationRow {
  id: number
  role: string | null
  department: string | null
  is_primary: boolean
  effective_from: string | null
  effective_until: string | null
  doctor_id: number
  doctor_name: string
  specialty: string | null
  specialty_code: string | null
  tier: string | null
}

const TYPES = ['hospital_public', 'hospital_private', 'clinic', 'nursing_home', 'medical_center', 'diagnostic_center', 'other']

const tierToTone = (tier: string | null) => {
  if (tier === 'A') return 'success'
  if (tier === 'B') return 'info'
  if (tier === 'C') return 'muted'
  return 'neutral'
}

function Institutions({ onLogout, onBack, userName, onNavigate }: InstitutionsProps) {
  const [list, setList] = useState<Institution[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [selected, setSelected] = useState<Institution | null>(null)
  const [affiliations, setAffiliations] = useState<AffiliationRow[]>([])

  // form state
  const [name, setName] = useState('')
  const [type, setType] = useState('hospital_private')
  const [city, setCity] = useState('')
  const [territory, setTerritory] = useState('')
  const [bedCount, setBedCount] = useState('')

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (typeFilter) params.append('type', typeFilter)
      if (search) params.append('q', search)
      const res = await apiGet(`/institutions${params.toString() ? '?' + params.toString() : ''}`)
      setList(res.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { load() /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [typeFilter])

  const openDetail = async (i: Institution) => {
    setSelected(i)
    try {
      const res = await apiGet(`/institutions/${i.id}`)
      setAffiliations(res.data?.affiliations || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load detail')
    }
  }

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      await apiPost('/institutions', {
        name, institution_type: type, city: city || undefined,
        territory: territory || undefined,
        bed_count: bedCount ? Number(bedCount) : undefined,
      })
      setName(''); setCity(''); setTerritory(''); setBedCount('')
      setShowForm(false)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create')
    } finally {
      setSubmitting(false)
    }
  }

  const columns: DataTableColumn<Institution>[] = [
    {
      key: 'name',
      label: 'Name',
      render: i => <span style={{ fontWeight: 600 }}>{i.name}</span>,
    },
    {
      key: 'institution_type',
      label: 'Type',
      width: '180px',
      render: i => <Badge tone="info">{humanise(i.institution_type)}</Badge>,
    },
    {
      key: 'city',
      label: 'City',
      width: '140px',
      render: i => <span className="cell-muted">{i.city || '—'}</span>,
    },
    {
      key: 'territory',
      label: 'Territory',
      width: '140px',
      render: i => <span className="cell-muted">{i.territory || '—'}</span>,
    },
    {
      key: 'tier',
      label: 'Tier',
      width: '80px',
      render: i => i.tier ? <Badge tone={tierToTone(i.tier)}>{i.tier}</Badge> : <span className="cell-muted">—</span>,
    },
    {
      key: 'bed_count',
      label: 'Beds',
      width: '80px',
      align: 'right',
      className: 'cell-num',
      render: i => i.bed_count || <span className="cell-muted">—</span>,
    },
    {
      key: 'active_doctor_count',
      label: 'Affiliated HCPs',
      width: '120px',
      align: 'right',
      className: 'cell-num',
      render: i => i.active_doctor_count,
    },
  ]

  const affiliationColumns: DataTableColumn<AffiliationRow>[] = [
    {
      key: 'doctor_name',
      label: 'Doctor',
      render: a => (
        <span className="admin-row" style={{ gap: 8 }}>
          <span style={{ fontWeight: 600 }}>{a.doctor_name}</span>
          {a.is_primary && <Badge tone="info">Primary</Badge>}
        </span>
      ),
    },
    {
      key: 'specialty',
      label: 'Specialty',
      width: '140px',
      render: a => <span className="cell-muted">{a.specialty_code || a.specialty || '—'}</span>,
    },
    {
      key: 'role',
      label: 'Role',
      width: '140px',
      render: a => a.role ? humanise(a.role) : <span className="cell-muted">—</span>,
    },
    {
      key: 'status',
      label: 'Status',
      width: '160px',
      render: a => a.effective_until
        ? <Badge tone="muted">closed {a.effective_until.slice(0, 10)}</Badge>
        : <Badge tone="success">Active</Badge>,
    },
  ]

  return (
    <div className="knowledge-page">
      <Header onLogout={onLogout} onMenuClick={() => setSidebarOpen(true)} onNavigateHome={onBack} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} userName={userName} onNavigate={onNavigate} onLogout={onLogout} currentPage="institutions" />

      <div className="knowledge-content">
        <div className="admin-page-intro">
          <div>
            <h2 className="admin-page-title">Institutions</h2>
            <p className="admin-page-lead">
              Hospitals, clinics, and medical centers — the master data layer for HCP affiliations.
            </p>
          </div>
          <button onClick={() => setShowForm(v => !v)} className="btn btn-primary">
            <Plus size={14} />
            {showForm ? 'Cancel' : 'New institution'}
          </button>
        </div>

        {error && <div className="admin-error">{error}</div>}

        {showForm && (
          <form onSubmit={submit} className="admin-card" style={{ marginBottom: 18 }}>
            <div className="admin-section-title">New institution</div>
            <div className="admin-form-grid-2">
              <div>
                <label className="admin-field-label">Name*</label>
                <input value={name} onChange={e => setName(e.target.value)} required className="admin-input" />
              </div>
              <div>
                <label className="admin-field-label">Type*</label>
                <select value={type} onChange={e => setType(e.target.value)} className="admin-select">
                  {TYPES.map(t => <option key={t} value={t}>{humanise(t)}</option>)}
                </select>
              </div>
              <div>
                <label className="admin-field-label">City</label>
                <input value={city} onChange={e => setCity(e.target.value)} className="admin-input" />
              </div>
              <div>
                <label className="admin-field-label">Territory</label>
                <input value={territory} onChange={e => setTerritory(e.target.value)} className="admin-input" />
              </div>
              <div>
                <label className="admin-field-label">Bed count</label>
                <input type="number" value={bedCount} onChange={e => setBedCount(e.target.value)} className="admin-input" />
              </div>
            </div>
            <div className="admin-row" style={{ marginTop: 14, justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setShowForm(false)} className="btn btn-ghost btn-sm">Cancel</button>
              <button type="submit" disabled={submitting} className="btn btn-primary btn-sm">
                {submitting ? 'Saving…' : 'Create institution'}
              </button>
            </div>
          </form>
        )}

        <Toolbar>
          <div className="admin-row" style={{ position: 'relative', gap: 0 }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
            <input
              type="search"
              placeholder="Search by name…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && load()}
              className="admin-input"
              style={{ paddingLeft: 36, width: 240 }}
            />
          </div>
          <Toolbar.Field label="Type">
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="admin-select" style={{ width: 200 }}>
              <option value="">All types</option>
              {TYPES.map(t => <option key={t} value={t}>{humanise(t)}</option>)}
            </select>
          </Toolbar.Field>
          <button type="button" onClick={load} className="btn btn-secondary btn-sm">Search</button>
          <Toolbar.Spacer />
          <Toolbar.Count n={list.length} noun="institution" />
        </Toolbar>

        <DataTable
          columns={columns}
          rows={list}
          rowKey={i => i.id}
          loading={loading}
          empty="No institutions yet. Create the first one above."
          onRowClick={openDetail}
        />
      </div>

      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        width="wide"
        title={selected?.name || ''}
        subtitle={selected ? (
          <span className="admin-row" style={{ gap: 8 }}>
            <Badge tone="info" icon={<Building2 size={11} />}>{humanise(selected.institution_type)}</Badge>
            {selected.tier && <Badge tone={tierToTone(selected.tier)}>Tier {selected.tier}</Badge>}
            <span>· {selected.city || '—'}</span>
            <span>· territory {selected.territory || '—'}</span>
            <span>· {selected.bed_count ? `${selected.bed_count} beds` : 'beds unknown'}</span>
          </span>
        ) : undefined}
      >
        {selected && (
          <div className="admin-stack">
            <div>
              <div className="admin-row-spread" style={{ marginBottom: 10 }}>
                <div className="admin-section-title" style={{ margin: 0 }}>Affiliated doctors</div>
                <span className="admin-count-pill">{affiliations.length} affiliation{affiliations.length === 1 ? '' : 's'}</span>
              </div>
              <DataTable
                columns={affiliationColumns}
                rows={affiliations}
                rowKey={a => a.id}
                empty="No affiliations recorded for this institution."
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default Institutions
