import { useState, useEffect, useCallback } from 'react'
import Header from './Header'
import Sidebar from './Sidebar'
import TourPlanModal from './TourPlanModal'
import type { TourPlanFormData } from './TourPlanModal'
import { useLanguage } from '../contexts/LanguageContext'
import { apiGet, apiPost, apiPatch } from '../services/apiService'
import './TourPlans.css'

interface TourPlansProps {
  onLogout: () => void
  onBack: () => void
  userName?: string
  onNavigate?: (page: string) => void
}

interface BackendVisit {
  id: number
  doctor_id: number | null
  doctor_name: string | null
  visit_order: number
  notes: string | null
  status?: string
}

interface BackendPlan {
  id: number
  user_id: string
  plan_date: string  // YYYY-MM-DD
  type_of_tour: 'field_work' | 'meeting' | 'training' | 'conference' | 'other' | null
  station: string | null
  start_time: string | null  // HH:MM:SS
  end_time: string | null
  notes: string | null
  status: 'draft' | 'submitted' | 'approved' | 'rejected'
  visits?: BackendVisit[]
}

const TYPE_TO_BACKEND: Record<string, BackendPlan['type_of_tour']> = {
  'Field Work': 'field_work',
  Meeting: 'meeting',
  Training: 'training',
  Conference: 'conference',
  Other: 'other',
}

const TYPE_TO_UI: Record<string, string> = {
  field_work: 'Field Work',
  meeting: 'Meeting',
  training: 'Training',
  conference: 'Conference',
  other: 'Other',
}

function pad(n: number) { return String(n).padStart(2, '0') }
function dateKey(d: Date): string { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` }

// Pull HH:MM out of a backend time string like "09:00:00".
function timeToHHMM(t: string | null, fallback: string): string {
  if (!t) return fallback
  return t.slice(0, 5)
}

function planToFormData(plan: BackendPlan): TourPlanFormData {
  return {
    typeOfTour: plan.type_of_tour ? TYPE_TO_UI[plan.type_of_tour] : 'Field Work',
    station: plan.station || '',
    startTime: timeToHHMM(plan.start_time, '09:00'),
    endTime: timeToHHMM(plan.end_time, '18:00'),
    doctors: (plan.visits || []).map(v => v.doctor_name || '').filter(Boolean),
  }
}

function TourPlans({ onLogout, onBack, userName, onNavigate }: TourPlansProps) {
  const { t } = useLanguage()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [plans, setPlans] = useState<BackendPlan[]>([])
  const [viewMode, setViewMode] = useState<'calendar' | 'weekly'>('weekly')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [selectedPlanDetail, setSelectedPlanDetail] = useState<BackendPlan | null>(null)

  // Range covers the visible month/week with a small buffer for the weekly view.
  const loadPlans = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      // Pull a generous window — the visible month plus +/- 7 days for week view.
      const first = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
      first.setDate(first.getDate() - 7)
      const last = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0)
      last.setDate(last.getDate() + 7)
      const fromDate = dateKey(first)
      const toDate = dateKey(last)
      const res = await apiGet(`/tour-plans?from_date=${fromDate}&to_date=${toDate}`)
      setPlans(res.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tour plans')
    } finally {
      setLoading(false)
    }
  }, [currentMonth])

  useEffect(() => { loadPlans() }, [loadPlans])

  const handleMenuClick = () => setSidebarOpen(true)
  const handleSidebarClose = () => setSidebarOpen(false)

  const findPlan = (date: Date): BackendPlan | undefined => {
    const key = dateKey(date)
    return plans.find(p => p.plan_date.slice(0, 10) === key)
  }

  // Visits aren't loaded by the list endpoint — fetch detail on demand for the modal.
  const handleDateClick = async (date: Date) => {
    setSelectedDate(date)
    const existing = findPlan(date)
    if (existing) {
      try {
        const res = await apiGet(`/tour-plans/${existing.id}`)
        setSelectedPlanDetail(res.data || existing)
      } catch (err) {
        // Fallback: open with whatever we have.
        setSelectedPlanDetail(existing)
      }
    } else {
      setSelectedPlanDetail(null)
    }
    setIsModalOpen(true)
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setSelectedDate(null)
    setSelectedPlanDetail(null)
  }

  const handleModalSave = async (formData: TourPlanFormData) => {
    if (!selectedDate) return handleModalClose()
    setError(null)
    try {
      const planDate = dateKey(selectedDate)
      const visits = (formData.doctors || []).map((doctor_name, i) => ({
        doctor_name,
        visit_order: i + 1,
      }))
      const body: Record<string, unknown> = {
        plan_date: planDate,
        type_of_tour: TYPE_TO_BACKEND[formData.typeOfTour] || 'field_work',
        station: formData.station || undefined,
        start_time: formData.startTime ? `${formData.startTime}:00` : undefined,
        end_time: formData.endTime ? `${formData.endTime}:00` : undefined,
        visits,
      }
      const existing = selectedPlanDetail
      const res = existing
        ? await apiPatch(`/tour-plans/${existing.id}`, body)
        : await apiPost('/tour-plans', body)

      if ('queued' in res) {
        // Optimistic refresh — re-fetch when back online.
      }
      await loadPlans()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to save'
      // Surface 409 (UNIQUE conflict) helpfully.
      setError(msg.includes('already') ? 'A tour plan already exists for this date.' : msg)
    } finally {
      handleModalClose()
    }
  }

  const handleRemoveDoctor = async (date: Date, doctorName: string) => {
    const existing = findPlan(date)
    if (!existing) return
    try {
      const res = await apiGet(`/tour-plans/${existing.id}`)
      const detail = res.data as BackendPlan
      const visits = (detail.visits || [])
        .filter(v => (v.doctor_name || '') !== doctorName)
        .map((v, i) => ({ doctor_name: v.doctor_name || '', visit_order: i + 1, notes: v.notes || undefined }))
      await apiPatch(`/tour-plans/${existing.id}`, { visits })
      await loadPlans()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update plan')
    }
  }

  const handleSubmitTourPlans = async () => {
    setSubmitting(true)
    setError(null)
    try {
      const currentYear = currentMonth.getFullYear()
      const currentMonthIndex = currentMonth.getMonth()
      const monthDrafts = plans.filter(p => {
        const d = new Date(p.plan_date)
        return p.status === 'draft' && d.getFullYear() === currentYear && d.getMonth() === currentMonthIndex
      })

      if (monthDrafts.length === 0) {
        setError('No draft tour plans to submit for this month.')
        return
      }

      // Submit each draft sequentially. Server transitions draft → submitted.
      for (const plan of monthDrafts) {
        try {
          await apiPost(`/tour-plans/${plan.id}/submit`, {})
        } catch (innerErr) {
          console.warn(`Failed to submit plan ${plan.id}:`, innerErr)
        }
      }
      await loadPlans()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit plans')
    } finally {
      setSubmitting(false)
    }
  }

  const getWeekDates = (date: Date) => {
    const week: Date[] = []
    const startOfWeek = new Date(date)
    const day = startOfWeek.getDay()
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1) // Monday-start
    startOfWeek.setDate(diff)
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(startOfWeek)
      currentDate.setDate(startOfWeek.getDate() + i)
      week.push(currentDate)
    }
    return week
  }

  const goToPreviousWeek = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), currentMonth.getDate() - 7))
  const goToNextWeek = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), currentMonth.getDate() + 7))

  // Doctor names for a given date — comes from the in-memory list; if we need
  // visit detail (e.g. during modal open) we fetch detail at click-time.
  const getDoctorsForDate = (date: Date): string[] => {
    const plan = findPlan(date)
    if (!plan || plan.type_of_tour !== 'field_work') return []
    if (plan.visits) return plan.visits.map(v => v.doctor_name || '').filter(Boolean)
    return []
  }

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()
    const days: (Date | null)[] = []
    for (let i = 0; i < startingDayOfWeek; i++) days.push(null)
    for (let day = 1; day <= daysInMonth; day++) days.push(new Date(year, month, day))
    return days
  }

  const goToPreviousMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
  const goToNextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
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

        {error && <div style={{ background: '#fef2f2', color: '#b91c1c', padding: 10, borderRadius: 6, margin: '8px 0' }}>{error}</div>}
        {loading && <div style={{ color: '#64748b', padding: 8 }}>Loading…</div>}

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
                const dKey = dateKey(date)
                const doctors = getDoctorsForDate(date)
                const plan = findPlan(date)
                const dayName = dayNamesShort[dayIndex]

                return (
                  <div key={dKey} className="weekly-day-column">
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
                      {plan && (
                        <div style={{ fontSize: 10, color: '#64748b', marginTop: 4 }}>
                          {plan.status}
                        </div>
                      )}
                    </div>
                    <div className="weekly-day-content">
                      {doctors.length > 0 ? (
                        <div className="doctors-list-full">
                          {doctors.map((doctor, idx) => (
                            <div key={`${dKey}-${idx}-${doctor}`} className="doctor-entry-full">
                              <span className="doctor-name-full">{doctor}</span>
                              {plan?.status === 'draft' && (
                                <button
                                  className="remove-doctor-btn-full"
                                  onClick={() => handleRemoveDoctor(date, doctor)}
                                  aria-label={`Remove ${doctor}`}
                                >
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                  </svg>
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="empty-day-message">No doctors assigned</div>
                      )}
                      <button
                        className="add-tour-plan-btn"
                        onClick={() => handleDateClick(date)}
                        aria-label={`Add tour plan for ${dKey}`}
                      >
                        {plan ? 'Edit Plan' : '+ Add Plan'}
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
              const dKey = dateKey(date)
              const plan = findPlan(date)
              const doctors = getDoctorsForDate(date)
              const hasTourPlan = !!plan

              return (
                <button
                  key={dKey}
                  className={`calendar-day ${isToday ? 'today' : ''} ${hasTourPlan ? 'has-tour-plan' : ''}`}
                  onClick={() => handleDateClick(date)}
                >
                  <span className="day-number">{date.getDate()}</span>
                  {hasTourPlan && doctors.length > 0 && (
                    <div className="tour-plan-doctors">
                      {doctors.slice(0, 2).map((doctor, idx) => {
                        const lastName = doctor.split(' ').slice(-1)[0] || doctor
                        return (
                          <span key={`${dKey}-${idx}-${doctor}`} className="doctor-badge" title={doctor}>
                            {lastName}
                          </span>
                        )
                      })}
                      {doctors.length > 2 && (
                        <span className="doctor-badge more" title={doctors.slice(2).join(', ')}>
                          +{doctors.length - 2}
                        </span>
                      )}
                    </div>
                  )}
                  {hasTourPlan && doctors.length === 0 && plan && (
                    <span className="doctor-badge" style={{ fontSize: 10 }}>{plan.type_of_tour}</span>
                  )}
                </button>
              )
            })}
          </div>
          </div>
        )}

        <div className="tour-plans-footer">
          <button className="submit-tour-plans-btn" onClick={handleSubmitTourPlans} disabled={submitting}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>{submitting ? 'Submitting…' : 'Submit Plan'}</span>
          </button>
        </div>

        {isModalOpen && selectedDate && (
          <TourPlanModal
            date={selectedDate}
            existingData={selectedPlanDetail ? planToFormData(selectedPlanDetail) : undefined}
            onClose={handleModalClose}
            onSave={handleModalSave}
          />
        )}
      </main>
    </div>
  )
}

export default TourPlans
