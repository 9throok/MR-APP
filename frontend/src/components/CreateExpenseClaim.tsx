import { useState } from 'react'
import {
  claimTypes,
  conveyanceModes,
  allowanceType,
  dailyAllowanceType,
  transportClasses,
} from '../constants/expenseConstants'
import {
  PAGE_CONTENT,
  PAGE_TITLE,
  BACK_BUTTON,
  CARD,
  CARD_PADDING,
  CARD_TITLE,
  BTN_PRIMARY,
  BTN_SECONDARY,
  BTN_ICON,
  INPUT,
  TEXTAREA,
  LABEL,
  SELECT,
} from '../styles/designSystem'

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

function CreateExpenseClaim({ onLogout: _onLogout, onBack, userName: _userName, onNavigate }: CreateExpenseClaimProps) {
  const [claims, setClaims] = useState<Claim[]>([{ ...initialClaim }])

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

  const handleSave = () => {
    console.log('Saving claims:', claims)
    // In real app, this would call an API
    if (onNavigate) {
      onNavigate('expense-claim')
    }
  }

  const formatDateForInput = (dateString: string): string => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toISOString().split('T')[0]
  }

  return (
    <div>
      <main className={PAGE_CONTENT}>
        <div className="flex items-center gap-3 mb-6">
          <button className={BACK_BUTTON} onClick={handleBackClick} aria-label="Go back">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <h1 className={PAGE_TITLE}>Create Expense Claim</h1>
        </div>

        {claims.map((claim, index) => (
          <div key={claim.id} className={`${CARD} ${CARD_PADDING} mb-4`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={CARD_TITLE}>Claim {index + 1}</h3>
              {claims.length > 1 && (
                <button
                  className={`${BTN_ICON} text-red-400 hover:text-red-600 hover:bg-red-50`}
                  onClick={() => handleDeleteClaim(claim.id)}
                  aria-label="Delete claim"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 6H5H21M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              )}
            </div>

            <div className="space-y-4">
              {/* Claim Type */}
              <div className="space-y-1.5">
                <label className={LABEL}>Claim Type <span className="text-red-500">*</span></label>
                <select
                  className={SELECT}
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
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className={LABEL}>From Date <span className="text-red-500">*</span></label>
                      <input
                        type="date"
                        className={INPUT}
                        value={formatDateForInput(claim.fromDate)}
                        onChange={(e) => handleChange(claim.id, 'fromDate', e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className={LABEL}>To Date <span className="text-red-500">*</span></label>
                      <input
                        type="date"
                        className={INPUT}
                        value={formatDateForInput(claim.toDate)}
                        onChange={(e) => handleChange(claim.id, 'toDate', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className={LABEL}>From Place <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        className={INPUT}
                        value={claim.fromPlace}
                        onChange={(e) => handleChange(claim.id, 'fromPlace', e.target.value)}
                        placeholder="Enter from place"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className={LABEL}>To Place <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        className={INPUT}
                        value={claim.toPlace}
                        onChange={(e) => handleChange(claim.id, 'toPlace', e.target.value)}
                        placeholder="Enter to place"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className={LABEL}>Conveyance Mode <span className="text-red-500">*</span></label>
                      <select
                        className={SELECT}
                        value={claim.conveyanceMode}
                        onChange={(e) => handleChange(claim.id, 'conveyanceMode', e.target.value)}
                      >
                        <option value="">Select Mode</option>
                        {conveyanceModes.map((mode) => (
                          <option key={mode} value={mode}>{mode}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className={LABEL}>Distance (KM) <span className="text-red-500">*</span></label>
                      <input
                        type="number"
                        className={INPUT}
                        value={claim.distance}
                        onChange={(e) => handleChange(claim.id, 'distance', e.target.value)}
                        placeholder="Enter distance"
                        min="0"
                        step="0.1"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className={LABEL}>Total Amount <span className="text-red-500">*</span></label>
                    <input
                      type="number"
                      className={INPUT}
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
                  <div className="space-y-1.5">
                    <label className={LABEL}>Transport Class <span className="text-red-500">*</span></label>
                    <select
                      className={SELECT}
                      value={claim.transportClass}
                      onChange={(e) => handleChange(claim.id, 'transportClass', e.target.value)}
                    >
                      <option value="Select Transport Class">Select Transport Class</option>
                      {transportClasses.map((cls) => (
                        <option key={cls} value={cls}>{cls}</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className={LABEL}>Departure Station <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        className={INPUT}
                        value={claim.fromPlace}
                        onChange={(e) => handleChange(claim.id, 'fromPlace', e.target.value)}
                        placeholder="Enter departure station"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className={LABEL}>Departure Date <span className="text-red-500">*</span></label>
                      <input
                        type="date"
                        className={INPUT}
                        value={formatDateForInput(claim.fromDate)}
                        onChange={(e) => handleChange(claim.id, 'fromDate', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className={LABEL}>Arrival Station <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        className={INPUT}
                        value={claim.toPlace}
                        onChange={(e) => handleChange(claim.id, 'toPlace', e.target.value)}
                        placeholder="Enter arrival station"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className={LABEL}>Arrival Date <span className="text-red-500">*</span></label>
                      <input
                        type="date"
                        className={INPUT}
                        value={formatDateForInput(claim.arrivalDate)}
                        onChange={(e) => handleChange(claim.id, 'arrivalDate', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className={LABEL}>Claim Amount <span className="text-red-500">*</span></label>
                    <input
                      type="number"
                      className={INPUT}
                      value={claim.claimamount}
                      onChange={(e) => handleChange(claim.id, 'claimamount', e.target.value)}
                      placeholder="Enter claim amount"
                      min="0"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className={LABEL}>Remark</label>
                    <textarea
                      className={TEXTAREA}
                      value={claim.remark}
                      onChange={(e) => handleChange(claim.id, 'remark', e.target.value)}
                      placeholder="Enter remarks"
                      rows={3}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className={LABEL}>Attachment</label>
                    <div className="space-y-1.5">
                      <input
                        type="file"
                        id={`attachment-${claim.id}`}
                        className="hidden"
                        onChange={(e) => handleFileUpload(claim.id, e.target.files?.[0] || null)}
                        accept="image/*,.pdf"
                      />
                      <label htmlFor={`attachment-${claim.id}`} className={`${BTN_SECONDARY} cursor-pointer`}>
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
                  <div className="space-y-1.5">
                    <label className={LABEL}>Allowance Type <span className="text-red-500">*</span></label>
                    <select
                      className={SELECT}
                      value={claim.allowanceType}
                      onChange={(e) => handleChange(claim.id, 'allowanceType', e.target.value)}
                    >
                      <option value="Select Allowance Type">Select Allowance Type</option>
                      {allowanceType.map((type) => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className={LABEL}>Date <span className="text-red-500">*</span></label>
                    <input
                      type="date"
                      className={INPUT}
                      value={formatDateForInput(claim.date)}
                      onChange={(e) => handleChange(claim.id, 'date', e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className={LABEL}>Amount <span className="text-red-500">*</span></label>
                    <input
                      type="number"
                      className={INPUT}
                      value={claim.totalAmount}
                      onChange={(e) => handleChange(claim.id, 'totalAmount', parseFloat(e.target.value) || 0)}
                      placeholder="Enter amount"
                      min="0"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className={LABEL}>Attachment</label>
                    <div className="space-y-1.5">
                      <input
                        type="file"
                        id={`attachment-${claim.id}`}
                        className="hidden"
                        onChange={(e) => handleFileUpload(claim.id, e.target.files?.[0] || null)}
                        accept="image/*,.pdf"
                      />
                      <label htmlFor={`attachment-${claim.id}`} className={`${BTN_SECONDARY} cursor-pointer`}>
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
                  <div className="space-y-1.5">
                    <label className={LABEL}>Allowance Type <span className="text-red-500">*</span></label>
                    <select
                      className={SELECT}
                      value={claim.dailyAllowanceType}
                      onChange={(e) => handleChange(claim.id, 'dailyAllowanceType', e.target.value)}
                    >
                      <option value="Select Allowance Type">Select Allowance Type</option>
                      {dailyAllowanceType.map((type) => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className={LABEL}>City <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      className={INPUT}
                      value={claim.city}
                      onChange={(e) => handleChange(claim.id, 'city', e.target.value)}
                      placeholder="Enter city"
                    />
                  </div>

                  {/* HQ or EX HQ - Single Date */}
                  {(claim.dailyAllowanceType === 'HQ' || claim.dailyAllowanceType === 'EX HQ') && (
                    <div className="space-y-1.5">
                      <label className={LABEL}>Date <span className="text-red-500">*</span></label>
                      <input
                        type="date"
                        className={INPUT}
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
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                          <label className={LABEL}>From Date <span className="text-red-500">*</span></label>
                          <input
                            type="date"
                            className={INPUT}
                            value={formatDateForInput(claim.fromDate)}
                            onChange={(e) => handleChange(claim.id, 'fromDate', e.target.value)}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className={LABEL}>To Date <span className="text-red-500">*</span></label>
                          <input
                            type="date"
                            className={INPUT}
                            value={formatDateForInput(claim.toDate)}
                            onChange={(e) => handleChange(claim.id, 'toDate', e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className={LABEL}>No Of Days <span className="text-red-500">*</span></label>
                        <input
                          type="number"
                          className={INPUT}
                          value={claim.days}
                          disabled
                          readOnly
                        />
                      </div>
                    </>
                  )}

                  {/* Out Station Own Arrangement - Auto-calculated */}
                  {claim.dailyAllowanceType === 'Out Station Own Arrangement' && (
                    <div className="space-y-1.5">
                      <label className={LABEL}>Total Amount <span className="text-red-500">*</span></label>
                      <input
                        type="number"
                        className={INPUT}
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
                      <div className="space-y-1.5">
                        <label className={LABEL}>Total Amount <span className="text-red-500">*</span></label>
                        <input
                          type="number"
                          className={INPUT}
                          value={claim.totalAmount}
                          onChange={(e) => handleChange(claim.id, 'totalAmount', parseFloat(e.target.value) || 0)}
                          placeholder="Enter total amount"
                          min="0"
                        />
                      </div>
                    )}

                  {/* Out Station Hotel - Attachment */}
                  {claim.dailyAllowanceType === 'Out Station Hotel' && (
                    <div className="space-y-1.5">
                      <label className={LABEL}>Attachment</label>
                      <div className="space-y-1.5">
                        <input
                          type="file"
                          id={`attachment-${claim.id}`}
                          className="hidden"
                          onChange={(e) => handleFileUpload(claim.id, e.target.files?.[0] || null)}
                          accept="image/*,.pdf"
                        />
                        <label htmlFor={`attachment-${claim.id}`} className={`${BTN_SECONDARY} cursor-pointer`}>
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

        <div className="flex items-center gap-3 mt-6">
          <button className={BTN_SECONDARY} onClick={addNewClaim}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>Add New Claim</span>
          </button>
          <button className={BTN_PRIMARY} onClick={handleSave}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H16L21 8V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M17 21V13H7V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M7 3V8H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>Save Expense Claim</span>
          </button>
        </div>
      </main>
    </div>
  )
}

export default CreateExpenseClaim
