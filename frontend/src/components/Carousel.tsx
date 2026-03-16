import { useState, useEffect } from 'react'
import './Carousel.css'

interface CarouselProps {
  slides: Array<{
    id: number
    title: string
    description: string
    image?: string
    backgroundColor?: string
    onClick?: () => void
    showButton?: boolean
    buttonText?: string
  }>
}

function Carousel({ slides }: CarouselProps) {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)

  useEffect(() => {
    if (!isAutoPlaying) return

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length)
    }, 5000) // Change slide every 5 seconds

    return () => clearInterval(interval)
  }, [isAutoPlaying, slides.length])

  const goToSlide = (index: number) => {
    setCurrentSlide(index)
    setIsAutoPlaying(false)
    // Resume auto-play after 10 seconds
    setTimeout(() => setIsAutoPlaying(true), 10000)
  }

  const goToPrevious = () => {
    const newIndex = currentSlide === 0 ? slides.length - 1 : currentSlide - 1
    goToSlide(newIndex)
  }

  const goToNext = () => {
    const newIndex = (currentSlide + 1) % slides.length
    goToSlide(newIndex)
  }

  return (
    <div className="carousel-container">
      <div className="carousel-wrapper">
        <button
          className="carousel-button carousel-button-prev"
          onClick={goToPrevious}
          aria-label="Previous slide"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        <div className="carousel-slides">
          {slides.map((slide, index) => (
            <div
              key={slide.id}
              className={`carousel-slide ${index === currentSlide ? 'active' : ''} ${slide.onClick && index === 0 ? 'clickable' : ''}`}
              style={{
                background: slide.backgroundColor || 'linear-gradient(135deg, #0A1A35 0%, #112347 50%, rgba(0,201,160,0.08) 100%)',
              }}
              onClick={slide.onClick && index === 0 && index === currentSlide ? slide.onClick : undefined}
            >
              {slide.image && (
                <div className="carousel-slide-bg-image">
                  <img src={slide.image} alt={slide.title} />
                </div>
              )}
              <div className="carousel-slide-content">
                <h2 className="carousel-slide-title">{slide.title}</h2>
                <p className="carousel-slide-description">{slide.description}</p>
                {slide.showButton && index === currentSlide && (
                  <button
                    className="carousel-action-button"
                    onClick={(e) => {
                      e.stopPropagation()
                      if (slide.onClick) {
                        slide.onClick()
                      }
                    }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M8 7V3M16 7V3M7 11H17M5 21H19C20.1046 21 21 20.1046 21 19V7C21 5.89543 20.1046 5 19 5H5C3.89543 5 3 5.89543 3 7V19C3 20.1046 3.89543 21 5 21Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span>{slide.buttonText || 'View Details'}</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <button
          className="carousel-button carousel-button-next"
          onClick={goToNext}
          aria-label="Next slide"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      <div className="carousel-dots">
        {slides.map((slide, index) => (
          <button
            key={slide.id}
            className={`carousel-dot ${index === currentSlide ? 'active' : ''}`}
            onClick={() => goToSlide(index)}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  )
}

export default Carousel

