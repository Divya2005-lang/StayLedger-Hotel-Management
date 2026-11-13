import { useCallback, useState } from 'react';

const EARTH_RADIUS_KM = 6371;
const rad = (deg) => (deg * Math.PI) / 180;

/** Great-circle distance between two points, in kilometres. */
export function distanceKm(a, b) {
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

export const formatDistance = (km) => (km < 10 ? `${km.toFixed(1)} km` : `${Math.round(km).toLocaleString('en-IN')} km`);

const ERROR_TEXT = {
  1: 'Location permission was denied.',
  2: 'Your position could not be determined.',
  3: 'Finding your position took too long.',
};

/** Wraps the browser Geolocation API: call locate() to request the user's position. */
export function useGeolocation() {
  const [state, setState] = useState({ status: 'idle', position: null, error: '' });

  const locate = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setState({ status: 'error', position: null, error: 'Geolocation is not supported in this browser.' });
      return;
    }
    setState((s) => ({ ...s, status: 'loading', error: '' }));
    navigator.geolocation.getCurrentPosition(
      ({ coords }) =>
        setState({ status: 'ready', position: { lat: coords.latitude, lng: coords.longitude }, error: '' }),
      (err) =>
        setState({ status: 'error', position: null, error: ERROR_TEXT[err.code] || 'Could not get your location.' }),
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 60_000 }
    );
  }, []);

  return { ...state, locate };
}
