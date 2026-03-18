import { useState, useEffect } from 'react'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend } from 'chart.js'
import { Bar, Doughnut } from 'react-chartjs-2'
import { apiGet } from '../services/apiService'
import { useAuth } from '../contexts/AuthContext'
import './DashboardReports.css'

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend)

interface DCR {
  id: number
  date: string
  product: string
}

interface RCPA {
  our_brand: string
  our_value: number
  competitor_value: number
}

interface Task {
  id: number
  task: string
  due_date: string
  status: string
  doctor_name: string
}

const CHART_GREENS = ['#1B5E20', '#2E7D32', '#4CAF50', '#81C784', '#A5D6A7', '#C8E6C9', '#388E3C', '#66BB6A', '#43A047']

function DashboardReports() {
  const { user } = useAuth()
  const userId = user?.user_id || localStorage.getItem('userId') || ''

  const [loading, setLoading] = useState(true)
  const [dcrs, setDcrs] = useState<DCR[]>([])
  const [rcpas, setRcpas] = useState<RCPA[]>([])
  const [pendingTasks, setPendingTasks] = useState<Task[]>([])
  const [overdueTasks, setOverdueTasks] = useState<Task[]>([])

  useEffect(() => {
    if (!userId) return
    const fetchData = async () => {
      try {
        const [dcrRes, rcpaRes, pendingRes, overdueRes] = await Promise.all([
          apiGet(`/dcr?user_id=${userId}`),
          apiGet(`/rcpa?user_id=${userId}`),
          apiGet(`/tasks?user_id=${userId}&status=pending`),
          apiGet(`/tasks?user_id=${userId}&status=overdue`),
        ])
        setDcrs(Array.isArray(dcrRes) ? dcrRes : dcrRes.data || [])
        setRcpas(Array.isArray(rcpaRes) ? rcpaRes : rcpaRes.data || [])
        setPendingTasks(Array.isArray(pendingRes) ? pendingRes : pendingRes.data || [])
        setOverdueTasks(Array.isArray(overdueRes) ? overdueRes : overdueRes.data || [])
      } catch (err) {
        console.error('Dashboard fetch error:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [userId])

  // ── Widget 1: This Month's Calls ──
  const now = new Date()
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const lastMonth = now.getMonth() === 0
    ? `${now.getFullYear() - 1}-12`
    : `${now.getFullYear()}-${String(now.getMonth()).padStart(2, '0')}`

  const thisMonthCalls = dcrs.filter(d => d.date?.startsWith(thisMonth)).length
  const lastMonthCalls = dcrs.filter(d => d.date?.startsWith(lastMonth)).length
  const trend = lastMonthCalls > 0
    ? Math.round(((thisMonthCalls - lastMonthCalls) / lastMonthCalls) * 100)
    : thisMonthCalls > 0 ? 100 : 0

  // Weekly breakdown for this month
  const weeklyData = [0, 0, 0, 0, 0]
  dcrs.filter(d => d.date?.startsWith(thisMonth)).forEach(d => {
    const day = new Date(d.date).getDate()
    const week = Math.min(Math.floor((day - 1) / 7), 4)
    weeklyData[week]++
  })
  const activeWeeks = weeklyData.filter(w => w > 0 || weeklyData.indexOf(w) <= Math.floor((now.getDate() - 1) / 7))
  const weekLabels = activeWeeks.map((_, i) => `W${i + 1}`)

  const weeklyChartData = {
    labels: weekLabels.length > 0 ? weekLabels : ['W1'],
    datasets: [{
      data: activeWeeks.length > 0 ? activeWeeks : [0],
      backgroundColor: '#2E7D32',
      borderRadius: 4,
    }],
  }

  const weeklyChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { enabled: true } },
    scales: {
      y: { display: false, beginAtZero: true },
      x: { grid: { display: false }, ticks: { font: { size: 11 } } },
    },
  }

  // ── Widget 2: Product Detailing Mix ──
  const productCounts: Record<string, number> = {}
  dcrs.forEach(d => {
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
      legend: { position: 'bottom' as const, labels: { boxWidth: 12, padding: 12, font: { size: 11 } } },
      tooltip: { enabled: true },
    },
  }

  // ── Widget 3: Market Share (RCPA) ──
  const brandAgg: Record<string, { ours: number; competitor: number }> = {}
  rcpas.forEach(r => {
    if (!brandAgg[r.our_brand]) brandAgg[r.our_brand] = { ours: 0, competitor: 0 }
    brandAgg[r.our_brand].ours += Number(r.our_value) || 0
    brandAgg[r.our_brand].competitor += Number(r.competitor_value) || 0
  })
  const brandLabels = Object.keys(brandAgg).sort((a, b) => brandAgg[b].ours - brandAgg[a].ours)
  const ourValues = brandLabels.map(b => brandAgg[b].ours)
  const compValues = brandLabels.map(b => brandAgg[b].competitor)

  const rcpaChartData = {
    labels: brandLabels,
    datasets: [
      { label: 'Our Brand', data: ourValues, backgroundColor: '#2E7D32', borderRadius: 4 },
      { label: 'Competitors', data: compValues, backgroundColor: '#E53935', borderRadius: 4 },
    ],
  }

  const rcpaChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' as const, labels: { boxWidth: 12, padding: 12, font: { size: 11 } } },
      title: { display: false },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: { display: true, text: 'Prescription Value (₹)', font: { size: 11 } },
        ticks: { font: { size: 11 } },
      },
      x: {
        ticks: { font: { size: 10 }, maxRotation: 45, minRotation: 0 },
      },
    },
  }

  // ── Widget 4: Pending Actions ──
  const allPending = [...pendingTasks, ...overdueTasks]
  const nextDue = allPending
    .filter(t => t.due_date)
    .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())[0]

  if (loading) {
    return (
      <div className="dashboard-reports-container">
        <div className="reports-grid">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="report-card skeleton-card">
              <div className="skeleton-bar" />
              <div className="skeleton-bar short" />
              <div className="skeleton-block" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard-reports-container">
      <div className="reports-grid">

        {/* Widget 1: This Month's Calls */}
        <div className="report-card kpi-card">
          <h3 className="widget-title">This Month's Calls</h3>
          <div className="kpi-row">
            <div className="kpi-number">{thisMonthCalls}</div>
            <div className={`kpi-trend ${trend >= 0 ? 'trend-up' : 'trend-down'}`}>
              {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
              <span className="trend-label">vs last month</span>
            </div>
          </div>
          <div className="mini-chart-wrapper">
            <Bar data={weeklyChartData} options={weeklyChartOptions} />
          </div>
        </div>

        {/* Widget 2: Product Detailing Mix */}
        <div className="report-card">
          <h3 className="widget-title">Product Detailing Mix</h3>
          {productLabels.length > 0 ? (
            <div className="chart-wrapper">
              <Doughnut data={productChartData} options={productChartOptions} />
            </div>
          ) : (
            <div className="empty-state">No calls recorded yet</div>
          )}
        </div>

        {/* Widget 3: Market Share (RCPA) */}
        <div className="report-card">
          <h3 className="widget-title">Market Share (RCPA)</h3>
          {brandLabels.length > 0 ? (
            <div className="chart-wrapper">
              <Bar data={rcpaChartData} options={rcpaChartOptions} />
            </div>
          ) : (
            <div className="empty-state">No RCPA data recorded yet</div>
          )}
        </div>

        {/* Widget 4: Pending Actions */}
        <div className="report-card actions-card">
          <h3 className="widget-title">Pending Actions</h3>
          <div className="actions-stats">
            <div className="action-stat">
              <span className="action-count pending">{pendingTasks.length}</span>
              <span className="action-label">Pending</span>
            </div>
            <div className="action-stat">
              <span className="action-count overdue">{overdueTasks.length}</span>
              <span className="action-label">Overdue</span>
            </div>
          </div>
          {nextDue ? (
            <div className="next-due">
              <span className="next-due-label">Next due:</span>
              <span className="next-due-task">{nextDue.task}</span>
              <span className="next-due-meta">
                {nextDue.doctor_name} · {new Date(nextDue.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
              </span>
            </div>
          ) : (
            <div className="empty-state" style={{ marginTop: 12 }}>All caught up!</div>
          )}
        </div>

      </div>
    </div>
  )
}

export default DashboardReports
