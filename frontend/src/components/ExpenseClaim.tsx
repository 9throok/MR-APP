import { useState } from 'react'
import {
  PAGE_CONTENT,
  PAGE_TITLE,
  BACK_BUTTON,
  BTN_PRIMARY,
  BTN_SECONDARY,
  BTN_DANGER,
  BTN_ICON,
  CARD,
  TABLE,
  TABLE_WRAPPER,
  TABLE_HEAD,
  TABLE_TH,
  TABLE_TD,
  TABLE_ROW,
  BADGE_SUCCESS,
  BADGE_WARNING,
  BADGE_DANGER,
  BADGE_DEFAULT,
  TAB_CONTAINER,
  TAB_ITEM,
  TAB_ACTIVE,
  MODAL_OVERLAY,
  MODAL_CARD,
  MODAL_HEADER,
  MODAL_BODY,
  MODAL_FOOTER,
  EMPTY_STATE,
  EMPTY_TITLE,
} from '../styles/designSystem'

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

const statusBadgeClass = (status: string): string => {
  switch (status) {
    case 'Approved':
      return BADGE_SUCCESS
    case 'Pending':
      return BADGE_WARNING
    case 'Rejected':
      return BADGE_DANGER
    default:
      return BADGE_DEFAULT
  }
}

function ExpenseClaim({ onLogout: _onLogout, onBack, userName: _userName, onNavigate }: ExpenseClaimProps) {
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
    <div>
      <main className={PAGE_CONTENT}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button className={BACK_BUTTON} onClick={onBack} aria-label="Go back">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <h1 className={PAGE_TITLE}>Expense Claim</h1>
          </div>
          <button className={BTN_PRIMARY} onClick={createExpenseClaim}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>Create Expense Claim</span>
          </button>
        </div>

        {/* Tabs */}
        <div className={TAB_CONTAINER}>
          <button
            className={activeSection === 'Pending' ? TAB_ACTIVE : TAB_ITEM}
            onClick={() => setActiveSection('Pending')}
          >
            Pending ({claims.filter(c => c.status === 'Pending' || c.status === 'Saved').length})
          </button>
          <button
            className={activeSection === 'Approved' ? TAB_ACTIVE : TAB_ITEM}
            onClick={() => setActiveSection('Approved')}
          >
            Approved ({claims.filter(c => c.status === 'Approved').length})
          </button>
          <button
            className={activeSection === 'Rejected' ? TAB_ACTIVE : TAB_ITEM}
            onClick={() => setActiveSection('Rejected')}
          >
            Rejected ({claims.filter(c => c.status === 'Rejected').length})
          </button>
        </div>

        {/* Claims Table */}
        <div className={`${CARD} overflow-hidden`}>
          <div className={TABLE_WRAPPER}>
            <table className={TABLE}>
              <thead className={TABLE_HEAD}>
                <tr>
                  <th className={TABLE_TH}>Expense Date</th>
                  <th className={TABLE_TH}>Transaction Date</th>
                  <th className={TABLE_TH}>Claim ID</th>
                  <th className={TABLE_TH}>Claim Type</th>
                  <th className={TABLE_TH}>Claim Sub Type</th>
                  <th className={TABLE_TH}>Claim Amount</th>
                  <th className={TABLE_TH}>Status</th>
                  {activeSection === 'Rejected' && <th className={TABLE_TH}>Remark</th>}
                  {activeSection === 'Pending' && <th className={TABLE_TH}>Action</th>}
                  {activeSection === 'Pending' && <th className={TABLE_TH}>Delete</th>}
                </tr>
              </thead>
              <tbody>
                {filteredClaims.length === 0 ? (
                  <tr>
                    <td colSpan={activeSection === 'Rejected' ? 8 : activeSection === 'Pending' ? 9 : 7}>
                      <div className={EMPTY_STATE}>
                        <p className={EMPTY_TITLE}>No {activeSection.toLowerCase()} claims found</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredClaims.map((claim) => (
                    <tr key={claim.id} className={TABLE_ROW}>
                      <td className={TABLE_TD}>{claim.expensedate}</td>
                      <td className={TABLE_TD}>{claim.transactiondate}</td>
                      <td className={TABLE_TD}>{claim.claimid}</td>
                      <td className={TABLE_TD}>{claim.claimtype}</td>
                      <td className={TABLE_TD}>{claim.claimsubtype}</td>
                      <td className={`${TABLE_TD} font-semibold text-slate-900`}>{claim.claimamount}</td>
                      <td className={TABLE_TD}>
                        <span className={`${statusBadgeClass(claim.status)} inline-flex items-center gap-1.5`}>
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
                        <td className={`${TABLE_TD} text-slate-500 text-xs`}>{claim.remark || '-'}</td>
                      )}
                      {activeSection === 'Pending' && (
                        <>
                          <td className={TABLE_TD}>
                            <button
                              className={BTN_PRIMARY}
                              onClick={() => handleSendForApproval(claim)}
                            >
                              Send for Approval
                            </button>
                          </td>
                          <td className={TABLE_TD}>
                            <button
                              className={`${BTN_ICON} text-red-400 hover:text-red-600 hover:bg-red-50`}
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
        </div>
      </main>

      {/* Send for Approval Modal */}
      {isActionModalOpen && (
        <div className={MODAL_OVERLAY} onClick={() => setIsActionModalOpen(false)}>
          <div className={MODAL_CARD} onClick={(e) => e.stopPropagation()}>
            <div className={MODAL_HEADER}>
              <h3 className="text-lg font-semibold text-slate-900">Send For Approval</h3>
            </div>
            <div className={MODAL_BODY}>
              <p className="text-sm text-slate-600">Send expense claim to Manager for approval?</p>
            </div>
            <div className={MODAL_FOOTER}>
              <button className={BTN_SECONDARY} onClick={() => setIsActionModalOpen(false)}>
                No
              </button>
              <button className={BTN_PRIMARY} onClick={confirmSendForApproval}>
                Yes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {isDeleteModalOpen && (
        <div className={MODAL_OVERLAY} onClick={() => setIsDeleteModalOpen(false)}>
          <div className={MODAL_CARD} onClick={(e) => e.stopPropagation()}>
            <div className={MODAL_HEADER}>
              <h3 className="text-lg font-semibold text-slate-900">Delete Expense Claim</h3>
            </div>
            <div className={MODAL_BODY}>
              <p className="text-sm text-slate-600">Are you sure you want to delete the Expense Claim?</p>
            </div>
            <div className={MODAL_FOOTER}>
              <button className={BTN_SECONDARY} onClick={() => setIsDeleteModalOpen(false)}>
                No
              </button>
              <button className={BTN_DANGER} onClick={confirmDelete}>
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
