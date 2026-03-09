import { useState, useRef, useEffect } from 'react'
import './Chatbot.css'

interface Message {
  id: number
  text: string
  isUser: boolean
  timestamp: Date
}

interface FAQ {
  question: string
  answer: string
  keywords: string[]
}

function Chatbot() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [showQuestions, setShowQuestions] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const faqs: FAQ[] = [
    {
      question: 'How do I create a DCR?',
      answer: 'To create a DCR (Daily Call Report), go to Today\'s Plan page, select a doctor or pharmacy from your scheduled visits, and click the "DCR" button. Fill in the required details including samples distributed, products discussed, and any follow-up actions.',
      keywords: ['dcr', 'create', 'daily call report', 'how to'],
    },
    {
      question: 'What was my last discussion with Dr Anil Doshi?',
      answer: 'To view your last discussion with Dr Anil Doshi, go to the Clients page, select "Doctors" tab, find Dr Anil Doshi, and click "View Details". In the doctor\'s profile, you can see the visit history section which shows all your previous discussions, products discussed, samples given, and notes from your last visit. You can also check the DCR (Daily Call Report) section for detailed records of your conversations.',
      keywords: ['last discussion', 'dr anil doshi', 'anil doshi', 'previous visit', 'visit history', 'last conversation'],
    },
    {
      question: 'I\'ve meeting with Dr Rajesh Kumar. Which medicine should I present?',
      answer: 'For your meeting with Dr Rajesh Kumar, go to the Clients page, select "Doctors" tab, and view Dr Rajesh Kumar\'s details. Check his specialty (Orthopedic) and visit history to see which products were previously discussed. Based on his specialty and past interactions, you can present relevant medicines from the Samples page. You can also check the E-Detailing section for product presentations suitable for orthopedic specialists. Review his prescription patterns and preferences from previous visits to tailor your presentation.',
      keywords: ['dr rajesh kumar', 'rajesh kumar', 'which medicine', 'what medicine', 'present medicine', 'meeting', 'orthopedic'],
    },
  ]

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const findAnswer = (userInput: string): string => {
    const lowerInput = userInput.toLowerCase().trim()
    
    // Check for exact question match first
    const exactMatch = faqs.find(faq => 
      faq.question.toLowerCase() === lowerInput
    )
    if (exactMatch) return exactMatch.answer

    // Check for keyword matches
    const keywordMatch = faqs.find(faq =>
      faq.keywords.some(keyword => lowerInput.includes(keyword))
    )
    if (keywordMatch) return keywordMatch.answer

    // Default response
    return 'I\'m here to help with questions about zenApp. You can ask me about:\n\n• Creating DCRs\n• Managing tour plans\n• Viewing doctor details\n• Distributing samples\n• Expense claims\n• Reports and analytics\n• Leave applications\n• E-Detailing\n• Performance tracking\n• Profile management\n\nTry asking: "How do I create a DCR?" or "What is E-Detailing?"'
  }

  const handleSendMessage = () => {
    if (!inputValue.trim()) return

    const userMessage: Message = {
      id: messages.length + 1,
      text: inputValue,
      isUser: true,
      timestamp: new Date(),
    }

    const botResponse: Message = {
      id: messages.length + 2,
      text: findAnswer(inputValue),
      isUser: false,
      timestamp: new Date(),
    }

    setMessages([...messages, userMessage, botResponse])
    setInputValue('')
    setShowQuestions(false) // Hide questions when message is sent
    
    // Show questions again after answer is displayed
    setTimeout(() => {
      setShowQuestions(true)
    }, 500)
    
    // Focus input after sending message to allow continuous questions
    setTimeout(() => {
      inputRef.current?.focus()
    }, 100)
  }

  const handleQuickQuestion = (question: string) => {
    setInputValue(question)
    setShowQuestions(false) // Hide questions immediately when clicked
    setTimeout(() => {
      handleSendMessage()
    }, 100)
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
                  <p>Hello! I'm your ZenApp assistant. How can I help you today?</p>
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
                <p>{message.text}</p>
                <span className="chatbot-message-time">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {showQuestions && (
          <div className="chatbot-quick-questions">
            <p className="quick-questions-title">Quick Questions:</p>
            <div className="quick-questions-grid">
              {faqs.map((faq, index) => (
                <button
                  key={index}
                  className="quick-question-btn"
                  onClick={() => handleQuickQuestion(faq.question)}
                >
                  {faq.question}
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

