import { useState } from 'react'
import Header from './Header'
import Sidebar from './Sidebar'
import './MRList.css'

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

function MRList({ onLogout, onBack, userName, onNavigate }: MRListProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Inactive'>('All')

  const handleMenuClick = () => {
    setSidebarOpen(true)
  }

  const handleSidebarClose = () => {
    setSidebarOpen(false)
  }

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
    <div className="mr-list-container">
      <Header onLogout={onLogout} onMenuClick={handleMenuClick} onNavigateHome={() => onNavigate?.('home')} onNavigateOfflineRequests={() => onNavigate?.('offline-requests')} />
      <Sidebar isOpen={sidebarOpen} onClose={handleSidebarClose} userName={userName} onNavigate={onNavigate} onLogout={onLogout} currentPage="mr-list" />
      <main className="mr-list-content">
        <div className="mr-list-header">
          <button className="back-button" onClick={onBack} aria-label="Go back">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <h1 className="mr-list-title">MR List</h1>
        </div>

        <div className="mr-list-controls">
          <div className="search-bar">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
              <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <input
              type="text"
              placeholder="Search by Emp ID, Name, Email, Mobile, or Region..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="filter-tabs">
            <button
              className={`filter-tab ${statusFilter === 'All' ? 'active' : ''}`}
              onClick={() => setStatusFilter('All')}
            >
              All ({mrData.length})
            </button>
            <button
              className={`filter-tab ${statusFilter === 'Active' ? 'active' : ''}`}
              onClick={() => setStatusFilter('Active')}
            >
              Active ({mrData.filter(m => m.status === 'Active').length})
            </button>
            <button
              className={`filter-tab ${statusFilter === 'Inactive' ? 'active' : ''}`}
              onClick={() => setStatusFilter('Inactive')}
            >
              Inactive ({mrData.filter(m => m.status === 'Inactive').length})
            </button>
          </div>
        </div>

        <div className="mr-table-container">
          <table className="mr-table">
            <thead>
              <tr>
                <th>Emp ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Mobile</th>
                <th>Designation</th>
                <th>Region</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredMRs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="no-data-cell">
                    <div className="no-data">
                      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="no-data-icon">
                        <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89318 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88M13 7C13 9.20914 11.2091 11 9 11C6.79086 11 5 9.20914 5 7C5 4.79086 6.79086 3 9 3C11.2091 3 13 4.79086 13 7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <p>No MRs found matching your search criteria.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredMRs.map((mr) => (
                  <tr key={mr.id} className="mr-row" onClick={() => handleMRClick(mr)}>
                    <td>{mr.empId}</td>
                    <td className="mr-name">{mr.name}</td>
                    <td>{mr.email}</td>
                    <td>{mr.mobile}</td>
                    <td>{mr.designation}</td>
                    <td>{mr.region}</td>
                    <td>
                      <span className={`status-badge ${mr.status.toLowerCase()}`}>
                        {mr.status || 'N/A'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  )
}

export default MRList
