const DECIMAL_2 = /^\d+(\.\d{1,2})?$/;

export const LIMITS = {
  titleMin: 3,
  titleMax: 120,
  descMin: 10,
  descMax: 2000,
  priceMax: 10_000_000,
};

const isBlank = (v) => v === undefined || v === null || String(v).trim() === '';

function toCoordinate(raw, label, min, max, errors, key) {
  if (isBlank(raw)) {
    errors[key] = `${label} is required.`;
    return undefined;
  }
  const n = Number(raw);
  if (!Number.isFinite(n)) {
    errors[key] = `${label} must be a number.`;
    return undefined;
  }
  if (n < min || n > max) {
    errors[key] = `${label} must be between ${min} and ${max}.`;
    return undefined;
  }
  return Math.round(n * 1e6) / 1e6;
}

/**
 * Validate and normalise the fields of a hotel payload.
 * `hasImage` tells us whether an image will exist after this operation
 * (a new upload, or an existing one being kept).
 */
export function validateHotel(body, { hasImage }) {
  const errors = {};
  const values = {};

  const title = isBlank(body.title) ? '' : String(body.title).trim().replace(/\s+/g, ' ');
  if (!title) errors.title = 'Title is required.';
  else if (title.length < LIMITS.titleMin)
    errors.title = `Title needs at least ${LIMITS.titleMin} characters.`;
  else if (title.length > LIMITS.titleMax)
    errors.title = `Title can be at most ${LIMITS.titleMax} characters.`;
  else values.title = title;

  const description = isBlank(body.description) ? '' : String(body.description).trim();
  if (!description) errors.description = 'Description is required.';
  else if (description.length < LIMITS.descMin)
    errors.description = `Description needs at least ${LIMITS.descMin} characters.`;
  else if (description.length > LIMITS.descMax)
    errors.description = `Description can be at most ${LIMITS.descMax} characters.`;
  else values.description = description;

  const latitude = toCoordinate(body.latitude, 'Latitude', -90, 90, errors, 'latitude');
  if (latitude !== undefined) values.latitude = latitude;

  const longitude = toCoordinate(body.longitude, 'Longitude', -180, 180, errors, 'longitude');
  if (longitude !== undefined) values.longitude = longitude;

  if (isBlank(body.price)) {
    errors.price = 'Price is required.';
  } else {
    const raw = String(body.price).trim();
    const n = Number(raw);
    if (!Number.isFinite(n)) errors.price = 'Price must be a number.';
    else if (n <= 0) errors.price = 'Price must be greater than zero.';
    else if (!DECIMAL_2.test(raw)) errors.price = 'Price can have at most 2 decimal places.';
    else if (n > LIMITS.priceMax)
      errors.price = `Price cannot exceed ${LIMITS.priceMax.toLocaleString('en-US')}.`;
    else values.price = n;
  }

  if (!hasImage) errors.image = 'An image is required.';

  return { errors, values, valid: Object.keys(errors).length === 0 };
}
