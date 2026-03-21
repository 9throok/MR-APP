import { useState, useEffect } from 'react'
import Header from './Header'
import Sidebar from './Sidebar'
import { useAuth } from '../contexts/AuthContext'
import { useLanguage } from '../contexts/LanguageContext'
import { apiGet, apiPost, apiPatch, apiDelete } from '../services/apiService'
import './Clients.css'

interface Client {
  id: number
  name: string
  specialization?: string
  mobile: string
  address: string
  type: 'doctor' | 'pharmacy' | 'distributor' | 'hospital' | 'clinic'
  tier?: string
  territory?: string
  preferred_visit_day?: string
  hospital?: string
  phone?: string
  notes?: string
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

const emptyForm = { name: '', specialty: '', tier: 'B' as 'A' | 'B' | 'C', territory: '', preferred_visit_day: '', hospital: '', phone: '', notes: '', customer_type: 'doctor' as 'doctor' | 'pharmacy' | 'distributor' }

// Pharmacy & distributor data remains hardcoded (no backend tables yet)
const staticClients: Client[] = [
  { id: 9, name: 'MedPlus Pharmacy', specialization: 'Retail Pharmacy', mobile: '+91 98765 43220', address: '123 MG Road, Mumbai', type: 'pharmacy' },
  { id: 10, name: 'Apollo Pharmacy', specialization: 'Chain Pharmacy', mobile: '+91 98765 43221', address: '456 Park Street, Mumbai', type: 'pharmacy' },
  { id: 11, name: 'Wellness Forever', specialization: 'Retail Pharmacy', mobile: '+91 98765 43222', address: '789 Linking Road, Mumbai', type: 'pharmacy' },
  { id: 12, name: 'Guardian Pharmacy', specialization: 'Chain Pharmacy', mobile: '+91 98765 43223', address: '321 Bandra West, Mumbai', type: 'pharmacy' },
  { id: 13, name: 'Health Plus Pharmacy', specialization: 'Retail Pharmacy', mobile: '+91 98765 43224', address: '654 Andheri East, Mumbai', type: 'pharmacy' },
  { id: 14, name: 'Care Pharmacy', specialization: 'Retail Pharmacy', mobile: '+91 98765 43225', address: '987 Vashi, Navi Mumbai', type: 'pharmacy' },
  { id: 15, name: 'MediDistributors Pvt Ltd', specialization: 'Medical Distributor', mobile: '+91 98765 43230', address: 'Industrial Area, Mumbai', type: 'distributor' },
  { id: 16, name: 'HealthCare Supplies', specialization: 'Medical Distributor', mobile: '+91 98765 43231', address: 'Sector 18, Navi Mumbai', type: 'distributor' },
  { id: 17, name: 'Pharma Distributors', specialization: 'Pharmaceutical Distributor', mobile: '+91 98765 43232', address: 'MIDC Area, Thane', type: 'distributor' },
  { id: 18, name: 'MedEquip Distributors', specialization: 'Medical Equipment', mobile: '+91 98765 43233', address: 'BKC, Mumbai', type: 'distributor' },
  { id: 19, name: 'Global Medical Supplies', specialization: 'Medical Distributor', mobile: '+91 98765 43234', address: 'Andheri East, Mumbai', type: 'distributor' },
]

interface ClientsProps {
  onLogout: () => void
  onBack: () => void
  userName?: string
  onNavigate?: (page: string) => void
}

function Clients({ onLogout, onBack, userName, onNavigate }: ClientsProps) {
  const { t } = useLanguage()
  const { user } = useAuth()
  const role = user?.role || 'mr'
  const isMR = role === 'mr'
  const isManagerOrAdmin = role === 'manager' || role === 'admin'

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [selectedType, setSelectedType] = useState<Client['type']>('doctor')
  const [doctorsFromDB, setDoctorsFromDB] = useState<Client[]>([])
  const [doctorsLoading, setDoctorsLoading] = useState(true)

  // Request / CRUD state
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  // Manager tabs + requests
  const [activeTab, setActiveTab] = useState<'customers' | 'requests'>('customers')
  const [requests, setRequests] = useState<DoctorRequest[]>([])
  const [requestsLoading, setRequestsLoading] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)
  const [rejectNotes, setRejectNotes] = useState('')
  const [rejectingId, setRejectingId] = useState<number | null>(null)

  useEffect(() => {
    fetchDoctors()
    if (isMR) fetchMyRequests()
    if (isManagerOrAdmin) fetchPendingCount()
  }, [])

  const fetchDoctors = async () => {
    setDoctorsLoading(true)
    try {
      const data = await apiGet('/doctors')
      const mapped: Client[] = (data.data || []).map((d: any) => ({
        id: d.id,
        name: d.name,
        specialization: d.specialty || 'General',
        mobile: d.phone || '',
        address: d.hospital || '',
        type: 'doctor' as const,
        tier: d.tier,
        territory: d.territory,
        preferred_visit_day: d.preferred_visit_day,
        hospital: d.hospital,
        phone: d.phone,
        notes: d.notes,
      }))
      setDoctorsFromDB(mapped)
    } catch (err) {
      console.error('Error fetching doctors:', err)
    } finally {
      setDoctorsLoading(false)
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
        await apiPost('/doctor-requests', form)
        setShowForm(false)
        setForm(emptyForm)
        fetchMyRequests()
      } else if (editingId) {
        await apiPatch(`/doctors/${editingId}`, form)
        setShowForm(false)
        setEditingId(null)
        setForm(emptyForm)
        fetchDoctors()
      } else {
        await apiPost('/doctors', form)
        setShowForm(false)
        setForm(emptyForm)
        fetchDoctors()
      }
    } catch (err) {
      console.error('Error saving:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (client: Client) => {
    setForm({
      name: client.name,
      specialty: client.specialization || '',
      tier: (client.tier as 'A' | 'B' | 'C') || 'B',
      territory: client.territory || '',
      preferred_visit_day: client.preferred_visit_day || '',
      hospital: client.hospital || client.address || '',
      phone: client.phone || client.mobile || '',
      notes: client.notes || '',
    })
    setEditingId(client.id)
    setShowForm(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this customer profile?')) return
    try {
      await apiDelete(`/doctors/${id}`)
      setDoctorsFromDB(prev => prev.filter(d => d.id !== id))
    } catch (err) {
      console.error('Error deleting:', err)
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

  const handleTabChange = (tab: 'customers' | 'requests') => {
    setActiveTab(tab)
    if (tab === 'requests') fetchRequests('pending')
  }

  const openForm = () => {
    const initial = isMR
      ? { ...emptyForm, territory: user?.territory || '', customer_type: selectedType as 'doctor' | 'pharmacy' | 'distributor' }
      : { ...emptyForm, customer_type: selectedType as 'doctor' | 'pharmacy' | 'distributor' }
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

  const clientTypes = [
    { id: 'doctor', label: t('doctors'), icon: '👨‍⚕️' },
    { id: 'pharmacy', label: t('pharmacy'), icon: '💊' },
    { id: 'distributor', label: t('distributors'), icon: '🚚' },
  ]

  const filteredClients = selectedType === 'doctor'
    ? doctorsFromDB
    : staticClients.filter(client => client.type === selectedType)

  const handleCardClick = (client: Client) => {
    if (onNavigate) {
      sessionStorage.setItem('doctor360Client', JSON.stringify(client))
      onNavigate('doctor360')
    }
  }

  return (
    <div className="clients-container">
      <Header onLogout={onLogout} onMenuClick={() => setSidebarOpen(true)} onNavigateHome={() => onNavigate?.('home')} onNavigateOfflineRequests={() => onNavigate?.('offline-requests')} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} userName={userName} onNavigate={onNavigate} onLogout={onLogout} currentPage="clients" />
      <main className="clients-content">
        <div className="clients-header">
          <button className="back-button" onClick={onBack} aria-label="Go back">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div className="clients-header-content">
            <h1 className="clients-title">My Customers</h1>
            <p className="clients-subtitle">
              {selectedType === 'doctor'
                ? `${filteredClients.length} doctor${filteredClients.length !== 1 ? 's' : ''}${isMR && user?.territory ? ` in ${user.territory}` : ''}`
                : `${filteredClients.length} ${selectedType}${filteredClients.length !== 1 ? 's' : ''}`}
            </p>
          </div>
          <button className="add-customer-btn" onClick={openForm}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {isMR ? 'Request New Customer' : 'Add Customer'}
          </button>
        </div>

        <div className="client-types-tabs">
          {clientTypes.map((type) => (
            <button
              key={type.id}
              className={`client-type-tab ${selectedType === type.id ? 'active' : ''}`}
              onClick={() => { setSelectedType(type.id as any); setActiveTab('customers') }}
            >
              <span className="tab-icon">{type.icon}</span>
              <span className="tab-label">{type.label}</span>
            </button>
          ))}
        </div>

        {/* Manager tabs */}
        {isManagerOrAdmin && (
          <div className="mc-tabs">
            <button className={`mc-tab ${activeTab === 'customers' ? 'mc-tab-active' : ''}`} onClick={() => handleTabChange('customers')}>
              All {selectedType === 'doctor' ? 'Doctors' : selectedType === 'pharmacy' ? 'Pharmacies' : 'Distributors'}
            </button>
            <button className={`mc-tab ${activeTab === 'requests' ? 'mc-tab-active' : ''}`} onClick={() => handleTabChange('requests')}>
              Pending Requests{pendingCount > 0 && <span className="mc-tab-badge">{pendingCount}</span>}
            </button>
          </div>
        )}

        {/* Form modal */}
        {showForm && (
          <div className="mc-form-overlay" onClick={() => setShowForm(false)}>
            <form className="mc-form" onClick={e => e.stopPropagation()} onSubmit={handleSubmit}>
              <h3>{isMR ? 'Request New Customer' : editingId ? 'Edit Customer' : 'Add Customer'}</h3>
              <div className="mc-form-grid">
                <select value={form.customer_type} onChange={e => setForm({ ...form, customer_type: e.target.value as 'doctor' | 'pharmacy' | 'distributor' })}>
                  <option value="doctor">Doctor</option>
                  <option value="pharmacy">Pharmacy</option>
                  <option value="distributor">Distributor</option>
                </select>
                <input placeholder="Name *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                <input placeholder={form.customer_type === 'doctor' ? 'Specialty' : 'Type / Category'} value={form.specialty} onChange={e => setForm({ ...form, specialty: e.target.value })} />
                <select value={form.tier} onChange={e => setForm({ ...form, tier: e.target.value as 'A' | 'B' | 'C' })}>
                  <option value="A">Tier A (High)</option>
                  <option value="B">Tier B (Medium)</option>
                  <option value="C">Tier C (Low)</option>
                </select>
                {isMR ? (
                  <input placeholder="Territory" value={form.territory} readOnly className="mc-form-readonly" />
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
              <div className="mc-form-actions">
                <button type="button" className="mc-cancel-btn" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="mc-save-btn" disabled={saving}>
                  {saving ? 'Saving...' : isMR ? 'Submit Request' : editingId ? 'Update' : 'Add Customer'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Reject notes modal */}
        {rejectingId !== null && (
          <div className="mc-form-overlay" onClick={() => { setRejectingId(null); setRejectNotes('') }}>
            <div className="mc-form" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
              <h3>Reject Request</h3>
              <textarea
                className="mc-reject-input"
                placeholder="Reason for rejection (optional)"
                value={rejectNotes}
                onChange={e => setRejectNotes(e.target.value)}
                rows={3}
              />
              <div className="mc-form-actions">
                <button type="button" className="mc-cancel-btn" onClick={() => { setRejectingId(null); setRejectNotes('') }}>Cancel</button>
                <button type="button" className="mc-save-btn" style={{ background: '#ef4444' }} onClick={() => handleReject(rejectingId)}>Reject</button>
              </div>
            </div>
          </div>
        )}

        {/* Customer cards — for MRs always, for managers in "customers" tab */}
        {(activeTab === 'customers' || !isManagerOrAdmin) && (
          <div className="clients-list">
            {selectedType === 'doctor' && doctorsLoading ? (
              <div className="no-clients">
                <p>Loading doctors...</p>
              </div>
            ) : filteredClients.length === 0 ? (
              <div className="no-clients">
                <p>{t('noClientsFound')}</p>
              </div>
            ) : (
              filteredClients.map((client) => (
                <div
                  key={client.id}
                  className="client-card"
                  onClick={() => handleCardClick(client)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleCardClick(client) }}
                >
                  <div className="client-card-main">
                    <div className="client-card-info">
                      <span className="client-name">{client.name}</span>
                      <span className="client-specialty">{client.specialization || 'General'}</span>
                    </div>
                    {client.tier && (
                      <span className="client-tier" style={{ background: tierColors[client.tier] || '#64748b' }}>{client.tier}</span>
                    )}
                  </div>
                  <div className="client-card-meta">
                    {client.territory && <span>{client.territory}</span>}
                    {client.address && <span>{client.address}</span>}
                    {client.preferred_visit_day && <span>{client.preferred_visit_day}</span>}
                  </div>
                  {isManagerOrAdmin && (
                    <div className="client-card-actions" onClick={e => e.stopPropagation()}>
                      <button className="mc-edit-btn" onClick={() => handleEdit(client)}>Edit</button>
                      <button className="mc-del-btn" onClick={() => handleDelete(client.id)}>Delete</button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* MR: My Requests section */}
        {isMR && requests.length > 0 && (
          <div className="mc-my-requests">
            <h2 className="mc-section-title">My Requests</h2>
            <div className="mc-request-list">
              {requests.map(req => {
                const sc = statusColors[req.status] || statusColors.pending
                return (
                  <div key={req.id} className="mc-request-card">
                    <div className="mc-request-header">
                      <span className="client-name">{req.name}</span>
                      <span className="mc-status-badge" style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}>
                        {req.status}
                      </span>
                    </div>
                    <div className="mc-request-details">
                      {req.specialty && <span>{req.specialty}</span>}
                      {req.territory && <span>{req.territory}</span>}
                      {req.hospital && <span>{req.hospital}</span>}
                    </div>
                    {req.status === 'rejected' && req.review_notes && (
                      <div className="mc-reject-reason">Reason: {req.review_notes}</div>
                    )}
                    <div className="mc-request-date">
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
              <div className="no-clients"><p>Loading requests...</p></div>
            ) : requests.length === 0 ? (
              <div className="no-clients"><p>No pending requests.</p></div>
            ) : (
              <div className="mc-request-list">
                {requests.map(req => (
                  <div key={req.id} className="mc-request-card mc-request-card-pending">
                    <div className="mc-request-header">
                      <div>
                        <span className="client-name">{req.name}</span>
                        <span className="mc-requester">Requested by {req.requester_name || req.requested_by}</span>
                      </div>
                      <span className="client-tier" style={{ background: tierColors[req.tier] || '#64748b' }}>{req.tier}</span>
                    </div>
                    <div className="mc-request-details">
                      {req.specialty && <span>{req.specialty}</span>}
                      {req.territory && <span>{req.territory}</span>}
                      {req.hospital && <span>{req.hospital}</span>}
                      {req.phone && <span>{req.phone}</span>}
                      {req.preferred_visit_day && <span>Preferred: {req.preferred_visit_day}</span>}
                    </div>
                    {req.notes && <div className="mc-request-notes">{req.notes}</div>}
                    <div className="mc-request-date">
                      Submitted {new Date(req.created_at).toLocaleDateString()}
                    </div>
                    <div className="mc-request-actions">
                      <button className="mc-approve-btn" onClick={() => handleApprove(req.id)}>Approve</button>
                      <button className="mc-reject-btn" onClick={() => setRejectingId(req.id)}>Reject</button>
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

export default Clients
