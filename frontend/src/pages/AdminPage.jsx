import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  deleteHotel,
  fetchHotels,
  fetchStats,
  resetFilters,
  setFilters,
  setPage,
} from '../store/hotelsSlice.js';
import { showNotice } from '../store/uiSlice.js';
import Seo from '../components/Seo.jsx';
import FilterBar from '../components/FilterBar.jsx';
import AdminRow from '../components/AdminRow.jsx';
import Pagination from '../components/Pagination.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import { CardSkeletons, EmptyState, ErrorState } from '../components/StateViews.jsx';
import { formatPrice } from '../utils/format.js';

function StatTile({ label, value }) {
  return (
    <div className="stat">
      <p className="stat__label">{label}</p>
      <p className="stat__value">{value}</p>
    </div>
  );
}

/** Admin dashboard: summary figures plus a manage list with Add / View / Edit / Delete. */
export default function AdminPage() {
  const dispatch = useDispatch();
  const { items, total, listStatus, listError, filters, page, pageSize, deleting, stats } = useSelector(
    (state) => state.hotels
  );
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    dispatch(fetchHotels());
  }, [dispatch, filters, page, pageSize]);

  useEffect(() => {
    dispatch(fetchStats());
  }, [dispatch]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const hasFilters = Boolean(filters.search || filters.minPrice || filters.maxPrice);

  useEffect(() => {
    if (listStatus === 'succeeded' && page > totalPages) dispatch(setPage(totalPages));
  }, [listStatus, page, totalPages, dispatch]);

  const closeDialog = useCallback(() => {
    setPendingDelete(null);
    setDeleteError('');
  }, []);

  const confirmDelete = async () => {
    try {
      await dispatch(deleteHotel(pendingDelete.id)).unwrap();
      dispatch(showNotice({ title: 'Hotel deleted', message: `“${pendingDelete.title}” has been removed.` }));
      closeDialog();
      dispatch(fetchHotels());
      dispatch(fetchStats());
    } catch (err) {
      if (err?.status === 404) {
        closeDialog();
        dispatch(fetchHotels());
        dispatch(fetchStats());
      } else {
        setDeleteError(err?.message || 'Could not delete this hotel.');
      }
    }
  };

  return (
    <>
      <Seo title="Admin" description="Manage hotel listings: add, edit and delete." noIndex />

      <section className="page-head">
        <div>
          <h1>Admin</h1>
          <p className="muted">Manage every hotel listing in one place.</p>
        </div>
        <Link to="/hotels/new" className="btn btn--primary">
          + Add hotel
        </Link>
      </section>

      <section className="stats" aria-label="Summary">
        <StatTile label="Total hotels" value={stats ? stats.total : '–'} />
        <StatTile label="Average price" value={stats && stats.total ? formatPrice(stats.avgPrice) : '–'} />
        <StatTile label="Lowest price" value={stats && stats.total ? formatPrice(stats.minPrice) : '–'} />
        <StatTile label="Highest price" value={stats && stats.total ? formatPrice(stats.maxPrice) : '–'} />
      </section>

      <FilterBar
        values={filters}
        onChange={(patch) => dispatch(setFilters(patch))}
        onReset={() => dispatch(resetFilters())}
      />

      <div className="results-meta" aria-live="polite">
        {listStatus === 'succeeded' && (total === 0 ? 'No hotels found' : `${total} ${total === 1 ? 'hotel' : 'hotels'} listed`)}
      </div>

      {listStatus === 'loading' && items.length === 0 && <CardSkeletons count={3} />}
      {listStatus === 'failed' && <ErrorState message={listError} onRetry={() => dispatch(fetchHotels())} />}

      {listStatus === 'succeeded' && total === 0 && (
        <EmptyState
          title={hasFilters ? 'No hotels match your filters' : 'No hotels yet'}
          action={
            hasFilters ? (
              <button type="button" className="btn btn--primary" onClick={() => dispatch(resetFilters())}>
                Clear filters
              </button>
            ) : (
              <Link to="/hotels/new" className="btn btn--primary">
                Add the first hotel
              </Link>
            )
          }
        >
          {hasFilters ? 'Try a different name or widen the price range.' : 'Add a hotel to get started.'}
        </EmptyState>
      )}

      {items.length > 0 && listStatus !== 'failed' && (
        <ul className={`admin-list${listStatus === 'loading' ? ' is-refreshing' : ''}`}>
          {items.map((hotel) => (
            <li key={hotel.id}>
              <AdminRow hotel={hotel} onDelete={setPendingDelete} />
            </li>
          ))}
        </ul>
      )}

      <Pagination
        page={page}
        totalPages={totalPages}
        disabled={listStatus === 'loading'}
        onChange={(n) => dispatch(setPage(n))}
      />

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete this hotel?"
        confirmLabel="Delete hotel"
        busy={deleting}
        onConfirm={confirmDelete}
        onCancel={closeDialog}
      >
        <p>
          <strong>{pendingDelete?.title}</strong> and its image will be permanently removed.
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
