import { Link } from 'react-router-dom';
import { imageUrl } from '../api/client.js';
import { formatCoord, formatPrice } from '../utils/format.js';
import { handleImageError, PLACEHOLDER_IMAGE } from '../utils/placeholder.js';

const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

/** Compact management row used on the Admin page: thumbnail, key facts and View / Edit / Delete. */
export default function AdminRow({ hotel, onDelete }) {
  const { id, title, price, latitude, longitude, imagePath, updatedAt } = hotel;
  return (
    <article className="admin-row">
      <img
        className="admin-row__thumb"
        src={imageUrl(imagePath) || PLACEHOLDER_IMAGE}
        alt={`Thumbnail of ${title}`}
        loading="lazy"
        onError={handleImageError}
      />
      <div className="admin-row__info">
        <h3>
          <Link to={`/hotels/${id}`}>{title}</Link>
        </h3>
        <p className="muted admin-row__meta">
          <span className="mono">{formatCoord(latitude)}, {formatCoord(longitude)}</span>
          <span>Updated {formatDate(updatedAt)}</span>
        </p>
      </div>
      <p className="price admin-row__price">{formatPrice(price)}</p>
      <div className="admin-row__actions">
        <Link className="btn btn--ghost btn--sm" to={`/hotels/${id}`} aria-label={`View ${title}`}>
          View
        </Link>
        <Link className="btn btn--ghost btn--sm" to={`/hotels/${id}/edit`} aria-label={`Edit ${title}`}>
          Edit
        </Link>
        <button type="button" className="btn btn--danger-ghost btn--sm" onClick={() => onDelete(hotel)} aria-label={`Delete ${title}`}>
          Delete
        </button>
      </div>
    </article>
  );
}
