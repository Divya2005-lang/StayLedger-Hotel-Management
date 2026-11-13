import { Link } from 'react-router-dom';
import { imageUrl } from '../api/client.js';
import { formatLatLng, formatPrice, snippet } from '../utils/format.js';
import { handleImageError, PLACEHOLDER_IMAGE } from '../utils/placeholder.js';

/**
 * One hotel in the list. The whole card opens the detail page through a stretched link on the title.
 * Edit and Delete appear only for the admin (`canManage`) and stay independently clickable above that link.
 */
export default function HotelCard({ hotel, canManage = false, onDelete }) {
  const { id, title, description, price, latitude, longitude, imagePath } = hotel;

  return (
    <article className="hotel-card">
      <div className="hotel-card__media">
        <img
          src={imageUrl(imagePath) || PLACEHOLDER_IMAGE}
          alt={`Photo of ${title}`}
          loading="lazy"
          onError={handleImageError}
        />
        <p className="hotel-card__tag">
          {formatPrice(price)} <span>/ night</span>
        </p>
      </div>

      <div className="hotel-card__body">
        <p className="hotel-card__coords">{formatLatLng(latitude, longitude)}</p>
        <h3 className="hotel-card__title">
          <Link className="hotel-card__link" to={`/hotels/${id}`}>
            {title}
          </Link>
        </h3>
        <p className="hotel-card__desc">{snippet(description, 150)}</p>

        <div className="hotel-card__foot">
          <span className="hotel-card__more" aria-hidden="true">
            View details →
          </span>
          {canManage && (
            <div className="hotel-card__actions">
              <Link className="btn btn--ghost btn--sm" to={`/hotels/${id}/edit`} aria-label={`Edit ${title}`}>
                Edit
              </Link>
              <button
                type="button"
                className="btn btn--danger-ghost btn--sm"
                onClick={() => onDelete(hotel)}
                aria-label={`Delete ${title}`}
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
