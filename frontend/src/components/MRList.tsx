import { useState } from 'react'
import {
  PAGE_CONTENT,
  PAGE_TITLE,
  BACK_BUTTON,
  SEARCH_INPUT,
  FILTER_PILL_ACTIVE,
  FILTER_PILL_INACTIVE,
  CARD,
  TABLE,
  TABLE_HEAD,
  TABLE_TH,
  TABLE_TD,
  TABLE_ROW,
  TABLE_WRAPPER,
  BADGE_SUCCESS,
  BADGE_DANGER,
  EMPTY_STATE,
  EMPTY_TITLE,
  EMPTY_ICON,
} from '../styles/designSystem'

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

interface MRListProps {
  onLogout: () => void
  onBack: () => void
  userName?: string
  onNavigate?: (page: string, data?: any) => void
}

// Static MR data
const mrData: MR[] = [
  {
    id: '1',
    empId: 'EMP001',
    name: 'Rajesh Kumar',
    email: 'rajesh.kumar@zenrac.com',
    mobile: '+91 98765 43210',
    designation: 'Medical Representative',
    region: 'Mumbai',
    status: 'Active'
  },
  {
    id: '2',
    empId: 'EMP002',
    name: 'Priya Sharma',
    email: 'priya.sharma@zenrac.com',
    mobile: '+91 98765 43211',
    designation: 'Senior Medical Representative',
    region: 'Delhi',
    status: 'Active'
  },
  {
    id: '3',
    empId: 'EMP003',
    name: 'Amit Patel',
    email: 'amit.patel@zenrac.com',
    mobile: '+91 98765 43212',
    designation: 'Medical Representative',
    region: 'Bangalore',
    status: 'Active'
  },
  {
    id: '4',
    empId: 'EMP004',
    name: 'Sneha Desai',
    email: 'sneha.desai@zenrac.com',
    mobile: '+91 98765 43213',
    designation: 'Medical Representative',
    region: 'Pune',
    status: 'Active'
  },
  {
    id: '5',
    empId: 'EMP005',
    name: 'Vikram Singh',
    email: 'vikram.singh@zenrac.com',
    mobile: '+91 98765 43214',
    designation: 'Area Manager',
    region: 'Hyderabad',
    status: 'Active'
  },
  {
    id: '6',
    empId: 'EMP006',
    name: 'Anjali Mehta',
    email: 'anjali.mehta@zenrac.com',
    mobile: '+91 98765 43215',
    designation: 'Medical Representative',
    region: 'Chennai',
    status: 'Inactive'
  }
]

function MRList({ onLogout: _onLogout, onBack, userName: _userName, onNavigate }: MRListProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Inactive'>('All')

  const handleMRClick = (mr: MR) => {
    if (onNavigate) {
      // Store MR data in sessionStorage to pass to detail page
      sessionStorage.setItem('selectedMR', JSON.stringify(mr))
      onNavigate('mr-detail', mr)
    }
  }

  const filteredMRs = mrData.filter(mr => {
    const matchesSearch =
      mr.empId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mr.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mr.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mr.mobile.includes(searchQuery) ||
      mr.region.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === 'All' || mr.status === statusFilter

    return matchesSearch && matchesStatus
  })

  return (
    <div className="flex-1 bg-slate-50 min-h-screen">
      <main className={PAGE_CONTENT}>
        <div className="flex items-center gap-3 mb-6">
          <button className={BACK_BUTTON} onClick={onBack} aria-label="Go back">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <h1 className={PAGE_TITLE}>MR List</h1>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="relative w-full sm:w-80">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
              <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <input
              type="text"
              placeholder="Search by Emp ID, Name, Email, Mobile, or Region..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={SEARCH_INPUT}
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              className={statusFilter === 'All' ? FILTER_PILL_ACTIVE : FILTER_PILL_INACTIVE}
              onClick={() => setStatusFilter('All')}
            >
              All ({mrData.length})
            </button>
            <button
              className={statusFilter === 'Active' ? FILTER_PILL_ACTIVE : FILTER_PILL_INACTIVE}
              onClick={() => setStatusFilter('Active')}
            >
              Active ({mrData.filter(m => m.status === 'Active').length})
            </button>
            <button
              className={statusFilter === 'Inactive' ? FILTER_PILL_ACTIVE : FILTER_PILL_INACTIVE}
              onClick={() => setStatusFilter('Inactive')}
            >
              Inactive ({mrData.filter(m => m.status === 'Inactive').length})
            </button>
          </div>
        </div>

        <div className={`${CARD} overflow-hidden`}>
          <div className={TABLE_WRAPPER}>
            <table className={TABLE}>
              <thead className={TABLE_HEAD}>
                <tr>
                  <th className={TABLE_TH}>Emp ID</th>
                  <th className={TABLE_TH}>Name</th>
                  <th className={TABLE_TH}>Email</th>
                  <th className={TABLE_TH}>Mobile</th>
                  <th className={TABLE_TH}>Designation</th>
                  <th className={TABLE_TH}>Region</th>
                  <th className={TABLE_TH}>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredMRs.length === 0 ? (
                  <tr>
                    <td colSpan={7}>
                      <div className={EMPTY_STATE}>
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={EMPTY_ICON}>
                          <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89318 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88M13 7C13 9.20914 11.2091 11 9 11C6.79086 11 5 9.20914 5 7C5 4.79086 6.79086 3 9 3C11.2091 3 13 4.79086 13 7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <p className={EMPTY_TITLE}>No MRs found matching your search criteria.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredMRs.map((mr) => (
                    <tr key={mr.id} className={`${TABLE_ROW} cursor-pointer`} onClick={() => handleMRClick(mr)}>
                      <td className={TABLE_TD}>{mr.empId}</td>
                      <td className={`${TABLE_TD} font-medium text-slate-900`}>{mr.name}</td>
                      <td className={TABLE_TD}>{mr.email}</td>
                      <td className={TABLE_TD}>{mr.mobile}</td>
                      <td className={TABLE_TD}>{mr.designation}</td>
                      <td className={TABLE_TD}>{mr.region}</td>
                      <td className={TABLE_TD}>
                        <span className={mr.status === 'Active' ? BADGE_SUCCESS : BADGE_DANGER}>
                          {mr.status || 'N/A'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}

export default MRList
