# Sqooli Partner Portal

A web application for managing Sqooli partner organizations — enabling partners to run campaigns, manage users, track transactions, and handle wallet operations.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Authentication](#authentication)
- [Roles & Permissions](#roles--permissions)
- [Core Modules](#core-modules)
- [Database Schema](#database-schema)
- [Convex Backend](#convex-backend)
- [Environment Variables](#environment-variables)
- [Known Issues & Pending Work](#known-issues--pending-work)

---

## Overview

The Sqooli Partner Portal is a multi-tenant dashboard that allows partner organizations to:

- Create and manage marketing campaigns with promo codes and QR codes
- Enroll students into educational programs
- Track M-Pesa payment transactions
- Manage wallet balances and withdrawals
- Control user access through a fine-grained permission system
- View dashboards and revenue reports

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + TypeScript + Vite 7 |
| Styling | Tailwind CSS v4 + Radix UI + shadcn/ui |
| Animations | Framer Motion |
| Backend / DB | Convex (serverless, real-time) |
| Auth | Convex session-based auth (bcrypt + session tokens) |
| Charts | Recharts |
| QR Codes | `qrcode` npm library |
| Routing | React Router v7 |
| Notifications | Sonner (toast) |

---

## Project Structure

```
sqoolipartner/
├── convex/                    # Backend — Convex functions & schema
│   ├── schema.ts              # Database schema definitions
│   ├── http.ts                # HTTP router (stub — payment endpoints pending)
│   ├── user.ts                # User CRUD + login (bcrypt)
│   ├── session.ts             # Session creation & validation
│   ├── partner.ts             # Partner org CRUD
│   ├── createPartner.ts       # Partner + admin user creation
│   ├── createSuperAdmin.ts    # Super admin creation
│   ├── campaign.ts            # Campaign CRUD + QR code generation
│   ├── transactions.ts        # Transaction CRUD
│   ├── wallet.ts              # Wallet management
│   ├── withdrawals.ts         # Withdrawal requests
│   ├── withdrawalLimits.ts    # Withdrawal limit configuration
│   ├── notifications.ts       # In-app notifications
│   ├── inquiries.ts           # Partnership inquiry form
│   ├── permission.ts          # Permission queries
│   ├── role.ts                # Role management
│   ├── audit.ts               # Audit log creation
│   ├── channel.ts             # Partner channels
│   ├── program.ts             # Educational program CRUD
│   ├── curricula.ts           # Curriculum CRUD
│   ├── subjects.ts            # Subject CRUD
│   ├── promoCode.ts           # Promo code management
│   ├── partner_revenue.ts     # Revenue split logging
│   ├── seedPermissions.ts     # One-time permission seeding
│   └── seedRoles.ts           # One-time role seeding
│
├── src/
│   ├── App.tsx                # Route definitions
│   ├── main.tsx               # App entry point
│   ├── pages/
│   │   ├── Hero.tsx           # Public landing page
│   │   ├── SignIn.tsx         # Login page
│   │   ├── Dashboard.tsx      # Main dashboard (permission-gated sections)
│   │   └── Onboarding.tsx     # First-login onboarding flow
│   ├── sections/              # Dashboard tab sections
│   │   ├── DashboardSection.tsx
│   │   ├── CampaignSection.tsx
│   │   ├── WalletSection.tsx
│   │   ├── UserSection.tsx
│   │   ├── ProgramSection.tsx
│   │   ├── SettingsSection.tsx
│   │   ├── ReportsSection.tsx
│   │   └── LockedSection.tsx
│   ├── components/
│   │   ├── layout/            # Header, Sidebar, DashboardLayout, HeroHeader
│   │   ├── common/            # Dialogs, cards, and shared UI components
│   │   ├── ui/                # shadcn/ui base components
│   │   ├── icons/             # Custom SVG icon components
│   │   └── landing/           # Landing page components
│   ├── hooks/
│   │   ├── useAuth.ts         # Session validation + user/partner state
│   │   ├── usePermission.ts   # Permission checks
│   │   ├── useTheme.ts        # Theme management
│   │   └── useActivityTracker.ts
│   ├── context/
│   │   ├── PermissionProvider.tsx
│   │   ├── PermissionContext.tsx
│   │   ├── ThemeProvider.tsx
│   │   └── ThemeContext.tsx
│   ├── services/
│   │   ├── qrCodeService.ts   # QR code generation (data URLs via qrcode lib)
│   │   └── socialPostGenerator.ts  # Cloudinary URL builder for social assets
│   ├── types/
│   │   └── auth.types.ts      # TypeScript types for auth state
│   └── utils/
│       └── formatters.ts      # formatCurrency, formatDate, getInitials, etc.
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- A Convex account ([convex.dev](https://www.convex.dev))

### Installation

```bash
# Install dependencies
npm install

# Start the Convex development server (in a separate terminal)
npx convex dev

# Start the frontend dev server
npm run dev
```

### First-Time Setup

1. Seed permissions (run once via Convex dashboard or CLI):
   ```bash
   npx convex run seedPermissions:seedPermissions
   ```

2. Seed default roles:
   ```bash
   npx convex run seedRoles:seedDefaultRoles
   ```

3. Create a super admin:
   ```bash
   npx convex run createSuperAdmin:createSuperAdminUser \
     '{"email":"admin@sqooli.com","name":"Super Admin","password":"YourSecurePassword"}'
   ```

4. Create a partner organization (via super admin dashboard or CLI):
   ```bash
   npx convex run createPartner:createPartner \
     '{"name":"Partner Org","email":"partner@org.com","phone":"0700000000","username":"partnerorg"}'
   ```

### Build

```bash
npm run build
```

---

## Authentication

Authentication is fully self-contained in Convex — no external auth provider.

### Flow

```
User submits email + password
        |
user.login mutation → bcrypt.compare(password, hash)
        |
session.createSession → generates 64-char token, stored in sessions table (2hr TTL)
        |
Token stored in convex_session cookie (SameSite=Lax, 2hr max-age)
        |
useAuth hook → reads cookie → validateSession mutation → returns user + partner
        |
ProtectedRoute → redirects to /signIn if no valid session
```

### Session Management

- Sessions expire after **2 hours**
- On expiry, the cookie is cleared and the user is redirected to `/signIn`
- Session validation runs once per page load (not on every render)

---

## Roles & Permissions

The platform uses a two-layer access control system:

### User Roles

| Role | Description |
|------|-------------|
| `super_admin` | Full system access across all partners |
| `partner_admin` | Full access within their partner org |
| `accountant` | Wallet and financial operations |
| `campaign_manager` | Campaign creation and management |
| `viewer` | Read-only access |
| `super_agent` | Agent management |
| `master_agent` | Sub-agent oversight |
| `merchant_admin` | Merchant-level operations |

### Permission Categories

| Category | Covers |
|----------|--------|
| `dashboard` | Dashboard and reports views |
| `campaigns` | Campaign CRUD |
| `programs` | Program and curriculum management |
| `wallet` | Wallet and withdrawal operations |
| `users` | User management |
| `settings` | Organization settings |
| `all_access` | Full admin access (bypasses all checks) |

Permission levels: `read`, `write`, `admin`, `full`

---

## Core Modules

### Campaigns

- Partners create campaigns linked to a program and optionally a channel
- Each campaign has a promo code, revenue share config, bundled offer pricing, and duration
- QR codes and social post assets are generated per campaign
- Multiple promo codes can be attached to a single campaign (e.g., per radio station)

### Transactions

- Records M-Pesa payments from students: `student_name`, `phone_number`, `mpesa_code`, `amount`, `campaign_code`
- Indexed by `mpesa_code` to prevent duplicates
- Status: `pending` | `Success` | `Failed`
- Payment reception via HTTP endpoint is **pending implementation** (`convex/http.ts`)

### Wallet

- Each partner has a wallet with balance, pending balance, and lifetime earnings
- Supports M-Pesa, bank transfer, and paybill withdrawal methods
- PIN-protected withdrawals with configurable daily/monthly limits
- Revenue split is logged per transaction in `partner_revenue_logs`

### Programs

- Programs are structured under curricula and contain subjects with timetables
- Partners link campaigns to specific programs for enrollment tracking

### Users

- Partners manage their own users within the platform
- User creation generates a temporary password and flags `is_first_login`
- Users are activated/deactivated by partner admins

---

## Database Schema

Key tables in Convex:

| Table | Key Fields |
|-------|-----------|
| `partners` | `name`, `email`, `phone`, `username`, `permission_ids` |
| `users` | `partner_id`, `email`, `password_hash`, `role`, `extension`, `is_active` |
| `sessions` | `user_id`, `token`, `expires_at` |
| `permissions` | `key`, `name`, `category`, `level`, `is_default` |
| `roles` | `name`, `display_name`, `permission_ids`, `is_system_role` |
| `campaigns` | `partner_id`, `program_id`, `promo_code`, `revenue_share`, `status` |
| `promo_codes` | `campaign_id`, `code`, `label`, `is_active` |
| `transactions` | `mpesa_code`, `amount`, `campaign_code`, `partner_id`, `status` |
| `wallets` | `partner_id`, `balance`, `pending_balance`, `withdrawal_method`, `pin` |
| `withdrawals` | `wallet_id`, `amount`, `status`, `reference_number` |
| `programs` | `name`, `curriculum_id`, `pricing`, `subjects`, `timetable` |
| `assets` | `campaign_id`, `type` (qr_code / social_post / flyer), `url` |
| `notifications` | `partnerId`, `type`, `title`, `message`, `isRead` |
| `channels` | `partnerId`, `name`, `code`, `subchannels` |
| `audit_logs` | `user_id`, `action`, `entity_type`, `details` |
| `partner_inquiries` | `org_name`, `email`, `partnership_type`, `status` |

---

## Convex Backend

All backend logic runs as Convex mutations and queries. There is no separate API server.

### Key Files

| File | Exports |
|------|---------|
| `convex/user.ts` | `login`, `createUser`, `getUser`, `updateUser`, `listUsers` |
| `convex/session.ts` | `createSession`, `validateSession` |
| `convex/partner.ts` | `getAllPartners`, `getById`, `updatePartner` |
| `convex/campaign.ts` | `createCampaign`, `getCampaigns`, `updateCampaign`, `getCampaignByPromoCode` |
| `convex/transactions.ts` | `createTransaction`, `getTransactions`, `getTransactionByMpesaCode` |
| `convex/wallet.ts` | `createWallet`, `getWallet`, `updateBalance` |
| `convex/withdrawals.ts` | `requestWithdrawal`, `checkAvailability`, `updateStatus` |
| `convex/http.ts` | HTTP router — stub only, payment endpoints pending |

### Running Convex Functions via CLI

```bash
# Run a mutation directly
npx convex run <filename>:<functionName> '<json-args>'

# Example: promote a user to super admin
npx convex run makeSuperAdmin:promoteToSuperAdmin '{"email":"user@example.com"}'
```

---

## Environment Variables

Create a `.env.local` file in the project root:

```env
VITE_CONVEX_URL=https://your-deployment.convex.cloud
```

Convex automatically provisions the backend URL — find it in your Convex dashboard or `convex/_generated/` after running `npx convex dev`.

---

## Known Issues & Pending Work

| # | Issue | Location |
|---|-------|----------|
| 1 | M-Pesa payment reception not implemented | `convex/http.ts` |
| 2 | QR code generation in a mutation may fail in Convex V8 runtime — should move to a Convex action | `convex/campaign.ts` |
| 3 | `subchanells` typo in schema (requires migration to fix) | `convex/schema.ts` — `channels` table |
| 4 | Session cookie missing `HttpOnly` flag | `src/pages/SignIn.tsx` |
| 5 | Email notifications removed (was Resend) — to be re-implemented | `convex/withdrawals.ts` |
