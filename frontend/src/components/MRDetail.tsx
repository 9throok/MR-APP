import { useState, useEffect } from 'react'
import Header from './Header'
import Sidebar from './Sidebar'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, Filler, ArcElement, RadialLinearScale } from 'chart.js'
import { Bar, Line, Pie, Radar } from 'react-chartjs-2'
import { apiGet } from '../services/apiService'
import { useAuth } from '../contexts/AuthContext'
import './MRDetail.css'

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, Filler, ArcElement, RadialLinearScale)

// MR shape returned by /api/users.
interface MR {
  id: number
  user_id: string
  username: string
  email: string | null
  role: string
  name: string
  territory: string | null
  created_at: string | null
}

interface DcrRow {
  id: number
  user_id: string
  name: string  // doctor name
  date: string
  product: string
  call_summary: string | null
  doctor_feedback: string | null
  samples: unknown
}

interface MRDetailProps {
  onLogout: () => void
  onBack: () => void
  userName?: string
  onNavigate?: (page: string) => void
}

function MRDetail({ onLogout, onBack, userName, onNavigate }: MRDetailProps) {
  const { user } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [selectedMR, setSelectedMR] = useState<MR | null>(null)
  const [dcrs, setDcrs] = useState<DcrRow[]>([])
  const [dcrsLoading, setDcrsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'sales' | 'visits' | 'dcr' | 'rcpa' | 'commission'>('overview')

  const isManagerOrAdmin = user?.role === 'manager' || user?.role === 'admin'

  useEffect(() => {
    if (!isManagerOrAdmin) {
      if (onNavigate) onNavigate('home')
      return
    }
    // Restore from sessionStorage if a row was clicked, otherwise no-op.
    try {
      const stored = sessionStorage.getItem('selectedMR')
      if (stored) setSelectedMR(JSON.parse(stored))
    } catch (error) {
      console.error('Error loading MR data:', error)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isManagerOrAdmin])

  // Pull this MR's DCRs and recent orders so the Visits/DCR tabs aren't
  // empty. The dashboards (sales/commission) stay hardcoded for now —
  // analytics aggregation is a future phase.
  useEffect(() => {
    if (!selectedMR) return
    let cancelled = false
    const loadActivity = async () => {
      setDcrsLoading(true)
      try {
        const res = await apiGet(`/dcr?user_id=${encodeURIComponent(selectedMR.user_id)}`)
        if (!cancelled) setDcrs((res.data || []).slice(0, 50))
      } catch (err) {
        console.warn('[MRDetail] DCR load error:', err)
      } finally {
        if (!cancelled) setDcrsLoading(false)
      }
    }
    loadActivity()
    return () => { cancelled = true }
  }, [selectedMR])

  const handleMenuClick = () => {
    setSidebarOpen(true)
  }

  const handleSidebarClose = () => {
    setSidebarOpen(false)
  }

  // Get current and previous month names
  const getCurrentMonth = () => {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
    const now = new Date()
    const currentMonth = months[now.getMonth()]
    const previousMonth = months[(now.getMonth() - 1 + 12) % 12]
    return { currentMonth, previousMonth }
  }

  const { currentMonth, previousMonth } = getCurrentMonth()

  // Generate commission data for previous 6 months (excluding current month)
  const generateCommissionData = () => {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
    const now = new Date()
    const currentMonthIndex = now.getMonth()
    const currentYear = now.getFullYear()
    
    // Sample commission data
    const sampleData = [
      { sales: 125000, target: 150000, achievement: 83.3, commissionRate: 5.0, commissionAmount: 6250, bonus: 0 },
      { sales: 145000, target: 150000, achievement: 96.7, commissionRate: 5.5, commissionAmount: 7975, bonus: 1000 },
      { sales: 160000, target: 150000, achievement: 106.7, commissionRate: 6.0, commissionAmount: 9600, bonus: 2000 },
      { sales: 138000, target: 150000, achievement: 92.0, commissionRate: 5.0, commissionAmount: 6900, bonus: 500 },
      { sales: 142000, target: 150000, achievement: 94.7, commissionRate: 5.5, commissionAmount: 7810, bonus: 1000 },
      { sales: 148000, target: 150000, achievement: 98.7, commissionRate: 5.5, commissionAmount: 8140, bonus: 1500 },
      { sales: 152000, target: 150000, achievement: 101.3, commissionRate: 6.0, commissionAmount: 9120, bonus: 2000 },
      { sales: 155000, target: 150000, achievement: 103.3, commissionRate: 6.0, commissionAmount: 9300, bonus: 2500 },
      { sales: 150000, target: 150000, achievement: 100.0, commissionRate: 5.5, commissionAmount: 8250, bonus: 1500 },
      { sales: 158000, target: 150000, achievement: 105.3, commissionRate: 6.0, commissionAmount: 9480, bonus: 3000 },
      { sales: 162000, target: 150000, achievement: 108.0, commissionRate: 6.5, commissionAmount: 10530, bonus: 3500 },
      { sales: 165000, target: 150000, achievement: 110.0, commissionRate: 7.0, commissionAmount: 11550, bonus: 4000 },
    ]
    
    // Get previous 6 months (excluding current month)
    const commissionData = []
    for (let i = 6; i >= 1; i--) {
      const monthIndex = (currentMonthIndex - i + 12) % 12
      const year = currentMonthIndex - i < 0 ? currentYear - 1 : currentYear
      const monthName = months[monthIndex]
      const dataIndex = (currentMonthIndex - i + 12) % 12
      const data = sampleData[dataIndex] || sampleData[0]
      
      commissionData.push({
        month: `${monthName} ${year}`,
        sales: data.sales,
        target: data.target,
        achievement: data.achievement,
        commissionRate: data.commissionRate,
        commissionAmount: data.commissionAmount,
        status: 'Achieved',
        bonus: data.bonus,
        totalEarning: data.commissionAmount + data.bonus
      })
    }
    
    return commissionData
  }

  // Overview data with comparisons
  const overviewData = {
    sales: {
      current: 568000,
      previous: 520000,
      target: 600000,
      achievement: 94.7
    },
    visits: {
      current: 24,
      previous: 20,
      target: 30,
      achievement: 80.0
    },
    dcr: {
      current: 18,
      previous: 15,
      target: 22,
      achievement: 81.8
    },
    rcpa: {
      current: 12,
      previous: 10,
      target: 15,
      achievement: 80.0
    }
  }

  // Chart data for Sales - Pie chart showing achievement breakdown
  const salesChartData = {
    labels: ['Achieved', 'Remaining to Target'],
    datasets: [
      {
        label: 'Sales Achievement',
        data: [
          overviewData.sales.current,
          Math.max(0, overviewData.sales.target - overviewData.sales.current)
        ],
        backgroundColor: [
          'rgba(76, 175, 80, 0.8)',
          'rgba(255, 152, 0, 0.6)'
        ],
        borderColor: [
          'rgba(76, 175, 80, 1)',
          'rgba(255, 152, 0, 1)'
        ],
        borderWidth: 2,
      },
    ],
  }

  const salesChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 15,
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const label = context.label || ''
            const value = context.parsed || 0
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0)
            const percentage = ((value / total) * 100).toFixed(1)
            return `${label}: ₹${value.toLocaleString()} (${percentage}%)`
          }
        }
      }
    }
  }

  // Chart data for Visits - Line chart showing trend
  const visitsChartData = {
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
    datasets: [
      {
        label: 'Current Month',
        data: [5, 6, 7, 6],
        borderColor: 'rgba(76, 175, 80, 1)',
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Previous Month',
        data: [4, 5, 6, 5],
        borderColor: 'rgba(156, 39, 176, 1)',
        backgroundColor: 'rgba(156, 39, 176, 0.1)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Target',
        data: [7.5, 7.5, 7.5, 7.5],
        borderColor: 'rgba(255, 152, 0, 1)',
        backgroundColor: 'transparent',
        borderDash: [5, 5],
        fill: false,
      },
    ],
  }

  const visitsChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      }
    }
  }

  // Chart data for DCR Submissions - Bar chart
  const dcrChartData = {
    labels: [previousMonth, currentMonth, 'Target'],
    datasets: [
      {
        label: 'DCR Submissions',
        data: [overviewData.dcr.previous, overviewData.dcr.current, overviewData.dcr.target],
        backgroundColor: [
          'rgba(156, 39, 176, 0.6)',
          'rgba(76, 175, 80, 0.8)',
          'rgba(255, 152, 0, 0.6)'
        ],
        borderColor: [
          'rgba(156, 39, 176, 1)',
          'rgba(76, 175, 80, 1)',
          'rgba(255, 152, 0, 1)'
        ],
        borderWidth: 2,
      },
    ],
  }

  const dcrChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      }
    }
  }

  // Chart data for RCPA Entries - Radar chart (NEW CHART TYPE) showing performance across all metrics
  const rcpaChartData = {
    labels: ['Sales', 'Visits', 'DCR', 'RCPA'],
    datasets: [
      {
        label: 'Current Month Achievement %',
        data: [
          overviewData.sales.achievement,
          overviewData.visits.achievement,
          overviewData.dcr.achievement,
          overviewData.rcpa.achievement
        ],
        backgroundColor: 'rgba(76, 175, 80, 0.2)',
        borderColor: 'rgba(76, 175, 80, 1)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(76, 175, 80, 1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(76, 175, 80, 1)',
      },
      {
        label: 'Previous Month Achievement %',
        data: [
          (overviewData.sales.previous / overviewData.sales.target) * 100,
          (overviewData.visits.previous / overviewData.visits.target) * 100,
          (overviewData.dcr.previous / overviewData.dcr.target) * 100,
          (overviewData.rcpa.previous / overviewData.rcpa.target) * 100
        ],
        backgroundColor: 'rgba(156, 39, 176, 0.2)',
        borderColor: 'rgba(156, 39, 176, 1)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(156, 39, 176, 1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(156, 39, 176, 1)',
      },
    ],
  }

  const rcpaChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 15,
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            return `${context.dataset.label}: ${context.parsed.r.toFixed(1)}%`
          }
        }
      }
    },
    scales: {
      r: {
        beginAtZero: true,
        max: 120,
        ticks: {
          stepSize: 20,
          callback: function(value: any) {
            return value + '%'
          }
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        },
        pointLabels: {
          font: {
            size: 12
          }
        }
      }
    }
  }

  // Sales summary stays hardcoded — there's no per-MR sales dashboard endpoint
  // surfaced here yet (manager-side aggregation is a future analytics phase).
  // TODO: derive from /api/sales/performance once available per-user.
  const salesData = [
    { month: 'January', sales: 125000, target: 150000, achievement: 83.3 },
    { month: 'February', sales: 145000, target: 150000, achievement: 96.7 },
    { month: 'March', sales: 160000, target: 150000, achievement: 106.7 },
    { month: 'April', sales: 138000, target: 150000, achievement: 92.0 },
  ]

  // Visits + DCR tabs derive from the MR's actual DCR feed.
  const visitData = dcrs.map(d => ({
    date: d.date,
    doctor: d.name,
    type: 'Doctor',
    status: 'Completed',
  }))

  const dcrData = dcrs.map(d => ({
    date: d.date,
    doctor: d.name,
    products: d.product,
    samples: '-',
    status: 'Submitted',
  }))

  // RCPA tab still placeholder — could derive from /api/rcpa filtered by user_id
  // in a follow-up; today the endpoint isn't user-scoped at the read layer.
  const rcpaData = [
    { date: new Date().toISOString(), doctor: '-', product: '-', quantity: 0, status: 'Awaiting RCPA endpoint per user' },
  ]

  // Commission data by month - previous months of current year only
  const commissionData = generateCommissionData()

  // Commission chart data
  const commissionChartData = {
    labels: commissionData.map(item => item.month.split(' ')[0]),
    datasets: [
      {
        label: 'Commission Earned (₹)',
        data: commissionData.map(item => item.commissionAmount),
        backgroundColor: 'rgba(76, 175, 80, 0.8)',
        borderColor: 'rgba(76, 175, 80, 1)',
        borderWidth: 2,
      },
      {
        label: 'Total Earning (₹)',
        data: commissionData.map(item => item.totalEarning),
        backgroundColor: 'rgba(33, 150, 243, 0.8)',
        borderColor: 'rgba(33, 150, 243, 1)',
        borderWidth: 2,
      },
    ],
  }

  const commissionChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            return `${context.dataset.label}: ₹${context.parsed.y.toLocaleString()}`
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value: any) {
            return '₹' + (value / 1000) + 'K'
          }
        }
      }
    }
  }

  // Calculate total commission
  const totalCommission = commissionData.reduce((sum, item) => sum + item.commissionAmount, 0)
  const totalBonus = commissionData.reduce((sum, item) => sum + item.bonus, 0)
  const totalEarning = commissionData.reduce((sum, item) => sum + item.totalEarning, 0)
  const achievedMonths = commissionData.filter(item => item.status === 'Achieved').length

  if (!isManagerOrAdmin) return null

  if (!selectedMR) {
    return (
      <div className="mr-detail-container">
        <Header onLogout={onLogout} onMenuClick={handleMenuClick} onNavigateHome={() => onNavigate?.('home')} onNavigateOfflineRequests={() => onNavigate?.('offline-requests')} />
        <Sidebar isOpen={sidebarOpen} onClose={handleSidebarClose} userName={userName} onNavigate={onNavigate} onLogout={onLogout} />
        <main className="mr-detail-content">
          <div className="error-message">
            <p>MR data not found. Please go back and select an MR.</p>
            <button className="back-btn" onClick={onBack}>Go Back</button>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="mr-detail-container">
      <Header onLogout={onLogout} onMenuClick={handleMenuClick} onNavigateHome={() => onNavigate?.('home')} onNavigateOfflineRequests={() => onNavigate?.('offline-requests')} />
      <Sidebar isOpen={sidebarOpen} onClose={handleSidebarClose} userName={userName} onNavigate={onNavigate} onLogout={onLogout} />
      <main className="mr-detail-content">
        <div className="mr-detail-header">
          <button className="back-button" onClick={onBack} aria-label="Go back">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div className="header-info">
            <h1 className="mr-detail-title">{selectedMR.name}</h1>
            <p className="mr-detail-subtitle">{selectedMR.role.toUpperCase()} • {selectedMR.territory || 'No territory'}</p>
          </div>
        </div>

        <div className="mr-info-card">
          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">User ID</span>
              <span className="info-value">{selectedMR.user_id}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Username</span>
              <span className="info-value">{selectedMR.username}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Email</span>
              <span className="info-value">{selectedMR.email || '-'}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Joined</span>
              <span className="info-value">{selectedMR.created_at ? new Date(selectedMR.created_at).toLocaleDateString('en-GB') : '-'}</span>
            </div>
          </div>
        </div>

        <div className="tabs-container">
          <div className="tabs">
            <button
              className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              Overview
            </button>
            <button
              className={`tab ${activeTab === 'sales' ? 'active' : ''}`}
              onClick={() => setActiveTab('sales')}
            >
              Sales Report
            </button>
            <button
              className={`tab ${activeTab === 'visits' ? 'active' : ''}`}
              onClick={() => setActiveTab('visits')}
            >
              Customer Visits
            </button>
            <button
              className={`tab ${activeTab === 'dcr' ? 'active' : ''}`}
              onClick={() => setActiveTab('dcr')}
            >
              DCR Submissions
            </button>
            <button
              className={`tab ${activeTab === 'rcpa' ? 'active' : ''}`}
              onClick={() => setActiveTab('rcpa')}
            >
              RCPA Report
            </button>
            <button
              className={`tab ${activeTab === 'commission' ? 'active' : ''}`}
              onClick={() => setActiveTab('commission')}
            >
              Commission
            </button>
          </div>
        </div>

        <div className="tab-content">
          {activeTab === 'overview' && (
            <div className="overview-section">
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon">💰</div>
                  <div className="stat-info">
                    <span className="stat-label">Total Sales</span>
                    <span className="stat-value">₹{overviewData.sales.current.toLocaleString()}</span>
                    <div className="stat-comparison">
                      <span className={`comparison-badge ${overviewData.sales.current >= overviewData.sales.previous ? 'positive' : 'negative'}`}>
                        {overviewData.sales.current >= overviewData.sales.previous ? '↑' : '↓'} {Math.abs(((overviewData.sales.current - overviewData.sales.previous) / overviewData.sales.previous) * 100).toFixed(1)}%
                      </span>
                      <span className="comparison-text">vs {previousMonth}</span>
                    </div>
                    <div className="stat-target">
                      <span className="target-label">Target: ₹{overviewData.sales.target.toLocaleString()}</span>
                      <span className={`achievement-badge ${overviewData.sales.achievement >= 100 ? 'exceeded' : overviewData.sales.achievement >= 80 ? 'good' : 'low'}`}>
                        {overviewData.sales.achievement.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">👥</div>
                  <div className="stat-info">
                    <span className="stat-label">Total Visits</span>
                    <span className="stat-value">{overviewData.visits.current}</span>
                    <div className="stat-comparison">
                      <span className={`comparison-badge ${overviewData.visits.current >= overviewData.visits.previous ? 'positive' : 'negative'}`}>
                        {overviewData.visits.current >= overviewData.visits.previous ? '↑' : '↓'} {Math.abs(((overviewData.visits.current - overviewData.visits.previous) / overviewData.visits.previous) * 100).toFixed(1)}%
                      </span>
                      <span className="comparison-text">vs {previousMonth}</span>
                    </div>
                    <div className="stat-target">
                      <span className="target-label">Target: {overviewData.visits.target}</span>
                      <span className={`achievement-badge ${overviewData.visits.achievement >= 100 ? 'exceeded' : overviewData.visits.achievement >= 80 ? 'good' : 'low'}`}>
                        {overviewData.visits.achievement.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">📋</div>
                  <div className="stat-info">
                    <span className="stat-label">DCR Submissions</span>
                    <span className="stat-value">{overviewData.dcr.current}</span>
                    <div className="stat-comparison">
                      <span className={`comparison-badge ${overviewData.dcr.current >= overviewData.dcr.previous ? 'positive' : 'negative'}`}>
                        {overviewData.dcr.current >= overviewData.dcr.previous ? '↑' : '↓'} {Math.abs(((overviewData.dcr.current - overviewData.dcr.previous) / overviewData.dcr.previous) * 100).toFixed(1)}%
                      </span>
                      <span className="comparison-text">vs {previousMonth}</span>
                    </div>
                    <div className="stat-target">
                      <span className="target-label">Target: {overviewData.dcr.target}</span>
                      <span className={`achievement-badge ${overviewData.dcr.achievement >= 100 ? 'exceeded' : overviewData.dcr.achievement >= 80 ? 'good' : 'low'}`}>
                        {overviewData.dcr.achievement.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">📊</div>
                  <div className="stat-info">
                    <span className="stat-label">RCPA Entries</span>
                    <span className="stat-value">{overviewData.rcpa.current}</span>
                    <div className="stat-comparison">
                      <span className={`comparison-badge ${overviewData.rcpa.current >= overviewData.rcpa.previous ? 'positive' : 'negative'}`}>
                        {overviewData.rcpa.current >= overviewData.rcpa.previous ? '↑' : '↓'} {Math.abs(((overviewData.rcpa.current - overviewData.rcpa.previous) / overviewData.rcpa.previous) * 100).toFixed(1)}%
                      </span>
                      <span className="comparison-text">vs {previousMonth}</span>
                    </div>
                    <div className="stat-target">
                      <span className="target-label">Target: {overviewData.rcpa.target}</span>
                      <span className={`achievement-badge ${overviewData.rcpa.achievement >= 100 ? 'exceeded' : overviewData.rcpa.achievement >= 80 ? 'good' : 'low'}`}>
                        {overviewData.rcpa.achievement.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="charts-grid">
                <div className="chart-card">
                  <h3 className="chart-title">Sales Achievement (Pie Chart)</h3>
                  <div className="chart-wrapper">
                    <Pie data={salesChartData} options={salesChartOptions} />
                  </div>
                </div>

                <div className="chart-card">
                  <h3 className="chart-title">Visits Trend (Line Chart)</h3>
                  <div className="chart-wrapper">
                    <Line data={visitsChartData} options={visitsChartOptions} />
                  </div>
                </div>

                <div className="chart-card">
                  <h3 className="chart-title">DCR Submissions Comparison (Bar Chart)</h3>
                  <div className="chart-wrapper">
                    <Bar data={dcrChartData} options={dcrChartOptions} />
                  </div>
                  <div className="chart-legend">
                    <div className="legend-item">
                      <span className="legend-color" style={{ backgroundColor: 'rgba(156, 39, 176, 0.8)' }}></span>
                      <span>{previousMonth}</span>
                    </div>
                    <div className="legend-item">
                      <span className="legend-color" style={{ backgroundColor: 'rgba(76, 175, 80, 0.8)' }}></span>
                      <span>{currentMonth}</span>
                    </div>
                    <div className="legend-item">
                      <span className="legend-color" style={{ backgroundColor: 'rgba(255, 152, 0, 0.8)' }}></span>
                      <span>Target</span>
                    </div>
                  </div>
                </div>

                <div className="chart-card">
                  <h3 className="chart-title">Performance Overview (Radar Chart)</h3>
                  <p className="chart-subtitle">Comparing achievement % across all metrics</p>
                  <div className="chart-wrapper">
                    <Radar data={rcpaChartData} options={rcpaChartOptions} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'sales' && (
            <div className="report-section">
              <div className="report-table-container">
                <table className="report-table">
                  <thead>
                    <tr>
                      <th>Month</th>
                      <th>Sales (₹)</th>
                      <th>Target (₹)</th>
                      <th>Achievement %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {salesData.map((row, index) => (
                      <tr key={index}>
                        <td>{row.month}</td>
                        <td>₹{row.sales.toLocaleString()}</td>
                        <td>₹{row.target.toLocaleString()}</td>
                        <td>
                          <span className={`achievement ${row.achievement >= 100 ? 'exceeded' : row.achievement >= 80 ? 'good' : 'low'}`}>
                            {row.achievement.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'visits' && (
            <div className="report-section">
              <div className="report-table-container">
                {dcrsLoading ? (
                  <p style={{ padding: 16, color: '#64748b' }}>Loading visits…</p>
                ) : visitData.length === 0 ? (
                  <p style={{ padding: 16, color: '#64748b' }}>No customer visits recorded yet.</p>
                ) : (
                  <table className="report-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Customer Name</th>
                        <th>Type</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visitData.map((row, index) => (
                        <tr key={index}>
                          <td>{new Date(row.date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}</td>
                          <td>{row.doctor}</td>
                          <td>{row.type}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {activeTab === 'dcr' && (
            <div className="report-section">
              <div className="report-table-container">
                {dcrsLoading ? (
                  <p style={{ padding: 16, color: '#64748b' }}>Loading DCRs…</p>
                ) : dcrData.length === 0 ? (
                  <p style={{ padding: 16, color: '#64748b' }}>No DCRs submitted by this MR yet.</p>
                ) : (
                  <table className="report-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Doctor/Customer</th>
                        <th>Products Discussed</th>
                        <th>Samples Given</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dcrData.map((row, index) => (
                        <tr key={index}>
                          <td>{new Date(row.date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}</td>
                          <td>{row.doctor}</td>
                          <td>{row.products}</td>
                          <td>{row.samples}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {activeTab === 'rcpa' && (
            <div className="report-section">
              <div className="report-table-container">
                <table className="report-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Doctor</th>
                      <th>Product</th>
                      <th>Quantity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rcpaData.map((row, index) => (
                      <tr key={index}>
                        <td>{new Date(row.date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}</td>
                        <td>{row.doctor}</td>
                        <td>{row.product}</td>
                        <td>{row.quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'commission' && (
            <div className="report-section">
              <div className="commission-summary">
                <div className="summary-card">
                  <div className="summary-icon">💰</div>
                  <div className="summary-content">
                    <span className="summary-label">Total Commission</span>
                    <span className="summary-value">₹{totalCommission.toLocaleString()}</span>
                  </div>
                </div>
                <div className="summary-card">
                  <div className="summary-icon">🎁</div>
                  <div className="summary-content">
                    <span className="summary-label">Total Bonus</span>
                    <span className="summary-value">₹{totalBonus.toLocaleString()}</span>
                  </div>
                </div>
                <div className="summary-card">
                  <div className="summary-icon">💵</div>
                  <div className="summary-content">
                    <span className="summary-label">Total Earning</span>
                    <span className="summary-value">₹{totalEarning.toLocaleString()}</span>
                  </div>
                </div>
                <div className="summary-card">
                  <div className="summary-icon">📅</div>
                  <div className="summary-content">
                    <span className="summary-label">Months Achieved</span>
                    <span className="summary-value">{achievedMonths}/{commissionData.length}</span>
                  </div>
                </div>
              </div>

              <div className="commission-chart-card">
                <h3 className="chart-title">Commission Trend</h3>
                <div className="chart-wrapper">
                  <Bar data={commissionChartData} options={commissionChartOptions} />
                </div>
              </div>

              <div className="report-table-container">
                <table className="report-table">
                  <thead>
                    <tr>
                      <th>Month</th>
                      <th>Target (₹)</th>
                      <th>Sales (₹)</th>
                      <th>Achievement %</th>
                      <th>Commission Rate</th>
                      <th>Commission (₹)</th>
                      <th>Bonus (₹)</th>
                      <th>Total Earning (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {commissionData.map((row, index) => (
                      <tr key={index}>
                        <td><strong>{row.month}</strong></td>
                        <td>₹{row.target.toLocaleString()}</td>
                        <td>₹{row.sales.toLocaleString()}</td>
                        <td>
                          <span className={`achievement ${row.achievement >= 100 ? 'exceeded' : row.achievement >= 80 ? 'good' : 'low'}`}>
                            {row.achievement.toFixed(1)}%
                          </span>
                        </td>
                        <td>{row.commissionRate}%</td>
                        <td><strong>₹{row.commissionAmount.toLocaleString()}</strong></td>
                        <td>
                          {row.bonus > 0 ? (
                            <span className="bonus-badge">+₹{row.bonus.toLocaleString()}</span>
                          ) : (
                            <span className="no-bonus">-</span>
                          )}
                        </td>
                        <td><strong className="total-earning">₹{row.totalEarning.toLocaleString()}</strong></td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="total-row">
                      <td colSpan={5}><strong>Total</strong></td>
                      <td><strong>₹{totalCommission.toLocaleString()}</strong></td>
                      <td><strong>₹{totalBonus.toLocaleString()}</strong></td>
                      <td><strong className="total-earning">₹{totalEarning.toLocaleString()}</strong></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default MRDetail
