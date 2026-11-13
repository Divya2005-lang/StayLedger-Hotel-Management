import { Helmet } from 'react-helmet-async';

const SITE = 'StayLedger';

const absolute = (url) => {
  if (!url) return undefined;
  try {
    return new URL(url, window.location.origin).href;
  } catch {
    return undefined;
  }
};

/** Dynamic <head> tags for each page: title, description, Open Graph, Twitter and optional JSON-LD. */
export default function Seo({ title, description, image, type = 'website', jsonLd, noIndex = false }) {
  const fullTitle = title ? `${title} · ${SITE}` : SITE;
  const img = absolute(image);
  const url = typeof window !== 'undefined' ? window.location.href : undefined;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      {description && <meta name="description" content={description} />}
      {noIndex && <meta name="robots" content="noindex" />}
      {url && <link rel="canonical" href={url} />}

      <meta property="og:site_name" content={SITE} />
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      {description && <meta property="og:description" content={description} />}
      {url && <meta property="og:url" content={url} />}
      {img && <meta property="og:image" content={img} />}

      <meta name="twitter:card" content={img ? 'summary_large_image' : 'summary'} />
      <meta name="twitter:title" content={fullTitle} />
      {description && <meta name="twitter:description" content={description} />}
      {img && <meta name="twitter:image" content={img} />}

      {jsonLd && (
        <script type="application/ld+json">{JSON.stringify(jsonLd).replace(/</g, '\\u003c')}</script>
      )}
    </Helmet>
  );
}
