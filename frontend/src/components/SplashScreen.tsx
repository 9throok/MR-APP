import { useEffect, useState } from 'react'
import zenracLogo from '../assets//images/ZenApp.png'
import './SplashScreen.css'

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
    <div className={`splash-screen ${fadeOut ? 'fade-out' : ''}`}>
      <div className="splash-content">
        <div className="logo-wrapper">
          <img src={zenracLogo} alt="ZenX Global Logo" className="splash-logo" />
        </div>
        <div className="splash-text">
          {/* <h1 className="splash-title">ZenX Global</h1> */}
          <p className="splash-subtitle">Medical Representative App</p>
        </div>
        <div className="loading-indicator">
          <div className="loading-dot"></div>
          <div className="loading-dot"></div>
          <div className="loading-dot"></div>
        </div>
      </div>
      <div className="splash-background">
        <div className="gradient-orb orb-1"></div>
        <div className="gradient-orb orb-2"></div>
        <div className="gradient-orb orb-3"></div>
      </div>
    </div>
  )
}

export default SplashScreen


