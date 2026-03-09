import { useState, useEffect, useRef } from 'react'
import './TourPlanModal.css'

interface TourPlanModalProps {
  date: Date
  existingData?: TourPlanFormData
  onClose: () => void
  onSave: (data: TourPlanFormData) => void
}

export interface TourPlanFormData {
  typeOfTour: string
  station: string
  startTime: string
  endTime: string
  doctors: string[]
}

const tourTypes = ['Field Work', 'Meeting', 'Training', 'Conference', 'Other']
const stations = ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata', 'Hyderabad', 'Pune']
const doctors = [
  'Dr. Anil Doshi',
  'Dr. Navin Chaddha',
  'Dr. Surbhi Rel',
  'Dr. Naresh Patil',
  'Dr. Surekha Rane',
  'Dr. Rajesh Kumar',
  'Dr. Priya Sharma',
  'Dr. Amit Verma',
]

function TourPlanModal({ date, existingData, onClose, onSave }: TourPlanModalProps) {
  const [formData, setFormData] = useState<TourPlanFormData>(
    existingData ? {
      ...existingData,
      doctors: existingData.doctors ? [...existingData.doctors] : []
    } : {
      typeOfTour: 'Field Work',
      station: '',
      startTime: '09:00',
      endTime: '18:00',
      doctors: [],
    }
  )

  // Update form data when existingData changes
  useEffect(() => {
    if (existingData) {
      setFormData({
        ...existingData,
        doctors: existingData.doctors ? [...existingData.doctors] : []
      })
    } else {
      setFormData({
        typeOfTour: 'Field Work',
        station: '',
        startTime: '09:00',
        endTime: '18:00',
        doctors: [],
      })
    }
  }, [existingData])

  const [showTypeDropdown, setShowTypeDropdown] = useState(false)
  const [showStationDropdown, setShowStationDropdown] = useState(false)
  const [showDoctorDropdown, setShowDoctorDropdown] = useState(false)
  const typeDropdownRef = useRef<HTMLDivElement>(null)
  const stationDropdownRef = useRef<HTMLDivElement>(null)
  const doctorDropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (typeDropdownRef.current && !typeDropdownRef.current.contains(event.target as Node)) {
        setShowTypeDropdown(false)
      }
      if (stationDropdownRef.current && !stationDropdownRef.current.contains(event.target as Node)) {
        setShowStationDropdown(false)
      }
      if (doctorDropdownRef.current && !doctorDropdownRef.current.contains(event.target as Node)) {
        setShowDoctorDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Reset doctors when type changes from Field Work to something else
  useEffect(() => {
    if (formData.typeOfTour !== 'Field Work') {
      setFormData(prev => ({ ...prev, doctors: [] }))
    }
  }, [formData.typeOfTour])

  const formatDate = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const handleInputChange = (field: keyof TourPlanFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.station && (formData.typeOfTour !== 'Field Work' || formData.doctors.length > 0)) {
      onSave(formData)
    }
  }

  const toggleDoctor = (doctor: string) => {
    setFormData(prev => {
      const doctors = prev.doctors.includes(doctor)
        ? prev.doctors.filter(d => d !== doctor)
        : [...prev.doctors, doctor]
      return { ...prev, doctors }
    })
  }

  const dateString = formatDate(date)

  return (
    <div className="tour-plan-modal-overlay" onClick={onClose}>
      <div className="tour-plan-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">My Plan for {dateString}</h2>
        </div>

        <form className="tour-plan-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">
              Type of Plan <span className="required">*</span>
            </label>
            <div className="dropdown-wrapper" ref={typeDropdownRef}>
              <button
                type="button"
                className="form-dropdown"
                onClick={() => {
                  setShowTypeDropdown(!showTypeDropdown)
                  setShowStationDropdown(false)
                  setShowDoctorDropdown(false)
                }}
              >
                <span>{formData.typeOfTour || 'Select Type'}</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              {showTypeDropdown && (
                <div className="dropdown-menu">
                  {tourTypes.map((type) => (
                    <button
                      key={type}
                      type="button"
                      className="dropdown-item"
                      onClick={() => {
                        handleInputChange('typeOfTour', type)
                        setShowTypeDropdown(false)
                      }}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">
              Station <span className="required">*</span>
            </label>
            <div className="dropdown-wrapper" ref={stationDropdownRef}>
              <button
                type="button"
                className="form-dropdown"
                onClick={() => {
                  setShowStationDropdown(!showStationDropdown)
                  setShowTypeDropdown(false)
                  setShowDoctorDropdown(false)
                }}
              >
                <span>{formData.station || 'Select Station'}</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              {showStationDropdown && (
                <div className="dropdown-menu">
                  {stations.map((station) => (
                    <button
                      key={station}
                      type="button"
                      className="dropdown-item"
                      onClick={() => {
                        handleInputChange('station', station)
                        setShowStationDropdown(false)
                      }}
                    >
                      {station}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">
              Start Time <span className="required">*</span>
            </label>
            <div className="time-input-wrapper">
              <input
                type="time"
                className="form-time-input"
                value={formData.startTime}
                onChange={(e) => handleInputChange('startTime', e.target.value)}
                required
              />
              <svg className="time-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">
              End Time <span className="required">*</span>
            </label>
            <div className="time-input-wrapper">
              <input
                type="time"
                className="form-time-input"
                value={formData.endTime}
                onChange={(e) => handleInputChange('endTime', e.target.value)}
                required
              />
              <svg className="time-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
          </div>

          {formData.typeOfTour === 'Field Work' && (
            <div className="form-group">
              <label className="form-label">
                Doctor <span className="required">*</span>
              </label>
              <div className="dropdown-wrapper" ref={doctorDropdownRef}>
                <button
                  type="button"
                  className="form-dropdown"
                  onClick={() => {
                    setShowDoctorDropdown(!showDoctorDropdown)
                    setShowTypeDropdown(false)
                    setShowStationDropdown(false)
                  }}
                >
                  <span>
                    {formData.doctors.length === 0
                      ? 'Select Doctor(s)'
                      : formData.doctors.length === 1
                      ? formData.doctors[0]
                      : `${formData.doctors.length} doctors selected`}
                  </span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
                {showDoctorDropdown && (
                  <div className="dropdown-menu multi-select">
                    {doctors.map((doctor) => (
                      <button
                        key={doctor}
                        type="button"
                        className={`dropdown-item ${formData.doctors.includes(doctor) ? 'selected' : ''}`}
                        onClick={() => toggleDoctor(doctor)}
                      >
                        <span className="checkbox">
                          {formData.doctors.includes(doctor) && (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          )}
                        </span>
                        <span>{doctor}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="modal-actions">
            <button type="button" className="cancel-button" onClick={onClose}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>Cancel</span>
            </button>
                  <button type="submit" className="save-button">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span>Save</span>
                  </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default TourPlanModal

