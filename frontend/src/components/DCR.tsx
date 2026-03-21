import { useState, useRef, useEffect } from 'react'
import Header from './Header'
import Sidebar from './Sidebar'
import SpeechRecorder from './SpeechRecorder'
import { extractDCRData } from '../services/openaiService'
import { findBestProductMatch, findBestSampleMatch } from '../utils/textMatching'
import { apiPost } from '../services/apiService'
import './DCR.css'

interface DCRProps {
  onLogout: () => void
  onBack: () => void
  userName?: string
  onNavigate?: (page: string) => void
  selectedItem?: {
    id: number
    name: string
    type: 'doctor' | 'pharmacy'
    specialization?: string
    mobile: string
    address: string
    scheduledTime?: string
  }
}

interface Sample {
  id: number
  name: string
  quantity: number
}

const products = [
  'Derise 10mg',
  'Derise 20mg',
  'Derise 50mg',
  'Rilast Tablet',
  'Rilast Capsule',
  'Rilast Syrup',
  'Bevaas 5mg',
  'Bevaas 10mg',
  'Bevaas 20mg',
]

const availableSamples = [
  { id: 1, name: 'Sample A - Cardiovascular' },
  { id: 2, name: 'Sample B - Diabetes' },
  { id: 3, name: 'Sample C - Neurological' },
  { id: 4, name: 'Sample D - Pediatric' },
  { id: 5, name: 'Sample E - Oncology' },
  { id: 6, name: 'Sample F - Respiratory' },
]

function DCR({ onLogout, onBack, userName, onNavigate, selectedItem: propSelectedItem }: DCRProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState('')
  const [selectedSamples, setSelectedSamples] = useState<Sample[]>([])
  const [callSummary, setCallSummary] = useState('')
  const [doctorFeedback, setDoctorFeedback] = useState('')
  const [selfie, setSelfie] = useState<string | null>(null)
  const [showSampleDropdown, setShowSampleDropdown] = useState(false)
  const [errors, setErrors] = useState<{
    product?: string
    callSummary?: string
    selfie?: string
    samples?: string
  }>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  
  // Speech-to-text states
  const [transcription, setTranscription] = useState('')
  const [isExtracting, setIsExtracting] = useState(false)
  const [extractionError, setExtractionError] = useState<string | null>(null)
  const [autoFilledFields, setAutoFilledFields] = useState<{
    product?: boolean
    samples?: boolean
    callSummary?: boolean
    doctorFeedback?: boolean
  }>({})
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const samplesDropdownRef = useRef<HTMLDivElement>(null)

  // Get selected item from sessionStorage or props
  const [selectedItem] = useState(() => {
    if (propSelectedItem) return propSelectedItem
    try {
      const stored = sessionStorage.getItem('dcrSelectedItem')
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })

  const handleMenuClick = () => {
    setSidebarOpen(true)
  }

  const handleSidebarClose = () => {
    setSidebarOpen(false)
  }

  const handleBackClick = () => {
    // Clear sessionStorage when going back
    sessionStorage.removeItem('dcrSelectedItem')
    // Get previous page from sessionStorage, default to onBack if not found
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

  // Get current date
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  // Handle click outside samples dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        samplesDropdownRef.current &&
        !samplesDropdownRef.current.contains(event.target as Node)
      ) {
        setShowSampleDropdown(false)
      }
    }

    if (showSampleDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showSampleDropdown])

  // Auto-dismiss toast after 3 seconds
  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 3000)
    return () => clearTimeout(timer)
  }, [toast])

  // ── AI Pre-call briefing ──────────────────────────────────────────────────
  interface PreCallBriefing {
    summary: string
    lastVisit: string
    pendingItems: string[]
    talkingPoints: string[]
    watchOut: string[]
  }
  const [briefing, setBriefing] = useState<PreCallBriefing | null>(null)
  const [briefingLoading, setBriefingLoading] = useState(false)
  const [briefingExpanded, setBriefingExpanded] = useState(true)

  useEffect(() => {
    if (!selectedItem?.name) return
    const userId = (() => {
      try { return localStorage.getItem('userId') || localStorage.getItem('user_id') || 'mr_rahul_001' } catch { return 'mr_rahul_001' }
    })()
    setBriefingLoading(true)
    setBriefing(null)
    apiPost('/ai/precall-briefing', { user_id: userId, doctor_name: selectedItem.name })
      .then(data => { if (data.success) setBriefing(data.briefing) })
      .catch(() => {})
      .finally(() => setBriefingLoading(false))
  }, [selectedItem?.name])
  // ─────────────────────────────────────────────────────────────────────────

  const handleSampleToggle = (sample: typeof availableSamples[0]) => {
    setSelectedSamples(prev => {
      const exists = prev.find(s => s.id === sample.id)
      if (exists) {
        return prev.filter(s => s.id !== sample.id)
      } else {
        return [...prev, { id: sample.id, name: sample.name, quantity: 0 }]
      }
    })
    // Clear samples error when user interacts
    if (errors.samples) {
      setErrors(prev => ({ ...prev, samples: undefined }))
    }
  }

  const handleQuantityChange = (sampleId: number, quantity: number) => {
    setSelectedSamples(prev =>
      prev.map(s => s.id === sampleId ? { ...s, quantity } : s)
    )
    // Clear samples error when user enters quantity
    if (errors.samples) {
      setErrors(prev => ({ ...prev, samples: undefined }))
    }
  }

  const handleSelfieUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setSelfie(reader.result as string)
        // Clear selfie error when user uploads selfie
        if (errors.selfie) {
          setErrors(prev => ({ ...prev, selfie: undefined }))
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const handleTakeSelfie = () => {
    fileInputRef.current?.click()
  }

  // Handle transcription from speech recorder - auto-extract when recording stops
  const handleTranscriptionComplete = async (text: string) => {
    setTranscription(text)
    setExtractionError(null)
    
    // Automatically extract and fill form when transcription is complete
    if (text.trim()) {
      // Use the text parameter directly instead of waiting for state update
      await handleExtractAndFillWithText(text)
    }
  }

  // Handle speech recognition errors
  const handleSpeechError = (error: string) => {
    setExtractionError(error)
  }

  // Handle clear — reset all auto-filled fields
  const handleRecorderClear = () => {
    setTranscription('')
    setExtractionError(null)
    setSelectedProduct('')
    setSelectedSamples([])
    setCallSummary('')
    setDoctorFeedback('')
    setAutoFilledFields({})
  }

  // Extract and auto-populate form fields
  // Function kept for future use - reference added to avoid TypeScript warning
  const handleExtractAndFill = async () => {
    if (!transcription.trim()) {
      setExtractionError('Please record audio first or enter transcription text')
      return
    }
    await handleExtractAndFillWithText(transcription)
  }
  
  // Reference to avoid TypeScript unused variable warning
  if (false) {
    void handleExtractAndFill
  }

  // Internal function to extract data from text
  const handleExtractAndFillWithText = async (textToExtract: string) => {
    if (!textToExtract.trim()) {
      setExtractionError('Transcription text is empty')
      return
    }

    setIsExtracting(true)
    setExtractionError(null)

    try {
      // Call backend LLM service to extract structured data
      const extractedData = await extractDCRData(textToExtract, products, availableSamples, selectedItem?.name)

      // Track which fields were auto-filled
      const filledFields: typeof autoFilledFields = {}

      // Auto-fill product
      if (extractedData.product) {
        // Try to match with available products
        const matchedProduct = findBestProductMatch(extractedData.product, products)
        if (matchedProduct) {
          setSelectedProduct(matchedProduct)
          filledFields.product = true
          if (errors.product) {
            setErrors(prev => ({ ...prev, product: undefined }))
          }
        }
      }

      // Auto-fill samples
      if (extractedData.samples && extractedData.samples.length > 0) {
        const newSamples: Sample[] = []
        for (const extractedSample of extractedData.samples) {
          const matchedSample = findBestSampleMatch(extractedSample.name, availableSamples)
          if (matchedSample) {
            // Check if sample already exists
            const existingSample = newSamples.find(s => s.id === matchedSample.id)
            if (existingSample) {
              existingSample.quantity += extractedSample.quantity
            } else {
              newSamples.push({
                id: matchedSample.id,
                name: matchedSample.name,
                quantity: extractedSample.quantity,
              })
            }
          }
        }
        if (newSamples.length > 0) {
          setSelectedSamples(prev => {
            // Merge with existing samples, avoiding duplicates
            const merged = [...prev]
            newSamples.forEach(newSample => {
              const existing = merged.find(s => s.id === newSample.id)
              if (existing) {
                existing.quantity = Math.max(existing.quantity, newSample.quantity)
              } else {
                merged.push(newSample)
              }
            })
            return merged
          })
          filledFields.samples = true
          if (errors.samples) {
            setErrors(prev => ({ ...prev, samples: undefined }))
          }
        }
      }

      // Auto-fill call summary
      if (extractedData.callSummary) {
        setCallSummary(extractedData.callSummary)
        filledFields.callSummary = true
        if (errors.callSummary) {
          setErrors(prev => ({ ...prev, callSummary: undefined }))
        }
      } else if (textToExtract.trim()) {
        // Use full transcription as fallback
        setCallSummary(textToExtract.trim())
        filledFields.callSummary = true
        if (errors.callSummary) {
          setErrors(prev => ({ ...prev, callSummary: undefined }))
        }
      }

      // Auto-fill doctor feedback
      if (extractedData.doctorFeedback) {
        setDoctorFeedback(extractedData.doctorFeedback)
        filledFields.doctorFeedback = true
      }

      setAutoFilledFields(filledFields)

      // Show success message
      if (Object.keys(filledFields).length > 0) {
        // Scroll to first auto-filled field
        setTimeout(() => {
          const firstFilledField = document.querySelector('.auto-filled')
          if (firstFilledField) {
            firstFilledField.scrollIntoView({ behavior: 'smooth', block: 'center' })
          }
        }, 100)
        
        // Clear any previous errors
        setExtractionError(null)
      } else {
        setExtractionError('No data could be extracted from the transcription. Please try again or fill manually.')
      }
    } catch (error) {
      let errorMessage = 'Failed to extract data. Please try again.'
      
      if (error instanceof Error) {
        errorMessage = error.message
        
        // Provide more user-friendly error messages
        if (errorMessage.includes('API key')) {
          errorMessage = 'Gemini API key is not configured. Please set VITE_GEMINI_API_KEY in your environment variables.'
        } else if (errorMessage.includes('timeout')) {
          errorMessage = 'Request timed out. Please check your internet connection and try again.'
        } else if (errorMessage.includes('rate limit')) {
          errorMessage = 'Too many requests. Please wait a moment and try again.'
        } else if (errorMessage.includes('temporarily unavailable')) {
          errorMessage = 'Service is temporarily unavailable. Please try again later.'
        }
      }
      
      setExtractionError(errorMessage)
      console.error('Error extracting DCR data:', error)
    } finally {
      setIsExtracting(false)
    }
  }

  const validateForm = () => {
    const newErrors: typeof errors = {}

    if (!selectedProduct) {
      newErrors.product = 'Please select a product'
    }
    if (!callSummary.trim()) {
      newErrors.callSummary = 'Please enter a call summary'
    }
    // Check if samples have quantities
    const samplesWithoutQuantity = selectedSamples.filter(s => s.quantity <= 0)
    if (samplesWithoutQuantity.length > 0) {
      newErrors.samples = 'Please enter quantity for all selected samples'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Step 1: validate then show confirm modal
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      const firstErrorField = document.querySelector('.field-error')
      if (firstErrorField) {
        firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
      return
    }

    setShowConfirmModal(true)
  }

  // Step 2: user confirmed — call API
  const handleConfirmSubmit = async () => {
    setShowConfirmModal(false)
    setIsSubmitting(true)

    const userId = (() => {
      try {
        return localStorage.getItem('userId') || localStorage.getItem('user_id') || 'mr_rahul_001'
      } catch {
        return 'mr_rahul_001'
      }
    })()

    const dcrPayload = {
      name: selectedItem?.name || 'Unknown',
      date: currentDate,
      product: selectedProduct,
      samples: selectedSamples,
      callSummary,
      doctor_feedback: doctorFeedback,
      user_id: userId,
    }

    try {
      await apiPost('/dcr', dcrPayload)

      setIsSubmitting(false)
      setToast({ message: 'DCR submitted successfully!', type: 'success' })
      sessionStorage.removeItem('dcrSelectedItem')

      setTimeout(() => {
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
      }, 1500)
    } catch (error) {
      setIsSubmitting(false)
      const message = error instanceof Error ? error.message : 'Failed to submit DCR. Please try again.'
      setToast({ message, type: 'error' })
      console.error('DCR submission error:', error)
    }
  }

  return (
    <div className="dcr-container">
      <Header onLogout={onLogout} onMenuClick={handleMenuClick} onNavigateHome={() => onNavigate?.('home')} onNavigateOfflineRequests={() => onNavigate?.('offline-requests')} />
      <Sidebar isOpen={sidebarOpen} onClose={handleSidebarClose} userName={userName} onNavigate={onNavigate} onLogout={onLogout} />

      {/* Toast notification */}
      {toast && (
        <div
          role="alert"
          style={{
            position: 'fixed',
            top: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '14px 22px',
            borderRadius: '14px',
            fontSize: '14px',
            fontWeight: 600,
            boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
            minWidth: '260px',
            maxWidth: '90vw',
            background: toast.type === 'success' ? '#dcfce7' : '#fee2e2',
            color: toast.type === 'success' ? '#166534' : '#991b1b',
            border: `1px solid ${toast.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
            animation: 'dcr-toast-in 0.3s cubic-bezier(0.4,0,0.2,1)',
          }}
        >
          {toast.type === 'success' ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
              <path d="M12 8V12M12 16H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Full-screen loader overlay */}
      {isSubmitting && (
        <div
          role="status"
          aria-label="Submitting DCR"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9998,
            background: 'rgba(15, 23, 42, 0.55)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div style={{
            background: '#ffffff',
            borderRadius: '20px',
            padding: '40px 52px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
          }}>
            <svg width="52" height="52" viewBox="0 0 48 48" fill="none">
              <circle cx="24" cy="24" r="20" stroke="#e2e8f0" strokeWidth="4"/>
              <circle cx="24" cy="24" r="20" stroke="#22c55e" strokeWidth="4"
                strokeLinecap="round" strokeDasharray="31.4 94.2">
                <animateTransform attributeName="transform" type="rotate"
                  from="0 24 24" to="360 24 24" dur="0.8s" repeatCount="indefinite"/>
              </circle>
            </svg>
            <p style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: '#334155' }}>
              Submitting DCR…
            </p>
          </div>
        </div>
      )}

      {/* Confirmation modal */}
      {showConfirmModal && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '20px',
              padding: '36px 32px 28px',
              maxWidth: '380px',
              width: '100%',
              boxShadow: '0 24px 64px rgba(0,0,0,0.28)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            {/* Icon */}
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: '#f0fdf4',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '4px',
            }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="#22c55e" strokeWidth="2"/>
                <path d="M12 8V12M12 16H12.01" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
            </div>

            {/* Title */}
            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#0f172a' }}>
              Submit DCR?
            </h3>

            {/* Message */}
            <p style={{ margin: 0, fontSize: '14px', color: '#64748b', textAlign: 'center', lineHeight: 1.6 }}>
              Are you sure you want to submit this DCR?
            </p>

            {/* Buttons */}
            <div style={{ display: 'flex', gap: '12px', width: '100%', marginTop: '8px' }}>
              <button
                onClick={() => setShowConfirmModal(false)}
                style={{
                  flex: 1,
                  padding: '13px 0',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: '1.5px solid #e2e8f0',
                  background: '#f8fafc',
                  color: '#475569',
                  transition: 'background 0.2s',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSubmit}
                style={{
                  flex: 1,
                  padding: '13px 0',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: 'none',
                  background: '#22c55e',
                  color: '#ffffff',
                  boxShadow: '0 4px 14px rgba(34,197,94,0.35)',
                  transition: 'background 0.2s',
                }}
              >
                Yes, Submit
              </button>
            </div>
          </div>
        </div>
      )}
      <main className="dcr-content">
        <div className="dcr-header">
          <button className="back-button" onClick={handleBackClick} aria-label="Go back">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <h1 className="dcr-title">Daily Call Report (DCR)</h1>
        </div>

        {/* Speech-to-Text Section - Outside Form */}
        <div className="speech-recorder-wrapper">
          <SpeechRecorder
            onTranscriptionComplete={handleTranscriptionComplete}
            onError={handleSpeechError}
            onClear={handleRecorderClear}
          />
        </div>

        {isExtracting && (
          <div className="auto-extracting-indicator">
            <svg className="spinner" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeDasharray="32" strokeDashoffset="32">
                <animate attributeName="stroke-dasharray" dur="2s" values="0 32;16 16;0 32;0 32" repeatCount="indefinite"/>
                <animate attributeName="stroke-dashoffset" dur="2s" values="0;-16;-32;-32" repeatCount="indefinite"/>
              </circle>
            </svg>
            <span>Auto-extracting data from transcription...</span>
          </div>
        )}
        {extractionError && (
          <div className="extraction-error" role="alert">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
              <path d="M12 8V12M12 16H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <span>{extractionError}</span>
          </div>
        )}
        {!extractionError && Object.values(autoFilledFields).some(v => v) && (
          <div className="extraction-success" role="status">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>Form fields have been auto-filled! Please review and edit if needed.</span>
            <button type="button" className="clear-autofill-btn" onClick={handleRecorderClear}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Clear
            </button>
          </div>
        )}

        {/* ── AI Pre-call Briefing Card ───────────────────────────────── */}
        {(briefingLoading || briefing) && (
          <div style={{ margin: '0 0 18px', borderRadius: '16px', border: '1.5px solid #bbf7d0', background: 'linear-gradient(135deg,#f0fdf4,#ecfdf5)', overflow: 'hidden', boxShadow: '0 2px 12px rgba(34,197,94,.1)' }}>

            {/* Header row — always visible, click to collapse */}
            <button
              type="button"
              onClick={() => setBriefingExpanded(p => !p)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
            >
              <div style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg,#22c55e,#16a34a)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 2px 8px rgba(34,197,94,.3)' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="white" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '.88rem', fontWeight: 700, color: '#14532d', lineHeight: 1.2 }}>AI Pre-call Briefing</div>
                <div style={{ fontSize: '.74rem', color: '#4ade80', marginTop: 1 }}>
                  {briefingLoading ? 'Analysing past visits…' : `Based on visits with ${selectedItem?.name}`}
                </div>
              </div>
              {briefingLoading ? (
                <svg width="22" height="22" viewBox="0 0 48 48" fill="none" style={{ flexShrink: 0 }}>
                  <circle cx="24" cy="24" r="18" stroke="#bbf7d0" strokeWidth="4"/>
                  <circle cx="24" cy="24" r="18" stroke="#22c55e" strokeWidth="4" strokeLinecap="round" strokeDasharray="28 56">
                    <animateTransform attributeName="transform" type="rotate" from="0 24 24" to="360 24 24" dur=".8s" repeatCount="indefinite"/>
                  </circle>
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, transition: 'transform .2s', transform: briefingExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                  <path d="M19 9L12 15L5 9" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </button>

            {/* Collapsible body */}
            {!briefingLoading && briefing && briefingExpanded && (
              <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>

                {/* Summary */}
                <div style={{ background: 'white', borderRadius: 10, padding: '12px 14px', border: '1px solid #d1fae5' }}>
                  <div style={{ fontSize: '.72rem', fontWeight: 700, color: '#059669', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 6 }}>Summary</div>
                  <p style={{ margin: 0, fontSize: '.875rem', color: '#1e293b', lineHeight: 1.6 }}>{briefing.summary}</p>
                </div>

                {/* Last Visit */}
                <div style={{ background: 'white', borderRadius: 10, padding: '12px 14px', border: '1px solid #d1fae5' }}>
                  <div style={{ fontSize: '.72rem', fontWeight: 700, color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 6 }}>Last Visit</div>
                  <p style={{ margin: 0, fontSize: '.875rem', color: '#1e293b', lineHeight: 1.6 }}>{briefing.lastVisit}</p>
                </div>

                {/* Pending Items */}
                {briefing.pendingItems.length > 0 && (
                  <div style={{ background: '#fffbeb', borderRadius: 10, padding: '12px 14px', border: '1px solid #fde68a' }}>
                    <div style={{ fontSize: '.72rem', fontWeight: 700, color: '#d97706', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 6 }}>⚠ Pending Items</div>
                    <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 5 }}>
                      {briefing.pendingItems.map((item, i) => <li key={i} style={{ fontSize: '.855rem', color: '#78350f', lineHeight: 1.5 }}>{item}</li>)}
                    </ul>
                  </div>
                )}

                {/* Talking Points */}
                {briefing.talkingPoints.length > 0 && (
                  <div style={{ background: '#f0fdf4', borderRadius: 10, padding: '12px 14px', border: '1px solid #bbf7d0' }}>
                    <div style={{ fontSize: '.72rem', fontWeight: 700, color: '#16a34a', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 6 }}>✓ Talking Points</div>
                    <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 5 }}>
                      {briefing.talkingPoints.map((item, i) => <li key={i} style={{ fontSize: '.855rem', color: '#14532d', lineHeight: 1.5 }}>{item}</li>)}
                    </ul>
                  </div>
                )}

                {/* Watch Out */}
                {briefing.watchOut.length > 0 && (
                  <div style={{ background: '#fef2f2', borderRadius: 10, padding: '12px 14px', border: '1px solid #fecaca' }}>
                    <div style={{ fontSize: '.72rem', fontWeight: 700, color: '#dc2626', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 6 }}>✕ Watch Out</div>
                    <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 5 }}>
                      {briefing.watchOut.map((item, i) => <li key={i} style={{ fontSize: '.855rem', color: '#7f1d1d', lineHeight: 1.5 }}>{item}</li>)}
                    </ul>
                  </div>
                )}

              </div>
            )}
          </div>
        )}
        {/* ─────────────────────────────────────────────────────────────── */}

        <form className="dcr-form" onSubmit={handleSubmit}>

          {/* Name Field */}
          <div className="form-group">
            <label className="form-label">Name</label>
            <input
              type="text"
              className="form-input"
              value={selectedItem?.name || ''}
              readOnly
              disabled
            />
            {selectedItem?.specialization && (
              <p className="form-hint">{selectedItem.specialization}</p>
            )}
          </div>

          {/* Date Field */}
          <div className="form-group">
            <label className="form-label">Date</label>
            <input
              type="text"
              className="form-input"
              value={currentDate}
              readOnly
              disabled
            />
          </div>

          {/* Product Dropdown */}
          <div className="form-group">
            <label className="form-label">
              Select Product <span className="required">*</span>
              {autoFilledFields.product && <span className="auto-filled-badge" title="Auto-filled from voice input">Auto-filled</span>}
            </label>
            <select
              className={`form-select ${errors.product ? 'field-error' : ''} ${autoFilledFields.product ? 'auto-filled' : ''}`}
              value={selectedProduct}
              onChange={(e) => {
                setSelectedProduct(e.target.value)
                setAutoFilledFields(prev => ({ ...prev, product: false }))
                if (errors.product) {
                  setErrors(prev => ({ ...prev, product: undefined }))
                }
              }}
              required
            >
              <option value="">Select Product</option>
              {products.map((product) => (
                <option key={product} value={product}>{product}</option>
              ))}
            </select>
            {errors.product && <span className="error-message field-error">{errors.product}</span>}
          </div>

          {/* Samples Dropdown */}
          <div className="form-group">
            <label className="form-label">
              Samples
              {autoFilledFields.samples && <span className="auto-filled-badge" title="Auto-filled from voice input">Auto-filled</span>}
            </label>
            <div className={`samples-dropdown-wrapper ${autoFilledFields.samples ? 'auto-filled' : ''}`} ref={samplesDropdownRef}>
              <button
                type="button"
                className={`samples-dropdown-trigger ${autoFilledFields.samples ? 'auto-filled' : ''}`}
                onClick={() => {
                  setShowSampleDropdown(!showSampleDropdown)
                  if (autoFilledFields.samples) {
                    setAutoFilledFields(prev => ({ ...prev, samples: false }))
                  }
                }}
              >
                <span>{selectedSamples.length > 0 ? `${selectedSamples.length} sample(s) selected` : 'Select Samples'}</span>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M19 9L12 15L5 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              {showSampleDropdown && (
                <div className="samples-dropdown">
                  {availableSamples.map((sample) => {
                    const isSelected = selectedSamples.find(s => s.id === sample.id)
                    return (
                      <div key={sample.id} className="sample-item">
                        <label className="sample-checkbox">
                          <input
                            type="checkbox"
                            checked={!!isSelected}
                            onChange={() => handleSampleToggle(sample)}
                          />
                          <span>{sample.name}</span>
                        </label>
                        {isSelected && (
                          <div className="sample-quantity">
                            <label>Quantity:</label>
                            <input
                              type="number"
                              min="1"
                              value={isSelected.quantity}
                              onChange={(e) => handleQuantityChange(sample.id, parseInt(e.target.value) || 0)}
                              className="quantity-input"
                            />
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
            {selectedSamples.length > 0 && (
              <div className="selected-samples-list">
                {selectedSamples.map((sample) => (
                  <div key={sample.id} className="selected-sample-item">
                    <span>{sample.name}</span>
                    <span className="sample-quantity-badge">Qty: {sample.quantity}</span>
                  </div>
                ))}
              </div>
            )}
            {errors.samples && <span className="error-message field-error">{errors.samples}</span>}
          </div>

          {/* Summary of the call */}
          <div className="form-group">
            <label className="form-label">
              Summary of the call <span className="required">*</span>
              {autoFilledFields.callSummary && <span className="auto-filled-badge" title="Auto-filled from voice input">Auto-filled</span>}
            </label>
            <textarea
              className={`form-textarea ${errors.callSummary ? 'field-error' : ''} ${autoFilledFields.callSummary ? 'auto-filled' : ''}`}
              rows={5}
              value={callSummary}
              onChange={(e) => {
                setCallSummary(e.target.value)
                setAutoFilledFields(prev => ({ ...prev, callSummary: false }))
                if (errors.callSummary) {
                  setErrors(prev => ({ ...prev, callSummary: undefined }))
                }
              }}
              placeholder="Enter summary of the call..."
              required
            />
            {errors.callSummary && <span className="error-message field-error">{errors.callSummary}</span>}
          </div>

          {/* Doctor's Feedback */}
          <div className="form-group">
            <label className="form-label">
              Doctor's Feedback
              {autoFilledFields.doctorFeedback && <span className="auto-filled-badge" title="Auto-filled from voice input">Auto-filled</span>}
            </label>
            <textarea
              className={`form-textarea ${autoFilledFields.doctorFeedback ? 'auto-filled' : ''}`}
              rows={4}
              value={doctorFeedback}
              onChange={(e) => {
                setDoctorFeedback(e.target.value)
                if (autoFilledFields.doctorFeedback) {
                  setAutoFilledFields(prev => ({ ...prev, doctorFeedback: false }))
                }
              }}
              placeholder="Enter doctor's feedback or response..."
            />
          </div>

          {/* Selfie Upload */}
          <div className="form-group">
            <label className="form-label">Upload Selfie</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="user"
              onChange={handleSelfieUpload}
              className="file-input-hidden"
            />
            <div className="selfie-upload-container">
              {selfie ? (
                <div className="selfie-preview">
                  <img src={selfie} alt="Selfie" />
                  <button
                    type="button"
                    className="change-selfie-btn"
                    onClick={handleTakeSelfie}
                  >
                    Change Selfie
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className="upload-selfie-btn"
                  onClick={handleTakeSelfie}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M23 19C23 19.5304 22.7893 20.0391 22.4142 20.4142C22.0391 20.7893 21.5304 21 21 21H3C2.46957 21 1.96086 20.7893 1.58579 20.4142C1.21071 20.0391 1 19.5304 1 19V5C1 4.46957 1.21071 3.96086 1.58579 3.58579C1.96086 3.21071 2.46957 3 3 3H9L11 5H21C21.5304 5 22.0391 5.21071 22.4142 5.58579C22.7893 5.96086 23 6.46957 23 7V19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 11V17M9 14H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span>Take/Upload Selfie</span>
                </button>
              )}
            </div>
            {errors.selfie && <span className="error-message field-error">{errors.selfie}</span>}
          </div>

          {/* Submit Button */}
          <div className="form-actions">
            <button type="submit" className="submit-dcr-btn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>Submit DCR</span>
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}

export default DCR

