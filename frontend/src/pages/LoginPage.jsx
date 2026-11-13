import { useEffect, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { clearAuthError, login, selectIsAdmin } from '../store/authSlice.js';
import Seo from '../components/Seo.jsx';
import Scene from '../components/Scene.jsx';

export default function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const isAdmin = useSelector(selectIsAdmin);
  const { status, error, fieldErrors } = useSelector((state) => state.auth);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [reveal, setReveal] = useState(false);
  const [local, setLocal] = useState({});

  const destination = location.state?.from || '/admin';

  useEffect(() => () => dispatch(clearAuthError()), [dispatch]);

  if (isAdmin) return <Navigate to={destination} replace />;

  const submit = async (e) => {
    e.preventDefault();
    const problems = {};
    if (!username.trim()) problems.username = 'Enter your username.';
    if (!password) problems.password = 'Enter your password.';
    setLocal(problems);
    if (Object.keys(problems).length) {
      document.getElementById(problems.username ? 'login-username' : 'login-password')?.focus();
      return;
    }
    const result = await dispatch(login({ username: username.trim(), password }));
    if (login.fulfilled.match(result)) navigate(destination, { replace: true });
    else setPassword('');
  };

  const userError = local.username || fieldErrors.username;
  const passError = local.password || fieldErrors.password;
  const busy = status === 'loading';

  return (
    <>
      <Seo title="Admin sign in" description="Sign in to manage hotel listings." noIndex />
      <div className="login">
        <aside className="login__art" aria-hidden="true">
          <Scene />
          <div className="login__art-text">
            <p className="hero__eyebrow">StayLedger admin</p>
            <p className="login__tagline">Every listing, kept accurate.</p>
          </div>
        </aside>

        <section className="login__panel">
          <h1>Admin sign in</h1>
          <p className="muted">Only the admin can add, edit or delete hotels. Everyone else can browse.</p>

          {location.state?.from && (
            <p className="banner banner--info" role="status">
              Please sign in to continue.
            </p>
          )}
          {error && (
            <p className="banner banner--error" role="alert">
              {error}
            </p>
          )}

          <form onSubmit={submit} noValidate>
            <div className={`field${userError ? ' has-error' : ''}`}>
              <label htmlFor="login-username">Username</label>
              <input
                id="login-username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                aria-invalid={Boolean(userError)}
                aria-describedby={userError ? 'login-username-error' : undefined}
              />
              {userError && (
                <p id="login-username-error" className="field-error">
                  {userError}
                </p>
              )}
            </div>

            <div className={`field${passError ? ' has-error' : ''}`}>
              <label htmlFor="login-password">Password</label>
              <div className="password">
                <input
                  id="login-password"
                  type={reveal ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  aria-invalid={Boolean(passError)}
                  aria-describedby={passError ? 'login-password-error' : undefined}
                />
                <button type="button" className="btn btn--text btn--sm" onClick={() => setReveal((v) => !v)} aria-pressed={reveal}>
                  {reveal ? 'Hide' : 'Show'}
                </button>
              </div>
              {passError && (
                <p id="login-password-error" className="field-error">
                  {passError}
                </p>
              )}
            </div>

            <button type="submit" className="btn btn--primary login__submit" disabled={busy}>
              {busy ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="muted login__back">
            <Link to="/">Back to all stays</Link>
          </p>
        </section>
      </div>
    </>
  );
}
