import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { clearCurrent, deleteHotel, fetchHotelById } from '../store/hotelsSlice.js';
import { selectIsAdmin } from '../store/authSlice.js';
import { showNotice } from '../store/uiSlice.js';
import { imageUrl } from '../api/client.js';
import { formatCoord, formatPrice, snippet } from '../utils/format.js';
import { distanceKm, formatDistance, useGeolocation } from '../utils/geo.js';
import { handleImageError, PLACEHOLDER_IMAGE } from '../utils/placeholder.js';
import Seo from '../components/Seo.jsx';
import MapView from '../components/MapView.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import { NotFoundState, Spinner, ErrorState } from '../components/StateViews.jsx';

export default function HotelDetailPage() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { current, currentStatus, currentError, deleting } = useSelector((state) => state.hotels);
  const isAdmin = useSelector(selectIsAdmin);
  const geo = useGeolocation();
  const [confirming, setConfirming] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    dispatch(fetchHotelById(id));
    return () => {
      dispatch(clearCurrent());
    };
  }, [dispatch, id]);

  if (currentStatus === 'failed') {
    return currentError?.status === 404 || currentError?.status === 400 ? (
      <>
        <Seo title="Hotel not found" noIndex />
        <NotFoundState title="Hotel not found" message="It may have been deleted, or the link is wrong." />
      </>
    ) : (
      <ErrorState message={currentError?.message} onRetry={() => dispatch(fetchHotelById(id))} />
    );
  }

  if (!current || String(current.id) !== String(id)) return <Spinner label="Loading hotel…" />;

  const hotel = current;
  const picture = imageUrl(hotel.imagePath);
  const distance = geo.position
    ? distanceKm(geo.position, { lat: hotel.latitude, lng: hotel.longitude })
    : null;

  const confirmDelete = async () => {
    try {
      await dispatch(deleteHotel(hotel.id)).unwrap();
      dispatch(showNotice({ title: 'Hotel deleted', message: `“${hotel.title}” has been removed.` }));
      navigate('/', { replace: true });
    } catch (err) {
      setDeleteError(err?.message || 'Could not delete this hotel.');
    }
  };

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Hotel',
    name: hotel.title,
    description: hotel.description,
    image: picture ? new URL(picture, window.location.origin).href : undefined,
    priceRange: formatPrice(hotel.price),
    geo: { '@type': 'GeoCoordinates', latitude: hotel.latitude, longitude: hotel.longitude },
  };

  return (
    <>
      <Seo
        title={hotel.title}
        description={snippet(hotel.description, 155)}
        image={picture}
        type="article"
        jsonLd={jsonLd}
      />

      <nav className="crumbs" aria-label="Breadcrumb">
        <Link to="/">All stays</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{hotel.title}</span>
      </nav>

      <article className="detail">
        <div className="detail__hero">
          <img
            src={picture || PLACEHOLDER_IMAGE}
            alt={`Photo of ${hotel.title}`}
            onError={handleImageError}
          />
        </div>

        <div className="detail__main">
          <header className="detail__head">
            <div>
              <h1>{hotel.title}</h1>
              <p className="price price--lg">
                {formatPrice(hotel.price)} <span>per night</span>
              </p>
            </div>
            {isAdmin && (
              <div className="detail__actions">
                <Link to={`/hotels/${hotel.id}/edit`} className="btn btn--ghost">
                  Edit
                </Link>
                <button type="button" className="btn btn--danger-ghost" onClick={() => setConfirming(true)}>
                  Delete
                </button>
              </div>
            )}
          </header>

          <section aria-labelledby="about-h">
            <h2 id="about-h">About this stay</h2>
            <p className="detail__text">{hotel.description}</p>
          </section>

          <section aria-labelledby="where-h">
            <h2 id="where-h">Location</h2>
            <p className="muted">
              Coordinates: {formatCoord(hotel.latitude)}, {formatCoord(hotel.longitude)}
            </p>
            <MapView
              lat={hotel.latitude}
              lng={hotel.longitude}
              title={hotel.title}
              userPosition={geo.position}
            />
            <div className="geo-row">
              <button
                type="button"
                className="btn btn--ghost btn--sm"
                onClick={geo.locate}
                disabled={geo.status === 'loading'}
              >
                {geo.status === 'loading' ? 'Locating…' : distance === null ? 'How far is this from me?' : 'Update my location'}
              </button>
              {distance !== null && (
                <span aria-live="polite">
                  About <strong>{formatDistance(distance)}</strong> from you (straight line)
                </span>
              )}
              {geo.error && (
                <span className="field-error" role="alert">
                  {geo.error}
                </span>
              )}
            </div>
          </section>
        </div>
      </article>

      <ConfirmDialog
        open={confirming}
        title="Delete this hotel?"
        confirmLabel="Delete hotel"
        busy={deleting}
        onConfirm={confirmDelete}
        onCancel={() => {
          setConfirming(false);
          setDeleteError('');
        }}
      >
        <p>
          <strong>{hotel.title}</strong> and its image will be permanently removed.
        </p>
        {deleteError && (
          <p className="field-error" role="alert">
            {deleteError}
          </p>
        )}
      </ConfirmDialog>
    </>
  );
}
