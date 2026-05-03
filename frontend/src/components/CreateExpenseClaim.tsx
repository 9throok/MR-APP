import { useState } from 'react'
import Header from './Header'
import Sidebar from './Sidebar'
import {
  claimTypes,
  conveyanceModes,
  allowanceType,
  dailyAllowanceType,
  transportClasses,
} from '../constants/expenseConstants'
import { apiPost, apiUpload } from '../services/apiService'
import './CreateExpenseClaim.css'

// UI claim-type label → backend enum value
const CLAIM_TYPE_TO_ENUM: Record<string, 'local_conveyance' | 'travel_allowance' | 'general_expense' | 'daily_allowance'> = {
  'Local Conveyance': 'local_conveyance',
  'Travel Allowance': 'travel_allowance',
  'General Expense': 'general_expense',
  'Daily Allowance': 'daily_allowance',
}

interface CreateExpenseClaimProps {
  onLogout: () => void
  onBack: () => void
  userName?: string
  onNavigate?: (page: string) => void
}

interface Claim {
  id: number
  claimType: string
  date: string
  fromDate: string
  toDate: string
  fromPlace: string
  toPlace: string
  conveyanceMode: string
  distance: string
  totalAmount: number
  transportClass: string
  allowanceType: string
  arrivalDate: string
  dailyAllowanceType: string
  dailyAllowanceTypeSelect: string
  city: string
  days: string
  dailyAmt: number
  remark: string
  claimamount: string
  attachment?: File | null
}

const initialClaim: Claim = {
  id: Date.now(),
  claimType: 'Local Conveyance',
  date: '',
  fromDate: '',
  toDate: '',
  fromPlace: '',
  toPlace: '',
  conveyanceMode: '',
  distance: '',
  totalAmount: 0,
  transportClass: 'Select Transport Class',
  allowanceType: 'Select Allowance Type',
  arrivalDate: '',
  dailyAllowanceType: 'Select Allowance Type',
  dailyAllowanceTypeSelect: '',
  city: '',
  days: '',
  dailyAmt: 0,
  remark: '',
  claimamount: '',
  attachment: null,
}

function CreateExpenseClaim({ onLogout, onBack, userName, onNavigate }: CreateExpenseClaimProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [claims, setClaims] = useState<Claim[]>([{ ...initialClaim }])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleMenuClick = () => {
    setSidebarOpen(true)
  }

  const handleSidebarClose = () => {
    setSidebarOpen(false)
  }

  const calculateDaysDifference = (fromDate: string, toDate: string): number => {
    if (!fromDate || !toDate) return 0
    const from = new Date(fromDate)
    const to = new Date(toDate)
    const oneDay = 24 * 60 * 60 * 1000
    const diffDays = Math.round(Math.abs((to.getTime() - from.getTime()) / oneDay))
    return diffDays + 1 // Include both start and end dates
  }

  const calculateAmount = (claim: Claim): number => {
    // Local Conveyance
    if (claim.claimType === 'Local Conveyance') {
      if (claim.conveyanceMode && claim.distance) {
        const distance = parseFloat(claim.distance) || 0
        return 3.5 * distance
      }
    }

    // Daily Allowance
    if (claim.claimType === 'Daily Allowance') {
      if (claim.dailyAllowanceType === 'HQ') {
        return 175
      }
      if (claim.dailyAllowanceType === 'EX HQ') {
        return 225
      }
      if (claim.dailyAllowanceType === 'Out Station Own Arrangement') {
        const days = calculateDaysDifference(claim.fromDate, claim.toDate)
        return 650 * days
      }
    }

    return claim.totalAmount
  }

  const handleChange = (claimId: number, field: keyof Claim, value: any) => {
    setClaims(prevClaims =>
      prevClaims.map(claim => {
        if (claim.id !== claimId) return claim

        const updatedClaim = { ...claim, [field]: value }

        // Reset all fields when claimType changes
        if (field === 'claimType') {
          return {
            ...initialClaim,
            id: claim.id,
            claimType: value,
          }
        }

        // Reset date fields when dailyAllowanceType changes
        if (field === 'dailyAllowanceType') {
          updatedClaim.fromDate = ''
          updatedClaim.toDate = ''
          updatedClaim.date = ''
          updatedClaim.totalAmount = 0
        }

        // Auto-calculate days for Daily Allowance
        if (claim.claimType === 'Daily Allowance' && (field === 'fromDate' || field === 'toDate')) {
          if (updatedClaim.fromDate && updatedClaim.toDate) {
            updatedClaim.days = String(calculateDaysDifference(updatedClaim.fromDate, updatedClaim.toDate))
          }
        }

        // Auto-calculate total amount
        if (claim.claimType === 'Local Conveyance' && (field === 'conveyanceMode' || field === 'distance')) {
          updatedClaim.totalAmount = calculateAmount(updatedClaim)
        } else if (claim.claimType === 'Daily Allowance') {
          if (field === 'dailyAllowanceType' || field === 'fromDate' || field === 'toDate' || field === 'date') {
            updatedClaim.totalAmount = calculateAmount(updatedClaim)
          }
        }

        return updatedClaim
      })
    )
  }

  const addNewClaim = () => {
    setClaims(prevClaims => [
      ...prevClaims,
      {
        ...initialClaim,
        id: Date.now() + Math.random(),
      },
    ])
  }

  const handleDeleteClaim = (id: number) => {
    if (claims.length > 1) {
      setClaims(prevClaims => prevClaims.filter(claim => claim.id !== id))
    }
  }

  const handleFileUpload = (claimId: number, file: File | null) => {
    setClaims(prevClaims =>
      prevClaims.map(claim =>
        claim.id === claimId ? { ...claim, attachment: file } : claim
      )
    )
  }

  const handleBackClick = () => {
    if (onNavigate) {
      onNavigate('expense-claim')
    } else {
      onBack()
    }
  }

  // Map a UI claim row to the backend line-item shape.
  const buildLineItem = (claim: Claim) => {
    const claim_type = CLAIM_TYPE_TO_ENUM[claim.claimType]
    const amount =
      claim.claimType === 'Travel Allowance'
        ? parseFloat(claim.claimamount || '0') || 0
        : claim.totalAmount || 0
    const line: Record<string, unknown> = {
      claim_type,
      amount,
      currency: 'INR',
      remark: claim.remark || undefined,
    }

    if (claim.claimType === 'Local Conveyance') {
      line.from_date = claim.fromDate || undefined
      line.to_date = claim.toDate || undefined
      line.from_place = claim.fromPlace || undefined
      line.to_place = claim.toPlace || undefined
      line.conveyance_mode = (claim.conveyanceMode || '').toLowerCase() || undefined
      line.distance_km = claim.distance ? parseFloat(claim.distance) : undefined
      line.rate_per_km = 3.5
      line.description = `${claim.fromPlace || ''} → ${claim.toPlace || ''}`.trim() || undefined
    } else if (claim.claimType === 'Travel Allowance') {
      line.from_date = claim.fromDate || undefined
      line.to_date = claim.arrivalDate || undefined
      line.from_place = claim.fromPlace || undefined
      line.to_place = claim.toPlace || undefined
      line.transport_class = claim.transportClass !== 'Select Transport Class' ? claim.transportClass : undefined
      line.description = claim.remark || `${claim.fromPlace || ''} → ${claim.toPlace || ''}`.trim() || undefined
    } else if (claim.claimType === 'General Expense') {
      line.expense_date = claim.date || undefined
      line.allowance_type = claim.allowanceType !== 'Select Allowance Type' ? claim.allowanceType : undefined
      line.description = claim.allowanceType !== 'Select Allowance Type' ? claim.allowanceType : undefined
    } else if (claim.claimType === 'Daily Allowance') {
      line.allowance_type = claim.dailyAllowanceType !== 'Select Allowance Type' ? claim.dailyAllowanceType : undefined
      line.city = claim.city || undefined
      if (claim.dailyAllowanceType === 'HQ' || claim.dailyAllowanceType === 'EX HQ') {
        line.expense_date = claim.date || undefined
      } else {
        line.from_date = claim.fromDate || undefined
        line.to_date = claim.toDate || undefined
      }
      line.days = claim.days ? parseInt(claim.days, 10) : undefined
      if (claim.dailyAllowanceType === 'Out Station Own Arrangement') {
        line.daily_rate = 650
      }
    }

    return line
  }

  const computePeriod = () => {
    const dates: string[] = []
    for (const c of claims) {
      [c.date, c.fromDate, c.toDate, c.arrivalDate].forEach(d => { if (d) dates.push(d) })
    }
    if (dates.length === 0) {
      const today = new Date().toISOString().slice(0, 10)
      return { period_start: today, period_end: today }
    }
    const sorted = dates.sort()
    return { period_start: sorted[0], period_end: sorted[sorted.length - 1] }
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      const { period_start, period_end } = computePeriod()
      const line_items = claims.map(buildLineItem)
      const res = await apiPost('/expenses', {
        period_start,
        period_end,
        currency: 'INR',
        notes: 'Created from mobile',
        line_items,
      })

      // Offline-queued: surface a friendly note and bounce back.
      if ('queued' in res) {
        if (onNavigate) onNavigate('expense-claim')
        return
      }

      const claimId = res?.data?.id
      const createdLines: Array<{ id: number }> = res?.data?.line_items || []

      // Upload attachments per-line, best effort. apiUpload throws if offline.
      if (claimId && createdLines.length === claims.length) {
        for (let i = 0; i < claims.length; i++) {
          const file = claims[i].attachment
          const lineId = createdLines[i]?.id
          if (file && lineId) {
            try {
              const fd = new FormData()
              fd.append('file', file)
              await apiUpload(`/expenses/${claimId}/lines/${lineId}/receipt`, fd)
            } catch (uploadErr) {
              console.warn('Receipt upload failed:', uploadErr)
            }
          }
        }
      }

      if (onNavigate) onNavigate('expense-claim')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save claim')
    } finally {
      setSaving(false)
    }
  }

  const formatDateForInput = (dateString: string): string => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toISOString().split('T')[0]
  }

  return (
    <div className="create-expense-claim-container">
      <Header onLogout={onLogout} onMenuClick={handleMenuClick} onNavigateHome={() => onNavigate?.('home')} onNavigateOfflineRequests={() => onNavigate?.('offline-requests')} />
      <Sidebar isOpen={sidebarOpen} onClose={handleSidebarClose} userName={userName} onNavigate={onNavigate} onLogout={onLogout} />
      <main className="create-expense-claim-content">
        <div className="create-expense-claim-header">
          <button className="back-button" onClick={handleBackClick} aria-label="Go back">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <h1 className="create-expense-claim-title">Create Expense Claim</h1>
        </div>

        {error && <div style={{ background: '#fef2f2', color: '#b91c1c', padding: 10, borderRadius: 6, marginBottom: 12 }}>{error}</div>}

        {claims.map((claim, index) => (
          <div key={claim.id} className="claim-card">
            <div className="claim-card-header">
              <h3>Claim {index + 1}</h3>
              {claims.length > 1 && (
                <button
                  className="delete-claim-btn"
                  onClick={() => handleDeleteClaim(claim.id)}
                  aria-label="Delete claim"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 6H5H21M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              )}
            </div>

            <div className="claim-form">
              {/* Claim Type */}
              <div className="form-group">
                <label className="form-label">Claim Type <span className="required">*</span></label>
                <select
                  className="form-select"
                  value={claim.claimType}
                  onChange={(e) => handleChange(claim.id, 'claimType', e.target.value)}
                >
                  {claimTypes.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              {/* Local Conveyance Fields */}
              {claim.claimType === 'Local Conveyance' && (
                <>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">From Date <span className="required">*</span></label>
                      <input
                        type="date"
                        className="form-input"
                        value={formatDateForInput(claim.fromDate)}
                        onChange={(e) => handleChange(claim.id, 'fromDate', e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">To Date <span className="required">*</span></label>
                      <input
                        type="date"
                        className="form-input"
                        value={formatDateForInput(claim.toDate)}
                        onChange={(e) => handleChange(claim.id, 'toDate', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">From Place <span className="required">*</span></label>
                      <input
                        type="text"
                        className="form-input"
                        value={claim.fromPlace}
                        onChange={(e) => handleChange(claim.id, 'fromPlace', e.target.value)}
                        placeholder="Enter from place"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">To Place <span className="required">*</span></label>
                      <input
                        type="text"
                        className="form-input"
                        value={claim.toPlace}
                        onChange={(e) => handleChange(claim.id, 'toPlace', e.target.value)}
                        placeholder="Enter to place"
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Conveyance Mode <span className="required">*</span></label>
                      <select
                        className="form-select"
                        value={claim.conveyanceMode}
                        onChange={(e) => handleChange(claim.id, 'conveyanceMode', e.target.value)}
                      >
                        <option value="">Select Mode</option>
                        {conveyanceModes.map((mode) => (
                          <option key={mode} value={mode}>{mode}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Distance (KM) <span className="required">*</span></label>
                      <input
                        type="number"
                        className="form-input"
                        value={claim.distance}
                        onChange={(e) => handleChange(claim.id, 'distance', e.target.value)}
                        placeholder="Enter distance"
                        min="0"
                        step="0.1"
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Total Amount <span className="required">*</span></label>
                    <input
                      type="number"
                      className="form-input"
                      value={claim.totalAmount.toFixed(2)}
                      disabled
                      readOnly
                    />
                  </div>
                </>
              )}

              {/* Travel Allowance Fields */}
              {claim.claimType === 'Travel Allowance' && (
                <>
                  <div className="form-group">
                    <label className="form-label">Transport Class <span className="required">*</span></label>
                    <select
                      className="form-select"
                      value={claim.transportClass}
                      onChange={(e) => handleChange(claim.id, 'transportClass', e.target.value)}
                    >
                      <option value="Select Transport Class">Select Transport Class</option>
                      {transportClasses.map((cls) => (
                        <option key={cls} value={cls}>{cls}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Departure Station <span className="required">*</span></label>
                      <input
                        type="text"
                        className="form-input"
                        value={claim.fromPlace}
                        onChange={(e) => handleChange(claim.id, 'fromPlace', e.target.value)}
                        placeholder="Enter departure station"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Departure Date <span className="required">*</span></label>
                      <input
                        type="date"
                        className="form-input"
                        value={formatDateForInput(claim.fromDate)}
                        onChange={(e) => handleChange(claim.id, 'fromDate', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Arrival Station <span className="required">*</span></label>
                      <input
                        type="text"
                        className="form-input"
                        value={claim.toPlace}
                        onChange={(e) => handleChange(claim.id, 'toPlace', e.target.value)}
                        placeholder="Enter arrival station"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Arrival Date <span className="required">*</span></label>
                      <input
                        type="date"
                        className="form-input"
                        value={formatDateForInput(claim.arrivalDate)}
                        onChange={(e) => handleChange(claim.id, 'arrivalDate', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Claim Amount <span className="required">*</span></label>
                    <input
                      type="number"
                      className="form-input"
                      value={claim.claimamount}
                      onChange={(e) => handleChange(claim.id, 'claimamount', e.target.value)}
                      placeholder="Enter claim amount"
                      min="0"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Remark</label>
                    <textarea
                      className="form-textarea"
                      value={claim.remark}
                      onChange={(e) => handleChange(claim.id, 'remark', e.target.value)}
                      placeholder="Enter remarks"
                      rows={3}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Attachment</label>
                    <div className="file-upload-wrapper">
                      <input
                        type="file"
                        id={`attachment-${claim.id}`}
                        className="file-input"
                        onChange={(e) => handleFileUpload(claim.id, e.target.files?.[0] || null)}
                        accept="image/*,.pdf"
                      />
                      <label htmlFor={`attachment-${claim.id}`} className="file-upload-label">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15M17 8L12 3M12 3L7 8M12 3V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <span>{claim.attachment ? claim.attachment.name : 'Click to Upload'}</span>
                      </label>
                    </div>
                  </div>
                </>
              )}

              {/* General Expense Fields */}
              {claim.claimType === 'General Expense' && (
                <>
                  <div className="form-group">
                    <label className="form-label">Allowance Type <span className="required">*</span></label>
                    <select
                      className="form-select"
                      value={claim.allowanceType}
                      onChange={(e) => handleChange(claim.id, 'allowanceType', e.target.value)}
                    >
                      <option value="Select Allowance Type">Select Allowance Type</option>
                      {allowanceType.map((type) => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Date <span className="required">*</span></label>
                    <input
                      type="date"
                      className="form-input"
                      value={formatDateForInput(claim.date)}
                      onChange={(e) => handleChange(claim.id, 'date', e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Amount <span className="required">*</span></label>
                    <input
                      type="number"
                      className="form-input"
                      value={claim.totalAmount}
                      onChange={(e) => handleChange(claim.id, 'totalAmount', parseFloat(e.target.value) || 0)}
                      placeholder="Enter amount"
                      min="0"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Attachment</label>
                    <div className="file-upload-wrapper">
                      <input
                        type="file"
                        id={`attachment-${claim.id}`}
                        className="file-input"
                        onChange={(e) => handleFileUpload(claim.id, e.target.files?.[0] || null)}
                        accept="image/*,.pdf"
                      />
                      <label htmlFor={`attachment-${claim.id}`} className="file-upload-label">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15M17 8L12 3M12 3L7 8M12 3V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <span>{claim.attachment ? claim.attachment.name : 'Click to Upload'}</span>
                      </label>
                    </div>
                  </div>
                </>
              )}

              {/* Daily Allowance Fields */}
              {claim.claimType === 'Daily Allowance' && (
                <>
                  <div className="form-group">
                    <label className="form-label">Allowance Type <span className="required">*</span></label>
                    <select
                      className="form-select"
                      value={claim.dailyAllowanceType}
                      onChange={(e) => handleChange(claim.id, 'dailyAllowanceType', e.target.value)}
                    >
                      <option value="Select Allowance Type">Select Allowance Type</option>
                      {dailyAllowanceType.map((type) => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">City <span className="required">*</span></label>
                    <input
                      type="text"
                      className="form-input"
                      value={claim.city}
                      onChange={(e) => handleChange(claim.id, 'city', e.target.value)}
                      placeholder="Enter city"
                    />
                  </div>

                  {/* HQ or EX HQ - Single Date */}
                  {(claim.dailyAllowanceType === 'HQ' || claim.dailyAllowanceType === 'EX HQ') && (
                    <div className="form-group">
                      <label className="form-label">Date <span className="required">*</span></label>
                      <input
                        type="date"
                        className="form-input"
                        value={formatDateForInput(claim.date)}
                        onChange={(e) => handleChange(claim.id, 'date', e.target.value)}
                      />
                    </div>
                  )}

                  {/* Out Station types - Date Range */}
                  {(claim.dailyAllowanceType === 'Out Station Hotel' ||
                    claim.dailyAllowanceType === 'Out Station Daily Allowance' ||
                    claim.dailyAllowanceType === 'Out Station Own Arrangement') && (
                    <>
                      <div className="form-row">
                        <div className="form-group">
                          <label className="form-label">From Date <span className="required">*</span></label>
                          <input
                            type="date"
                            className="form-input"
                            value={formatDateForInput(claim.fromDate)}
                            onChange={(e) => handleChange(claim.id, 'fromDate', e.target.value)}
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">To Date <span className="required">*</span></label>
                          <input
                            type="date"
                            className="form-input"
                            value={formatDateForInput(claim.toDate)}
                            onChange={(e) => handleChange(claim.id, 'toDate', e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="form-group">
                        <label className="form-label">No Of Days <span className="required">*</span></label>
                        <input
                          type="number"
                          className="form-input"
                          value={claim.days}
                          disabled
                          readOnly
                        />
                      </div>
                    </>
                  )}

                  {/* Out Station Own Arrangement - Auto-calculated */}
                  {claim.dailyAllowanceType === 'Out Station Own Arrangement' && (
                    <div className="form-group">
                      <label className="form-label">Total Amount <span className="required">*</span></label>
                      <input
                        type="number"
                        className="form-input"
                        value={claim.totalAmount.toFixed(2)}
                        disabled
                        readOnly
                      />
                    </div>
                  )}

                  {/* Other types - Manual Amount */}
                  {claim.dailyAllowanceType !== 'Out Station Own Arrangement' &&
                    claim.dailyAllowanceType !== 'HQ' &&
                    claim.dailyAllowanceType !== 'EX HQ' && (
                      <div className="form-group">
                        <label className="form-label">Total Amount <span className="required">*</span></label>
                        <input
                          type="number"
                          className="form-input"
                          value={claim.totalAmount}
                          onChange={(e) => handleChange(claim.id, 'totalAmount', parseFloat(e.target.value) || 0)}
                          placeholder="Enter total amount"
                          min="0"
                        />
                      </div>
                    )}

                  {/* Out Station Hotel - Attachment */}
                  {claim.dailyAllowanceType === 'Out Station Hotel' && (
                    <div className="form-group">
                      <label className="form-label">Attachment</label>
                      <div className="file-upload-wrapper">
                        <input
                          type="file"
                          id={`attachment-${claim.id}`}
                          className="file-input"
                          onChange={(e) => handleFileUpload(claim.id, e.target.files?.[0] || null)}
                          accept="image/*,.pdf"
                        />
                        <label htmlFor={`attachment-${claim.id}`} className="file-upload-label">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15M17 8L12 3M12 3L7 8M12 3V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          <span>{claim.attachment ? claim.attachment.name : 'Click to Upload'}</span>
                        </label>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        ))}

        <div className="form-actions">
          <button className="add-claim-btn" onClick={addNewClaim}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>Add New Claim</span>
          </button>
          <button className="save-claim-btn" onClick={handleSave} disabled={saving}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H16L21 8V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M17 21V13H7V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M7 3V8H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>{saving ? 'Saving…' : 'Save Expense Claim'}</span>
          </button>
        </div>
      </main>
    </div>
  )
}

export default CreateExpenseClaim

