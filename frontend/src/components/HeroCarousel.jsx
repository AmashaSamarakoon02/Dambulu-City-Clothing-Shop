import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';

const INTERVAL_MS = 6000;

// Full-width promotional slider: auto-advances, pauses on hover/focus,
// keyboard-accessible arrows and dots, and stays still for reduced-motion users.
const HeroCarousel = ({ slides }) => {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduceMotion = useRef(
    typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  );

  const go = useCallback((i) => setIndex((i + slides.length) % slides.length), [slides.length]);

  useEffect(() => {
    if (paused || reduceMotion.current || slides.length < 2) return undefined;
    const id = setInterval(() => setIndex((i) => (i + 1) % slides.length), INTERVAL_MS);
    return () => clearInterval(id);
  }, [paused, slides.length]);

  return (
    <section
      className="relative h-[82vh] min-h-[540px] max-h-[820px] pt-20 overflow-hidden bg-luxe-dark"
      aria-roledescription="carousel"
      aria-label="Featured collections"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      {slides.map((slide, i) => (
        <div
          key={slide.title}
          role="group"
          aria-roledescription="slide"
          aria-label={`${i + 1} of ${slides.length}: ${slide.title}`}
          aria-hidden={i !== index}
          inert={i !== index}
          className={`absolute inset-0 transition-opacity duration-1000 ${i === index ? 'opacity-100' : 'opacity-0'}`}
        >
          <img
            src={slide.image}
            alt=""
            className={`absolute inset-0 w-full h-full object-cover ${slide.position || 'object-center'} transition-transform duration-[7000ms] ${i === index && !reduceMotion.current ? 'scale-105' : 'scale-100'}`}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-black/10" />
          <div className="relative z-10 h-full shell flex flex-col justify-center items-start text-left pb-16">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur-sm border border-white/25 px-4 py-1.5 text-[10px] sm:text-[11px] uppercase tracking-[0.3em] text-white mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#e8c48a]" aria-hidden="true" />
              {slide.eyebrow}
            </span>
            <h2 className="text-4xl sm:text-5xl md:text-7xl font-semibold tracking-tight text-white max-w-3xl leading-[1.05] mb-5">
              {slide.title}
              {slide.highlight && (
                <span className="block bg-gradient-to-r from-[#e8c48a] via-[#f3dcb1] to-[#c98a4b] bg-clip-text text-transparent">{slide.highlight}</span>
              )}
            </h2>
            <p className="text-sm sm:text-base md:text-lg text-gray-100 max-w-xl font-light mb-8">{slide.text}</p>
            <div className="flex flex-wrap gap-3">
              <Link
                to={slide.cta.to}
                className="rounded-full bg-white text-black px-7 py-3.5 uppercase tracking-widest text-xs sm:text-sm font-semibold hover:bg-accent-soft transition-colors inline-flex items-center group shadow-lg shadow-black/20"
              >
                {slide.cta.label}
                <ArrowRight className="ml-2 h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
              </Link>
              {slide.secondary && (
                <Link
                  to={slide.secondary.to}
                  className="rounded-full border border-white/70 bg-white/10 backdrop-blur-sm text-white px-7 py-3.5 uppercase tracking-widest text-xs sm:text-sm font-semibold hover:bg-white hover:text-black transition-colors"
                >
                  {slide.secondary.label}
                </Link>
              )}
            </div>
          </div>
        </div>
      ))}

      {slides.length > 1 && (
        <>
          <button
            onClick={() => go(index - 1)}
            className="hidden sm:flex absolute right-[4.75rem] bottom-[4.5rem] sm:bottom-[5.25rem] z-20 w-11 h-11 rounded-full bg-white/15 hover:bg-white/30 border border-white/30 text-white items-center justify-center backdrop-blur-sm transition-colors"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => go(index + 1)}
            className="hidden sm:flex absolute right-6 bottom-[4.5rem] sm:bottom-[5.25rem] z-20 w-11 h-11 rounded-full bg-white/15 hover:bg-white/30 border border-white/30 text-white items-center justify-center backdrop-blur-sm transition-colors"
            aria-label="Next slide"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          <div className="absolute bottom-20 sm:bottom-24 inset-x-0 z-20 flex justify-center gap-2.5">
            {slides.map((slide, i) => (
              <button
                key={slide.title}
                onClick={() => go(i)}
                aria-label={`Show slide ${i + 1}: ${slide.title}`}
                aria-current={i === index}
                className={`h-1.5 rounded-full transition-all ${i === index ? 'w-8 bg-white' : 'w-3 bg-white/50 hover:bg-white/80'}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
};

export default HeroCarousel;
