// @ts-ignore;
import React, { useState, useEffect } from 'react';
// @ts-ignore;
import { ChevronLeft, ChevronRight } from 'lucide-react';

export function Banner({
  banners
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  useEffect(() => {
    if (!isAutoPlaying || banners.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % banners.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [isAutoPlaying, banners.length]);
  const goToSlide = index => {
    setCurrentIndex(index);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };
  const goToPrev = () => {
    setCurrentIndex(prev => (prev - 1 + banners.length) % banners.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };
  const goToNext = () => {
    setCurrentIndex(prev => (prev + 1) % banners.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };
  if (!banners || banners.length === 0) {
    return <div className="relative w-full aspect-[16/9] bg-gradient-to-br from-primary-100 to-primary-200 rounded-2xl overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-primary-600 font-serif text-lg">精选推荐</span>
        </div>
      </div>;
  }
  return <div className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden group" onMouseEnter={() => setIsAutoPlaying(false)} onMouseLeave={() => setIsAutoPlaying(true)}>
      <div className="flex transition-transform duration-500 ease-out h-full" style={{
      transform: `translateX(-${currentIndex * 100}%)`
    }}>
        {banners.map((banner, index) => <div key={index} className="flex-shrink-0 w-full h-full relative">
            <img src={banner.image} alt={banner.title || `Banner ${index + 1}`} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-5">
              <h3 className="font-serif text-white text-xl font-semibold drop-shadow-lg">
                {banner.title}
              </h3>
              {banner.subtitle && <p className="text-white/80 text-sm mt-1 drop-shadow">{banner.subtitle}</p>}
            </div>
          </div>)}
      </div>

      {/* Navigation Arrows */}
      {banners.length > 1 && <>
          <button onClick={goToPrev} className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-white">
            <ChevronLeft className="w-4 h-4 text-stone-700" />
          </button>
          <button onClick={goToNext} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-white">
            <ChevronRight className="w-4 h-4 text-stone-700" />
          </button>
        </>}

      {/* Dots */}
      {banners.length > 1 && <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
          {banners.map((_, index) => <button key={index} onClick={() => goToSlide(index)} className={`w-2 h-2 rounded-full transition-all duration-300 ${index === currentIndex ? 'bg-white w-6' : 'bg-white/50 hover:bg-white/70'}`} />)}
        </div>}
    </div>;
}