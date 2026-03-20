import { useState, useEffect, useRef } from 'react'
import Header from './Header'
import Sidebar from './Sidebar'
import { useAuth } from '../contexts/AuthContext'
import { apiGet } from '../services/apiService'
import { Chart, registerables } from 'chart.js'
import './SalesDashboard.css'

Chart.register(...registerables)

interface SalesDashboardProps {
  onLogout: () => void
  onBack: () => void
  userName?: string
  userEmail?: string
  userMobile?: string
  onNavigate?: (page: string) => void
}

interface PerformanceRow {
  user_id: string
  period: string
  product_name: string
  product_id: number
  target_qty: number
  target_value: string
  actual_qty: number
  actual_value: string
  achievement_pct: string
}

interface GrowthRow {
  user_id: string
  period: string
  total_value: string
  total_qty: number
  prev_value: string | null
  growth_pct: string | null
}

interface ActivityRow {
  user_id: string
  name: string
  territory: string
  total_sales: string
  total_qty: number
  total_target: string
  achievement_pct: string
  total_calls: number
  doctors_covered: number
  total_doctors: number
  coverage_pct: string
}

interface SummaryRow {
  user_id: string
  territory: string
  period: string
  product_name: string
  product_id: number
  total_qty: number
  total_value: string
}

const MR_NAMES: Record<string, string> = {
  'mr_rahul_001': 'Rahul Sharma',
  'mr_priya_002': 'Priya Patel',
  'mr_robert_003': 'Robert Johnson',
}

function SalesDashboard({ onLogout, onBack, userName, userEmail, userMobile, onNavigate }: SalesDashboardProps) {
  const { user } = useAuth()
  const isManager = user?.role === 'manager' || user?.role === 'admin'
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'performance' | 'activity'>('performance')
  const [loading, setLoading] = useState(true)

  // Filters
  const [filterMR, setFilterMR] = useState(isManager ? '' : (user?.user_id || ''))
  const [filterPeriod, setFilterPeriod] = useState(() => {
    const d = new Date()
    d.setMonth(d.getMonth() - 1) // default to last month (full data)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  })

  // Data
  const [performance, setPerformance] = useState<PerformanceRow[]>([])
  const [growth, setGrowth] = useState<GrowthRow[]>([])
  const [activity, setActivity] = useState<ActivityRow[]>([])
  const [summary, setSummary] = useState<SummaryRow[]>([])

  // Chart refs
  const targetChartRef = useRef<HTMLCanvasElement>(null)
  const trendChartRef = useRef<HTMLCanvasElement>(null)
  const mixChartRef = useRef<HTMLCanvasElement>(null)
  const chartInstances = useRef<Chart[]>([])

  useEffect(() => {
    loadData()
  }, [filterMR, filterPeriod, activeTab])

  const loadData = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filterMR) params.set('user_id', filterMR)

      if (activeTab === 'performance') {
        const perfParams = new URLSearchParams(params)
        if (filterPeriod) perfParams.set('period', filterPeriod)

        const [perfRes, growthRes, summaryRes] = await Promise.all([
          apiGet(`/sales/performance?${perfParams.toString()}`),
          apiGet(`/sales/growth?${params.toString()}`),
          apiGet(`/sales/summary?${perfParams.toString()}`),
        ])
        setPerformance(perfRes.data || [])
        setGrowth(growthRes.data || [])
        setSummary(summaryRes.data || [])
      } else {
        const actParams = new URLSearchParams(params)
        if (filterPeriod) actParams.set('period', filterPeriod)
        const actRes = await apiGet(`/sales/activity-productivity?${actParams.toString()}`)
        setActivity(actRes.data || [])
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err)
    } finally {
      setLoading(false)
    }
  }

  // Draw charts when data changes
  useEffect(() => {
    if (activeTab !== 'performance' || loading) return

    // Cleanup previous charts
    chartInstances.current.forEach(c => c.destroy())
    chartInstances.current = []

    drawTargetChart()
    drawTrendChart()
    drawMixChart()
  }, [performance, growth, summary, loading, activeTab])

  const drawTargetChart = () => {
    if (!targetChartRef.current || !performance.length) return

    // Aggregate by product for selected period
    const products = [...new Set(performance.map(p => p.product_name))]
    const targets = products.map(name => {
      const rows = performance.filter(p => p.product_name === name)
      return rows.reduce((sum, r) => sum + parseFloat(r.target_value), 0)
    })
    const actuals = products.map(name => {
      const rows = performance.filter(p => p.product_name === name)
      return rows.reduce((sum, r) => sum + parseFloat(r.actual_value), 0)
    })

    const chart = new Chart(targetChartRef.current, {
      type: 'bar',
      data: {
        labels: products.map(n => n.replace(/\s+/g, '\n')),
        datasets: [
          { label: 'Target', data: targets, backgroundColor: '#bbf7d0', borderColor: '#22c55e', borderWidth: 1 },
          { label: 'Actual', data: actuals, backgroundColor: '#166534', borderColor: '#14532d', borderWidth: 1 },
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } } },
        scales: {
          y: { beginAtZero: true, ticks: { font: { size: 10 } } },
          x: { ticks: { font: { size: 9 }, maxRotation: 45 } }
        }
      }
    })
    chartInstances.current.push(chart)
  }

  const drawTrendChart = () => {
    if (!trendChartRef.current || !growth.length) return

    // If showing all MRs, aggregate totals per period
    const periods = [...new Set(growth.map(g => g.period))].sort()

    if (filterMR) {
      const values = periods.map(p => {
        const row = growth.find(g => g.period === p && g.user_id === filterMR)
        return row ? parseFloat(row.total_value) : 0
      })

      const chart = new Chart(trendChartRef.current, {
        type: 'line',
        data: {
          labels: periods.map(p => new Date(p + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' })),
          datasets: [{
            label: 'Sales Value',
            data: values,
            borderColor: '#166534',
            backgroundColor: 'rgba(22, 101, 52, 0.1)',
            fill: true,
            tension: 0.3,
            pointRadius: 4,
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: { beginAtZero: true, ticks: { font: { size: 10 } } },
            x: { ticks: { font: { size: 10 } } }
          }
        }
      })
      chartInstances.current.push(chart)
    } else {
      // Multiple MRs as separate lines
      const mrIds = [...new Set(growth.map(g => g.user_id))]
      const colors = ['#166534', '#2563eb', '#dc2626']
      const datasets = mrIds.map((mrId, i) => ({
        label: MR_NAMES[mrId] || mrId,
        data: periods.map(p => {
          const row = growth.find(g => g.period === p && g.user_id === mrId)
          return row ? parseFloat(row.total_value) : 0
        }),
        borderColor: colors[i % colors.length],
        tension: 0.3,
        pointRadius: 3,
        fill: false,
      }))

      const chart = new Chart(trendChartRef.current, {
        type: 'line',
        data: {
          labels: periods.map(p => new Date(p + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' })),
          datasets
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } } },
          scales: {
            y: { beginAtZero: true, ticks: { font: { size: 10 } } },
            x: { ticks: { font: { size: 10 } } }
          }
        }
      })
      chartInstances.current.push(chart)
    }
  }

  const drawMixChart = () => {
    if (!mixChartRef.current || !summary.length) return

    // Group by product brand (Derise, Rilast, Bevaas)
    const brandMap: Record<string, number> = {}
    summary.forEach(s => {
      const brand = s.product_name.split(' ')[0]
      brandMap[brand] = (brandMap[brand] || 0) + parseFloat(s.total_value)
    })

    const brands = Object.keys(brandMap)
    const values = brands.map(b => brandMap[b])
    const bgColors = ['#166534', '#2563eb', '#f59e0b', '#dc2626', '#8b5cf6']

    const chart = new Chart(mixChartRef.current, {
      type: 'doughnut',
      data: {
        labels: brands,
        datasets: [{
          data: values,
          backgroundColor: bgColors.slice(0, brands.length),
          borderWidth: 2,
          borderColor: '#fff',
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } } }
      }
    })
    chartInstances.current.push(chart)
  }

  // Compute KPIs
  const totalSales = performance.reduce((sum, p) => sum + parseFloat(p.actual_value), 0)
  const totalTarget = performance.reduce((sum, p) => sum + parseFloat(p.target_value), 0)
  const overallAchievement = totalTarget > 0 ? ((totalSales / totalTarget) * 100).toFixed(1) : '0'

  // Growth for latest period
  const latestGrowth = growth.length > 0 ? growth[growth.length - 1] : null
  const growthPct = latestGrowth?.growth_pct ? parseFloat(latestGrowth.growth_pct) : null

  // Top product
  const productSales = new Map<string, number>()
  performance.forEach(p => {
    productSales.set(p.product_name, (productSales.get(p.product_name) || 0) + parseFloat(p.actual_value))
  })
  const topProduct = [...productSales.entries()].sort((a, b) => b[1] - a[1])[0]

  // Period options
  const periodOptions: string[] = []
  for (let i = -6; i <= 1; i++) {
    const d = new Date()
    d.setMonth(d.getMonth() + i)
    periodOptions.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }

  // MR ranking for manager view
  const mrPerformance = new Map<string, { sales: number; target: number }>()
  performance.forEach(p => {
    const current = mrPerformance.get(p.user_id) || { sales: 0, target: 0 }
    current.sales += parseFloat(p.actual_value)
    current.target += parseFloat(p.target_value)
    mrPerformance.set(p.user_id, current)
  })
  const mrRanking = [...mrPerformance.entries()]
    .map(([mrId, data]) => ({
      mrId,
      name: MR_NAMES[mrId] || mrId,
      sales: data.sales,
      target: data.target,
      achievement: data.target > 0 ? ((data.sales / data.target) * 100) : 0
    }))
    .sort((a, b) => b.achievement - a.achievement)

  const handleExport = () => {
    const token = localStorage.getItem('zenapp_token')
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'
    const params = new URLSearchParams()
    if (filterMR) params.set('user_id', filterMR)
    fetch(`${baseUrl}/sales/export?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(r => r.blob())
    .then(blob => {
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'sales_export.csv'
      a.click()
      URL.revokeObjectURL(url)
    })
  }

  return (
    <div className="sales-dash-container">
      <Header onLogout={onLogout} onMenuClick={() => setSidebarOpen(true)} onNavigateHome={() => onNavigate?.('home')} onNavigateOfflineRequests={() => onNavigate?.('offline-requests')} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} userName={userName} userEmail={userEmail} userMobile={userMobile} onNavigate={onNavigate} onLogout={onLogout} currentPage="sales-dashboard" />

      <main className="sales-dash-content">
        <div className="sales-dash-title-row">
          <h1>Sales Dashboard</h1>
          <button className="sales-dash-export-btn" onClick={handleExport}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M21 15V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V15M7 10L12 15M12 15L17 10M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Export CSV
          </button>
        </div>

        <div className="sales-dash-tabs">
          <button className={`sales-dash-tab ${activeTab === 'performance' ? 'active' : ''}`} onClick={() => setActiveTab('performance')}>
            Sales Performance
          </button>
          <button className={`sales-dash-tab ${activeTab === 'activity' ? 'active' : ''}`} onClick={() => setActiveTab('activity')}>
            Activity vs Productivity
          </button>
        </div>

        <div className="sales-dash-filters">
          {isManager && (
            <select value={filterMR} onChange={e => setFilterMR(e.target.value)}>
              <option value="">All MRs</option>
              {Object.entries(MR_NAMES).map(([id, name]) => (
                <option key={id} value={id}>{name}</option>
              ))}
            </select>
          )}
          <select value={filterPeriod} onChange={e => setFilterPeriod(e.target.value)}>
            {periodOptions.map(p => (
              <option key={p} value={p}>{new Date(p + '-01').toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="sales-dash-loading">Loading dashboard...</div>
        ) : activeTab === 'performance' ? (
          <>
            {/* KPI Cards */}
            <div className="sales-dash-kpi-grid">
              <div className="sales-dash-kpi">
                <div className="sales-dash-kpi-label">{isManager && !filterMR ? 'Team Total Sales' : 'Total Sales'}</div>
                <div className="sales-dash-kpi-value">Rs {totalSales.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
                <div className="sales-dash-kpi-sub">Target: Rs {totalTarget.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
              </div>
              <div className="sales-dash-kpi">
                <div className="sales-dash-kpi-label">Achievement</div>
                <div className={`sales-dash-kpi-value ${parseFloat(overallAchievement) >= 80 ? 'green' : 'red'}`}>{overallAchievement}%</div>
                <div className="sales-dash-kpi-sub">of target value</div>
              </div>
              <div className="sales-dash-kpi">
                <div className="sales-dash-kpi-label">MoM Growth</div>
                <div className={`sales-dash-kpi-value ${growthPct !== null && growthPct >= 0 ? 'green' : 'red'}`}>
                  {growthPct !== null ? `${growthPct > 0 ? '+' : ''}${growthPct}%` : '—'}
                </div>
                <div className="sales-dash-kpi-sub">vs previous month</div>
              </div>
              <div className="sales-dash-kpi">
                <div className="sales-dash-kpi-label">Top Product</div>
                <div className="sales-dash-kpi-value" style={{ fontSize: 16 }}>{topProduct ? topProduct[0] : '—'}</div>
                <div className="sales-dash-kpi-sub">{topProduct ? `Rs ${topProduct[1].toLocaleString('en-IN', { maximumFractionDigits: 0 })}` : ''}</div>
              </div>
            </div>

            {/* Charts */}
            <div className="sales-dash-charts">
              <div className="sales-dash-chart-card">
                <h3>Target vs Achievement by Product</h3>
                <div className="sales-dash-chart-container">
                  <canvas ref={targetChartRef}></canvas>
                </div>
              </div>
              <div className="sales-dash-chart-card">
                <h3>Monthly Sales Trend</h3>
                <div className="sales-dash-chart-container">
                  <canvas ref={trendChartRef}></canvas>
                </div>
              </div>
              <div className="sales-dash-chart-card">
                <h3>Brand Mix</h3>
                <div className="sales-dash-chart-container">
                  <canvas ref={mixChartRef}></canvas>
                </div>
              </div>
            </div>

            {/* MR Ranking (Manager view) */}
            {isManager && !filterMR && mrRanking.length > 0 && (
              <div className="sales-dash-ranking-card">
                <h3>MR Performance Ranking</h3>
                <div style={{ overflowX: 'auto' }}>
                  <table className="sales-dash-ranking-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>MR Name</th>
                        <th>Total Sales (Rs)</th>
                        <th>Target (Rs)</th>
                        <th>Achievement</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mrRanking.map((mr, i) => (
                        <tr key={mr.mrId}>
                          <td>{i + 1}</td>
                          <td>{mr.name}</td>
                          <td>{mr.sales.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
                          <td>{mr.target.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
                          <td>
                            <span className={`sales-dash-achievement-badge ${mr.achievement >= 90 ? 'high' : mr.achievement >= 70 ? 'medium' : 'low'}`}>
                              {mr.achievement.toFixed(1)}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        ) : (
          /* Activity vs Productivity Tab */
          <>
            {activity.length === 0 ? (
              <div className="sales-dash-loading">No activity data available</div>
            ) : (
              <div className="sales-dash-activity-cards">
                {activity.map(a => (
                  <div key={a.user_id} className="sales-dash-activity-card">
                    <h4>{a.name}</h4>
                    <div className="subtitle">{a.territory}</div>
                    <div className="sales-dash-activity-metrics">
                      <div className="sales-dash-activity-metric">
                        <span className="metric-label">Sales vs Target</span>
                        <span className={`metric-value ${parseFloat(a.achievement_pct) >= 80 ? 'green' : 'red'}`}>
                          {parseFloat(a.achievement_pct).toFixed(1)}%
                        </span>
                      </div>
                      <div className="sales-dash-activity-metric">
                        <span className="metric-label">Doctor Coverage</span>
                        <span className={`metric-value ${parseFloat(a.coverage_pct) >= 60 ? 'green' : 'red'}`}>
                          {parseFloat(a.coverage_pct).toFixed(1)}%
                        </span>
                      </div>
                      <div className="sales-dash-activity-metric">
                        <span className="metric-label">Total Calls</span>
                        <span className="metric-value">{a.total_calls}</span>
                      </div>
                      <div className="sales-dash-activity-metric">
                        <span className="metric-label">Total Sales</span>
                        <span className="metric-value">Rs {parseFloat(a.total_sales).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                      </div>
                      <div className="sales-dash-activity-metric">
                        <span className="metric-label">Doctors Covered</span>
                        <span className="metric-value">{a.doctors_covered} / {a.total_doctors}</span>
                      </div>
                      <div className="sales-dash-activity-metric">
                        <span className="metric-label">Sales Value</span>
                        <span className="metric-value">Rs {parseFloat(a.total_sales).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}

export default SalesDashboard
