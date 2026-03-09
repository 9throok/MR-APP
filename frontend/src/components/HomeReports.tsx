import { useLanguage } from '../contexts/LanguageContext'
import {
  SECTION_TITLE,
  BTN_GHOST,
  CARD,
  CARD_PADDING,
} from '../styles/designSystem'
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
        backgroundColor: '#818CF8',
        borderRadius: 4,
      },
      {
        label: 'Target',
        data: [0, 0, 0, 0],
        backgroundColor: '#4F46E5',
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
        backgroundColor: '#818CF8',
        borderRadius: 4,
      },
      {
        label: 'Target',
        data: [3300],
        backgroundColor: '#4F46E5',
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
        backgroundColor: '#818CF8',
        borderRadius: 4,
      },
      {
        label: '35.4',
        data: [35.4],
        backgroundColor: '#4F46E5',
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
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className={`${SECTION_TITLE} !mb-0`}>{t('recentReports')}</h2>
        <button className={`${BTN_GHOST} text-indigo-600`} onClick={handleReportClick}>
          <span>{t('viewAll')}</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Call Average Chart */}
        <div className={`${CARD} ${CARD_PADDING} cursor-pointer`} onClick={handleReportClick}>
          <h3 className="text-sm font-semibold text-slate-900 mb-3">Call Average</h3>
          <div className="h-[200px]">
            <Bar data={callAverageData} options={callAverageOptions} />
          </div>
        </div>

        {/* POB Chart */}
        <div className={`${CARD} ${CARD_PADDING} cursor-pointer`} onClick={handleReportClick}>
          <h3 className="text-sm font-semibold text-slate-900 mb-3">POB(Actual Vs Achieved)</h3>
          <div className="h-[200px]">
            <Bar data={pobData} options={pobOptions} />
          </div>
        </div>

        {/* Budget Chart */}
        <div className={`${CARD} ${CARD_PADDING} cursor-pointer`} onClick={handleReportClick}>
          <h3 className="text-sm font-semibold text-slate-900 mb-3">Budget Vs Actual</h3>
          <div className="h-[200px]">
            <Bar data={budgetData} options={budgetOptions} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default HomeReports
