import { useState, useEffect, useRef, useCallback } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import Header from './Header'
import Sidebar from './Sidebar'
import { edetailingStore } from '../store/edetailingStore'
import { apiGet, apiPost } from '../services/apiService'
import './EDetailing.css'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'

// Configure PDF.js worker (use CDN for worker)
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

export type ContentType = 'video' | 'pdf' | 'html'

export interface ContentMetadata {
  page_number?: string
  description: string
  keywords: string[]
  from_timestamp?: string
  to_timestamp?: string
}

export interface ContentItem {
  id: number
  title: string
  type: ContentType
  thumbnail: string
  duration?: string
  size?: string
  category: string
  description: string
  url: string
  videoId?: string
  contentId?: number
  metadata?: ContentMetadata[]
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
    url: 'https://www.youtube.com/watch?v=v7Q9BrNfIpQ',
    videoId: 'v7Q9BrNfIpQ',
    contentId: 1,
    metadata: [
      { description: 'Product introduction', from_timestamp: '00:00:00', to_timestamp: '00:02:00', keywords: ['atorvastatin', 'intro'] },
      { description: 'Mechanism of action', from_timestamp: '00:02:00', to_timestamp: '00:06:00', keywords: ['mechanism', 'statin'] },
    ],
  },
  {
    id: 2,
    title: 'Metoprolol - Beta Blocker Overview',
    type: 'video',
    duration: '15:45',
    category: 'Cardiology',
    description: 'Comprehensive overview of Metoprolol, a beta-blocker used for hypertension and heart conditions.',
    thumbnail: 'https://images.unsplash.com/photo-1582719471384-894fbb16e074?w=400&h=250&fit=crop',
    url: 'https://www.youtube.com/watch?v=7uD7CV2DFfs',
    videoId: '7uD7CV2DFfs',
    contentId: 2,
  },
  {
    id: 3,
    title: 'Antibiotic Resistance Report',
    type: 'pdf',
    size: '1.8 MB',
    category: 'Infectious Diseases',
    description: 'Comprehensive report on antibiotic resistance patterns and recommendations.',
    thumbnail: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400&h=250&fit=crop',
    url: 'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf',
    contentId: 5,
    metadata: [
      { page_number: 'Page 1', description: 'Cover page', keywords: ['antibiotic', 'resistance'] },
      { page_number: 'Page 2', description: 'Executive summary', keywords: ['summary'] },
    ],
  },
  {
    id: 4,
    title: 'Drug Interaction Guide',
    type: 'pdf',
    size: '1.5 MB',
    category: 'Pharmacology',
    description: 'Complete guide to drug interactions and safety protocols.',
    thumbnail: 'https://images.unsplash.com/photo-1582719471384-894fbb16e074?w=400&h=250&fit=crop',
    url: 'https://www.africau.edu/images/default/sample.pdf',
    contentId: 8,
  },
  {
    id: 5,
    title: 'Product Overview - Brand X',
    type: 'html',
    category: 'General',
    description: 'Interactive product overview and key messaging.',
    thumbnail: 'https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=400&h=250&fit=crop',
    url: 'https://example.com/product-overview',
  },
  {
    id: 6,
    title: 'Insulin Therapy - Modern Approaches',
    type: 'video',
    duration: '18:30',
    category: 'Endocrinology',
    description: 'Modern approaches to insulin therapy for diabetes management.',
    thumbnail: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400&h=250&fit=crop',
    url: 'https://www.youtube.com/watch?v=oadQ_mzlsXA',
    videoId: 'oadQ_mzlsXA',
    contentId: 6,
  },
]

interface EDetailingProps {
  onLogout: () => void
  onBack: () => void
  userName?: string
  onNavigate?: (page: string) => void
}

function EDetailing({ onLogout, onBack, userName, onNavigate }: EDetailingProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [filter, setFilter] = useState<'all' | 'video' | 'pdf' | 'html'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [, setContentType] = useState<'doctor' | 'pharmacy' | 'key-account'>('doctor')
  const [showSendToDCR, setShowSendToDCR] = useState(false)

  // Backend-fetched published content (Phase B). Each row maps to a ContentItem
  // alongside the existing demo `dummyContent`. We keep the demo items because
  // they include rich page-level metadata that powers the existing viewer UX —
  // in production a fully migrated org would have its own published assets.
  const [backendContent, setBackendContent] = useState<ContentItem[]>([])

  // PDF viewer state
  const [selectedPdf, setSelectedPdf] = useState<ContentItem | null>(null)
  const [pdfNumPages, setPdfNumPages] = useState(0)
  const [pdfCurrentPage, setPdfCurrentPage] = useState(1)
  const [pdfPageStartTime, setPdfPageStartTime] = useState<number>(Date.now())
  const [pdfPagesTime, setPdfPagesTime] = useState<Record<number, number>>({})
  const pdfContainerRef = useRef<HTMLDivElement>(null)

  // Video viewer state (use iframe + total time tracking for YouTube compatibility)
  const [selectedVideo, setSelectedVideo] = useState<ContentItem | null>(null)
  const videoStartTimeRef = useRef<number>(0)

  // HTML viewer state
  const [selectedHtml, setSelectedHtml] = useState<ContentItem | null>(null)
  const [htmlStartTime, setHtmlStartTime] = useState<number>(0)
  const htmlIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const handleMenuClick = () => setSidebarOpen(true)
  const handleSidebarClose = () => setSidebarOpen(false)

  const handleBackClick = () => {
    try {
      const previousPage = sessionStorage.getItem('previousPage')
      if (previousPage && onNavigate) {
        sessionStorage.removeItem('previousPage')
        onNavigate(previousPage)
      } else {
        onBack()
      }
    } catch {
      onBack()
    }
  }

  // Read type from sessionStorage (set when navigating from Doctor360/DCR)
  useEffect(() => {
    try {
      const t = sessionStorage.getItem('edetailingType') as 'doctor' | 'pharmacy' | 'key-account' | null
      if (t && ['doctor', 'pharmacy', 'key-account'].includes(t)) setContentType(t)
    } catch {}
  }, [])

  // Fetch published content from the Phase B backend on mount. Errors are
  // swallowed so the demo content still renders if the API is unreachable.
  useEffect(() => {
    let cancelled = false
    apiGet('/content')
      .then(resp => {
        if (cancelled) return
        type ApiAsset = {
          id: number
          title: string
          asset_type: string
          description: string | null
          therapeutic_area: string | null
          current_version_id: number | null
          current_file_url: string | null
        }
        const items: ContentItem[] = (resp.data || [])
          .filter((a: ApiAsset) => a.current_version_id && a.current_file_url)
          .map((a: ApiAsset): ContentItem => {
            // Map asset_type → ContentType. slide_deck/pdf/brochure → 'pdf' since
            // the existing viewer renders PDFs; video → 'video'; everything else
            // → 'html' so the viewer at least opens it.
            const type: ContentType =
              a.asset_type === 'video' ? 'video' :
              a.asset_type === 'slide_deck' || a.asset_type === 'pdf' || a.asset_type === 'brochure' ? 'pdf' :
              'html'
            return {
              id: 10000 + a.id, // offset so IDs never collide with dummy content
              title: a.title,
              type,
              thumbnail: '',
              category: a.therapeutic_area || 'General',
              description: a.description || '',
              url: a.current_file_url || '',
              contentId: a.current_version_id || undefined,
              metadata: [],
            }
          })
        setBackendContent(items)
      })
      .catch(err => console.warn('[EDetailing] could not fetch /content:', err))
    return () => { cancelled = true }
  }, [])

  // Merge backend assets with the demo content. Backend items appear first so
  // newly-published material is most prominent.
  const allContent: ContentItem[] = [...backendContent, ...dummyContent]

  const filteredContent = allContent.filter((item) => {
    const matchesFilter = filter === 'all' || item.type === filter
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesFilter && matchesSearch
  })

  // Best-effort fire-and-forget view recorder. Skip when contentId isn't set
  // (demo items without a backing version) — the backend would 404 anyway.
  const recordViewToBackend = (versionId: number | undefined, durationSeconds: number, slideIndex?: number) => {
    if (!versionId || durationSeconds <= 0) return
    const dcrIdRaw = sessionStorage.getItem('currentDcrId')
    const doctorIdRaw = sessionStorage.getItem('currentDoctorId')
    const payload: {
      version_id: number
      duration_seconds: number
      slide_index?: number
      doctor_id?: number
      dcr_id?: number
    } = { version_id: versionId, duration_seconds: durationSeconds }
    if (slideIndex != null) payload.slide_index = slideIndex
    const doctorId = doctorIdRaw ? parseInt(doctorIdRaw, 10) : NaN
    if (Number.isFinite(doctorId)) payload.doctor_id = doctorId
    const dcrId = dcrIdRaw ? parseInt(dcrIdRaw, 10) : NaN
    if (Number.isFinite(dcrId)) payload.dcr_id = dcrId
    apiPost('/content-views', payload).catch(err =>
      console.warn('[EDetailing] view-tracking failed:', err)
    )
  }

  // ── PDF tracking ─────────────────────────────────────────────────────────
  const trackPdfPageTime = useCallback((pageNum: number) => {
    const now = Date.now()
    const elapsed = (now - pdfPageStartTime) / 1000
    if (elapsed > 0 && selectedPdf) {
      setPdfPagesTime((prev) => ({
        ...prev,
        [pageNum]: (prev[pageNum] || 0) + elapsed,
      }))
    }
    setPdfPageStartTime(now)
  }, [pdfPageStartTime, selectedPdf])

  const handlePdfLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setPdfNumPages(numPages)
  }, [])

  const handlePdfBack = useCallback(() => {
    if (selectedPdf) {
      trackPdfPageTime(pdfCurrentPage)
      const totalSeconds = Object.values(pdfPagesTime).reduce((a, b) => a + b, 0) + (Date.now() - pdfPageStartTime) / 1000
      const finalPagesTime = { ...pdfPagesTime, [pdfCurrentPage]: (pdfPagesTime[pdfCurrentPage] || 0) + (Date.now() - pdfPageStartTime) / 1000 }
      edetailingStore.addPdfLog({
        title: selectedPdf.title,
        type: 'PDF',
        watchedSeconds: Math.round(totalSeconds * 10) / 10,
        pages: finalPagesTime,
        contentId: selectedPdf.contentId,
        description: selectedPdf.description,
        metadata: selectedPdf.metadata?.map((m) => ({
          page_number: m.page_number ?? '',
          description: m.description,
          keywords: m.keywords ?? [],
        })),
        viewedAt: new Date().toISOString(),
      })
      // Persist per-page view events to backend (one row per page viewed) so
      // CLM analytics can roll up. Each page becomes a content_views row with
      // slide_index = pageNum and duration_seconds = time on that page.
      Object.entries(finalPagesTime).forEach(([pageStr, secs]) => {
        recordViewToBackend(selectedPdf.contentId, Math.round((secs as number) * 10) / 10, parseInt(pageStr, 10))
      })
    }
    setSelectedPdf(null)
    setPdfPagesTime({})
    setPdfCurrentPage(1)
  }, [selectedPdf, pdfCurrentPage, pdfPagesTime, pdfPageStartTime, trackPdfPageTime])

  useEffect(() => {
    if (!selectedPdf) return
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            const pageNum = Number((e.target as HTMLElement).dataset.page)
            if (pageNum && pageNum !== pdfCurrentPage) {
              trackPdfPageTime(pdfCurrentPage)
              setPdfCurrentPage(pageNum)
            }
            break
          }
        }
      },
      { threshold: 0.5 }
    )
    const pages = pdfContainerRef.current?.querySelectorAll('[data-page]')
    pages?.forEach((p) => observer.observe(p))
    return () => observer.disconnect()
  }, [selectedPdf, pdfCurrentPage, trackPdfPageTime])

  // ── Video tracking (total time while modal open; segment-level would need YouTube API) ──
  const handleVideoClose = useCallback(() => {
    if (selectedVideo && videoStartTimeRef.current > 0) {
      const watchedSeconds = Math.round((Date.now() - videoStartTimeRef.current) / 1000)
      if (watchedSeconds > 0) {
        const meta = selectedVideo.metadata?.[0]
        edetailingStore.addVideoLog({
          title: selectedVideo.title,
          type: 'Video',
          watchedSeconds,
          segments: [{
            start: 0,
            end: watchedSeconds,
            timestamp: Date.now(),
            metadata: meta ? {
              description: meta.description,
              from_timestamp: meta.from_timestamp ?? '00:00:00',
              to_timestamp: meta.to_timestamp ?? '00:00:00',
              keywords: meta.keywords ?? [],
            } : undefined,
          }],
          contentId: selectedVideo.contentId,
        })
        // Persist a single content_views row for the whole video session.
        recordViewToBackend(selectedVideo.contentId, watchedSeconds)
      }
    }
    setSelectedVideo(null)
  }, [selectedVideo])

  // ── HTML tracking ───────────────────────────────────────────────────────
  const trackHtmlTime = useCallback(() => {
    if (selectedHtml) {
      const elapsed = (Date.now() - htmlStartTime) / 1000
      if (elapsed > 0) {
        edetailingStore.addHtmlLog({
          title: selectedHtml.title,
          type: 'HTML',
          watchedSeconds: Math.round(elapsed * 10) / 10,
          contentId: selectedHtml.contentId,
          description: selectedHtml.description,
        })
      }
    }
  }, [selectedHtml, htmlStartTime])

  const handleHtmlClose = useCallback(() => {
    // Compute the final elapsed BEFORE the store call so we can also forward
    // it to the backend. The trackHtmlTime callback already writes to the
    // store, so we duplicate the math here rather than threading state.
    if (selectedHtml) {
      const elapsed = (Date.now() - htmlStartTime) / 1000
      if (elapsed > 0) {
        recordViewToBackend(selectedHtml.contentId, Math.round(elapsed * 10) / 10)
      }
    }
    trackHtmlTime()
    setSelectedHtml(null)
    if (htmlIntervalRef.current) {
      clearInterval(htmlIntervalRef.current)
      htmlIntervalRef.current = null
    }
  }, [selectedHtml, htmlStartTime, trackHtmlTime])

  useEffect(() => {
    if (selectedHtml) {
      setHtmlStartTime(Date.now())
      htmlIntervalRef.current = setInterval(trackHtmlTime, 5000)
      return () => {
        if (htmlIntervalRef.current) clearInterval(htmlIntervalRef.current)
      }
    }
  }, [selectedHtml, trackHtmlTime])

  // ── Content click handlers ──────────────────────────────────────────────
  const handleContentClick = (item: ContentItem) => {
    if (item.type === 'video') {
      setSelectedVideo(item)
      videoStartTimeRef.current = Date.now()
    } else if (item.type === 'pdf') {
      setSelectedPdf(item)
      setPdfPageStartTime(Date.now())
      setPdfPagesTime({})
      setPdfCurrentPage(1)
    } else if (item.type === 'html') {
      setSelectedHtml(item)
    }
  }

  // ── Send to DCR ─────────────────────────────────────────────────────────
  const handleSendToDCR = () => {
    sessionStorage.setItem('edetailingFromSendToDCR', 'true')
    sessionStorage.setItem('edetailingWatchHistory', JSON.stringify(edetailingStore.getWatchHistory()))
    onNavigate?.('dcr')
  }

  const watchHistory = edetailingStore.getWatchHistory()
  const hasWatchHistory =
    watchHistory.pdfLogs.length > 0 || watchHistory.videoLogs.length > 0 || watchHistory.htmlLogs.length > 0

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = Math.floor(seconds % 60)
    return m > 0 ? `${m}:${String(s).padStart(2, '0')}` : `${s}s`
  }

  const formatDurationShort = (seconds: number) => {
    const s = Math.round(seconds)
    return s < 60 ? `${s}s` : formatDuration(seconds)
  }

  const formatViewedAt = (iso?: string) => {
    if (!iso) return null
    try {
      const d = new Date(iso)
      const now = new Date()
      const diffMs = now.getTime() - d.getTime()
      const diffMins = Math.floor(diffMs / 60000)
      if (diffMins < 1) return 'Just now'
      if (diffMins < 60) return `${diffMins}m ago`
      const diffHours = Math.floor(diffMins / 60)
      if (diffHours < 24) return `${diffHours}h ago`
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    } catch {
      return null
    }
  }

  useEffect(() => {
    if (selectedVideo) document.body.style.overflow = 'hidden'
    else if (selectedPdf) document.body.style.overflow = 'hidden'
    else if (selectedHtml) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = 'unset'
    return () => { document.body.style.overflow = 'unset' }
  }, [selectedVideo, selectedPdf, selectedHtml])

  return (
    <div className="edetailing-container">
      <Header onLogout={onLogout} onMenuClick={handleMenuClick} onNavigateHome={() => onNavigate?.('home')} onNavigateOfflineRequests={() => onNavigate?.('offline-requests')} />
      <Sidebar isOpen={sidebarOpen} onClose={handleSidebarClose} userName={userName} onNavigate={onNavigate} onLogout={onLogout} />
      <main className="edetailing-content">
        <div className="edetailing-header">
          <button className="back-button" onClick={handleBackClick} aria-label="Go back">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <h1 className="edetailing-title">eDetailing</h1>
          {hasWatchHistory && (
            <button className="send-to-dcr-btn" onClick={() => setShowSendToDCR(true)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Send to DCR
            </button>
          )}
        </div>

        <div className="edetailing-controls">
          <div className="search-bar">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
              <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <input
              type="text"
              placeholder="Search videos and PDFs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="filter-tabs">
            <button className={`filter-tab ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>All</button>
            <button className={`filter-tab ${filter === 'video' ? 'active' : ''}`} onClick={() => setFilter('video')}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M23 7L16 12L23 17V7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <rect x="1" y="5" width="15" height="14" rx="2" stroke="currentColor" strokeWidth="2" />
              </svg>
              Videos
            </button>
            <button className={`filter-tab ${filter === 'pdf' ? 'active' : ''}`} onClick={() => setFilter('pdf')}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M16 13H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M16 17H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M10 9H9H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              PDFs
            </button>
            <button className={`filter-tab ${filter === 'html' ? 'active' : ''}`} onClick={() => setFilter('html')}>HTML</button>
          </div>
        </div>

        {/* Watch History Section */}
        {hasWatchHistory && (
          <div className="watch-history-section">
            <h2 className="watch-history-title">Watch History</h2>
            <p className="watch-history-subtitle">Content you've viewed — will be included when you Send to DCR</p>

            {/* PDF Reading History - matches design */}
            {watchHistory.pdfLogs.length > 0 && (
              <div className="pdf-reading-history">
                <h3 className="pdf-reading-history-title">PDF Reading History</h3>
                <div className="pdf-reading-history-grid">
                {watchHistory.pdfLogs.map((log, idx) => (
                  <div key={`p-${idx}`} className="pdf-reading-history-card">
                    <h4 className="pdf-reading-filename">{log.title}</h4>
                    <div className="pdf-reading-description-box">
                      <span className="pdf-reading-description-label">Description:</span>
                      <span className="pdf-reading-description-value">{log.description || '—'}</span>
                    </div>
                    {Object.keys(log.pages).length > 0 ? (
                      <>
                        <div className="pdf-reading-page-rows">
                          {Object.entries(log.pages)
                            .sort(([a], [b]) => Number(a) - Number(b))
                            .map(([pageNum, secs]) => (
                              <div key={pageNum} className="pdf-reading-page-row">
                                <span className="pdf-reading-page-label">Page {pageNum}:</span>
                                <span className="pdf-reading-page-value">{formatDurationShort(secs)}</span>
                              </div>
                            ))}
                        </div>
                        <div className="pdf-reading-total-row">
                          <span className="pdf-reading-total-label">Total Time:</span>
                          <span className="pdf-reading-total-value">{formatDurationShort(log.watchedSeconds)}</span>
                        </div>
                      </>
                    ) : (
                      <div className="pdf-reading-total-row">
                        <span className="pdf-reading-total-label">Total Time:</span>
                        <span className="pdf-reading-total-value">{formatDurationShort(log.watchedSeconds)}</span>
                      </div>
                    )}
                  </div>
                ))}
                </div>
              </div>
            )}

            {/* Video & HTML in grid */}
            {(watchHistory.videoLogs.length > 0 || watchHistory.htmlLogs.length > 0) && (
              <div className="watch-history-grid">
                {watchHistory.videoLogs.map((log, idx) => (
                  <div key={`v-${idx}`} className="watch-history-card video-log">
                    <div className="watch-history-card-header">
                      <span className="watch-history-type-badge video">Video</span>
                      <span className="watch-history-duration">{formatDuration(log.watchedSeconds)}</span>
                    </div>
                    <h4 className="watch-history-card-title">{log.title}</h4>
                    {log.segments?.length > 0 && log.segments[0].metadata?.description && (
                      <p className="watch-history-meta">{log.segments[0].metadata.description}</p>
                    )}
                    {log.segments?.length > 0 && log.segments[0].metadata?.from_timestamp && (
                      <p className="watch-history-meta watch-history-time-range">
                        {log.segments[0].metadata.from_timestamp} – {log.segments[0].metadata.to_timestamp}
                      </p>
                    )}
                    {formatViewedAt(log.viewedAt) && (
                      <p className="watch-history-meta watch-history-viewed-at">Viewed {formatViewedAt(log.viewedAt)}</p>
                    )}
                  </div>
                ))}
                {watchHistory.htmlLogs.map((log, idx) => (
                  <div key={`h-${idx}`} className="watch-history-card html-log">
                    <div className="watch-history-card-header">
                      <span className="watch-history-type-badge html">HTML</span>
                      <span className="watch-history-duration">{formatDuration(log.watchedSeconds)}</span>
                    </div>
                    <h4 className="watch-history-card-title">{log.title}</h4>
                    {log.description && (
                      <p className="watch-history-meta">{log.description}</p>
                    )}
                    {formatViewedAt(log.viewedAt) && (
                      <p className="watch-history-meta watch-history-viewed-at">Viewed {formatViewedAt(log.viewedAt)}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="content-grid">
          {filteredContent.length === 0 ? (
            <div className="no-content">
              <p>No content found matching your search.</p>
            </div>
          ) : (
            filteredContent.map((item) => (
              <div key={item.id} className="content-card" onClick={() => handleContentClick(item)}>
                {item.type === 'video' ? (
                  <div className="content-thumbnail video-thumbnail">
                    <img src={item.thumbnail} alt={item.title} className="thumbnail-image" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                    <div className="thumbnail-header">
                      <h4 className="thumbnail-title">{item.title}</h4>
                      <div className="play-button-center">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <circle cx="12" cy="12" r="10" fill="rgba(0, 0, 0, 0.5)" />
                          <path d="M10 8L16 12L10 16V8Z" fill="#ffffff" />
                        </svg>
                      </div>
                      <div className="duration-badge">{item.duration}</div>
                    </div>
                  </div>
                ) : item.type === 'pdf' ? (
                  <div className="content-thumbnail pdf-thumbnail">
                    <img src={item.thumbnail} alt={item.title} className="thumbnail-image" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                    <div className="thumbnail-header">
                      <h4 className="thumbnail-title">{item.title}</h4>
                      <div className="size-badge">{item.size}</div>
                    </div>
                  </div>
                ) : (
                  <div className="content-thumbnail html-thumbnail">
                    <img src={item.thumbnail} alt={item.title} className="thumbnail-image" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                    <div className="thumbnail-header">
                      <h4 className="thumbnail-title">{item.title}</h4>
                    </div>
                  </div>
                )}
                <div className="content-info">
                  <div className="content-category">{item.category}</div>
                  <h3 className="content-title">{item.title}</h3>
                  <p className="content-description">{item.description}</p>
                  <button className={`content-type-btn ${item.type === 'video' ? 'video-btn' : item.type === 'pdf' ? 'pdf-btn' : 'html-btn'}`}>
                    {item.type === 'video' ? (
                      <>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M23 7L16 12L23 17V7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          <rect x="1" y="5" width="15" height="14" rx="2" stroke="currentColor" strokeWidth="2" />
                        </svg>
                        <span>Video</span>
                      </>
                    ) : item.type === 'pdf' ? (
                      <>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <span>PDF</span>
                      </>
                    ) : (
                      <span>HTML</span>
                    )}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* Send to DCR confirmation modal */}
      {showSendToDCR && (
        <div className="edetailing-modal-overlay" onClick={() => setShowSendToDCR(false)}>
          <div className="edetailing-modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Send Watch History to DCR</h3>
            <p>Your viewed content will be added to the DCR form. Continue?</p>
            <div className="edetailing-modal-actions">
              <button className="modal-btn-secondary" onClick={() => setShowSendToDCR(false)}>Cancel</button>
              <button className="modal-btn-primary" onClick={handleSendToDCR}>Continue to DCR</button>
            </div>
          </div>
        </div>
      )}

      {/* PDF Viewer Modal */}
      {selectedPdf && (
        <div className="pdf-modal-overlay">
          <div className="pdf-modal-content">
            <div className="pdf-modal-header">
              <h2>{selectedPdf.title}</h2>
              <button className="pdf-modal-close" onClick={handlePdfBack} aria-label="Close">×</button>
            </div>
            <div className="pdf-viewer-container" ref={pdfContainerRef}>
              <Document file={selectedPdf.url} onLoadSuccess={handlePdfLoadSuccess} loading={<div className="pdf-loading">Loading PDF…</div>}>
                {Array.from({ length: pdfNumPages }, (_, i) => i + 1).map((n) => (
                  <Page key={n} pageNumber={n} width={Math.min(window.innerWidth - 80, 600)} data-page={n} />
                ))}
              </Document>
            </div>
          </div>
        </div>
      )}

      {/* Video Player Modal */}
      {selectedVideo && (
        <div className="video-modal-overlay" onClick={handleVideoClose}>
          <div className="video-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="video-modal-close" onClick={handleVideoClose} aria-label="Close video">×</button>
            <div className="video-modal-header">
              <h2>{selectedVideo.title}</h2>
              <p className="video-modal-category">{selectedVideo.category}</p>
            </div>
            <div className="video-player-container">
              <iframe
                src={`https://www.youtube.com/embed/${selectedVideo.videoId || selectedVideo.url.replace(/.*[?&]v=([^&]+).*/, '$1')}?autoplay=1`}
                title={selectedVideo.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="video-player"
              />
            </div>
            <div className="video-modal-description">
              <p>{selectedVideo.description}</p>
            </div>
          </div>
        </div>
      )}

      {/* HTML Viewer Modal */}
      {selectedHtml && (
        <div className="html-modal-overlay">
          <div className="html-modal-content">
            <div className="html-modal-header">
              <h2>{selectedHtml.title}</h2>
              <button className="html-modal-close" onClick={handleHtmlClose} aria-label="Close">×</button>
            </div>
            <div className="html-viewer-body">
              <p>{selectedHtml.description}</p>
              <p className="html-placeholder">Interactive HTML content would load from: {selectedHtml.url}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default EDetailing
