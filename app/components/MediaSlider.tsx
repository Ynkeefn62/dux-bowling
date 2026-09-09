'use client';
import { useCallback, useEffect, useState } from 'react';

export type Slide = {
  src: string;
  name: string;
  blurb: string;
};

export default function MediaSlider({
  slides,
  label,
  idPrefix,
}: {
  slides: Slide[];
  label: string;
  idPrefix: string;
}) {
  const [i, setI] = useState(0);
  const n = slides.length;
  const go = useCallback((d: number) => setI((p) => (p + d + n) % n), [n]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') go(-1);
      if (e.key === 'ArrowRight') go(1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go]);

  const s = slides[i];

  return (
    <div className="slider" aria-roledescription="carousel" aria-label={label}>
      <div className="slider-stage">
        {s.src.endsWith('.mp4') ? (
          <video key={s.src} src={s.src} autoPlay loop muted playsInline aria-label={`${s.name}: ${s.blurb}`} />
        ) : (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img key={s.src} src={s.src} alt={`${s.name}: ${s.blurb}`} loading="lazy" />
        )}
        <button className="slider-arrow left" onClick={() => go(-1)} aria-label="Previous">
          &#8249;
        </button>
        <button className="slider-arrow right" onClick={() => go(1)} aria-label="Next">
          &#8250;
        </button>
      </div>

      <div className="slider-body">
        <div className="eyebrow">
          {label} · {i + 1} of {n}
        </div>
        <h3 className="stripe sub" style={{ marginTop: 6 }}>{s.name}</h3>
        <p className="lede" style={{ fontSize: 14 }}>{s.blurb}</p>
      </div>

      <div className="slider-dots" role="tablist">
        {slides.map((sl, k) => (
          <button
            key={`${idPrefix}-${sl.src}`}
            role="tab"
            aria-selected={k === i}
            aria-label={sl.name}
            data-on={k === i ? '1' : '0'}
            onClick={() => setI(k)}
          >
            {sl.name}
          </button>
        ))}
      </div>
    </div>
  );
}
