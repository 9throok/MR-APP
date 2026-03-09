import { useState } from 'react'
import {
  PAGE_CONTENT,
  BACK_BUTTON,
  PAGE_TITLE,
  CARD,
  SEARCH_INPUT,
  TABLE,
  TABLE_HEAD,
  TABLE_TH,
  TABLE_TD,
  TABLE_ROW,
  BADGE_SUCCESS,
  BADGE_WARNING,
  BADGE_DANGER,
  EMPTY_STATE,
  EMPTY_TITLE,
  EMPTY_ICON,
  BTN_PRIMARY,
} from '../styles/designSystem'

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

function TourPlanRequests({ onLogout: _onLogout, onBack, userName: _userName, onNavigate: _onNavigate }: TourPlanRequestsProps) {
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

  const statusBadgeClass = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved': return BADGE_SUCCESS
      case 'rejected': return BADGE_DANGER
      case 'pending': return BADGE_WARNING
      default: return BADGE_WARNING
    }
  }

  return (
    <div className={PAGE_CONTENT}>
      <main>
        <div className="flex items-center gap-3 mb-6">
          <button className={BACK_BUTTON} onClick={onBack} aria-label="Go back">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <h1 className={PAGE_TITLE}>Tour Plan Requests</h1>
        </div>

        <div className="flex items-center gap-3 mb-6">
          <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
            <button
              className={`px-3 py-1.5 text-sm font-medium rounded-md ${requestType === 'STP' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              onClick={() => setRequestType('STP')}
            >
              STP ({stpCount})
            </button>
            <button
              className={`px-3 py-1.5 text-sm font-medium rounded-md ${requestType === 'MTP' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              onClick={() => setRequestType('MTP')}
            >
              MTP ({mtpCount})
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
                <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <input
                type="text"
                placeholder="Search by Emp ID, MR Name"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={SEARCH_INPUT}
              />
            </div>
            <button className={BTN_PRIMARY} onClick={() => {}}>
              Search
            </button>
          </div>
        </div>

        <div className={`${CARD} overflow-hidden`}>
          <table className={TABLE}>
            <thead className={TABLE_HEAD}>
              <tr>
                <th className={TABLE_TH}>Emp ID</th>
                <th className={TABLE_TH}>MR Name</th>
                <th className={TABLE_TH}>Quarter</th>
                <th className={TABLE_TH}>Requested Date</th>
                <th className={TABLE_TH}>Year</th>
                <th className={TABLE_TH}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <div className={EMPTY_STATE}>
                      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={EMPTY_ICON}>
                        <path d="M4 7V5C4 3.89543 4.89543 3 6 3H18C19.1046 3 20 3.89543 20 5V7M4 7H20M4 7L5 19C5 20.1046 5.89543 21 7 21H17C18.1046 21 19 20.1046 19 19L20 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <p className={EMPTY_TITLE}>No data</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRequests.map((request) => (
                  <tr key={request.id} className={TABLE_ROW}>
                    <td className={TABLE_TD}>{request.empId}</td>
                    <td className={TABLE_TD}>{request.mrName}</td>
                    <td className={TABLE_TD}>{request.quarter}</td>
                    <td className={TABLE_TD}>{new Date(request.requestedDate).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}</td>
                    <td className={TABLE_TD}>{request.year}</td>
                    <td className={TABLE_TD}>
                      <div className="flex gap-2">
                        {request.status === 'Pending' ? (
                          <>
                            <button
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 text-white text-xs font-medium rounded-lg hover:bg-emerald-700 transition-colors cursor-pointer border-none"
                              onClick={() => handleApprove(request.id)}
                              aria-label="Approve"
                            >
                              Approve
                            </button>
                            <button
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded-lg hover:bg-red-700 transition-colors cursor-pointer border-none"
                              onClick={() => handleReject(request.id)}
                              aria-label="Reject"
                            >
                              Reject
                            </button>
                          </>
                        ) : (
                          <span className={statusBadgeClass(request.status)}>
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
