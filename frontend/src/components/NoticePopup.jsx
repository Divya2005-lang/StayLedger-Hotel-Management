import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { hideNotice } from '../store/uiSlice.js';

/** Global success popup (e.g. after a hotel is deleted). Auto-dismisses after a few seconds. */
export default function NoticePopup() {
  const notice = useSelector((state) => state.ui.notice);
  const dispatch = useDispatch();

  useEffect(() => {
    if (!notice) return undefined;
    const timer = setTimeout(() => dispatch(hideNotice()), 3500);
    return () => clearTimeout(timer);
  }, [notice, dispatch]);

  if (!notice) return null;

  return (
    <div className="overlay overlay--light" onMouseDown={(e) => e.target === e.currentTarget && dispatch(hideNotice())}>
      <div className="popup" role="status" aria-live="polite">
        <span className="popup__icon" aria-hidden="true">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12.5l4.5 4.5L19 7.5" />
          </svg>
        </span>
        <h2>{notice.title}</h2>
        {notice.message && <p className="muted">{notice.message}</p>}
        <button type="button" className="btn btn--primary btn--sm" onClick={() => dispatch(hideNotice())}>
          Got it
        </button>
      </div>
    </div>
  );
}
