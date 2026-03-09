import { useState } from 'react'
import zenracLogo from '../assets//images/ZenApp.png'
import { useLanguage } from '../contexts/LanguageContext'
import './Login.css'

interface LoginProps {
  onLogin: () => void
}

function Login({ onLogin }: LoginProps) {
  const { t } = useLanguage()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle login logic here
    console.log('Login attempt:', { email, password })
    // On successful login, call onLogin callback
    onLogin()
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="logo-container">
          <img src={zenracLogo} alt="ZenApp Logo" className="logo"/>
        </div>
        
        
        
        <form onSubmit={handleSubmit} className="login-form">
          <div className="input-group">
            <label htmlFor="email">{t('email')}</label>
            <input
              type="email"
              id="email"
              placeholder={t('email')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="password">{t('password')}</label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                placeholder={t('password')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          <div className="form-options">
            <label className="remember-me">
              <input type="checkbox" />
              <span>{t('rememberMe')}</span>
            </label>
            <a href="#" className="forgot-password">{t('forgotPassword')}</a>
          </div>

          <button type="submit" className="login-button">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>{t('login')}</span>
          </button>
        </form>

        {/* <div className="signup-link">
          <p>Don't have an account? <a href="#">Sign up</a></p>
        </div> */}
      </div>
    </div>
  )
}

export default Login

