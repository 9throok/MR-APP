import { useState, useEffect, useRef } from 'react'
import Header from './Header'
import Sidebar from './Sidebar'
import './Reports.css'

interface ReportsProps {
  onLogout: () => void
  onBack: () => void
  userName?: string
  onNavigate?: (page: string) => void
}

function Reports({ onLogout, onBack, userName, onNavigate }: ReportsProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [expandedReports, setExpandedReports] = useState<Set<string>>(new Set())
  const [selectedReportType, setSelectedReportType] = useState('Tour Plan Report')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const reportTypes = [
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

  const handleMenuClick = () => {
    setSidebarOpen(true)
  }

  const handleSidebarClose = () => {
    setSidebarOpen(false)
  }

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
          <div className="report-chart">
            <h3>Monthly Call Average</h3>
            <div className="horizontal-bar-chart">
              {callAverageData.map((item, index) => (
                <div key={index} className="horizontal-bar-item">
                  <span className="bar-label-left">{item.month}</span>
                  <div className="horizontal-bar-wrapper">
                    <div
                      className="horizontal-bar"
                      style={{ width: `${(item.calls / maxCallAverage) * 100}%` }}
                    >
                      <span className="bar-value-right">{item.calls}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="chart-summary">
              <div className="summary-item">
                <span className="summary-label">Average:</span>
                <span className="summary-value">
                  {Math.round(callAverageData.reduce((sum, item) => sum + item.calls, 0) / callAverageData.length)} calls/month
                </span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Total:</span>
                <span className="summary-value">
                  {callAverageData.reduce((sum, item) => sum + item.calls, 0)} calls
                </span>
              </div>
            </div>
          </div>
        )

      case 'pob':
        const pobPercentage = (pobData.achieved / pobData.target) * 100
        return (
          <div className="report-chart">
            <h3>POB Performance</h3>
            <div className="comparison-chart">
              <div className="comparison-item">
                <div className="comparison-label">Target</div>
                <div className="comparison-bar-wrapper">
                  <div className="comparison-bar target" style={{ width: '100%' }}>
                    <span>₹{pobData.target.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
              <div className="comparison-item">
                <div className="comparison-label">Achieved</div>
                <div className="comparison-bar-wrapper">
                  <div className="comparison-bar achieved" style={{ width: `${pobPercentage}%` }}>
                    <span>₹{pobData.achieved.toLocaleString('en-IN')} ({pobPercentage.toFixed(1)}%)</span>
                  </div>
                </div>
              </div>
              <div className="comparison-item">
                <div className="comparison-label">Actual</div>
                <div className="comparison-bar-wrapper">
                  <div className="comparison-bar actual" style={{ width: `${(pobData.actual / pobData.target) * 100}%` }}>
                    <span>₹{pobData.actual.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="chart-summary">
              <div className="summary-item">
                <span className="summary-label">Achievement Rate:</span>
                <span className="summary-value">{pobPercentage.toFixed(1)}%</span>
              </div>
            </div>
          </div>
        )

      case 'budget':
        const maxBudget = Math.max(...budgetData.map(d => Math.max(d.budget, d.actual)))
        return (
          <div className="report-chart">
            <h3>Budget vs Actual Spending</h3>
            <div className="budget-chart">
              {budgetData.map((item, index) => {
                const budgetPercent = (item.actual / item.budget) * 100
                return (
                  <div key={index} className="budget-item">
                    <div className="budget-label">{item.category}</div>
                    <div className="budget-bars">
                      <div className="budget-bar-wrapper">
                        <div className="budget-bar budget" style={{ width: `${(item.budget / maxBudget) * 100}%` }}>
                          <span>Budget: ₹{item.budget.toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                      <div className="budget-bar-wrapper">
                        <div
                          className="budget-bar actual"
                          style={{ width: `${(item.actual / maxBudget) * 100}%` }}
                        >
                          <span>Actual: ₹{item.actual.toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                    </div>
                    <div className="budget-percentage">
                      {budgetPercent > 100 ? (
                        <span className="over-budget">+{(budgetPercent - 100).toFixed(1)}% over budget</span>
                      ) : (
                        <span className="under-budget">{(100 - budgetPercent).toFixed(1)}% remaining</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="chart-summary">
              <div className="summary-item">
                <span className="summary-label">Total Budget:</span>
                <span className="summary-value">
                  ₹{budgetData.reduce((sum, item) => sum + item.budget, 0).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Total Spent:</span>
                <span className="summary-value">
                  ₹{budgetData.reduce((sum, item) => sum + item.actual, 0).toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>
        )

      case 'tour-plan':
        const maxTourValue = Math.max(...tourPlanData.map(d => Math.max(d.planned, d.completed)))
        return (
          <div className="report-chart">
            <h3>Tour Plan Completion</h3>
            <div className="line-chart">
              <svg className="line-chart-svg" viewBox="0 0 600 300">
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
                  stroke="var(--primary-green)"
                  strokeWidth="3"
                  className="line-path"
                />
                {/* Completed line */}
                <polyline
                  points={tourPlanData.map((item, index) => 
                    `${50 + (index * 100)},${250 - (item.completed / maxTourValue) * 200}`
                  ).join(' ')}
                  fill="none"
                  stroke="#81C784"
                  strokeWidth="3"
                  className="line-path"
                />
                {/* Planned points */}
                {tourPlanData.map((item, index) => (
                  <g key={`planned-${index}`}>
                    <circle
                      cx={50 + index * 100}
                      cy={250 - (item.planned / maxTourValue) * 200}
                      r="6"
                      fill="var(--primary-green)"
                      stroke="#ffffff"
                      strokeWidth="2"
                    />
                    <text
                      x={50 + index * 100}
                      y={250 - (item.planned / maxTourValue) * 200 - 15}
                      textAnchor="middle"
                      fontSize="12"
                      fontWeight="600"
                      fill="var(--text-primary)"
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
                      fill="#81C784"
                      stroke="#ffffff"
                      strokeWidth="2"
                    />
                    <text
                      x={50 + index * 100}
                      y={250 - (item.completed / maxTourValue) * 200 - 15}
                      textAnchor="middle"
                      fontSize="12"
                      fontWeight="600"
                      fill="var(--text-primary)"
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
                    fill="var(--text-secondary)"
                  >
                    {item.month}
                  </text>
                ))}
              </svg>
            </div>
            <div className="chart-legend">
              <div className="legend-item">
                <span className="legend-color planned"></span>
                <span>Planned</span>
              </div>
              <div className="legend-item">
                <span className="legend-color completed"></span>
                <span>Completed</span>
              </div>
            </div>
          </div>
        )

      case 'daily-call':
        const maxDailyCall = Math.max(...dailyCallData.map(d => d.calls))
        return (
          <div className="report-chart">
            <h3>Weekly Daily Call Report</h3>
            <div className="horizontal-bar-chart">
              {dailyCallData.map((item, index) => (
                <div key={index} className="horizontal-bar-item">
                  <span className="bar-label-left">{item.day}</span>
                  <div className="horizontal-bar-wrapper">
                    <div
                      className="horizontal-bar"
                      style={{ width: `${(item.calls / maxDailyCall) * 100}%` }}
                    >
                      <span className="bar-value-right">{item.calls}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="chart-summary">
              <div className="summary-item">
                <span className="summary-label">Total Calls:</span>
                <span className="summary-value">
                  {dailyCallData.reduce((sum, item) => sum + item.calls, 0)} calls/week
                </span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Daily Average:</span>
                <span className="summary-value">
                  {Math.round(dailyCallData.reduce((sum, item) => sum + item.calls, 0) / dailyCallData.length)} calls/day
                </span>
              </div>
            </div>
          </div>
        )

      case 'joint-working':
        const colors = ['#66BB6A', '#81C784', '#A5D6A7', '#C8E6C9', '#9CCC65']
        // Calculate total coverage to normalize percentages
        const totalCoverage = jointWorkingData.reduce((sum, item) => sum + item.coverage, 0)
        // Normalize each doctor's coverage to be a percentage of the total
        const normalizedData = jointWorkingData.map(item => ({
          ...item,
          normalizedPercentage: (item.coverage / totalCoverage) * 100
        }))
        return (
          <div className="report-chart">
            <h3>Joint Working Coverage by Doctor</h3>
            <div className="pie-chart-container">
              <div className="pie-chart-wrapper">
                <svg className="pie-chart-svg" viewBox="0 0 200 200">
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
              <div className="pie-legend">
                {normalizedData.map((item, index) => (
                  <div key={index} className="pie-legend-item">
                    <span className="pie-legend-color" style={{ backgroundColor: colors[index % colors.length] }}></span>
                    <div className="pie-legend-info">
                      <span className="pie-legend-name">{item.doctor}</span>
                      <span className="pie-legend-value">{item.coverage}% ({item.normalizedPercentage.toFixed(1)}% share)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )

      case 'attendance':
        return (
          <div className="report-chart">
            <h3>Monthly Attendance Report</h3>
            <div className="table-chart">
              <table className="report-table">
                <thead>
                  <tr>
                    <th>Month</th>
                    <th>Present</th>
                    <th>Absent</th>
                    <th>Leave</th>
                    <th>Total Days</th>
                    <th>Attendance %</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceData.map((item, index) => {
                    const total = item.present + item.absent + item.leave
                    const attendancePercent = (item.present / total) * 100
                    return (
                      <tr key={index}>
                        <td>{item.month}</td>
                        <td className="present-cell">{item.present}</td>
                        <td className="absent-cell">{item.absent}</td>
                        <td className="leave-cell">{item.leave}</td>
                        <td>{total}</td>
                        <td>
                          <div className="attendance-bar">
                            <div
                              className="attendance-fill"
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
          <div className="report-chart">
            <h3>Campaign Performance</h3>
            <div className="campaign-chart">
              {campaignData.map((item, index) => (
                <div key={index} className="campaign-item">
                  <div className="campaign-label">{item.campaign}</div>
                  <div className="campaign-bars">
                    <div className="campaign-bar-wrapper">
                      <div className="campaign-bar-label">Reach</div>
                      <div className="campaign-bar reach" style={{ width: `${(item.reach / maxCampaignValue) * 100}%` }}>
                        <span>{item.reach}</span>
                      </div>
                    </div>
                    <div className="campaign-bar-wrapper">
                      <div className="campaign-bar-label">Engagement</div>
                      <div className="campaign-bar engagement" style={{ width: `${(item.engagement / maxCampaignValue) * 100}%` }}>
                        <span>{item.engagement}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="chart-summary">
              <div className="summary-item">
                <span className="summary-label">Total Reach:</span>
                <span className="summary-value">
                  {campaignData.reduce((sum, item) => sum + item.reach, 0)} people
                </span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Total Engagement:</span>
                <span className="summary-value">
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
    <div className="reports-container">
      <Header onLogout={onLogout} onMenuClick={handleMenuClick} onNavigateHome={() => onNavigate?.('home')} onNavigateOfflineRequests={() => onNavigate?.('offline-requests')} />
      <Sidebar isOpen={sidebarOpen} onClose={handleSidebarClose} userName={userName} onNavigate={onNavigate} onLogout={onLogout} />
      <main className="reports-content">
        <div className="reports-header">
          <button className="back-button" onClick={onBack} aria-label="Go back">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <h1 className="reports-title">Reports</h1>
        </div>

        <div className="reports-type-selector">
          <label className="reports-type-label">Types of Reports</label>
          <div className="dropdown-container" ref={dropdownRef}>
            <button
              className="dropdown-button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              aria-label="Select report type"
            >
              <span className="dropdown-selected">{selectedReportType}</span>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className={`dropdown-arrow ${isDropdownOpen ? 'open' : ''}`}
              >
                <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            {isDropdownOpen && (
              <div className="dropdown-menu">
                {reportTypes.map((type) => (
                  <button
                    key={type}
                    className={`dropdown-item ${selectedReportType === type ? 'active' : ''}`}
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

        {selectedReportType === 'Tour Plan Report' ? (
          <div className="tour-plan-report-container">
            <div className="report-card">
              <div className="table-card">
                <h3 className="table-title">Tour Plan Report</h3>
                <div className="table-wrapper">
                  <table className="report-table">
                    <thead>
                      <tr>
                        <th>Month</th>
                        <th>Planned</th>
                        <th>Completed</th>
                        <th>Pending</th>
                        <th>Completion %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tourPlanReportData.map((row, index) => (
                        <tr key={index}>
                          <td>{row.month}</td>
                          <td>{row.planned}</td>
                          <td>{row.completed}</td>
                          <td>{row.pending}</td>
                          <td>{row.completionPercent.toFixed(1)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        ) : selectedReportType === 'Daily Call Report' ? (
          <div className="tour-plan-report-container">
            <div className="report-card">
              <div className="table-card">
                <h3 className="table-title">Daily Call Report</h3>
                <div className="table-wrapper">
                  <table className="report-table">
                    <thead>
                      <tr>
                        <th>Customer Name</th>
                        <th>Visit Date</th>
                        <th>MR Name</th>
                        <th>Created Date</th>
                        <th>Brand Discussed</th>
                        <th>Accompanied By</th>
                        <th>Samples</th>
                        <th>Promotional Inputs</th>
                        <th>POB</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dailyCallReportData.map((row, index) => (
                        <tr key={index}>
                          <td>{row.customerName}</td>
                          <td>{row.visitDate}</td>
                          <td>{row.mrName}</td>
                          <td>{row.createdDate}</td>
                          <td>{row.brandDiscussed}</td>
                          <td>{row.accompaniedBy}</td>
                          <td>{row.samples}</td>
                          <td>{row.promotionalInputs}</td>
                          <td>{row.pob}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        ) : selectedReportType === 'Joint Working Coverage' ? (
          <div className="tour-plan-report-container">
            <div className="report-card">
              <div className="table-card">
                <h3 className="table-title">Joint Working Coverage</h3>
                <div className="table-wrapper">
                  <table className="report-table">
                    <thead>
                      <tr>
                        <th>Doctor Name</th>
                        <th>Coverage %</th>
                        <th>Total Visits</th>
                        <th>Completed Visits</th>
                        <th>Pending Visits</th>
                      </tr>
                    </thead>
                    <tbody>
                      {jointWorkingCoverageData.map((row, index) => (
                        <tr key={index}>
                          <td>{row.doctorName}</td>
                          <td>{row.coverage}%</td>
                          <td>{row.totalVisits}</td>
                          <td>{row.completedVisits}</td>
                          <td>{row.pendingVisits}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        ) : selectedReportType === 'Call Average' ? (
          <div className="tour-plan-report-container">
            <div className="report-card">
              <div className="table-card">
                <h3 className="table-title">Call Average</h3>
                <div className="table-wrapper">
                  <table className="report-table">
                    <thead>
                      <tr>
                        <th>Employee Name</th>
                        <th>Start Date</th>
                        <th>End Date</th>
                        <th>No of Field Working Days</th>
                        <th>Total Customers</th>
                        <th>Total Retailers</th>
                        <th>Total Calls</th>
                        <th>Doctor Target Calls</th>
                        <th>Pharmacy Target Calls</th>
                        <th>Call Average</th>
                      </tr>
                    </thead>
                    <tbody>
                      {callAverageReportData.map((row, index) => (
                        <tr key={index}>
                          <td>{row.employeeName}</td>
                          <td>{row.startDate}</td>
                          <td>{row.endDate}</td>
                          <td>{row.fieldWorkingDays}</td>
                          <td>{row.totalCustomers}</td>
                          <td>{row.totalRetailers}</td>
                          <td>{row.totalCalls}</td>
                          <td>{row.doctorTargetCalls}</td>
                          <td>{row.pharmacyTargetCalls}</td>
                          <td>{row.callAverage}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        ) : (
        <div className="reports-grid">
          {reports.map((report) => {
            const isExpanded = expandedReports.has(report.id)
            return (
              <div
                key={report.id}
                className={`report-card ${isExpanded ? 'expanded' : ''}`}
              >
                <div 
                  className="report-card-header"
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
                  <div className="report-card-title-section">
                    <h3 className="report-card-title">{report.title}</h3>
                    <div className="report-card-count">
                      <span className="count-value">{report.count.toLocaleString('en-IN')}</span>
                      <span className="count-label">{report.subtitle}</span>
                    </div>
                  </div>
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className={`expand-icon ${isExpanded ? 'expanded' : ''}`}
                  >
                    <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                {isExpanded && (
                  <div className="report-card-content">
                    {renderReport(report.id)}
                  </div>
                )}
              </div>
            )
          })}
        </div>
        )}
      </main>
    </div>
  )
}

export default Reports
