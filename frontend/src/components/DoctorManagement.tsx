import { useState, useEffect } from 'react'
import { apiGet, apiPost, apiPatch, apiDelete } from '../services/apiService'
import {
  PAGE_CONTENT,
  PAGE_TITLE,
  CARD,
  CARD_PADDING,
  BTN_PRIMARY,
  BTN_SECONDARY,
  BTN_GHOST,
  INPUT,
  SELECT,
  BADGE_PRIMARY,
  MODAL_OVERLAY,
  MODAL_CARD,
  EMPTY_STATE,
  EMPTY_TITLE,
} from '../styles/designSystem'

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

function DoctorManagement({ onLogout: _onLogout, onBack: _onBack, userName: _userName, onNavigate: _onNavigate }: DoctorManagementProps) {
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

  return (
    <div className={PAGE_CONTENT}>
      <h2 className={`${PAGE_TITLE} mb-6`}>Doctor Management</h2>

      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-slate-500">{doctors.length} doctors</span>
        <button className={BTN_PRIMARY} onClick={() => { setForm(emptyDoctor); setEditingId(null); setShowForm(true) }}>
          + Add Doctor
        </button>
      </div>

      {showForm && (
        <div className={MODAL_OVERLAY} onClick={() => setShowForm(false)}>
          <form className={`${MODAL_CARD} ${CARD_PADDING}`} onClick={e => e.stopPropagation()} onSubmit={handleSubmit}>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">{editingId ? 'Edit Doctor' : 'Add Doctor'}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input className={INPUT} placeholder="Name *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
              <input className={INPUT} placeholder="Specialty" value={form.specialty} onChange={e => setForm({ ...form, specialty: e.target.value })} />
              <select className={SELECT} value={form.tier} onChange={e => setForm({ ...form, tier: e.target.value as 'A' | 'B' | 'C' })}>
                <option value="A">Tier A (High)</option>
                <option value="B">Tier B (Medium)</option>
                <option value="C">Tier C (Low)</option>
              </select>
              <input className={INPUT} placeholder="Territory" value={form.territory} onChange={e => setForm({ ...form, territory: e.target.value })} />
              <select className={SELECT} value={form.preferred_visit_day} onChange={e => setForm({ ...form, preferred_visit_day: e.target.value })}>
                <option value="">Preferred Day</option>
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
              <input className={INPUT} placeholder="Hospital" value={form.hospital} onChange={e => setForm({ ...form, hospital: e.target.value })} />
              <input className={INPUT} placeholder="Phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
              <input className={INPUT} placeholder="Notes" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button type="button" className={BTN_SECONDARY} onClick={() => setShowForm(false)}>Cancel</button>
              <button type="submit" className={BTN_PRIMARY} disabled={saving}>{saving ? 'Saving...' : editingId ? 'Update' : 'Add'}</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12 text-slate-400">Loading doctors...</div>
      ) : doctors.length === 0 ? (
        <div className={EMPTY_STATE}>
          <p className={EMPTY_TITLE}>No doctor profiles yet. Add one to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {doctors.map(doc => (
            <div key={doc.id} className={`${CARD} ${CARD_PADDING}`}>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="text-base font-semibold text-slate-900 block">{doc.name}</span>
                  <span className="text-sm text-slate-500">{doc.specialty || 'General'}</span>
                </div>
                <span className={BADGE_PRIMARY}>{doc.tier}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-3 text-sm text-slate-600">
                {doc.territory && <span>{doc.territory}</span>}
                {doc.hospital && <span>{doc.hospital}</span>}
                {doc.preferred_visit_day && <span>{doc.preferred_visit_day}</span>}
              </div>
              <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100">
                <button className={BTN_GHOST} onClick={() => handleEdit(doc)}>Edit</button>
                <button className={`${BTN_GHOST} text-red-500 hover:text-red-600 hover:bg-red-50`} onClick={() => handleDelete(doc.id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default DoctorManagement
