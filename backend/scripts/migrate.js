import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { query, closePool } from '../src/db.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const sql = fs.readFileSync(path.resolve(here, '../schema.sql'), 'utf8');

try {
  await query(sql);
  console.log('Schema is up to date.');
} catch (err) {
  console.error('Migration failed:', err.message);
  process.exitCode = 1;
} finally {
  await closePool();
}
