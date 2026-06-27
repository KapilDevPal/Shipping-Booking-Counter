# FlightGo Express — Developer & User Guide

> Multi-carrier freight management platform for managing shipments, franchise networks, wallets, and branch operations.

---

## Quick Start

### Prerequisites
| Tool | Version |
|------|---------|
| Node.js | ≥ 20 |
| npm | ≥ 10 |
| Docker + Docker Compose | latest |

### 1. Install Dependencies
```bash
cd apps/backend && npm install
cd ../frontend && npm install
```

### 2. Start Services
```bash
# Start PostgreSQL + Redis
docker-compose up -d
```

### 3. Environment Setup
```bash
cp apps/backend/.env.example apps/backend/.env
# Edit DATABASE_URL, JWT_SECRET, FLIGHTGO_API_KEY
```

**Key environment variables:**
| Variable | Description | Required |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `JWT_SECRET` | JWT signing secret | Yes |
| `FLIGHTGO_API_KEY` | FlightGo Express API key (`10725a0cfa`) | Yes |
| `DHL_API_URL` | MyDHL Express base URL | No (uses mock if absent) |
| `DHL_API_KEY` | MyDHL Express API key | No (uses mock if absent) |
| `DHL_API_SECRET` | MyDHL Express API secret | No (uses mock if absent) |

> **Note:** If DHL credentials are absent or the API is unreachable, the system automatically generates realistic mock DHL rates and `JD...` AWB numbers — the app remains fully functional.

### 4. Database Seed
```bash
cd apps/backend
npx prisma migrate deploy
npx prisma db seed
```

### 5. Start Servers
```bash
# Terminal 1 — Backend API (http://localhost:3000)
cd apps/backend && npm run start:dev

# Terminal 2 — Frontend UI (http://localhost:5173)
cd apps/frontend && npm run dev
```

---

## Application Entry Points

| URL | Description |
|-----|-------------|
| `http://localhost:5173/` | **Landing Page** — public marketing page |
| `http://localhost:5173/login` | Sign In page |
| `http://localhost:5173/signup` | Create a new company account |
| `http://localhost:5173/dashboard` | Main dashboard (protected) |
| `http://localhost:3000/api/docs` | Swagger API explorer |

---

## Demo Credentials

| Role | Email | Password | What they see |
|------|-------|----------|---------------|
| **Super Admin** | `superadmin@flightgo.com` | `admin123` | Everything across all companies |
| **Company Admin** | `companyadmin@flightgo.com` | `company123` | Own company data only |
| **Franchise Admin** | `franchiseadmin@flightgo.com` | `franchise123` | Own franchise data only |
| **Branch Staff** | `branchstaff@flightgo.com` | `counter123` | Own branch data only |

> **Data Scoping**: Each role sees only their own data. A Franchise Admin cannot see other franchises' shipments. A Branch Staff sees only their branch bookings.

---

## Role Capabilities

### ⚡ Super Admin
- Access the **Landing Page** and all protected pages
- **Administration → Users Directory** — view, activate/deactivate any user
- **Administration → Global Settings** — platform-wide stats + recharge any company wallet
- **Administration → Franchise Network** — view/create franchises and branches for any company
- View all shipments, franchises, branches, and companies
- Book new shipments

### 🏛️ Company Admin
- All data scoped to their company
- **Administration → Users Directory** — manage their company's users
- **Administration → Franchise Network** — view/create franchises and branches within their company
- Cannot see or modify other companies' data
- Cannot recharge wallets (only Super Admin can)

### 🏢 Franchise Admin
- All data scoped to their franchise
- **Administration → Franchise Network** — view their franchise + create branches under it
- Cannot access Users Directory or Global Settings
- Can view shipments from their franchise's branches

### 🏪 Branch Staff
- Access **New Booking** counter only
- View **Shipments** for their branch only
- Download AWB PDF labels
- No access to Administration section

---

## Application Features

### 🏠 Landing Page (`/`)
- Public marketing page — no login required
- Shows platform features, how-it-works, role overview
- **Sign In** and **Get Started** CTAs → login/signup pages
- Dark/Light mode toggle in navbar

### 🔑 Login (`/login`)
- Email + password form
- Demo credential reference cards
- Dark/Light mode toggle
- Link to Sign Up

### 📝 Sign Up (`/signup`)
- Creates a new **Company Admin** account
- Automatically creates the company + wallet (₹0 balance)
- Admin can then create franchises/branches from the dashboard

### 📊 Dashboard (`/dashboard`)
- KPI cards: Total Bookings, In Transit, Delivered, Drafts
- Weekly booking chart
- Role-scoped data — you always see only your network's data
- Data scope label (e.g., "Viewing data for your franchise")

### 📦 New Booking (`/bookings/new`) — Branch Staff + Super Admin
1. Fill sender/receiver details
2. Enter package weight + dimensions (volumetric auto-calculated)
3. Select mode: Parcel/Document, Express/Surface
4. Enter destination country + ZIP code
5. Click **Compare Carriers & Rates** → live pricing grid showing **both FlightGo and DHL Express** options, sorted cheapest first
6. Select carrier (FlightGo or DHL) → **Book Shipment**
7. The system calls the carrier's booking API to generate a real tracking number (AWB)
8. Download AWB PDF label — label header shows carrier branding (blue for FlightGo, red for DHL)

### 📋 Shipments (`/shipments`) — All roles (scoped)
- Lists all shipments for the user's scope (branch/franchise/company/all)
- Shows booking date + time, AWB number, carrier, status
- Status badges: BOOKED → PICKED UP → IN TRANSIT → DELIVERED
- Click row to expand details (package specs, route, services)
- Download AWB label PDF

### 👥 Users Directory (`/admin/users`) — Super Admin + Company Admin
- Full list of users in scope with role badges
- Organisation mapping: Company → Franchise → Branch
- Search + filter by role
- **Activate / Deactivate** user accounts (toggle)
- **Add User** — button opens a slide-over modal to create users. Selection of Company, Franchise, and Branch is automatically gated and scoped based on the role selected.

### 📊 Real-Time Analytics (`/dashboard`) — All roles (scoped)
- **Booking Volume Trends** — Daily booking count over the last 30 days
- **Revenue Trends** — Daily total revenue generated over the last 30 days
- **Carrier Distribution** — Donut chart showing the market share of FlightGo vs DHL Express
- **Recent Cargo Shipments** — Live feed of recent airwaybill statuses, including carrier branding and total billing amounts

### 🌐 Global Settings (`/admin/settings`) — Super Admin + Company Admin
- Platform stats: users, companies, franchises, branches, shipments, total wallet
- **Wallet Recharge** — select company, enter amount (quick chips: ₹5k/10k/25k/50k/1L)
- Companies table with live wallet balances
- Franchise Network table
- Branch Locations table

### 🏢 Franchise Network (`/admin/franchises`) — Super Admin + Company Admin + Franchise Admin
- **Franchises tab**: Card grid with company, contact, branch/staff count. "View branches →" cross-link.
- **Branches tab**: Table with location (city/state/pincode), staff count, shipment count
- Search across both views
- **Create Franchise** form (SUPER_ADMIN / COMPANY_ADMIN)
- **Create Branch** form (+ FRANCHISE_ADMIN)

### 🚚 Multi-Carrier Rate Comparison
- On the Booking Counter, clicking **Compare Carriers & Rates** fetches quotes from **FlightGo Express** and **DHL Express** simultaneously.
- The rates grid shows:
  - Carrier name + service level (e.g. "DHL Express Worldwide", "DHL Express 12:00")
  - Base rate, tax (18% GST), and total amount
  - Estimated transit days
  - Results sorted cheapest first
- Selecting DHL and confirming the booking calls the **MyDHL Express Shipment API** to generate a real AWB number starting with `JD`.
- If DHL credentials are not configured, realistic mock data is returned automatically.

### 🏷️ AWB PDF Labels
- Generated server-side using `pdfkit` — no client dependencies.
- **FlightGo bookings**: Blue header, `FG-...` AWB number.
- **DHL bookings**: Red header reading "DHL EXPRESS", `JD...` tracking number.
- Download from shipments list or immediately after booking.

---

## Organisational Hierarchy

```
Company  (e.g. FlightGo India Pvt Ltd)
 └── Franchise  (e.g. Goa Premium Franchise)
      └── Branch  (e.g. Panaji Central Branch)
           └── Branch Staff  (counter operators)
```

| Action | Who can do it |
|--------|--------------|
| Create Company | Sign Up (`/signup`) or Super Admin via API |
| Create Franchise | Super Admin, Company Admin (Franchise Network page) |
| Create Branch | Super Admin, Company Admin, Franchise Admin |
| Create User | Super Admin, Company Admin, Franchise Admin (Users Directory page) |
| Book Shipment | Branch Staff, Super Admin |
| Recharge Wallet | Super Admin (Global Settings) |
| Deactivate User | Super Admin, Company Admin |

---

## API Reference

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/auth/register` | POST | Public | Create new company + admin account |
| `/api/auth/login` | POST | Public | Login → get JWT tokens |
| `/api/auth/refresh` | POST | Public | Refresh access token |
| `/api/auth/logout` | POST | Bearer | Logout |
| `/api/rates/check` | POST | Bearer | Get live carrier rate quotes |
| `/api/shipments/wallet` | GET | Bearer | Get wallet balance |
| `/api/shipments/book` | POST | Bearer | Book a shipment |
| `/api/shipments` | GET | Bearer | List shipments (role-scoped) |
| `/api/shipments/:id/label` | GET | Public | Download AWB PDF |
| `/api/admin/stats` | GET | Bearer | Platform statistics |
| `/api/admin/users` | GET | Bearer | List users (role-scoped) |
| `/api/admin/users` | POST | Bearer | Create a new user (role-scoped validation) |
| `/api/admin/users/:id/toggle-status` | PATCH | Bearer | Activate/deactivate user |
| `/api/admin/analytics` | GET | Bearer | Real-time booking trends, revenue, and carrier breakdown |
| `/api/admin/companies` | GET | Bearer | Companies + wallet balances |
| `/api/admin/wallet/recharge` | POST | Bearer | Recharge company wallet |
| `/api/admin/franchises` | GET | Bearer | List franchises |
| `/api/admin/franchises` | POST | Bearer | Create franchise |
| `/api/admin/branches` | GET | Bearer | List branches |
| `/api/admin/branches` | POST | Bearer | Create branch |

---

## Dark / Light Mode

- **Landing Page**: Toggle in navbar (top-right)
- **Login / Sign Up**: Toggle button (top-right corner)
- **Dashboard**: Toggle in header (sun/moon icon)
- Theme is persisted in browser `localStorage`

---

## Production Deployment (Kamal)

```bash
cp .kamal/secrets.example .kamal/secrets
# Fill in production credentials

kamal deploy       # Deploy to server
kamal app logs     # View live logs
```

See `.kamal/deploy.yml` for server configuration.
