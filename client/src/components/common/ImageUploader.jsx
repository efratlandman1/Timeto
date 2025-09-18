import React from 'react';

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
    if (typeof item === 'string') return item;
    try {
      return URL.createObjectURL(item);
    } catch {
      return null;
    }
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
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 12 }}>
          {Array.isArray(files) && files.map((f, idx) => {
            const url = buildPreviewUrl(f);
            if (!url) return null;
            return (
              <div className="logo-preview-wrapper" key={idx} style={{ width: 120, height: 120 }}>
                <img
                  src={url}
                  alt={`preview-${idx}`}
                  className="business-logo-preview"
                  onLoad={() => { if (typeof f !== 'string') URL.revokeObjectURL(url); }}
                />
                <button className="remove-logo-button" onClick={(e) => { e.preventDefault(); onRemove && onRemove(idx); }} title="הסר">
                  &times;
                </button>
              </div>
            );
          })}
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


