// Admin sign-in helpers built on Node's own crypto module (no extra dependencies).
//
// One admin account is configured through environment variables:
//   ADMIN_USERNAME, ADMIN_PASSWORD_HASH (or ADMIN_PASSWORD outside production),
//   AUTH_SECRET (signs login tokens) and TOKEN_TTL_HOURS.
import crypto from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = promisify(crypto.scrypt);
const SCRYPT = { N: 16384, r: 8, p: 1 };
const KEY_LENGTH = 64;

/** Returns "scrypt$<salt>$<hash>". Synchronous so the `admin:hash` script can print it directly. */
export function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password, salt, KEY_LENGTH, SCRYPT);
  return `scrypt$${salt.toString('base64')}$${hash.toString('base64')}`;
}

export async function verifyPassword(password, stored) {
  const [scheme, saltB64, hashB64] = String(stored || '').split('$');
  if (scheme !== 'scrypt' || !saltB64 || !hashB64) return false;
  const expected = Buffer.from(hashB64, 'base64');
  const actual = await scryptAsync(password, Buffer.from(saltB64, 'base64'), expected.length, SCRYPT);
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}

const digest = (value) => crypto.createHash('sha256').update(String(value)).digest();
const sameText = (a, b) => crypto.timingSafeEqual(digest(a), digest(b));

// ---------- configuration ----------

let cached;

/** Reads and validates the settings once. Throws an Error with a plain-language message when something is wrong. */
export function authConfig() {
  if (cached) return cached;
  const production = process.env.NODE_ENV === 'production';

  const username = (process.env.ADMIN_USERNAME || '').trim();
  if (!username) throw new Error('ADMIN_USERNAME is not set.');

  const passwordHash = (process.env.ADMIN_PASSWORD_HASH || '').trim();
  const plainPassword = process.env.ADMIN_PASSWORD || '';
  if (passwordHash) {
    if (!passwordHash.startsWith('scrypt$')) {
      throw new Error('ADMIN_PASSWORD_HASH is not valid. Create one with: npm run admin:hash -- "your passphrase"');
    }
  } else if (production) {
    throw new Error('Set ADMIN_PASSWORD_HASH in production. Create one with: npm run admin:hash -- "your passphrase"');
  } else if (plainPassword.length < 8) {
    throw new Error('Set ADMIN_PASSWORD (at least 8 characters) or ADMIN_PASSWORD_HASH.');
  }

  let secret = process.env.AUTH_SECRET || '';
  let temporarySecret = false;
  if (secret.length < 32) {
    if (production) throw new Error('AUTH_SECRET must be a random string of at least 32 characters.');
    secret = crypto.randomBytes(32).toString('hex');
    temporarySecret = true;
  }

  const hours = Number(process.env.TOKEN_TTL_HOURS || 8);
  if (!Number.isFinite(hours) || hours <= 0 || hours > 24 * 30) {
    throw new Error('TOKEN_TTL_HOURS must be a number between 0 and 720.');
  }

  cached = {
    username,
    passwordHash,
    plainPassword: passwordHash ? '' : plainPassword,
    secret,
    temporarySecret,
    ttlSeconds: Math.round(hours * 3600),
  };
  return cached;
}

/** Called at start-up so a bad configuration stops the server instead of failing at the first login. */
export function assertAuthConfig() {
  const config = authConfig();
  if (config.temporarySecret) {
    console.warn('AUTH_SECRET is not set. Using a temporary one: admins must sign in again after every restart.');
  }
}

/** Test helper: forget the cached settings so the environment is read again. */
export function resetAuthConfig() {
  cached = undefined;
}

/**
 * Checks the submitted username and password. Both checks always run, so timing does not reveal
 * which of the two was wrong.
 */
export async function checkCredentials(username, password) {
  const config = authConfig();
  const userOk = sameText(username, config.username);
  const passOk = config.passwordHash
    ? await verifyPassword(password, config.passwordHash)
    : sameText(password, config.plainPassword);
  return userOk && passOk;
}

// ---------- signed tokens ----------

const sign = (data, secret) => crypto.createHmac('sha256', secret).update(data).digest();

/** Creates an HS256 token (JWT format) that expires after `ttlSeconds`. */
export function signToken(payload, secret, ttlSeconds) {
  if (!secret) throw new Error('A signing secret is required.');
  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify({ ...payload, iat: now, exp: now + ttlSeconds })).toString('base64url');
  return `${header}.${body}.${sign(`${header}.${body}`, secret).toString('base64url')}`;
}

/** Returns the payload when the token is genuine and unexpired, otherwise null. */
export function verifyToken(token, secret) {
  if (!secret) return null;
  const parts = String(token || '').split('.');
  if (parts.length !== 3) return null;
  const [header, body, signature] = parts;

  const given = Buffer.from(signature, 'base64url');
  const expected = sign(`${header}.${body}`, secret);
  if (given.length !== expected.length || !crypto.timingSafeEqual(given, expected)) return null;

  try {
    if (JSON.parse(Buffer.from(header, 'base64url').toString()).alg !== 'HS256') return null;
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString());
    if (typeof payload.exp !== 'number' || payload.exp <= Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}
