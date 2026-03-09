import { useState, useEffect, useRef } from 'react'
import DashboardReports from './DashboardReports'
import {
  PAGE_CONTENT, PAGE_TITLE, BACK_BUTTON,
  CARD, CARD_PADDING,
  SELECT, LABEL,
  TABLE, TABLE_HEAD, TABLE_TH, TABLE_TD, TABLE_ROW, TABLE_WRAPPER,
} from '../styles/designSystem'

interface ReportsProps {
  onLogout: () => void
  onBack: () => void
  userName?: string
  onNavigate?: (page: string) => void
}

function Reports({ onLogout: _onLogout, onBack, userName: _userName, onNavigate: _onNavigate }: ReportsProps) {
  const [expandedReports, setExpandedReports] = useState<Set<string>>(new Set())
  const [selectedReportType, setSelectedReportType] = useState('Dashboard')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const reportTypes = [
    'Dashboard',
    'Tour Plan Report',
    'Daily Call Report',
    'Joint Working Coverage',
    'Call Average',
  ]

  // Tour Plan Report Data - Monthly breakdown
  const tourPlanReportData = [
    { month: 'Jan', planned: 22, completed: 20, pending: 2, completionPercent: 90.9 },
    { month: 'Feb', planned: 20, completed: 19, pending: 1, completionPercent: 95.0 },
    { month: 'Mar', planned: 23, completed: 22, pending: 1, completionPercent: 95.7 },
    { month: 'Apr', planned: 21, completed: 21, pending: 0, completionPercent: 100.0 },
    { month: 'May', planned: 22, completed: 20, pending: 2, completionPercent: 90.9 },
    { month: 'Jun', planned: 20, completed: 20, pending: 0, completionPercent: 100.0 },
  ]

  // Daily Call Report Data
  const dailyCallReportData = [
    { customerName: 'Dr. Anil Doshi', visitDate: '20/01/2026', mrName: 'Rajesh Kumar', createdDate: '20/01/2026', brandDiscussed: 'Derise 10mg, Rilast Tablet, Bevaas 5mg', accompaniedBy: '-', samples: '-', promotionalInputs: '-', pob: '-' },
    { customerName: 'Dr. Navin Chaddha', visitDate: '20/01/2026', mrName: 'Rajesh Kumar', createdDate: '20/01/2026', brandDiscussed: 'Derise 20mg, Rilast Capsule, Bevaas 10mg', accompaniedBy: '-', samples: '-', promotionalInputs: '-', pob: '-' },
    { customerName: 'Dr. Surbhi Rel', visitDate: '20/01/2026', mrName: 'Rajesh Kumar', createdDate: '20/01/2026', brandDiscussed: 'Derise 50mg, Rilast Syrup, Bevaas 20mg', accompaniedBy: '-', samples: '-', promotionalInputs: '-', pob: '-' },
    { customerName: 'Dr. Naresh Patil', visitDate: '20/01/2026', mrName: 'Rajesh Kumar', createdDate: '20/01/2026', brandDiscussed: 'Derise 10mg, Rilast Tablet', accompaniedBy: '-', samples: '-', promotionalInputs: '-', pob: '-' },
  ]

  // Joint Working Coverage Report Data
  const jointWorkingCoverageData = [
    { doctorName: 'Dr. Anil Doshi', coverage: 85, totalVisits: 34, completedVisits: 29, pendingVisits: 5 },
    { doctorName: 'Dr. Navin Chaddha', coverage: 92, totalVisits: 25, completedVisits: 23, pendingVisits: 2 },
    { doctorName: 'Dr. Surbhi Rel', coverage: 78, totalVisits: 28, completedVisits: 22, pendingVisits: 6 },
    { doctorName: 'Dr. Naresh Patil', coverage: 88, totalVisits: 32, completedVisits: 28, pendingVisits: 4 },
    { doctorName: 'Dr. Surekha Rane', coverage: 90, totalVisits: 30, completedVisits: 27, pendingVisits: 3 },
  ]

  // Call Average Report Data
  const callAverageReportData = [
    { employeeName: 'Rajesh Kumar', startDate: '2025-12-31', endDate: '2026-01-30', fieldWorkingDays: 13, totalCustomers: 149, totalRetailers: 0, totalCalls: 149, doctorTargetCalls: 290, pharmacyTargetCalls: 18, callAverage: 11.46 },
  ]

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isDropdownOpen])

  // Dummy data for reports
  const callAverageData = [
    { month: 'Jan', calls: 85 },
    { month: 'Feb', calls: 92 },
    { month: 'Mar', calls: 78 },
    { month: 'Apr', calls: 95 },
    { month: 'May', calls: 88 },
    { month: 'Jun', calls: 90 },
  ]

  const pobData = {
    actual: 1250000,
    achieved: 1420000,
    target: 1500000,
  }

  const budgetData = [
    { category: 'Travel', budget: 50000, actual: 48500 },
    { category: 'Samples', budget: 30000, actual: 32000 },
    { category: 'Marketing', budget: 40000, actual: 38500 },
    { category: 'Training', budget: 20000, actual: 19500 },
  ]

  const tourPlanData = [
    { month: 'Jan', planned: 22, completed: 20 },
    { month: 'Feb', planned: 20, completed: 19 },
    { month: 'Mar', planned: 23, completed: 22 },
    { month: 'Apr', planned: 21, completed: 21 },
    { month: 'May', planned: 22, completed: 20 },
    { month: 'Jun', planned: 20, completed: 20 },
  ]

  const dailyCallData = [
    { day: 'Mon', calls: 18 },
    { day: 'Tue', calls: 22 },
    { day: 'Wed', calls: 20 },
    { day: 'Thu', calls: 19 },
    { day: 'Fri', calls: 21 },
    { day: 'Sat', calls: 15 },
    { day: 'Sun', calls: 8 },
  ]

  const jointWorkingData = [
    { doctor: 'Dr. Anil Doshi', coverage: 85 },
    { doctor: 'Dr. Navin Chaddha', coverage: 92 },
    { doctor: 'Dr. Surbhi Rel', coverage: 78 },
    { doctor: 'Dr. Naresh Patil', coverage: 88 },
    { doctor: 'Dr. Surekha Rane', coverage: 90 },
  ]

  const attendanceData = [
    { month: 'Jan', present: 22, absent: 1, leave: 2 },
    { month: 'Feb', present: 20, absent: 0, leave: 1 },
    { month: 'Mar', present: 23, absent: 1, leave: 1 },
    { month: 'Apr', present: 22, absent: 0, leave: 2 },
    { month: 'May', present: 21, absent: 1, leave: 3 },
    { month: 'Jun', present: 22, absent: 0, leave: 1 },
  ]

  const campaignData = [
    { campaign: 'Cardio Awareness', reach: 450, engagement: 320 },
    { campaign: 'Diabetes Care', reach: 380, engagement: 285 },
    { campaign: 'Pediatric Health', reach: 420, engagement: 310 },
    { campaign: 'Women Wellness', reach: 390, engagement: 275 },
  ]

  const reports = [
    {
      id: 'call-average',
      title: 'Call Average',
      type: 'bar',
      count: callAverageData.reduce((sum, item) => sum + item.calls, 0),
      subtitle: 'Total Calls'
    },
    {
      id: 'pob',
      title: 'POB (Actual vs Achieved)',
      type: 'comparison',
      count: pobData.achieved,
      subtitle: 'Achieved Amount'
    },
    {
      id: 'budget',
      title: 'Budget vs Actual',
      type: 'bar',
      count: budgetData.length,
      subtitle: 'Categories'
    },
    {
      id: 'tour-plan',
      title: 'Tour Plan Report',
      type: 'line',
      count: tourPlanData.reduce((sum, item) => sum + item.completed, 0),
      subtitle: 'Completed Tours'
    },
    {
      id: 'daily-call',
      title: 'Daily Call Report',
      type: 'bar',
      count: dailyCallData.reduce((sum, item) => sum + item.calls, 0),
      subtitle: 'Weekly Total'
    },
    {
      id: 'joint-working',
      title: 'Joint Working Coverage',
      type: 'pie',
      count: jointWorkingData.length,
      subtitle: 'Doctors'
    },
    {
      id: 'attendance',
      title: 'Attendance Report',
      type: 'table',
      count: attendanceData.reduce((sum, item) => sum + item.present, 0),
      subtitle: 'Total Present Days'
    },
    {
      id: 'campaign',
      title: 'Campaign Report',
      type: 'bar',
      count: campaignData.length,
      subtitle: 'Active Campaigns'
    },
  ]

  const renderReport = (reportId: string) => {
    switch (reportId) {
      case 'call-average':
        const maxCallAverage = Math.max(...callAverageData.map(d => d.calls))
        return (
          <div>
            <h3 className="text-sm font-semibold text-slate-900 mb-4">Monthly Call Average</h3>
            <div className="space-y-3">
              {callAverageData.map((item, index) => (
                <div key={index} className="flex items-center gap-3">
                  <span className="text-xs text-slate-500 w-10 shrink-0">{item.month}</span>
                  <div className="flex-1 bg-slate-100 rounded-full h-6 overflow-hidden">
                    <div
                      className="bg-indigo-500 h-full rounded-full flex items-center justify-end pr-2 text-xs text-white font-medium transition-all"
                      style={{ width: `${(item.calls / maxCallAverage) * 100}%` }}
                    >
                      <span>{item.calls}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-100">
              <div>
                <span className="text-xs text-slate-500">Average:</span>
                <span className="text-sm font-semibold text-slate-900 ml-1">
                  {Math.round(callAverageData.reduce((sum, item) => sum + item.calls, 0) / callAverageData.length)} calls/month
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-500">Total:</span>
                <span className="text-sm font-semibold text-slate-900 ml-1">
                  {callAverageData.reduce((sum, item) => sum + item.calls, 0)} calls
                </span>
              </div>
            </div>
          </div>
        )

      case 'pob':
        const pobPercentage = (pobData.achieved / pobData.target) * 100
        return (
          <div>
            <h3 className="text-sm font-semibold text-slate-900 mb-4">POB Performance</h3>
            <div className="space-y-3">
              <div>
                <div className="text-xs text-slate-500 mb-1">Target</div>
                <div className="flex-1 bg-slate-100 rounded-full h-6 overflow-hidden">
                  <div className="bg-slate-300 h-full rounded-full flex items-center justify-end pr-2 text-xs text-white font-medium transition-all" style={{ width: '100%' }}>
                    <span>₹{pobData.target.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-1">Achieved</div>
                <div className="flex-1 bg-slate-100 rounded-full h-6 overflow-hidden">
                  <div className="bg-indigo-500 h-full rounded-full flex items-center justify-end pr-2 text-xs text-white font-medium transition-all" style={{ width: `${pobPercentage}%` }}>
                    <span>₹{pobData.achieved.toLocaleString('en-IN')} ({pobPercentage.toFixed(1)}%)</span>
                  </div>
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-1">Actual</div>
                <div className="flex-1 bg-slate-100 rounded-full h-6 overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full flex items-center justify-end pr-2 text-xs text-white font-medium transition-all" style={{ width: `${(pobData.actual / pobData.target) * 100}%` }}>
                    <span>₹{pobData.actual.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-100">
              <div>
                <span className="text-xs text-slate-500">Achievement Rate:</span>
                <span className="text-sm font-semibold text-slate-900 ml-1">{pobPercentage.toFixed(1)}%</span>
              </div>
            </div>
          </div>
        )

      case 'budget':
        const maxBudget = Math.max(...budgetData.map(d => Math.max(d.budget, d.actual)))
        return (
          <div>
            <h3 className="text-sm font-semibold text-slate-900 mb-4">Budget vs Actual Spending</h3>
            <div className="space-y-4">
              {budgetData.map((item, index) => {
                const budgetPercent = (item.actual / item.budget) * 100
                return (
                  <div key={index} className="space-y-2">
                    <div className="text-sm font-medium text-slate-700">{item.category}</div>
                    <div>
                      <div className="flex-1 bg-slate-100 rounded-full h-6 overflow-hidden mb-1">
                        <div className="bg-slate-300 h-full rounded-full flex items-center justify-end pr-2 text-xs text-white font-medium transition-all" style={{ width: `${(item.budget / maxBudget) * 100}%` }}>
                          <span>Budget: ₹{item.budget.toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                      <div className="flex-1 bg-slate-100 rounded-full h-6 overflow-hidden">
                        <div
                          className="bg-indigo-500 h-full rounded-full flex items-center justify-end pr-2 text-xs text-white font-medium transition-all"
                          style={{ width: `${(item.actual / maxBudget) * 100}%` }}
                        >
                          <span>Actual: ₹{item.actual.toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      {budgetPercent > 100 ? (
                        <span className="text-xs text-red-500">+{(budgetPercent - 100).toFixed(1)}% over budget</span>
                      ) : (
                        <span className="text-xs text-emerald-500">{(100 - budgetPercent).toFixed(1)}% remaining</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-100">
              <div>
                <span className="text-xs text-slate-500">Total Budget:</span>
                <span className="text-sm font-semibold text-slate-900 ml-1">
                  ₹{budgetData.reduce((sum, item) => sum + item.budget, 0).toLocaleString('en-IN')}
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-500">Total Spent:</span>
                <span className="text-sm font-semibold text-slate-900 ml-1">
                  ₹{budgetData.reduce((sum, item) => sum + item.actual, 0).toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>
        )

      case 'tour-plan':
        const maxTourValue = Math.max(...tourPlanData.map(d => Math.max(d.planned, d.completed)))
        return (
          <div>
            <h3 className="text-sm font-semibold text-slate-900 mb-4">Tour Plan Completion</h3>
            <div className="my-4">
              <svg className="w-full" viewBox="0 0 600 300">
                {/* Grid lines */}
                {[0, 1, 2, 3, 4, 5].map(i => (
                  <line
                    key={i}
                    x1="50"
                    y1={50 + i * 50}
                    x2="550"
                    y2={50 + i * 50}
                    stroke="#e2e8f0"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                  />
                ))}
                {/* Planned line */}
                <polyline
                  points={tourPlanData.map((item, index) =>
                    `${50 + (index * 100)},${250 - (item.planned / maxTourValue) * 200}`
                  ).join(' ')}
                  fill="none"
                  stroke="#4F46E5"
                  strokeWidth="3"
                />
                {/* Completed line */}
                <polyline
                  points={tourPlanData.map((item, index) =>
                    `${50 + (index * 100)},${250 - (item.completed / maxTourValue) * 200}`
                  ).join(' ')}
                  fill="none"
                  stroke="#6ee7b7"
                  strokeWidth="3"
                />
                {/* Planned points */}
                {tourPlanData.map((item, index) => (
                  <g key={`planned-${index}`}>
                    <circle
                      cx={50 + index * 100}
                      cy={250 - (item.planned / maxTourValue) * 200}
                      r="6"
                      fill="#4F46E5"
                      stroke="#ffffff"
                      strokeWidth="2"
                    />
                    <text
                      x={50 + index * 100}
                      y={250 - (item.planned / maxTourValue) * 200 - 15}
                      textAnchor="middle"
                      fontSize="12"
                      fontWeight="600"
                      fill="#0f172a"
                    >
                      {item.planned}
                    </text>
                  </g>
                ))}
                {/* Completed points */}
                {tourPlanData.map((item, index) => (
                  <g key={`completed-${index}`}>
                    <circle
                      cx={50 + index * 100}
                      cy={250 - (item.completed / maxTourValue) * 200}
                      r="6"
                      fill="#6ee7b7"
                      stroke="#ffffff"
                      strokeWidth="2"
                    />
                    <text
                      x={50 + index * 100}
                      y={250 - (item.completed / maxTourValue) * 200 - 15}
                      textAnchor="middle"
                      fontSize="12"
                      fontWeight="600"
                      fill="#0f172a"
                    >
                      {item.completed}
                    </text>
                  </g>
                ))}
                {/* Month labels */}
                {tourPlanData.map((item, index) => (
                  <text
                    key={`label-${index}`}
                    x={50 + index * 100}
                    y={280}
                    textAnchor="middle"
                    fontSize="12"
                    fontWeight="600"
                    fill="#64748b"
                  >
                    {item.month}
                  </text>
                ))}
              </svg>
            </div>
            <div className="flex items-center gap-6 justify-center mt-4">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <span className="w-3 h-3 rounded-full bg-indigo-500"></span>
                <span>Planned</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <span className="w-3 h-3 rounded-full bg-emerald-400"></span>
                <span>Completed</span>
              </div>
            </div>
          </div>
        )

      case 'daily-call':
        const maxDailyCall = Math.max(...dailyCallData.map(d => d.calls))
        return (
          <div>
            <h3 className="text-sm font-semibold text-slate-900 mb-4">Weekly Daily Call Report</h3>
            <div className="space-y-3">
              {dailyCallData.map((item, index) => (
                <div key={index} className="flex items-center gap-3">
                  <span className="text-xs text-slate-500 w-10 shrink-0">{item.day}</span>
                  <div className="flex-1 bg-slate-100 rounded-full h-6 overflow-hidden">
                    <div
                      className="bg-indigo-500 h-full rounded-full flex items-center justify-end pr-2 text-xs text-white font-medium transition-all"
                      style={{ width: `${(item.calls / maxDailyCall) * 100}%` }}
                    >
                      <span>{item.calls}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-100">
              <div>
                <span className="text-xs text-slate-500">Total Calls:</span>
                <span className="text-sm font-semibold text-slate-900 ml-1">
                  {dailyCallData.reduce((sum, item) => sum + item.calls, 0)} calls/week
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-500">Daily Average:</span>
                <span className="text-sm font-semibold text-slate-900 ml-1">
                  {Math.round(dailyCallData.reduce((sum, item) => sum + item.calls, 0) / dailyCallData.length)} calls/day
                </span>
              </div>
            </div>
          </div>
        )

      case 'joint-working':
        const colors: string[] = ['#818CF8', '#6366F1', '#4F46E5', '#4338CA', '#3730A3']
        // Calculate total coverage to normalize percentages
        const totalCoverage = jointWorkingData.reduce((sum, item) => sum + item.coverage, 0)
        // Normalize each doctor's coverage to be a percentage of the total
        const normalizedData = jointWorkingData.map(item => ({
          ...item,
          normalizedPercentage: (item.coverage / totalCoverage) * 100
        }))
        return (
          <div>
            <h3 className="text-sm font-semibold text-slate-900 mb-4">Joint Working Coverage by Doctor</h3>
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="flex-shrink-0">
                <svg className="w-[200px] h-[200px]" viewBox="0 0 200 200">
                  {normalizedData.map((item, index) => {
                    const percentage = item.normalizedPercentage
                    const startAngle = normalizedData.slice(0, index).reduce((sum, d) => sum + (d.normalizedPercentage / 100) * 360, 0)
                    const endAngle = startAngle + (percentage / 100) * 360
                    const startAngleRad = (startAngle - 90) * (Math.PI / 180)
                    const endAngleRad = (endAngle - 90) * (Math.PI / 180)
                    const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0
                    const x1 = 100 + 80 * Math.cos(startAngleRad)
                    const y1 = 100 + 80 * Math.sin(startAngleRad)
                    const x2 = 100 + 80 * Math.cos(endAngleRad)
                    const y2 = 100 + 80 * Math.sin(endAngleRad)
                    return (
                      <path
                        key={index}
                        d={`M 100 100 L ${x1} ${y1} A 80 80 0 ${largeArcFlag} 1 ${x2} ${y2} Z`}
                        fill={colors[index % colors.length]}
                        stroke="#ffffff"
                        strokeWidth="2"
                      />
                    )
                  })}
                </svg>
              </div>
              <div className="space-y-2">
                {normalizedData.map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: colors[index % colors.length] }}></span>
                    <div>
                      <span className="text-sm font-medium text-slate-700">{item.doctor}</span>
                      <span className="text-xs text-slate-500 ml-1">{item.coverage}% ({item.normalizedPercentage.toFixed(1)}% share)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )

      case 'attendance':
        return (
          <div>
            <h3 className="text-sm font-semibold text-slate-900 mb-4">Monthly Attendance Report</h3>
            <div className={TABLE_WRAPPER}>
              <table className={TABLE}>
                <thead className={TABLE_HEAD}>
                  <tr>
                    <th className={TABLE_TH}>Month</th>
                    <th className={TABLE_TH}>Present</th>
                    <th className={TABLE_TH}>Absent</th>
                    <th className={TABLE_TH}>Leave</th>
                    <th className={TABLE_TH}>Total Days</th>
                    <th className={TABLE_TH}>Attendance %</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceData.map((item, index) => {
                    const total = item.present + item.absent + item.leave
                    const attendancePercent = (item.present / total) * 100
                    return (
                      <tr key={index} className={TABLE_ROW}>
                        <td className={TABLE_TD}>{item.month}</td>
                        <td className={`${TABLE_TD} text-emerald-600 font-medium`}>{item.present}</td>
                        <td className={`${TABLE_TD} text-red-500 font-medium`}>{item.absent}</td>
                        <td className={`${TABLE_TD} text-amber-500 font-medium`}>{item.leave}</td>
                        <td className={TABLE_TD}>{total}</td>
                        <td className={TABLE_TD}>
                          <div className="w-full bg-slate-100 rounded-full h-5 overflow-hidden">
                            <div
                              className="bg-indigo-500 h-full rounded-full flex items-center justify-center text-xs text-white font-medium"
                              style={{ width: `${attendancePercent}%` }}
                            >
                              {attendancePercent.toFixed(1)}%
                            </div>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )

      case 'campaign':
        const maxCampaignValue = Math.max(...campaignData.map(d => Math.max(d.reach, d.engagement)))
        return (
          <div>
            <h3 className="text-sm font-semibold text-slate-900 mb-4">Campaign Performance</h3>
            <div className="space-y-4">
              {campaignData.map((item, index) => (
                <div key={index} className="space-y-2">
                  <div className="text-sm font-medium text-slate-700">{item.campaign}</div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-slate-500 w-20 shrink-0">Reach</span>
                      <div className="flex-1 bg-slate-100 rounded-full h-6 overflow-hidden">
                        <div className="bg-indigo-500 h-full rounded-full flex items-center justify-end pr-2 text-xs text-white font-medium transition-all" style={{ width: `${(item.reach / maxCampaignValue) * 100}%` }}>
                          <span>{item.reach}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 w-20 shrink-0">Engagement</span>
                      <div className="flex-1 bg-slate-100 rounded-full h-6 overflow-hidden">
                        <div className="bg-emerald-400 h-full rounded-full flex items-center justify-end pr-2 text-xs text-white font-medium transition-all" style={{ width: `${(item.engagement / maxCampaignValue) * 100}%` }}>
                          <span>{item.engagement}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-100">
              <div>
                <span className="text-xs text-slate-500">Total Reach:</span>
                <span className="text-sm font-semibold text-slate-900 ml-1">
                  {campaignData.reduce((sum, item) => sum + item.reach, 0)} people
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-500">Total Engagement:</span>
                <span className="text-sm font-semibold text-slate-900 ml-1">
                  {campaignData.reduce((sum, item) => sum + item.engagement, 0)} interactions
                </span>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className={PAGE_CONTENT}>
      <div className="flex items-center gap-3 mb-6">
        <button className={BACK_BUTTON} onClick={onBack} aria-label="Go back">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <h1 className={PAGE_TITLE}>Reports</h1>
      </div>

      <div className="mb-6">
        <label className={LABEL}>Types of Reports</label>
        <div className="relative" ref={dropdownRef}>
          <button
            className={`${SELECT} flex items-center justify-between cursor-pointer`}
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            aria-label="Select report type"
          >
            <span>{selectedReportType}</span>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className={`transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
            >
              <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          {isDropdownOpen && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden">
              {reportTypes.map((type) => (
                <button
                  key={type}
                  className={`w-full px-4 py-2.5 text-sm text-slate-700 text-left hover:bg-slate-50 transition-colors cursor-pointer bg-transparent border-none ${selectedReportType === type ? 'bg-indigo-50 text-indigo-700 font-medium' : ''}`}
                  onClick={() => {
                    setSelectedReportType(type)
                    setIsDropdownOpen(false)
                  }}
                >
                  {type}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedReportType === 'Dashboard' ? (
        <DashboardReports />
      ) : selectedReportType === 'Tour Plan Report' ? (
        <div className={`${CARD} ${CARD_PADDING}`}>
          <h3 className="text-base font-semibold text-slate-900 mb-4">Tour Plan Report</h3>
          <div className={TABLE_WRAPPER}>
            <table className={TABLE}>
              <thead className={TABLE_HEAD}>
                <tr>
                  <th className={TABLE_TH}>Month</th>
                  <th className={TABLE_TH}>Planned</th>
                  <th className={TABLE_TH}>Completed</th>
                  <th className={TABLE_TH}>Pending</th>
                  <th className={TABLE_TH}>Completion %</th>
                </tr>
              </thead>
              <tbody>
                {tourPlanReportData.map((row, index) => (
                  <tr key={index} className={TABLE_ROW}>
                    <td className={TABLE_TD}>{row.month}</td>
                    <td className={TABLE_TD}>{row.planned}</td>
                    <td className={TABLE_TD}>{row.completed}</td>
                    <td className={TABLE_TD}>{row.pending}</td>
                    <td className={TABLE_TD}>{row.completionPercent.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : selectedReportType === 'Daily Call Report' ? (
        <div className={`${CARD} ${CARD_PADDING}`}>
          <h3 className="text-base font-semibold text-slate-900 mb-4">Daily Call Report</h3>
          <div className={TABLE_WRAPPER}>
            <table className={TABLE}>
              <thead className={TABLE_HEAD}>
                <tr>
                  <th className={TABLE_TH}>Customer Name</th>
                  <th className={TABLE_TH}>Visit Date</th>
                  <th className={TABLE_TH}>MR Name</th>
                  <th className={TABLE_TH}>Created Date</th>
                  <th className={TABLE_TH}>Brand Discussed</th>
                  <th className={TABLE_TH}>Accompanied By</th>
                  <th className={TABLE_TH}>Samples</th>
                  <th className={TABLE_TH}>Promotional Inputs</th>
                  <th className={TABLE_TH}>POB</th>
                </tr>
              </thead>
              <tbody>
                {dailyCallReportData.map((row, index) => (
                  <tr key={index} className={TABLE_ROW}>
                    <td className={TABLE_TD}>{row.customerName}</td>
                    <td className={TABLE_TD}>{row.visitDate}</td>
                    <td className={TABLE_TD}>{row.mrName}</td>
                    <td className={TABLE_TD}>{row.createdDate}</td>
                    <td className={TABLE_TD}>{row.brandDiscussed}</td>
                    <td className={TABLE_TD}>{row.accompaniedBy}</td>
                    <td className={TABLE_TD}>{row.samples}</td>
                    <td className={TABLE_TD}>{row.promotionalInputs}</td>
                    <td className={TABLE_TD}>{row.pob}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : selectedReportType === 'Joint Working Coverage' ? (
        <div className={`${CARD} ${CARD_PADDING}`}>
          <h3 className="text-base font-semibold text-slate-900 mb-4">Joint Working Coverage</h3>
          <div className={TABLE_WRAPPER}>
            <table className={TABLE}>
              <thead className={TABLE_HEAD}>
                <tr>
                  <th className={TABLE_TH}>Doctor Name</th>
                  <th className={TABLE_TH}>Coverage %</th>
                  <th className={TABLE_TH}>Total Visits</th>
                  <th className={TABLE_TH}>Completed Visits</th>
                  <th className={TABLE_TH}>Pending Visits</th>
                </tr>
              </thead>
              <tbody>
                {jointWorkingCoverageData.map((row, index) => (
                  <tr key={index} className={TABLE_ROW}>
                    <td className={TABLE_TD}>{row.doctorName}</td>
                    <td className={TABLE_TD}>{row.coverage}%</td>
                    <td className={TABLE_TD}>{row.totalVisits}</td>
                    <td className={TABLE_TD}>{row.completedVisits}</td>
                    <td className={TABLE_TD}>{row.pendingVisits}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : selectedReportType === 'Call Average' ? (
        <div className={`${CARD} ${CARD_PADDING}`}>
          <h3 className="text-base font-semibold text-slate-900 mb-4">Call Average</h3>
          <div className={TABLE_WRAPPER}>
            <table className={TABLE}>
              <thead className={TABLE_HEAD}>
                <tr>
                  <th className={TABLE_TH}>Employee Name</th>
                  <th className={TABLE_TH}>Start Date</th>
                  <th className={TABLE_TH}>End Date</th>
                  <th className={TABLE_TH}>No of Field Working Days</th>
                  <th className={TABLE_TH}>Total Customers</th>
                  <th className={TABLE_TH}>Total Retailers</th>
                  <th className={TABLE_TH}>Total Calls</th>
                  <th className={TABLE_TH}>Doctor Target Calls</th>
                  <th className={TABLE_TH}>Pharmacy Target Calls</th>
                  <th className={TABLE_TH}>Call Average</th>
                </tr>
              </thead>
              <tbody>
                {callAverageReportData.map((row, index) => (
                  <tr key={index} className={TABLE_ROW}>
                    <td className={TABLE_TD}>{row.employeeName}</td>
                    <td className={TABLE_TD}>{row.startDate}</td>
                    <td className={TABLE_TD}>{row.endDate}</td>
                    <td className={TABLE_TD}>{row.fieldWorkingDays}</td>
                    <td className={TABLE_TD}>{row.totalCustomers}</td>
                    <td className={TABLE_TD}>{row.totalRetailers}</td>
                    <td className={TABLE_TD}>{row.totalCalls}</td>
                    <td className={TABLE_TD}>{row.doctorTargetCalls}</td>
                    <td className={TABLE_TD}>{row.pharmacyTargetCalls}</td>
                    <td className={TABLE_TD}>{row.callAverage}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
      <div className="space-y-3">
        {reports.map((report) => {
          const isExpanded = expandedReports.has(report.id)
          return (
            <div
              key={report.id}
              className={`${CARD} overflow-hidden`}
            >
              <div
                className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-slate-50 transition-colors"
                onClick={() => {
                  const newExpanded = new Set(expandedReports)
                  if (isExpanded) {
                    newExpanded.delete(report.id)
                  } else {
                    newExpanded.add(report.id)
                  }
                  setExpandedReports(newExpanded)
                }}
              >
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">{report.title}</h3>
                  <div>
                    <span className="text-lg font-bold text-indigo-600">{report.count.toLocaleString('en-IN')}</span>
                    <span className="text-xs text-slate-500 ml-1">{report.subtitle}</span>
                  </div>
                </div>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className={`transition-transform text-slate-400 ${isExpanded ? 'rotate-180' : ''}`}
                >
                  <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              {isExpanded && (
                <div className="px-5 pb-5 border-t border-slate-100 pt-4">
                  {renderReport(report.id)}
                </div>
              )}
            </div>
          )
        })}
      </div>
      )}
    </div>
  )
}

export default Reports
