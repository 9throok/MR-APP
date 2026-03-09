import { useState, useRef, useEffect } from 'react'
import Header from './Header'
import Sidebar from './Sidebar'
import { useLanguage } from '../contexts/LanguageContext'
import './EnterRcpa.css'

interface RowData {
  key: string
  groupId: string
  zenappBrand?: string
  zenappValue?: number
  competitorBrand: string
  competitorValue: number
}

interface RcpaHistoryItem {
  id: string
  pharmacy: string
  zenappInfo: Record<string, { zenappBrand: string; zenappValue: number }>
  competitors: RowData[]
  date: string
}

interface EnterRcpaProps {
  onLogout: () => void
  onBack: () => void
  userName?: string
  onNavigate?: (page: string) => void
}

const zenappBrands = ['Derise', 'Rilast', 'Bevaas']

const pharmacies = [
  'CVS Pharmacy',
  'Walgreens',
  'Rite Aid',
  'Walmart Pharmacy',
  'Costco Pharmacy',
  'Kroger Pharmacy',
  'Target Pharmacy',
  'Albertsons Pharmacy',
  'Publix Pharmacy',
  'Safeway Pharmacy',
]

function EnterRcpa({ onLogout, onBack, userName, onNavigate }: EnterRcpaProps) {
  const { t } = useLanguage()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [data, setData] = useState<RowData[]>([])
  const [selectedPharmacy, setSelectedPharmacy] = useState<string>('')
  const [zenappInfo, setZenappInfo] = useState<Record<string, { zenappBrand: string; zenappValue: number }>>({})
  const [pharmacySearch, setPharmacySearch] = useState('')
  const [showPharmacyDropdown, setShowPharmacyDropdown] = useState(false)
  const [rcpaHistory, setRcpaHistory] = useState<RcpaHistoryItem[]>([])
  
  const pharmacyDropdownRef = useRef<HTMLDivElement>(null)
  let groupCounter = useRef(0)

  // Get client data from sessionStorage
  useEffect(() => {
    const stored = sessionStorage.getItem('doctor360Client')
    if (stored) {
      // Could use this for pre-filling data
    }
    
    // Load history from localStorage
    try {
      const savedHistory = localStorage.getItem('rcpaHistory')
      if (savedHistory) {
        setRcpaHistory(JSON.parse(savedHistory))
      }
    } catch (error) {
      console.error('Error loading RCPA history:', error)
    }
  }, [])

  // Handle click outside pharmacy dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pharmacyDropdownRef.current && !pharmacyDropdownRef.current.contains(event.target as Node)) {
        setShowPharmacyDropdown(false)
      }
    }

    if (showPharmacyDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showPharmacyDropdown])

  const handleMenuClick = () => {
    setSidebarOpen(true)
  }

  const handleSidebarClose = () => {
    setSidebarOpen(false)
  }

  const handleAddGroup = () => {
    groupCounter.current += 1
    const groupId = `group-${groupCounter.current}`
    const key = `row-${Date.now()}-${Math.random()}`
    
    const newRow: RowData = {
      key,
      groupId,
      competitorBrand: '',
      competitorValue: 0,
    }
    
    setData(prev => [...prev, newRow])
    setZenappInfo(prev => ({
      ...prev,
      [groupId]: { zenappBrand: '', zenappValue: 0 }
    }))
  }

  const handleAddCompetitor = (groupId: string) => {
    const key = `row-${Date.now()}-${Math.random()}`
    const newRow: RowData = {
      key,
      groupId,
      competitorBrand: '',
      competitorValue: 0,
    }
    
    setData(prev => [...prev, newRow])
  }

  const handleChange = (key: string, field: keyof RowData, value: any) => {
    setData(prev =>
      prev.map(row => (row.key === key ? { ...row, [field]: value } : row))
    )
  }

  const handleZenappChange = (groupId: string, field: 'zenappBrand' | 'zenappValue', value: any) => {
    setZenappInfo(prev => ({
      ...prev,
      [groupId]: {
        ...(prev[groupId] || { zenappBrand: '', zenappValue: 0 }),
        [field]: value
      }
    }))
  }

  const handleDelete = (key: string, groupId: string) => {
    const groupRows = data.filter(row => row.groupId === groupId)
    
    if (groupRows.length === 1) {
      // Delete entire group
      setData(prev => prev.filter(row => row.key !== key))
      setZenappInfo(prev => {
        const newInfo = { ...prev }
        delete newInfo[groupId]
        return newInfo
      })
    } else {
      // Delete only the row
      setData(prev => prev.filter(row => row.key !== key))
    }
  }

  const handlePharmacyChange = (pharmacy: string) => {
    setSelectedPharmacy(pharmacy)
    setPharmacySearch(pharmacy)
    setShowPharmacyDropdown(false)
  }

  const filteredPharmacies = pharmacies.filter(pharmacy =>
    pharmacy.toLowerCase().includes(pharmacySearch.toLowerCase())
  )

  const handleSave = () => {
    const rcpaData: RcpaHistoryItem = {
      id: `rcpa-${Date.now()}`,
      pharmacy: selectedPharmacy,
      zenappInfo,
      competitors: data,
      date: new Date().toISOString(),
    }
    
    console.log('RCPA Data:', rcpaData)
    
    // Add to history
    const newHistory = [rcpaData, ...rcpaHistory]
    setRcpaHistory(newHistory)
    
    // Save to localStorage
    try {
      localStorage.setItem('rcpaHistory', JSON.stringify(newHistory))
    } catch (error) {
      console.error('Error saving RCPA history:', error)
    }
    
    // Clear form
    setData([])
    setZenappInfo({})
    setSelectedPharmacy('')
    setPharmacySearch('')
    groupCounter.current = 0
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  // Group data by groupId for rendering
  const groupedData = data.reduce((acc, row) => {
    if (!acc[row.groupId]) {
      acc[row.groupId] = []
    }
    acc[row.groupId].push(row)
    return acc
  }, {} as Record<string, RowData[]>)

  return (
    <div className="enter-rcpa-container">
      <Header onLogout={onLogout} onMenuClick={handleMenuClick} onNavigateHome={() => onNavigate?.('home')} onNavigateOfflineRequests={() => onNavigate?.('offline-requests')} />
      <Sidebar isOpen={sidebarOpen} onClose={handleSidebarClose} userName={userName} onNavigate={onNavigate} onLogout={onLogout} />
      <main className="enter-rcpa-content">
        <div className="enter-rcpa-header">
          <button className="back-button" onClick={() => {
            try {
              const previousPage = sessionStorage.getItem('previousPage')
              if (previousPage && onNavigate) {
                sessionStorage.removeItem('previousPage')
                onNavigate(previousPage)
              } else {
                onBack()
              }
            } catch (error) {
              console.error('Error getting previous page:', error)
              onBack()
            }
          }} aria-label="Go back">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <h1 className="enter-rcpa-title">{t('enterRCPA') || 'Enter RCPA'}</h1>
        </div>

        <div className="enter-rcpa-form">
          {/* Pharmacy Selector */}
          <div className="form-section">
            <label className="form-label">{t('selectPharmacy') || 'Select Pharmacy'}</label>
            <div className="pharmacy-selector-wrapper" ref={pharmacyDropdownRef}>
              <input
                type="text"
                className="pharmacy-input"
                value={pharmacySearch}
                onChange={(e) => {
                  setPharmacySearch(e.target.value)
                  setShowPharmacyDropdown(true)
                }}
                onFocus={() => setShowPharmacyDropdown(true)}
                placeholder={t('selectPharmacy') || 'Select a Pharmacy'}
              />
              {showPharmacyDropdown && (
                <div className="pharmacy-dropdown">
                  {filteredPharmacies.length > 0 ? (
                    filteredPharmacies.map((pharmacy) => (
                      <div
                        key={pharmacy}
                        className="pharmacy-option"
                        onClick={() => handlePharmacyChange(pharmacy)}
                      >
                        {pharmacy}
                      </div>
                    ))
                  ) : (
                    <div className="pharmacy-option no-results">No pharmacies found</div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Add Brand Button */}
          <div className="form-section">
            <button
              type="button"
              className="add-group-btn"
              onClick={handleAddGroup}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>Add Brand</span>
            </button>
          </div>

          {/* Data Table */}
          {data.length > 0 && (
            <div className="form-section">
              <div className="rcpa-table-wrapper">
                <table className="rcpa-table">
                  <thead>
                    <tr>
                      <th>Brand</th>
                      <th>Value</th>
                      <th>Competitor Brand</th>
                      <th>Competitor Value</th>
                      <th>{t('actions') || 'Actions'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(groupedData).map(([groupId, rows]) => (
                      rows.map((row, index) => (
                        <tr key={row.key}>
                          {index === 0 && (
                            <>
                              <td rowSpan={rows.length} className="brand-cell">
                                <select
                                  className="brand-select"
                                  value={zenappInfo[groupId]?.zenappBrand || ''}
                                  onChange={(e) => handleZenappChange(groupId, 'zenappBrand', e.target.value)}
                                >
                                  <option value="">{t('selectBrand') || 'Select Brand'}</option>
                                  {zenappBrands.map((brand) => (
                                    <option key={brand} value={brand}>{brand}</option>
                                  ))}
                                </select>
                              </td>
                              <td rowSpan={rows.length} className="brand-cell">
                                <input
                                  type="number"
                                  className="value-input"
                                  min="0"
                                  step="0.01"
                                  value={zenappInfo[groupId]?.zenappValue || ''}
                                  onChange={(e) => handleZenappChange(groupId, 'zenappValue', parseFloat(e.target.value) || 0)}
                                  placeholder="0.00"
                                />
                              </td>
                            </>
                          )}
                          <td>
                            <input
                              type="text"
                              className="competitor-input"
                              value={row.competitorBrand}
                              onChange={(e) => handleChange(row.key, 'competitorBrand', e.target.value)}
                              placeholder={t('competitorBrand') || 'Competitor Brand'}
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              className="value-input"
                              min="0"
                              step="0.01"
                              value={row.competitorValue || ''}
                              onChange={(e) => handleChange(row.key, 'competitorValue', parseFloat(e.target.value) || 0)}
                              placeholder="0.00"
                            />
                          </td>
                          <td>
                            <div className="action-buttons">
                              {index === rows.length - 1 && (
                                <button
                                  type="button"
                                  className="add-competitor-btn"
                                  onClick={() => handleAddCompetitor(groupId)}
                                  title={t('addCompetitor') || 'Add Competitor'}
                                >
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                  </svg>
                                </button>
                              )}
                              <button
                                type="button"
                                className="delete-btn"
                                onClick={() => handleDelete(row.key, groupId)}
                                title={t('delete') || 'Delete'}
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M3 6H5H21M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Save Button */}
          <div className="form-actions">
            <button
              type="button"
              className="save-rcpa-btn"
              onClick={handleSave}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H16L21 8V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M17 21V13H7V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M7 3V8H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>{t('saveRCPA') || 'Save RCPA'}</span>
            </button>
          </div>
        </div>

        {/* RCPA History Section */}
        {rcpaHistory.length > 0 && (
          <div className="rcpa-history-section">
            <h2 className="section-title">RCPA History</h2>
            <div className="rcpa-history-list">
              {rcpaHistory.map((item) => {
                const groupedCompetitors = item.competitors.reduce((acc, row) => {
                  if (!acc[row.groupId]) {
                    acc[row.groupId] = []
                  }
                  acc[row.groupId].push(row)
                  return acc
                }, {} as Record<string, RowData[]>)

                return (
                  <div key={item.id} className="rcpa-history-item">
                    <div className="rcpa-history-header">
                      <div>
                        <h3 className="rcpa-history-pharmacy">{item.pharmacy}</h3>
                        <p className="rcpa-history-date">{formatDate(item.date)}</p>
                      </div>
                    </div>
                    <div className="rcpa-history-table-wrapper">
                      <table className="rcpa-history-table">
                        <thead>
                          <tr>
                            <th>Brand</th>
                            <th>Value</th>
                            <th>Competitor Brand</th>
                            <th>Competitor Value</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries(groupedCompetitors).map(([groupId, rows]) => (
                            rows.map((row, index) => (
                              <tr key={row.key || `${groupId}-${index}`}>
                                {index === 0 && (
                                  <>
                                    <td rowSpan={rows.length} className="brand-cell">
                                      {item.zenappInfo[groupId]?.zenappBrand || 'N/A'}
                                    </td>
                                    <td rowSpan={rows.length} className="brand-cell">
                                      {item.zenappInfo[groupId]?.zenappValue?.toFixed(2) || '0.00'}
                                    </td>
                                  </>
                                )}
                                <td>{row.competitorBrand || 'N/A'}</td>
                                <td>{row.competitorValue?.toFixed(2) || '0.00'}</td>
                              </tr>
                            ))
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default EnterRcpa
