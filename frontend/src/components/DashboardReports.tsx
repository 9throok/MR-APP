import './DashboardReports.css'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, Filler } from 'chart.js'
import { Bar, Line, Chart } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, Filler)

function DashboardReports() {
  // Doctor Calls Over Last 4 Months - Bar Chart
  const doctorCallsData = {
    labels: ['Oct 2025', 'Nov 2025', 'Dec 2025', 'Jan 2026'],
    datasets: [
      {
        label: 'Doctor Calls',
        data: [95, 112, 127, 149],
        backgroundColor: '#81C784',
        borderColor: '#66BB6A',
        borderWidth: 1,
      },
    ],
  }

  const doctorCallsOptions = {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: {
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
      },
    },
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: 'Doctor Calls Over Last 4 Months',
        font: {
          size: 16,
          weight: 'bold' as const,
        },
      },
      tooltip: {
        enabled: true,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 160,
        ticks: {
          stepSize: 40,
          maxRotation: 0,
        },
        title: {
          display: true,
          text: 'Doctor Calls',
        },
      },
      x: {
        ticks: {
          maxRotation: 45,
          minRotation: 45,
        },
        title: {
          display: true,
          text: 'Months',
        },
      },
    },
  }

  // Call Average Trend Over Last 4 Months - Line Chart
  const callAverageData = {
    labels: ['October 2025', 'November 2025', 'December 2025', 'January 2026'],
    datasets: [
      {
        label: 'Call Average',
        data: [7.2, 8.5, 9.36, 11.46],
        borderColor: '#66BB6A',
        backgroundColor: 'rgba(129, 199, 132, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 6,
        pointBackgroundColor: '#81C784',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
      },
    ],
  }

  const callAverageOptions = {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: {
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
      },
    },
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: 'Call Average Trend Over Last 4 Months',
        font: {
          size: 16,
          weight: 'bold' as const,
        },
      },
      tooltip: {
        enabled: true,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 13,
        ticks: {
          stepSize: 2.5,
          maxRotation: 0,
        },
        title: {
          display: true,
          text: 'Call Average',
        },
      },
      x: {
        ticks: {
          maxRotation: 45,
          minRotation: 45,
        },
        title: {
          display: true,
          text: 'Months',
        },
      },
    },
  }

  // Coverage Trends (Doctor vs Pharmacy) - Combination Chart
  const coverageData = {
    labels: ['Oct', 'Nov', 'Dec', 'Jan'],
    datasets: [
      {
        label: 'Pharmacy Coverage',
        data: [45, 52, 60, 68],
        backgroundColor: '#81C784',
        borderColor: '#66BB6A',
        borderWidth: 1,
        type: 'bar' as const,
      },
      {
        label: 'Doctor Coverage',
        data: [55, 58, 60, 65],
        borderColor: '#66BB6A',
        backgroundColor: 'transparent',
        type: 'line' as const,
        tension: 0.4,
        pointRadius: 6,
        pointBackgroundColor: '#81C784',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        yAxisID: 'y',
      },
    ],
  }

  const coverageOptions = {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: {
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
      },
    },
    plugins: {
      legend: {
        display: true,
        position: 'bottom' as const,
      },
      title: {
        display: true,
        text: 'Coverage Trends (Doctor vs Pharmacy)',
        font: {
          size: 16,
          weight: 'bold' as const,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 75,
        ticks: {
          stepSize: 15,
          maxRotation: 0,
        },
        title: {
          display: true,
          text: 'Coverage %',
        },
      },
      x: {
        ticks: {
          maxRotation: 45,
          minRotation: 45,
        },
        title: {
          display: true,
          text: 'Months',
        },
      },
    },
  }

  // Field Working Days Over Last 4 Months - Bar Chart
  const fieldWorkingDaysData = {
    labels: ['Oct 2025', 'Nov 2025', 'Dec 2025', 'Jan 2026'],
    datasets: [
      {
        label: 'Field Working Days',
        data: [12, 13, 14, 13],
        backgroundColor: '#81C784',
        borderColor: '#66BB6A',
        borderWidth: 1,
      },
    ],
  }

  const fieldWorkingDaysOptions = {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: {
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
      },
    },
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: 'Field Working Days Over Last 4 Months',
        font: {
          size: 16,
          weight: 'bold' as const,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 15,
        ticks: {
          stepSize: 5,
          maxRotation: 0,
        },
        title: {
          display: true,
          text: 'Field Working Days',
        },
      },
      x: {
        ticks: {
          maxRotation: 45,
          minRotation: 45,
        },
        title: {
          display: true,
          text: 'Months',
        },
      },
    },
  }

  // CPC Compliance by Class of Drs - Bar Chart
  const cpcComplianceData = {
    labels: ['A', 'B', 'C'],
    datasets: [
      {
        label: '% of CPC',
        data: [20, 35, 28],
        backgroundColor: '#81C784',
        borderColor: '#66BB6A',
        borderWidth: 1,
      },
    ],
  }

  const cpcComplianceOptions = {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: {
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
      },
    },
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: 'CPC Compliance by Class of Drs',
        font: {
          size: 16,
          weight: 'bold' as const,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: {
          stepSize: 25,
          maxRotation: 0,
        },
        title: {
          display: true,
          text: '% of CPC',
        },
      },
      x: {
        ticks: {
          maxRotation: 0,
        },
        title: {
          display: true,
          text: 'Doctor Class',
        },
      },
    },
  }

  // Call Plan Compliance Table Data
  const cpcTableData = [
    { class: 'A', doctorName: 'Dr. Anil Doshi', frequency: 4, actualCalls: 1, cpcFormula: '1/4', cpcPercent: 25, finalCpc: 25 },
    { class: 'A', doctorName: 'Dr. Navin Chaddha', frequency: 4, actualCalls: 4, cpcFormula: '4/4', cpcPercent: 100, finalCpc: 100 },
    { class: 'A', doctorName: 'Dr. Surbhi Rel', frequency: 4, actualCalls: 2, cpcFormula: '2/4', cpcPercent: 50, finalCpc: 50 },
    { class: 'A', doctorName: 'Dr. Naresh Patil', frequency: 4, actualCalls: 3, cpcFormula: '3/4', cpcPercent: 75, finalCpc: 75 },
    { class: 'A', doctorName: 'Dr. Surekha Rane', frequency: 4, actualCalls: 1, cpcFormula: '1/4', cpcPercent: 25, finalCpc: 25 },
    { class: 'A', doctorName: 'Dr. Rajesh Kumar', frequency: 4, actualCalls: 1, cpcFormula: '1/4', cpcPercent: 25, finalCpc: 25 },
  ]

  return (
    <div className="dashboard-reports-container">
      {/* First Row */}
      <div className="reports-row">
        <div className="report-card">
          <div className="chart-wrapper">
            <Bar data={doctorCallsData} options={doctorCallsOptions} />
          </div>
        </div>
        <div className="report-card">
          <div className="chart-wrapper">
            <Line data={callAverageData} options={callAverageOptions} />
          </div>
        </div>
      </div>

      {/* Second Row */}
      <div className="reports-row">
        <div className="report-card">
          <div className="chart-wrapper">
            <Chart type="bar" data={coverageData as any} options={coverageOptions} />
          </div>
        </div>
        <div className="report-card">
          <div className="chart-wrapper">
            <Bar data={fieldWorkingDaysData} options={fieldWorkingDaysOptions} />
          </div>
        </div>
      </div>

      {/* Third Row */}
      <div className="reports-row">
        <div className="report-card">
          <div className="chart-wrapper">
            <Bar data={cpcComplianceData} options={cpcComplianceOptions} />
          </div>
        </div>
        <div className="report-card">
          <div className="table-card">
            <h3 className="table-title">Call Plan Compliance (CPC)</h3>
            <div className="table-wrapper">
              <table className="cpc-table">
                <thead>
                  <tr>
                    <th>Class</th>
                    <th>Doctor Name</th>
                    <th>Frequency</th>
                    <th>Actual Calls</th>
                    <th>CPC Formula</th>
                    <th>% of CPC</th>
                    <th>Final CPC %</th>
                  </tr>
                </thead>
                <tbody>
                  {cpcTableData.map((row, index) => (
                    <tr key={index}>
                      <td>{row.class}</td>
                      <td>{row.doctorName}</td>
                      <td>{row.frequency}</td>
                      <td>{row.actualCalls}</td>
                      <td>{row.cpcFormula}</td>
                      <td>{row.cpcPercent}%</td>
                      <td>{row.finalCpc}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardReports
