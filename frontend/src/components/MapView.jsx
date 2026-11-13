import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const TILES = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

// Custom CSS pins avoid Leaflet's default marker images, which bundlers tend to break.
const pin = (className) =>
  L.divIcon({ className: `map-pin ${className}`, html: '<span></span>', iconSize: [30, 38], iconAnchor: [15, 36] });

/** Interactive OpenStreetMap showing the hotel and, optionally, the visitor's own position. */
export default function MapView({ lat, lng, title, userPosition }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);

  useEffect(() => {
    const map = L.map(containerRef.current, { scrollWheelZoom: false }).setView([lat, lng], 14);
    L.tileLayer(TILES, { maxZoom: 19, attribution: ATTRIBUTION }).addTo(map);

    const label = document.createElement('strong');
    label.textContent = title; // textContent, never innerHTML: titles are user-supplied
    L.marker([lat, lng], { icon: pin('map-pin--hotel'), title, alt: title }).addTo(map).bindPopup(label);

    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [lat, lng, title]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !userPosition) return undefined;
    const marker = L.marker([userPosition.lat, userPosition.lng], {
      icon: pin('map-pin--user'),
      title: 'Your location',
      alt: 'Your location',
    }).addTo(map);
    map.fitBounds(
      L.latLngBounds([
        [lat, lng],
        [userPosition.lat, userPosition.lng],
      ]),
      { padding: [48, 48], maxZoom: 14 }
    );
    return () => {
      marker.remove();
    };
  }, [userPosition, lat, lng, title]);

  return (
    <div
      ref={containerRef}
      className="map"
      role="region"
      aria-label={`Map showing the location of ${title}`}
    />
  );
}
