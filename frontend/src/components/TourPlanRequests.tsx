import { useState, useEffect } from 'react'
import Header from './Header'
import Sidebar from './Sidebar'
import { apiGet, apiPatch } from '../services/apiService'
import { useAuth } from '../contexts/AuthContext'
import './TourPlanRequests.css'

interface TourPlanRequestsProps {
  onLogout: () => void
  onBack: () => void
  userName?: string
  onNavigate?: (page: string) => void
}

interface BackendPlan {
  id: number
  user_id: string
  plan_date: string  // YYYY-MM-DD
  type_of_tour: 'field_work' | 'meeting' | 'training' | 'conference' | 'other' | null
  station: string | null
  status: 'draft' | 'submitted' | 'approved' | 'rejected'
  submitted_at: string | null
  reviewed_by: string | null
  reviewed_at: string | null
  review_notes: string | null
  // Optional joined fields the list endpoint may include for managers
  user_name?: string
  user_employee_id?: string
}

// STP/MTP toggle is a UI-only filter. STP = single-day plans (one date); MTP =
// multi-day commitments. We approximate by date range (we only have one date
// per plan today), so STP filter is "all plans" until we extend the model.
type RequestType = 'STP' | 'MTP'

function getQuarter(date: Date): string {
  const m = date.getMonth() + 1
  if (m <= 3) return 'Q1'
  if (m <= 6) return 'Q2'
  if (m <= 9) return 'Q3'
  return 'Q4'
}

function TourPlanRequests({ onLogout, onBack, userName, onNavigate }: TourPlanRequestsProps) {
  const { user } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [requestType, setRequestType] = useState<RequestType>('STP')
  const [searchQuery, setSearchQuery] = useState('')
  const [plans, setPlans] = useState<BackendPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<{ pending: number } | null>(null)

  const isManagerOrAdmin = user?.role === 'manager' || user?.role === 'admin'

  const loadPlans = async () => {
    setLoading(true)
    setError(null)
    try {
      const [plansRes, statsRes] = await Promise.all([
        apiGet('/tour-plans?status=submitted'),
        apiGet('/tour-plans/stats').catch(() => ({ data: null })),
      ])
      setPlans(plansRes.data || [])
      setStats(statsRes.data || null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tour plans')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!isManagerOrAdmin) {
      // MR landed on a manager-only page; bounce to home.
      if (onNavigate) onNavigate('home')
      return
    }
    loadPlans()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isManagerOrAdmin])

  const handleMenuClick = () => setSidebarOpen(true)
  const handleSidebarClose = () => setSidebarOpen(false)

  const handleApprove = async (id: number) => {
    setError(null)
    try {
      await apiPatch(`/tour-plans/${id}/review`, { status: 'approved' })
      await loadPlans()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve')
    }
  }

  const handleReject = async (id: number) => {
    setError(null)
    try {
      await apiPatch(`/tour-plans/${id}/review`, { status: 'rejected', review_notes: 'Rejected by manager' })
      await loadPlans()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject')
    }
  }

  const filteredPlans = plans.filter(plan => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      (plan.user_id || '').toLowerCase().includes(q) ||
      (plan.user_name || '').toLowerCase().includes(q) ||
      (plan.user_employee_id || '').toLowerCase().includes(q)
    )
  })

  const planCount = plans.length

  if (!isManagerOrAdmin) {
    // Render nothing while redirecting.
    return null
  }

  return (
    <div className="tour-plan-requests-container">
      <Header onLogout={onLogout} onMenuClick={handleMenuClick} onNavigateHome={() => onNavigate?.('home')} onNavigateOfflineRequests={() => onNavigate?.('offline-requests')} />
      <Sidebar isOpen={sidebarOpen} onClose={handleSidebarClose} userName={userName} onNavigate={onNavigate} onLogout={onLogout} currentPage="tour-plan-requests" />
      <main className="tour-plan-requests-content">
        <div className="tour-plan-requests-header">
          <button className="back-button" onClick={onBack} aria-label="Go back">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <h1 className="tour-plan-requests-title">Tour Plan Requests {stats ? `(${stats.pending} pending)` : ''}</h1>
        </div>

        {error && <div style={{ background: '#fef2f2', color: '#b91c1c', padding: 10, borderRadius: 6, margin: '8px 16px' }}>{error}</div>}

        <div className="tour-plan-requests-controls">
          <div className="segmented-control">
            <button
              className={`segment ${requestType === 'STP' ? 'active' : ''}`}
              onClick={() => setRequestType('STP')}
            >
              STP ({planCount})
            </button>
            <button
              className={`segment ${requestType === 'MTP' ? 'active' : ''}`}
              onClick={() => setRequestType('MTP')}
            >
              MTP (0)
            </button>
          </div>

          <div className="search-container">
            <div className="search-bar">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
                <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <input
                type="text"
                placeholder="Search by Emp ID, MR Name"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
            </div>
            <button className="search-button" onClick={() => loadPlans()}>
              Refresh
            </button>
          </div>
        </div>

        <div className="table-container">
          <table className="tour-plan-requests-table">
            <thead>
              <tr>
                <th>Emp ID</th>
                <th>MR Name</th>
                <th>Quarter</th>
                <th>Plan Date</th>
                <th>Submitted</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="no-data-cell"><div className="no-data"><p>Loading…</p></div></td></tr>
              ) : filteredPlans.length === 0 ? (
                <tr>
                  <td colSpan={6} className="no-data-cell">
                    <div className="no-data">
                      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="no-data-icon">
                        <path d="M4 7V5C4 3.89543 4.89543 3 6 3H18C19.1046 3 20 3.89543 20 5V7M4 7H20M4 7L5 19C5 20.1046 5.89543 21 7 21H17C18.1046 21 19 20.1046 19 19L20 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <p>No tour plan requests pending review</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredPlans.map((plan) => {
                  const planDate = new Date(plan.plan_date)
                  return (
                    <tr key={plan.id}>
                      <td>{plan.user_employee_id || plan.user_id}</td>
                      <td>{plan.user_name || plan.user_id}</td>
                      <td>{getQuarter(planDate)}</td>
                      <td>{planDate.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}</td>
                      <td>{plan.submitted_at ? new Date(plan.submitted_at).toLocaleDateString('en-GB') : '-'}</td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="approve-btn"
                            onClick={() => handleApprove(plan.id)}
                            aria-label="Approve"
                          >
                            Approve
                          </button>
                          <button
                            className="reject-btn"
                            onClick={() => handleReject(plan.id)}
                            aria-label="Reject"
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  )
}

export default TourPlanRequests
