import { useLanguage } from '../contexts/LanguageContext'
import {
  SECTION_TITLE,
  CARD,
  CARD_PADDING,
} from '../styles/designSystem'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js'
import { Pie } from 'react-chartjs-2'

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend
)

interface ChartData {
  id: number
  title: string
  outerValue: number
  innerValue: number
  maxValue: number
}

function StatsCards() {
  const { t } = useLanguage()

  const chartData: ChartData[] = [
    {
      id: 1,
      title: 'Dr. Coverage Compliance',
      outerValue: 180.0,
      innerValue: 100.0,
      maxValue: 200,
    },
    {
      id: 2,
      title: 'RCPA',
      outerValue: 150.0,
      innerValue: 90.0,
      maxValue: 200,
    },
    {
      id: 3,
      title: 'Input Distribution',
      outerValue: 100.0,
      innerValue: 70.0,
      maxValue: 150,
    },
    {
      id: 4,
      title: 'Feedbacks',
      outerValue: 130.0,
      innerValue: 80.0,
      maxValue: 200,
    },
  ]

  const renderChart = (data: ChartData) => {
    // Calculate the remaining value to complete the pie
    const outerRemaining = data.maxValue - data.outerValue
    const innerRemaining = data.maxValue - data.innerValue

    const outerChartConfig = {
      labels: [data.outerValue.toFixed(1), ''],
      datasets: [
        {
          data: [data.outerValue, outerRemaining],
          backgroundColor: ['#818CF8', '#E0E0E0'],
          borderWidth: 0,
        },
      ],
    }

    const innerChartConfig = {
      labels: [data.innerValue.toFixed(1), ''],
      datasets: [
        {
          data: [data.innerValue, innerRemaining],
          backgroundColor: ['#6366F1', '#E0E0E0'],
          borderWidth: 0,
        },
      ],
    }

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '60%', // Makes it a donut chart
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          enabled: true,
          callbacks: {
            label: function(context: any) {
              if (context.dataIndex === 1) {
                return ''
              }
              return `${context.label}`
            },
          },
        },
      },
    }

    const innerOptions = {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '75%', // Smaller cutout for inner ring
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          enabled: true,
          callbacks: {
            label: function(context: any) {
              if (context.dataIndex === 1) {
                return ''
              }
              return `${context.label}`
            },
          },
        },
      },
    }

    return (
      <div key={data.id} className={`${CARD} ${CARD_PADDING}`}>
        <h3 className="text-sm font-semibold text-slate-900 mb-3">{data.title}</h3>
        <div className="flex items-center justify-center">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24">
              <Pie data={outerChartConfig} options={options} />
            </div>
            <div className="w-20 h-20">
              <Pie data={innerChartConfig} options={innerOptions} />
            </div>
          </div>
          <div className="space-y-2 mt-3">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#818CF8' }}></span>
              <span className="text-sm font-medium text-slate-700">{data.outerValue.toFixed(1)}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#6366F1' }}></span>
              <span className="text-sm font-medium text-slate-700">{data.innerValue.toFixed(1)}</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <h2 className={SECTION_TITLE}>{t('dashboardStatistics')}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {chartData.map((data) => renderChart(data))}
      </div>
    </div>
  )
}

export default StatsCards
