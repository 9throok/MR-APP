import { useState, useEffect } from 'react'
import Header from './Header'
import Sidebar from './Sidebar'
import { apiGet } from '../services/apiService'
import { useAuth } from '../contexts/AuthContext'
import './MRList.css'

interface MR {
  id: number
  user_id: string
  username: string
  email: string | null
  role: string
  name: string
  territory: string | null
  created_at: string | null
}

interface MRListProps {
  onLogout: () => void
  onBack: () => void
  userName?: string
  onNavigate?: (page: string, data?: unknown) => void
}

function MRList({ onLogout, onBack, userName, onNavigate }: MRListProps) {
  const { user } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Inactive'>('All')
  const [mrs, setMrs] = useState<MR[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const isManagerOrAdmin = user?.role === 'manager' || user?.role === 'admin'

  useEffect(() => {
    if (!isManagerOrAdmin) {
      if (onNavigate) onNavigate('home')
      return
    }
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await apiGet('/users?role=mr')
        setMrs(res.data || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load MRs')
      } finally {
        setLoading(false)
      }
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isManagerOrAdmin])

  const handleMenuClick = () => setSidebarOpen(true)
  const handleSidebarClose = () => setSidebarOpen(false)

  const handleMRClick = (mr: MR) => {
    if (onNavigate) {
      sessionStorage.setItem('selectedMR', JSON.stringify(mr))
      onNavigate('mr-detail', mr)
    }
  }

  const filteredMRs = mrs.filter(mr => {
    const q = searchQuery.toLowerCase()
    const matchesSearch =
      !q ||
      mr.user_id.toLowerCase().includes(q) ||
      mr.name.toLowerCase().includes(q) ||
      (mr.email || '').toLowerCase().includes(q) ||
      (mr.territory || '').toLowerCase().includes(q)
    // We don't track active/inactive yet — treat every MR as Active.
    const matchesStatus = statusFilter === 'All' || statusFilter === 'Active'
    return matchesSearch && matchesStatus
  })

  if (!isManagerOrAdmin) return null

  return (
    <div className="mr-list-container">
      <Header onLogout={onLogout} onMenuClick={handleMenuClick} onNavigateHome={() => onNavigate?.('home')} onNavigateOfflineRequests={() => onNavigate?.('offline-requests')} />
      <Sidebar isOpen={sidebarOpen} onClose={handleSidebarClose} userName={userName} onNavigate={onNavigate} onLogout={onLogout} currentPage="mr-list" />
      <main className="mr-list-content">
        <div className="mr-list-header">
          <button className="back-button" onClick={onBack} aria-label="Go back">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <h1 className="mr-list-title">MR List</h1>
        </div>

        {error && <div style={{ background: '#fef2f2', color: '#b91c1c', padding: 10, borderRadius: 6, margin: '8px 16px' }}>{error}</div>}

        <div className="mr-list-controls">
          <div className="search-bar">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
              <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <input
              type="text"
              placeholder="Search by User ID, Name, Email, or Territory..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="filter-tabs">
            <button
              className={`filter-tab ${statusFilter === 'All' ? 'active' : ''}`}
              onClick={() => setStatusFilter('All')}
            >
              All ({mrs.length})
            </button>
            <button
              className={`filter-tab ${statusFilter === 'Active' ? 'active' : ''}`}
              onClick={() => setStatusFilter('Active')}
            >
              Active ({mrs.length})
            </button>
            <button
              className={`filter-tab ${statusFilter === 'Inactive' ? 'active' : ''}`}
              onClick={() => setStatusFilter('Inactive')}
            >
              Inactive (0)
            </button>
          </div>
        </div>

        <div className="mr-table-container">
          <table className="mr-table">
            <thead>
              <tr>
                <th>User ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Username</th>
                <th>Territory</th>
                <th>Joined</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="no-data-cell"><div className="no-data"><p>Loading…</p></div></td></tr>
              ) : filteredMRs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="no-data-cell">
                    <div className="no-data">
                      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="no-data-icon">
                        <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89318 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88M13 7C13 9.20914 11.2091 11 9 11C6.79086 11 5 9.20914 5 7C5 4.79086 6.79086 3 9 3C11.2091 3 13 4.79086 13 7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <p>No MRs found.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredMRs.map((mr) => (
                  <tr key={mr.id} className="mr-row" onClick={() => handleMRClick(mr)}>
                    <td>{mr.user_id}</td>
                    <td className="mr-name">{mr.name}</td>
                    <td>{mr.email || '-'}</td>
                    <td>{mr.username}</td>
                    <td>{mr.territory || '-'}</td>
                    <td>{mr.created_at ? new Date(mr.created_at).toLocaleDateString('en-GB') : '-'}</td>
                    <td>
                      <span className={`status-badge active`}>Active</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  )
}

export default MRList
