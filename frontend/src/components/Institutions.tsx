import { useState, useEffect } from 'react'
import Header from './Header'
import Sidebar from './Sidebar'
import { apiGet, apiPost } from '../services/apiService'
import './KnowledgeUpload.css'

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

  return (
    <div className="knowledge-page">
      <Header onLogout={onLogout} onMenuClick={() => setSidebarOpen(true)} onNavigateHome={onBack} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} userName={userName} onNavigate={onNavigate} onLogout={onLogout} currentPage="institutions" />

      <div className="knowledge-content">
        <div className="entries-section">
          <h2 style={{ marginTop: 0 }}>Institutions</h2>
          <p style={{ color: '#6b7280', fontSize: 14 }}>Hospitals, clinics, and medical centers — the master data layer for HCP affiliations.</p>

          {error && <div style={{ color: '#b91c1c', marginBottom: 12 }}>{error}</div>}

          <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
            <input type="search" placeholder="Search by name…" value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && load()} style={{ padding: 8, border: '1px solid #d1d5db', borderRadius: 4, minWidth: 200 }} />
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} style={{ padding: 8, border: '1px solid #d1d5db', borderRadius: 4 }}>
              <option value="">All types</option>
              {TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
            </select>
            <button onClick={load} className="upload-btn" style={{ padding: '8px 16px' }}>Search</button>
            <button onClick={() => setShowForm(v => !v)} className="upload-btn" style={{ padding: '8px 16px', marginLeft: 'auto' }}>{showForm ? 'Cancel' : '+ New Institution'}</button>
          </div>

          {showForm && (
            <form onSubmit={submit} style={{ background: '#f9fafb', padding: 16, borderRadius: 6, marginBottom: 24 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <label>Name*<input value={name} onChange={e => setName(e.target.value)} required style={{ width: '100%', padding: 6, marginTop: 4, border: '1px solid #d1d5db', borderRadius: 4 }} /></label>
                <label>Type*<select value={type} onChange={e => setType(e.target.value)} style={{ width: '100%', padding: 6, marginTop: 4 }}>{TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}</select></label>
                <label>City<input value={city} onChange={e => setCity(e.target.value)} style={{ width: '100%', padding: 6, marginTop: 4, border: '1px solid #d1d5db', borderRadius: 4 }} /></label>
                <label>Territory<input value={territory} onChange={e => setTerritory(e.target.value)} style={{ width: '100%', padding: 6, marginTop: 4, border: '1px solid #d1d5db', borderRadius: 4 }} /></label>
                <label>Bed count<input type="number" value={bedCount} onChange={e => setBedCount(e.target.value)} style={{ width: '100%', padding: 6, marginTop: 4, border: '1px solid #d1d5db', borderRadius: 4 }} /></label>
              </div>
              <button type="submit" disabled={submitting} className="upload-btn" style={{ marginTop: 12 }}>{submitting ? 'Saving…' : 'Create'}</button>
            </form>
          )}

          {loading ? <div>Loading…</div> : list.length === 0 ? (
            <div style={{ color: '#6b7280', padding: 24, textAlign: 'center' }}>No institutions yet.</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e5e7eb', textAlign: 'left' }}>
                  <th style={{ padding: 8 }}>Name</th>
                  <th style={{ padding: 8 }}>Type</th>
                  <th style={{ padding: 8 }}>City</th>
                  <th style={{ padding: 8 }}>Territory</th>
                  <th style={{ padding: 8 }}>Beds</th>
                  <th style={{ padding: 8 }}>Affiliated doctors</th>
                  <th style={{ padding: 8 }}></th>
                </tr>
              </thead>
              <tbody>
                {list.map(i => (
                  <tr key={i.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: 8, fontSize: 13, fontWeight: 600 }}>{i.name}</td>
                    <td style={{ padding: 8, fontSize: 13 }}>{i.institution_type.replace(/_/g, ' ')}</td>
                    <td style={{ padding: 8, fontSize: 13 }}>{i.city || '—'}</td>
                    <td style={{ padding: 8, fontSize: 13 }}>{i.territory || '—'}</td>
                    <td style={{ padding: 8, fontSize: 13 }}>{i.bed_count || '—'}</td>
                    <td style={{ padding: 8, fontSize: 13 }}>{i.active_doctor_count}</td>
                    <td style={{ padding: 8 }}>
                      <button onClick={() => openDetail(i)} style={{ background: 'none', border: '1px solid #d1d5db', padding: '4px 10px', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}>Open</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {selected && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setSelected(null)}>
            <div style={{ background: 'white', maxWidth: 720, width: '100%', maxHeight: '90vh', overflow: 'auto', borderRadius: 8, padding: 24 }} onClick={ev => ev.stopPropagation()}>
              <h3 style={{ marginTop: 0 }}>{selected.name}</h3>
              <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 16 }}>
                {selected.institution_type.replace(/_/g, ' ')} · {selected.city || '—'} · {selected.bed_count || 'unknown'} beds · territory {selected.territory || '—'}
              </div>
              <h4>Affiliated doctors ({affiliations.length})</h4>
              {affiliations.length === 0 ? (
                <div style={{ color: '#6b7280' }}>No affiliations recorded.</div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #e5e7eb', textAlign: 'left' }}>
                      <th style={{ padding: 6 }}>Doctor</th>
                      <th style={{ padding: 6 }}>Specialty</th>
                      <th style={{ padding: 6 }}>Role</th>
                      <th style={{ padding: 6 }}>Active</th>
                    </tr>
                  </thead>
                  <tbody>
                    {affiliations.map(a => (
                      <tr key={a.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                        <td style={{ padding: 6 }}>{a.doctor_name}{a.is_primary ? ' ★' : ''}</td>
                        <td style={{ padding: 6 }}>{a.specialty_code || a.specialty || '—'}</td>
                        <td style={{ padding: 6 }}>{a.role || '—'}</td>
                        <td style={{ padding: 6, color: a.effective_until ? '#6b7280' : '#15803d' }}>{a.effective_until ? `closed ${a.effective_until.slice(0, 10)}` : 'active'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              <button onClick={() => setSelected(null)} style={{ marginTop: 16, padding: '8px 20px', background: '#374151', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Close</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Institutions
