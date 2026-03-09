import { useState, useRef, useEffect } from 'react'
import { useLanguage } from '../contexts/LanguageContext'
import {
  PAGE_CONTENT,
  PAGE_TITLE,
  BACK_BUTTON,
  CARD,
  CARD_PADDING,
  LABEL,
  INPUT,
  SELECT,
  BTN_PRIMARY,
  BTN_SECONDARY,
  BTN_GHOST,
  BTN_ICON,
  TABLE_WRAPPER,
  TABLE,
  TABLE_HEAD,
  TABLE_TH,
  TABLE_TD,
  TABLE_ROW,
  SECTION_TITLE,
} from '../styles/designSystem'

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

function EnterRcpa({ onLogout: _onLogout, onBack, userName: _userName, onNavigate }: EnterRcpaProps) {
  const { t } = useLanguage()
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
    <div>
      <main className={PAGE_CONTENT}>
        <div className="flex items-center gap-3 mb-6">
          <button className={BACK_BUTTON} onClick={() => {
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
          <h1 className={PAGE_TITLE}>{t('enterRCPA') || 'Enter RCPA'}</h1>
        </div>

        <div className={`${CARD} ${CARD_PADDING} mb-6`}>
          {/* Pharmacy Selector */}
          <div className="space-y-4">
            <label className={LABEL}>{t('selectPharmacy') || 'Select Pharmacy'}</label>
            <div className="relative" ref={pharmacyDropdownRef}>
              <input
                type="text"
                className={INPUT}
                value={pharmacySearch}
                onChange={(e) => {
                  setPharmacySearch(e.target.value)
                  setShowPharmacyDropdown(true)
                }}
                onFocus={() => setShowPharmacyDropdown(true)}
                placeholder={t('selectPharmacy') || 'Select a Pharmacy'}
              />
              {showPharmacyDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {filteredPharmacies.length > 0 ? (
                    filteredPharmacies.map((pharmacy) => (
                      <div
                        key={pharmacy}
                        className="w-full px-4 py-2.5 text-sm text-slate-700 text-left hover:bg-slate-50 cursor-pointer bg-transparent border-none"
                        onClick={() => handlePharmacyChange(pharmacy)}
                      >
                        {pharmacy}
                      </div>
                    ))
                  ) : (
                    <div className="w-full px-4 py-2.5 text-sm text-slate-700 text-left bg-transparent border-none">No pharmacies found</div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Add Brand Button */}
          <div className="space-y-4 mt-4">
            <button
              type="button"
              className={BTN_SECONDARY}
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
            <div className="space-y-4 mt-4">
              <div className={`${CARD} overflow-hidden`}>
                <div className={TABLE_WRAPPER}>
                  <table className={TABLE}>
                    <thead className={TABLE_HEAD}>
                      <tr>
                        <th className={TABLE_TH}>Brand</th>
                        <th className={TABLE_TH}>Value</th>
                        <th className={TABLE_TH}>Competitor Brand</th>
                        <th className={TABLE_TH}>Competitor Value</th>
                        <th className={TABLE_TH}>{t('actions') || 'Actions'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(groupedData).map(([groupId, rows]) => (
                        rows.map((row, index) => (
                          <tr key={row.key} className={TABLE_ROW}>
                            {index === 0 && (
                              <>
                                <td rowSpan={rows.length} className={`${TABLE_TD} align-top`}>
                                  <select
                                    className={`${SELECT} text-xs px-2 py-1.5`}
                                    value={zenappInfo[groupId]?.zenappBrand || ''}
                                    onChange={(e) => handleZenappChange(groupId, 'zenappBrand', e.target.value)}
                                  >
                                    <option value="">{t('selectBrand') || 'Select Brand'}</option>
                                    {zenappBrands.map((brand) => (
                                      <option key={brand} value={brand}>{brand}</option>
                                    ))}
                                  </select>
                                </td>
                                <td rowSpan={rows.length} className={`${TABLE_TD} align-top`}>
                                  <input
                                    type="number"
                                    className={`${INPUT} text-xs px-2 py-1.5`}
                                    min="0"
                                    step="0.01"
                                    value={zenappInfo[groupId]?.zenappValue || ''}
                                    onChange={(e) => handleZenappChange(groupId, 'zenappValue', parseFloat(e.target.value) || 0)}
                                    placeholder="0.00"
                                  />
                                </td>
                              </>
                            )}
                            <td className={TABLE_TD}>
                              <input
                                type="text"
                                className={`${INPUT} text-xs px-2 py-1.5`}
                                value={row.competitorBrand}
                                onChange={(e) => handleChange(row.key, 'competitorBrand', e.target.value)}
                                placeholder={t('competitorBrand') || 'Competitor Brand'}
                              />
                            </td>
                            <td className={TABLE_TD}>
                              <input
                                type="number"
                                className={`${INPUT} text-xs px-2 py-1.5`}
                                min="0"
                                step="0.01"
                                value={row.competitorValue || ''}
                                onChange={(e) => handleChange(row.key, 'competitorValue', parseFloat(e.target.value) || 0)}
                                placeholder="0.00"
                              />
                            </td>
                            <td className={TABLE_TD}>
                              <div className="flex items-center gap-1">
                                {index === rows.length - 1 && (
                                  <button
                                    type="button"
                                    className={`${BTN_GHOST} text-xs px-2 py-1`}
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
                                  className={`${BTN_ICON} text-red-400 hover:text-red-600`}
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
            </div>
          )}

          {/* Save Button */}
          <div className="flex justify-end mt-4">
            <button
              type="button"
              className={BTN_PRIMARY}
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
          <div className="mt-8">
            <h2 className={SECTION_TITLE}>RCPA History</h2>
            <div className="space-y-4">
              {rcpaHistory.map((item) => {
                const groupedCompetitors = item.competitors.reduce((acc, row) => {
                  if (!acc[row.groupId]) {
                    acc[row.groupId] = []
                  }
                  acc[row.groupId].push(row)
                  return acc
                }, {} as Record<string, RowData[]>)

                return (
                  <div key={item.id} className={`${CARD} ${CARD_PADDING}`}>
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="text-base font-semibold text-slate-900">{item.pharmacy}</h3>
                        <p className="text-xs text-slate-400">{formatDate(item.date)}</p>
                      </div>
                    </div>
                    <div className={TABLE_WRAPPER}>
                      <table className={TABLE}>
                        <thead className={TABLE_HEAD}>
                          <tr>
                            <th className={TABLE_TH}>Brand</th>
                            <th className={TABLE_TH}>Value</th>
                            <th className={TABLE_TH}>Competitor Brand</th>
                            <th className={TABLE_TH}>Competitor Value</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries(groupedCompetitors).map(([groupId, rows]) => (
                            rows.map((row, index) => (
                              <tr key={row.key || `${groupId}-${index}`} className={TABLE_ROW}>
                                {index === 0 && (
                                  <>
                                    <td rowSpan={rows.length} className={`${TABLE_TD} align-top`}>
                                      {item.zenappInfo[groupId]?.zenappBrand || 'N/A'}
                                    </td>
                                    <td rowSpan={rows.length} className={`${TABLE_TD} align-top`}>
                                      {item.zenappInfo[groupId]?.zenappValue?.toFixed(2) || '0.00'}
                                    </td>
                                  </>
                                )}
                                <td className={TABLE_TD}>{row.competitorBrand || 'N/A'}</td>
                                <td className={TABLE_TD}>{row.competitorValue?.toFixed(2) || '0.00'}</td>
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
