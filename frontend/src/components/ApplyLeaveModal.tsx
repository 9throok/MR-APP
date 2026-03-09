import { useState, useRef, useEffect } from 'react'
import {
  MODAL_OVERLAY,
  MODAL_CARD,
  MODAL_HEADER,
  MODAL_BODY,
  MODAL_FOOTER,
  LABEL,
  SELECT,
  INPUT,
  TEXTAREA,
  BTN_PRIMARY,
  BTN_SECONDARY,
} from '../styles/designSystem'

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
    <div className={MODAL_OVERLAY} onClick={onClose}>
      <div className={`${MODAL_CARD} max-w-xl`} onClick={(e) => e.stopPropagation()}>
        <div className={MODAL_HEADER}>
          <h2 className="text-lg font-semibold text-slate-900">Applying for Leave</h2>
        </div>

        <form className={`${MODAL_BODY} space-y-4`} onSubmit={handleSubmit}>
          <div className="space-y-1.5">
            <label className={LABEL}>Select Leave Type</label>
            <div className="relative" ref={leaveTypeRef}>
              <button
                type="button"
                className={`${SELECT} cursor-pointer flex items-center justify-between`}
                onClick={() => setShowLeaveTypeDropdown(!showLeaveTypeDropdown)}
              >
                <span>{formData.leaveType || 'Select Leave Type'}</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              {showLeaveTypeDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {leaveTypes.map((type) => (
                    <button
                      key={type}
                      type="button"
                      className="w-full px-4 py-2.5 text-sm text-slate-700 text-left hover:bg-slate-50 cursor-pointer bg-transparent border-none"
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className={LABEL}>From Date</label>
              <div className="relative">
                <input
                  type="date"
                  className={INPUT}
                  value={formData.fromDate}
                  onChange={(e) => handleInputChange('fromDate', e.target.value)}
                  required
                />
                <svg className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
                  <path d="M16 2V6M8 2V6M3 10H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className={LABEL}>Select Leave Type</label>
              <div className="relative" ref={fromSessionRef}>
                <button
                  type="button"
                  className={`${SELECT} cursor-pointer flex items-center justify-between`}
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
                  <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {sessionTypes.map((session) => (
                      <button
                        key={session}
                        type="button"
                        className="w-full px-4 py-2.5 text-sm text-slate-700 text-left hover:bg-slate-50 cursor-pointer bg-transparent border-none"
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className={LABEL}>To Date</label>
              <div className="relative">
                <input
                  type="date"
                  className={INPUT}
                  value={formData.toDate}
                  onChange={(e) => handleInputChange('toDate', e.target.value)}
                  required
                />
                <svg className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
                  <path d="M16 2V6M8 2V6M3 10H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className={LABEL}>Select Leave Type</label>
              <div className="relative" ref={toSessionRef}>
                <button
                  type="button"
                  className={`${SELECT} cursor-pointer flex items-center justify-between`}
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
                  <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {sessionTypes.map((session) => (
                      <button
                        key={session}
                        type="button"
                        className="w-full px-4 py-2.5 text-sm text-slate-700 text-left hover:bg-slate-50 cursor-pointer bg-transparent border-none"
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

          <div className="space-y-1.5">
            <label className={LABEL}>Contact Details</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                className={INPUT}
                value={formData.contactDetails}
                onChange={(e) => handleInputChange('contactDetails', e.target.value)}
                placeholder="Enter contact details"
              />
              <div className="space-y-1.5">
                <input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                />
                <label htmlFor="file-upload" className={`${BTN_SECONDARY} cursor-pointer w-full justify-center`}>
                  Choose File
                </label>
                <span className="text-xs text-slate-500 mt-1">{fileName || 'No file chosen'}</span>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className={LABEL}>Reason</label>
            <textarea
              className={TEXTAREA}
              value={formData.reason}
              onChange={(e) => handleInputChange('reason', e.target.value)}
              placeholder="Enter reason for leave"
              rows={4}
              required
            />
          </div>

          <div className={MODAL_FOOTER}>
            <button type="submit" className={BTN_PRIMARY}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>Submit</span>
            </button>
            <button type="button" className={BTN_SECONDARY} onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ApplyLeaveModal
