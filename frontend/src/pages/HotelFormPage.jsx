import { useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { clearCurrent, createHotel, fetchHotelById, updateHotel } from '../store/hotelsSlice.js';
import Seo from '../components/Seo.jsx';
import HotelForm from '../components/HotelForm.jsx';
import { ErrorState, NotFoundState, Spinner } from '../components/StateViews.jsx';

/** Hosts the shared <HotelForm/> for both /hotels/new and /hotels/:id/edit. */
export default function HotelFormPage({ mode }) {
  const { id } = useParams();
  const isEdit = mode === 'edit';
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { current, currentStatus, currentError, saving } = useSelector((state) => state.hotels);

  useEffect(() => {
    if (!isEdit) return undefined;
    dispatch(fetchHotelById(id));
    return () => {
      dispatch(clearCurrent());
    };
  }, [dispatch, id, isEdit]);

  const goBack = () => navigate(isEdit ? `/hotels/${id}` : '/');

  const handleSubmit = async (formData) => {
    // unwrap() throws the { message, errors } payload, which HotelForm shows next to the fields.
    if (isEdit) {
      await dispatch(updateHotel({ id, formData })).unwrap();
      navigate(`/hotels/${id}`);
    } else {
      const created = await dispatch(createHotel(formData)).unwrap();
      navigate(`/hotels/${created.id}`);
    }
  };

  const heading = isEdit ? 'Edit hotel' : 'Add a hotel';
  const seo = <Seo title={heading} description="Create or update a hotel listing." noIndex />;

  if (isEdit) {
    if (currentStatus === 'failed') {
      return currentError?.status === 404 || currentError?.status === 400 ? (
        <>
          {seo}
          <NotFoundState title="Hotel not found" message="There is nothing to edit here." />
        </>
      ) : (
        <ErrorState message={currentError?.message} onRetry={() => dispatch(fetchHotelById(id))} />
      );
    }
    if (!current || String(current.id) !== String(id)) return <Spinner label="Loading hotel…" />;
  }

  return (
    <>
      {seo}
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link to="/">All stays</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{heading}</span>
      </nav>

      <section className="form-card">
        <h1>{heading}</h1>
        <p className="muted">
          {isEdit ? 'Update the details below. Leave the image alone to keep the current one.' : 'Fill in the details to publish a new listing.'}
        </p>
        <HotelForm
          key={isEdit ? current.id : 'new'}
          mode={mode}
          hotel={isEdit ? current : undefined}
          onSubmit={handleSubmit}
          onCancel={goBack}
          submitting={saving}
        />
      </section>
    </>
  );
}
