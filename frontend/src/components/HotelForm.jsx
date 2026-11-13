import { useMemo, useState } from 'react';
import { imageUrl } from '../api/client.js';
import { validateHotelFields, validateImageFile, LIMITS } from '../utils/validators.js';
import ImageUpload from './ImageUpload.jsx';

const EMPTY = { title: '', description: '', latitude: '', longitude: '', price: '' };
const FIELD_ORDER = ['image', 'title', 'description', 'latitude', 'longitude', 'price'];

const toFormValues = (hotel) =>
  hotel
    ? {
        title: hotel.title,
        description: hotel.description,
        latitude: String(hotel.latitude),
        longitude: String(hotel.longitude),
        price: String(hotel.price),
      }
    : EMPTY;

/**
 * One form for both creating and editing a hotel.
 *  - mode: 'create' | 'edit'
 *  - hotel: existing record (edit mode)
 *  - onSubmit(formData): returns a promise; reject with { message, errors } to show server errors
 */
export default function HotelForm({ mode = 'create', hotel, onSubmit, onCancel, submitting }) {
  const [values, setValues] = useState(() => toFormValues(hotel));
  const [file, setFile] = useState(null);
  const [imageProblem, setImageProblem] = useState('');
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [remote, setRemote] = useState({});
  const [formError, setFormError] = useState('');
  const [geo, setGeo] = useState({ status: 'idle', message: '' });

  const existingUrl = hotel?.imagePath ? imageUrl(hotel.imagePath) : '';
  const errors = useMemo(
    () => validateHotelFields(values, { hasImage: Boolean(file || existingUrl) }),
    [values, file, existingUrl]
  );

  const visible = (name) => {
    const local = touched[name] || submitted ? errors[name] : '';
    return local || remote[name] || (name === 'image' ? imageProblem : '') || '';
  };

  const change = (name) => (e) => {
    setValues((v) => ({ ...v, [name]: e.target.value }));
    setRemote((r) => (r[name] ? { ...r, [name]: undefined } : r));
  };
  const blur = (name) => () => setTouched((t) => ({ ...t, [name]: true }));

  const chooseImage = (candidate) => {
    const problem = validateImageFile(candidate);
    setImageProblem(problem);
    setRemote((r) => ({ ...r, image: undefined }));
    if (!problem) setFile(candidate);
  };
  const clearImage = () => {
    setFile(null);
    setImageProblem('');
  };

  const useMyLocation = () => {
    if (!('geolocation' in navigator)) {
      setGeo({ status: 'error', message: 'Geolocation is not supported in this browser.' });
      return;
    }
    setGeo({ status: 'loading', message: '' });
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setValues((v) => ({
          ...v,
          latitude: coords.latitude.toFixed(6),
          longitude: coords.longitude.toFixed(6),
        }));
        setTouched((t) => ({ ...t, latitude: true, longitude: true }));
        setGeo({ status: 'idle', message: '' });
      },
      (err) =>
        setGeo({
          status: 'error',
          message: err.code === 1 ? 'Location permission was denied.' : 'Could not get your location.',
        }),
      { timeout: 10_000 }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitted(true);
    setFormError('');

    const firstBad = FIELD_ORDER.find((name) => errors[name]);
    if (firstBad) {
      document.getElementById(`field-${firstBad}`)?.focus();
      return;
    }

    const data = new FormData();
    data.append('title', values.title.trim());
    data.append('description', values.description.trim());
    data.append('latitude', values.latitude.trim());
    data.append('longitude', values.longitude.trim());
    data.append('price', values.price.trim());
    if (file) data.append('image', file);

    try {
      await onSubmit(data);
    } catch (err) {
      setRemote(err?.errors || {});
      setFormError(err?.message || 'Could not save the hotel. Please try again.');
      const bad = FIELD_ORDER.find((name) => err?.errors?.[name]);
      if (bad) document.getElementById(`field-${bad}`)?.focus();
    }
  };

  const textField = (name, label, props = {}) => {
    const error = visible(name);
    return (
      <div className={`field${error ? ' has-error' : ''}`}>
        <label htmlFor={`field-${name}`}>{label}</label>
        <input
          id={`field-${name}`}
          name={name}
          value={values[name]}
          onChange={change(name)}
          onBlur={blur(name)}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `error-${name}` : undefined}
          {...props}
        />
        {error && (
          <p id={`error-${name}`} className="field-error">
            {error}
          </p>
        )}
      </div>
    );
  };

  const descError = visible('description');
  const imageError = visible('image');
  const isEdit = mode === 'edit';

  return (
    <form className="hotel-form" onSubmit={handleSubmit} noValidate>
      {formError && (
        <div className="banner banner--error" role="alert">
          {formError}
        </div>
      )}

      <div className={`field${imageError ? ' has-error' : ''}`}>
        <span className="field__label" id="label-image">
          Hotel image
        </span>
        <ImageUpload
          id="field-image"
          file={file}
          existingUrl={existingUrl}
          onSelect={chooseImage}
          onClear={clearImage}
          error={imageError}
          describedBy={imageError ? 'error-image' : 'label-image'}
        />
        {imageError && (
          <p id="error-image" className="field-error">
            {imageError}
          </p>
        )}
      </div>

      {textField('title', 'Title', { type: 'text', maxLength: LIMITS.titleMax, placeholder: 'e.g. Lakeview Palace Suites' })}

      <div className={`field${descError ? ' has-error' : ''}`}>
        <label htmlFor="field-description">Description</label>
        <textarea
          id="field-description"
          name="description"
          rows={5}
          maxLength={LIMITS.descMax}
          value={values.description}
          onChange={change('description')}
          onBlur={blur('description')}
          aria-invalid={Boolean(descError)}
          aria-describedby={descError ? 'error-description' : 'hint-description'}
          placeholder="What makes this stay special?"
        />
        <div className="field__meta">
          {descError ? (
            <p id="error-description" className="field-error">
              {descError}
            </p>
          ) : (
            <p id="hint-description" className="hint">
              At least {LIMITS.descMin} characters.
            </p>
          )}
          <span className="hint">
            {values.description.length}/{LIMITS.descMax}
          </span>
        </div>
      </div>

      <fieldset className="fieldset">
        <legend>Location</legend>
        <div className="grid-2">
          {textField('latitude', 'Latitude', { type: 'number', step: 'any', inputMode: 'decimal', placeholder: '13.0827' })}
          {textField('longitude', 'Longitude', { type: 'number', step: 'any', inputMode: 'decimal', placeholder: '80.2707' })}
        </div>
        <div className="geo-row">
          <button type="button" className="btn btn--text btn--sm" onClick={useMyLocation} disabled={geo.status === 'loading'}>
            {geo.status === 'loading' ? 'Finding you…' : 'Use my current location'}
          </button>
          {geo.message && (
            <span className="field-error" role="alert">
              {geo.message}
            </span>
          )}
        </div>
      </fieldset>

      {textField('price', 'Price per night (₹)', {
        type: 'number',
        step: '0.01',
        min: '0',
        inputMode: 'decimal',
        placeholder: '4500',
      })}

      <div className="form-actions">
        <button type="button" className="btn btn--ghost" onClick={onCancel} disabled={submitting}>
          Cancel
        </button>
        <button type="submit" className="btn btn--primary" disabled={submitting}>
          {submitting ? 'Saving…' : isEdit ? 'Save changes' : 'Add hotel'}
        </button>
      </div>
    </form>
  );
}
