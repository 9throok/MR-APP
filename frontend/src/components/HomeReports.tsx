import './HomeReports.css'
import { useLanguage } from '../contexts/LanguageContext'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { Bar } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
)

interface HomeReportsProps {
  onNavigate?: (page: string) => void
}

function HomeReports({ onNavigate }: HomeReportsProps) {
  const { t } = useLanguage()


  // Call Average Chart Data
  const callAverageData = {
    labels: ['October 2025', 'November 2025', 'December 2025', 'January 2026'],
    datasets: [
      {
        label: 'Actual',
        data: [0, 0, 1, 0],
        backgroundColor: '#64B5F6',
        borderRadius: 4,
      },
      {
        label: 'Target',
        data: [0, 0, 0, 0],
        backgroundColor: '#2196F3',
        borderRadius: 4,
      },
    ],
  }

  const callAverageOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'bottom' as const,
        labels: {
          usePointStyle: true,
          padding: 15,
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        enabled: true,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            size: 11,
          },
        },
      },
      y: {
        beginAtZero: true,
        max: 1.0,
        ticks: {
          stepSize: 0.2,
          font: {
            size: 11,
          },
        },
        grid: {
          color: '#E0E0E0',
        },
      },
    },
  }

  // POB Chart Data
  const pobData = {
    labels: ['March 2025'],
    datasets: [
      {
        label: 'Actual',
        data: [1200],
        backgroundColor: '#64B5F6',
        borderRadius: 4,
      },
      {
        label: 'Target',
        data: [3300],
        backgroundColor: '#2196F3',
        borderRadius: 4,
      },
    ],
  }

  const pobOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'bottom' as const,
        labels: {
          usePointStyle: true,
          padding: 15,
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        enabled: true,
        callbacks: {
          label: function(context: any) {
            return `${context.dataset.label}: ${context.parsed.y.toLocaleString()}`
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            size: 11,
          },
        },
      },
      y: {
        beginAtZero: true,
        max: 3500,
        ticks: {
          stepSize: 500,
          callback: function(value: any) {
            return value === 0 ? '0' : `${value / 1000}K`
          },
          font: {
            size: 11,
          },
        },
        grid: {
          color: '#E0E0E0',
        },
      },
    },
  }

  // Budget Chart Data
  const budgetData = {
    labels: ['Target vs Achieved'],
    datasets: [
      {
        label: '121.4',
        data: [121.4],
        backgroundColor: '#64B5F6',
        borderRadius: 4,
      },
      {
        label: '35.4',
        data: [35.4],
        backgroundColor: '#2196F3',
        borderRadius: 4,
      },
    ],
  }

  const budgetOptions = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y' as const,
    plugins: {
      legend: {
        display: true,
        position: 'bottom' as const,
        labels: {
          usePointStyle: true,
          padding: 15,
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        enabled: true,
        callbacks: {
          label: function(context: any) {
            return `${context.dataset.label}`
          },
        },
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        max: 150,
        ticks: {
          stepSize: 25,
          font: {
            size: 11,
          },
        },
        grid: {
          color: '#E0E0E0',
        },
      },
      y: {
        grid: {
          display: false,
        },
        ticks: {
          display: false,
        },
      },
    },
  }

  const handleReportClick = () => {
    if (onNavigate) {
      onNavigate('reports')
    }
  }

  return (
    <div className="home-reports-container">
      <div className="home-reports-header">
        <h2 className="home-reports-title">{t('recentReports')}</h2>
        <button className="view-all-reports-btn" onClick={handleReportClick}>
          <span>{t('viewAll')}</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
      <div className="home-reports-grid">
        {/* Call Average Chart */}
        <div className="home-report-card" onClick={handleReportClick}>
          <h3 className="report-chart-title">Call Average</h3>
          <div className="report-chart-wrapper">
            <Bar data={callAverageData} options={callAverageOptions} />
          </div>
        </div>

        {/* POB Chart */}
        <div className="home-report-card" onClick={handleReportClick}>
          <h3 className="report-chart-title">POB(Actual Vs Achieved)</h3>
          <div className="report-chart-wrapper">
            <Bar data={pobData} options={pobOptions} />
          </div>
        </div>

        {/* Budget Chart */}
        <div className="home-report-card" onClick={handleReportClick}>
          <h3 className="report-chart-title">Budget Vs Actual</h3>
          <div className="report-chart-wrapper">
            <Bar data={budgetData} options={budgetOptions} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default HomeReports

