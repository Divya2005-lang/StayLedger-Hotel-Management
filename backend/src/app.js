import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import hotelsRouter, { HttpError } from './routes/hotels.js';
import authRouter from './routes/auth.js';
import { UPLOAD_DIR, PUBLIC_PREFIX } from './middleware/upload.js';

export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  if (process.env.TRUST_PROXY === 'true') app.set('trust proxy', 1);
  // Images are loaded by the SPA, which may be served from another origin.
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

  const origins = (process.env.CORS_ORIGIN || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  app.use(cors(origins.length ? { origin: origins } : undefined));

  app.use(express.json({ limit: '100kb' }));
  app.use(express.urlencoded({ extended: false, limit: '100kb' }));

  app.use(
    PUBLIC_PREFIX,
    express.static(UPLOAD_DIR, { maxAge: '7d', immutable: true, fallthrough: true })
  );

  app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
  app.use('/api/auth', authRouter);
  app.use('/api/hotels', hotelsRouter);

  app.use('/api', (_req, _res, next) => next(new HttpError(404, 'Route not found.')));

  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    if (err.type === 'entity.parse.failed') {
      return res.status(400).json({ message: 'Request body is not valid JSON.' });
    }
    if (err instanceof HttpError) {
      return res.status(err.status).json({ message: err.message, ...(err.errors && { errors: err.errors }) });
    }
    console.error(err);
    res.status(500).json({ message: 'Something went wrong on our side.' });
  });

  return app;
}
