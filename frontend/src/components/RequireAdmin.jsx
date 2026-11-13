import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectIsAdmin } from '../store/authSlice.js';

/** Wraps pages only the admin may open. Visitors are sent to the login page and brought back afterwards. */
export default function RequireAdmin({ children }) {
  const isAdmin = useSelector(selectIsAdmin);
  const location = useLocation();
  if (!isAdmin) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return children;
}
