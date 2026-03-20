import { useState, useEffect } from 'react'
import Header from './Header'
import Sidebar from './Sidebar'
import SalesUpload from './SalesUpload'
import { useAuth } from '../contexts/AuthContext'
import { apiGet, apiPost } from '../services/apiService'
import './SalesTargets.css'

interface SalesTargetsProps {
  onLogout: () => void
  onBack: () => void
  userName?: string
  userEmail?: string
  userMobile?: string
  onNavigate?: (page: string) => void
}

interface Target {
  id: number
  user_id: string
  product_id: number
  product_name: string
  period: string
  target_qty: number
  target_value: string
}

interface Product {
  id: number
  name: string
}

interface EditableTarget {
  product_id: number
  product_name: string
  target_qty: string
  target_value: string
}

const MR_USERS = [
  { user_id: 'mr_rahul_001', name: 'Rahul Sharma', territory: 'Mumbai North' },
  { user_id: 'mr_priya_002', name: 'Priya Patel', territory: 'Mumbai South' },
  { user_id: 'mr_robert_003', name: 'Robert Johnson', territory: 'Delhi NCR' },
]

function SalesTargets({ onLogout, onBack: _onBack, userName, userEmail, userMobile, onNavigate }: SalesTargetsProps) {
  const { user } = useAuth()
  const isManager = user?.role === 'manager' || user?.role === 'admin'
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showUpload, setShowUpload] = useState(false)
  const [targets, setTargets] = useState<Target[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [selectedMR, setSelectedMR] = useState(isManager ? '' : (user?.user_id || ''))
  const [selectedPeriod, setSelectedPeriod] = useState(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  })

  // Editable grid for setting targets
  const [editGrid, setEditGrid] = useState<EditableTarget[]>([])
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    loadProducts()
  }, [])

  useEffect(() => {
    loadTargets()
  }, [selectedMR, selectedPeriod])

  const loadProducts = async () => {
    try {
      const res = await apiGet('/products')
      setProducts(res.data || res)
    } catch (err) {
      console.error('Failed to load products:', err)
    }
  }

  const loadTargets = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (selectedMR) params.set('user_id', selectedMR)
      if (selectedPeriod) params.set('period', selectedPeriod)
      const res = await apiGet(`/targets?${params.toString()}`)
      setTargets(res.data || [])
    } catch (err) {
      console.error('Failed to load targets:', err)
    } finally {
      setLoading(false)
    }
  }

  const startEditing = () => {
    if (!selectedMR || !selectedPeriod) return
    // Build grid from products, pre-fill with existing targets
    const grid = products.map(p => {
      const existing = targets.find(t => t.product_id === p.id && t.user_id === selectedMR)
      return {
        product_id: p.id,
        product_name: p.name,
        target_qty: existing ? existing.target_qty.toString() : '',
        target_value: existing ? parseFloat(existing.target_value).toString() : '',
      }
    })
    setEditGrid(grid)
    setIsEditing(true)
  }

  const handleGridChange = (index: number, field: 'target_qty' | 'target_value', value: string) => {
    setEditGrid(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
  }

  const handleSaveAll = async () => {
    if (!selectedMR || !selectedPeriod) return
    setSaving(true)
    try {
      const targetsToSave = editGrid
        .filter(t => t.target_qty && t.target_value)
        .map(t => ({
          user_id: selectedMR,
          product_id: t.product_id,
          period: selectedPeriod,
          target_qty: parseInt(t.target_qty),
          target_value: parseFloat(t.target_value),
        }))

      if (targetsToSave.length > 0) {
        await apiPost('/targets/bulk', { targets: targetsToSave })
      }
      setIsEditing(false)
      loadTargets()
    } catch (err) {
      console.error('Save failed:', err)
    } finally {
      setSaving(false)
    }
  }

  // Generate period options (last 6 months + next 3 months)
  const periodOptions: string[] = []
  for (let i = -6; i <= 3; i++) {
    const d = new Date()
    d.setMonth(d.getMonth() + i)
    periodOptions.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }

  // Group targets by MR for overview mode
  const targetsByMR = new Map<string, Target[]>()
  targets.forEach(t => {
    const list = targetsByMR.get(t.user_id) || []
    list.push(t)
    targetsByMR.set(t.user_id, list)
  })

  return (
    <div className="sales-targets-container">
      <Header onLogout={onLogout} onMenuClick={() => setSidebarOpen(true)} onNavigateHome={() => onNavigate?.('home')} onNavigateOfflineRequests={() => onNavigate?.('offline-requests')} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} userName={userName} userEmail={userEmail} userMobile={userMobile} onNavigate={onNavigate} onLogout={onLogout} currentPage="sales-targets" />

      <main className="sales-targets-content">
        <div className="sales-targets-title-row">
          <h1>Sales Targets</h1>
          {isManager && (
            <div className="sales-targets-actions">
              <button className="sales-targets-btn sales-targets-btn-outline" onClick={() => setShowUpload(true)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M21 15V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V15M17 8L12 3M12 3L7 8M12 3V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                Bulk Upload
              </button>
              {!isEditing ? (
                <button className="sales-targets-btn sales-targets-btn-primary" onClick={startEditing} disabled={!selectedMR || !selectedPeriod}>
                  Set Targets
                </button>
              ) : (
                <button className="sales-targets-btn sales-targets-btn-primary" onClick={handleSaveAll} disabled={saving}>
                  {saving ? 'Saving...' : 'Save All'}
                </button>
              )}
            </div>
          )}
        </div>

        <div className="sales-targets-selectors">
          {isManager && (
            <select value={selectedMR} onChange={e => { setSelectedMR(e.target.value); setIsEditing(false) }}>
              <option value="">All MRs</option>
              {MR_USERS.map(m => <option key={m.user_id} value={m.user_id}>{m.name} ({m.territory})</option>)}
            </select>
          )}
          <select value={selectedPeriod} onChange={e => { setSelectedPeriod(e.target.value); setIsEditing(false) }}>
            {periodOptions.map(p => (
              <option key={p} value={p}>{new Date(p + '-01').toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}</option>
            ))}
          </select>
          {isEditing && (
            <button className="sales-targets-btn sales-targets-btn-outline" onClick={() => setIsEditing(false)}>Cancel Edit</button>
          )}
        </div>

        {isEditing ? (
          <div className="sales-targets-card">
            <div className="sales-targets-card-header">
              <h2>Set Targets for {MR_USERS.find(m => m.user_id === selectedMR)?.name} — {new Date(selectedPeriod + '-01').toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}</h2>
            </div>
            <div className="sales-targets-table-wrapper">
              <table className="sales-targets-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Target Qty</th>
                    <th>Target Value (Rs)</th>
                  </tr>
                </thead>
                <tbody>
                  {editGrid.map((t, i) => (
                    <tr key={t.product_id}>
                      <td>{t.product_name}</td>
                      <td><input type="number" min="0" value={t.target_qty} onChange={e => handleGridChange(i, 'target_qty', e.target.value)} placeholder="0" /></td>
                      <td><input type="number" min="0" step="0.01" value={t.target_value} onChange={e => handleGridChange(i, 'target_value', e.target.value)} placeholder="0.00" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="sales-targets-card">
            <div className="sales-targets-table-wrapper">
              <table className="sales-targets-table">
                <thead>
                  <tr>
                    <th>MR</th>
                    <th>Product</th>
                    <th>Period</th>
                    <th>Target Qty</th>
                    <th>Target Value (Rs)</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={5} style={{ textAlign: 'center', padding: 30 }}>Loading...</td></tr>
                  ) : targets.length === 0 ? (
                    <tr><td colSpan={5}>
                      <div className="sales-targets-empty">
                        <p>No targets set for this period</p>
                      </div>
                    </td></tr>
                  ) : (
                    targets.map(t => (
                      <tr key={t.id}>
                        <td>{MR_USERS.find(m => m.user_id === t.user_id)?.name || t.user_id}</td>
                        <td>{t.product_name}</td>
                        <td>{new Date(t.period + '-01').toLocaleDateString('en-US', { year: 'numeric', month: 'short' })}</td>
                        <td>{t.target_qty.toLocaleString('en-IN')}</td>
                        <td>{parseFloat(t.target_value).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {showUpload && (
        <SalesUpload type="targets" onClose={() => setShowUpload(false)} onSuccess={() => { setShowUpload(false); loadTargets() }} />
      )}
    </div>
  )
}

export default SalesTargets
