import { useState } from 'react'
import zenracLogo from '../assets//images/ZenApp.png'
import { useLanguage } from '../contexts/LanguageContext'
import { useAuth } from '../contexts/AuthContext'
import { BTN_PRIMARY, INPUT, LABEL } from '../styles/designSystem'

interface LoginProps {
  onLogin: () => void
}

function Login({ onLogin }: LoginProps) {
  const { t } = useLanguage()
  const { login } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    const result = await login(username, password)

    setIsLoading(false)

    if (result.success) {
      onLogin()
    } else {
      setError(result.error || 'Login failed')
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="flex justify-center mb-6">
          <img src={zenracLogo} alt="ZenApp Logo" className="h-10"/>
        </div>



        {error && <div className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-3 mb-4">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="username" className={LABEL}>Username</label>
            <input
              type="text"
              id="username"
              className={INPUT}
              placeholder="Enter username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="password" className={LABEL}>{t('password')}</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                className={INPUT}
                placeholder={t('password')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer bg-transparent border-none"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 text-slate-600">
              <input type="checkbox" />
              <span>{t('rememberMe')}</span>
            </label>
            <a href="#" className="text-indigo-600 hover:text-indigo-700 font-medium">{t('forgotPassword')}</a>
          </div>

          <button type="submit" className={`${BTN_PRIMARY} w-full justify-center py-3 text-base`} disabled={isLoading}>
            {isLoading ? (
              <span>Logging in...</span>
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>{t('login')}</span>
              </>
            )}
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
