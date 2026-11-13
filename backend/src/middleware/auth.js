import { authConfig, verifyToken } from '../utils/auth.js';

/** Lets the request through only when it carries a valid admin token ("Authorization: Bearer ..."). */
export function requireAdmin(req, res, next) {
  const match = /^Bearer\s+(.+)$/i.exec(req.get('authorization') || '');
  const payload = match ? verifyToken(match[1].trim(), authConfig().secret) : null;

  if (!payload || payload.role !== 'admin') {
    res.set('WWW-Authenticate', 'Bearer');
    return res.status(401).json({ message: 'Please sign in as the admin to do that.' });
  }
  req.admin = { username: payload.sub };
  return next();
}
