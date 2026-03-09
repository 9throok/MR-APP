import { useState } from 'react'
import Header from './Header'
import Sidebar from './Sidebar'
import TourPlanModal from './TourPlanModal'
import type { TourPlanFormData } from './TourPlanModal'
import { useLanguage } from '../contexts/LanguageContext'
import './TourPlans.css'

interface TourPlansProps {
  onLogout: () => void
  onBack: () => void
  userName?: string
  onNavigate?: (page: string) => void
}

interface SavedTourPlan {
  date: string
  data: TourPlanFormData
}

function TourPlans({ onLogout, onBack, userName, onNavigate }: TourPlansProps) {
  const { t } = useLanguage()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [savedTourPlans, setSavedTourPlans] = useState<SavedTourPlan[]>([])
  const [viewMode, setViewMode] = useState<'calendar' | 'weekly'>('weekly')

  const handleMenuClick = () => {
    setSidebarOpen(true)
  }

  const handleSidebarClose = () => {
    setSidebarOpen(false)
  }

  const handleDateClick = (date: Date) => {
    setSelectedDate(date)
    setIsModalOpen(true)
  }

  const getExistingTourPlan = (date: Date) => {
    const dateString = formatDate(date)
    return savedTourPlans.find(plan => plan.date === dateString)
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setSelectedDate(null)
  }

  const handleModalSave = (formData: TourPlanFormData) => {
    if (selectedDate) {
      const dateString = formatDate(selectedDate)
      const existingIndex = savedTourPlans.findIndex(plan => plan.date === dateString)
      
      // Create a deep copy of formData to ensure doctors array is properly saved
      const formDataCopy: TourPlanFormData = {
        ...formData,
        doctors: [...formData.doctors]
      }
      
      if (existingIndex >= 0) {
        // Update existing tour plan
        const updated = [...savedTourPlans]
        updated[existingIndex] = { date: dateString, data: formDataCopy }
        setSavedTourPlans(updated)
      } else {
        // Add new tour plan
        setSavedTourPlans([...savedTourPlans, { date: dateString, data: formDataCopy }])
      }
      
      console.log('Saved tour plan:', { date: dateString, data: formDataCopy })
    }
    handleModalClose()
  }

  const handleRemoveDoctor = (date: Date, doctorName: string) => {
    const dateString = formatDate(date)
    const existingIndex = savedTourPlans.findIndex(plan => plan.date === dateString)
    
    if (existingIndex >= 0) {
      const updated = [...savedTourPlans]
      const updatedData = {
        ...updated[existingIndex].data,
        doctors: updated[existingIndex].data.doctors.filter(d => d !== doctorName)
      }
      updated[existingIndex] = { date: dateString, data: updatedData }
      setSavedTourPlans(updated)
    }
  }

  const handleSubmitTourPlans = () => {
    // if (savedTourPlans.length === 0) {
    //   alert('No tour plans to submit. Please create at least one tour plan.')
    //   return
    // }

    // Get current month's tour plans
    const currentYear = currentMonth.getFullYear()
    const currentMonthIndex = currentMonth.getMonth()
    const monthTourPlans = savedTourPlans.filter(plan => {
      const planDate = new Date(plan.date)
      return planDate.getFullYear() === currentYear && planDate.getMonth() === currentMonthIndex
    })

    if (monthTourPlans.length === 0) {
      return
    }

    // Here you can add API call to submit tour plans
    console.log('Submitting tour plans:', monthTourPlans)
    
    // Show confirmation
    // if (window.confirm(`Are you sure you want to submit ${monthTourPlans.length} tour plan(s) for ${currentMonthName} ${currentYear}?`)) {
      // TODO: Replace with actual API call
      // await submitTourPlansAPI(monthTourPlans)
      
      // alert(`Successfully submitted ${monthTourPlans.length} tour plan(s)!`)
      // Optionally clear submitted plans or mark them as submitted
    // }
  }

  const getWeekDates = (date: Date) => {
    const week = []
    const startOfWeek = new Date(date)
    const day = startOfWeek.getDay()
    // Calculate Monday (day 1) of the week
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1)
    startOfWeek.setDate(diff)
    
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(startOfWeek)
      currentDate.setDate(startOfWeek.getDate() + i)
      week.push(currentDate)
    }
    return week
  }

  const goToPreviousWeek = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), currentMonth.getDate() - 7))
  }

  const goToNextWeek = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), currentMonth.getDate() + 7))
  }

  const formatDate = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const getTourPlanForDate = (date: Date) => {
    const dateString = formatDate(date)
    return savedTourPlans.find(plan => plan.date === dateString)
  }

  // Get days in month
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
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

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
  }

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
  }

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const dayNamesShort = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']

  const days = getDaysInMonth(currentMonth)
  const currentMonthName = monthNames[currentMonth.getMonth()]
  const currentYear = currentMonth.getFullYear()
  const weekDates = getWeekDates(currentMonth)

  return (
    <div className="tour-plans-container">
      <Header onLogout={onLogout} onMenuClick={handleMenuClick} onNavigateHome={() => onNavigate?.('home')} onNavigateOfflineRequests={() => onNavigate?.('offline-requests')} />
      <Sidebar isOpen={sidebarOpen} onClose={handleSidebarClose} userName={userName} onNavigate={onNavigate} onLogout={onLogout} />
      <main className="tour-plans-content">
        <div className="tour-plans-header">
          <button className="back-button" onClick={onBack} aria-label="Go back">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <h1 className="tour-plans-title">{t('tourPlans')}</h1>
          <div className="view-toggle">
            <button
              className={`view-toggle-btn ${viewMode === 'calendar' ? 'active' : ''}`}
              onClick={() => setViewMode('calendar')}
            >
              Monthly
            </button>
            <button
              className={`view-toggle-btn ${viewMode === 'weekly' ? 'active' : ''}`}
              onClick={() => setViewMode('weekly')}
            >
              Weekly
            </button>
          </div>
        </div>

        {viewMode === 'weekly' ? (
          <div className="weekly-view-container">
            <div className="weekly-header">
              <button className="week-nav-button" onClick={goToPreviousWeek} aria-label="Previous week">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              <h2 className="week-range">
                {weekDates[0].getDate()} {monthNames[weekDates[0].getMonth()].substring(0, 3)} - {weekDates[6].getDate()} {monthNames[weekDates[6].getMonth()].substring(0, 3)} {currentYear}
              </h2>
              <button className="week-nav-button" onClick={goToNextWeek} aria-label="Next week">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>

            <div className="weekly-grid">
              {weekDates.map((date, dayIndex) => {
                const dateString = formatDate(date)
                const tourPlan = getTourPlanForDate(date)
                const doctors = tourPlan && tourPlan.data.typeOfTour === 'Field Work' ? tourPlan.data.doctors : []
                // Map day index to day name (0=Monday, 6=Sunday)
                const dayName = dayNamesShort[dayIndex]
                
                return (
                  <div key={dateString} className="weekly-day-column">
                    <div className="weekly-day-header">
                      <div className="day-name">{dayName}</div>
                      <div className="day-date">{String(date.getDate()).padStart(2, '0')}</div>
                      {doctors.length > 0 && (
                        <div className="doctor-count-badge">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M1 12S5 4 12 4S23 12 23 12S19 20 12 20S1 12 1 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
                          </svg>
                          <span>{doctors.length}</span>
                        </div>
                      )}
                    </div>
                    <div className="weekly-day-content">
                      {doctors.length > 0 ? (
                        <div className="doctors-list-full">
                          {doctors.map((doctor, idx) => (
                            <div key={`${dateString}-${idx}-${doctor}`} className="doctor-entry-full">
                              <span className="doctor-name-full">{doctor}</span>
                              <button
                                className="remove-doctor-btn-full"
                                onClick={() => handleRemoveDoctor(date, doctor)}
                                aria-label={`Remove ${doctor}`}
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="empty-day-message">No doctors assigned</div>
                      )}
                      <button
                        className="add-tour-plan-btn"
                        onClick={() => handleDateClick(date)}
                        aria-label={`Add tour plan for ${dateString}`}
                      >
                        + Add Plan
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="calendar-container">
          <div className="calendar-header">
            <button className="calendar-nav-button" onClick={goToPreviousMonth} aria-label="Previous month">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <h2 className="calendar-month-year">
              {currentMonthName} {currentYear}
            </h2>
            <button className="calendar-nav-button" onClick={goToNextMonth} aria-label="Next month">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
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
              const tourPlan = getTourPlanForDate(date)
              const hasTourPlan = !!tourPlan
              
              return (
                <button
                  key={dateString}
                  className={`calendar-day ${isToday ? 'today' : ''} ${hasTourPlan ? 'has-tour-plan' : ''}`}
                  onClick={() => handleDateClick(date)}
                >
                  <span className="day-number">{date.getDate()}</span>
                  {hasTourPlan && tourPlan && tourPlan.data && tourPlan.data.typeOfTour === 'Field Work' && tourPlan.data.doctors && tourPlan.data.doctors.length > 0 && (
                    <div className="tour-plan-doctors">
                      {tourPlan.data.doctors.slice(0, 2).map((doctor, idx) => {
                        const lastName = doctor.split(' ').slice(-1)[0] || doctor
                        return (
                          <span key={`${dateString}-${idx}-${doctor}`} className="doctor-badge" title={doctor}>
                            {lastName}
                          </span>
                        )
                      })}
                      {tourPlan.data.doctors.length > 2 && (
                        <span className="doctor-badge more" title={tourPlan.data.doctors.slice(2).join(', ')}>
                          +{tourPlan.data.doctors.length - 2}
                        </span>
                      )}
                    </div>
                  )}
                </button>
              )
            })}
          </div>
          </div>
        )}

        <div className="tour-plans-footer">
          <button className="submit-tour-plans-btn" onClick={handleSubmitTourPlans}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>Submit Plan</span>
          </button>
        </div>

        {isModalOpen && selectedDate && (
          <TourPlanModal
            date={selectedDate}
            existingData={getExistingTourPlan(selectedDate)?.data}
            onClose={handleModalClose}
            onSave={handleModalSave}
          />
        )}
      </main>
    </div>
  )
}

export default TourPlans

