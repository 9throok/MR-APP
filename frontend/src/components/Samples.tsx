import { useState, useEffect } from 'react'
import Header from './Header'
import Sidebar from './Sidebar'
import { apiGet } from '../services/apiService'
import './Samples.css'

interface StockRow {
  id: number
  user_id: string
  product_id: number
  product_name: string
  lot_number: string
  quantity: number
  expiry_date: string | null
  last_movement_at: string | null
}

interface SamplesProps {
  onLogout: () => void
  onBack: () => void
  userName?: string
  onNavigate?: (page: string) => void
}

function formatDate(s: string | null): string {
  if (!s) return '-'
  const d = new Date(s)
  if (Number.isNaN(d.getTime())) return s
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function brandOf(productName: string): string {
  return (productName.split(' ')[0] || productName).trim()
}

function Samples({ onLogout, onBack, userName, onNavigate }: SamplesProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [stock, setStock] = useState<StockRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadStock = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiGet('/samples/stock')
      setStock(res.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load samples')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadStock() }, [])

  const handleMenuClick = () => setSidebarOpen(true)
  const handleSidebarClose = () => setSidebarOpen(false)

  const q = searchQuery.toLowerCase()
  const filteredInventory = stock.filter(item => {
    if (!q) return true
    return (
      item.product_name.toLowerCase().includes(q) ||
      item.lot_number.toLowerCase().includes(q) ||
      brandOf(item.product_name).toLowerCase().includes(q)
    )
  })

  return (
    <div className="samples-container">
      <Header onLogout={onLogout} onMenuClick={handleMenuClick} onNavigateHome={() => onNavigate?.('home')} onNavigateOfflineRequests={() => onNavigate?.('offline-requests')} />
      <Sidebar isOpen={sidebarOpen} onClose={handleSidebarClose} userName={userName} onNavigate={onNavigate} onLogout={onLogout} />
      <main className="samples-content">
        <div className="samples-header">
          <button className="back-button" onClick={onBack} aria-label="Go back">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <h1 className="samples-title">Sample Management</h1>
        </div>

        {error && <div style={{ background: '#fef2f2', color: '#b91c1c', padding: 10, borderRadius: 6, margin: '8px 16px' }}>{error}</div>}

        <div className="samples-controls">
          <div className="search-bar">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
              <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <input
              type="text"
              placeholder="Search by product or batch number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>
        </div>

        <div className="inventory-table-container">
          <div className="inventory-table-card">
            <table className="inventory-table">
              <thead>
                <tr>
                  <th>Brand</th>
                  <th>Product</th>
                  <th>Quantity</th>
                  <th>Batch Number</th>
                  <th>Expiry Date</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} className="no-data">Loading…</td></tr>
                ) : filteredInventory.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="no-data">
                      {stock.length === 0
                        ? 'No samples allocated. Your manager allocates stock via Sample Inventory in Admin.'
                        : 'No inventory found matching your search criteria.'}
                    </td>
                  </tr>
                ) : (
                  filteredInventory.map((item) => (
                    <tr key={item.id}>
                      <td>{brandOf(item.product_name)}</td>
                      <td>{item.product_name}</td>
                      <td>{item.quantity}</td>
                      <td>{item.lot_number}</td>
                      <td>{formatDate(item.expiry_date)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}

export default Samples
