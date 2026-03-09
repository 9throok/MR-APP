import { useState, useEffect } from 'react'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, Filler, ArcElement, RadialLinearScale } from 'chart.js'
import { Bar, Line, Pie, Radar } from 'react-chartjs-2'
import {
  PAGE_CONTENT,
  PAGE_TITLE,
  PAGE_SUBTITLE,
  BACK_BUTTON,
  CARD,
  CARD_PADDING,
  TAB_CONTAINER,
  TAB_ACTIVE,
  TAB_ITEM,
  STAT_CARD,
  STAT_VALUE,
  STAT_LABEL,
  BADGE_SUCCESS,
  BADGE_DANGER,
  BADGE_DEFAULT,
  TABLE_WRAPPER,
  TABLE,
  TABLE_HEAD,
  TABLE_TH,
  TABLE_TD,
  TABLE_ROW,
} from '../styles/designSystem'

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, Filler, ArcElement, RadialLinearScale)

interface MR {
  id: string
  empId: string
  name: string
  email: string
  mobile: string
  designation: string
  region: string
  status: 'Active' | 'Inactive'
}

interface MRDetailProps {
  onLogout: () => void
  onBack: () => void
  userName?: string
  onNavigate?: (page: string) => void
}

function MRDetail({ onLogout: _onLogout, onBack, userName: _userName, onNavigate: _onNavigate }: MRDetailProps) {
  const [selectedMR, setSelectedMR] = useState<MR | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'sales' | 'visits' | 'dcr' | 'rcpa' | 'commission'>('overview')

  useEffect(() => {
    // Get MR data from sessionStorage
    try {
      const stored = sessionStorage.getItem('selectedMR')
      if (stored) {
        setSelectedMR(JSON.parse(stored))
      }
    } catch (error) {
      console.error('Error loading MR data:', error)
    }
  }, [])

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
          'rgba(79, 70, 229, 0.8)',
          'rgba(255, 152, 0, 0.6)'
        ],
        borderColor: [
          'rgba(79, 70, 229, 1)',
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
        borderColor: 'rgba(79, 70, 229, 1)',
        backgroundColor: 'rgba(79, 70, 229, 0.1)',
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
          'rgba(79, 70, 229, 0.8)',
          'rgba(255, 152, 0, 0.6)'
        ],
        borderColor: [
          'rgba(156, 39, 176, 1)',
          'rgba(79, 70, 229, 1)',
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
        backgroundColor: 'rgba(79, 70, 229, 0.2)',
        borderColor: 'rgba(79, 70, 229, 1)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(79, 70, 229, 1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(79, 70, 229, 1)',
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

  // Mock data for reports
  const salesData = [
    { month: 'January', sales: 125000, target: 150000, achievement: 83.3 },
    { month: 'February', sales: 145000, target: 150000, achievement: 96.7 },
    { month: 'March', sales: 160000, target: 150000, achievement: 106.7 },
    { month: 'April', sales: 138000, target: 150000, achievement: 92.0 },
  ]

  const visitData = [
    { date: '2024-01-15', doctor: 'Dr. Anil Doshi', type: 'Doctor', status: 'Completed' },
    { date: '2024-01-16', doctor: 'MedPlus Pharmacy', type: 'Pharmacy', status: 'Completed' },
    { date: '2024-01-17', doctor: 'Dr. Navin Chaddha', type: 'Doctor', status: 'Completed' },
    { date: '2024-01-18', doctor: 'Apollo Pharmacy', type: 'Pharmacy', status: 'Pending' },
  ]

  const dcrData = [
    { date: '2024-01-15', doctor: 'Dr. Anil Doshi', products: 'Derise 10mg, Rilast Tablet', samples: 'Sample A', status: 'Submitted' },
    { date: '2024-01-16', doctor: 'MedPlus Pharmacy', products: 'Bevaas 5mg', samples: 'Sample B', status: 'Submitted' },
    { date: '2024-01-17', doctor: 'Dr. Navin Chaddha', products: 'Derise 20mg', samples: 'Sample C', status: 'Submitted' },
  ]

  const rcpaData = [
    { date: '2024-01-15', doctor: 'Dr. Anil Doshi', product: 'Derise 10mg', quantity: 50, status: 'Approved' },
    { date: '2024-01-20', doctor: 'Dr. Navin Chaddha', product: 'Rilast Tablet', quantity: 30, status: 'Pending' },
    { date: '2024-01-25', doctor: 'Dr. Surbhi Rel', product: 'Bevaas 10mg', quantity: 40, status: 'Approved' },
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
        backgroundColor: 'rgba(79, 70, 229, 0.8)',
        borderColor: 'rgba(79, 70, 229, 1)',
        borderWidth: 2,
      },
      {
        label: 'Total Earning (₹)',
        data: commissionData.map(item => item.totalEarning),
        backgroundColor: 'rgba(129, 140, 248, 0.8)',
        borderColor: 'rgba(99, 102, 241, 1)',
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

  const getAchievementClasses = (value: number) => {
    if (value >= 100) return 'text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full text-xs font-medium'
    if (value >= 80) return 'text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full text-xs font-medium'
    return 'text-red-700 bg-red-50 px-2 py-0.5 rounded-full text-xs font-medium'
  }

  if (!selectedMR) {
    return (
      <div className="flex-1 bg-slate-50 min-h-screen">
        <main className={PAGE_CONTENT}>
          <div className="text-red-600 bg-red-50 rounded-lg px-4 py-3">
            <p>MR data not found. Please go back and select an MR.</p>
            <button className={`${BACK_BUTTON} mt-3`} onClick={onBack}>Go Back</button>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex-1 bg-slate-50 min-h-screen">
      <main className={PAGE_CONTENT}>
        <div className="flex items-center gap-3 mb-6">
          <button className={BACK_BUTTON} onClick={onBack} aria-label="Go back">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div>
            <h1 className={PAGE_TITLE}>{selectedMR.name}</h1>
            <p className={PAGE_SUBTITLE}>{selectedMR.designation} &bull; {selectedMR.region}</p>
          </div>
        </div>

        <div className={`${CARD} ${CARD_PADDING} mb-6`}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Employee ID</span>
              <span className="text-sm text-slate-700 mt-1 block">{selectedMR.empId}</span>
            </div>
            <div>
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Email</span>
              <span className="text-sm text-slate-700 mt-1 block">{selectedMR.email}</span>
            </div>
            <div>
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Mobile</span>
              <span className="text-sm text-slate-700 mt-1 block">{selectedMR.mobile}</span>
            </div>
            {/* Status removed from MR view as requested */}
          </div>
        </div>

        <div className={TAB_CONTAINER}>
          <button
            className={activeTab === 'overview' ? TAB_ACTIVE : TAB_ITEM}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button
            className={activeTab === 'sales' ? TAB_ACTIVE : TAB_ITEM}
            onClick={() => setActiveTab('sales')}
          >
            Sales Report
          </button>
          <button
            className={activeTab === 'visits' ? TAB_ACTIVE : TAB_ITEM}
            onClick={() => setActiveTab('visits')}
          >
            Customer Visits
          </button>
          <button
            className={activeTab === 'dcr' ? TAB_ACTIVE : TAB_ITEM}
            onClick={() => setActiveTab('dcr')}
          >
            DCR Submissions
          </button>
          <button
            className={activeTab === 'rcpa' ? TAB_ACTIVE : TAB_ITEM}
            onClick={() => setActiveTab('rcpa')}
          >
            RCPA Report
          </button>
          <button
            className={activeTab === 'commission' ? TAB_ACTIVE : TAB_ITEM}
            onClick={() => setActiveTab('commission')}
          >
            Commission
          </button>
        </div>

        <div>
          {activeTab === 'overview' && (
            <div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className={STAT_CARD}>
                  <div className="text-2xl mb-2">💰</div>
                  <div>
                    <span className={STAT_LABEL}>Total Sales</span>
                    <span className={`${STAT_VALUE} block`}>₹{overviewData.sales.current.toLocaleString()}</span>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={overviewData.sales.current >= overviewData.sales.previous ? BADGE_SUCCESS : BADGE_DANGER}>
                        {overviewData.sales.current >= overviewData.sales.previous ? '↑' : '↓'} {Math.abs(((overviewData.sales.current - overviewData.sales.previous) / overviewData.sales.previous) * 100).toFixed(1)}%
                      </span>
                      <span className="text-xs text-slate-400">vs {previousMonth}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-slate-400">Target: ₹{overviewData.sales.target.toLocaleString()}</span>
                      <span className={getAchievementClasses(overviewData.sales.achievement)}>
                        {overviewData.sales.achievement.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
                <div className={STAT_CARD}>
                  <div className="text-2xl mb-2">👥</div>
                  <div>
                    <span className={STAT_LABEL}>Total Visits</span>
                    <span className={`${STAT_VALUE} block`}>{overviewData.visits.current}</span>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={overviewData.visits.current >= overviewData.visits.previous ? BADGE_SUCCESS : BADGE_DANGER}>
                        {overviewData.visits.current >= overviewData.visits.previous ? '↑' : '↓'} {Math.abs(((overviewData.visits.current - overviewData.visits.previous) / overviewData.visits.previous) * 100).toFixed(1)}%
                      </span>
                      <span className="text-xs text-slate-400">vs {previousMonth}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-slate-400">Target: {overviewData.visits.target}</span>
                      <span className={getAchievementClasses(overviewData.visits.achievement)}>
                        {overviewData.visits.achievement.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
                <div className={STAT_CARD}>
                  <div className="text-2xl mb-2">📋</div>
                  <div>
                    <span className={STAT_LABEL}>DCR Submissions</span>
                    <span className={`${STAT_VALUE} block`}>{overviewData.dcr.current}</span>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={overviewData.dcr.current >= overviewData.dcr.previous ? BADGE_SUCCESS : BADGE_DANGER}>
                        {overviewData.dcr.current >= overviewData.dcr.previous ? '↑' : '↓'} {Math.abs(((overviewData.dcr.current - overviewData.dcr.previous) / overviewData.dcr.previous) * 100).toFixed(1)}%
                      </span>
                      <span className="text-xs text-slate-400">vs {previousMonth}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-slate-400">Target: {overviewData.dcr.target}</span>
                      <span className={getAchievementClasses(overviewData.dcr.achievement)}>
                        {overviewData.dcr.achievement.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
                <div className={STAT_CARD}>
                  <div className="text-2xl mb-2">📊</div>
                  <div>
                    <span className={STAT_LABEL}>RCPA Entries</span>
                    <span className={`${STAT_VALUE} block`}>{overviewData.rcpa.current}</span>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={overviewData.rcpa.current >= overviewData.rcpa.previous ? BADGE_SUCCESS : BADGE_DANGER}>
                        {overviewData.rcpa.current >= overviewData.rcpa.previous ? '↑' : '↓'} {Math.abs(((overviewData.rcpa.current - overviewData.rcpa.previous) / overviewData.rcpa.previous) * 100).toFixed(1)}%
                      </span>
                      <span className="text-xs text-slate-400">vs {previousMonth}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-slate-400">Target: {overviewData.rcpa.target}</span>
                      <span className={getAchievementClasses(overviewData.rcpa.achievement)}>
                        {overviewData.rcpa.achievement.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                <div className={`${CARD} ${CARD_PADDING}`}>
                  <h3 className="text-sm font-semibold text-slate-900 mb-1">Sales Achievement (Pie Chart)</h3>
                  <div className="h-64">
                    <Pie data={salesChartData} options={salesChartOptions} />
                  </div>
                </div>

                <div className={`${CARD} ${CARD_PADDING}`}>
                  <h3 className="text-sm font-semibold text-slate-900 mb-1">Visits Trend (Line Chart)</h3>
                  <div className="h-64">
                    <Line data={visitsChartData} options={visitsChartOptions} />
                  </div>
                </div>

                <div className={`${CARD} ${CARD_PADDING}`}>
                  <h3 className="text-sm font-semibold text-slate-900 mb-1">DCR Submissions Comparison (Bar Chart)</h3>
                  <div className="h-64">
                    <Bar data={dcrChartData} options={dcrChartOptions} />
                  </div>
                  <div className="flex items-center gap-4 mt-4">
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: 'rgba(156, 39, 176, 0.8)' }}></span>
                      <span>{previousMonth}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: 'rgba(79, 70, 229, 0.8)' }}></span>
                      <span>{currentMonth}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: 'rgba(255, 152, 0, 0.8)' }}></span>
                      <span>Target</span>
                    </div>
                  </div>
                </div>

                <div className={`${CARD} ${CARD_PADDING}`}>
                  <h3 className="text-sm font-semibold text-slate-900 mb-1">Performance Overview (Radar Chart)</h3>
                  <p className="text-xs text-slate-500 mb-4">Comparing achievement % across all metrics</p>
                  <div className="h-64">
                    <Radar data={rcpaChartData} options={rcpaChartOptions} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'sales' && (
            <div>
              <div className={`${CARD} overflow-hidden`}>
                <div className={TABLE_WRAPPER}>
                  <table className={TABLE}>
                    <thead className={TABLE_HEAD}>
                      <tr>
                        <th className={TABLE_TH}>Month</th>
                        <th className={TABLE_TH}>Sales (₹)</th>
                        <th className={TABLE_TH}>Target (₹)</th>
                        <th className={TABLE_TH}>Achievement %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {salesData.map((row, index) => (
                        <tr key={index} className={TABLE_ROW}>
                          <td className={TABLE_TD}>{row.month}</td>
                          <td className={TABLE_TD}>₹{row.sales.toLocaleString()}</td>
                          <td className={TABLE_TD}>₹{row.target.toLocaleString()}</td>
                          <td className={TABLE_TD}>
                            <span className={getAchievementClasses(row.achievement)}>
                              {row.achievement.toFixed(1)}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'visits' && (
            <div>
              <div className={`${CARD} overflow-hidden`}>
                <div className={TABLE_WRAPPER}>
                  <table className={TABLE}>
                    <thead className={TABLE_HEAD}>
                      <tr>
                        <th className={TABLE_TH}>Date</th>
                        <th className={TABLE_TH}>Customer Name</th>
                        <th className={TABLE_TH}>Type</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visitData.map((row, index) => (
                        <tr key={index} className={TABLE_ROW}>
                          <td className={TABLE_TD}>{new Date(row.date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}</td>
                          <td className={TABLE_TD}>{row.doctor}</td>
                          <td className={TABLE_TD}>{row.type}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'dcr' && (
            <div>
              <div className={`${CARD} overflow-hidden`}>
                <div className={TABLE_WRAPPER}>
                  <table className={TABLE}>
                    <thead className={TABLE_HEAD}>
                      <tr>
                        <th className={TABLE_TH}>Date</th>
                        <th className={TABLE_TH}>Doctor/Customer</th>
                        <th className={TABLE_TH}>Products Discussed</th>
                        <th className={TABLE_TH}>Samples Given</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dcrData.map((row, index) => (
                        <tr key={index} className={TABLE_ROW}>
                          <td className={TABLE_TD}>{new Date(row.date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}</td>
                          <td className={TABLE_TD}>{row.doctor}</td>
                          <td className={TABLE_TD}>{row.products}</td>
                          <td className={TABLE_TD}>{row.samples}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'rcpa' && (
            <div>
              <div className={`${CARD} overflow-hidden`}>
                <div className={TABLE_WRAPPER}>
                  <table className={TABLE}>
                    <thead className={TABLE_HEAD}>
                      <tr>
                        <th className={TABLE_TH}>Date</th>
                        <th className={TABLE_TH}>Doctor</th>
                        <th className={TABLE_TH}>Product</th>
                        <th className={TABLE_TH}>Quantity</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rcpaData.map((row, index) => (
                        <tr key={index} className={TABLE_ROW}>
                          <td className={TABLE_TD}>{new Date(row.date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}</td>
                          <td className={TABLE_TD}>{row.doctor}</td>
                          <td className={TABLE_TD}>{row.product}</td>
                          <td className={TABLE_TD}>{row.quantity}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'commission' && (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className={STAT_CARD}>
                  <div className="text-2xl mb-2">💰</div>
                  <div>
                    <span className={STAT_LABEL}>Total Commission</span>
                    <span className={`${STAT_VALUE} block`}>₹{totalCommission.toLocaleString()}</span>
                  </div>
                </div>
                <div className={STAT_CARD}>
                  <div className="text-2xl mb-2">🎁</div>
                  <div>
                    <span className={STAT_LABEL}>Total Bonus</span>
                    <span className={`${STAT_VALUE} block`}>₹{totalBonus.toLocaleString()}</span>
                  </div>
                </div>
                <div className={STAT_CARD}>
                  <div className="text-2xl mb-2">💵</div>
                  <div>
                    <span className={STAT_LABEL}>Total Earning</span>
                    <span className={`${STAT_VALUE} block`}>₹{totalEarning.toLocaleString()}</span>
                  </div>
                </div>
                <div className={STAT_CARD}>
                  <div className="text-2xl mb-2">📅</div>
                  <div>
                    <span className={STAT_LABEL}>Months Achieved</span>
                    <span className={`${STAT_VALUE} block`}>{achievedMonths}/{commissionData.length}</span>
                  </div>
                </div>
              </div>

              <div className={`${CARD} ${CARD_PADDING} mb-6`}>
                <h3 className="text-sm font-semibold text-slate-900 mb-1">Commission Trend</h3>
                <div className="h-64">
                  <Bar data={commissionChartData} options={commissionChartOptions} />
                </div>
              </div>

              <div className={`${CARD} overflow-hidden`}>
                <div className={TABLE_WRAPPER}>
                  <table className={TABLE}>
                    <thead className={TABLE_HEAD}>
                      <tr>
                        <th className={TABLE_TH}>Month</th>
                        <th className={TABLE_TH}>Target (₹)</th>
                        <th className={TABLE_TH}>Sales (₹)</th>
                        <th className={TABLE_TH}>Achievement %</th>
                        <th className={TABLE_TH}>Commission Rate</th>
                        <th className={TABLE_TH}>Commission (₹)</th>
                        <th className={TABLE_TH}>Bonus (₹)</th>
                        <th className={TABLE_TH}>Total Earning (₹)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {commissionData.map((row, index) => (
                        <tr key={index} className={TABLE_ROW}>
                          <td className={TABLE_TD}><strong>{row.month}</strong></td>
                          <td className={TABLE_TD}>₹{row.target.toLocaleString()}</td>
                          <td className={TABLE_TD}>₹{row.sales.toLocaleString()}</td>
                          <td className={TABLE_TD}>
                            <span className={getAchievementClasses(row.achievement)}>
                              {row.achievement.toFixed(1)}%
                            </span>
                          </td>
                          <td className={TABLE_TD}>{row.commissionRate}%</td>
                          <td className={TABLE_TD}><strong>₹{row.commissionAmount.toLocaleString()}</strong></td>
                          <td className={TABLE_TD}>
                            {row.bonus > 0 ? (
                              <span className={BADGE_SUCCESS}>+₹{row.bonus.toLocaleString()}</span>
                            ) : (
                              <span className={BADGE_DEFAULT}>-</span>
                            )}
                          </td>
                          <td className={TABLE_TD}><strong className="text-indigo-600">₹{row.totalEarning.toLocaleString()}</strong></td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="font-bold bg-slate-50">
                        <td className={TABLE_TD} colSpan={5}><strong>Total</strong></td>
                        <td className={TABLE_TD}><strong>₹{totalCommission.toLocaleString()}</strong></td>
                        <td className={TABLE_TD}><strong>₹{totalBonus.toLocaleString()}</strong></td>
                        <td className={TABLE_TD}><strong className="text-indigo-600">₹{totalEarning.toLocaleString()}</strong></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default MRDetail
