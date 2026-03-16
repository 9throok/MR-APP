import { useState, useRef, useEffect, type JSX } from 'react'
import { apiPost, apiGet } from '../services/apiService'
import './Chatbot.css'

interface MessageSource {
  filename: string
  category: string
  product_name?: string
}

interface Message {
  id: number
  text: string
  isUser: boolean
  timestamp: Date
  sources?: MessageSource[]
}

interface PreviewDoc {
  filename: string
  content: string
  category: string
  product_name: string
}

/* ── Lightweight markdown renderer ──────────────────────────────────────── */
function renderFormattedText(text: string) {
  const lines = text.split('\n')
  const elements: JSX.Element[] = []
  let listItems: JSX.Element[] = []
  let listKey = 0

  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(<ul key={`ul-${listKey++}`}>{listItems}</ul>)
      listItems = []
    }
  }

  const formatInline = (line: string): (string | JSX.Element)[] => {
    const parts: (string | JSX.Element)[] = []
    let remaining = line
    let idx = 0
    const boldRegex = /\*\*(.+?)\*\*/g
    let match: RegExpExecArray | null
    let lastIndex = 0

    while ((match = boldRegex.exec(remaining)) !== null) {
      if (match.index > lastIndex) {
        parts.push(remaining.slice(lastIndex, match.index))
      }
      parts.push(<strong key={`b-${idx++}`}>{match[1]}</strong>)
      lastIndex = match.index + match[0].length
    }
    if (lastIndex < remaining.length) {
      parts.push(remaining.slice(lastIndex))
    }
    return parts.length > 0 ? parts : [line]
  }

  lines.forEach((line, i) => {
    const trimmed = line.trimStart()

    // Headings
    if (trimmed.startsWith('### ')) {
      flushList()
      elements.push(<h5 key={`h-${i}`}>{formatInline(trimmed.slice(4))}</h5>)
      return
    }
    if (trimmed.startsWith('## ')) {
      flushList()
      elements.push(<h4 key={`h-${i}`}>{formatInline(trimmed.slice(3))}</h4>)
      return
    }
    if (trimmed.startsWith('# ')) {
      flushList()
      elements.push(<h4 key={`h-${i}`}>{formatInline(trimmed.slice(2))}</h4>)
      return
    }

    // Bullet points
    if (/^[-*•]\s/.test(trimmed)) {
      listItems.push(<li key={`li-${i}`}>{formatInline(trimmed.replace(/^[-*•]\s+/, ''))}</li>)
      return
    }
    // Sub-bullets (indented)
    if (/^\s{2,}[-*•]\s/.test(line)) {
      listItems.push(<li key={`li-${i}`} className="chatbot-sub-bullet">{formatInline(trimmed.replace(/^[-*•]\s+/, ''))}</li>)
      return
    }

    flushList()

    // Empty lines
    if (trimmed === '') return

    // Regular text
    elements.push(<p key={`p-${i}`}>{formatInline(trimmed)}</p>)
  })

  flushList()
  return <div className="chatbot-formatted-text">{elements}</div>
}

/* ── Component ──────────────────────────────────────────────────────────── */
function Chatbot() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [previewDoc, setPreviewDoc] = useState<PreviewDoc | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isTyping) return

    const query = inputValue.trim()
    const userMessage: Message = {
      id: messages.length + 1,
      text: query,
      isUser: true,
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsTyping(true)

    try {
      const data = await apiPost('/knowledge/chat', { query })

      const answerText = typeof data.answer === 'string'
        ? data.answer
        : data.answer?.answer || JSON.stringify(data.answer)

      const botResponse: Message = {
        id: messages.length + 2,
        text: answerText,
        isUser: false,
        timestamp: new Date(),
        sources: data.sources,
      }

      setMessages(prev => [...prev, botResponse])
    } catch {
      const errorResponse: Message = {
        id: messages.length + 2,
        text: 'Sorry, I couldn\'t process your question right now. Please make sure knowledge base files have been uploaded, or try again later.',
        isUser: false,
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, errorResponse])
    } finally {
      setIsTyping(false)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handlePreviewDoc = async (filename: string) => {
    try {
      const data = await apiGet(`/knowledge/preview/${encodeURIComponent(filename)}`)
      if (data.success && data.data) {
        setPreviewDoc(data.data)
      }
    } catch {
      // silently fail
    }
  }

  return (
    <>
      {isOpen && (
        <div className="chatbot-overlay" onClick={() => setIsOpen(false)} />
      )}
      <div className={`chatbot-container ${isOpen ? 'open' : ''}`}>
        <div className="chatbot-header">
          <div className="chatbot-header-content">
            <div className="chatbot-avatar">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="currentColor" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="chatbot-header-text">
              <h3>ZenApp AI</h3>
              <p>Clinical Assistant</p>
            </div>
          </div>
          <button className="chatbot-close" onClick={() => setIsOpen(false)} aria-label="Close chatbot">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        <div className="chatbot-messages">
          {messages.length === 0 && (
            <div className="chatbot-welcome">
              <div className="chatbot-message bot">
                <div className="chatbot-message-avatar">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="currentColor"/>
                  </svg>
                </div>
                <div className="chatbot-message-content">
                  <p>Hello! How can I help you today?</p>
                </div>
              </div>
            </div>
          )}
          {messages.map((message) => (
            <div
              key={message.id}
              className={`chatbot-message ${message.isUser ? 'user' : 'bot'}`}
            >
              {!message.isUser && (
                <div className="chatbot-message-avatar">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="currentColor"/>
                  </svg>
                </div>
              )}
              <div className="chatbot-message-content">
                {message.isUser ? (
                  <p>{message.text}</p>
                ) : (
                  renderFormattedText(message.text)
                )}
                {!message.isUser && message.sources && message.sources.length > 0 && (
                  <div className="chatbot-citations">
                    <div className="chatbot-citations-label">Supporting Citations:</div>
                    {message.sources.slice(0, 3).map((s, i) => (
                      <button
                        key={i}
                        className="chatbot-citation-link"
                        onClick={() => handlePreviewDoc(s.filename)}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <polyline points="14,2 14,8 20,8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        {s.filename}
                      </button>
                    ))}
                  </div>
                )}
                <span className="chatbot-message-time">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="chatbot-message bot">
              <div className="chatbot-message-avatar">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="currentColor"/>
                </svg>
              </div>
              <div className="chatbot-message-content">
                <p style={{ color: '#94a3b8' }}>Searching knowledge base...</p>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="chatbot-input-container">
          <input
            ref={inputRef}
            type="text"
            className="chatbot-input"
            placeholder="Ask ZenApp AI"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            autoFocus={isOpen}
          />
          <button className="chatbot-send-btn" onClick={handleSendMessage} aria-label="Send message">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 19V5M12 5L5 12M12 5L19 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Document Preview Modal */}
      {previewDoc && (
        <div className="chatbot-preview-overlay" onClick={() => setPreviewDoc(null)}>
          <div className="chatbot-preview-panel" onClick={e => e.stopPropagation()}>
            <div className="chatbot-preview-header">
              <div>
                <h4>{previewDoc.filename}</h4>
                <span>{previewDoc.product_name}{previewDoc.category ? ` \u2022 ${previewDoc.category}` : ''}</span>
              </div>
              <button onClick={() => setPreviewDoc(null)} aria-label="Close preview">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
            <div className="chatbot-preview-body">
              <pre>{previewDoc.content}</pre>
            </div>
          </div>
        </div>
      )}

      <button
        className="chatbot-toggle"
        onClick={() => {
          setIsOpen(!isOpen)
          if (!isOpen) {
            setTimeout(() => inputRef.current?.focus(), 300)
          }
        }}
        aria-label="Open chatbot"
      >
        {isOpen ? (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </button>
    </>
  )
}

export default Chatbot
