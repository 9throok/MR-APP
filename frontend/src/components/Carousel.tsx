import { useState, useEffect } from 'react'

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
    <div className="relative overflow-hidden rounded-xl">
      <div className="relative">
        <button
          className="absolute top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-white hover:text-slate-900 transition-all cursor-pointer shadow-sm left-3"
          onClick={goToPrevious}
          aria-label="Previous slide"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        <div
          className="flex transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${currentSlide * 100}%)` }}
        >
          {slides.map((slide, index) => (
            <div
              key={slide.id}
              className={`w-full flex-shrink-0 relative ${slide.onClick && index === 0 ? 'cursor-pointer' : ''}`}
              style={{
                background: slide.backgroundColor || 'linear-gradient(135deg, #00C853 0%, #00B248 100%)',
              }}
              onClick={slide.onClick && index === 0 && index === currentSlide ? slide.onClick : undefined}
            >
              {slide.image && (
                <div className="absolute inset-0 bg-cover bg-center">
                  <img src={slide.image} alt={slide.title} />
                </div>
              )}
              <div className="relative z-10 flex flex-col items-start justify-end p-8 min-h-[300px]">
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent" />
                <h2 className="relative text-2xl font-bold text-white mb-2">{slide.title}</h2>
                <p className="relative text-sm text-slate-200 mb-4 max-w-md">{slide.description}</p>
                {slide.showButton && index === currentSlide && (
                  <button
                    className="relative inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
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
          className="absolute top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-white hover:text-slate-900 transition-all cursor-pointer shadow-sm right-3"
          onClick={goToNext}
          aria-label="Next slide"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      <div className="flex items-center justify-center gap-2 py-4">
        {slides.map((slide, index) => (
          <button
            key={slide.id}
            className={`h-2 rounded-full transition-all cursor-pointer ${index === currentSlide ? 'w-6 bg-indigo-600' : 'w-2 bg-slate-300'}`}
            onClick={() => goToSlide(index)}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  )
}

export default Carousel
