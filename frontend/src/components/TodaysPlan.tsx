import { useState, useEffect } from 'react'
import Header from './Header'
import Sidebar from './Sidebar'
import './TodaysPlan.css'

interface TodaysPlanProps {
  onLogout: () => void
  onBack: () => void
  userName?: string
  onNavigate?: (page: string) => void
}

interface PlanItem {
  id: number
  name: string
  type: 'doctor' | 'pharmacy'
  specialization?: string
  mobile: string
  address: string
  scheduledTime?: string
}

const todaysPlans: PlanItem[] = [
  {
    id: 26,
    name: 'Dr. Navin Chaddha',
    type: 'doctor',
    specialization: 'Cardiologist',
    mobile: '+91 98765 43210',
    address: 'New Life Hospital, Mumbai',
    scheduledTime: '10:00 AM',
  },
  {
    id: 11,
    name: 'Dr. Kapoor',
    type: 'doctor',
    specialization: 'Neurologist',
    mobile: '+91 98765 43211',
    address: 'Chaddha Hospital, Mumbai',
    scheduledTime: '11:30 AM',
  },
  {
    id: 3,
    name: 'MedPlus Pharmacy',
    type: 'pharmacy',
    mobile: '+91 98765 43220',
    address: '123 MG Road, Mumbai',
    scheduledTime: '2:00 PM',
  },
  {
    id: 12,
    name: 'Dr. Nair',
    type: 'doctor',
    specialization: 'Gynecologist',
    mobile: '+91 98765 43212',
    address: 'Love Life Maternity, Mumbai',
    scheduledTime: '3:30 PM',
  },
  {
    id: 5,
    name: 'Apollo Pharmacy',
    type: 'pharmacy',
    mobile: '+91 98765 43221',
    address: '456 Park Street, Mumbai',
    scheduledTime: '4:00 PM',
  },
  {
    id: 13,
    name: 'Dr. Sinha',
    type: 'doctor',
    specialization: 'Neurologist',
    mobile: '+91 98765 43213',
    address: 'Chaddha Hospital, Mumbai',
    scheduledTime: '5:00 PM',
  },
]

function TodaysPlan({ onLogout, onBack, userName, onNavigate }: TodaysPlanProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [filter, setFilter] = useState<'all' | 'doctor' | 'pharmacy'>('all')
  const [skipModalOpen, setSkipModalOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<PlanItem | null>(null)
  const [skipReason, setSkipReason] = useState('')

  const handleMenuClick = () => {
    setSidebarOpen(true)
  }

  const handleSidebarClose = () => {
    setSidebarOpen(false)
  }

  const handleDCR = (item: PlanItem) => {
    // Navigate to DCR page with selected item
    if (onNavigate) {
      // Store selected item in sessionStorage to pass to DCR page
      sessionStorage.setItem('dcrSelectedItem', JSON.stringify(item))
      onNavigate('dcr')
    }
  }

  const handleSkipVisit = (item: PlanItem) => {
    setSelectedItem(item)
    setSkipModalOpen(true)
    setSkipReason('')
  }

  const handleCloseSkipModal = () => {
    setSkipModalOpen(false)
    setSelectedItem(null)
    setSkipReason('')
  }

  const handleSubmitSkip = () => {
    if (!skipReason.trim()) {
      return
    }
    // Handle skip visit submission
    console.log('Skipping visit to:', selectedItem?.name)
    console.log('Reason:', skipReason)
    // You can add API call here to save the skip reason
    handleCloseSkipModal()
  }

  const filteredPlans = filter === 'all' 
    ? todaysPlans 
    : todaysPlans.filter(plan => plan.type === filter)

  const today = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (skipModalOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [skipModalOpen])

  return (
    <div className="todays-plan-container">
      <Header onLogout={onLogout} onMenuClick={handleMenuClick} onNavigateHome={() => onNavigate?.('home')} onNavigateOfflineRequests={() => onNavigate?.('offline-requests')} />
      <Sidebar isOpen={sidebarOpen} onClose={handleSidebarClose} userName={userName} onNavigate={onNavigate} onLogout={onLogout} />
      <main className="todays-plan-content">
        <div className="todays-plan-header">
          <button className="back-button" onClick={onBack} aria-label="Go back">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div className="header-content">
            <h1 className="todays-plan-title">Today's Plan</h1>
            <p className="todays-plan-date">{today}</p>
          </div>
        </div>

        <div className="filter-tabs">
          <button
            className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All ({todaysPlans.length})
          </button>
          <button
            className={`filter-tab ${filter === 'doctor' ? 'active' : ''}`}
            onClick={() => setFilter('doctor')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89318 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88M13 7C13 9.20914 11.2091 11 9 11C6.79086 11 5 9.20914 5 7C5 4.79086 6.79086 3 9 3C11.2091 3 13 4.79086 13 7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Doctors ({todaysPlans.filter(p => p.type === 'doctor').length})
          </button>
          <button
            className={`filter-tab ${filter === 'pharmacy' ? 'active' : ''}`}
            onClick={() => setFilter('pharmacy')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19.5 12C19.5 12.2761 19.2761 12.5 19 12.5C18.7239 12.5 18.5 12.2761 18.5 12C18.5 11.7239 18.7239 11.5 19 11.5C19.2761 11.5 19.5 11.7239 19.5 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 3L4 7V11C4 16.55 7.84 21.74 12 23C16.16 21.74 20 16.55 20 11V7L12 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Pharmacy ({todaysPlans.filter(p => p.type === 'pharmacy').length})
          </button>
        </div>

        <div className="plans-grid">
          {filteredPlans.length === 0 ? (
            <div className="no-plans">
              <p>No plans scheduled for today.</p>
            </div>
          ) : (
            filteredPlans.map((item) => (
              <div key={item.id} className="plan-card">
                <div className="plan-card-header">
                  <div className="plan-avatar">
                    {item.type === 'doctor' ? (
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89318 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88M13 7C13 9.20914 11.2091 11 9 11C6.79086 11 5 9.20914 5 7C5 4.79086 6.79086 3 9 3C11.2091 3 13 4.79086 13 7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    ) : (
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M19.5 12C19.5 12.2761 19.2761 12.5 19 12.5C18.7239 12.5 18.5 12.2761 18.5 12C18.5 11.7239 18.7239 11.5 19 11.5C19.2761 11.5 19.5 11.7239 19.5 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M12 3L4 7V11C4 16.55 7.84 21.74 12 23C16.16 21.74 20 16.55 20 11V7L12 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                  <div className="plan-info">
                    <h3 className="plan-name">{item.name}</h3>
                    {item.specialization && (
                      <p className="plan-specialization">{item.specialization}</p>
                    )}
                    {item.scheduledTime && (
                      <p className="plan-time">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                          <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                        {item.scheduledTime}
                      </p>
                    )}
                  </div>
                  <div className="plan-type-badge">
                    {item.type === 'doctor' ? 'Doctor' : 'Pharmacy'}
                  </div>
                </div>
                <div className="plan-details">
                  <div className="plan-detail-item">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M3 5C3 3.89543 3.89543 3 5 3H8.27924C8.70967 3 9.11181 3.21447 9.3509 3.57594L10.7192 5.42594C10.9583 5.78741 11.3604 6.00188 11.7909 6.00188H19C20.1046 6.00188 21 6.89631 21 8.00188V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M3 10H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span>{item.mobile}</span>
                  </div>
                  <div className="plan-detail-item">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M21 10C21 17 12 23 12 23C12 23 3 17 3 10C3 7.61305 3.94821 5.32387 5.63604 3.63604C7.32387 1.94821 9.61305 1 12 1C14.3869 1 16.6761 1.94821 18.364 3.63604C20.0518 5.32387 21 7.61305 21 10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M12 13C13.6569 13 15 11.6569 15 10C15 8.34315 13.6569 7 12 7C10.3431 7 9 8.34315 9 10C9 11.6569 10.3431 13 12 13Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span>{item.address}</span>
                  </div>
                </div>
                <div className="plan-actions">
                  <button 
                    className="action-btn dcr-btn"
                    onClick={() => handleDCR(item)}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M16 13H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M16 17H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M10 9H9H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span>DCR</span>
                  </button>
                  <button 
                    className="action-btn skip-btn"
                    onClick={() => handleSkipVisit(item)}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span>Skip Visit</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* Skip Visit Modal */}
      {skipModalOpen && selectedItem && (
        <div className="skip-modal-overlay" onClick={handleCloseSkipModal}>
          <div className="skip-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="skip-modal-header">
              <h2>Skip Visit</h2>
              <button className="skip-modal-close" onClick={handleCloseSkipModal} aria-label="Close modal">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
            <div className="skip-modal-body">
              <div className="skip-visit-info">
                <p className="skip-visit-label">Skipping visit to:</p>
                <p className="skip-visit-name">{selectedItem.name}</p>
                {selectedItem.specialization && (
                  <p className="skip-visit-specialization">{selectedItem.specialization}</p>
                )}
              </div>
              <div className="skip-reason-field">
                <label htmlFor="skip-reason" className="skip-reason-label">
                  Reason for skipping visit <span className="required">*</span>
                </label>
                <textarea
                  id="skip-reason"
                  className="skip-reason-input"
                  placeholder="Enter the reason for skipping this visit..."
                  value={skipReason}
                  onChange={(e) => setSkipReason(e.target.value)}
                  rows={4}
                />
              </div>
            </div>
            <div className="skip-modal-footer">
              <button className="skip-modal-cancel" onClick={handleCloseSkipModal}>
                Cancel
              </button>
              <button className="skip-modal-submit" onClick={handleSubmitSkip}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>Submit</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TodaysPlan

