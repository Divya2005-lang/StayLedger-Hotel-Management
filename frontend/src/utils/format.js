const CURRENCY = 'INR';
const LOCALE = 'en-IN';

const money = new Intl.NumberFormat(LOCALE, { style: 'currency', currency: CURRENCY, maximumFractionDigits: 0 });
const moneyExact = new Intl.NumberFormat(LOCALE, { style: 'currency', currency: CURRENCY, minimumFractionDigits: 2 });

export const formatPrice = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return '';
  return Number.isInteger(n) ? money.format(n) : moneyExact.format(n);
};

/** Shorten text to roughly `max` characters without cutting a word in half. */
export const snippet = (text = '', max = 140) => {
  const clean = String(text).replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[.,;:!?-]+$/, '')}…`;
};

export const formatCoord = (value) => Number(value).toFixed(4);

/** 13.05, 80.2824 -> "13.0500° N, 80.2824° E" */
export const formatLatLng = (lat, lng) => {
  const la = Number(lat);
  const lo = Number(lng);
  return `${Math.abs(la).toFixed(4)}° ${la >= 0 ? 'N' : 'S'}, ${Math.abs(lo).toFixed(4)}° ${lo >= 0 ? 'E' : 'W'}`;
};
