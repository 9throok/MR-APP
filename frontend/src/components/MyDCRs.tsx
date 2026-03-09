import { useState, useEffect } from 'react'
import Header from './Header'
import Sidebar from './Sidebar'
import './MyDCRs.css'

interface MyDCRsProps {
  onLogout: () => void
  onBack: () => void
  userName?: string
  onNavigate?: (page: string) => void
}

interface DCRSample {
  id: number
  name: string
  quantity: number
}

interface DCREntry {
  id: number
  name: string
  date: string
  product: string
  samples: DCRSample[]
  call_summary: string
  rating: number
  user_id: string
  created_at: string
}

function MyDCRs({ onLogout, onBack, userName, onNavigate }: MyDCRsProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [dcrs, setDcrs] = useState<DCREntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    const fetchDCRs = async () => {
      setLoading(true)
      setError(null)
      try {
        const userId = (() => {
          try { return localStorage.getItem('userId') || localStorage.getItem('user_id') || 'mr_rahul_001' } catch { return 'mr_rahul_001' }
        })()
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/dcr?user_id=${encodeURIComponent(userId)}`)
        if (!res.ok) throw new Error(`Server error: ${res.status}`)
        const json = await res.json()
        if (json.success) {
          setDcrs(json.data)
        } else {
          throw new Error('Failed to fetch DCRs')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong')
      } finally {
        setLoading(false)
      }
    }
    fetchDCRs()
  }, [])

  const filteredDcrs = dcrs.filter(dcr =>
    dcr.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    dcr.product.toLowerCase().includes(searchQuery.toLowerCase()) ||
    dcr.date.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const renderStars = (rating: number) => (
    <div className="mydcr-stars">
      {[1, 2, 3, 4, 5].map(s => (
        <svg key={s} width="16" height="16" viewBox="0 0 24 24" fill={s <= rating ? '#f59e0b' : 'none'} xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
            fill={s <= rating ? '#f59e0b' : 'none'} stroke={s <= rating ? '#f59e0b' : '#cbd5e1'} strokeWidth="1.5"
            strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ))}
    </div>
  )

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    } catch { return iso }
  }

  return (
    <div className="mydcrs-container">
      <Header
        onLogout={onLogout}
        onMenuClick={() => setSidebarOpen(true)}
        onNavigateHome={() => onNavigate?.('home')}
        onNavigateOfflineRequests={() => onNavigate?.('offline-requests')}
      />
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        userName={userName}
        onNavigate={onNavigate}
        onLogout={onLogout}
        currentPage="my-dcrs"
      />

      <main className="mydcrs-content">
        {/* Header */}
        <div className="mydcrs-header">
          <button className="mydcrs-back-btn" onClick={onBack} aria-label="Go back">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div>
            <h1 className="mydcrs-title">My DCRs</h1>
            <p className="mydcrs-subtitle">{loading ? 'Loading…' : `${filteredDcrs.length} report${filteredDcrs.length !== 1 ? 's' : ''} found`}</p>
          </div>
        </div>

        {/* Search */}
        <div className="mydcrs-search-wrapper">
          <svg className="mydcrs-search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
            <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <input
            className="mydcrs-search"
            type="text"
            placeholder="Search by name, product or date…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="mydcrs-search-clear" onClick={() => setSearchQuery('')}>✕</button>
          )}
        </div>

        {/* Loading */}
        {loading && (
          <div className="mydcrs-loader">
            <svg width="44" height="44" viewBox="0 0 48 48" fill="none">
              <circle cx="24" cy="24" r="20" stroke="#e2e8f0" strokeWidth="4"/>
              <circle cx="24" cy="24" r="20" stroke="#22c55e" strokeWidth="4" strokeLinecap="round" strokeDasharray="31.4 94.2">
                <animateTransform attributeName="transform" type="rotate" from="0 24 24" to="360 24 24" dur="0.8s" repeatCount="indefinite"/>
              </circle>
            </svg>
            <p>Fetching DCRs…</p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="mydcrs-error">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
              <path d="M12 8V12M12 16H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && filteredDcrs.length === 0 && (
          <div className="mydcrs-empty">
            <svg width="56" height="56" viewBox="0 0 24 24" fill="none">
              <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M14 2V8H20M16 13H8M16 17H8M10 9H9H8" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <p>{searchQuery ? 'No DCRs match your search.' : 'No DCRs submitted yet.'}</p>
          </div>
        )}

        {/* DCR Cards */}
        {!loading && !error && filteredDcrs.length > 0 && (
          <div className="mydcrs-list">
            {filteredDcrs.map(dcr => {
              const isExpanded = expandedId === dcr.id
              return (
                <div key={dcr.id} className={`mydcr-card ${isExpanded ? 'mydcr-card--expanded' : ''}`}>
                  {/* Card Header */}
                  <button
                    className="mydcr-card-header"
                    onClick={() => setExpandedId(isExpanded ? null : dcr.id)}
                    aria-expanded={isExpanded}
                  >
                    <div className="mydcr-card-left">
                      <div className="mydcr-avatar">
                        {dcr.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="mydcr-card-info">
                        <span className="mydcr-name">{dcr.name}</span>
                        <span className="mydcr-date-sub">{dcr.date}</span>
                      </div>
                    </div>
                    <div className="mydcr-card-right">
                      <span className="mydcr-product-badge">{dcr.product}</span>
                      <svg
                        className={`mydcr-chevron ${isExpanded ? 'mydcr-chevron--up' : ''}`}
                        width="18" height="18" viewBox="0 0 24 24" fill="none"
                      >
                        <path d="M19 9L12 15L5 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  </button>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="mydcr-card-body">
                      <div className="mydcr-detail-grid">
                        {/* Rating */}
                        <div className="mydcr-detail-item">
                          <span className="mydcr-detail-label">Rating</span>
                          {renderStars(dcr.rating)}
                        </div>

                        {/* Submitted */}
                        <div className="mydcr-detail-item">
                          <span className="mydcr-detail-label">Submitted At</span>
                          <span className="mydcr-detail-value">{formatDate(dcr.created_at)}</span>
                        </div>

                        {/* Call Summary */}
                        <div className="mydcr-detail-item mydcr-detail-full">
                          <span className="mydcr-detail-label">Call Summary</span>
                          <p className="mydcr-summary-text">{dcr.call_summary}</p>
                        </div>

                        {/* Samples */}
                        {dcr.samples && dcr.samples.length > 0 && (
                          <div className="mydcr-detail-item mydcr-detail-full">
                            <span className="mydcr-detail-label">Samples Distributed</span>
                            <div className="mydcr-samples-list">
                              {dcr.samples.map((sample, idx) => (
                                <div key={idx} className="mydcr-sample-chip">
                                  <span className="mydcr-sample-name">{sample.name}</span>
                                  <span className="mydcr-sample-qty">Qty: {sample.quantity}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}

export default MyDCRs
