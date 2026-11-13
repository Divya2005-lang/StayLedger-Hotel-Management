/** Builds [1, '…', 4, 5, 6, '…', 20] style lists. */
function pageItems(page, totalPages) {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
  const items = new Set([1, totalPages, page - 1, page, page + 1]);
  const sorted = [...items].filter((n) => n >= 1 && n <= totalPages).sort((a, b) => a - b);
  const out = [];
  sorted.forEach((n, i) => {
    if (i > 0 && n - sorted[i - 1] > 1) out.push(n - sorted[i - 1] === 2 ? n - 1 : '…');
    out.push(n);
  });
  return out;
}

export default function Pagination({ page, totalPages, onChange, disabled = false }) {
  if (totalPages <= 1) return null;
  const go = (n) => !disabled && n >= 1 && n <= totalPages && n !== page && onChange(n);

  return (
    <nav className="pagination" aria-label="Pagination">
      <button type="button" className="page-btn" onClick={() => go(page - 1)} disabled={disabled || page === 1}>
        <span aria-hidden="true">‹</span> Prev
      </button>
      <ul>
        {pageItems(page, totalPages).map((item, i) =>
          item === '…' ? (
            <li key={`gap-${i}`} className="page-gap" aria-hidden="true">
              …
            </li>
          ) : (
            <li key={item}>
              <button
                type="button"
                className={`page-btn${item === page ? ' is-active' : ''}`}
                aria-current={item === page ? 'page' : undefined}
                aria-label={`Page ${item}`}
                onClick={() => go(item)}
                disabled={disabled}
              >
                {item}
              </button>
            </li>
          )
        )}
      </ul>
      <button
        type="button"
        className="page-btn"
        onClick={() => go(page + 1)}
        disabled={disabled || page === totalPages}
      >
        Next <span aria-hidden="true">›</span>
      </button>
    </nav>
  );
}
