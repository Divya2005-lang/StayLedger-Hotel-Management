import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import multer from 'multer';

const here = path.dirname(fileURLToPath(import.meta.url));
export const UPLOAD_DIR = path.resolve(here, '../../uploads');
export const PUBLIC_PREFIX = '/uploads';

fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const MAX_BYTES = Number(process.env.MAX_IMAGE_MB || 5) * 1024 * 1024;

const EXT_BY_MIME = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
};

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    // Never trust the client-supplied name: random id + extension derived from MIME type.
    const id = crypto.randomBytes(12).toString('hex');
    cb(null, `${Date.now()}-${id}${EXT_BY_MIME[file.mimetype]}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_BYTES, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (EXT_BY_MIME[file.mimetype]) return cb(null, true);
    const err = new Error('Only JPG, PNG, WEBP or GIF images are allowed.');
    err.code = 'BAD_IMAGE_TYPE';
    cb(err);
  },
});

/** Parses an optional single `image` field and turns upload failures into 422 JSON. */
export function uploadImage(req, res, next) {
  upload.single('image')(req, res, (err) => {
    if (!err) return next();
    let message = err.message;
    if (err.code === 'LIMIT_FILE_SIZE')
      message = `Image is too large. Maximum size is ${MAX_BYTES / 1024 / 1024} MB.`;
    else if (err.code === 'LIMIT_UNEXPECTED_FILE') message = 'Send exactly one file in the "image" field.';
    else if (!err.code?.startsWith?.('LIMIT_') && err.code !== 'BAD_IMAGE_TYPE')
      return next(err);
    res.status(422).json({ message: 'Validation failed.', errors: { image: message } });
  });
}

/** Converts a stored public path such as "/uploads/x.jpg" into an absolute disk path (or null). */
function toDiskPath(publicPath) {
  if (!publicPath || !publicPath.startsWith(`${PUBLIC_PREFIX}/`)) return null;
  const file = path.basename(publicPath);
  return path.join(UPLOAD_DIR, file);
}

/** Best-effort deletion of an uploaded file. Never throws. */
export async function removeStoredImage(publicPath) {
  const diskPath = toDiskPath(publicPath);
  if (!diskPath) return;
  try {
    await fs.promises.unlink(diskPath);
  } catch (err) {
    if (err.code !== 'ENOENT') console.warn('Could not delete image:', err.message);
  }
}

export const publicPathFor = (file) => `${PUBLIC_PREFIX}/${file.filename}`;
