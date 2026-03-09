import { useState } from 'react'
import Header from './Header'
import Sidebar from './Sidebar'
import ApplyLeaveModal from './ApplyLeaveModal'
import './Leaves.css'

interface Leave {
  id: number
  date: string
  type: 'leave' | 'holiday' | 'present' | 'absent'
  leaveType?: string
}

interface LeavesProps {
  onLogout: () => void
  onBack: () => void
  userName?: string
  onNavigate?: (page: string) => void
}

function Leaves({ onLogout, onBack, userName, onNavigate }: LeavesProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth())
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
  const [viewMode, setViewMode] = useState<'month' | 'year'>('month')
  const [leaves, setLeaves] = useState<Leave[]>([])

  const handleMenuClick = () => {
    setSidebarOpen(true)
  }

  const handleSidebarClose = () => {
    setSidebarOpen(false)
  }

  const handleApplyLeave = () => {
    setIsModalOpen(true)
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setSelectedDate('')
  }

  const handleLeaveSubmit = (formData: any) => {
    // Create leave entries for date range
    const fromDate = new Date(formData.fromDate)
    const toDate = new Date(formData.toDate)
    const newLeaves: Leave[] = []

    for (let d = new Date(fromDate); d <= toDate; d.setDate(d.getDate() + 1)) {
      const dateString = formatDate(new Date(d))
      // Remove existing leave for this date if any
      const filtered = leaves.filter(l => l.date !== dateString)
      newLeaves.push({
        id: Date.now() + d.getTime(),
        date: dateString,
        type: 'leave',
        leaveType: formData.leaveType,
      })
      setLeaves([...filtered, ...newLeaves])
    }

    handleModalClose()
  }

  const formatDate = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const getDaysInMonth = (year: number, month: number) => {
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days = []
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day))
    }
    
    return days
  }

  const getLeaveStatus = (date: Date): Leave | null => {
    const dateString = formatDate(date)
    return leaves.find(l => l.date === dateString) || null
  }

  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ]

  const dayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
  const days = getDaysInMonth(currentYear, currentMonth)

  const years = Array.from({ length: 10 }, (_, i) => currentYear - 5 + i)

  return (
    <div className="leaves-container">
      <Header onLogout={onLogout} onMenuClick={handleMenuClick} onNavigateHome={() => onNavigate?.('home')} onNavigateOfflineRequests={() => onNavigate?.('offline-requests')} />
      <Sidebar isOpen={sidebarOpen} onClose={handleSidebarClose} userName={userName} onNavigate={onNavigate} onLogout={onLogout} />
      <main className="leaves-content">
        <div className="leaves-header">
          <button className="back-button" onClick={onBack} aria-label="Go back">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <h1 className="leaves-title">Apply for Leave</h1>
          <button className="apply-leave-btn" onClick={handleApplyLeave}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>Apply Leave</span>
          </button>
        </div>

        <div className="legends-section">
          <div className="legends-header">Legends</div>
          <div className="legends-content">
            <div className="legend-item">
              <span className="legend-badge present">P</span>
              <span className="legend-label">Present</span>
            </div>
            <div className="legend-item">
              <span className="legend-badge absent">A</span>
              <span className="legend-label">Absent</span>
            </div>
            <div className="legend-item">
              <span className="legend-badge leave">L</span>
              <span className="legend-label">Leave</span>
            </div>
            <div className="legend-item">
              <span className="legend-badge holiday">Off</span>
              <span className="legend-label">Off</span>
            </div>
          </div>
        </div>

        {selectedDate && (
          <div className="selected-date-display">
            You selected date: {selectedDate}
          </div>
        )}

        <div className="calendar-section">
          <div className="calendar-controls">
            <div className="date-selectors">
              <select
                className="year-selector"
                value={currentYear}
                onChange={(e) => setCurrentYear(Number(e.target.value))}
              >
                {years.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
              <select
                className="month-selector"
                value={currentMonth}
                onChange={(e) => setCurrentMonth(Number(e.target.value))}
              >
                {monthNames.map((month, index) => (
                  <option key={index} value={index}>{month}</option>
                ))}
              </select>
            </div>
            <div className="view-toggle-buttons">
              <button
                className={`view-toggle-btn ${viewMode === 'month' ? 'active' : ''}`}
                onClick={() => setViewMode('month')}
              >
                Month
              </button>
              <button
                className={`view-toggle-btn ${viewMode === 'year' ? 'active' : ''}`}
                onClick={() => setViewMode('year')}
              >
                Year
              </button>
            </div>
          </div>

          <div className="calendar-grid">
            {dayNames.map((day) => (
              <div key={day} className="calendar-day-header">
                {day}
              </div>
            ))}
            {days.map((date, index) => {
              if (date === null) {
                return <div key={`empty-${index}`} className="calendar-day empty"></div>
              }
              
              const isToday = date.toDateString() === new Date().toDateString()
              const dateString = formatDate(date)
              const leaveStatus = getLeaveStatus(date)
              const isHoliday = date.getDay() === 0 // Sunday as holiday example
              
              return (
                <button
                  key={dateString}
                  className={`calendar-day ${isToday ? 'today' : ''} ${
                    leaveStatus ? leaveStatus.type : isHoliday ? 'holiday' : ''
                  }`}
                  onClick={() => setSelectedDate(dateString)}
                >
                  <span className="day-number">{date.getDate()}</span>
                  {leaveStatus && (
                    <span className="status-badge">
                      {leaveStatus.type === 'leave' ? 'L' : leaveStatus.type === 'absent' ? 'A' : 'P'}
                    </span>
                  )}
                  {isHoliday && !leaveStatus && (
                    <span className="status-badge">Off</span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {isModalOpen && (
          <ApplyLeaveModal
            onClose={handleModalClose}
            onSubmit={handleLeaveSubmit}
          />
        )}
      </main>
    </div>
  )
}

export default Leaves

