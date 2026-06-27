# FlightGo Express — Tasks Summary

> Sprint-by-sprint progress tracker for the FlightGo freight management platform.

---

## ✅ Completed Tasks

### Sprint 1: Core Infrastructure & Booking Counter
* [x] NestJS backend with JWT auth (access + refresh tokens, role-based guards)
* [x] Prisma schema — Company, Franchise, Branch, User, Shipment, Wallet, RefreshToken
* [x] Docker Compose — PostgreSQL (port 5433) + Redis (port 6380)
* [x] React + Vite frontend with Tailwind CSS design system
* [x] Login page with demo credential cards
* [x] Role-based routing (BRANCH_STAFF → Booking Counter, others → Dashboard)
* [x] **Booking Counter** (`/bookings/new`) — full shipment booking form
* [x] **Compare Carriers & Rates** — FlightGo API integration + mock fallback
* [x] Wallet deduction on shipment booking
* [x] **Shipments list** (`/shipments`) with date + time, AWB number, status badges
* [x] **AWB PDF label generation** (pdfkit) — downloadable per shipment
* [x] Dark / Light mode toggle (Header + Login + Landing + Signup)
* [x] Helmet middleware configured for cross-origin PDF streaming

### Sprint 2: Compare Carriers — FlightGo Surface Cargo Fix
* [x] Fixed FlightGo Surface Cargo card showing dark background in light mode
* [x] Verified `/rates/check` returns live data from FlightGo API (key: `10725a0cfa`)
* [x] Mock fallback for when FlightGo API is unreachable

### Sprint 3: Dynamic PDF Labels & Timestamps
* [x] Shipments list shows booking **date + time** (not just date)
* [x] PDF label generation verified with pdfkit — non-empty, correctly formatted
* [x] Helmet `crossOriginResourcePolicy: "cross-origin"` to allow browser PDF download

### Sprint 4: Administration Module
* [x] **Landing Page** (`/`) — public marketing page with hero, features, roles, CTA
* [x] **Sign Up** (`/signup`) — creates Company + COMPANY_ADMIN + ₹0 wallet in one step
* [x] **Login** updated — dark/light toggle, back-to-home link, "Create account" link
* [x] `POST /api/auth/register` — register new company admin endpoint
* [x] **Users Directory** (`/admin/users`) — list, role badges, activate/deactivate
* [x] **Global Settings** (`/admin/settings`) — platform stats, wallet recharge, tables
* [x] **Franchise Network** (`/admin/franchises`) — card grid + branch table, create forms
* [x] `POST /api/admin/franchises` — create franchise with unique code validation
* [x] `POST /api/admin/branches` — create branch with location details
* [x] Dashboard **data-scope label** — each role sees "Viewing data for your franchise/branch/etc."
* [x] Sidebar — Administration section with 3 NavLinks (role-gated per feature)
* [x] `GUIDE.md` — complete developer + user guide (setup, features, API, credentials)

### Sprint 5: MyDHL Express Integration
* [x] **DHL Rate API** — `POST /api/rates/check` now returns rates from both FlightGo and DHL Express in parallel
* [x] **DHL Shipment Booking** — `POST /api/shipments/book` calls MyDHL Express API to create shipment (with mock fallback)
* [x] Store DHL tracking number (`JD...`) in shipment record as AWB number
* [x] Display DHL Express as selectable carrier alongside FlightGo in Compare Rates grid
* [x] **DHL PDF Label** — label header renders "DHL EXPRESS" in red when carrier is DHL
* [x] `DhlService` + `DhlModule` created under `integrations/dhl/` with real API + mock fallback
* [x] Backend build verified — `npm run build` passes with no errors

---

## 🔲 Remaining Tasks

### Sprint 6: Tracking & Status Sync
* [ ] **Polling service** — Redis + BullMQ job queue to fetch tracking updates from carriers
* [ ] `GET /api/shipments/:id/track` — return latest carrier status
* [ ] Shipment detail page with full transit timeline
* [ ] Status webhook handler (for carriers that push updates)

### Sprint 7: Analytics Dashboard
* [x] Replace mock chart data in Dashboard with real booking aggregates (by day/week/month)
* [x] Revenue analytics per company / franchise / branch
* [x] Carrier usage breakdown chart

### Sprint 8: Advanced Admin Portal
* [x] **Create User form** in Admin UI (currently only via API/seed)
* [ ] Edit franchise / branch details
* [ ] Commission & credit limit settings per franchise
* [ ] Return / Cancellation flow — void booking + refund wallet

### Sprint 9: OTP Verification & Notifications
* [ ] OTP verification for new user accounts
* [ ] Email notifications on booking, delivery status updates
* [ ] SMS notifications via Twilio/MSG91 (optional)

### Sprint 10: CI/CD & Production Polish
* [ ] Sentry error tracking on backend and frontend
* [ ] GitHub Actions CI pipeline (lint + test + build on PR)
* [ ] Kamal deployment to production server
* [ ] Environment-specific config (staging vs production)
* [ ] Rate limiting + API throttling on public endpoints
* [ ] Automated DB backup schedule

---

## Notes

- **Data scoping**: All API endpoints are role-scoped — each user sees only their org's data.
- **Wallet**: Company-level. Each booking deducts from the company wallet. Recharge via Super Admin UI.
- **Auth**: JWT with 15min access tokens + 7d rotating refresh tokens.
- **PDF Labels**: Generated server-side with `pdfkit`, streamed directly from `/api/shipments/:id/label`.
- **Theme**: Dark mode default, light mode via toggle. Persisted in `localStorage`.
- **DHL Integration**: `DhlService` uses MyDHL Express REST API (Basic Auth). If `DHL_API_KEY`/`DHL_API_SECRET` are not set, it generates realistic mock rates + `JD...` AWB numbers automatically.
- **Multi-carrier**: Rates from FlightGo and DHL are fetched in parallel. The UI always shows cheapest first.
