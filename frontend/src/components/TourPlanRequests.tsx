import { useState } from 'react'
import Header from './Header'
import Sidebar from './Sidebar'
import './TourPlanRequests.css'

interface TourPlanRequestsProps {
  onLogout: () => void
  onBack: () => void
  userName?: string
  onNavigate?: (page: string) => void
}

interface TourPlanRequest {
  id: string
  empId: string
  mrName: string
  quarter: string
  requestedDate: string
  year: string
  status: 'Pending' | 'Approved' | 'Rejected'
  type: 'STP' | 'MTP'
}

function TourPlanRequests({ onLogout, onBack, userName, onNavigate }: TourPlanRequestsProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [requestType, setRequestType] = useState<'STP' | 'MTP'>('STP')
  const [searchQuery, setSearchQuery] = useState('')

  // Static MR data
  const [requests, setRequests] = useState<TourPlanRequest[]>([
    {
      id: '1',
      empId: 'EMP001',
      mrName: 'Rajesh Kumar',
      quarter: 'Q1',
      requestedDate: '2024-01-15',
      year: '2024',
      status: 'Pending',
      type: 'STP'
    },
    {
      id: '2',
      empId: 'EMP002',
      mrName: 'Priya Sharma',
      quarter: 'Q1',
      requestedDate: '2024-01-18',
      year: '2024',
      status: 'Pending',
      type: 'STP'
    },
    {
      id: '3',
      empId: 'EMP003',
      mrName: 'Amit Patel',
      quarter: 'Q2',
      requestedDate: '2024-02-10',
      year: '2024',
      status: 'Pending',
      type: 'MTP'
    }
  ])

  const handleMenuClick = () => {
    setSidebarOpen(true)
  }

  const handleSidebarClose = () => {
    setSidebarOpen(false)
  }

  const handleApprove = (id: string) => {
    setRequests(requests.map(req => 
      req.id === id ? { ...req, status: 'Approved' as const } : req
    ))
  }

  const handleReject = (id: string) => {
    setRequests(requests.map(req => 
      req.id === id ? { ...req, status: 'Rejected' as const } : req
    ))
  }

  const filteredRequests = requests.filter(req => {
    const matchesType = req.type === requestType
    const matchesSearch = searchQuery === '' || 
      req.empId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.mrName.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesType && matchesSearch
  })

  const stpCount = requests.filter(r => r.type === 'STP').length
  const mtpCount = requests.filter(r => r.type === 'MTP').length

  return (
    <div className="tour-plan-requests-container">
      <Header onLogout={onLogout} onMenuClick={handleMenuClick} onNavigateHome={() => onNavigate?.('home')} onNavigateOfflineRequests={() => onNavigate?.('offline-requests')} />
      <Sidebar isOpen={sidebarOpen} onClose={handleSidebarClose} userName={userName} onNavigate={onNavigate} onLogout={onLogout} currentPage="tour-plan-requests" />
      <main className="tour-plan-requests-content">
        <div className="tour-plan-requests-header">
          <button className="back-button" onClick={onBack} aria-label="Go back">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <h1 className="tour-plan-requests-title">Tour Plan Requests</h1>
        </div>

        <div className="tour-plan-requests-controls">
          <div className="segmented-control">
            <button
              className={`segment ${requestType === 'STP' ? 'active' : ''}`}
              onClick={() => setRequestType('STP')}
            >
              STP ({stpCount})
            </button>
            <button
              className={`segment ${requestType === 'MTP' ? 'active' : ''}`}
              onClick={() => setRequestType('MTP')}
            >
              MTP ({mtpCount})
            </button>
          </div>

          <div className="search-container">
            <div className="search-bar">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
                <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <input
                type="text"
                placeholder="Search by Emp ID, MR Name"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
            </div>
            <button className="search-button" onClick={() => {}}>
              Search
            </button>
          </div>
        </div>

        <div className="table-container">
          <table className="tour-plan-requests-table">
            <thead>
              <tr>
                <th>Emp ID</th>
                <th>MR Name</th>
                <th>Quarter</th>
                <th>Requested Date</th>
                <th>Year</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="no-data-cell">
                    <div className="no-data">
                      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="no-data-icon">
                        <path d="M4 7V5C4 3.89543 4.89543 3 6 3H18C19.1046 3 20 3.89543 20 5V7M4 7H20M4 7L5 19C5 20.1046 5.89543 21 7 21H17C18.1046 21 19 20.1046 19 19L20 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <p>No data</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRequests.map((request) => (
                  <tr key={request.id}>
                    <td>{request.empId}</td>
                    <td>{request.mrName}</td>
                    <td>{request.quarter}</td>
                    <td>{new Date(request.requestedDate).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}</td>
                    <td>{request.year}</td>
                    <td>
                      <div className="action-buttons">
                        {request.status === 'Pending' ? (
                          <>
                            <button
                              className="approve-btn"
                              onClick={() => handleApprove(request.id)}
                              aria-label="Approve"
                            >
                              Approve
                            </button>
                            <button
                              className="reject-btn"
                              onClick={() => handleReject(request.id)}
                              aria-label="Reject"
                            >
                              Reject
                            </button>
                          </>
                        ) : (
                          <span className={`status-badge ${request.status.toLowerCase()}`}>
                            {request.status}
                          </span>
                        )}
                      </div>
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

export default TourPlanRequests
