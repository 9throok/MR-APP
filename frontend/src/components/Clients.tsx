import { useState } from 'react'
import { useLanguage } from '../contexts/LanguageContext'
import {
  PAGE_CONTENT,
  PAGE_TITLE,
  BACK_BUTTON,
  CARD,
  CARD_PADDING,
  FILTER_PILL_ACTIVE,
  FILTER_PILL_INACTIVE,
  AVATAR_LG,
  EMPTY_STATE,
  EMPTY_TITLE,
} from '../styles/designSystem'

interface Client {
  id: number
  name: string
  specialization?: string
  mobile: string
  address: string
  type: 'doctor' | 'pharmacy' | 'distributor' | 'hospital' | 'clinic'
}

const dummyClients: Client[] = [
  // Doctors
  { id: 1, name: 'Dr. Anil Doshi', specialization: 'Cardiologist', mobile: '+91 98765 43210', address: 'New Life Hospital, Mumbai', type: 'doctor' },
  { id: 2, name: 'Dr. Navin Chaddha', specialization: 'Neurologist', mobile: '+91 98765 43211', address: 'Chaddha Hospital, Mumbai', type: 'doctor' },
  { id: 3, name: 'Dr. Surbhi Rel', specialization: 'Gynecologist', mobile: '+91 98765 43212', address: 'Love Life Maternity, Mumbai', type: 'doctor' },
  { id: 4, name: 'Dr. Naresh Patil', specialization: 'Neurologist', mobile: '+91 98765 43213', address: 'Chaddha Hospital, Mumbai', type: 'doctor' },
  { id: 5, name: 'Dr. Surekha Rane', specialization: 'Gynecologist', mobile: '+91 98765 43214', address: 'Love Life Maternity, Mumbai', type: 'doctor' },
  { id: 6, name: 'Dr. Rajesh Kumar', specialization: 'Orthopedic', mobile: '+91 98765 43215', address: 'Apollo Hospital, Delhi', type: 'doctor' },
  { id: 7, name: 'Dr. Priya Sharma', specialization: 'Pediatrician', mobile: '+91 98765 43216', address: 'Fortis Hospital, Bangalore', type: 'doctor' },
  { id: 8, name: 'Dr. Amit Verma', specialization: 'Dermatologist', mobile: '+91 98765 43217', address: 'Max Hospital, Delhi', type: 'doctor' },

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

function Clients({ onLogout: _onLogout, onBack, userName: _userName, onNavigate }: ClientsProps) {
  const { t } = useLanguage()
  const [selectedType, setSelectedType] = useState<Client['type']>('doctor')

  const clientTypes = [
    { id: 'doctor', label: t('doctors'), icon: '👨‍⚕️' },
    { id: 'pharmacy', label: t('pharmacy'), icon: '💊' },
    { id: 'distributor', label: t('distributors'), icon: '🚚' },
  ]

  const filteredClients = dummyClients.filter(client => client.type === selectedType)

  return (
    <div className={PAGE_CONTENT}>
      <div className="flex items-center gap-3 mb-6">
        <button className={BACK_BUTTON} onClick={onBack} aria-label="Go back">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <h1 className={PAGE_TITLE}>{t('customer360')}</h1>
      </div>

      <div className="flex gap-2 mb-6">
        {clientTypes.map((type) => (
          <button
            key={type.id}
            className={selectedType === type.id ? FILTER_PILL_ACTIVE : FILTER_PILL_INACTIVE}
            onClick={() => setSelectedType(type.id as any)}
          >
            <span>{type.icon}</span>
            <span>{type.label}</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredClients.length === 0 ? (
          <div className={EMPTY_STATE}>
            <p className={EMPTY_TITLE}>{t('noClientsFound')}</p>
          </div>
        ) : (
          filteredClients.map((client) => (
            <div key={client.id} className={`${CARD} ${CARD_PADDING}`}>
              <div className="flex items-start gap-4">
                <div className={AVATAR_LG}>
                  {client.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-slate-900">{client.name}</h3>
                  {client.specialization && (
                    <p className="text-sm text-slate-500">{client.specialization}</p>
                  )}
                </div>
              </div>
              <div className="mt-3 space-y-2 text-sm text-slate-600">
                <div className="flex items-center gap-2">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 5C3 3.89543 3.89543 3 5 3H8.27924C8.70967 3 9.11181 3.21447 9.3509 3.57594L10.7192 5.42594C10.9583 5.78741 11.3604 6.00188 11.7909 6.00188H19C20.1046 6.00188 21 6.89631 21 8.00188V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M3 10H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span>{client.type.charAt(0).toUpperCase() + client.type.slice(1)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 5C3 3.89543 3.89543 3 5 3H8.27924C8.70967 3 9.11181 3.21447 9.3509 3.57594L10.7192 5.42594C10.9583 5.78741 11.3604 6.00188 11.7909 6.00188H19C20.1046 6.00188 21 6.89631 21 8.00188V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M8 10H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span>{client.mobile}</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M21 10C21 17 12 23 12 23C12 23 3 17 3 10C3 7.61305 3.94821 5.32387 5.63604 3.63604C7.32387 1.94821 9.61305 1 12 1C14.3869 1 16.6761 1.94821 18.364 3.63604C20.0518 5.32387 21 7.61305 21 10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 13C13.6569 13 15 11.6569 15 10C15 8.34315 13.6569 7 12 7C10.3431 7 9 8.34315 9 10C9 11.6569 10.3431 13 12 13Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span>{client.address}</span>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-100">
                <button
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700 transition-colors"
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
    </div>
  )
}

export default Clients
