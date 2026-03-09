import { useState } from 'react'
import ApplyLeaveModal from './ApplyLeaveModal'
import {
  PAGE_CONTENT,
  BACK_BUTTON,
  PAGE_TITLE,
  BTN_PRIMARY,
  CARD,
  CARD_PADDING,
  CARD_SM_PADDING,
  SELECT,
} from '../styles/designSystem'

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

function Leaves({ onLogout: _onLogout, onBack, userName: _userName, onNavigate: _onNavigate }: LeavesProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth())
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
  const [viewMode, setViewMode] = useState<'month' | 'year'>('month')
  const [leaves, setLeaves] = useState<Leave[]>([])

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
    <div className={PAGE_CONTENT}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button className={BACK_BUTTON} onClick={onBack} aria-label="Go back">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <h1 className={PAGE_TITLE}>Apply for Leave</h1>
        </div>
        <button className={BTN_PRIMARY} onClick={handleApplyLeave}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span>Apply Leave</span>
        </button>
      </div>

      <div className={`${CARD} ${CARD_SM_PADDING} mb-4`}>
        <div className="text-sm font-medium text-slate-700 mb-2">Legends</div>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2 text-sm">
            <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span>
            <span className="text-xs text-slate-600">Present</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="w-3 h-3 rounded-full bg-red-500 inline-block"></span>
            <span className="text-xs text-slate-600">Absent</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="w-3 h-3 rounded-full bg-amber-500 inline-block"></span>
            <span className="text-xs text-slate-600">Leave</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="w-3 h-3 rounded-full bg-slate-400 inline-block"></span>
            <span className="text-xs text-slate-600">Off</span>
          </div>
        </div>
      </div>

      {selectedDate && (
        <div className="text-sm text-slate-600 mb-4">
          You selected date: {selectedDate}
        </div>
      )}

      <div className={`${CARD} ${CARD_PADDING}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <select
              className={`${SELECT} w-auto`}
              value={currentYear}
              onChange={(e) => setCurrentYear(Number(e.target.value))}
            >
              {years.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
            <select
              className={`${SELECT} w-auto`}
              value={currentMonth}
              onChange={(e) => setCurrentMonth(Number(e.target.value))}
            >
              {monthNames.map((month, index) => (
                <option key={index} value={index}>{month}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
            <button
              className={`px-3 py-1.5 text-sm font-medium rounded-md ${
                viewMode === 'month'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
              onClick={() => setViewMode('month')}
            >
              Month
            </button>
            <button
              className={`px-3 py-1.5 text-sm font-medium rounded-md ${
                viewMode === 'year'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
              onClick={() => setViewMode('year')}
            >
              Year
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-px bg-slate-200 rounded-xl overflow-hidden">
          {dayNames.map((day) => (
            <div key={day} className="bg-slate-50 text-center py-2 text-xs font-medium text-slate-500 uppercase">
              {day}
            </div>
          ))}
          {days.map((date, index) => {
            if (date === null) {
              return <div key={`empty-${index}`} className="bg-white p-2 min-h-[60px]"></div>
            }

            const isToday = date.toDateString() === new Date().toDateString()
            const dateString = formatDate(date)
            const leaveStatus = getLeaveStatus(date)
            const isHoliday = date.getDay() === 0 // Sunday as holiday example

            return (
              <button
                key={dateString}
                className={`bg-white p-2 min-h-[60px] text-center ${isToday ? 'bg-indigo-50' : ''} ${
                  leaveStatus?.type === 'leave' ? 'bg-amber-50' :
                  leaveStatus?.type === 'absent' ? 'bg-red-50' :
                  leaveStatus?.type === 'present' ? 'bg-emerald-50' :
                  isHoliday ? 'bg-slate-50' : ''
                }`}
                onClick={() => setSelectedDate(dateString)}
              >
                <span className="text-sm text-slate-700">{date.getDate()}</span>
                {leaveStatus && (
                  <div className={`w-2 h-2 rounded-full mx-auto mt-1 ${
                    leaveStatus.type === 'leave' ? 'bg-amber-500' :
                    leaveStatus.type === 'absent' ? 'bg-red-500' : 'bg-emerald-500'
                  }`}></div>
                )}
                {isHoliday && !leaveStatus && (
                  <div className="w-2 h-2 rounded-full mx-auto mt-1 bg-slate-400"></div>
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
    </div>
  )
}

export default Leaves
