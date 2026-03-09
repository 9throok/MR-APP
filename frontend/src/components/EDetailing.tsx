import { useState, useEffect } from 'react'
import {
  PAGE_CONTENT,
  PAGE_TITLE,
  BACK_BUTTON,
  SEARCH_INPUT,
  FILTER_PILL_ACTIVE,
  FILTER_PILL_INACTIVE,
  CARD,
  EMPTY_STATE,
  EMPTY_TITLE,
  MODAL_OVERLAY,
  BTN_PRIMARY,
  BTN_SECONDARY,
  BTN_ICON,
} from '../styles/designSystem'

interface ContentItem {
  id: number
  title: string
  type: 'video' | 'pdf'
  thumbnail: string
  duration?: string
  size?: string
  category: string
  description: string
  url: string
  videoId?: string // For YouTube videos
}

const dummyContent: ContentItem[] = [
  {
    id: 1,
    title: 'Atorvastatin - Mechanism of Action and Benefits',
    type: 'video',
    duration: '12:30',
    category: 'Cardiology',
    description: 'Learn about Atorvastatin, its mechanism of action, benefits, and clinical usage in managing cholesterol levels.',
    thumbnail: 'https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=400&h=250&fit=crop',
    url: 'https://www.youtube.com/embed/v7Q9BrNfIpQ',
    videoId: 'v7Q9BrNfIpQ',
  },
  {
    id: 2,
    title: 'Metoprolol - Beta Blocker Overview',
    type: 'video',
    duration: '15:45',
    category: 'Cardiology',
    description: 'Comprehensive overview of Metoprolol, a beta-blocker used for hypertension and heart conditions.',
    thumbnail: 'https://images.unsplash.com/photo-1582719471384-894fbb16e074?w=400&h=250&fit=crop',
    url: 'https://www.youtube.com/embed/7uD7CV2DFfs',
    videoId: '7uD7CV2DFfs',
  },
  {
    id: 3,
    title: 'Aspirin - Antiplatelet Therapy Guide',
    type: 'video',
    duration: '10:20',
    category: 'Cardiology',
    description: 'Understanding Aspirin as an antiplatelet agent and its role in cardiovascular prevention.',
    thumbnail: 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=400&h=250&fit=crop',
    url: 'https://www.youtube.com/embed/oadQ_mzlsXA',
    videoId: 'oadQ_mzlsXA',
  },
  {
    id: 4,
    title: 'Enalapril - ACE Inhibitor Benefits',
    type: 'video',
    duration: '14:15',
    category: 'Cardiology',
    description: 'Detailed explanation of Enalapril, an ACE inhibitor used in hypertension and heart failure management.',
    thumbnail: 'https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=400&h=250&fit=crop',
    url: 'https://www.youtube.com/embed/oadQ_mzlsXA',
    videoId: 'oadQ_mzlsXA',
  },
  {
    id: 5,
    title: 'Antibiotic Resistance Report',
    type: 'pdf',
    size: '1.8 MB',
    category: 'Infectious Diseases',
    description: 'Comprehensive report on antibiotic resistance patterns and recommendations.',
    thumbnail: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400&h=250&fit=crop',
    url: 'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf',
  },
  {
    id: 6,
    title: 'Insulin Therapy - Modern Approaches',
    type: 'video',
    duration: '18:30',
    category: 'Endocrinology',
    description: 'Modern approaches to insulin therapy for diabetes management and patient care.',
    thumbnail: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400&h=250&fit=crop',
    url: 'https://www.youtube.com/embed/oadQ_mzlsXA',
    videoId: 'oadQ_mzlsXA',
  },
  {
    id: 7,
    title: 'Respiratory Medications Overview',
    type: 'video',
    duration: '16:30',
    category: 'Pulmonology',
    description: 'Comprehensive guide to respiratory medications and their clinical applications.',
    thumbnail: 'https://images.unsplash.com/photo-1551601651-2a8555f1a136?w=400&h=250&fit=crop',
    url: 'https://www.youtube.com/embed/oadQ_mzlsXA',
    videoId: 'oadQ_mzlsXA',
  },
  {
    id: 8,
    title: 'Drug Interaction Guide',
    type: 'pdf',
    size: '1.5 MB',
    category: 'Pharmacology',
    description: 'Complete guide to drug interactions and safety protocols.',
    thumbnail: 'https://images.unsplash.com/photo-1582719471384-894fbb16e074?w=400&h=250&fit=crop',
    url: 'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf',
  },
  {
    id: 9,
    title: 'Oncology Treatment Protocols',
    type: 'pdf',
    size: '3.2 MB',
    category: 'Oncology',
    description: 'Detailed treatment protocols for various oncology conditions.',
    thumbnail: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400&h=250&fit=crop',
    url: 'https://www.africau.edu/images/default/sample.pdf',
  },
  {
    id: 10,
    title: 'Antihypertensive Medications - Clinical Use',
    type: 'video',
    duration: '20:10',
    category: 'Cardiology',
    description: 'Understanding various antihypertensive medications and their clinical applications.',
    thumbnail: 'https://images.unsplash.com/photo-1559757148-5c3505193b38?w=400&h=250&fit=crop',
    url: 'https://www.youtube.com/embed/oadQ_mzlsXA',
    videoId: 'oadQ_mzlsXA',
  },
  {
    id: 11,
    title: 'Statins - Cholesterol Management',
    type: 'video',
    duration: '15:30',
    category: 'Cardiology',
    description: 'Comprehensive guide to statin medications for cholesterol management and cardiovascular health.',
    thumbnail: 'https://images.unsplash.com/photo-1559757148-5c3505193b38?w=800&h=500&fit=crop&q=80',
    url: 'https://www.youtube.com/embed/oadQ_mzlsXA',
    videoId: 'oadQ_mzlsXA',
  },
  {
    id: 12,
    title: 'Diabetes Treatment Guidelines 2024',
    type: 'pdf',
    size: '2.5 MB',
    category: 'Endocrinology',
    description: 'Latest treatment guidelines and protocols for diabetes management.',
    thumbnail: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=800&h=500&fit=crop&q=80',
    url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
  },
]

interface EDetailingProps {
  onLogout: () => void
  onBack: () => void
  userName?: string
  onNavigate?: (page: string) => void
}

function EDetailing({ onLogout: _onLogout, onBack, userName: _userName, onNavigate }: EDetailingProps) {
  const [filter, setFilter] = useState<'all' | 'video' | 'pdf'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedVideo, setSelectedVideo] = useState<ContentItem | null>(null)

  const handleBackClick = () => {
    // Get previous page from sessionStorage, default to home if not found
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
  }

  const filteredContent = dummyContent.filter(item => {
    const matchesFilter = filter === 'all' || item.type === filter
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const handleContentClick = (item: ContentItem) => {
    if (item.type === 'video') {
      setSelectedVideo(item)
    } else {
      // Open PDF in new tab
      window.open(item.url, '_blank')
    }
  }

  const handleCloseVideo = () => {
    setSelectedVideo(null)
  }

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (selectedVideo) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [selectedVideo])

  return (
    <div>
      <main className={PAGE_CONTENT}>
        <div className="flex items-center gap-3 mb-6">
          <button className={BACK_BUTTON} onClick={handleBackClick} aria-label="Go back">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <h1 className={PAGE_TITLE}>eDetailing</h1>
        </div>

        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
                <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search videos and PDFs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={SEARCH_INPUT}
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              className={filter === 'all' ? FILTER_PILL_ACTIVE : FILTER_PILL_INACTIVE}
              onClick={() => setFilter('all')}
            >
              All
            </button>
            <button
              className={filter === 'video' ? FILTER_PILL_ACTIVE : FILTER_PILL_INACTIVE}
              onClick={() => setFilter('video')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M23 7L16 12L23 17V7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <rect x="1" y="5" width="15" height="14" rx="2" stroke="currentColor" strokeWidth="2"/>
              </svg>
              Videos
            </button>
            <button
              className={filter === 'pdf' ? FILTER_PILL_ACTIVE : FILTER_PILL_INACTIVE}
              onClick={() => setFilter('pdf')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M16 13H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M16 17H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M10 9H9H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              PDFs
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredContent.length === 0 ? (
            <div className={EMPTY_STATE}>
              <p className={EMPTY_TITLE}>No content found matching your search.</p>
            </div>
          ) : (
            filteredContent.map((item) => (
              <div
                key={item.id}
                className={`${CARD} overflow-hidden cursor-pointer hover:shadow-md transition-shadow`}
                onClick={() => handleContentClick(item)}
              >
                {item.type === 'video' ? (
                  <div className="relative h-48 bg-slate-100">
                    <img
                      src={item.thumbnail}
                      alt={item.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.style.display = 'none'
                      }}
                    />
                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                      <h4 className="text-xs font-medium text-white bg-slate-900/60 backdrop-blur-sm rounded-lg px-2 py-1">{item.title}</h4>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
                          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="12" cy="12" r="10" fill="rgba(0, 0, 0, 0.5)"/>
                            <path d="M10 8L16 12L10 16V8Z" fill="#ffffff"/>
                          </svg>
                        </div>
                      </div>
                      <span className="absolute bottom-3 right-3 text-xs font-medium text-white bg-slate-900/60 backdrop-blur-sm rounded-lg px-2 py-1">{item.duration}</span>
                    </div>
                  </div>
                ) : (
                  <div className="relative h-48 bg-slate-100">
                    <img
                      src={item.thumbnail}
                      alt={item.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.style.display = 'none'
                      }}
                    />
                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                      <h4 className="text-xs font-medium text-white bg-slate-900/60 backdrop-blur-sm rounded-lg px-2 py-1">{item.title}</h4>
                      <span className="absolute bottom-3 right-3 text-xs font-medium text-white bg-slate-900/60 backdrop-blur-sm rounded-lg px-2 py-1">{item.size}</span>
                    </div>
                  </div>
                )}
                <div className="p-4">
                  <div className="text-xs font-medium text-indigo-600 uppercase tracking-wider">{item.category}</div>
                  <h3 className="text-sm font-semibold text-slate-900 mt-1">{item.title}</h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{item.description}</p>
                  <button className={`mt-3 ${item.type === 'video' ? BTN_PRIMARY : BTN_SECONDARY} text-xs px-3 py-1.5`}>
                    {item.type === 'video' ? (
                      <>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M23 7L16 12L23 17V7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <rect x="1" y="5" width="15" height="14" rx="2" stroke="currentColor" strokeWidth="2"/>
                        </svg>
                        <span>Video</span>
                      </>
                    ) : (
                      <>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <span>PDF</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* Video Player Modal */}
      {selectedVideo && (
        <div className={MODAL_OVERLAY} onClick={handleCloseVideo}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl mx-4 overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <button className={`${BTN_ICON} absolute top-4 right-4 z-10`} onClick={handleCloseVideo} aria-label="Close video">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <div className="p-5 border-b border-slate-100">
              <h2 className="text-lg font-semibold text-slate-900">{selectedVideo.title}</h2>
              <p className="text-xs font-medium text-indigo-600 uppercase tracking-wider mt-1">{selectedVideo.category}</p>
            </div>
            <div className="relative bg-black aspect-video">
              <iframe
                src={`${selectedVideo.url}?autoplay=1`}
                title={selectedVideo.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              ></iframe>
            </div>
            <div className="p-5 text-sm text-slate-600">
              <p>{selectedVideo.description}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default EDetailing
