import { useEffect, useState } from 'react'
import zenracLogo from '../assets//images/ZenApp.png'

interface SplashScreenProps {
  onComplete: () => void
}

function SplashScreen({ onComplete }: SplashScreenProps) {
  const [fadeOut, setFadeOut] = useState(false)

  useEffect(() => {
    // Start fade out after 2.5 seconds
    const fadeTimer = setTimeout(() => {
      setFadeOut(true)
    }, 2500)

    // Complete after fade out animation (0.5s)
    const completeTimer = setTimeout(() => {
      onComplete()
    }, 3000)

    return () => {
      clearTimeout(fadeTimer)
      clearTimeout(completeTimer)
    }
  }, [onComplete])

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-slate-900 transition-opacity duration-500 ${fadeOut ? 'opacity-0' : 'opacity-100'}`}>
      <div className="flex flex-col items-center gap-6">
        <div className="relative">
          <img src={zenracLogo} alt="ZenApp Logo" className="h-16" />
        </div>
        <div className="text-center">
          {/* <h1 className="text-2xl font-bold text-white">ZenApp</h1> */}
          <p className="text-sm text-slate-400 mt-1">Medical Representative App</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute rounded-full blur-3xl opacity-20 w-64 h-64 bg-indigo-500 -top-20 -left-20"></div>
        <div className="absolute rounded-full blur-3xl opacity-20 w-48 h-48 bg-violet-500 -bottom-10 -right-10"></div>
        <div className="absolute rounded-full blur-3xl opacity-20 w-32 h-32 bg-cyan-500 top-1/2 left-1/2"></div>
      </div>
    </div>
  )
}

export default SplashScreen
