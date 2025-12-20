import React, { useEffect, useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Quote } from 'lucide-react';
import { FANCY_FONT } from '@/utils/ui/uiConstants';

interface ReviewsCarouselProps {
  className?: string;
}

const REVIEW_IMAGES = [
  '/carousel/1.webp',
  '/carousel/2.webp',
  '/carousel/3.webp',
  '/carousel/4.webp',
  '/carousel/5.webp',
  '/carousel/6.webp',
  '/carousel/7.webp',
  '/carousel/8.webp',
  '/carousel/9.webp',
];

export const ReviewsCarousel: React.FC<ReviewsCarouselProps> = ({ className = '' }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const goToSlide = useCallback((index: number) => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex(index);
    setTimeout(() => setIsTransitioning(false), 500);
  }, [isTransitioning]);

  const goNext = useCallback(() => {
    goToSlide((currentIndex + 1) % REVIEW_IMAGES.length);
  }, [currentIndex, goToSlide]);

  const goPrev = useCallback(() => {
    goToSlide((currentIndex - 1 + REVIEW_IMAGES.length) % REVIEW_IMAGES.length);
  }, [currentIndex, goToSlide]);

  // Auto-scroll effect
  useEffect(() => {
    if (!isAutoPlaying) return;
    
    const interval = setInterval(() => {
      if (!isTransitioning) {
        setCurrentIndex((prev) => (prev + 1) % REVIEW_IMAGES.length);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, isTransitioning]);

  const handleManualNav = (index: number) => {
    goToSlide(index);
    setIsAutoPlaying(false);
    // Resume auto-play after 15 seconds
    setTimeout(() => setIsAutoPlaying(true), 15000);
  };

  return (
    <div className={`relative ${className}`}>
      {/* Section Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-6">
          <Quote className="w-4 h-4 text-emerald-400" />
          <span className="text-sm font-medium text-emerald-300">Community Feedback</span>
        </div>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
          Loved by <span className="text-emerald-400" style={FANCY_FONT}>Lifters</span> Worldwide
        </h2>
        <p className="text-lg text-slate-400 max-w-2xl mx-auto">
          See what the fitness community is saying about LiftShift on Reddit
        </p>
      </div>

      {/* Carousel Container */}
      <div 
        className="relative overflow-hidden rounded-2xl bg-black/30 border border-slate-800/50"
        onMouseEnter={() => setIsAutoPlaying(false)}
        onMouseLeave={() => setIsAutoPlaying(true)}
      >
        {/* Main Image Display */}
        <div className="relative aspect-[16/10] sm:aspect-[16/9] lg:aspect-[21/9] overflow-hidden">
          {REVIEW_IMAGES.map((src, index) => (
            <div
              key={src}
              className={`absolute inset-0 flex items-center justify-center p-4 sm:p-8 transition-all duration-500 ease-out ${
                index === currentIndex 
                  ? 'opacity-100 scale-100 z-10' 
                  : 'opacity-0 scale-95 z-0'
              }`}
              style={{ 
                transform: index === currentIndex ? 'scale(1)' : 'scale(0.95)',
                pointerEvents: index === currentIndex ? 'auto' : 'none'
              }}
            >
              <img
                src={src}
                alt={`Reddit user review ${index + 1}`}
                className="max-w-full max-h-full object-contain rounded-xl shadow-2xl shadow-black/50"
                loading={index < 3 ? 'eager' : 'lazy'}
                draggable={false}
              />
            </div>
          ))}
          
          {/* Gradient Overlays */}
          <div className="absolute inset-y-0 left-0 w-12 sm:w-20 bg-gradient-to-r from-black/40 to-transparent pointer-events-none z-20" />
          <div className="absolute inset-y-0 right-0 w-12 sm:w-20 bg-gradient-to-l from-black/40 to-transparent pointer-events-none z-20" />
        </div>

        {/* Navigation Arrows */}
        <button
          onClick={() => handleManualNav((currentIndex - 1 + REVIEW_IMAGES.length) % REVIEW_IMAGES.length)}
          className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-30 p-2 sm:p-3 rounded-full bg-black/70 backdrop-blur-md border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 hover:border-emerald-400/50 transition-all"
          aria-label="Previous review"
        >
          <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
        <button
          onClick={() => handleManualNav((currentIndex + 1) % REVIEW_IMAGES.length)}
          className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-30 p-2 sm:p-3 rounded-full bg-black/70 backdrop-blur-md border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 hover:border-emerald-400/50 transition-all"
          aria-label="Next review"
        >
          <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
      </div>

      {/* Dot Indicators */}
      <div className="flex items-center justify-center gap-2 mt-6">
        {REVIEW_IMAGES.map((_, index) => (
          <button
            key={index}
            onClick={() => handleManualNav(index)}
            className={`transition-all duration-300 rounded-full ${
              index === currentIndex 
                ? 'w-8 h-2 bg-emerald-400' 
                : 'w-2 h-2 bg-slate-600 hover:bg-slate-500'
            }`}
            aria-label={`Go to review ${index + 1}`}
            aria-current={index === currentIndex ? 'true' : 'false'}
          />
        ))}
      </div>

      {/* Reddit Attribution */}
      <div className="text-center mt-6 mb-4 ">
        <a 
          href="https://reddit.com/r/hevy" 
          target="_blank" 
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-emerald-400 transition-colors"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/>
          </svg>
          <span>From r/hevy community</span>
        </a>
      </div>
    </div>
  );
};

export default ReviewsCarousel;
