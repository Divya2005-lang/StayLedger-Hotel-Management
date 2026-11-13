const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 420">
<rect width="640" height="420" fill="#e9e3d6"/>
<path d="M230 290V190l90-60 90 60v100h-56v-64h-68v64z" fill="#c9c0ac"/>
<text x="320" y="350" text-anchor="middle" font-family="sans-serif" font-size="22" fill="#8b8270">No image available</text>
</svg>`;

export const PLACEHOLDER_IMAGE = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;

/** onError handler: swap a broken image for the placeholder, once. */
export function handleImageError(event) {
  const img = event.currentTarget;
  if (img.dataset.fallback) return;
  img.dataset.fallback = '1';
  img.src = PLACEHOLDER_IMAGE;
}
