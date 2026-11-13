import { useEffect } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout, selectIsAdmin, verifySession } from '../store/authSlice.js';
import { showNotice } from '../store/uiSlice.js';
import NoticePopup from './NoticePopup.jsx';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [pathname]);
  return null;
}

export default function Layout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isAdmin = useSelector(selectIsAdmin);
  const username = useSelector((state) => state.auth.username);

  // On first load, confirm with the server that a remembered login is still valid.
  useEffect(() => {
    dispatch(verifySession()).catch(() => {});
  }, [dispatch]);

  const signOut = () => {
    dispatch(logout());
    dispatch(showNotice({ title: 'Signed out', message: 'You are browsing as a visitor.' }));
    navigate('/');
  };

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <ScrollToTop />

      <header className="site-header">
        <div className="container site-header__inner">
          <Link to="/" className="brand" aria-label="StayLedger home">
            <svg width="30" height="30" viewBox="0 0 32 32" aria-hidden="true">
              <rect width="32" height="32" rx="9" fill="var(--brand)" />
              <path d="M8 23V12l8-5 8 5v11h-5v-6h-6v6z" fill="#fff" />
            </svg>
            <span>StayLedger</span>
          </Link>

          <nav aria-label="Main">
            <NavLink to="/" end className="nav-link">
              All stays
            </NavLink>
            {isAdmin ? (
              <>
                <NavLink to="/admin" className="nav-link">
                  Admin
                </NavLink>
                <Link to="/hotels/new" className="btn btn--primary btn--sm">
                  + Add hotel
                </Link>
                <span className="user-chip" title={`Signed in as ${username}`}>
                  <span className="user-chip__avatar" aria-hidden="true">
                    {username.slice(0, 1).toUpperCase()}
                  </span>
                  <span className="user-chip__name">{username}</span>
                </span>
                <button type="button" className="btn btn--ghost btn--sm" onClick={signOut}>
                  Sign out
                </button>
              </>
            ) : (
              <Link to="/login" className="btn btn--ghost btn--sm">
                Admin sign in
              </Link>
            )}
          </nav>
        </div>
      </header>

      <main id="main" className="container main">
        <Outlet />
      </main>

      <footer className="site-footer">
        <div className="container">
          <p>StayLedger · a small hotel catalogue built with React, Redux, Express and PostgreSQL.</p>
          <p className="muted">Map data © OpenStreetMap contributors.</p>
        </div>
      </footer>

      <NoticePopup />
    </>
  );
}
