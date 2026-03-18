import { useState, useEffect } from 'react'
import Header from './Header'
import Sidebar from './Sidebar'
import { useAuth } from '../contexts/AuthContext'
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

interface DoctorRequest {
  id: number
  requested_by: string
  requester_name: string | null
  name: string
  specialty: string | null
  tier: 'A' | 'B' | 'C'
  territory: string | null
  preferred_visit_day: string | null
  hospital: string | null
  phone: string | null
  notes: string | null
  status: 'pending' | 'approved' | 'rejected'
  review_notes: string | null
  created_at: string
}

const emptyDoctor: { name: string; specialty: string; tier: 'A' | 'B' | 'C'; territory: string; preferred_visit_day: string; hospital: string; phone: string; notes: string } = { name: '', specialty: '', tier: 'B', territory: '', preferred_visit_day: '', hospital: '', phone: '', notes: '' }

function DoctorManagement({ onLogout, onBack, userName, onNavigate }: DoctorManagementProps) {
  const { user } = useAuth()
  const role = user?.role || 'mr'
  const isMR = role === 'mr'
  const isManagerOrAdmin = role === 'manager' || role === 'admin'

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState(emptyDoctor)
  const [saving, setSaving] = useState(false)

  // Manager tabs + requests
  const [activeTab, setActiveTab] = useState<'doctors' | 'requests'>('doctors')
  const [requests, setRequests] = useState<DoctorRequest[]>([])
  const [requestsLoading, setRequestsLoading] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)
  const [rejectNotes, setRejectNotes] = useState('')
  const [rejectingId, setRejectingId] = useState<number | null>(null)

  useEffect(() => {
    fetchDoctors()
    if (isMR) {
      fetchMyRequests()
    }
    if (isManagerOrAdmin) {
      fetchPendingCount()
    }
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

  const fetchMyRequests = async () => {
    try {
      const data = await apiGet('/doctor-requests')
      setRequests(data.data || [])
    } catch (err) {
      console.error('Error fetching requests:', err)
    }
  }

  const fetchRequests = async (status?: string) => {
    setRequestsLoading(true)
    try {
      const url = status ? `/doctor-requests?status=${status}` : '/doctor-requests'
      const data = await apiGet(url)
      setRequests(data.data || [])
    } catch (err) {
      console.error('Error fetching requests:', err)
    } finally {
      setRequestsLoading(false)
    }
  }

  const fetchPendingCount = async () => {
    try {
      const data = await apiGet('/doctor-requests/stats')
      setPendingCount(data.stats?.pending || 0)
    } catch (err) {
      console.error('Error fetching pending count:', err)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (isMR) {
        // MR submits a request, not a direct doctor creation
        await apiPost('/doctor-requests', form)
        setShowForm(false)
        setForm(emptyDoctor)
        fetchMyRequests()
      } else if (editingId) {
        await apiPatch(`/doctors/${editingId}`, form)
        setShowForm(false)
        setEditingId(null)
        setForm(emptyDoctor)
        fetchDoctors()
      } else {
        await apiPost('/doctors', form)
        setShowForm(false)
        setForm(emptyDoctor)
        fetchDoctors()
      }
    } catch (err) {
      console.error('Error saving:', err)
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

  const handleApprove = async (id: number) => {
    try {
      await apiPatch(`/doctor-requests/${id}/review`, { status: 'approved' })
      fetchRequests('pending')
      fetchDoctors()
      fetchPendingCount()
    } catch (err) {
      console.error('Error approving request:', err)
    }
  }

  const handleReject = async (id: number) => {
    try {
      await apiPatch(`/doctor-requests/${id}/review`, { status: 'rejected', review_notes: rejectNotes })
      setRejectingId(null)
      setRejectNotes('')
      fetchRequests('pending')
      fetchPendingCount()
    } catch (err) {
      console.error('Error rejecting request:', err)
    }
  }

  const handleTabChange = (tab: 'doctors' | 'requests') => {
    setActiveTab(tab)
    if (tab === 'requests') {
      fetchRequests('pending')
    }
  }

  const openForm = () => {
    const initial = isMR
      ? { ...emptyDoctor, territory: user?.territory || '' }
      : emptyDoctor
    setForm(initial)
    setEditingId(null)
    setShowForm(true)
  }

  const tierColors: Record<string, string> = { A: '#8b5cf6', B: '#3b82f6', C: '#64748b' }
  const statusColors: Record<string, { bg: string; color: string; border: string }> = {
    pending: { bg: '#fef9c3', color: '#a16207', border: '#fde047' },
    approved: { bg: '#dcfce7', color: '#15803d', border: '#86efac' },
    rejected: { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' },
  }

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
            <h1 className="doctor-mgmt-title">{isMR ? 'My Doctors' : 'Doctor Management'}</h1>
            <p className="doctor-mgmt-subtitle">
              {isMR
                ? `${doctors.length} doctor${doctors.length !== 1 ? 's' : ''} in ${user?.territory || 'your territory'}`
                : `${doctors.length} doctor${doctors.length !== 1 ? 's' : ''} total`}
            </p>
          </div>
          <button className="add-doctor-btn" onClick={openForm}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {isMR ? 'Request New Doctor' : 'Add Doctor'}
          </button>
        </div>

        {/* Manager tabs */}
        {isManagerOrAdmin && (
          <div className="dm-tabs">
            <button className={`dm-tab ${activeTab === 'doctors' ? 'dm-tab-active' : ''}`} onClick={() => handleTabChange('doctors')}>
              All Doctors
            </button>
            <button className={`dm-tab ${activeTab === 'requests' ? 'dm-tab-active' : ''}`} onClick={() => handleTabChange('requests')}>
              Pending Requests{pendingCount > 0 && <span className="dm-tab-badge">{pendingCount}</span>}
            </button>
          </div>
        )}

        {/* Form modal */}
        {showForm && (
          <div className="doctor-form-overlay" onClick={() => setShowForm(false)}>
            <form className="doctor-form" onClick={e => e.stopPropagation()} onSubmit={handleSubmit}>
              <h3>{isMR ? 'Request New Doctor' : editingId ? 'Edit Doctor' : 'Add Doctor'}</h3>
              <div className="form-grid">
                <input placeholder="Name *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                <input placeholder="Specialty" value={form.specialty} onChange={e => setForm({ ...form, specialty: e.target.value })} />
                <select value={form.tier} onChange={e => setForm({ ...form, tier: e.target.value as 'A' | 'B' | 'C' })}>
                  <option value="A">Tier A (High)</option>
                  <option value="B">Tier B (Medium)</option>
                  <option value="C">Tier C (Low)</option>
                </select>
                {isMR ? (
                  <input placeholder="Territory" value={form.territory} readOnly className="form-readonly" />
                ) : (
                  <input placeholder="Territory" value={form.territory} onChange={e => setForm({ ...form, territory: e.target.value })} />
                )}
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
                <button type="submit" className="save-btn" disabled={saving}>
                  {saving ? 'Saving...' : isMR ? 'Submit Request' : editingId ? 'Update' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Reject notes modal */}
        {rejectingId !== null && (
          <div className="doctor-form-overlay" onClick={() => { setRejectingId(null); setRejectNotes('') }}>
            <div className="doctor-form" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
              <h3>Reject Request</h3>
              <textarea
                className="reject-notes-input"
                placeholder="Reason for rejection (optional)"
                value={rejectNotes}
                onChange={e => setRejectNotes(e.target.value)}
                rows={3}
              />
              <div className="form-actions">
                <button type="button" className="cancel-btn" onClick={() => { setRejectingId(null); setRejectNotes('') }}>Cancel</button>
                <button type="button" className="save-btn" style={{ background: '#ef4444' }} onClick={() => handleReject(rejectingId)}>Reject</button>
              </div>
            </div>
          </div>
        )}

        {/* Doctor list — shown for MRs always, for managers in "doctors" tab */}
        {(isMR || activeTab === 'doctors') && (
          <>
            {loading ? (
              <div className="doctor-loading">Loading doctors...</div>
            ) : doctors.length === 0 ? (
              <div className="doctor-empty">
                {isMR ? 'No doctors assigned to your territory yet.' : 'No doctor profiles yet. Add one to get started.'}
              </div>
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
                    {isManagerOrAdmin && (
                      <div className="doctor-card-actions">
                        <button className="edit-btn" onClick={() => handleEdit(doc)}>Edit</button>
                        <button className="del-btn" onClick={() => handleDelete(doc.id)}>Delete</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* MR: My Requests section */}
        {isMR && requests.length > 0 && (
          <div className="dm-my-requests">
            <h2 className="dm-section-title">My Requests</h2>
            <div className="dm-request-list">
              {requests.map(req => {
                const sc = statusColors[req.status] || statusColors.pending
                return (
                  <div key={req.id} className="dm-request-card">
                    <div className="dm-request-header">
                      <span className="doctor-name">{req.name}</span>
                      <span className="dm-status-badge" style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}>
                        {req.status}
                      </span>
                    </div>
                    <div className="dm-request-details">
                      {req.specialty && <span>{req.specialty}</span>}
                      {req.territory && <span>{req.territory}</span>}
                      {req.hospital && <span>{req.hospital}</span>}
                    </div>
                    {req.status === 'rejected' && req.review_notes && (
                      <div className="dm-reject-reason">Reason: {req.review_notes}</div>
                    )}
                    <div className="dm-request-date">
                      Requested {new Date(req.created_at).toLocaleDateString()}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Manager: Pending Requests tab */}
        {isManagerOrAdmin && activeTab === 'requests' && (
          <>
            {requestsLoading ? (
              <div className="doctor-loading">Loading requests...</div>
            ) : requests.length === 0 ? (
              <div className="doctor-empty">No pending requests.</div>
            ) : (
              <div className="dm-request-list">
                {requests.map(req => (
                  <div key={req.id} className="dm-request-card dm-request-card-pending">
                    <div className="dm-request-header">
                      <div>
                        <span className="doctor-name">{req.name}</span>
                        <span className="dm-requester">Requested by {req.requester_name || req.requested_by}</span>
                      </div>
                      <span className="doctor-tier" style={{ background: tierColors[req.tier] || '#64748b' }}>{req.tier}</span>
                    </div>
                    <div className="dm-request-details">
                      {req.specialty && <span>{req.specialty}</span>}
                      {req.territory && <span>{req.territory}</span>}
                      {req.hospital && <span>{req.hospital}</span>}
                      {req.phone && <span>{req.phone}</span>}
                      {req.preferred_visit_day && <span>Preferred: {req.preferred_visit_day}</span>}
                    </div>
                    {req.notes && <div className="dm-request-notes">{req.notes}</div>}
                    <div className="dm-request-date">
                      Submitted {new Date(req.created_at).toLocaleDateString()}
                    </div>
                    <div className="dm-request-actions">
                      <button className="dm-approve-btn" onClick={() => handleApprove(req.id)}>Approve</button>
                      <button className="dm-reject-btn" onClick={() => setRejectingId(req.id)}>Reject</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}

export default DoctorManagement
