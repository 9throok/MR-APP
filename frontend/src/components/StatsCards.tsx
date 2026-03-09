import './StatsCards.css'
import { useLanguage } from '../contexts/LanguageContext'
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
          backgroundColor: ['#A5D6A7', '#E0E0E0'],
          borderWidth: 0,
        },
      ],
    }

    const innerChartConfig = {
      labels: [data.innerValue.toFixed(1), ''],
      datasets: [
        {
          data: [data.innerValue, innerRemaining],
          backgroundColor: ['#81C784', '#E0E0E0'],
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
      <div key={data.id} className="chart-card">
        <h3 className="chart-title">{data.title}</h3>
        <div className="chart-container">
          <div className="pie-charts-wrapper">
            <div className="pie-chart-outer">
              <Pie data={outerChartConfig} options={options} />
            </div>
            <div className="pie-chart-inner">
              <Pie data={innerChartConfig} options={innerOptions} />
            </div>
          </div>
          <div className="chart-values">
            <div className="chart-value-label">
              <span className="chart-color-box" style={{ backgroundColor: '#A5D6A7' }}></span>
              <span className="chart-value-text">{data.outerValue.toFixed(1)}</span>
            </div>
            <div className="chart-value-label">
              <span className="chart-color-box" style={{ backgroundColor: '#81C784' }}></span>
              <span className="chart-value-text">{data.innerValue.toFixed(1)}</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <h2 className="shortcuts-title">{t('dashboardStatistics')}</h2>
      <div className="charts-container">
        {chartData.map((data) => renderChart(data))}
      </div>
    </div>
  )
}

export default StatsCards

