import { useState, useEffect, useCallback } from 'react'
import Header from './Header'
import Sidebar from './Sidebar'
import ApplyLeaveModal from './ApplyLeaveModal'
import type { LeaveFormData } from './ApplyLeaveModal'
import { apiGet, apiPost } from '../services/apiService'
import './Leaves.css'

interface BackendLeave {
  id: number
  user_id: string
  leave_type: string
  from_date: string  // YYYY-MM-DD
  to_date: string
  from_session: 'full' | 'session_1' | 'session_2'
  to_session: 'full' | 'session_1' | 'session_2'
  total_days: string  // numeric
  reason: string | null
  status: 'pending' | 'approved' | 'rejected' | 'cancelled'
  review_notes: string | null
}

interface LeaveBalance {
  user_id: string
  year: number
  leave_type: string
  allocated_days: string
  used_days: string
  remaining_days: string
}

interface CalendarLeave {
  date: string
  type: 'leave' | 'holiday' | 'present' | 'absent'
  status: BackendLeave['status']
  leaveType: string
  badge: string
}

interface LeavesProps {
  onLogout: () => void
  onBack: () => void
  userName?: string
  onNavigate?: (page: string) => void
}

const STATUS_BADGE: Record<BackendLeave['status'], string> = {
  pending: 'P',
  approved: 'L',
  rejected: 'X',
  cancelled: '-',
}

const LEAVE_TYPE_LABEL: Record<string, string> = {
  earned_leave: 'Earned Leave',
  loss_of_pay: 'Loss of Pay',
  comp_off: 'Comp-off',
  sabbatical_leave: 'Sabbatical Leave',
  sick_leave: 'Sick Leave',
  casual_leave: 'Casual Leave',
  maternity_leave: 'Maternity Leave',
  paternity_leave: 'Paternity Leave',
}

function leaveTypeToEnum(label: string): string {
  return label.toLowerCase().replace(/-/g, '_').replace(/\s+/g, '_')
}

function sessionToEnum(label: string): 'full' | 'session_1' | 'session_2' {
  if (label === 'Session 1') return 'session_1'
  if (label === 'Session 2') return 'session_2'
  return 'full'
}

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

function dateString(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function Leaves({ onLogout, onBack, userName, onNavigate }: LeavesProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth())
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
  const [viewMode, setViewMode] = useState<'month' | 'year'>('month')
  const [leaves, setLeaves] = useState<BackendLeave[]>([])
  const [balances, setBalances] = useState<LeaveBalance[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadLeaves = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      // Year-spanning fetch covers any month the user navigates within the calendar.
      const fromDate = `${currentYear}-01-01`
      const toDate = `${currentYear}-12-31`
      const [leavesRes, balancesRes] = await Promise.all([
        apiGet(`/leaves?from_date=${fromDate}&to_date=${toDate}`),
        apiGet(`/leaves/balances?year=${currentYear}`).catch(() => ({ data: { balances: [] } })),
      ])
      setLeaves(leavesRes.data || [])
      setBalances(balancesRes.data?.balances || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load leaves')
    } finally {
      setLoading(false)
    }
  }, [currentYear])

  useEffect(() => { loadLeaves() }, [loadLeaves])

  const handleMenuClick = () => setSidebarOpen(true)
  const handleSidebarClose = () => setSidebarOpen(false)
  const handleApplyLeave = () => setIsModalOpen(true)
  const handleModalClose = () => { setIsModalOpen(false); setSelectedDate('') }

  const handleLeaveSubmit = async (formData: LeaveFormData) => {
    setSubmitting(true)
    setError(null)
    try {
      const res = await apiPost('/leaves', {
        leave_type: leaveTypeToEnum(formData.leaveType),
        from_date: formData.fromDate,
        to_date: formData.toDate,
        from_session: sessionToEnum(formData.fromSession),
        to_session: sessionToEnum(formData.toSession),
        reason: formData.reason,
        contact_details: formData.contactDetails || undefined,
      })
      handleModalClose()
      if ('queued' in res) {
        // Optimistic insert; will sync on reconnect
        setLeaves(prev => [
          ...prev,
          {
            id: -Date.now(),
            user_id: '',
            leave_type: leaveTypeToEnum(formData.leaveType),
            from_date: formData.fromDate,
            to_date: formData.toDate,
            from_session: sessionToEnum(formData.fromSession),
            to_session: sessionToEnum(formData.toSession),
            total_days: '0',
            reason: formData.reason,
            status: 'pending',
            review_notes: null,
          } as BackendLeave,
        ])
      } else {
        await loadLeaves()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to apply for leave')
    } finally {
      setSubmitting(false)
    }
  }

  // Build a lookup map: ISO date → CalendarLeave entry, expanding multi-day leaves.
  const calendarLeaves: Record<string, CalendarLeave> = {}
  for (const lv of leaves) {
    if (lv.status === 'cancelled' || lv.status === 'rejected') continue
    const start = new Date(lv.from_date + 'T00:00:00')
    const end = new Date(lv.to_date + 'T00:00:00')
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const key = dateString(d)
      calendarLeaves[key] = {
        date: key,
        type: 'leave',
        status: lv.status,
        leaveType: LEAVE_TYPE_LABEL[lv.leave_type] || lv.leave_type,
        badge: STATUS_BADGE[lv.status] || 'L',
      }
    }
  }

  const getDaysInMonth = (year: number, month: number) => {
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()
    const days: (Date | null)[] = []
    for (let i = 0; i < startingDayOfWeek; i++) days.push(null)
    for (let day = 1; day <= daysInMonth; day++) days.push(new Date(year, month, day))
    return days
  }

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
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

        {error && <div style={{ background: '#fef2f2', color: '#b91c1c', padding: 10, borderRadius: 6, margin: '8px 0' }}>{error}</div>}

        {balances.length > 0 && (
          <div className="legends-section" style={{ marginBottom: 12 }}>
            <div className="legends-header">My Leave Balance ({currentYear})</div>
            <div className="legends-content" style={{ flexWrap: 'wrap', gap: 12 }}>
              {balances.map(bal => (
                <div key={bal.leave_type} className="legend-item" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 11, color: '#64748b' }}>{LEAVE_TYPE_LABEL[bal.leave_type] || bal.leave_type}</span>
                  <span style={{ fontSize: 14, fontWeight: 600 }}>
                    {parseFloat(bal.remaining_days).toFixed(1)} / {parseFloat(bal.allocated_days).toFixed(0)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="legends-section">
          <div className="legends-header">Legends</div>
          <div className="legends-content">
            <div className="legend-item">
              <span className="legend-badge present">P</span>
              <span className="legend-label">Pending</span>
            </div>
            <div className="legend-item">
              <span className="legend-badge leave">L</span>
              <span className="legend-label">Approved Leave</span>
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
            {calendarLeaves[selectedDate] && (
              <span style={{ marginLeft: 12, color: '#64748b' }}>
                · {calendarLeaves[selectedDate].leaveType} ({calendarLeaves[selectedDate].status})
              </span>
            )}
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

          {loading ? (
            <div style={{ padding: 24, textAlign: 'center', color: '#64748b' }}>Loading…</div>
          ) : (
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
                const dateStr = dateString(date)
                const leaveStatus = calendarLeaves[dateStr]
                const isHoliday = date.getDay() === 0 // Sunday

                return (
                  <button
                    key={dateStr}
                    className={`calendar-day ${isToday ? 'today' : ''} ${
                      leaveStatus ? leaveStatus.type : isHoliday ? 'holiday' : ''
                    }`}
                    onClick={() => setSelectedDate(dateStr)}
                  >
                    <span className="day-number">{date.getDate()}</span>
                    {leaveStatus && (
                      <span className="status-badge">{leaveStatus.badge}</span>
                    )}
                    {isHoliday && !leaveStatus && (
                      <span className="status-badge">Off</span>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {isModalOpen && (
          <ApplyLeaveModal
            onClose={handleModalClose}
            onSubmit={handleLeaveSubmit}
          />
        )}
        {submitting && (
          <div style={{ position: 'fixed', bottom: 24, right: 24, background: '#1e293b', color: 'white', padding: '8px 16px', borderRadius: 6, fontSize: 13 }}>Submitting…</div>
        )}
      </main>
    </div>
  )
}

export default Leaves
