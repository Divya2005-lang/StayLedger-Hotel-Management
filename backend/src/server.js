import 'dotenv/config';
import { createApp } from './app.js';
import { closePool } from './db.js';
import { assertAuthConfig } from './utils/auth.js';

try {
  assertAuthConfig();
} catch (err) {
  console.error(`Admin sign-in is not set up: ${err.message}`);
  process.exit(1);
}

const port = Number(process.env.PORT || 5000);
const app = createApp();

const server = app.listen(port, () => {
  console.log(`StayLedger API listening on http://localhost:${port}`);
});

const shutdown = (signal) => {
  console.log(`${signal} received, shutting down...`);
  server.close(async () => {
    await closePool();
    process.exit(0);
  });
};
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
