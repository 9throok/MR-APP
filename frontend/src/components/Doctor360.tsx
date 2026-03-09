import { useState, useEffect } from 'react'
import {
  PAGE_CONTENT,
  PAGE_TITLE,
  BACK_BUTTON,
  CARD,
  CARD_PADDING,
  CARD_SM_PADDING,
  BTN_SECONDARY,
  SECTION_TITLE,
  BADGE_PRIMARY,
  BADGE_INFO,
  BADGE_SUCCESS,
} from '../styles/designSystem'

interface Doctor360Props {
  onLogout: () => void
  onBack: () => void
  userName?: string
  onNavigate?: (page: string) => void
}

interface HistoryItem {
  id: number
  date: string
  type: 'call' | 'visit' | 'sample' | 'order' | 'meeting'
  title: string
  description: string
  brand?: string
  samples?: string[]
  amount?: number
}

function Doctor360({ onLogout: _onLogout, onBack, userName: _userName, onNavigate }: Doctor360Props) {
  const [client, setClient] = useState<any>(null)

  useEffect(() => {
    // Get client data from sessionStorage
    const stored = sessionStorage.getItem('doctor360Client')
    if (stored) {
      setClient(JSON.parse(stored))
    }
  }, [])

  const handleBackClick = () => {
    sessionStorage.removeItem('doctor360Client')
    sessionStorage.removeItem('previousPage')
    // Always navigate back to clients page
    if (onNavigate) {
      onNavigate('clients')
    } else {
      onBack()
    }
  }

  // Dummy data - in real app, this would come from API based on client ID
  const clientInfo = client || {
    id: 1,
    name: 'Dr. Anil Doshi',
    specialization: 'Cardiologist',
    mobile: '+91 98765 43210',
    email: 'anil.doshi@hospital.com',
    homeAddress: '789 Residential Complex, Juhu, Mumbai - 400049',
    type: 'doctor',
    qualification: 'MBBS, MD (Cardiology)',
    experience: '15 years',
    hospital: 'New Life Hospital',
    hospitalAddress: '123 Medical Complex, Bandra West, Mumbai - 400050',
    clinicAddress: '456 Health Care Center, Andheri East, Mumbai - 400069',
    consultationFee: '₹800',
    timings: 'Mon-Fri: 10:00 AM - 2:00 PM',
    languages: ['English', 'Hindi', 'Marathi'],
  }

  const handleDCR = () => {
    // Store client info for DCR page
    try {
      const dcrItem = {
        id: clientInfo.id,
        name: clientInfo.name,
        type: clientInfo.type === 'doctor' ? 'doctor' : clientInfo.type === 'pharmacy' ? 'pharmacy' : 'pharmacy',
        specialization: clientInfo.specialization,
        mobile: clientInfo.mobile,
        address: clientInfo.homeAddress || clientInfo.hospitalAddress || clientInfo.clinicAddress || (clientInfo as any).address || ''
      }
      sessionStorage.setItem('dcrSelectedItem', JSON.stringify(dcrItem))
      if (onNavigate) {
        onNavigate('dcr')
      }
    } catch (error) {
      console.error('Error storing DCR item:', error)
    }
  }

  const historyData: HistoryItem[] = [
    {
      id: 1,
      date: '2024-01-15',
      type: 'visit',
      title: 'Product Discussion',
      description: 'Discussed new cardiovascular medication benefits and protocols',
      brand: 'Cardiovascular Health',
      samples: ['Sample A - Cardiovascular (Qty: 5)'],
    },
    {
      id: 2,
      date: '2024-01-10',
      type: 'call',
      title: 'Follow-up Call',
      description: 'Followed up on previous visit and answered queries',
      brand: 'Diabetes Care',
    },
    {
      id: 3,
      date: '2024-01-05',
      type: 'sample',
      title: 'Samples Provided',
      description: 'Provided samples for patient trial',
      samples: ['Sample A - Cardiovascular (Qty: 10)', 'Sample B - Diabetes (Qty: 8)'],
    },
    {
      id: 4,
      date: '2023-12-28',
      type: 'order',
      title: 'Order Placed',
      description: 'Placed order for cardiovascular medications',
      brand: 'Cardiovascular Health',
      amount: 125000,
    },
    {
      id: 5,
      date: '2023-12-20',
      type: 'meeting',
      title: 'Joint Working',
      description: 'Joint working session with manager Sarah Williams',
      brand: 'Neurological Disorders',
    },
    {
      id: 6,
      date: '2023-12-15',
      type: 'visit',
      title: 'Product Presentation',
      description: 'Presented new product line and clinical data',
      brand: 'Respiratory Care',
      samples: ['Sample F - Respiratory (Qty: 3)'],
    },
  ]

  const callFrequencyData = [
    { month: 'Jan', calls: 8 },
    { month: 'Feb', calls: 12 },
    { month: 'Mar', calls: 10 },
    { month: 'Apr', calls: 9 },
    { month: 'May', calls: 11 },
    { month: 'Jun', calls: 10 },
  ]


  const samplesGivenData = [
    { sample: 'Sample A - Cardiovascular', quantity: 45 },
    { sample: 'Sample B - Diabetes', quantity: 32 },
    { sample: 'Sample F - Respiratory', quantity: 18 },
  ]

  const getHistoryIcon = (type: HistoryItem['type']) => {
    switch (type) {
      case 'call':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22 16.92V19.92C22.0011 20.1985 21.9441 20.4742 21.8325 20.7292C21.7209 20.9841 21.5573 21.2126 21.3528 21.3992C21.1482 21.5857 20.9071 21.7261 20.6447 21.8114C20.3823 21.8966 20.1045 21.9248 19.83 21.894C16.7428 21.5356 13.787 20.5301 11.19 18.95C8.77382 17.5362 6.72533 15.4877 5.31 13.07C3.71997 10.4593 2.71523 7.48799 2.37 4.38C2.33924 4.1055 2.36738 3.82772 2.45262 3.5653C2.53786 3.30288 2.67825 3.06182 2.86482 2.85728C3.05139 2.65274 3.27987 2.48919 3.53482 2.37759C3.78977 2.26599 4.06549 2.20901 4.34 2.21H7.34C7.75913 2.20997 8.16356 2.37576 8.46376 2.67176C8.76396 2.96776 8.93818 3.37126 8.95 3.79C9.02174 4.82099 9.19252 5.84212 9.46 6.84C9.60393 7.345 9.56751 7.88864 9.35628 8.37364C9.14505 8.85864 8.77319 9.25274 8.31 9.49L6.75 10.19C8.04786 12.4605 9.93952 14.3522 12.21 15.65L12.92 14.09C13.1572 13.6268 13.5513 13.2549 14.0363 13.0437C14.5213 12.8325 15.065 12.7961 15.57 12.94C16.5679 13.2075 17.589 13.3783 18.62 13.45C19.0387 13.4618 19.4422 13.636 19.7382 13.9362C20.0342 14.2364 20.2 14.6409 20.2 15.06L20.19 18.06H20.19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )
      case 'visit':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M21 10C21 17 12 23 12 23C12 23 3 17 3 10C3 7.61305 3.94821 5.32387 5.63604 3.63604C7.32387 1.94821 9.61305 1 12 1C14.3869 1 16.6761 1.94821 18.364 3.63604C20.0518 5.32387 21 7.61305 21 10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 13C13.6569 13 15 11.6569 15 10C15 8.34315 13.6569 7 12 7C10.3431 7 9 8.34315 9 10C9 11.6569 10.3431 13 12 13Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )
      case 'sample':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19.5 12C19.5 12.2761 19.2761 12.5 19 12.5C18.7239 12.5 18.5 12.2761 18.5 12C18.5 11.7239 18.7239 11.5 19 11.5C19.2761 11.5 19.5 11.7239 19.5 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 3L4 7V11C4 16.55 7.84 21.74 12 23C16.16 21.74 20 16.55 20 11V7L12 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )
      case 'order':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 11L12 14L22 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M21 12V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )
      case 'meeting':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89318 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88M13 7C13 9.20914 11.2091 11 9 11C6.79086 11 5 9.20914 5 7C5 4.79086 6.79086 3 9 3C11.2091 3 13 4.79086 13 7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )
      default:
        return null
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  }

  const maxCalls = Math.max(...callFrequencyData.map(d => d.calls))
  const maxSamples = Math.max(...samplesGivenData.map(d => d.quantity))

  return (
    <div className={PAGE_CONTENT}>
      <div className="flex items-center gap-3 mb-6">
        <button className={BACK_BUTTON} onClick={handleBackClick} aria-label="Go back">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <h1 className={PAGE_TITLE}>
          {clientInfo.type === 'doctor' ? 'Doctor Details' : clientInfo.type === 'pharmacy' ? 'Pharmacy Details' : 'Distributor Details'}
        </h1>
      </div>

      {/* Client Info Card */}
      <div className={`${CARD} ${CARD_PADDING}`}>
        <div className="flex items-start gap-5 flex-wrap">
          <div className="w-16 h-16 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center text-xl font-bold shrink-0">
            {(() => {
              // Split name and filter out titles like "Dr.", "Mr.", etc.
              const nameParts = clientInfo.name.trim().split(/\s+/).filter((part: string) => part && !part.match(/^[A-Z][a-z]?\.$/))
              // Get first name (first part after filtering)
              const firstName = nameParts.length > 0 ? nameParts[0] : ''
              // Get last name (last part, which should be different from first name if multiple parts exist)
              const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : nameParts[0] || ''
              const firstLetter = firstName ? firstName.charAt(0).toUpperCase() : ''
              const lastLetter = lastName ? lastName.charAt(0).toUpperCase() : ''
              return firstLetter + lastLetter
            })()}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-semibold text-slate-900">{clientInfo.name}</h2>
            {clientInfo.specialization && (
              <p className="text-sm text-indigo-600 font-medium">{clientInfo.specialization}</p>
            )}
            {clientInfo.qualification && (
              <p className="text-sm text-slate-500">{clientInfo.qualification}</p>
            )}
            <div>
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Mobile: </span>
                <span className="text-sm text-slate-700">{clientInfo.mobile}</span>
              </div>
              <div>
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Email: </span>
                <span className="text-sm text-slate-700">test@zenapp.com</span>
              </div>
          </div>
          <div className="flex gap-2 ml-auto">
            {/* DCR button - shown for doctor, pharmacy, and distributor */}
            <button
              className={BTN_SECONDARY}
              onClick={handleDCR}
              aria-label="DCR"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M16 13H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M16 17H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M10 9H9H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>DCR</span>
            </button>
            {/* RCPA button - only shown for pharmacy */}
            {clientInfo.type === 'pharmacy' && (
              <button
                className={BTN_SECONDARY}
                onClick={() => onNavigate?.('enter-rcpa')}
                aria-label="RCPA Entry"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M16 13H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M16 17H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M10 9H9H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>RCPA</span>
              </button>
            )}
            {/* eDetailing button - shown for doctor, pharmacy, and distributor */}
            <button
              className={BTN_SECONDARY}
              onClick={() => onNavigate?.('edetailing')}
              aria-label="eDetailing"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>eDetailing</span>
            </button>
          </div>
        </div>
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-6 border-t border-slate-100">
            <div className="flex gap-3 text-slate-500">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19.5 12C19.5 12.2761 19.2761 12.5 19 12.5C18.7239 12.5 18.5 12.2761 18.5 12C18.5 11.7239 18.7239 11.5 19 11.5C19.2761 11.5 19.5 11.7239 19.5 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 3L4 7V11C4 16.55 7.84 21.74 12 23C16.16 21.74 20 16.55 20 11V7L12 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <div>
                <div>
                  <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                    {clientInfo.type === 'doctor' ? 'Prescribed Medicines' : clientInfo.type === 'pharmacy' ? 'Prescribed Doctors' : 'Medicines'}
                  </span>
                </div>
                {clientInfo.type === 'doctor' || clientInfo.type === 'distributor' ? (
                  <>
                    <div>
                      <span className="text-sm text-slate-700">1. Atorvastatin 20mg</span>
                    </div>
                    <div>
                      <span className="text-sm text-slate-700">2. Metoprolol 50mg</span>
                    </div>
                    <div>
                      <span className="text-sm text-slate-700">3. Aspirin 75mg</span>
                    </div>
                    <div>
                      <span className="text-sm text-slate-700">4. Enalapril 5mg</span>
                    </div>
                  </>
                ) : clientInfo.type === 'pharmacy' ? (
                  <>
                    <div>
                      <span className="text-sm text-slate-700">1. Dr. Anil Doshi, Cardiologist</span>
                    </div>
                    <div>
                      <span className="text-sm text-slate-700">2. Dr. Navin Chaddha, Neurologist</span>
                    </div>
                    <div>
                      <span className="text-sm text-slate-700">3. Dr. Surbhi Rel, Gynecologist</span>
                    </div>
                    <div>
                      <span className="text-sm text-slate-700">4. Dr. Rajesh Kumar, Orthopedic</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <span className="text-sm text-slate-700">1. Apollo Hospital, Mumbai</span>
                    </div>
                    <div>
                      <span className="text-sm text-slate-700">2. Fortis Hospital, Delhi</span>
                    </div>
                    <div>
                      <span className="text-sm text-slate-700">3. Max Hospital, Bangalore</span>
                    </div>
                    <div>
                      <span className="text-sm text-slate-700">4. New Life Hospital, Pune</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {clientInfo.type === 'doctor' ? (
              <div className="flex gap-3 text-slate-500">
                <div>
                  <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Address</span>
                  <span className="text-sm text-slate-700">{clientInfo.homeAddress || clientInfo.address || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Hospital Address</span>
                  <span className="text-sm text-slate-700">607, Mantra Hospital, Bandra West, Mumbai - 400050</span>
                </div>
                <div>
                  <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Clinic Address</span>
                  <span className="text-sm text-slate-700">456, Health Care Center, Andheri East, Mumbai - 400069</span>
                </div>
              </div>
            ) : (
              <div className="flex gap-3 text-slate-500">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M21 10C21 17 12 23 12 23C12 23 3 17 3 10C3 7.61305 3.94821 5.32387 5.63604 3.63604C7.32387 1.94821 9.61305 1 12 1C14.3869 1 16.6761 1.94821 18.364 3.63604C20.0518 5.32387 21 7.61305 21 10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 13C13.6569 13 15 11.6569 15 10C15 8.34315 13.6569 7 12 7C10.3431 7 9 8.34315 9 10C9 11.6569 10.3431 13 12 13Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <div>
                  <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Address</span>
                  <span className="text-sm text-slate-700">{clientInfo.address || (clientInfo as any).homeAddress || 'N/A'}</span>
                </div>
              </div>
            )}
            {clientInfo.consultationFee && (
              <div className="flex gap-3 text-slate-500">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 1V23M17 5H9.5C8.57174 5 7.6815 5.36875 7.02513 6.02513C6.36875 6.6815 6 7.57174 6 8.5C6 9.42826 6.36875 10.3185 7.02513 10.9749C7.6815 11.6313 8.57174 12 9.5 12H14.5C15.4283 12 16.3185 12.3687 16.9749 13.0251C17.6313 13.6815 18 14.5717 18 15.5C18 16.4283 17.6313 17.3185 16.9749 17.9749C16.3185 18.6313 15.4283 19 14.5 19H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <div>
                  <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Consultation Fee</span>
                  <span className="text-sm text-slate-700">{clientInfo.consultationFee}</span>
                </div>
              </div>
            )}
            {clientInfo.timings && (
              <div className="flex gap-3 text-slate-500">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                  <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                <div>
                  <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Timings</span>
                  <span className="text-sm text-slate-700">{clientInfo.timings}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        {/* Number Of Visits Chart */}
        <div className={`${CARD} ${CARD_PADDING}`}>
          <h3 className="text-sm font-semibold text-slate-900 mb-4">Number Of Visits</h3>
          <div className="space-y-3">
            {callFrequencyData.map((item, index) => (
              <div key={index} className="flex items-center gap-3">
                <span className="text-xs text-slate-500 w-8 shrink-0">{item.month}</span>
                <div className="flex-1 bg-slate-100 rounded-full h-6 overflow-hidden">
                  <div
                    className="bg-indigo-500 h-full rounded-full flex items-center justify-end pr-2 text-xs text-white font-medium transition-all"
                    style={{ width: `${(item.calls / maxCalls) * 100}%` }}
                  >
                    <span>{item.calls}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>


        {/* Samples Given Chart */}
        <div className={`${CARD} ${CARD_PADDING}`}>
          <h3 className="text-sm font-semibold text-slate-900 mb-4">Samples Given</h3>
          <div className="space-y-3">
            {samplesGivenData.map((item, index) => (
              <div key={index} className="flex items-center gap-3">
                <span className="text-xs text-slate-500 w-8 shrink-0">{item.sample}</span>
                <div className="flex-1 bg-slate-100 rounded-full h-6 overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full flex items-center justify-end pr-2 text-xs text-white font-medium transition-all"
                    style={{ width: `${(item.quantity / maxSamples) * 100}%` }}
                  >
                    <span>{item.quantity}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* History Timeline */}
      <div className="mt-6">
        <h2 className={SECTION_TITLE}>Interaction History</h2>
        <div className="space-y-4">
          {historyData.map((item) => (
            <div key={item.id} className={`${CARD} ${CARD_SM_PADDING} flex gap-4`}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-slate-100 text-slate-500">
                {getHistoryIcon(item.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-slate-900">{item.title}</h4>
                  <span className="text-xs text-slate-400">{formatDate(item.date)}</span>
                </div>
                <p className="text-sm text-slate-600 mt-1">{item.description}</p>
                {item.brand && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className={BADGE_PRIMARY}>{item.brand}</span>
                  </div>
                )}
                {item.samples && item.samples.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {item.samples.map((sample, idx) => (
                      <span key={idx} className={BADGE_INFO}>{sample}</span>
                    ))}
                  </div>
                )}
                {item.amount && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className={BADGE_SUCCESS}>Order Value: ₹{item.amount.toLocaleString('en-IN')}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Doctor360
