import { useState, useEffect } from 'react'
import Header from './Header'
import Sidebar from './Sidebar'
import { apiGet, apiPost, apiDelete } from '../services/apiService'
import './ExpenseClaim.css'

interface ExpenseClaimProps {
  onLogout: () => void
  onBack: () => void
  userName?: string
  onNavigate?: (page: string) => void
}

// Backend claim header — one row per claim. Line items live on detail.
interface Claim {
  id: number
  period_start: string  // YYYY-MM-DD
  period_end: string
  currency: string
  total_amount: string  // numeric returned as string by pg
  status: 'draft' | 'submitted' | 'approved' | 'rejected'
  submitted_at: string | null
  reviewed_at: string | null
  review_notes: string | null
  notes: string | null
  _queued?: boolean      // local flag for offline-queued rows
}

interface LineItem {
  id: number
  claim_id: number
  claim_type: 'local_conveyance' | 'travel_allowance' | 'general_expense' | 'daily_allowance'
  expense_date: string | null
  from_date: string | null
  to_date: string | null
  amount: string
  currency: string
  description: string | null
  remark: string | null
  attachment_url: string | null
  conveyance_mode: string | null
  distance_km: string | null
  rate_per_km: string | null
  from_place: string | null
  to_place: string | null
  transport_class: string | null
  allowance_type: string | null
  city: string | null
  days: number | null
  daily_rate: string | null
}

const STATUS_LABEL: Record<Claim['status'], string> = {
  draft: 'Saved',
  submitted: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
}

const CLAIM_TYPE_LABEL: Record<LineItem['claim_type'], string> = {
  local_conveyance: 'Local Conveyance',
  travel_allowance: 'Travel Allowance',
  general_expense: 'General Expense',
  daily_allowance: 'Daily Allowance',
}

function formatDate(s: string | null): string {
  if (!s) return '-'
  const d = new Date(s)
  if (Number.isNaN(d.getTime())) return s
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatAmount(amount: string | number, ccy: string = 'INR'): string {
  const n = typeof amount === 'string' ? parseFloat(amount) : amount
  if (Number.isNaN(n)) return `${ccy === 'INR' ? '₹' : ccy} 0`
  const symbol = ccy === 'INR' ? '₹' : `${ccy} `
  return `${symbol}${n.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`
}

function ExpenseClaim({ onLogout, onBack, userName, onNavigate }: ExpenseClaimProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeSection, setActiveSection] = useState<'Pending' | 'Approved' | 'Rejected'>('Pending')
  const [isActionModalOpen, setIsActionModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null)
  const [detailClaim, setDetailClaim] = useState<Claim | null>(null)
  const [detailLines, setDetailLines] = useState<LineItem[]>([])
  const [claims, setClaims] = useState<Claim[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadClaims = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiGet('/expenses')
      setClaims(res.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load claims')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadClaims() }, [])

  const handleMenuClick = () => setSidebarOpen(true)
  const handleSidebarClose = () => setSidebarOpen(false)

  const handleSendForApproval = (claim: Claim) => {
    setSelectedClaim(claim)
    setIsActionModalOpen(true)
  }

  const confirmSendForApproval = async () => {
    if (!selectedClaim) return
    try {
      const res = await apiPost(`/expenses/${selectedClaim.id}/submit`, {})
      if ('queued' in res) {
        // Optimistic flip while queued
        setClaims(prev => prev.map(c => c.id === selectedClaim.id ? { ...c, status: 'submitted', _queued: true } : c))
      } else {
        await loadClaims()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit')
    } finally {
      setIsActionModalOpen(false)
      setSelectedClaim(null)
    }
  }

  const handleDelete = (claim: Claim) => {
    setSelectedClaim(claim)
    setIsDeleteModalOpen(true)
  }

  const confirmDelete = async () => {
    if (!selectedClaim) return
    try {
      const res = await apiDelete(`/expenses/${selectedClaim.id}`)
      if ('queued' in res) {
        setClaims(prev => prev.filter(c => c.id !== selectedClaim.id))
      } else {
        await loadClaims()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete')
    } finally {
      setIsDeleteModalOpen(false)
      setSelectedClaim(null)
    }
  }

  const openDetail = async (claim: Claim) => {
    setDetailClaim(claim)
    setDetailLines([])
    if (claim._queued) return // queued rows have no detail yet
    try {
      const res = await apiGet(`/expenses/${claim.id}`)
      setDetailLines(res.data?.line_items || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load detail')
    }
  }

  const filteredClaims = claims.filter(claim => {
    if (activeSection === 'Pending') return claim.status === 'submitted' || claim.status === 'draft'
    if (activeSection === 'Approved') return claim.status === 'approved'
    return claim.status === 'rejected'
  })

  const createExpenseClaim = () => onNavigate?.('create-expense-claim')

  return (
    <div className="expense-claim-container">
      <Header onLogout={onLogout} onMenuClick={handleMenuClick} onNavigateHome={() => onNavigate?.('home')} onNavigateOfflineRequests={() => onNavigate?.('offline-requests')} />
      <Sidebar isOpen={sidebarOpen} onClose={handleSidebarClose} userName={userName} onNavigate={onNavigate} onLogout={onLogout} />
      <main className="expense-claim-content">
        <div className="expense-claim-header">
          <button className="back-button" onClick={onBack} aria-label="Go back">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div className="header-content">
            <h1 className="expense-claim-title">Expense Claim</h1>
            <button className="create-claim-btn" onClick={createExpenseClaim}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>Create Expense Claim</span>
            </button>
          </div>
        </div>

        {error && <div style={{ background: '#fef2f2', color: '#b91c1c', padding: 10, borderRadius: 6, margin: '0 0 12px' }}>{error}</div>}

        {/* Tabs */}
        <div className="expense-tabs">
          <button
            className={`expense-tab ${activeSection === 'Pending' ? 'active' : ''}`}
            onClick={() => setActiveSection('Pending')}
          >
            Pending ({claims.filter(c => c.status === 'submitted' || c.status === 'draft').length})
          </button>
          <button
            className={`expense-tab ${activeSection === 'Approved' ? 'active' : ''}`}
            onClick={() => setActiveSection('Approved')}
          >
            Approved ({claims.filter(c => c.status === 'approved').length})
          </button>
          <button
            className={`expense-tab ${activeSection === 'Rejected' ? 'active' : ''}`}
            onClick={() => setActiveSection('Rejected')}
          >
            Rejected ({claims.filter(c => c.status === 'rejected').length})
          </button>
        </div>

        {/* Claims Table */}
        <div className="claims-table-container">
          <table className="claims-table">
            <thead>
              <tr>
                <th>Period Start</th>
                <th>Period End</th>
                <th>Claim ID</th>
                <th>Total Amount</th>
                <th>Status</th>
                <th>Submitted</th>
                {activeSection === 'Rejected' && <th>Remark</th>}
                {activeSection === 'Pending' && <th>Action</th>}
                {activeSection === 'Pending' && <th>Delete</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} className="no-claims">Loading…</td></tr>
              ) : filteredClaims.length === 0 ? (
                <tr>
                  <td colSpan={activeSection === 'Rejected' ? 7 : activeSection === 'Pending' ? 8 : 6} className="no-claims">
                    No {activeSection.toLowerCase()} claims found
                  </td>
                </tr>
              ) : (
                filteredClaims.map((claim) => {
                  const label = STATUS_LABEL[claim.status]
                  return (
                    <tr key={claim.id} style={{ cursor: 'pointer' }} onClick={() => openDetail(claim)}>
                      <td>{formatDate(claim.period_start)}</td>
                      <td>{formatDate(claim.period_end)}</td>
                      <td>{claim.id}{claim._queued && <span style={{ marginLeft: 6, fontSize: 10, color: '#b45309' }}>(queued)</span>}</td>
                      <td className="amount-cell">{formatAmount(claim.total_amount, claim.currency)}</td>
                      <td>
                        <span className={`status-badge status-${label.toLowerCase()}`}>
                          <span>{label}</span>
                        </span>
                      </td>
                      <td>{formatDate(claim.submitted_at)}</td>
                      {activeSection === 'Rejected' && (
                        <td className="remark-cell">{claim.review_notes || '-'}</td>
                      )}
                      {activeSection === 'Pending' && (
                        <>
                          <td onClick={(e) => e.stopPropagation()}>
                            {claim.status === 'draft' && (
                              <button
                                className="action-btn send-approval-btn"
                                onClick={() => handleSendForApproval(claim)}
                              >
                                Send for Approval
                              </button>
                            )}
                          </td>
                          <td onClick={(e) => e.stopPropagation()}>
                            {claim.status === 'draft' && (
                              <button
                                className="action-btn delete-btn"
                                onClick={() => handleDelete(claim)}
                                aria-label="Delete claim"
                              >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M3 6H5H21M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                              </button>
                            )}
                          </td>
                        </>
                      )}
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </main>

      {/* Detail modal — claim + line items */}
      {detailClaim && (
        <div className="modal-overlay" onClick={() => setDetailClaim(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 720, width: '100%' }}>
            <h3 className="modal-title">Claim #{detailClaim.id}</h3>
            <div style={{ fontSize: 13, color: '#64748b', marginBottom: 12 }}>
              {formatDate(detailClaim.period_start)} – {formatDate(detailClaim.period_end)} · {STATUS_LABEL[detailClaim.status]} · Total {formatAmount(detailClaim.total_amount, detailClaim.currency)}
            </div>
            {detailClaim.notes && (
              <div style={{ fontSize: 13, marginBottom: 12, padding: 8, background: '#f8fafc', borderRadius: 6 }}>{detailClaim.notes}</div>
            )}
            {detailClaim._queued ? (
              <div style={{ color: '#64748b' }}>Line items will appear once this claim syncs.</div>
            ) : detailLines.length === 0 ? (
              <div style={{ color: '#64748b' }}>No line items on this claim.</div>
            ) : (
              <table className="claims-table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Date</th>
                    <th>Description</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {detailLines.map(line => (
                    <tr key={line.id}>
                      <td>{CLAIM_TYPE_LABEL[line.claim_type] || line.claim_type}</td>
                      <td>{formatDate(line.expense_date || line.from_date)}</td>
                      <td>{line.description || '-'}</td>
                      <td className="amount-cell">{formatAmount(line.amount, line.currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {detailClaim.review_notes && (
              <div style={{ marginTop: 12, padding: 8, background: '#fef3c7', borderRadius: 6, fontSize: 13 }}>
                <strong>Reviewer note:</strong> {detailClaim.review_notes}
              </div>
            )}
            <div className="modal-actions">
              <button className="modal-btn modal-btn-primary" onClick={() => setDetailClaim(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Send for Approval Modal */}
      {isActionModalOpen && (
        <div className="modal-overlay" onClick={() => setIsActionModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">Send For Approval</h3>
            <p className="modal-message">Send expense claim to Manager for approval?</p>
            <div className="modal-actions">
              <button className="modal-btn modal-btn-secondary" onClick={() => setIsActionModalOpen(false)}>
                No
              </button>
              <button className="modal-btn modal-btn-primary" onClick={confirmSendForApproval}>
                Yes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {isDeleteModalOpen && (
        <div className="modal-overlay" onClick={() => setIsDeleteModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">Delete Expense Claim</h3>
            <p className="modal-message">Are you sure you want to delete the Expense Claim?</p>
            <div className="modal-actions">
              <button className="modal-btn modal-btn-secondary" onClick={() => setIsDeleteModalOpen(false)}>
                No
              </button>
              <button className="modal-btn modal-btn-danger" onClick={confirmDelete}>
                Yes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ExpenseClaim
