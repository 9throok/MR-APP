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

interface ScorecardData {
  overdueTasks: { total: number; byMr: { user_id: string; name: string; count: number }[] }
  coverage: { cold: number; atRisk: number; healthy: number; total: number; byMr: { user_id: string; name: string; cold: number; atRisk: number; healthy: number }[] }
  marketShare: { ourValue: number; competitorValue: number; sharePct: number }
}

const MR_NAMES: Record<string, string> = {
  'mr_rahul_001': 'Rahul Sharma',
  'mr_priya_002': 'Priya Patel',
  'mr_robert_003': 'Robert Johnson',
}

const MR_TERRITORIES: Record<string, string> = {
  'mr_rahul_001': 'Mumbai North',
  'mr_priya_002': 'Mumbai South',
  'mr_robert_003': 'Delhi NCR',
}

function SalesDashboard({ onLogout, onBack: _onBack, userName, userEmail, userMobile, onNavigate }: SalesDashboardProps) {
  const { user } = useAuth()
  const isManager = user?.role === 'manager' || user?.role === 'admin'
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'performance' | 'activity'>('performance')
  const [loading, setLoading] = useState(true)

  const [filterMR, setFilterMR] = useState(isManager ? '' : (user?.user_id || ''))
  const [filterPeriod, setFilterPeriod] = useState(() => {
    const d = new Date()
    d.setMonth(d.getMonth() - 1)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  })

  const [performance, setPerformance] = useState<PerformanceRow[]>([])
  const [growth, setGrowth] = useState<GrowthRow[]>([])
  const [activity, setActivity] = useState<ActivityRow[]>([])
  const [summary, setSummary] = useState<SummaryRow[]>([])

  // Scorecard state
  const [scorecard, setScorecard] = useState<ScorecardData | null>(null)


  // Chart refs
  const trendChartRef = useRef<HTMLCanvasElement>(null)
  const targetChartRef = useRef<HTMLCanvasElement>(null)
  const activityChartRef = useRef<HTMLCanvasElement>(null)
  const chartInstances = useRef<Chart[]>([])

  useEffect(() => {
    loadData()
  }, [filterMR, filterPeriod, activeTab])

  // Load scorecard once
  useEffect(() => {
    loadScorecard()
  }, [])

  const loadScorecard = async () => {
    try {
      const res = await apiGet('/sales/execution-scorecard')
      if (res.success) setScorecard(res.data)
    } catch (err) {
      console.error('Failed to load scorecard:', err)
    }
  }

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

  // Draw charts
  useEffect(() => {
    chartInstances.current.forEach(c => c.destroy())
    chartInstances.current = []

    if (loading) return

    if (activeTab === 'performance') {
      drawTrendChart()
      drawTargetChart()
    } else {
      drawActivityChart()
    }
  }, [performance, growth, summary, activity, loading, activeTab])

  const drawTrendChart = () => {
    if (!trendChartRef.current || !growth.length) return

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
            label: 'Revenue',
            data: values,
            borderColor: '#166534',
            backgroundColor: 'rgba(22, 101, 52, 0.08)',
            fill: true,
            tension: 0.4,
            pointRadius: 4,
            pointBackgroundColor: '#166534',
            borderWidth: 2.5,
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.04)' }, ticks: { font: { size: 11 }, callback: (v) => `₹${(Number(v)/1000).toFixed(0)}K` } },
            x: { grid: { display: false }, ticks: { font: { size: 11 } } }
          }
        }
      })
      chartInstances.current.push(chart)
    } else {
      const mrIds = [...new Set(growth.map(g => g.user_id))]
      const colors = [
        { border: '#166534', bg: 'rgba(22, 101, 52, 0.08)' },
        { border: '#2563eb', bg: 'rgba(37, 99, 235, 0.08)' },
        { border: '#dc2626', bg: 'rgba(220, 38, 38, 0.08)' },
      ]
      const datasets = mrIds.map((mrId, i) => ({
        label: MR_NAMES[mrId] || mrId,
        data: periods.map(p => {
          const row = growth.find(g => g.period === p && g.user_id === mrId)
          return row ? parseFloat(row.total_value) : 0
        }),
        borderColor: colors[i % colors.length].border,
        backgroundColor: colors[i % colors.length].bg,
        fill: true,
        tension: 0.4,
        pointRadius: 3,
        pointBackgroundColor: colors[i % colors.length].border,
        borderWidth: 2,
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
          plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, usePointStyle: true, pointStyle: 'circle', font: { size: 11 } } } },
          scales: {
            y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.04)' }, ticks: { font: { size: 11 }, callback: (v) => `₹${(Number(v)/1000).toFixed(0)}K` } },
            x: { grid: { display: false }, ticks: { font: { size: 11 } } }
          }
        }
      })
      chartInstances.current.push(chart)
    }
  }

  const drawTargetChart = () => {
    if (!targetChartRef.current || !performance.length) return

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
        labels: products,
        datasets: [
          { label: 'Target', data: targets, backgroundColor: 'rgba(0,0,0,0.08)', borderColor: 'rgba(0,0,0,0.15)', borderWidth: 1, borderRadius: 4, barPercentage: 0.7 },
          { label: 'Actual', data: actuals, backgroundColor: '#166534', borderColor: '#14532d', borderWidth: 0, borderRadius: 4, barPercentage: 0.7 },
        ]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, usePointStyle: true, pointStyle: 'rect', font: { size: 11 } } } },
        scales: {
          x: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.04)' }, ticks: { font: { size: 10 }, callback: (v) => `₹${(Number(v)/1000).toFixed(0)}K` } },
          y: { grid: { display: false }, ticks: { font: { size: 11 } } }
        }
      }
    })
    chartInstances.current.push(chart)
  }

  const drawActivityChart = () => {
    if (!activityChartRef.current || !activity.length) return

    const labels = activity.map(a => a.name.split(' ')[0])
    const chart = new Chart(activityChartRef.current, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Total Calls',
            data: activity.map(a => a.total_calls),
            backgroundColor: '#2563eb',
            borderRadius: 4,
            barPercentage: 0.6,
          },
          {
            label: 'Sales (₹K)',
            data: activity.map(a => parseFloat(a.total_sales) / 1000),
            backgroundColor: '#166534',
            borderRadius: 4,
            barPercentage: 0.6,
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, usePointStyle: true, pointStyle: 'rect', font: { size: 11 } } } },
        scales: {
          y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.04)' }, ticks: { font: { size: 11 } } },
          x: { grid: { display: false }, ticks: { font: { size: 11 } } }
        }
      }
    })
    chartInstances.current.push(chart)
  }

  // --- Computed KPIs ---
  const totalSales = performance.reduce((sum, p) => sum + parseFloat(p.actual_value), 0)
  const totalTarget = performance.reduce((sum, p) => sum + parseFloat(p.target_value), 0)
  const achievementPct = totalTarget > 0 ? (totalSales / totalTarget) * 100 : 0

  // MoM Growth — filter by selected period
  const periodGrowth = growth.filter(g => g.period === filterPeriod && g.growth_pct !== null)
  const avgGrowth = periodGrowth.length > 0
    ? periodGrowth.reduce((sum, g) => sum + parseFloat(g.growth_pct!), 0) / periodGrowth.length
    : null

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

  // MR ranking
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
      territory: MR_TERRITORIES[mrId] || '',
      sales: data.sales,
      target: data.target,
      achievement: data.target > 0 ? ((data.sales / data.target) * 100) : 0
    }))
    .sort((a, b) => b.achievement - a.achievement)

  // Heatmap data: product (brand level) x MR
  const heatmapData = (() => {
    if (filterMR || !isManager) return null
    const brands = ['Derise', 'Rilast', 'Bevaas']
    const mrIds = [...new Set(performance.map(p => p.user_id))].sort()
    const rows = brands.map(brand => {
      const cols = mrIds.map(mrId => {
        const matching = performance.filter(p => p.user_id === mrId && p.product_name.startsWith(brand))
        const actual = matching.reduce((s, r) => s + parseFloat(r.actual_value), 0)
        const target = matching.reduce((s, r) => s + parseFloat(r.target_value), 0)
        const pct = target > 0 ? (actual / target) * 100 : 0
        return { mrId, actual, target, pct }
      })
      return { brand, cols }
    })
    return { mrIds, rows }
  })()

  const getAchievementColor = (pct: number) => {
    if (pct >= 100) return { bg: '#dcfce7', text: '#166534', dot: '#22c55e' }
    if (pct >= 80) return { bg: '#fef3c7', text: '#92400e', dot: '#f59e0b' }
    return { bg: '#fecaca', text: '#991b1b', dot: '#ef4444' }
  }

  const getHeatmapColor = (pct: number) => {
    if (pct >= 105) return 'rgba(22, 101, 52, 0.85)'
    if (pct >= 95) return 'rgba(34, 197, 94, 0.7)'
    if (pct >= 80) return 'rgba(245, 158, 11, 0.6)'
    if (pct >= 60) return 'rgba(249, 115, 22, 0.6)'
    return 'rgba(239, 68, 68, 0.6)'
  }

  const formatCurrency = (n: number) => `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`

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
    <div className="sd-container">
      <Header onLogout={onLogout} onMenuClick={() => setSidebarOpen(true)} onNavigateHome={() => onNavigate?.('home')} onNavigateOfflineRequests={() => onNavigate?.('offline-requests')} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} userName={userName} userEmail={userEmail} userMobile={userMobile} onNavigate={onNavigate} onLogout={onLogout} currentPage="sales-dashboard" />

      <main className="sd-content">
        {/* Header row */}
        <div className="sd-header">
          <div>
            <h1 className="sd-title">Sales Dashboard</h1>
            <p className="sd-subtitle">
              {new Date(filterPeriod + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              {isManager && !filterMR ? ' — All MRs' : filterMR ? ` — ${MR_NAMES[filterMR] || filterMR}` : ''}
            </p>
          </div>
          <div className="sd-header-actions">
            <button className="sd-export-btn" onClick={handleExport}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M21 15V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V15M7 10L12 15M12 15L17 10M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Export
            </button>
          </div>
        </div>

        {/* Tabs + Filters */}
        <div className="sd-controls">
          <div className="sd-tabs">
            <button className={`sd-tab ${activeTab === 'performance' ? 'active' : ''}`} onClick={() => setActiveTab('performance')}>
              Sales Performance
            </button>
            <button className={`sd-tab ${activeTab === 'activity' ? 'active' : ''}`} onClick={() => setActiveTab('activity')}>
              Activity vs Productivity
            </button>
          </div>
          <div className="sd-filters">
            {isManager && (
              <select className="sd-select" value={filterMR} onChange={e => setFilterMR(e.target.value)}>
                <option value="">All MRs</option>
                {Object.entries(MR_NAMES).map(([id, name]) => (
                  <option key={id} value={id}>{name}</option>
                ))}
              </select>
            )}
            <select className="sd-select" value={filterPeriod} onChange={e => setFilterPeriod(e.target.value)}>
              {periodOptions.map(p => (
                <option key={p} value={p}>{new Date(p + '-01').toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}</option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="sd-loading">
            <div className="sd-spinner" />
            Loading dashboard...
          </div>
        ) : activeTab === 'performance' ? (
          <>
            {/* KPI Cards */}
            <div className="sd-kpi-row">
              <div className="sd-kpi-card">
                <div className="sd-kpi-icon revenue">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 1V23M17 5H9.5C8.57174 5 7.6815 5.36875 7.02513 6.02513C6.36875 6.6815 6 7.57174 6 8.5C6 9.42826 6.36875 10.3185 7.02513 10.9749C7.6815 11.6313 8.57174 12 9.5 12H14.5C15.4283 12 16.3185 12.3687 16.9749 13.0251C17.6313 13.6815 18 14.5717 18 15.5C18 16.4283 17.6313 17.3185 16.9749 17.9749C16.3185 18.6313 15.4283 19 14.5 19H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
                <div className="sd-kpi-body">
                  <span className="sd-kpi-label">{isManager && !filterMR ? 'Team Revenue' : 'Total Revenue'}</span>
                  <span className="sd-kpi-value">{formatCurrency(totalSales)}</span>
                  <span className="sd-kpi-sub">Target: {formatCurrency(totalTarget)}</span>
                </div>
              </div>

              <div className="sd-kpi-card">
                <div className={`sd-kpi-icon ${achievementPct >= 80 ? 'achievement-good' : 'achievement-low'}`}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M22 11.08V12C21.9988 14.1564 21.3005 16.2547 20.0093 17.9818C18.7182 19.709 16.9033 20.9725 14.8354 21.5839C12.7674 22.1953 10.5573 22.1219 8.53447 21.3746C6.51168 20.6273 4.78465 19.2461 3.61096 17.4371C2.43727 15.628 1.87979 13.4881 2.02168 11.3363C2.16356 9.18457 2.99721 7.13633 4.39828 5.49707C5.79935 3.85782 7.69279 2.71538 9.79619 2.24015C11.8996 1.76491 14.1003 1.98234 16.07 2.86" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M22 4L12 14.01L9 11.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
                <div className="sd-kpi-body">
                  <span className="sd-kpi-label">Achievement</span>
                  <span className={`sd-kpi-value ${achievementPct >= 80 ? 'green' : 'red'}`}>{achievementPct.toFixed(1)}%</span>
                  <div className="sd-kpi-progress">
                    <div className="sd-kpi-progress-bar" style={{ width: `${Math.min(achievementPct, 100)}%`, background: achievementPct >= 100 ? '#22c55e' : achievementPct >= 80 ? '#f59e0b' : '#ef4444' }} />
                  </div>
                </div>
              </div>

              <div className="sd-kpi-card">
                <div className={`sd-kpi-icon ${avgGrowth !== null && avgGrowth >= 0 ? 'growth-up' : 'growth-down'}`}>
                  {avgGrowth !== null && avgGrowth >= 0 ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M23 6L13.5 15.5L8.5 10.5L1 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M17 6H23V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M23 18L13.5 8.5L8.5 13.5L1 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M17 18H23V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  )}
                </div>
                <div className="sd-kpi-body">
                  <span className="sd-kpi-label">MoM Growth</span>
                  <span className={`sd-kpi-value ${avgGrowth !== null && avgGrowth >= 0 ? 'green' : 'red'}`}>
                    {avgGrowth !== null ? `${avgGrowth > 0 ? '+' : ''}${avgGrowth.toFixed(1)}%` : '—'}
                  </span>
                  <span className="sd-kpi-sub">vs previous month</span>
                </div>
              </div>

              <div className="sd-kpi-card">
                <div className="sd-kpi-icon top-product">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
                <div className="sd-kpi-body">
                  <span className="sd-kpi-label">Top Product</span>
                  <span className="sd-kpi-value" style={{ fontSize: 18 }}>{topProduct ? topProduct[0] : '—'}</span>
                  <span className="sd-kpi-sub">{topProduct ? formatCurrency(topProduct[1]) : ''}</span>
                </div>
              </div>
            </div>

            {/* Execution Scorecard */}
            {scorecard && (
              <div className="sd-scorecard-row">
                <div className="sd-scorecard-card" onClick={() => onNavigate?.('tasks')}>
                  <div className="sd-scorecard-header">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    <span className="sd-scorecard-label">Overdue Tasks</span>
                  </div>
                  <span className={`sd-scorecard-value ${scorecard.overdueTasks.total > 0 ? 'sd-scorecard-warn' : 'sd-scorecard-ok'}`}>
                    {scorecard.overdueTasks.total}
                  </span>
                  {scorecard.overdueTasks.byMr.length > 0 && (
                    <div className="sd-scorecard-breakdown">
                      {scorecard.overdueTasks.byMr.map(m => (
                        <span key={m.user_id}>{m.name.split(' ')[0]}: {m.count}</span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="sd-scorecard-card">
                  <div className="sd-scorecard-header">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    <span className="sd-scorecard-label">Doctor Coverage</span>
                  </div>
                  <div className="sd-scorecard-coverage">
                    <span className="sd-scorecard-coverage-item sd-cov-healthy">{scorecard.coverage.healthy} healthy</span>
                    <span className="sd-scorecard-coverage-item sd-cov-atrisk">{scorecard.coverage.atRisk} at-risk</span>
                    <span className="sd-scorecard-coverage-item sd-cov-cold">{scorecard.coverage.cold} cold</span>
                  </div>
                  {isManager && scorecard.coverage.byMr.length > 0 && (
                    <div className="sd-scorecard-breakdown">
                      {scorecard.coverage.byMr.map(m => (
                        <span key={m.user_id}>{m.name.split(' ')[0]}: {m.cold}c {m.atRisk}r {m.healthy}h</span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="sd-scorecard-card">
                  <div className="sd-scorecard-header">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" stroke="#a16207" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    <span className="sd-scorecard-label">Market Share (RCPA)</span>
                  </div>
                  <span className={`sd-scorecard-value ${scorecard.marketShare.sharePct >= 50 ? 'sd-scorecard-ok' : 'sd-scorecard-warn'}`}>
                    {scorecard.marketShare.sharePct}%
                  </span>
                  <div className="sd-scorecard-breakdown">
                    <span>Ours: {formatCurrency(scorecard.marketShare.ourValue)}</span>
                    <span>Competitor: {formatCurrency(scorecard.marketShare.competitorValue)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Charts Row */}
            <div className="sd-chart-row">
              <div className="sd-chart-card sd-chart-wide">
                <h3>Revenue Trend</h3>
                <div className="sd-chart-body">
                  <canvas ref={trendChartRef}></canvas>
                </div>
              </div>
              <div className="sd-chart-card sd-chart-wide">
                <h3>Target vs Actual by Product</h3>
                <div className="sd-chart-body" style={{ height: performance.length > 6 ? 320 : 260 }}>
                  <canvas ref={targetChartRef}></canvas>
                </div>
              </div>
            </div>

            {/* Heatmap + Leaderboard Row (Manager only, no filter) */}
            {isManager && !filterMR && heatmapData && (
              <div className="sd-bottom-row">
                <div className="sd-panel">
                  <h3>Product x MR Achievement</h3>
                  <div className="sd-heatmap-wrapper">
                    <table className="sd-heatmap">
                      <thead>
                        <tr>
                          <th>Brand</th>
                          {heatmapData.mrIds.map(id => (
                            <th key={id}>{(MR_NAMES[id] || id).split(' ')[0]}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {heatmapData.rows.map(row => (
                          <tr key={row.brand}>
                            <td className="sd-heatmap-brand">{row.brand}</td>
                            {row.cols.map(col => (
                              <td key={col.mrId}>
                                <div className="sd-heatmap-cell" style={{ backgroundColor: getHeatmapColor(col.pct) }}>
                                  <span className="sd-heatmap-pct">{col.pct.toFixed(0)}%</span>
                                  <span className="sd-heatmap-val">{formatCurrency(col.actual)}</span>
                                </div>
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="sd-heatmap-legend">
                    <span><i style={{background: 'rgba(22,101,52,0.85)'}} /> &gt;105%</span>
                    <span><i style={{background: 'rgba(34,197,94,0.7)'}} /> 95-105%</span>
                    <span><i style={{background: 'rgba(245,158,11,0.6)'}} /> 80-95%</span>
                    <span><i style={{background: 'rgba(249,115,22,0.6)'}} /> 60-80%</span>
                    <span><i style={{background: 'rgba(239,68,68,0.6)'}} /> &lt;60%</span>
                  </div>
                </div>

                <div className="sd-panel">
                  <h3>MR Leaderboard</h3>
                  <div className="sd-leaderboard">
                    {mrRanking.map((mr, i) => {
                      const color = getAchievementColor(mr.achievement)
                      return (
                        <div key={mr.mrId} className="sd-leader-item">
                          <div className="sd-leader-rank" style={{ background: i === 0 ? '#fef3c7' : '#f1f5f9', color: i === 0 ? '#92400e' : '#64748b' }}>
                            {i + 1}
                          </div>
                          <div className="sd-leader-info">
                            <div className="sd-leader-name">{mr.name}</div>
                            <div className="sd-leader-territory">{mr.territory}</div>
                            <div className="sd-leader-bar-track">
                              <div className="sd-leader-bar-fill" style={{ width: `${Math.min(mr.achievement, 110) / 1.1}%`, background: color.dot }} />
                            </div>
                          </div>
                          <div className="sd-leader-stats">
                            <span className="sd-leader-sales">{formatCurrency(mr.sales)}</span>
                            <span className="sd-leader-badge" style={{ background: color.bg, color: color.text }}>
                              {mr.achievement.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

          </>
        ) : (
          /* Activity vs Productivity Tab */
          <>
            {activity.length === 0 ? (
              <div className="sd-loading">No activity data available</div>
            ) : (
              <>
                <div className="sd-panel sd-full-width">
                  <h3>MR Activity Comparison</h3>
                  <div className="sd-table-wrapper">
                    <table className="sd-activity-table">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>MR Name</th>
                          <th>Territory</th>
                          <th>Calls</th>
                          <th>Doctors</th>
                          <th>Coverage</th>
                          <th>Sales (₹)</th>
                          <th>Target (₹)</th>
                          <th>Achievement</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activity.sort((a, b) => parseFloat(b.achievement_pct) - parseFloat(a.achievement_pct)).map((a, i) => {
                          const aPct = parseFloat(a.achievement_pct)
                          const color = getAchievementColor(aPct)
                          return (
                            <tr key={a.user_id}>
                              <td className="sd-rank-cell">{i + 1}</td>
                              <td className="sd-name-cell">{a.name}</td>
                              <td>{a.territory}</td>
                              <td className="sd-num-cell">{a.total_calls}</td>
                              <td className="sd-num-cell">{a.doctors_covered}/{a.total_doctors}</td>
                              <td className="sd-num-cell">{parseFloat(a.coverage_pct).toFixed(0)}%</td>
                              <td className="sd-num-cell">{formatCurrency(parseFloat(a.total_sales))}</td>
                              <td className="sd-num-cell">{formatCurrency(parseFloat(a.total_target))}</td>
                              <td>
                                <span className="sd-achievement-pill" style={{ background: color.bg, color: color.text }}>
                                  <i style={{ background: color.dot }} />
                                  {aPct.toFixed(1)}%
                                </span>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="sd-panel sd-full-width">
                  <h3>Calls vs Sales by MR</h3>
                  <div className="sd-chart-body" style={{ height: 220 }}>
                    <canvas ref={activityChartRef}></canvas>
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </main>
    </div>
  )
}

export default SalesDashboard
