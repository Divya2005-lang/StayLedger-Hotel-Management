import { Router } from 'express';
import { authConfig, checkCredentials, signToken } from '../utils/auth.js';
import { requireAdmin } from '../middleware/auth.js';
import { createLimiter } from '../utils/loginLimiter.js';

const router = Router();

// 8 failed attempts per client IP, then a 15 minute wait.
export const loginLimiter = createLimiter({ windowMs: 15 * 60 * 1000, max: 8 });

const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

export const loginHandler = wrap(async (req, res) => {
  const key = req.ip;
  const wait = loginLimiter.retryAfterMs(key);
  if (wait > 0) {
    res.set('Retry-After', String(Math.ceil(wait / 1000)));
    return res.status(429).json({ message: 'Too many failed attempts. Try again in a few minutes.' });
  }

  const username = typeof req.body?.username === 'string' ? req.body.username.trim() : '';
  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  if (!username || !password || username.length > 100 || password.length > 200) {
    return res.status(422).json({
      message: 'Validation failed.',
      errors: {
        ...(!username && { username: 'Username is required.' }),
        ...(!password && { password: 'Password is required.' }),
      },
    });
  }

  if (!(await checkCredentials(username, password))) {
    loginLimiter.fail(key);
    return res.status(401).json({ message: 'Incorrect username or password.' });
  }

  loginLimiter.clear(key);
  const config = authConfig();
  const token = signToken({ sub: config.username, role: 'admin' }, config.secret, config.ttlSeconds);
  return res.json({ token, expiresIn: config.ttlSeconds, admin: { username: config.username } });
});

router.post('/login', loginHandler);

// Lets the app confirm that a stored token is still accepted.
router.get('/me', requireAdmin, (req, res) => res.json({ data: { username: req.admin.username } }));

export default router;
