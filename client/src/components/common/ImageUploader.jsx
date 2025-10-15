import React, { useEffect, useRef, useState } from 'react';

// Reusable image uploader using the same CSS classes as business form
// Props:
// - multiple: boolean
// - files: File[] | string[] (for multiple)
// - file: File | string | null (for single)
// - label: string (button text)
// - onAdd(files: FileList): void
// - onRemove(index?: number): void

const ImageUploader = ({ multiple = false, files = [], file = null, label = 'בחרי תמונה', onAdd, onRemove }) => {
  const buildPreviewUrl = (item) => {
    if (!item) return null;
    if (typeof item === 'string') {
      // If server returned filename only, prefix with uploads path
      if (/^https?:\/\//i.test(item) || item.startsWith('/')) return item;
      return `${process.env.REACT_APP_API_DOMAIN || ''}/uploads/${item}`;
    }
    try {
      return URL.createObjectURL(item);
    } catch {
      return null;
    }
  };

  // Carousel state for multiple previews
  const [currentIndex, setCurrentIndex] = useState(0);
  const viewportRef = useRef(null);
  const [viewportWidth, setViewportWidth] = useState(0);
  useEffect(() => {
    setCurrentIndex(0);
  }, [Array.isArray(files) ? files.length : 0]);

  useEffect(() => {
    const measure = () => {
      if (viewportRef.current) {
        const rect = viewportRef.current.getBoundingClientRect();
        setViewportWidth(Math.max(120, Math.round(rect.width)));
      }
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  const handlePrev = () => {
    if (!Array.isArray(files) || files.length === 0) return;
    setCurrentIndex((idx) => (idx - 1 + files.length) % files.length);
  };

  const handleNext = () => {
    if (!Array.isArray(files) || files.length === 0) return;
    setCurrentIndex((idx) => (idx + 1) % files.length);
  };

  return (
    <div className="form-group-logo">
      <label className="button file-upload">
        {label}
        <input
          type="file"
          accept="image/*"
          multiple={!!multiple}
          onChange={(e) => onAdd && onAdd(e.target.files)}
          style={{ display: 'none' }}
        />
      </label>

      {multiple ? (
        <div style={{ position: 'relative', marginTop: 12 }}>
          {/* Main viewer (single image at a time) */}
          <div style={{ position: 'relative', width: '100%', maxWidth: 420, height: 260, margin: '0 auto', overflow: 'hidden', borderRadius: 12, background: '#f8f9fa' }}>
            {Array.isArray(files) && files.length > 0 ? (
              (() => {
                const f = files[currentIndex];
                const url = buildPreviewUrl(f);
                if (!url) return null;
                return (
                  <img
                    src={url}
                    alt={`preview-${currentIndex}`}
                    style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
                    onLoad={() => { if (typeof f !== 'string') URL.revokeObjectURL(url); }}
                  />
                );
              })()
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888' }}>אין תמונות</div>
            )}

            {/* Remove current */}
            {Array.isArray(files) && files.length > 0 && (
              <button
                className="remove-logo-button"
                onClick={(e) => { e.preventDefault(); onRemove && onRemove(currentIndex); setCurrentIndex((i) => Math.max(0, Math.min(i, (files.length - 2)))); }}
                title="הסר"
                aria-label={`הסר תמונה ${currentIndex + 1}`}
                style={{ right: 8, top: 8 }}
              >
                &times;
              </button>
            )}

            {/* Nav arrows */}
            {Array.isArray(files) && files.length > 1 && (
              <>
                <button type="button" aria-label="תמונה קודמת" onClick={handlePrev} className="category-arrow left" style={{ position: 'absolute', left: 8, top: '55%', transform: 'translateY(-50%)', width: 48, height: 48, fontSize: 22 }}>
                  ›
                </button>
                <button type="button" aria-label="תמונה הבאה" onClick={handleNext} className="category-arrow right" style={{ position: 'absolute', right: 8, top: '55%', transform: 'translateY(-50%)', width: 48, height: 48, fontSize: 22 }}>
                  ‹
                </button>
                <div style={{ position: 'absolute', left: '50%', bottom: 8, transform: 'translateX(-50%)', fontSize: 12, background: 'rgba(0,0,0,0.45)', color: '#fff', padding: '2px 8px', borderRadius: 12 }} aria-live="polite">
                  {currentIndex + 1}/{files.length}
                </div>
              </>
            )}
          </div>

          {/* Thumbnails row */}
          {Array.isArray(files) && files.length > 0 && (
            <div style={{ overflowX: 'auto', marginTop: 8 }}>
              <div style={{ display: 'flex', gap: 8, padding: '6px 0' }} role="listbox" aria-label="גלריית תמונות">
                {files.map((f, idx) => {
                  const url = buildPreviewUrl(f);
                  if (!url) return null;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setCurrentIndex(idx)}
                      aria-label={`תמונה ${idx + 1}`}
                      style={{ flex: '0 0 auto', width: 72, height: 72, border: currentIndex === idx ? '2px solid #2563eb' : '2px solid transparent', borderRadius: 8, padding: 0, overflow: 'hidden', background: 'transparent' }}
                    >
                      <img src={url} alt={`thumb-${idx}`} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ) : (
        (() => {
          const url = buildPreviewUrl(file);
          return url ? (
            <div className="logo-preview-wrapper" style={{ marginTop: 12 }}>
              <img
                src={url}
                alt="preview"
                className="business-logo-preview"
                onLoad={() => { if (file && typeof file !== 'string') URL.revokeObjectURL(url); }}
              />
              <button className="remove-logo-button" onClick={(e) => { e.preventDefault(); onRemove && onRemove(); }} title="הסר">
                &times;
              </button>
            </div>
          ) : null;
        })()
      )}
    </div>
  );
};

export default ImageUploader;


