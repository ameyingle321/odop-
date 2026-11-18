# ODOP Nexus — District-Aware Artisan Marketplace

> **ODOP Nexus** is a digital marketplace celebrating India's *One District One Product (ODOP)* initiative. The platform connects consumers directly with authentic regional artisans while enforcing district authenticity, geographic GI-tag heritage, verified-purchase reviews, and secure digital escrow payments.

---

## 🏛️ Core Architectural Principle

> **"A seller and the product they list must strictly belong to the same registered ODOP district."**  
> District authenticity is enforced at both the application business logic layer and via PostgreSQL database triggers and Row-Level Security (RLS) policies.

---

## 🛠️ Technology Stack

| Layer | Technology | Key Features |
| :--- | :--- | :--- |
| **Frontend** | **React 19 + Vite** | Luxury editorial UI inspired by [Skanvi](https://skanvi.com/), Cormorant Garamond & Plus Jakarta Sans typography, custom design tokens, React Router, Context API state management. |
| **Backend** | **Node.js + Express.js (ESM)** | RESTful API, Joi request validation, Winston structured logging, centralized `AppError` handling, CORS. |
| **Database & Auth** | **Supabase (PostgreSQL 15)** | Row Level Security (RLS), ACID transactions, custom triggers, UUID primary keys, Argon2id auth hashing. |
| **Payments** | **Razorpay** | Server-side cryptographic HMAC-SHA256 signature verification, webhook listeners, escrow state handling. |
| **Testing** | **Native Node.js / Axios Test Suite** | 32/32 End-to-End integration tests covering Buyer, Seller, and Security failure scenarios. |

---

## 📂 Project Structure

```text
odop/
├── Docs/                               # Authoritative System & Implementation Documents
│   ├── ODOP_Nexus_PRD.md               # Product Requirements Document
│   ├── ODOP_Nexus_TRD.md               # Technical Requirements Document
│   ├── ODOP_Nexus_System_Design.md     # Architecture & System Design
│   ├── ODOP_Nexus_Master_Implementation_Plan.md # Master 16-Phase Execution Roadmap
│   └── ODOP_Nexus_Supabase_Database_Implementation.md # Database Specification
├── frontend/                           # React 19 Client Application
│   ├── src/
│   │   ├── components/                 # Reusable UI (Navbar, Footer, ProductCard, Badges, Modals)
│   │   ├── context/                    # AuthContext, CartContext, ToastContext
│   │   ├── pages/
│   │   │   ├── public/                 # HomePage, ProductsPage (Catalog), ProductDetailPage
│   │   │   ├── auth/                   # LoginPage, RegisterPage (Buyer & Artisan Seller)
│   │   │   ├── buyer/                  # CartPage, CheckoutPage, OrdersPage, OrderDetailPage
│   │   │   └── seller/                 # SellerDashboardPage, SellerProductsPage, SellerOrdersPage
│   │   ├── services/                   # API clients (auth, product, cart, order, payment, review)
│   │   └── index.css                   # Skanvi design system tokens & luxury styling
│   ├── .env.example
│   ├── package.json
│   ├── vercel.json                     # SPA client-side rewrite configuration
│   └── vite.config.js
├── backend/                            # Express.js REST API
│   ├── src/
│   │   ├── config/                     # Supabase Admin, Env config, Razorpay client
│   │   ├── constants/                  # Order, Product, Seller status enums & transitions
│   │   ├── controllers/                # Thin HTTP controllers (Auth, Seller, Product, Cart, Order, Payment, Review)
│   │   ├── middleware/                 # Auth JWT, Role RBAC, Joi validation, Error handler
│   │   ├── routes/                     # REST route definitions
│   │   ├── services/                   # Business logic layer with validation & DB operations
│   │   ├── utils/                      # AppError, Response wrapper, Winston logger
│   │   ├── validators/                 # Joi input schemas for all endpoints
│   │   ├── app.js                      # Express application assembly
│   │   └── server.js                   # Server entrypoint
│   ├── tests/                          # Automated test suites
│   │   ├── integration_phase10.test.js # Phase 10 integration test runner
│   │   └── e2e_full_journey.test.js    # Phase 11 complete 32-test E2E journey runner
│   ├── .env.example
│   └── package.json
└── database/
    └── migrations/
        └── full_migration.sql          # Complete Supabase schema, RLS policies & constraints
```

---

## ⚡ Quick Start & Local Setup

### 🪟 Windows Quick Launcher (.bat)
For quick setup and running on Windows, an interactive batch script is available in `Docs/run.bat` (or `./run.bat`):
```cmd
# Run interactive management console
Docs\run.bat

# Or run specific commands directly:
Docs\run.bat dev        # Start both frontend & backend concurrently
Docs\run.bat split      # Launch backend & frontend in separate cmd windows
Docs\run.bat backend    # Start Express API server only (port 3000)
Docs\run.bat frontend   # Start Vite frontend client only (port 5173)
Docs\run.bat install    # Install all dependencies across root, backend & frontend
Docs\run.bat test       # Run complete test suite
Docs\run.bat migrate    # Run Supabase database migrations
```

### 1. Prerequisites
- **Node.js** (v18.x or v20.x+)
- **npm** (v9.x+)
- Supabase account or local PostgreSQL instance

### 2. Backend Setup
```bash
cd backend
npm install

# Copy environment variables
cp .env.example .env

# Start development server (runs on http://localhost:3000)
npm run dev
```

### 3. Frontend Setup
```bash
cd frontend
npm install

# Copy environment variables
cp .env.example .env

# Start Vite dev server (runs on http://localhost:5173)
npm run dev
```

### 4. Build for Production
```bash
# Frontend production build
cd frontend
npm run build

# Backend production start
cd backend
npm start
```

---

## 🔐 Environment Variables

### Backend (`backend/.env`)
| Variable | Description |
| :--- | :--- |
| `PORT` | Server listening port (default: `3000`) |
| `NODE_ENV` | `development` or `production` |
| `SUPABASE_URL` | Supabase project URL (`https://<project-ref>.supabase.co`) |
| `SUPABASE_ANON_KEY` | Supabase public anonymous API key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role secret (bypasses RLS server-side) |
| `FRONTEND_URL` | Allowed CORS origin (default: `http://localhost:5173`) |
| `RAZORPAY_KEY_ID` | Razorpay public key ID |
| `RAZORPAY_KEY_SECRET` | Razorpay private secret for HMAC payment verification |
| `RAZORPAY_WEBHOOK_SECRET` | Razorpay webhook cryptographic signing secret |

### Frontend (`frontend/.env`)
| Variable | Description |
| :--- | :--- |
| `VITE_API_URL` | URL to backend REST API (default: `http://localhost:3000/api`) |
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase public anonymous key |
| `VITE_RAZORPAY_KEY_ID` | Razorpay public key ID for checkout gateway modal |

---

## 🔄 Core Business Workflows & State Machines

### Order Fulfillment Lifecycle
```text
PENDING_PAYMENT ──(payment verified)──► CONFIRMED ──(artisan starts)──► PROCESSING
                                                                             │
DELIVERED ◄──(carrier delivers)── SHIPPED ◄─────────────────────────────────┘
    │
    └──► Verified Review Gated Unlock (Buyer can now post 1–5 star review)
```

### Server Price Authority
The client application **never** submits prices for orders. The backend queries canonical product prices directly from the database, calculates item line totals, subtotal, and tax, and snapshots them immutably into `order_items`.

---

## 🧪 Automated Testing

ODOP Nexus includes automated testing covering all layers:

```bash
cd backend

# Run the complete 32-test End-to-End suite
npm run test:e2e

# Run all test suites
npm test
```

### E2E Test Coverage (32/32 Passing)
- **Reference & Discovery:** Active districts, categories, full-text catalog search, multi-faceted filtering.
- **Seller Flow:** Registration with district association, profile setup, product creation, catalog listing, fulfillment state management.
- **Buyer Flow:** Registration, login, cart synchronization, server-side checkout calculation, Razorpay order initialization.
- **Verified Reviews:** Reviews unlock exclusively after order delivery; prevents unverified reviews, duplicate reviews, and reviews on unpurchased items.
- **Negative Security Checks:** Duplicate emails (409), weak passwords (422), unauthenticated requests (401), unauthorized role operations (403), malformed/fake UUIDs (400/404), tampered payment signatures (400).

---

## 🚀 Deployment Guide

1. **Database:** Execute `database/migrations/full_migration.sql` in your Supabase SQL Editor.
2. **Backend:** Deploy to Render, Railway, AWS ECS, or Fly.io using `npm start` with environment variables.
3. **Frontend:** Deploy to Vercel, Netlify, or Cloudflare Pages with `vercel.json` rewrite rules configured.
4. **CORS:** Ensure `FRONTEND_URL` in backend matches your production frontend domain.

---

## 📜 Master Implementation Plan Roadmap

- [x] **Phase 0 — Project Initialization**
- [x] **Phase 1 — Supabase Database Architecture & Constraints**
- [x] **Phase 2 — Backend API Foundation & Express Scaffolding**
- [x] **Phase 3 — Authentication & Role-Based Access Control**
- [x] **Phase 4 — Seller Product & Profile Management System**
- [x] **Phase 5 — Buyer & District Product Discovery**
- [x] **Phase 6 — Cart & Order Management System**
- [x] **Phase 7 — Razorpay Cryptographic Payment Integration**
- [x] **Phase 8 — Verified Reviews & Ratings System**
- [x] **Phase 9 — Skanvi-Inspired Frontend Design & Luxury UX**
- [x] **Phase 10 — Full System Multi-Tier Integration**
- [x] **Phase 11 — End-to-End Testing (32/32 Passing)**
- [x] **Phase 12 — Security & Vulnerability Review**
- [x] **Phase 13 — Performance & Quality Review**
- [x] **Phase 14 — Deployment Preparation & Configuration**
- [x] **Phase 15 — Final Production Documentation**
