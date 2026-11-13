import { Link } from 'react-router-dom';

export function Spinner({ label = 'Loading…' }) {
  return (
    <div className="center-state" role="status">
      <span className="spinner" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

export function CardSkeletons({ count = 3 }) {
  return (
    <ul className="card-list" aria-busy="true" aria-label="Loading hotels">
      {Array.from({ length: count }, (_, i) => (
        <li key={i} className="skeleton-card">
          <div className="skeleton skeleton--media" />
          <div className="skeleton-card__body">
            <div className="skeleton skeleton--line skeleton--w60" />
            <div className="skeleton skeleton--line" />
            <div className="skeleton skeleton--line skeleton--w80" />
            <div className="skeleton skeleton--line skeleton--w30" />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function EmptyState({ title, children, action }) {
  return (
    <div className="center-state center-state--box">
      <svg width="56" height="56" viewBox="0 0 56 56" aria-hidden="true">
        <rect width="56" height="56" rx="16" fill="var(--brand-soft)" />
        <path d="M14 40V24l14-9 14 9v16h-8V30H22v10z" fill="var(--brand)" />
      </svg>
      <h2>{title}</h2>
      {children && <p className="muted">{children}</p>}
      {action}
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="center-state center-state--box" role="alert">
      <h2>Something went wrong</h2>
      <p className="muted">{message}</p>
      {onRetry && (
        <button type="button" className="btn btn--primary" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}

export function NotFoundState({ title = 'We couldn’t find that page', message }) {
  return (
    <EmptyState
      title={title}
      action={
        <Link className="btn btn--primary" to="/">
          Back to all stays
        </Link>
      }
    >
      {message}
    </EmptyState>
  );
}
