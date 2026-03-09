import { useState, useRef, useEffect } from 'react'
import { apiPost } from '../services/apiService'
import './Chatbot.css'

interface Message {
  id: number
  text: string
  isUser: boolean
  timestamp: Date
  sources?: { filename: string; category: string }[]
}

interface QuickQuestion {
  question: string
}

function Chatbot() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [showQuestions, setShowQuestions] = useState(true)
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const quickQuestions: QuickQuestion[] = [
    { question: 'What are the contraindications of Derise?' },
    { question: 'Compare Rilast Tablet vs Rilast Capsule' },
    { question: 'What clinical trials support Bevaas?' },
  ]

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
    setShowQuestions(false)
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
      setShowQuestions(true)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }

  const handleQuickQuestion = (question: string) => {
    setInputValue(question)
    setShowQuestions(false)
    setTimeout(() => handleSendMessage(), 100)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
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
                <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM13 17H11V15H13V17ZM13 13H11V7H13V13Z" fill="currentColor"/>
              </svg>
            </div>
            <div className="chatbot-header-text">
              <h3>ZenApp Assistant</h3>
              <p>Online</p>
            </div>
          </div>
          <button className="chatbot-close" onClick={() => setIsOpen(false)} aria-label="Close chatbot">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        <div className="chatbot-messages">
          {messages.length === 0 && showQuestions && (
            <div className="chatbot-welcome">
              <div className="chatbot-message bot">
                <div className="chatbot-message-avatar">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM13 17H11V15H13V17ZM13 13H11V7H13V13Z" fill="currentColor"/>
                  </svg>
                </div>
                <div className="chatbot-message-content">
                  <p>Hello! I'm your Clinical Assistant. Ask me about drug information, prescribing details, or clinical data from our knowledge base.</p>
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
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM13 17H11V15H13V17ZM13 13H11V7H13V13Z" fill="currentColor"/>
                  </svg>
                </div>
              )}
              <div className="chatbot-message-content">
                <p style={{ whiteSpace: 'pre-wrap' }}>{message.text}</p>
                {message.sources && message.sources.length > 0 && (
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                    Sources: {message.sources.map(s => s.filename).join(', ')}
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
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM13 17H11V15H13V17ZM13 13H11V7H13V13Z" fill="currentColor"/>
                </svg>
              </div>
              <div className="chatbot-message-content">
                <p style={{ color: '#94a3b8' }}>Searching knowledge base...</p>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {showQuestions && !isTyping && (
          <div className="chatbot-quick-questions">
            <p className="quick-questions-title">Quick Questions:</p>
            <div className="quick-questions-grid">
              {quickQuestions.map((q, index) => (
                <button
                  key={index}
                  className="quick-question-btn"
                  onClick={() => handleQuickQuestion(q.question)}
                >
                  {q.question}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="chatbot-input-container">
          <input
            ref={inputRef}
            type="text"
            className="chatbot-input"
            placeholder="Type your question..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            autoFocus={isOpen}
          />
          <button className="chatbot-send-btn" onClick={handleSendMessage} aria-label="Send message">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>

      <button
        className="chatbot-toggle"
        onClick={() => {
          setIsOpen(!isOpen)
          if (!isOpen) {
            setShowQuestions(true) // Show questions when opening
            setTimeout(() => {
              inputRef.current?.focus()
            }, 300)
          } else {
            setShowQuestions(false) // Hide questions when closing
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

