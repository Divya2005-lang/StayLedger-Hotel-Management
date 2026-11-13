import { Router } from 'express';
import { query } from '../db.js';
import { validateHotel } from '../utils/validate.js';
import { publicPathFor, removeStoredImage, uploadImage } from '../middleware/upload.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();

const COLUMNS = `id, title, description, latitude, longitude, price,
  image_path AS "imagePath", created_at AS "createdAt", updated_at AS "updatedAt"`;

const MAX_PAGE_SIZE = 50;
const DEFAULT_PAGE_SIZE = 6;

// ---------- helpers ----------

class HttpError extends Error {
  constructor(status, message, errors) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}

function parseId(raw) {
  if (!/^\d+$/.test(raw) || Number(raw) > 2_147_483_647) {
    throw new HttpError(400, 'Hotel id must be a positive integer.');
  }
  return Number(raw);
}

function parseOptionalInt(raw, name, { min, max, fallback }) {
  if (raw === undefined || raw === '') return fallback;
  if (!/^\d+$/.test(String(raw))) throw new HttpError(400, `"${name}" must be a whole number.`);
  const n = Number(raw);
  if (n < min || n > max) throw new HttpError(400, `"${name}" must be between ${min} and ${max}.`);
  return n;
}

function parseOptionalPrice(raw, name) {
  if (raw === undefined || raw === '') return undefined;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) throw new HttpError(400, `"${name}" must be a non-negative number.`);
  return n;
}

/** Escape LIKE wildcards so user input is matched literally. */
const escapeLike = (s) => s.replace(/[\\%_]/g, (c) => `\\${c}`);

const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// ---------- GET /api/hotels ----------

router.get(
  '/',
  wrap(async (req, res) => {
    const limit = parseOptionalInt(req.query.limit, 'limit', {
      min: 1,
      max: MAX_PAGE_SIZE,
      fallback: DEFAULT_PAGE_SIZE,
    });
    const offset = parseOptionalInt(req.query.offset, 'offset', {
      min: 0,
      max: 1_000_000,
      fallback: 0,
    });
    const minPrice = parseOptionalPrice(req.query.minPrice, 'minPrice');
    const maxPrice = parseOptionalPrice(req.query.maxPrice, 'maxPrice');
    if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
      throw new HttpError(400, '"minPrice" cannot be greater than "maxPrice".');
    }

    const search = typeof req.query.title === 'string' ? req.query.title.trim() : '';

    const conditions = [];
    const params = [];
    if (search) {
      params.push(`%${escapeLike(search)}%`);
      conditions.push(`title ILIKE $${params.length}`);
    }
    if (minPrice !== undefined) {
      params.push(minPrice);
      conditions.push(`price >= $${params.length}`);
    }
    if (maxPrice !== undefined) {
      params.push(maxPrice);
      conditions.push(`price <= $${params.length}`);
    }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const countSql = `SELECT COUNT(*)::int AS total FROM hotels ${where}`;
    const listSql = `
      SELECT ${COLUMNS}
      FROM hotels
      ${where}
      ORDER BY created_at DESC, id DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;

    const [count, list] = await Promise.all([
      query(countSql, params),
      query(listSql, [...params, limit, offset]),
    ]);

    res.json({ data: list.rows, total: count.rows[0].total, limit, offset });
  })
);

// ---------- GET /api/hotels/stats (admin dashboard summary, admin only) ----------
// Declared before "/:id" so "stats" is not treated as an id.

router.get(
  '/stats',
  requireAdmin,
  wrap(async (_req, res) => {
    const { rows } = await query(
      `SELECT COUNT(*)::int                       AS total,
              COALESCE(ROUND(AVG(price), 2), 0)   AS "avgPrice",
              COALESCE(MIN(price), 0)             AS "minPrice",
              COALESCE(MAX(price), 0)             AS "maxPrice",
              MAX(updated_at)                     AS "lastUpdated"
         FROM hotels`
    );
    res.json({ data: rows[0] });
  })
);

// ---------- GET /api/hotels/:id ----------

router.get(
  '/:id',
  wrap(async (req, res) => {
    const id = parseId(req.params.id);
    const { rows } = await query(`SELECT ${COLUMNS} FROM hotels WHERE id = $1`, [id]);
    if (!rows.length) throw new HttpError(404, 'Hotel not found.');
    res.json({ data: rows[0] });
  })
);

// ---------- POST /api/hotels ----------

router.post(
  '/',
  requireAdmin,
  uploadImage,
  wrap(async (req, res) => {
    const { errors, values, valid } = validateHotel(req.body, { hasImage: Boolean(req.file) });
    if (!valid) {
      if (req.file) await removeStoredImage(publicPathFor(req.file));
      throw new HttpError(422, 'Validation failed.', errors);
    }

    const imagePath = publicPathFor(req.file);
    try {
      const { rows } = await query(
        `INSERT INTO hotels (title, description, latitude, longitude, price, image_path)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING ${COLUMNS}`,
        [values.title, values.description, values.latitude, values.longitude, values.price, imagePath]
      );
      res.status(201).json({ data: rows[0] });
    } catch (err) {
      await removeStoredImage(imagePath); // don't orphan the file if the insert fails
      throw err;
    }
  })
);

// ---------- PUT /api/hotels/:id ----------

router.put(
  '/:id',
  requireAdmin,
  uploadImage,
  wrap(async (req, res) => {
    const newImagePath = req.file ? publicPathFor(req.file) : null;
    try {
      const id = parseId(req.params.id);
      const existing = await query('SELECT image_path FROM hotels WHERE id = $1', [id]);
      if (!existing.rows.length) throw new HttpError(404, 'Hotel not found.');

      const { errors, values, valid } = validateHotel(req.body, {
        hasImage: Boolean(newImagePath || existing.rows[0].image_path),
      });
      if (!valid) throw new HttpError(422, 'Validation failed.', errors);

      const oldImagePath = existing.rows[0].image_path;
      const { rows } = await query(
        `UPDATE hotels
            SET title = $1, description = $2, latitude = $3, longitude = $4,
                price = $5, image_path = $6, updated_at = NOW()
          WHERE id = $7
        RETURNING ${COLUMNS}`,
        [
          values.title,
          values.description,
          values.latitude,
          values.longitude,
          values.price,
          newImagePath ?? oldImagePath,
          id,
        ]
      );
      if (!rows.length) throw new HttpError(404, 'Hotel not found.'); // deleted mid-request

      if (newImagePath && oldImagePath !== newImagePath) await removeStoredImage(oldImagePath);
      res.json({ data: rows[0] });
    } catch (err) {
      if (newImagePath) await removeStoredImage(newImagePath);
      throw err;
    }
  })
);

// ---------- DELETE /api/hotels/:id ----------
// Add ?keepImage=true to leave the image file on disk.

router.delete(
  '/:id',
  requireAdmin,
  wrap(async (req, res) => {
    const id = parseId(req.params.id);
    const { rows } = await query('DELETE FROM hotels WHERE id = $1 RETURNING image_path', [id]);
    if (!rows.length) throw new HttpError(404, 'Hotel not found.');

    const keepImage = ['true', '1'].includes(String(req.query.keepImage).toLowerCase());
    if (!keepImage) await removeStoredImage(rows[0].image_path);

    res.json({ message: 'Hotel deleted.', id });
  })
);

export { HttpError };
export default router;
