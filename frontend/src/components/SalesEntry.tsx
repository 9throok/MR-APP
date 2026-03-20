import { useState, useEffect } from 'react'
import Header from './Header'
import Sidebar from './Sidebar'
import SalesUpload from './SalesUpload'
import { useAuth } from '../contexts/AuthContext'
import { apiGet, apiPost, apiPatch, apiDelete } from '../services/apiService'
import './SalesEntry.css'

interface SalesEntryProps {
  onLogout: () => void
  onBack: () => void
  userName?: string
  userEmail?: string
  userMobile?: string
  onNavigate?: (page: string) => void
}

interface SaleRecord {
  id: number
  user_id: string
  territory: string
  distributor_id: number | null
  distributor_name: string | null
  distributor_code: string | null
  product_id: number
  product_name: string
  sale_date: string
  quantity: number
  value: string
  batch_number: string | null
  notes: string | null
}

interface Distributor {
  id: number
  name: string
  territory: string
  code: string
}

interface Product {
  id: number
  name: string
}

interface MRUser {
  user_id: string
  name: string
  territory: string
}

function SalesEntry({ onLogout, onBack, userName, userEmail, userMobile, onNavigate }: SalesEntryProps) {
  const { user } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showUpload, setShowUpload] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [sales, setSales] = useState<SaleRecord[]>([])
  const [distributors, setDistributors] = useState<Distributor[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [mrUsers, setMrUsers] = useState<MRUser[]>([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [filterMR, setFilterMR] = useState('')
  const [filterFrom, setFilterFrom] = useState('')
  const [filterTo, setFilterTo] = useState('')

  // Form state
  const [formMR, setFormMR] = useState('')
  const [formDistributor, setFormDistributor] = useState('')
  const [formProduct, setFormProduct] = useState('')
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0])
  const [formQty, setFormQty] = useState('')
  const [formValue, setFormValue] = useState('')
  const [formBatch, setFormBatch] = useState('')
  const [formNotes, setFormNotes] = useState('')
  const [saving, setSaving] = useState(false)

  // Filtered distributors based on selected MR's territory
  const selectedMRTerritory = mrUsers.find(m => m.user_id === formMR)?.territory
  const filteredDistributors = selectedMRTerritory
    ? distributors.filter(d => d.territory === selectedMRTerritory)
    : distributors

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [salesRes, distRes, prodRes] = await Promise.all([
        apiGet('/sales'),
        apiGet('/sales/distributors'),
        apiGet('/products')
      ])
      setSales(salesRes.data || [])
      setDistributors(distRes.data || [])
      setProducts(prodRes.data || prodRes)

      // Get MR list from sales data or use a simple approach
      const mrMap = new Map<string, MRUser>()
      ;(salesRes.data || []).forEach((s: SaleRecord) => {
        if (!mrMap.has(s.user_id)) {
          mrMap.set(s.user_id, { user_id: s.user_id, name: s.user_id, territory: s.territory })
        }
      })
      // Add known MRs
      const knownMRs: MRUser[] = [
        { user_id: 'mr_rahul_001', name: 'Rahul Sharma', territory: 'Mumbai North' },
        { user_id: 'mr_priya_002', name: 'Priya Patel', territory: 'Mumbai South' },
        { user_id: 'mr_robert_003', name: 'Robert Johnson', territory: 'Delhi NCR' },
      ]
      knownMRs.forEach(m => mrMap.set(m.user_id, m))
      setMrUsers(Array.from(mrMap.values()))
    } catch (err) {
      console.error('Failed to load sales data:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadSales = async () => {
    try {
      const params = new URLSearchParams()
      if (filterMR) params.set('user_id', filterMR)
      if (filterFrom) params.set('from_date', filterFrom)
      if (filterTo) params.set('to_date', filterTo)
      const res = await apiGet(`/sales?${params.toString()}`)
      setSales(res.data || [])
    } catch (err) {
      console.error('Failed to load sales:', err)
    }
  }

  useEffect(() => {
    if (!loading) loadSales()
  }, [filterMR, filterFrom, filterTo])

  const resetForm = () => {
    setFormMR('')
    setFormDistributor('')
    setFormProduct('')
    setFormDate(new Date().toISOString().split('T')[0])
    setFormQty('')
    setFormValue('')
    setFormBatch('')
    setFormNotes('')
    setEditingId(null)
  }

  const handleSubmit = async () => {
    if (!formMR || !formProduct || !formDate || !formQty || !formValue) return
    setSaving(true)
    try {
      const body = {
        user_id: formMR,
        distributor_id: formDistributor ? parseInt(formDistributor) : null,
        product_id: parseInt(formProduct),
        sale_date: formDate,
        quantity: parseInt(formQty),
        value: parseFloat(formValue),
        batch_number: formBatch || null,
        notes: formNotes || null,
      }

      if (editingId) {
        await apiPatch(`/sales/${editingId}`, body)
      } else {
        await apiPost('/sales', body)
      }
      resetForm()
      setShowForm(false)
      loadSales()
    } catch (err) {
      console.error('Save failed:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (sale: SaleRecord) => {
    setFormMR(sale.user_id)
    setFormDistributor(sale.distributor_id?.toString() || '')
    setFormProduct(sale.product_id.toString())
    setFormDate(sale.sale_date.split('T')[0])
    setFormQty(sale.quantity.toString())
    setFormValue(parseFloat(sale.value).toString())
    setFormBatch(sale.batch_number || '')
    setFormNotes(sale.notes || '')
    setEditingId(sale.id)
    setShowForm(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this sales record?')) return
    try {
      await apiDelete(`/sales/${id}`)
      loadSales()
    } catch (err) {
      console.error('Delete failed:', err)
    }
  }

  return (
    <div className="sales-entry-container">
      <Header onLogout={onLogout} onMenuClick={() => setSidebarOpen(true)} onNavigateHome={() => onNavigate?.('home')} onNavigateOfflineRequests={() => onNavigate?.('offline-requests')} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} userName={userName} userEmail={userEmail} userMobile={userMobile} onNavigate={onNavigate} onLogout={onLogout} currentPage="sales-entry" />

      <main className="sales-entry-content">
        <div className="sales-entry-title-row">
          <h1>Sales Entry</h1>
          <div className="sales-entry-actions">
            <button className="sales-entry-btn sales-entry-btn-outline" onClick={() => setShowUpload(true)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M21 15V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V15M17 8L12 3M12 3L7 8M12 3V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Bulk Upload
            </button>
            <button className="sales-entry-btn sales-entry-btn-primary" onClick={() => { resetForm(); setShowForm(!showForm) }}>
              {showForm ? 'Cancel' : '+ Add Record'}
            </button>
          </div>
        </div>

        {showForm && (
          <div className="sales-entry-form-card">
            <h2>{editingId ? 'Edit Sale Record' : 'New Sale Record'}</h2>
            <div className="sales-entry-form-grid">
              <div className="sales-entry-form-group">
                <label>MR *</label>
                <select value={formMR} onChange={e => { setFormMR(e.target.value); setFormDistributor('') }}>
                  <option value="">Select MR</option>
                  {mrUsers.map(m => <option key={m.user_id} value={m.user_id}>{m.name} ({m.territory})</option>)}
                </select>
              </div>
              <div className="sales-entry-form-group">
                <label>Distributor</label>
                <select value={formDistributor} onChange={e => setFormDistributor(e.target.value)}>
                  <option value="">Select Distributor</option>
                  {filteredDistributors.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div className="sales-entry-form-group">
                <label>Product *</label>
                <select value={formProduct} onChange={e => setFormProduct(e.target.value)}>
                  <option value="">Select Product</option>
                  {products.map((p: Product) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="sales-entry-form-group">
                <label>Sale Date *</label>
                <input type="date" value={formDate} onChange={e => setFormDate(e.target.value)} />
              </div>
              <div className="sales-entry-form-group">
                <label>Quantity *</label>
                <input type="number" min="1" value={formQty} onChange={e => setFormQty(e.target.value)} placeholder="0" />
              </div>
              <div className="sales-entry-form-group">
                <label>Value (Rs) *</label>
                <input type="number" min="0" step="0.01" value={formValue} onChange={e => setFormValue(e.target.value)} placeholder="0.00" />
              </div>
              <div className="sales-entry-form-group">
                <label>Batch Number</label>
                <input type="text" value={formBatch} onChange={e => setFormBatch(e.target.value)} placeholder="Optional" />
              </div>
              <div className="sales-entry-form-group">
                <label>Notes</label>
                <input type="text" value={formNotes} onChange={e => setFormNotes(e.target.value)} placeholder="Optional" />
              </div>
            </div>
            <div className="sales-entry-form-actions">
              <button className="sales-entry-btn sales-entry-btn-outline" onClick={() => { resetForm(); setShowForm(false) }}>Cancel</button>
              <button className="sales-entry-btn sales-entry-btn-primary" onClick={handleSubmit} disabled={saving || !formMR || !formProduct || !formDate || !formQty || !formValue}>
                {saving ? 'Saving...' : editingId ? 'Update' : 'Save'}
              </button>
            </div>
          </div>
        )}

        <div className="sales-entry-filters">
          <select value={filterMR} onChange={e => setFilterMR(e.target.value)}>
            <option value="">All MRs</option>
            {mrUsers.map(m => <option key={m.user_id} value={m.user_id}>{m.name}</option>)}
          </select>
          <input type="date" value={filterFrom} onChange={e => setFilterFrom(e.target.value)} placeholder="From date" />
          <input type="date" value={filterTo} onChange={e => setFilterTo(e.target.value)} placeholder="To date" />
        </div>

        <div className="sales-entry-table-card">
          <div className="sales-entry-table-wrapper">
            <table className="sales-entry-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>MR</th>
                  <th>Territory</th>
                  <th>Product</th>
                  <th>Distributor</th>
                  <th>Qty</th>
                  <th>Value (Rs)</th>
                  <th>Batch</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={9} style={{ textAlign: 'center', padding: 30 }}>Loading...</td></tr>
                ) : sales.length === 0 ? (
                  <tr><td colSpan={9}>
                    <div className="sales-entry-empty">
                      <p>No sales records found</p>
                    </div>
                  </td></tr>
                ) : (
                  sales.map(s => (
                    <tr key={s.id}>
                      <td>{new Date(s.sale_date).toLocaleDateString('en-IN')}</td>
                      <td>{s.user_id}</td>
                      <td>{s.territory}</td>
                      <td>{s.product_name}</td>
                      <td>{s.distributor_name || '—'}</td>
                      <td>{s.quantity}</td>
                      <td>{parseFloat(s.value).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      <td>{s.batch_number || '—'}</td>
                      <td>
                        <div className="sales-entry-table-actions">
                          <button onClick={() => handleEdit(s)} title="Edit">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13M18.5 2.50001C18.8978 2.10219 19.4374 1.87869 20 1.87869C20.5626 1.87869 21.1022 2.10219 21.5 2.50001C21.8978 2.89784 22.1213 3.4374 22.1213 4.00001C22.1213 4.56262 21.8978 5.10219 21.5 5.50001L12 15L8 16L9 12L18.5 2.50001Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          </button>
                          <button className="delete" onClick={() => handleDelete(s.id)} title="Delete">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M3 6H5H21M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {showUpload && (
        <SalesUpload type="sales" onClose={() => setShowUpload(false)} onSuccess={() => { setShowUpload(false); loadSales() }} />
      )}
    </div>
  )
}

export default SalesEntry
