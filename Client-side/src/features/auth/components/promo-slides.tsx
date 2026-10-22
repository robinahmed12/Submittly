'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

const SLIDES = [
  {
    title: 'Ship it. Submit it.',
    text: 'Send your project in under a minute — repository, live link and a short description.',
  },
  {
    title: 'Real feedback on real code.',
    text: 'Every submission is reviewed, so you know what to improve next.',
  },
  {
    title: 'Track every project in one place.',
    text: 'See status, results and notifications from a single dashboard.',
  },
];

const INTERVAL_MS = 6000;

/**
 * Promotional panel for the auth pages. Cycles through the slides, pauses
 * on hover/focus, and can be driven by the dots.
 */
export function PromoSlides() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => setActive(i => (i + 1) % SLIDES.length), INTERVAL_MS);
    return () => clearInterval(id);
  }, [paused]);

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Why Submittly"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className="bg-brand-900 relative hidden h-full flex-col justify-between overflow-hidden p-12 text-white lg:flex xl:p-16"
    >
      {/* Red glow, decorative only */}
      <div
        aria-hidden
        className="bg-brand-500/40 pointer-events-none absolute -right-32 -bottom-32 size-136 rounded-full blur-3xl"
      />
      <div
        aria-hidden
        className="from-brand-300 via-brand-500 to-brand-700 pointer-events-none absolute inset-y-0 left-0 w-1.5 bg-linear-to-b"
      />

      <p className="relative text-xl font-bold tracking-tight">Submittly</p>

      <div className="relative">
        <div className="grid">
          {SLIDES.map((slide, index) => (
            <div
              key={slide.title}
              role="group"
              aria-roledescription="slide"
              aria-label={`${index + 1} of ${SLIDES.length}`}
              aria-hidden={index !== active}
              className={cn(
                'col-start-1 row-start-1 transition-all duration-700 ease-out',
                index === active
                  ? 'translate-y-0 opacity-100'
                  : 'pointer-events-none translate-y-4 opacity-0',
              )}
            >
              <h2 className="font-heading text-5xl leading-[1.05] font-extrabold tracking-tight text-balance xl:text-7xl">
                {slide.title}
              </h2>
              <p className="mt-6 max-w-md text-lg leading-relaxed text-zinc-300">{slide.text}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="relative flex items-center gap-2">
        {SLIDES.map((slide, index) => (
          <button
            key={slide.title}
            type="button"
            aria-label={`Show slide ${index + 1}`}
            aria-current={index === active}
            onClick={() => setActive(index)}
            className={cn(
              'h-1.5 rounded-full transition-all focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none',
              index === active ? 'bg-brand-300 w-10' : 'w-4 bg-white/30 hover:bg-white/50',
            )}
          />
        ))}
      </div>
    </section>
  );
}
