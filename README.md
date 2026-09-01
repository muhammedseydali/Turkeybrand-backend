# Turkeybrand — Shirts & Denim E-Commerce

> Built for how Kerala actually lives since 2011 — breathable fabric, precise stitching, and a fit that holds up wash after wash. Shipping across 4 cities in Kerala and Tamil Nadu, with flagship store in Kamaleswaram.

A full-stack e-commerce app: **FastAPI + SQLAlchemy** backend, **React + TypeScript + Tailwind** frontend. Covers catalog browsing with per-size/color inventory, cart, checkout, mock payments, order tracking, and a full admin dashboard (products, inventory, orders, payments, customers, sales reports).

```
turkeybrand/
├── backend/     FastAPI app (SQLAlchemy models, JWT auth, admin API)
└── frontend/    React + Vite + Tailwind (storefront + admin panel)
```

## What's real vs. stubbed

- **Real**: catalog, per-variant inventory (transaction-safe — verified it blocks
  overselling), cart, checkout, orders, admin CRUD, dashboard stats, sales reports.
- **Stubbed**: the payment gateway. Checkout calls a mock "always succeeds" endpoint
  (`POST /api/payments/{order_number}/pay`) instead of Razorpay/Stripe — the order,
  payment record, and inventory deduction all happen for real, only the actual card
  charge is fake. Swapping in a real gateway means replacing the inside of that one
  function in `backend/app/routers/payments.py`; nothing else in the pipeline changes.
- Product images are placeholder Unsplash URLs — replace with your own via the admin
  product form (or wire up S3/Cloudinary/Cloudinary-style uploads later).

## Local development

**Backend**
```bash
cd backend
python -m venv .venv && source .venv/bin/activate   # or your preferred env tool
pip install -r requirements.txt
cp .env.example .env
python -m app.seed        # creates turkeybrand.db with demo data
uvicorn app.main:app --reload --port 8000
```
Demo logins: `admin@turkeybrand.dev` / `Admin@123` (admin), `rahul@example.com` / `password123` (customer).

**Frontend**
```bash
cd frontend
npm install
npm run dev      # http://localhost:5173, talks to http://localhost:8000
```

## Run with Docker

The fastest way to run the whole thing — no Python/Node setup needed, just Docker.

```bash
docker compose up -d --build
```

That builds and starts both containers:
- **Backend** (FastAPI) → http://localhost:8001
- **Frontend** (built React app served by nginx) → http://localhost:8081

Open **http://localhost:8081** in your browser. On first run, the backend
container automatically creates the database and seeds it with demo data. Log in at
`/admin/login` with `admin@turkeybrand.dev` / `Admin@123`, or as a customer with
`rahul@example.com` / `password123`.

The database lives in a named Docker volume (`turkeybrand_data`), so your data — orders,
products you add, etc. — survives `docker compose down` and rebuilds. To wipe it and
start over with fresh demo data:
```bash
docker compose down -v   # -v also removes the volume
docker compose up -d --build
```

**Stopping:** `docker compose down` (add `-v` as above to also delete the data).

**Running in the background:** `docker compose up --build -d`, then
`docker compose logs -f` to tail logs.

**A few things worth knowing:**
- `VITE_API_URL` (what the browser calls) is baked into the frontend's JS bundle at
  *build* time, not read at container start. If you change the port mapping or run
  the backend somewhere other than `localhost:8000`, update the `VITE_API_URL` build
  arg in `docker-compose.yml` and rebuild the frontend (`docker compose up --build`).
- `JWT_SECRET` in `docker-compose.yml` is a placeholder — change it before running
  this anywhere reachable beyond your own machine.
- To disable auto-seeding (e.g. once you have real data you don't want touched), set
  `AUTO_SEED: "false"` under the `backend` service in `docker-compose.yml`.
- Want Postgres instead of SQLite? Add a `postgres` service to `docker-compose.yml`
  and point the backend's `DATABASE_URL` at it
  (`postgresql+psycopg2://user:pass@postgres:5432/shopforge`) — no code changes
  needed, the app already reads `DATABASE_URL` from the environment.

## Deploying now: Vercel

Vercel hosts the React frontend natively. The FastAPI backend runs there too, as a
Python serverless function — but serverless functions have no persistent disk, so
SQLite won't survive between requests. You'll need a small hosted Postgres for
production; **[Neon](https://neon.tech)** or **Supabase** both have a free tier that
takes two minutes to set up and hand you a `postgresql://...` connection string.

Deploy the backend and frontend as **two separate Vercel projects** from this same
repo (Vercel lets you set a different "root directory" per project):

### 1. Database
Create a free Postgres instance (Neon/Supabase) and copy its connection string. Use
the `postgresql+psycopg2://...` form (SQLAlchemy needs the `+psycopg2` driver tag —
just insert it after `postgresql`).

### 2. Backend project
- New Vercel project → import this repo → set **Root Directory** to `backend`.
- Vercel auto-detects `vercel.json` and deploys `api/index.py` as the function.
- Environment variables (Project Settings → Environment Variables):
  - `DATABASE_URL` = your Postgres connection string
  - `JWT_SECRET` = a long random string
  - `CORS_ORIGINS` = the frontend URL you'll get in step 3 (you can add it after)
- Deploy. Note the resulting URL, e.g. `https://shopforge-api.vercel.app`.
- Run the seed script once against that database from your machine:
  ```bash
  cd backend
  DATABASE_URL="postgresql+psycopg2://..." python -m app.seed
  ```

### 3. Frontend project
- New Vercel project → import the same repo → set **Root Directory** to `frontend`.
- Framework preset: Vite (auto-detected).
- Environment variable: `VITE_API_URL` = the backend URL from step 2.
- Deploy. Note this URL, e.g. `https://shopforge.vercel.app`.

### 4. Close the loop
Go back to the backend project's env vars and set `CORS_ORIGINS` to the frontend URL
from step 3 (comma-separate if you also want `localhost:5173` for local testing),
then redeploy the backend so the new CORS setting takes effect.

That's it — the storefront and admin panel are both live under the frontend domain,
talking to the backend domain.

## Moving to another cloud later

Nothing here is Vercel-specific except the two small adapter files
(`backend/api/index.py` and `backend/vercel.json`, and `frontend/vercel.json`'s SPA
rewrite) — the backend is a plain FastAPI/uvicorn app and the frontend is a plain
static Vite build. To move:

- **Backend** → any container host (Render, Railway, Fly.io, AWS App Runner, a plain
  VM). A `Dockerfile` is already included:
  ```bash
  docker build -t shopforge-api backend/
  docker run -p 8000:8000 -e DATABASE_URL=... -e JWT_SECRET=... -e CORS_ORIGINS=... shopforge-api
  ```
  Point it at the same Postgres instance (or migrate that separately — it's just
  Postgres, so any provider's `pg_dump`/`pg_restore` works).
- **Frontend** → `npm run build` produces `frontend/dist`, a static folder that works
  on Netlify, Cloudflare Pages, S3+CloudFront, or any static host — or use
  `frontend/Dockerfile` (the same one `docker compose` builds) anywhere that runs
  containers. Just set `VITE_API_URL` at build time to wherever the backend now lives.

Because the two sides only ever talk over `VITE_API_URL` / `CORS_ORIGINS`, moving one
or both is a config change, not a code change.

## Known limitations worth knowing about before a real launch

- **Payments**: mock gateway, as noted above — needs real Razorpay/Stripe keys and
  webhook handling for a live store.
- **Images**: no upload/storage pipeline yet; the admin form takes image URLs
  directly. Add S3/Cloudinary upload before going live.
- **Migrations**: tables are created with `Base.metadata.create_all` on startup,
  which is fine for getting started but doesn't handle schema changes safely once
  there's real data in production — add Alembic before your first schema change post-launch.
- **Concurrency**: checkout uses `SELECT ... FOR UPDATE` row locking on Postgres to
  stop two customers from buying the last unit simultaneously; this has no effect on
  SQLite (fine for local dev, not for production traffic).
