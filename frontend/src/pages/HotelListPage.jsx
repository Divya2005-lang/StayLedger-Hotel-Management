import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  deleteHotel,
  fetchHotels,
  resetFilters,
  setFilters,
  setPage,
} from '../store/hotelsSlice.js';
import { showNotice } from '../store/uiSlice.js';
import { selectIsAdmin } from '../store/authSlice.js';
import Seo from '../components/Seo.jsx';
import Hero from '../components/Hero.jsx';
import FilterBar from '../components/FilterBar.jsx';
import HotelCard from '../components/HotelCard.jsx';
import Pagination from '../components/Pagination.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import { CardSkeletons, EmptyState, ErrorState } from '../components/StateViews.jsx';

export default function HotelListPage() {
  const dispatch = useDispatch();
  const { items, total, listStatus, listError, filters, page, pageSize, deleting } = useSelector(
    (state) => state.hotels
  );
  const isAdmin = useSelector(selectIsAdmin);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    dispatch(fetchHotels());
  }, [dispatch, filters, page, pageSize]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const hasFilters = Boolean(filters.search || filters.minPrice || filters.maxPrice);

  // If the current page no longer exists (e.g. after deleting its last item), step back.
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
    } catch (err) {
      if (err?.status === 404) {
        closeDialog();
        dispatch(fetchHotels()); // someone else already removed it
      } else {
        setDeleteError(err?.message || 'Could not delete this hotel.');
      }
    }
  };

  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <>
      <Seo
        title="Browse hotels"
        description="Search hotels by name, filter by nightly price and open any listing to see its details and map location."
      />

      <Hero total={total} ready={listStatus === 'succeeded'} />

      <div className="browse">
        <aside className="browse__side" aria-label="Filters">
          <FilterBar
            layout="side"
            values={filters}
            onChange={(patch) => dispatch(setFilters(patch))}
            onReset={() => dispatch(resetFilters())}
          />
        </aside>

        <div className="browse__main" id="results">
          <div className="results-meta" aria-live="polite">
            {listStatus === 'succeeded' &&
              (total === 0 ? 'No hotels found' : `Showing ${from}–${to} of ${total} ${total === 1 ? 'hotel' : 'hotels'}`)}
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
          {hasFilters ? 'Try a different name or widen the price range.' : 'Start by adding a hotel to your list.'}
        </EmptyState>
      )}

      {items.length > 0 && listStatus !== 'failed' && (
        <ul className={`card-list${listStatus === 'loading' ? ' is-refreshing' : ''}`}>
          {items.map((hotel) => (
            <li key={hotel.id}>
              <HotelCard hotel={hotel} canManage={isAdmin} onDelete={setPendingDelete} />
            </li>
          ))}
        </ul>
      )}

      <Pagination
        page={page}
        totalPages={totalPages}
        disabled={listStatus === 'loading'}
        onChange={(n) => {
          dispatch(setPage(n));
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />
        </div>
      </div>

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
