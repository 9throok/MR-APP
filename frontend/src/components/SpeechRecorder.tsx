import { useState, useRef, useEffect } from 'react'
import { CARD, CARD_PADDING, BTN_GHOST, LABEL, TEXTAREA } from '../styles/designSystem'

interface SpeechRecorderProps {
  onTranscriptionComplete: (transcription: string) => void
  onError?: (error: string) => void
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  start(): void
  stop(): void
  abort(): void
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null
  onend: (() => void) | null
  onstart: (() => void) | null
}

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList
  resultIndex: number
}

interface SpeechRecognitionErrorEvent {
  error: string
  message: string
}

interface SpeechRecognitionResultList {
  length: number
  item(index: number): SpeechRecognitionResult
  [index: number]: SpeechRecognitionResult
}

interface SpeechRecognitionResult {
  length: number
  item(index: number): SpeechRecognitionAlternative
  [index: number]: SpeechRecognitionAlternative
  isFinal: boolean
}

interface SpeechRecognitionAlternative {
  transcript: string
  confidence: number
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition
    webkitSpeechRecognition: new () => SpeechRecognition
  }
}

function SpeechRecorder({ onTranscriptionComplete, onError }: SpeechRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [transcription, setTranscription] = useState('')
  const [isSupported, setIsSupported] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const finalTranscriptRef = useRef<string>('')

  useEffect(() => {
    // Check browser support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    setIsSupported(!!SpeechRecognition)

    if (!SpeechRecognition) {
      setError('Speech recognition is not supported in your browser. Please use Chrome or Edge.')
      return
    }

    // Initialize speech recognition
    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'

    recognition.onstart = () => {
      setIsRecording(true)
      setError(null)
      finalTranscriptRef.current = ''
    }

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = ''
      let finalTranscript = finalTranscriptRef.current

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' '
        } else {
          interimTranscript += transcript
        }
      }

      finalTranscriptRef.current = finalTranscript
      setTranscription(finalTranscript + interimTranscript)
    }

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      let errorMessage = 'Speech recognition error occurred'

      switch (event.error) {
        case 'no-speech':
          errorMessage = 'No speech detected. Please try again.'
          break
        case 'audio-capture':
          errorMessage = 'No microphone found. Please check your microphone settings.'
          break
        case 'not-allowed':
          errorMessage = 'Microphone permission denied. Please allow microphone access.'
          break
        case 'network':
          errorMessage = 'Network error. Please check your connection.'
          break
        case 'aborted':
          // User stopped recording, not an error
          return
        default:
          errorMessage = `Speech recognition error: ${event.error}`
      }

      setError(errorMessage)
      setIsRecording(false)
      if (onError) {
        onError(errorMessage)
      }
    }

    recognition.onend = () => {
      setIsRecording(false)
      // If we have a final transcript, notify parent
      if (finalTranscriptRef.current.trim()) {
        onTranscriptionComplete(finalTranscriptRef.current.trim())
      }
    }

    recognitionRef.current = recognition

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort()
        } catch (e) {
          // Ignore errors during cleanup
        }
      }
    }
  }, [onTranscriptionComplete, onError])

  const handleStartRecording = () => {
    if (!recognitionRef.current) {
      setError('Speech recognition not initialized')
      return
    }

    try {
      setTranscription('')
      setError(null)
      recognitionRef.current.start()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start recording'
      setError(errorMessage)
      if (onError) {
        onError(errorMessage)
      }
    }
  }

  const handleStopRecording = () => {
    if (recognitionRef.current && isRecording) {
      try {
        recognitionRef.current.stop()
      } catch (err) {
        // Ignore errors when stopping
      }
    }
  }

  const handleClear = () => {
    setTranscription('')
    finalTranscriptRef.current = ''
    setError(null)
  }

  if (!isSupported) {
    return (
      <div className={`${CARD} ${CARD_PADDING} space-y-4`}>
        <p className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
          Speech recognition is not supported in your browser. Please use Chrome or Edge.
        </p>
      </div>
    )
  }

  return (
    <div className={`${CARD} ${CARD_PADDING} space-y-4`}>
      <div className="flex items-center gap-3">
        {!isRecording ? (
          <button
            type="button"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 transition-colors cursor-pointer border-none"
            onClick={handleStartRecording}
            aria-label="Start recording"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="currentColor"/>
            </svg>
            <span>Start Recording</span>
          </button>
        ) : (
          <button
            type="button"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-800 text-white text-sm font-medium rounded-lg hover:bg-slate-900 transition-colors cursor-pointer border-none"
            onClick={handleStopRecording}
            aria-label="Stop recording"
          >
            <div className="relative flex items-center justify-center">
              <div className="absolute w-10 h-10 rounded-full bg-red-500/30 animate-ping"></div>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor"/>
              </svg>
            </div>
            <span>Stop Recording</span>
          </button>
        )}

        {transcription && (
          <button
            type="button"
            className={BTN_GHOST}
            onClick={handleClear}
            aria-label="Clear transcription"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Clear
          </button>
        )}
      </div>

      {isRecording && (
        <div className="flex items-center gap-2 text-sm text-red-500 font-medium" role="status" aria-live="polite">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
          Recording...
        </div>
      )}

      {transcription && (
        <div className="space-y-2">
          <label className={LABEL}>Transcription:</label>
          <textarea
            className={TEXTAREA}
            value={transcription}
            onChange={(e) => setTranscription(e.target.value)}
            placeholder="Transcribed text will appear here..."
            rows={4}
            readOnly={isRecording}
          />
          {!isRecording && (
            <p className="text-xs text-slate-400">
              You can edit the transcription before extracting data.
            </p>
          )}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2" role="alert">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
            <path d="M12 8V12M12 16H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}

export default SpeechRecorder
