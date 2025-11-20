import React, { useEffect, useRef, useState } from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

// Reusable promo banner (story-like) used on MainPage and SearchResultPage
// Props:
// - images: string[] (absolute or server-relative)
// - autoPlayInterval?: number (ms)
// - onReady?: () => void (called once when first image loads)
const PromoBanner = ({ images = [], autoPlayInterval = 5000, onReady }) => {
  const [index, setIndex] = useState(0);
  const ref = useRef(null);
  const total = images.length;
  const readySignaledRef = useRef(false);

  // Resettable autoplay (resets on manual navigation)
  const timerRef = useRef(null);
  const schedule = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (total <= 1) return;
    timerRef.current = setTimeout(() => setIndex((i) => (i + 1) % total), autoPlayInterval);
  };
  useEffect(() => { schedule(); return () => { if (timerRef.current) clearTimeout(timerRef.current); }; }, [total, autoPlayInterval, index]);

  const prev = (e) => {
    if (e) e.stopPropagation();
    setIndex((i) => (i - 1 + total) % total);
    schedule();
  };
  const next = (e) => {
    if (e) e.stopPropagation();
    setIndex((i) => (i + 1) % total);
    schedule();
  };

  const handleClick = (e) => {
    if (!ref.current) return next();
    const rect = ref.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    if (x > rect.width / 2) next(); else prev();
  };

  if (!images || images.length === 0) return null;

  return (
    <div className="banner-container" ref={ref} onClick={handleClick} role="region" aria-label="promo banner">
      {images.map((src, i) => (
        <div key={`${src}-${i}`} className={`banner-slide ${i === index ? 'active' : ''}`}>
          <img
            src={src}
            alt="Promo"
            className="banner-image"
            onLoad={() => {
              if (!readySignaledRef.current) {
                readySignaledRef.current = true;
                if (typeof onReady === 'function') onReady();
              }
            }}
            onError={() => {
              if (!readySignaledRef.current) {
                readySignaledRef.current = true;
                if (typeof onReady === 'function') onReady();
              }
            }}
          />
        </div>
      ))}

      <div className="story-indicators">
        {images.map((_, i) => (
          <div
            key={`ind-${i}`}
            className={`story-indicator ${i === index ? 'active' : ''} ${i < index ? 'viewed' : ''}`}
            onClick={(e) => { e.stopPropagation(); setIndex(i); schedule(); }}
          >
            <div className="indicator-progress"></div>
          </div>
        ))}
      </div>

      {/* Use same classes as category arrows */}
      <button className="category-arrow left" onClick={prev} aria-label="previous">
        <FaChevronLeft />
      </button>
      <button className="category-arrow right" onClick={next} aria-label="next">
        <FaChevronRight />
      </button>
    </div>
  );
};

export default PromoBanner;


