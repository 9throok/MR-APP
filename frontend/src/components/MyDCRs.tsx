import { useState, useEffect } from 'react'
import { apiGet } from '../services/apiService'
import {
  PAGE_CONTENT,
  PAGE_TITLE,
  PAGE_SUBTITLE,
  BACK_BUTTON,
  SEARCH_INPUT,
  CARD,
  AVATAR_MD,
  BADGE_PRIMARY,
  BADGE_INFO,
  EMPTY_STATE,
  EMPTY_TITLE,
} from '../styles/designSystem'

interface MyDCRsProps {
  onLogout: () => void
  onBack: () => void
  userName?: string
  onNavigate?: (page: string) => void
}

interface DCRSample {
  id: number
  name: string
  quantity: number
}

interface DCREntry {
  id: number
  name: string
  date: string
  product: string
  samples: DCRSample[]
  call_summary: string
  rating: number
  user_id: string
  created_at: string
}

function MyDCRs({ onLogout: _onLogout, onBack, userName: _userName, onNavigate: _onNavigate }: MyDCRsProps) {
  const [dcrs, setDcrs] = useState<DCREntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    const fetchDCRs = async () => {
      setLoading(true)
      setError(null)
      try {
        const userId = (() => {
          try { return localStorage.getItem('userId') || localStorage.getItem('user_id') || 'mr_rahul_001' } catch { return 'mr_rahul_001' }
        })()
        const json = await apiGet(`/dcr?user_id=${encodeURIComponent(userId)}`)
        if (json.success) {
          setDcrs(json.data)
        } else {
          throw new Error('Failed to fetch DCRs')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong')
      } finally {
        setLoading(false)
      }
    }
    fetchDCRs()
  }, [])

  const filteredDcrs = dcrs.filter(dcr =>
    dcr.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    dcr.product.toLowerCase().includes(searchQuery.toLowerCase()) ||
    dcr.date.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const renderStars = (rating: number) => (
    <div className="text-amber-400 flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(s => (
        <svg key={s} width="16" height="16" viewBox="0 0 24 24" fill={s <= rating ? '#f59e0b' : 'none'} xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
            fill={s <= rating ? '#f59e0b' : 'none'} stroke={s <= rating ? '#f59e0b' : '#cbd5e1'} strokeWidth="1.5"
            strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ))}
    </div>
  )

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    } catch { return iso }
  }

  return (
    <div className="flex-1 bg-slate-50 min-h-screen">
      <main className={PAGE_CONTENT}>
        {/* Header */}
        <div className="flex items-center gap-3 mb-1">
          <button className={BACK_BUTTON} onClick={onBack} aria-label="Go back">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <h1 className={PAGE_TITLE}>My DCRs</h1>
        </div>
        <p className={`${PAGE_SUBTITLE} mb-6`}>{loading ? 'Loading...' : `${filteredDcrs.length} report${filteredDcrs.length !== 1 ? 's' : ''} found`}</p>

        {/* Search */}
        <div className="relative mb-4">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" width="18" height="18" viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
            <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <input
            className={SEARCH_INPUT}
            type="text"
            placeholder="Search by name, product or date..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors bg-transparent border-none cursor-pointer text-sm"
              onClick={() => setSearchQuery('')}
            >
              ✕
            </button>
          )}
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <svg width="44" height="44" viewBox="0 0 48 48" fill="none">
              <circle cx="24" cy="24" r="20" stroke="#e2e8f0" strokeWidth="4"/>
              <circle cx="24" cy="24" r="20" stroke="#4F46E5" strokeWidth="4" strokeLinecap="round" strokeDasharray="31.4 94.2">
                <animateTransform attributeName="transform" type="rotate" from="0 24 24" to="360 24 24" dur="0.8s" repeatCount="indefinite"/>
              </circle>
            </svg>
            <p className="mt-3 text-sm">Fetching DCRs...</p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="text-red-600 bg-red-50 rounded-lg px-4 py-3 flex items-center gap-2">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
              <path d="M12 8V12M12 16H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && filteredDcrs.length === 0 && (
          <div className={EMPTY_STATE}>
            <svg className="w-16 h-16 text-slate-300 mb-4" width="56" height="56" viewBox="0 0 24 24" fill="none">
              <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M14 2V8H20M16 13H8M16 17H8M10 9H9H8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <p className={EMPTY_TITLE}>{searchQuery ? 'No DCRs match your search.' : 'No DCRs submitted yet.'}</p>
          </div>
        )}

        {/* DCR Cards */}
        {!loading && !error && filteredDcrs.length > 0 && (
          <div className="space-y-3">
            {filteredDcrs.map(dcr => {
              const isExpanded = expandedId === dcr.id
              return (
                <div key={dcr.id} className={`${CARD} overflow-hidden cursor-pointer hover:shadow-md transition-shadow`}>
                  {/* Card Header */}
                  <button
                    className="flex items-center gap-3 px-5 py-4 w-full text-left bg-transparent border-none cursor-pointer"
                    onClick={() => setExpandedId(isExpanded ? null : dcr.id)}
                    aria-expanded={isExpanded}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={AVATAR_MD}>
                        {dcr.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <span className="text-sm font-semibold text-slate-900 block truncate">{dcr.name}</span>
                        <span className="text-xs text-slate-400 block">{dcr.date}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className={BADGE_PRIMARY}>{dcr.product}</span>
                      <svg
                        className={`text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                        width="18" height="18" viewBox="0 0 24 24" fill="none"
                      >
                        <path d="M19 9L12 15L5 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  </button>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="px-5 pb-4 border-t border-slate-100 pt-4">
                      <div className="grid grid-cols-2 gap-3">
                        {/* Rating */}
                        <div>
                          <span className="text-xs text-slate-400 block mb-1">Rating</span>
                          {renderStars(dcr.rating)}
                        </div>

                        {/* Submitted */}
                        <div>
                          <span className="text-xs text-slate-400 block mb-1">Submitted At</span>
                          <span className="text-sm text-slate-700">{formatDate(dcr.created_at)}</span>
                        </div>

                        {/* Call Summary */}
                        <div className="col-span-2">
                          <span className="text-xs text-slate-400 block mb-1">Call Summary</span>
                          <p className="text-sm text-slate-700 leading-relaxed">{dcr.call_summary}</p>
                        </div>

                        {/* Samples */}
                        {dcr.samples && dcr.samples.length > 0 && (
                          <div className="col-span-2">
                            <span className="text-xs text-slate-400 block mb-1">Samples Distributed</span>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {dcr.samples.map((sample, idx) => (
                                <div key={idx} className={`${BADGE_INFO} gap-1.5`}>
                                  <span className="font-medium">{sample.name}</span>
                                  <span className="opacity-70">Qty: {sample.quantity}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}

export default MyDCRs
