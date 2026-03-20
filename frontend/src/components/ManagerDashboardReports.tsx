import { useState, useEffect } from 'react'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend } from 'chart.js'
import { Bar, Doughnut } from 'react-chartjs-2'
import { apiGet } from '../services/apiService'
import './ManagerDashboardReports.css'

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend)

interface DCR {
  id: number
  date: string
  user_id: string
  product: string
}

interface RCPA {
  our_brand: string
  our_value: number
  competitor_value: number
}

interface Task {
  id: number
  user_id: string
  status: string
}

interface AEStats {
  total: number
  pending: number
  confirmed: number
  dismissed: number
  reviewed: number
  mild: number
  moderate: number
  severe: number
  critical: number
}

interface ManagerDashboardReportsProps {
  onNavigate?: (page: string) => void
}

const MR_NAMES: Record<string, string> = {
  'mr_rahul_001': 'Rahul',
  'mr_priya_002': 'Priya',
  'mr_robert_003': 'Robert',
}

const CHART_GREENS = ['#1B5E20', '#2E7D32', '#4CAF50', '#81C784', '#A5D6A7', '#C8E6C9', '#388E3C', '#66BB6A', '#43A047']

function ManagerDashboardReports({ onNavigate }: ManagerDashboardReportsProps) {
  const [loading, setLoading] = useState(true)
  const [dcrs, setDcrs] = useState<DCR[]>([])
  const [rcpas, setRcpas] = useState<RCPA[]>([])
  const [allTasks, setAllTasks] = useState<Task[]>([])
  const [pendingDoctorRequests, setPendingDoctorRequests] = useState(0)
  const [aeStats, setAeStats] = useState<AEStats | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dcrRes, rcpaRes, tasksRes, drStats, aeRes] = await Promise.all([
          apiGet('/dcr'),
          apiGet('/rcpa'),
          apiGet('/tasks'),
          apiGet('/doctor-requests/stats'),
          apiGet('/adverse-events/stats'),
        ])

        setDcrs(Array.isArray(dcrRes) ? dcrRes : dcrRes.data || [])
        setRcpas(Array.isArray(rcpaRes) ? rcpaRes : rcpaRes.data || [])
        setAllTasks(Array.isArray(tasksRes) ? tasksRes : tasksRes.data || [])
        setPendingDoctorRequests(drStats.stats?.pending || drStats.pending || 0)
        setAeStats(aeRes.stats || aeRes)
      } catch (err) {
        console.error('Manager dashboard fetch error:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // ── Time helpers ──
  const now = new Date()
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const lastMonth = now.getMonth() === 0
    ? `${now.getFullYear() - 1}-12`
    : `${now.getFullYear()}-${String(now.getMonth()).padStart(2, '0')}`

  const thisMonthDcrs = dcrs.filter(d => d.date?.startsWith(thisMonth))
  const lastMonthDcrs = dcrs.filter(d => d.date?.startsWith(lastMonth))

  // ── Widget 1: MR Performance (Grouped Bar) ──
  const mrIds = [...new Set(dcrs.map(d => d.user_id).filter(Boolean))]
  const mrLabels = mrIds.map(id => MR_NAMES[id] || id)
  const thisMonthPerMR = mrIds.map(id => thisMonthDcrs.filter(d => d.user_id === id).length)
  const lastMonthPerMR = mrIds.map(id => lastMonthDcrs.filter(d => d.user_id === id).length)

  const mrPerformanceData = {
    labels: mrLabels,
    datasets: [
      { label: 'This Month', data: thisMonthPerMR, backgroundColor: '#2E7D32', borderRadius: 4 },
      { label: 'Last Month', data: lastMonthPerMR, backgroundColor: '#BDBDBD', borderRadius: 4 },
    ],
  }

  const mrPerformanceOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' as const, labels: { boxWidth: 12, padding: 12, font: { size: 11 } } },
      tooltip: { enabled: true },
    },
    scales: {
      y: { beginAtZero: true, ticks: { font: { size: 11 }, stepSize: 2 } },
      x: { grid: { display: false }, ticks: { font: { size: 12 } } },
    },
  }

  // ── Widget 2: Product Detailing Mix (Doughnut) ──
  const productCounts: Record<string, number> = {}
  thisMonthDcrs.forEach(d => {
    if (d.product) productCounts[d.product] = (productCounts[d.product] || 0) + 1
  })
  const productLabels = Object.keys(productCounts).sort((a, b) => productCounts[b] - productCounts[a])
  const productValues = productLabels.map(p => productCounts[p])

  const productChartData = {
    labels: productLabels,
    datasets: [{
      data: productValues,
      backgroundColor: CHART_GREENS.slice(0, productLabels.length),
      borderWidth: 2,
      borderColor: '#fff',
    }],
  }

  const productChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' as const, labels: { boxWidth: 10, padding: 8, font: { size: 10 } } },
      tooltip: { enabled: true },
    },
  }

  // ── Widget 3: Market Share (RCPA Horizontal Bar) ──
  const brandAgg: Record<string, { ours: number; competitor: number }> = {}
  rcpas.forEach(r => {
    if (!brandAgg[r.our_brand]) brandAgg[r.our_brand] = { ours: 0, competitor: 0 }
    brandAgg[r.our_brand].ours += Number(r.our_value) || 0
    brandAgg[r.our_brand].competitor += Number(r.competitor_value) || 0
  })
  const brandLabels = Object.keys(brandAgg).sort((a, b) => brandAgg[b].ours - brandAgg[a].ours)
  const ourSharePct = brandLabels.map(b => {
    const total = brandAgg[b].ours + brandAgg[b].competitor
    return total > 0 ? Math.round((brandAgg[b].ours / total) * 100) : 0
  })
  const compSharePct = brandLabels.map(b => {
    const total = brandAgg[b].ours + brandAgg[b].competitor
    return total > 0 ? Math.round((brandAgg[b].competitor / total) * 100) : 0
  })

  const rcpaChartData = {
    labels: brandLabels,
    datasets: [
      { label: 'Our Brand', data: ourSharePct, backgroundColor: '#2E7D32', borderRadius: 4 },
      { label: 'Competitors', data: compSharePct, backgroundColor: '#EF5350', borderRadius: 4 },
    ],
  }

  const rcpaChartOptions = {
    indexAxis: 'y' as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' as const, labels: { boxWidth: 12, padding: 12, font: { size: 11 } } },
      tooltip: {
        callbacks: {
          label: (ctx: any) => `${ctx.dataset.label}: ${ctx.raw}%`,
        },
      },
    },
    scales: {
      x: {
        stacked: true,
        max: 100,
        ticks: { font: { size: 11 }, callback: (v: any) => `${v}%` },
      },
      y: {
        stacked: true,
        ticks: { font: { size: 11 } },
      },
    },
  }

  // ── Widget 4: Safety & Compliance ──
  const severityItems = aeStats ? [
    { label: 'Mild', count: aeStats.mild || 0, color: '#66BB6A' },
    { label: 'Moderate', count: aeStats.moderate || 0, color: '#FFA726' },
    { label: 'Severe', count: aeStats.severe || 0, color: '#EF5350' },
    { label: 'Critical', count: aeStats.critical || 0, color: '#B71C1C' },
  ] : []

  // ── Widget 5: Task Completion by MR (Stacked Horizontal Bar) ──
  const tasksByMR: Record<string, { completed: number; pending: number; overdue: number }> = {}
  allTasks.forEach(t => {
    if (!t.user_id) return
    if (!tasksByMR[t.user_id]) tasksByMR[t.user_id] = { completed: 0, pending: 0, overdue: 0 }
    if (t.status === 'completed') tasksByMR[t.user_id].completed++
    else if (t.status === 'overdue') tasksByMR[t.user_id].overdue++
    else tasksByMR[t.user_id].pending++
  })
  const taskMRIds = Object.keys(tasksByMR)
  const taskMRLabels = taskMRIds.map(id => MR_NAMES[id] || id)

  const taskChartData = {
    labels: taskMRLabels,
    datasets: [
      { label: 'Completed', data: taskMRIds.map(id => tasksByMR[id].completed), backgroundColor: '#4CAF50', borderRadius: 4 },
      { label: 'Pending', data: taskMRIds.map(id => tasksByMR[id].pending), backgroundColor: '#FFA726', borderRadius: 4 },
      { label: 'Overdue', data: taskMRIds.map(id => tasksByMR[id].overdue), backgroundColor: '#EF5350', borderRadius: 4 },
    ],
  }

  const taskChartOptions = {
    indexAxis: 'y' as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' as const, labels: { boxWidth: 12, padding: 12, font: { size: 11 } } },
      tooltip: { enabled: true },
    },
    scales: {
      x: { stacked: true, beginAtZero: true, ticks: { font: { size: 11 }, stepSize: 1 } },
      y: { stacked: true, ticks: { font: { size: 12 } } },
    },
  }

  // ── Widget 6: Action Items counts ──
  const pendingTaskCount = allTasks.filter(t => t.status === 'pending').length
  const overdueTaskCount = allTasks.filter(t => t.status === 'overdue').length

  if (loading) {
    return (
      <div className="mgr-dashboard-container">
        <div className="mgr-reports-grid">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="mgr-report-card mgr-skeleton-card">
              <div className="mgr-skeleton-bar" />
              <div className="mgr-skeleton-bar short" />
              <div className="mgr-skeleton-block" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="mgr-dashboard-container">
      <div className="mgr-reports-grid">

        {/* Widget 1: MR Performance */}
        <div className="mgr-report-card" onClick={() => onNavigate?.('mr-list')}>
          <h3 className="mgr-widget-title">MR Performance</h3>
          <p className="mgr-widget-subtitle">Doctor visits — this month vs last</p>
          {mrLabels.length > 0 ? (
            <div className="mgr-chart-wrapper">
              <Bar data={mrPerformanceData} options={mrPerformanceOptions} />
            </div>
          ) : (
            <div className="mgr-empty-state">No call data available</div>
          )}
        </div>

        {/* Widget 2: Product Detailing Mix */}
        <div className="mgr-report-card" onClick={() => onNavigate?.('reports')}>
          <h3 className="mgr-widget-title">Product Focus</h3>
          <p className="mgr-widget-subtitle">Team detailing distribution this month</p>
          {productLabels.length > 0 ? (
            <div className="mgr-chart-wrapper">
              <Doughnut data={productChartData} options={productChartOptions} />
            </div>
          ) : (
            <div className="mgr-empty-state">No calls recorded this month</div>
          )}
        </div>

        {/* Widget 3: Market Share (RCPA) */}
        <div className="mgr-report-card" onClick={() => onNavigate?.('reports')}>
          <h3 className="mgr-widget-title">Market Share (RCPA)</h3>
          <p className="mgr-widget-subtitle">Our brands vs competition</p>
          {brandLabels.length > 0 ? (
            <div className="mgr-chart-wrapper mgr-chart-tall">
              <Bar data={rcpaChartData} options={rcpaChartOptions} />
            </div>
          ) : (
            <div className="mgr-empty-state">No RCPA data available</div>
          )}
        </div>

        {/* Widget 4: Safety & Compliance */}
        <div className="mgr-report-card" onClick={() => onNavigate?.('adverse-events')}>
          <h3 className="mgr-widget-title">Safety & Compliance</h3>
          <p className="mgr-widget-subtitle">Adverse event overview</p>
          {aeStats && aeStats.pending > 0 ? (
            <>
              <div className="mgr-safety-pending">
                <span className="mgr-safety-count">{aeStats.pending}</span>
                <span className="mgr-safety-label">Pending Review</span>
              </div>
              <div className="mgr-severity-row">
                {severityItems.map(s => (
                  <div key={s.label} className="mgr-severity-item">
                    <span className="mgr-severity-dot" style={{ backgroundColor: s.color }}></span>
                    <span className="mgr-severity-text">{s.label}</span>
                    <span className="mgr-severity-count">{s.count}</span>
                  </div>
                ))}
              </div>
              <div className="mgr-ae-summary">
                <span className="mgr-ae-total">{aeStats.total} total</span>
                <span className="mgr-ae-confirmed">{aeStats.confirmed} confirmed</span>
                <span className="mgr-ae-dismissed">{aeStats.dismissed} dismissed</span>
              </div>
            </>
          ) : (
            <div className="mgr-safety-clear">
              <div className="mgr-safety-clear-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22 11.08V12C21.9988 14.1564 21.3005 16.2547 20.0093 17.9818C18.7182 19.709 16.9033 20.9725 14.8354 21.5839C12.7674 22.1953 10.5573 22.1219 8.53447 21.3746C6.51168 20.6273 4.78465 19.2461 3.61096 17.4371C2.43727 15.628 1.87979 13.4881 2.02168 11.3363C2.16356 9.18457 2.99721 7.13633 4.39828 5.49707C5.79935 3.85782 7.69279 2.71538 9.79619 2.24015C11.8996 1.76491 14.1003 1.98234 16.07 2.86" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M22 4L12 14.01L9 11.01" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span className="mgr-safety-clear-text">All Clear</span>
              <span className="mgr-safety-clear-sub">No pending safety alerts</span>
            </div>
          )}
        </div>

        {/* Widget 5: Task Follow-Up by MR */}
        <div className="mgr-report-card">
          <h3 className="mgr-widget-title">Task Follow-Up</h3>
          <p className="mgr-widget-subtitle">Completion status by MR</p>
          {taskMRLabels.length > 0 ? (
            <div className="mgr-chart-wrapper">
              <Bar data={taskChartData} options={taskChartOptions} />
            </div>
          ) : (
            <div className="mgr-empty-state">No task data available</div>
          )}
        </div>

        {/* Widget 6: Action Items */}
        <div className="mgr-report-card">
          <h3 className="mgr-widget-title">Action Items</h3>
          <p className="mgr-widget-subtitle">Items requiring your attention</p>
          <div className="mgr-approval-rows">
            <div className="mgr-approval-row mgr-approval-row-clickable" onClick={() => onNavigate?.('doctor-management')}>
              <span className="mgr-approval-label">Doctor Requests</span>
              <span className={`mgr-approval-badge ${pendingDoctorRequests > 0 ? 'amber' : 'green'}`}>
                {pendingDoctorRequests}
              </span>
            </div>
            <div className="mgr-approval-row mgr-approval-row-clickable" onClick={() => onNavigate?.('adverse-events')}>
              <span className="mgr-approval-label">Safety Alerts Pending</span>
              <span className={`mgr-approval-badge ${(aeStats?.pending || 0) > 0 ? 'red' : 'green'}`}>
                {aeStats?.pending || 0}
              </span>
            </div>
            <div className="mgr-approval-row">
              <span className="mgr-approval-label">Team Tasks Pending</span>
              <span className={`mgr-approval-badge ${pendingTaskCount > 0 ? 'blue' : 'green'}`}>
                {pendingTaskCount}
              </span>
            </div>
            <div className="mgr-approval-row">
              <span className="mgr-approval-label">Team Tasks Overdue</span>
              <span className={`mgr-approval-badge ${overdueTaskCount > 0 ? 'red' : 'green'}`}>
                {overdueTaskCount}
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

export default ManagerDashboardReports
