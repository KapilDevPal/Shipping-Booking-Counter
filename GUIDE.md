# FlightGo Express — Developer Guide

> Franchise Platform for managing shipments, wallets, carrier rates, and branch networks.

---

## Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | ≥ 20 | Backend & Frontend runtime |
| npm | ≥ 10 | Package manager |
| Docker + Docker Compose | latest | PostgreSQL + Redis |
| Git | any | Version control |

---

## Quick Start

### 1. Clone & Install

```bash
git clone <repo-url>
cd transport

# Backend dependencies
cd apps/backend && npm install && cd ../..

# Frontend dependencies
cd apps/frontend && npm install && cd ../..
```

### 2. Start Services (Docker)

```bash
# Start PostgreSQL (port 5433) and Redis (port 6380)
docker-compose up -d

# Verify containers are healthy
docker ps
```

### 3. Environment Variables

Copy the example env and configure:

```bash
cp apps/backend/.env.example apps/backend/.env
```

Key variables in `apps/backend/.env`:

```env
DATABASE_URL="postgresql://flightgo:flightgo@localhost:5433/flightgo_db"
REDIS_URL="redis://localhost:6380"

JWT_SECRET="your-secret-here"
JWT_REFRESH_SECRET="your-refresh-secret-here"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

FLIGHTGO_API_KEY="your-flightgo-api-key"
FLIGHTGO_API_URL="https://api.flightgo.com"

NODE_ENV="development"
PORT=3000
FRONTEND_URL="http://localhost:5173"
```

### 4. Database Setup

```bash
cd apps/backend

# Run migrations
npx prisma migrate deploy

# Seed with demo data (companies, users, wallet)
npx prisma db seed
```

### 5. Start Backend

```bash
cd apps/backend
npm run start:dev      # Hot-reload dev server on http://localhost:3000
```

API Swagger docs: **http://localhost:3000/api/docs**

### 6. Start Frontend

```bash
cd apps/frontend
npm run dev            # Vite dev server on http://localhost:5173
```

---

## Demo Login Credentials

| Role | Email | Password | Access |
|------|-------|----------|--------|
| **Super Admin** | `superadmin@flightgo.com` | `admin123` | Full platform control |
| **Company Admin** | `companyadmin@flightgo.com` | `company123` | Company-wide management |
| **Franchise Admin** | `franchiseadmin@flightgo.com` | `franchise123` | Franchise + branch view |
| **Branch Staff** | `branchstaff@flightgo.com` | `counter123` | Booking counter access |

---

## Role Capabilities

### 🔴 Super Admin
- View ALL companies, franchises, branches, users, and shipments
- Access **Administration → Users Directory** (activate/deactivate any user)
- Access **Administration → Global Settings** (wallet recharge, platform stats)
- Create new shipments
- View all rate quotes and carrier options

### 🟣 Company Admin
- View all data scoped to their own company
- Access **Administration → Users Directory** (manage company users)
- Access **Administration → Global Settings** (view own company wallet)
- Cannot recharge wallet (Super Admin only for cross-company recharge)
- View franchises and branches under their company

### 🟡 Franchise Admin
- View data within their franchise
- View branches belonging to their franchise
- View shipments from their franchise branches
- No access to Administration section

### 🔵 Branch Staff
- Access **New Booking** — create shipments with carrier rate comparison
- View **Shipments** — list and detail view of shipments for their branch
- Download AWB PDF shipping labels
- No access to Administration section

---

## Application Features

### Dashboard
Shows live KPIs: wallet balance, shipment count, carrier breakdown, recent activity.

### New Booking (Shipping Booking Counter)
1. Fill shipment origin details (city, state, pincode)
2. Select package type (Parcel / Document) and shipment mode (Express / Surface)
3. Enter weight and dimensions (auto-calculates volumetric weight)
4. Select destination country and ZIP code
5. Click **Compare Carriers & Rates** → fetches live or mock pricing
6. Select a carrier option and click **Book Shipment**
7. Confirmation screen shows AWB number and download link for PDF label

### Shipments
Full list of all booked shipments with:
- Status badges (Booked → Picked Up → In Transit → Delivered)
- Date + time of booking
- Download AWB label PDF
- Waybill detail drawer (package specs, route, add-on services)

### Administration → Users Directory *(Admin only)*
- See all users with role badges, organisation mapping, and join date
- Activate / Deactivate user accounts
- Filterable by role (Super Admin, Company Admin, Franchise Admin, Branch Staff)

### Administration → Global Settings *(Admin only)*
- **Platform stats**: user count, companies, franchises, branches, shipments, total wallet value
- **Wallet Recharge**: select company → enter amount → top-up instantly
- **Companies table**: live wallet balances per company
- **Franchise Network**: franchise list with branch count
- **Branch Locations**: branch list with staff count and shipment counts

---

## Organisational Hierarchy

```
Company  (e.g. Flightgo India Pvt Ltd)
 └── Franchise  (e.g. Goa Premium Franchise)
      └── Branch  (e.g. Panaji Central Branch)
           └── Branch Staff  (counter operators)
```

**Who creates what?**

| Action | Who can do it |
|--------|--------------|
| Create Company | Database seed / Super Admin via DB |
| Create Franchise | Super Admin / Company Admin via API |
| Create Branch | Super Admin / Company Admin / Franchise Admin via API |
| Create User | Database seed / Super Admin via API |
| Book Shipment | Branch Staff, Super Admin |
| Recharge Wallet | Super Admin (via Global Settings UI) |
| Deactivate User | Super Admin, Company Admin |
| View All Data | Super Admin only |

> **Note**: Creating franchises, branches, and users via UI forms is a Sprint 5 feature (Admin Portal). Currently they can be created directly via the Swagger API at `/api/docs` or via `prisma/seed.ts`.

---

## API Endpoints Reference

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/auth/login` | POST | Public | Login, get JWT tokens |
| `/api/auth/refresh` | POST | Public | Refresh access token |
| `/api/auth/logout` | POST | Bearer | Logout user |
| `/api/rates/check` | POST | Bearer | Get carrier rate quotes |
| `/api/locations/countries` | GET | Bearer | List supported countries |
| `/api/locations/zipcodes` | GET | Bearer | List zipcodes for country |
| `/api/shipments/wallet` | GET | Bearer | Get wallet balance |
| `/api/shipments/book` | POST | Bearer | Book a shipment |
| `/api/shipments` | GET | Bearer | List shipments (role-scoped) |
| `/api/shipments/:id/label` | GET | Public | Download AWB PDF label |
| `/api/admin/stats` | GET | Bearer | Platform statistics |
| `/api/admin/users` | GET | Bearer | List users (role-scoped) |
| `/api/admin/users/:id/toggle-status` | PATCH | Bearer | Activate/deactivate user |
| `/api/admin/companies` | GET | Bearer | List companies + wallets |
| `/api/admin/wallet/recharge` | POST | Bearer | Recharge company wallet |
| `/api/admin/franchises` | GET | Bearer | List franchises |
| `/api/admin/branches` | GET | Bearer | List branches |

---

## Dark / Light Mode

Click the **sun/moon toggle** in the top-right header bar to switch themes. The preference is persisted in your browser.

---

## Production Deployment (Kamal)

```bash
# Configure secrets
cp .kamal/secrets.example .kamal/secrets
# Edit .kamal/secrets with production values

# Deploy
kamal deploy

# Check logs
kamal app logs
```

See `.kamal/deploy.yml` for server and image configuration.

---

## Project Structure

```
transport/
├── apps/
│   ├── backend/          # NestJS API (port 3000)
│   │   ├── prisma/       # DB schema + migrations + seed
│   │   └── src/
│   │       ├── admin/    # Sprint 4: users dir + global settings
│   │       ├── auth/     # JWT auth + refresh tokens
│   │       ├── integrations/flightgo/  # FlightGo carrier API
│   │       ├── locations/   # Countries + zipcodes
│   │       ├── rates/       # Rate calculation service
│   │       └── shipments/   # Booking + PDF label generation
│   └── frontend/         # React + Vite (port 5173)
│       └── src/
│           ├── api/      # Axios client + interceptors
│           ├── components/  # Sidebar, Header
│           ├── pages/    # All page components
│           └── store/    # Zustand auth store
├── docker-compose.yml    # Local dev services
├── tasks-summary.md      # Sprint roadmap
└── deep-research-report.md  # Architecture design doc
```
