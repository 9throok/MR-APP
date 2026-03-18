import { useState, useEffect } from 'react'
import Header from './Header'
import Sidebar from './Sidebar'
import { useLanguage } from '../contexts/LanguageContext'
import { apiGet } from '../services/apiService'
import './Clients.css'

interface Client {
  id: number
  name: string
  specialization?: string
  mobile: string
  address: string
  type: 'doctor' | 'pharmacy' | 'distributor' | 'hospital' | 'clinic'
  // Extra fields from doctor_profiles for Doctor360
  tier?: string
  territory?: string
  preferred_visit_day?: string
  notes?: string
}

// Pharmacy & distributor data remains hardcoded (no backend tables yet)
const staticClients: Client[] = [
  // Pharmacy
  { id: 9, name: 'MedPlus Pharmacy', specialization: 'Retail Pharmacy', mobile: '+91 98765 43220', address: '123 MG Road, Mumbai', type: 'pharmacy' },
  { id: 10, name: 'Apollo Pharmacy', specialization: 'Chain Pharmacy', mobile: '+91 98765 43221', address: '456 Park Street, Mumbai', type: 'pharmacy' },
  { id: 11, name: 'Wellness Forever', specialization: 'Retail Pharmacy', mobile: '+91 98765 43222', address: '789 Linking Road, Mumbai', type: 'pharmacy' },
  { id: 12, name: 'Guardian Pharmacy', specialization: 'Chain Pharmacy', mobile: '+91 98765 43223', address: '321 Bandra West, Mumbai', type: 'pharmacy' },
  { id: 13, name: 'Health Plus Pharmacy', specialization: 'Retail Pharmacy', mobile: '+91 98765 43224', address: '654 Andheri East, Mumbai', type: 'pharmacy' },
  { id: 14, name: 'Care Pharmacy', specialization: 'Retail Pharmacy', mobile: '+91 98765 43225', address: '987 Vashi, Navi Mumbai', type: 'pharmacy' },

  // Distributors
  { id: 15, name: 'MediDistributors Pvt Ltd', specialization: 'Medical Distributor', mobile: '+91 98765 43230', address: 'Industrial Area, Mumbai', type: 'distributor' },
  { id: 16, name: 'HealthCare Supplies', specialization: 'Medical Distributor', mobile: '+91 98765 43231', address: 'Sector 18, Navi Mumbai', type: 'distributor' },
  { id: 17, name: 'Pharma Distributors', specialization: 'Pharmaceutical Distributor', mobile: '+91 98765 43232', address: 'MIDC Area, Thane', type: 'distributor' },
  { id: 18, name: 'MedEquip Distributors', specialization: 'Medical Equipment', mobile: '+91 98765 43233', address: 'BKC, Mumbai', type: 'distributor' },
  { id: 19, name: 'Global Medical Supplies', specialization: 'Medical Distributor', mobile: '+91 98765 43234', address: 'Andheri East, Mumbai', type: 'distributor' },
]

interface ClientsProps {
  onLogout: () => void
  onBack: () => void
  userName?: string
  onNavigate?: (page: string) => void
}

function Clients({ onLogout, onBack, userName, onNavigate }: ClientsProps) {
  const { t } = useLanguage()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [selectedType, setSelectedType] = useState<Client['type']>('doctor')
  const [doctorsFromDB, setDoctorsFromDB] = useState<Client[]>([])
  const [doctorsLoading, setDoctorsLoading] = useState(true)

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const data = await apiGet('/doctors')
        const mapped: Client[] = (data.data || []).map((d: any) => ({
          id: d.id,
          name: d.name,
          specialization: d.specialty || 'General',
          mobile: d.phone || '',
          address: d.hospital || '',
          type: 'doctor' as const,
          tier: d.tier,
          territory: d.territory,
          preferred_visit_day: d.preferred_visit_day,
          notes: d.notes,
        }))
        setDoctorsFromDB(mapped)
      } catch (err) {
        console.error('Error fetching doctors:', err)
      } finally {
        setDoctorsLoading(false)
      }
    }
    fetchDoctors()
  }, [])

  const clientTypes = [
    { id: 'doctor', label: t('doctors'), icon: '👨‍⚕️' },
    { id: 'pharmacy', label: t('pharmacy'), icon: '💊' },
    { id: 'distributor', label: t('distributors'), icon: '🚚' },
  ]

  const filteredClients = selectedType === 'doctor'
    ? doctorsFromDB
    : staticClients.filter(client => client.type === selectedType)

  const handleMenuClick = () => {
    setSidebarOpen(true)
  }

  const handleSidebarClose = () => {
    setSidebarOpen(false)
  }

  return (
    <div className="clients-container">
      <Header onLogout={onLogout} onMenuClick={handleMenuClick} onNavigateHome={() => onNavigate?.('home')} onNavigateOfflineRequests={() => onNavigate?.('offline-requests')} />
      <Sidebar isOpen={sidebarOpen} onClose={handleSidebarClose} userName={userName} onNavigate={onNavigate} onLogout={onLogout} />
      <main className="clients-content">
        <div className="clients-header">
          <button className="back-button" onClick={onBack} aria-label="Go back">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <h1 className="clients-title">{t('customer360')}</h1>
        </div>

        <div className="client-types-tabs">
          {clientTypes.map((type) => (
            <button
              key={type.id}
              className={`client-type-tab ${selectedType === type.id ? 'active' : ''}`}
              onClick={() => setSelectedType(type.id as any)}
            >
              <span className="tab-icon">{type.icon}</span>
              <span className="tab-label">{type.label}</span>
            </button>
          ))}
        </div>

        <div className="clients-list">
          {selectedType === 'doctor' && doctorsLoading ? (
            <div className="no-clients">
              <p>Loading doctors...</p>
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="no-clients">
              <p>{t('noClientsFound')}</p>
            </div>
          ) : (
            filteredClients.map((client) => (
              <div key={client.id} className="client-card">
                <div className="client-card-header">
                  <div className="client-avatar">
                    {client.name.charAt(0)}
                  </div>
                  <div className="client-info">
                    <h3 className="client-name">{client.name}</h3>
                    {client.specialization && (
                      <p className="client-specialization">{client.specialization}</p>
                    )}
                  </div>
                </div>
                <div className="client-details">
                  <div className="client-detail-item">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M3 5C3 3.89543 3.89543 3 5 3H8.27924C8.70967 3 9.11181 3.21447 9.3509 3.57594L10.7192 5.42594C10.9583 5.78741 11.3604 6.00188 11.7909 6.00188H19C20.1046 6.00188 21 6.89631 21 8.00188V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M3 10H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span>{client.type.charAt(0).toUpperCase() + client.type.slice(1)}</span>
                  </div>
                  <div className="client-detail-item">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M3 5C3 3.89543 3.89543 3 5 3H8.27924C8.70967 3 9.11181 3.21447 9.3509 3.57594L10.7192 5.42594C10.9583 5.78741 11.3604 6.00188 11.7909 6.00188H19C20.1046 6.00188 21 6.89631 21 8.00188V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M8 10H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span>{client.mobile}</span>
                  </div>
                  <div className="client-detail-item">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M21 10C21 17 12 23 12 23C12 23 3 17 3 10C3 7.61305 3.94821 5.32387 5.63604 3.63604C7.32387 1.94821 9.61305 1 12 1C14.3869 1 16.6761 1.94821 18.364 3.63604C20.0518 5.32387 21 7.61305 21 10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M12 13C13.6569 13 15 11.6569 15 10C15 8.34315 13.6569 7 12 7C10.3431 7 9 8.34315 9 10C9 11.6569 10.3431 13 12 13Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span>{client.address}</span>
                  </div>
                </div>
                <div className="client-actions">
                  <button
                    className="view-details-btn"
                    onClick={() => {
                      if (onNavigate) {
                        sessionStorage.setItem('doctor360Client', JSON.stringify(client))
                        onNavigate('doctor360')
                      }
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M1 12S5 4 12 4S23 12 23 12S19 20 12 20S1 12 1 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                    <span>{t('viewDetails')}</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  )
}

export default Clients
