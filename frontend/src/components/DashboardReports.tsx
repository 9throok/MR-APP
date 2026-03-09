import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, Filler } from 'chart.js'
import { Bar, Line, Chart } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, Filler)

function DashboardReports() {
  const doctorCallsData = {
    labels: ['Oct 2025', 'Nov 2025', 'Dec 2025', 'Jan 2026'],
    datasets: [{
      label: 'Doctor Calls',
      data: [95, 112, 127, 149],
      backgroundColor: '#818CF8',
      borderColor: '#6366F1',
      borderWidth: 1,
    }],
  }

  const doctorCallsOptions = {
    responsive: true,
    maintainAspectRatio: false,
    layout: { padding: { left: 0, right: 0, top: 0, bottom: 0 } },
    plugins: {
      legend: { display: false },
      title: { display: true, text: 'Doctor Calls Over Last 4 Months', font: { size: 14, weight: 'bold' as const }, color: '#1e293b' },
    },
    scales: {
      y: { beginAtZero: true, max: 160, ticks: { stepSize: 40, color: '#94a3b8' }, grid: { color: '#f1f5f9' }, title: { display: true, text: 'Doctor Calls', color: '#64748b' } },
      x: { ticks: { maxRotation: 45, minRotation: 45, color: '#94a3b8' }, grid: { display: false }, title: { display: true, text: 'Months', color: '#64748b' } },
    },
  }

  const callAverageData = {
    labels: ['October 2025', 'November 2025', 'December 2025', 'January 2026'],
    datasets: [{
      label: 'Call Average',
      data: [7.2, 8.5, 9.36, 11.46],
      borderColor: '#6366F1',
      backgroundColor: 'rgba(99, 102, 241, 0.08)',
      fill: true,
      tension: 0.4,
      pointRadius: 6,
      pointBackgroundColor: '#818CF8',
      pointBorderColor: '#fff',
      pointBorderWidth: 2,
    }],
  }

  const callAverageOptions = {
    responsive: true,
    maintainAspectRatio: false,
    layout: { padding: { left: 0, right: 0, top: 0, bottom: 0 } },
    plugins: {
      legend: { display: false },
      title: { display: true, text: 'Call Average Trend Over Last 4 Months', font: { size: 14, weight: 'bold' as const }, color: '#1e293b' },
    },
    scales: {
      y: { beginAtZero: true, max: 13, ticks: { stepSize: 2.5, color: '#94a3b8' }, grid: { color: '#f1f5f9' }, title: { display: true, text: 'Call Average', color: '#64748b' } },
      x: { ticks: { maxRotation: 45, minRotation: 45, color: '#94a3b8' }, grid: { display: false }, title: { display: true, text: 'Months', color: '#64748b' } },
    },
  }

  const coverageData = {
    labels: ['Oct', 'Nov', 'Dec', 'Jan'],
    datasets: [
      {
        label: 'Pharmacy Coverage',
        data: [45, 52, 60, 68],
        backgroundColor: '#818CF8',
        borderColor: '#6366F1',
        borderWidth: 1,
        type: 'bar' as const,
      },
      {
        label: 'Doctor Coverage',
        data: [55, 58, 60, 65],
        borderColor: '#6366F1',
        backgroundColor: 'transparent',
        type: 'line' as const,
        tension: 0.4,
        pointRadius: 6,
        pointBackgroundColor: '#818CF8',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        yAxisID: 'y',
      },
    ],
  }

  const coverageOptions = {
    responsive: true,
    maintainAspectRatio: false,
    layout: { padding: { left: 0, right: 0, top: 0, bottom: 0 } },
    plugins: {
      legend: { display: true, position: 'bottom' as const, labels: { color: '#64748b' } },
      title: { display: true, text: 'Coverage Trends (Doctor vs Pharmacy)', font: { size: 14, weight: 'bold' as const }, color: '#1e293b' },
    },
    scales: {
      y: { beginAtZero: true, max: 75, ticks: { stepSize: 15, color: '#94a3b8' }, grid: { color: '#f1f5f9' }, title: { display: true, text: 'Coverage %', color: '#64748b' } },
      x: { ticks: { maxRotation: 45, minRotation: 45, color: '#94a3b8' }, grid: { display: false }, title: { display: true, text: 'Months', color: '#64748b' } },
    },
  }

  const fieldWorkingDaysData = {
    labels: ['Oct 2025', 'Nov 2025', 'Dec 2025', 'Jan 2026'],
    datasets: [{
      label: 'Field Working Days',
      data: [12, 13, 14, 13],
      backgroundColor: '#818CF8',
      borderColor: '#6366F1',
      borderWidth: 1,
    }],
  }

  const fieldWorkingDaysOptions = {
    responsive: true,
    maintainAspectRatio: false,
    layout: { padding: { left: 0, right: 0, top: 0, bottom: 0 } },
    plugins: {
      legend: { display: false },
      title: { display: true, text: 'Field Working Days Over Last 4 Months', font: { size: 14, weight: 'bold' as const }, color: '#1e293b' },
    },
    scales: {
      y: { beginAtZero: true, max: 15, ticks: { stepSize: 5, color: '#94a3b8' }, grid: { color: '#f1f5f9' }, title: { display: true, text: 'Field Working Days', color: '#64748b' } },
      x: { ticks: { maxRotation: 45, minRotation: 45, color: '#94a3b8' }, grid: { display: false }, title: { display: true, text: 'Months', color: '#64748b' } },
    },
  }

  const cpcComplianceData = {
    labels: ['A', 'B', 'C'],
    datasets: [{
      label: '% of CPC',
      data: [20, 35, 28],
      backgroundColor: '#818CF8',
      borderColor: '#6366F1',
      borderWidth: 1,
    }],
  }

  const cpcComplianceOptions = {
    responsive: true,
    maintainAspectRatio: false,
    layout: { padding: { left: 0, right: 0, top: 0, bottom: 0 } },
    plugins: {
      legend: { display: false },
      title: { display: true, text: 'CPC Compliance by Class of Drs', font: { size: 14, weight: 'bold' as const }, color: '#1e293b' },
    },
    scales: {
      y: { beginAtZero: true, max: 100, ticks: { stepSize: 25, color: '#94a3b8' }, grid: { color: '#f1f5f9' }, title: { display: true, text: '% of CPC', color: '#64748b' } },
      x: { ticks: { color: '#94a3b8' }, grid: { display: false }, title: { display: true, text: 'Doctor Class', color: '#64748b' } },
    },
  }

  const cpcTableData = [
    { class: 'A', doctorName: 'Dr. Anil Doshi', frequency: 4, actualCalls: 1, cpcFormula: '1/4', cpcPercent: 25, finalCpc: 25 },
    { class: 'A', doctorName: 'Dr. Navin Chaddha', frequency: 4, actualCalls: 4, cpcFormula: '4/4', cpcPercent: 100, finalCpc: 100 },
    { class: 'A', doctorName: 'Dr. Surbhi Rel', frequency: 4, actualCalls: 2, cpcFormula: '2/4', cpcPercent: 50, finalCpc: 50 },
    { class: 'A', doctorName: 'Dr. Naresh Patil', frequency: 4, actualCalls: 3, cpcFormula: '3/4', cpcPercent: 75, finalCpc: 75 },
    { class: 'A', doctorName: 'Dr. Surekha Rane', frequency: 4, actualCalls: 1, cpcFormula: '1/4', cpcPercent: 25, finalCpc: 25 },
    { class: 'A', doctorName: 'Dr. Rajesh Kumar', frequency: 4, actualCalls: 1, cpcFormula: '1/4', cpcPercent: 25, finalCpc: 25 },
  ]

  const chartCard = 'bg-white border border-slate-200 rounded-xl shadow-sm'

  return (
    <div className="space-y-4">
      {/* Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className={chartCard}>
          <div className="relative h-[300px] p-4">
            <Bar data={doctorCallsData} options={doctorCallsOptions} />
          </div>
        </div>
        <div className={chartCard}>
          <div className="relative h-[300px] p-4">
            <Line data={callAverageData} options={callAverageOptions} />
          </div>
        </div>
      </div>

      {/* Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className={chartCard}>
          <div className="relative h-[300px] p-4">
            <Chart type="bar" data={coverageData as any} options={coverageOptions} />
          </div>
        </div>
        <div className={chartCard}>
          <div className="relative h-[300px] p-4">
            <Bar data={fieldWorkingDaysData} options={fieldWorkingDaysOptions} />
          </div>
        </div>
      </div>

      {/* Row 3 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className={chartCard}>
          <div className="relative h-[300px] p-4">
            <Bar data={cpcComplianceData} options={cpcComplianceOptions} />
          </div>
        </div>
        <div className={chartCard + ' p-5'}>
          <h3 className="text-sm font-semibold text-slate-900 mb-3">Call Plan Compliance (CPC)</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-left">
                  <th className="px-3 py-2.5 text-xs font-medium text-slate-500 uppercase tracking-wider">Class</th>
                  <th className="px-3 py-2.5 text-xs font-medium text-slate-500 uppercase tracking-wider">Doctor Name</th>
                  <th className="px-3 py-2.5 text-xs font-medium text-slate-500 uppercase tracking-wider">Freq</th>
                  <th className="px-3 py-2.5 text-xs font-medium text-slate-500 uppercase tracking-wider">Actual</th>
                  <th className="px-3 py-2.5 text-xs font-medium text-slate-500 uppercase tracking-wider">Formula</th>
                  <th className="px-3 py-2.5 text-xs font-medium text-slate-500 uppercase tracking-wider">% CPC</th>
                  <th className="px-3 py-2.5 text-xs font-medium text-slate-500 uppercase tracking-wider">Final %</th>
                </tr>
              </thead>
              <tbody>
                {cpcTableData.map((row, index) => (
                  <tr key={index} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-3 py-2.5 text-slate-700 border-b border-slate-100">{row.class}</td>
                    <td className="px-3 py-2.5 text-slate-700 border-b border-slate-100">{row.doctorName}</td>
                    <td className="px-3 py-2.5 text-slate-700 border-b border-slate-100">{row.frequency}</td>
                    <td className="px-3 py-2.5 text-slate-700 border-b border-slate-100">{row.actualCalls}</td>
                    <td className="px-3 py-2.5 text-slate-700 border-b border-slate-100">{row.cpcFormula}</td>
                    <td className="px-3 py-2.5 text-slate-700 border-b border-slate-100">{row.cpcPercent}%</td>
                    <td className="px-3 py-2.5 text-slate-700 border-b border-slate-100">{row.finalCpc}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardReports
