import { useEffect, useRef, useState } from 'react';
import { PLACEHOLDER_IMAGE, handleImageError } from '../utils/placeholder.js';

/**
 * Image picker with drag-and-drop and live preview.
 * `file` is a newly chosen File; `existingUrl` is the image already saved (edit mode).
 */
export default function ImageUpload({ id, file, existingUrl, onSelect, onClear, error, describedBy }) {
  const inputRef = useRef(null);
  const [preview, setPreview] = useState('');
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    if (!file) {
      setPreview('');
      return undefined;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const shown = preview || existingUrl;

  const pick = (candidate) => {
    if (candidate) onSelect(candidate);
  };

  return (
    <div className="upload">
      <div
        className={`dropzone${dragging ? ' is-dragging' : ''}${error ? ' has-error' : ''}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          pick(e.dataTransfer.files?.[0]);
        }}
      >
        {shown ? (
          <img
            className="dropzone__preview"
            src={shown}
            alt={file ? 'Preview of the selected hotel image' : 'Current hotel image'}
            onError={handleImageError}
          />
        ) : (
          <img className="dropzone__preview dropzone__preview--empty" src={PLACEHOLDER_IMAGE} alt="" />
        )}

        <div className="dropzone__controls">
          <button
            id={id}
            type="button"
            className="btn btn--ghost btn--sm"
            onClick={() => inputRef.current?.click()}
            aria-describedby={describedBy}
          >
            {shown ? 'Replace image' : 'Choose image'}
          </button>
          {file && (
            <button type="button" className="btn btn--text btn--sm" onClick={onClear}>
              {existingUrl ? 'Keep current image' : 'Remove'}
            </button>
          )}
        </div>
        <p className="dropzone__hint">or drag a JPG, PNG, WEBP or GIF here (max 5 MB)</p>

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          hidden
          tabIndex={-1}
          onChange={(e) => {
            pick(e.target.files?.[0]);
            e.target.value = ''; // allow picking the same file again
          }}
        />
      </div>
    </div>
  );
}
