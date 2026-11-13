// Inserts a handful of demo hotels. Images are small generated SVG illustrations
// written into /uploads, so the demo works without any external assets.
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { query, closePool } from '../src/db.js';
import { UPLOAD_DIR, PUBLIC_PREFIX } from '../src/middleware/upload.js';

const HOTELS = [
  ['Marina Breeze Resort', 'Wake up to sea air a short stroll from the beach. Spacious rooms, a rooftop pool and a kitchen that serves a proper filter-coffee breakfast.', 13.05, 80.2824, 6400, ['#f6a56b', '#e0563f']],
  ['Hillcrest Mist Lodge', 'A cosy stone lodge above the tea gardens with log fires, woollen blankets and valley views that vanish into cloud every morning.', 11.4102, 76.695, 5200, ['#8fc6a8', '#2f6f62']],
  ['Backwater Bloom Houseboat', 'Drift through quiet canals on a private teak houseboat with a cook on board, sunset deck and a bedroom that rocks you to sleep.', 9.4981, 76.3388, 11800, ['#9ed4e6', '#2b7a9b']],
  ['Pink City Haveli Stay', 'A restored courtyard haveli with hand-painted arches, a rooftop restaurant and an easy walk to the bazaars and the old palace.', 26.9124, 75.7873, 7900, ['#f3b8a6', '#c4553f']],
  ['Temple Town Inn', 'Simple, spotless rooms within earshot of the temple bells. Includes a south Indian breakfast and a helpful travel desk.', 9.9195, 78.1193, 2400, ['#f7d58b', '#d98a2b']],
  ['Tea Estate Retreat', 'Four bungalows scattered through a working tea estate. Join the morning pluck, then return to a veranda and a fresh pot.', 10.0889, 77.0595, 9300, ['#b7d98f', '#4f8a3a']],
  ['Lakeview Palace Suites', 'Suites with balconies that face the lake and the city palace. Evening boat rides and live music are included.', 24.5854, 73.7125, 15800, ['#c5b3e6', '#5a4a9b']],
  ['Coral Shore Villa', 'A white-washed villa with a plunge pool, a hammock garden and a five-minute walk to a quiet stretch of sand.', 15.2993, 74.124, 12400, ['#8fe0d6', '#1e8d86']],
  ['Pine Cottage Manali', 'Wooden cottages among the deodars with a heater in every room, home-style meals and mountain views from the porch.', 32.2396, 77.1887, 3600, ['#b9cde8', '#3d5f8f']],
  ['Fort Gate Residency', 'Business-friendly rooms near the fort with fast Wi-Fi, a work lounge and a late breakfast for early flights and late nights.', 26.2389, 73.0243, 4100, ['#f0c7a0', '#9b6a3d']],
];

function illustration([from, to], seed) {
  const sun = 90 + ((seed * 53) % 140);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 420" role="img">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient></defs>
  <rect width="640" height="420" fill="url(#g)"/>
  <circle cx="${sun + 360}" cy="110" r="46" fill="#fff" opacity=".35"/>
  <path d="M0 300 Q160 220 320 290 T640 270 V420 H0Z" fill="#000" opacity=".16"/>
  <rect x="170" y="215" width="300" height="140" rx="6" fill="#fff" opacity=".92"/>
  <rect x="150" y="195" width="340" height="30" rx="6" fill="#fff"/>
  ${[0, 1, 2, 3, 4].map((i) => `<rect x="${195 + i * 52}" y="245" width="28" height="36" rx="3" fill="${to}" opacity=".75"/>`).join('')}
  <rect x="300" y="300" width="40" height="55" rx="3" fill="${to}"/>
</svg>`;
}

try {
  const { rows } = await query('SELECT COUNT(*)::int AS n FROM hotels');
  if (rows[0].n > 0 && !process.argv.includes('--force')) {
    console.log(`Table already has ${rows[0].n} rows. Re-run with --force to add demo data anyway.`);
  } else {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    for (const [i, [title, description, lat, lng, price, colors]] of HOTELS.entries()) {
      const file = `seed-${i + 1}.svg`;
      fs.writeFileSync(path.join(UPLOAD_DIR, file), illustration(colors, i + 1));
      await query(
        `INSERT INTO hotels (title, description, latitude, longitude, price, image_path)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [title, description, lat, lng, price, `${PUBLIC_PREFIX}/${file}`]
      );
    }
    console.log(`Inserted ${HOTELS.length} demo hotels.`);
  }
} catch (err) {
  console.error('Seeding failed:', err.message);
  process.exitCode = 1;
} finally {
  await closePool();
}
