# StayLedger — Hotel List (CRUD) App

A single-page hotel catalogue. Visitors can browse, search, filter by price and open each hotel on a map.
Only the signed-in admin can add, edit or delete hotels.

| Layer    | Stack                                                                                  |
| -------- | -------------------------------------------------------------------------------------- |
| Frontend | React 18, Redux Toolkit, React Router, React Helmet (async), Leaflet, Vite, plain CSS  |
| Backend  | Node.js, Express, PostgreSQL via native SQL (`pg`, no ORM), Multer, Node `crypto` auth |

## Run it

Requirements: Node 18+ and a running PostgreSQL.

```bash
# 1. Database
createdb stayledger

# 2. Backend  (http://localhost:5000)
cd backend
cp .env.example .env     # then edit it, see "Admin access" below
npm install
npm run db:migrate       # creates the hotels table
npm run db:seed          # optional: 10 demo hotels with generated images
npm run dev

# 3. Frontend  (http://localhost:5173), in a second terminal
cd frontend
npm install
npm run dev
```

Open http://localhost:5173. Visitors see the catalogue. Choose **Admin sign in** in the top bar to manage hotels.

In development Vite forwards `/api` and `/uploads` to the backend, so no CORS setup is needed.
For production run `npm run build` in `frontend/`, host `dist/` with a fallback to `index.html`, and set
`VITE_API_URL` (frontend) and `CORS_ORIGIN` (backend) if the API is on another origin.

## Admin access

Add, edit and delete (and the admin summary) need a login. The check happens on the server, so hiding buttons in the page is only a convenience; a request without a valid token is refused with `401`.

Settings live in `backend/.env`:

| Setting               | Purpose                                                                                       |
| --------------------- | --------------------------------------------------------------------------------------------- |
| `ADMIN_USERNAME`      | The admin's username.                                                                         |
| `ADMIN_PASSWORD_HASH` | Recommended. Create with `npm run admin:hash -- "your long passphrase"` and paste the line.    |
| `ADMIN_PASSWORD`      | Development shortcut only. Refused when `NODE_ENV=production`. Change the default.            |
| `AUTH_SECRET`         | Signs login tokens. 32+ random characters. If empty in development, a temporary one is used.  |
| `TOKEN_TTL_HOURS`     | How long a login lasts (default 8).                                                           |
| `TRUST_PROXY`         | Set to `true` only behind a reverse proxy, so login limits use the real client IP.           |

Passwords are stored as salted scrypt hashes and compared in constant time. Tokens are signed (HS256) and expire.
After 8 failed sign-ins from one address the server pauses logins from it for 15 minutes.
The server refuses to start in production without a hash and a long secret.

## What the brief asked for

- **Add/Edit form:** one reusable form for both; image upload with preview, title, description, latitude, longitude, price; checked in the browser and again on the server.
- **List page:** cards with image, title, price and description; search by title, price range filter, server-side pagination; Edit and Delete for the admin, with a confirmation step and a success popup after deleting; each card opens the detail page.
- **Detail page:** all details, an OpenStreetMap map at the saved coordinates, and a button that uses the browser's Geolocation API to show your distance.
- **SEO and accessibility:** per-page title, description, Open Graph and JSON-LD via React Helmet; descriptive `alt` text on images; keyboard focus, skip link, reduced-motion support.
- **Application:** single page app, reusable components, Redux state.

The brief does not mention logins. The admin-only rule is an addition requested afterwards.

## API

| Method | Path               | Access | Notes                                                                                   |
| ------ | ------------------ | ------ | --------------------------------------------------------------------------------------- |
| POST   | `/api/auth/login`  | public | JSON `{ username, password }`. Returns `{ token, expiresIn, admin }`.                   |
| GET    | `/api/auth/me`     | admin  | Confirms a token is still valid.                                                        |
| GET    | `/api/hotels`      | public | Query: `title`, `minPrice`, `maxPrice`, `limit` (1–50, default 6), `offset`.            |
| GET    | `/api/hotels/:id`  | public | One hotel.                                                                              |
| GET    | `/api/hotels/stats`| admin  | Totals and price range for the Admin page.                                              |
| POST   | `/api/hotels`      | admin  | `multipart/form-data`: `image`, `title`, `description`, `latitude`, `longitude`, `price`. |
| PUT    | `/api/hotels/:id`  | admin  | Same fields; `image` optional. The old file is removed when replaced.                    |
| DELETE | `/api/hotels/:id`  | admin  | Deletes the row and its image file (`?keepImage=true` keeps the file).                   |

Send the token as `Authorization: Bearer <token>`. Errors are JSON: `{ "message": "...", "errors": { "price": "..." } }` with status 400 / 401 / 404 / 422 / 429.

## Design notes

- Native SQL only; every query is parameterised, and search text has `%` and `_` escaped.
- Uploads get random names and an extension taken from the checked MIME type; only JPG, PNG, WEBP and GIF up to 5 MB are accepted. Upload is refused before the file is read when the caller is not the admin.
- Prices are formatted as INR; change `CURRENCY` / `LOCALE` in `frontend/src/utils/format.js` for another currency.

## Layout

```
backend/
  schema.sql  scripts/{migrate,seed,hash-password}.js
  src/{server,app,db}.js
  src/routes/{hotels,auth}.js  src/middleware/{upload,auth}.js
  src/utils/{validate,auth,loginLimiter}.js
frontend/
  src/store/        Redux slices (hotels, auth, ui)
  src/api/          fetch wrapper with token handling
  src/components/   HotelForm, HotelCard, FilterBar, Pagination, MapView, Hero, Scene, RequireAdmin, dialogs
  src/pages/        list, detail, add/edit, admin, login
  src/utils/        validators, formatting, geolocation, placeholder
  src/styles/global.css
```
