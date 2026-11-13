// Mirrors the server-side rules in backend/src/utils/validate.js so users get instant feedback.
export const LIMITS = {
  titleMin: 3,
  titleMax: 120,
  descMin: 10,
  descMax: 2000,
  priceMax: 10_000_000,
  imageMb: 5,
};

export const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

const blank = (v) => v === undefined || v === null || String(v).trim() === '';

function coordinate(raw, label, min, max) {
  if (blank(raw)) return `${label} is required.`;
  const n = Number(raw);
  if (!Number.isFinite(n)) return `${label} must be a number.`;
  if (n < min || n > max) return `${label} must be between ${min} and ${max}.`;
  return '';
}

export function validateHotelFields(values, { hasImage }) {
  const errors = {};

  const title = String(values.title ?? '').trim();
  if (!title) errors.title = 'Title is required.';
  else if (title.length < LIMITS.titleMin) errors.title = `Title needs at least ${LIMITS.titleMin} characters.`;
  else if (title.length > LIMITS.titleMax) errors.title = `Title can be at most ${LIMITS.titleMax} characters.`;

  const description = String(values.description ?? '').trim();
  if (!description) errors.description = 'Description is required.';
  else if (description.length < LIMITS.descMin)
    errors.description = `Description needs at least ${LIMITS.descMin} characters.`;
  else if (description.length > LIMITS.descMax)
    errors.description = `Description can be at most ${LIMITS.descMax} characters.`;

  const lat = coordinate(values.latitude, 'Latitude', -90, 90);
  if (lat) errors.latitude = lat;
  const lng = coordinate(values.longitude, 'Longitude', -180, 180);
  if (lng) errors.longitude = lng;

  if (blank(values.price)) {
    errors.price = 'Price is required.';
  } else {
    const raw = String(values.price).trim();
    const n = Number(raw);
    if (!Number.isFinite(n)) errors.price = 'Price must be a number.';
    else if (n <= 0) errors.price = 'Price must be greater than zero.';
    else if (!/^\d+(\.\d{1,2})?$/.test(raw)) errors.price = 'Price can have at most 2 decimal places.';
    else if (n > LIMITS.priceMax) errors.price = 'Price is too large.';
  }

  if (!hasImage) errors.image = 'Please add an image of the hotel.';
  return errors;
}

export function validateImageFile(file) {
  if (!ACCEPTED_TYPES.includes(file.type)) return 'Use a JPG, PNG, WEBP or GIF image.';
  if (file.size > LIMITS.imageMb * 1024 * 1024) return `Image must be smaller than ${LIMITS.imageMb} MB.`;
  return '';
}
