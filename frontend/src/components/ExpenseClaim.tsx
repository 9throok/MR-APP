import { useState } from 'react'
import Header from './Header'
import Sidebar from './Sidebar'
import './ExpenseClaim.css'

interface ExpenseClaimProps {
  onLogout: () => void
  onBack: () => void
  userName?: string
  onNavigate?: (page: string) => void
}

interface Claim {
  id: number
  expensedate: string
  transactiondate: string
  claimid: number
  claimtype: string
  claimsubtype: string
  claimamount: string
  status: 'Saved' | 'Pending' | 'Approved' | 'Rejected'
  remark?: string
}

function ExpenseClaim({ onLogout, onBack, userName, onNavigate }: ExpenseClaimProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeSection, setActiveSection] = useState<'Pending' | 'Approved' | 'Rejected'>('Pending')
  const [isActionModalOpen, setIsActionModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null)

  // Dummy data - in real app, this would come from API
  const [claims, setClaims] = useState<Claim[]>([
    {
      id: 1,
      expensedate: '09 March 2025',
      transactiondate: '09 March 2025',
      claimid: 312,
      claimtype: 'General Expense',
      claimsubtype: 'Mobile expense',
      claimamount: '₹300',
      status: 'Saved',
    },
    {
      id: 2,
      expensedate: '08 March 2025',
      transactiondate: '08 March 2025',
      claimid: 311,
      claimtype: 'Local Conveyance',
      claimsubtype: 'Bike',
      claimamount: '₹175',
      status: 'Pending',
    },
    {
      id: 3,
      expensedate: '07 March 2025',
      transactiondate: '07 March 2025',
      claimid: 310,
      claimtype: 'Travel Allowance',
      claimsubtype: 'Flight',
      claimamount: '₹5,000',
      status: 'Approved',
    },
    {
      id: 4,
      expensedate: '06 March 2025',
      transactiondate: '06 March 2025',
      claimid: 309,
      claimtype: 'Daily Allowance',
      claimsubtype: 'HQ',
      claimamount: '₹175',
      status: 'Rejected',
      remark: 'Insufficient documentation provided',
    },
  ])

  const handleMenuClick = () => {
    setSidebarOpen(true)
  }

  const handleSidebarClose = () => {
    setSidebarOpen(false)
  }

  const handleSendForApproval = (claim: Claim) => {
    setSelectedClaim(claim)
    setIsActionModalOpen(true)
  }

  const confirmSendForApproval = () => {
    if (selectedClaim) {
      setClaims(prev =>
        prev.map(claim =>
          claim.id === selectedClaim.id ? { ...claim, status: 'Pending' as const } : claim
        )
      )
    }
    setIsActionModalOpen(false)
    setSelectedClaim(null)
  }

  const handleDelete = (claim: Claim) => {
    setSelectedClaim(claim)
    setIsDeleteModalOpen(true)
  }

  const confirmDelete = () => {
    if (selectedClaim) {
      setClaims(prev => prev.filter(claim => claim.id !== selectedClaim.id))
    }
    setIsDeleteModalOpen(false)
    setSelectedClaim(null)
  }

  const filteredClaims = claims.filter(claim => {
    if (activeSection === 'Pending') {
      return claim.status === 'Pending' || claim.status === 'Saved'
    }
    return claim.status === activeSection
  })

  const createExpenseClaim = () => {
    if (onNavigate) {
      onNavigate('create-expense-claim')
    }
  }

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

        {/* Tabs */}
        <div className="expense-tabs">
          <button
            className={`expense-tab ${activeSection === 'Pending' ? 'active' : ''}`}
            onClick={() => setActiveSection('Pending')}
          >
            Pending ({claims.filter(c => c.status === 'Pending' || c.status === 'Saved').length})
          </button>
          <button
            className={`expense-tab ${activeSection === 'Approved' ? 'active' : ''}`}
            onClick={() => setActiveSection('Approved')}
          >
            Approved ({claims.filter(c => c.status === 'Approved').length})
          </button>
          <button
            className={`expense-tab ${activeSection === 'Rejected' ? 'active' : ''}`}
            onClick={() => setActiveSection('Rejected')}
          >
            Rejected ({claims.filter(c => c.status === 'Rejected').length})
          </button>
        </div>

        {/* Claims Table */}
        <div className="claims-table-container">
          <table className="claims-table">
            <thead>
              <tr>
                <th>Expense Date</th>
                <th>Transaction Date</th>
                <th>Claim ID</th>
                <th>Claim Type</th>
                <th>Claim Sub Type</th>
                <th>Claim Amount</th>
                <th>Status</th>
                {activeSection === 'Rejected' && <th>Remark</th>}
                {activeSection === 'Pending' && <th>Action</th>}
                {activeSection === 'Pending' && <th>Delete</th>}
              </tr>
            </thead>
            <tbody>
              {filteredClaims.length === 0 ? (
                <tr>
                  <td colSpan={activeSection === 'Rejected' ? 8 : activeSection === 'Pending' ? 9 : 7} className="no-claims">
                    No {activeSection.toLowerCase()} claims found
                  </td>
                </tr>
              ) : (
                filteredClaims.map((claim) => (
                  <tr key={claim.id}>
                    <td>{claim.expensedate}</td>
                    <td>{claim.transactiondate}</td>
                    <td>{claim.claimid}</td>
                    <td>{claim.claimtype}</td>
                    <td>{claim.claimsubtype}</td>
                    <td className="amount-cell">{claim.claimamount}</td>
                    <td>
                      <span className={`status-badge status-${claim.status.toLowerCase()}`}>
                        {claim.status === 'Pending' && (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                            <path d="M12 8V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                          </svg>
                        )}
                        {claim.status === 'Saved' && (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H16L21 8V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M17 21V13H7V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M7 3V8H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                        <span>{claim.status}</span>
                      </span>
                    </td>
                    {activeSection === 'Rejected' && (
                      <td className="remark-cell">{claim.remark || '-'}</td>
                    )}
                    {activeSection === 'Pending' && (
                      <>
                        <td>
                          <button
                            className="action-btn send-approval-btn"
                            onClick={() => handleSendForApproval(claim)}
                          >
                            Send for Approval
                          </button>
                        </td>
                        <td>
                          <button
                            className="action-btn delete-btn"
                            onClick={() => handleDelete(claim)}
                            aria-label="Delete claim"
                          >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M3 6H5H21M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </button>
                        </td>
                      </>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>

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

