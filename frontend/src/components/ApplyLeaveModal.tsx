import { useState, useRef, useEffect } from 'react'
import './ApplyLeaveModal.css'

interface ApplyLeaveModalProps {
  onClose: () => void
  onSubmit: (data: LeaveFormData) => void
}

export interface LeaveFormData {
  leaveType: string
  fromDate: string
  toDate: string
  contactDetails: string
  file?: File
  reason: string
}

const leaveTypes = [
  'Earned Leave',
  'Loss of Pay',
  'Comp-off',
  'Sabbatical Leave',
  'Sick Leave',
  'Casual Leave',
  'Maternity Leave',
  'Paternity Leave',
]

const sessionTypes = ['Session 1', 'Session 2']

function ApplyLeaveModal({ onClose, onSubmit }: ApplyLeaveModalProps) {
  const [formData, setFormData] = useState<LeaveFormData>({
    leaveType: '',
    fromDate: '',
    toDate: '',
    contactDetails: '',
    reason: '',
  })
  const [showLeaveTypeDropdown, setShowLeaveTypeDropdown] = useState(false)
  const [showFromSessionDropdown, setShowFromSessionDropdown] = useState(false)
  const [showToSessionDropdown, setShowToSessionDropdown] = useState(false)
  const [fromSession, setFromSession] = useState('')
  const [toSession, setToSession] = useState('')
  const [fileName, setFileName] = useState('')
  const leaveTypeRef = useRef<HTMLDivElement>(null)
  const fromSessionRef = useRef<HTMLDivElement>(null)
  const toSessionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (leaveTypeRef.current && !leaveTypeRef.current.contains(event.target as Node)) {
        setShowLeaveTypeDropdown(false)
      }
      if (fromSessionRef.current && !fromSessionRef.current.contains(event.target as Node)) {
        setShowFromSessionDropdown(false)
      }
      if (toSessionRef.current && !toSessionRef.current.contains(event.target as Node)) {
        setShowToSessionDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleInputChange = (field: keyof LeaveFormData, value: string | File) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFormData(prev => ({ ...prev, file }))
      setFileName(file.name)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.leaveType && formData.fromDate && formData.toDate && formData.reason) {
      onSubmit(formData)
    }
  }

  return (
    <div className="apply-leave-modal-overlay" onClick={onClose}>
      <div className="apply-leave-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Applying for Leave</h2>
        </div>

        <form className="leave-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Select Leave Type</label>
            <div className="dropdown-wrapper" ref={leaveTypeRef}>
              <button
                type="button"
                className="form-dropdown"
                onClick={() => setShowLeaveTypeDropdown(!showLeaveTypeDropdown)}
              >
                <span>{formData.leaveType || 'Select Leave Type'}</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              {showLeaveTypeDropdown && (
                <div className="dropdown-menu">
                  {leaveTypes.map((type) => (
                    <button
                      key={type}
                      type="button"
                      className="dropdown-item"
                      onClick={() => {
                        handleInputChange('leaveType', type)
                        setShowLeaveTypeDropdown(false)
                      }}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">From Date</label>
              <div className="date-input-wrapper">
                <input
                  type="date"
                  className="form-date-input"
                  value={formData.fromDate}
                  onChange={(e) => handleInputChange('fromDate', e.target.value)}
                  required
                />
                <svg className="date-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
                  <path d="M16 2V6M8 2V6M3 10H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Select Leave Type</label>
              <div className="dropdown-wrapper" ref={fromSessionRef}>
                <button
                  type="button"
                  className="form-dropdown"
                  onClick={() => {
                    setShowFromSessionDropdown(!showFromSessionDropdown)
                    setShowLeaveTypeDropdown(false)
                    setShowToSessionDropdown(false)
                  }}
                >
                  <span>{fromSession || 'Select Leave Type'}</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
                {showFromSessionDropdown && (
                  <div className="dropdown-menu">
                    {sessionTypes.map((session) => (
                      <button
                        key={session}
                        type="button"
                        className="dropdown-item"
                        onClick={() => {
                          setFromSession(session)
                          setShowFromSessionDropdown(false)
                        }}
                      >
                        {session}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">To Date</label>
              <div className="date-input-wrapper">
                <input
                  type="date"
                  className="form-date-input"
                  value={formData.toDate}
                  onChange={(e) => handleInputChange('toDate', e.target.value)}
                  required
                />
                <svg className="date-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
                  <path d="M16 2V6M8 2V6M3 10H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Select Leave Type</label>
              <div className="dropdown-wrapper" ref={toSessionRef}>
                <button
                  type="button"
                  className="form-dropdown"
                  onClick={() => {
                    setShowToSessionDropdown(!showToSessionDropdown)
                    setShowLeaveTypeDropdown(false)
                    setShowFromSessionDropdown(false)
                  }}
                >
                  <span>{toSession || 'Select Leave Type'}</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
                {showToSessionDropdown && (
                  <div className="dropdown-menu">
                    {sessionTypes.map((session) => (
                      <button
                        key={session}
                        type="button"
                        className="dropdown-item"
                        onClick={() => {
                          setToSession(session)
                          setShowToSessionDropdown(false)
                        }}
                      >
                        {session}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Contact Details</label>
            <div className="contact-details-row">
              <input
                type="text"
                className="form-text-input"
                value={formData.contactDetails}
                onChange={(e) => handleInputChange('contactDetails', e.target.value)}
                placeholder="Enter contact details"
              />
              <div className="file-upload-wrapper">
                <input
                  type="file"
                  id="file-upload"
                  className="file-input"
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                />
                <label htmlFor="file-upload" className="file-upload-btn">
                  Choose File
                </label>
                <span className="file-name">{fileName || 'No file chosen'}</span>
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Reason</label>
            <textarea
              className="form-textarea"
              value={formData.reason}
              onChange={(e) => handleInputChange('reason', e.target.value)}
              placeholder="Enter reason for leave"
              rows={4}
              required
            />
          </div>

          <div className="modal-actions">
            <button type="submit" className="submit-btn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>Submit</span>
            </button>
            <button type="button" className="cancel-btn" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ApplyLeaveModal

