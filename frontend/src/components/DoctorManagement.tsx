import { useState, useEffect } from 'react'
import Header from './Header'
import Sidebar from './Sidebar'
import { apiGet, apiPost, apiPatch, apiDelete } from '../services/apiService'
import './DoctorManagement.css'

interface DoctorManagementProps {
  onLogout: () => void
  onBack: () => void
  userName: string
  onNavigate: (page: string) => void
}

interface Doctor {
  id: number
  name: string
  specialty: string | null
  tier: 'A' | 'B' | 'C'
  territory: string | null
  preferred_visit_day: string | null
  hospital: string | null
  phone: string | null
  notes: string | null
}

const emptyDoctor: { name: string; specialty: string; tier: 'A' | 'B' | 'C'; territory: string; preferred_visit_day: string; hospital: string; phone: string; notes: string } = { name: '', specialty: '', tier: 'B', territory: '', preferred_visit_day: '', hospital: '', phone: '', notes: '' }

function DoctorManagement({ onLogout, onBack, userName, onNavigate }: DoctorManagementProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState(emptyDoctor)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchDoctors()
  }, [])

  const fetchDoctors = async () => {
    setLoading(true)
    try {
      const data = await apiGet('/doctors')
      setDoctors(data.data || [])
    } catch (err) {
      console.error('Error fetching doctors:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (editingId) {
        await apiPatch(`/doctors/${editingId}`, form)
      } else {
        await apiPost('/doctors', form)
      }
      setShowForm(false)
      setEditingId(null)
      setForm(emptyDoctor)
      fetchDoctors()
    } catch (err) {
      console.error('Error saving doctor:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (doctor: Doctor) => {
    setForm({
      name: doctor.name,
      specialty: doctor.specialty || '',
      tier: doctor.tier,
      territory: doctor.territory || '',
      preferred_visit_day: doctor.preferred_visit_day || '',
      hospital: doctor.hospital || '',
      phone: doctor.phone || '',
      notes: doctor.notes || '',
    })
    setEditingId(doctor.id)
    setShowForm(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this doctor profile?')) return
    try {
      await apiDelete(`/doctors/${id}`)
      setDoctors(prev => prev.filter(d => d.id !== id))
    } catch (err) {
      console.error('Error deleting doctor:', err)
    }
  }

  const tierColors: Record<string, string> = { A: '#8b5cf6', B: '#3b82f6', C: '#64748b' }

  return (
    <div className="doctor-mgmt-page">
      <Header onLogout={onLogout} onMenuClick={() => setSidebarOpen(true)} onNavigateHome={onBack} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} userName={userName} onNavigate={onNavigate} onLogout={onLogout} currentPage="doctor-management" />

      <main className="doctor-mgmt-content">
        <div className="doctor-mgmt-page-header">
          <button className="back-button" onClick={onBack} aria-label="Go back">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div className="doctor-mgmt-header-content">
            <h1 className="doctor-mgmt-title">Doctor Management</h1>
            <p className="doctor-mgmt-subtitle">{doctors.length} doctor{doctors.length !== 1 ? 's' : ''} in your territory</p>
          </div>
          <button className="add-doctor-btn" onClick={() => { setForm(emptyDoctor); setEditingId(null); setShowForm(true) }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Add Doctor
          </button>
        </div>

        {showForm && (
          <div className="doctor-form-overlay" onClick={() => setShowForm(false)}>
            <form className="doctor-form" onClick={e => e.stopPropagation()} onSubmit={handleSubmit}>
              <h3>{editingId ? 'Edit Doctor' : 'Add Doctor'}</h3>
              <div className="form-grid">
                <input placeholder="Name *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                <input placeholder="Specialty" value={form.specialty} onChange={e => setForm({ ...form, specialty: e.target.value })} />
                <select value={form.tier} onChange={e => setForm({ ...form, tier: e.target.value as 'A' | 'B' | 'C' })}>
                  <option value="A">Tier A (High)</option>
                  <option value="B">Tier B (Medium)</option>
                  <option value="C">Tier C (Low)</option>
                </select>
                <input placeholder="Territory" value={form.territory} onChange={e => setForm({ ...form, territory: e.target.value })} />
                <select value={form.preferred_visit_day} onChange={e => setForm({ ...form, preferred_visit_day: e.target.value })}>
                  <option value="">Preferred Day</option>
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
                <input placeholder="Hospital" value={form.hospital} onChange={e => setForm({ ...form, hospital: e.target.value })} />
                <input placeholder="Phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                <input placeholder="Notes" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
              </div>
              <div className="form-actions">
                <button type="button" className="cancel-btn" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="save-btn" disabled={saving}>{saving ? 'Saving...' : editingId ? 'Update' : 'Add'}</button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div className="doctor-loading">Loading doctors...</div>
        ) : doctors.length === 0 ? (
          <div className="doctor-empty">No doctor profiles yet. Add one to get started.</div>
        ) : (
          <div className="doctor-list">
            {doctors.map(doc => (
              <div key={doc.id} className="doctor-card">
                <div className="doctor-card-main">
                  <div className="doctor-card-info">
                    <span className="doctor-name">{doc.name}</span>
                    <span className="doctor-specialty">{doc.specialty || 'General'}</span>
                  </div>
                  <span className="doctor-tier" style={{ background: tierColors[doc.tier] || '#64748b' }}>{doc.tier}</span>
                </div>
                <div className="doctor-card-meta">
                  {doc.territory && <span>{doc.territory}</span>}
                  {doc.hospital && <span>{doc.hospital}</span>}
                  {doc.preferred_visit_day && <span>{doc.preferred_visit_day}</span>}
                </div>
                <div className="doctor-card-actions">
                  <button className="edit-btn" onClick={() => handleEdit(doc)}>Edit</button>
                  <button className="del-btn" onClick={() => handleDelete(doc.id)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

export default DoctorManagement
