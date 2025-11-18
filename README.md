# Invoice Generation (Next.js + Supabase)

> A production-ready Next.js 15 (App Router) web app for creating, managing, and printing invoices with Supabase authentication and database.

## Stack

- **Frontend**: Next.js 15 (Turbopack), React 18, TypeScript
- **Backend**: Supabase (PostgreSQL, Auth, Row-Level Security)
- **UI**: Tailwind CSS + shadcn/ui components
- **Export**: XLSX (Excel), jsPDF (PDF), WhatsApp sharing
- **Forms**: React Hook Form + Zod validation
- **Charts**: Recharts for analytics

## Prerequisites

- Node.js 18+ and npm
- A free Supabase account (https://app.supabase.com)

## Quick Setup

### 1. Clone & Install

```bash
git clone <repo-url>
cd Invoice-Generation
npm install
```

### 2. Configure Supabase

1. Create a project at https://app.supabase.com
2. Copy your credentials from **Settings → API**
3. Create `.env.local` with:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Create Database Schema

**Option A: Using the Verification Script (Recommended)**

```bash
node scripts/verify-supabase.js
```

This will:
- ✅ Verify your Supabase credentials
- 📋 Show step-by-step setup instructions
- 🔗 Provide direct link to your Supabase SQL editor

**Option B: Manual Setup**

1. Open your Supabase project dashboard
2. Click **SQL Editor** → **New Query**
3. Copy the entire contents of `docs/supabase.sql`
4. Paste it into the editor and click **Run**

The script creates:
- `stock_items` — Inventory management
- `invoices` — Invoice records
- `invoice_items` — Individual line items per invoice
- `user_settings` — Shop configuration & tax rates
- All Row-Level Security (RLS) policies for data privacy

### 4. Start the Dev Server

```bash
npm run dev
```

Open http://localhost:9002 in your browser.

## First Steps

### Sign Up

1. Go to http://localhost:9002/login
2. Click "Create an account"
3. Enter email and password
4. **Check your email for verification link** (check spam folder!)
5. Click the verification link
6. Sign in

### Create Stock Items

1. Click **Stock Management** in the sidebar
2. Click **+ Add Stock** button
3. Fill in:
   - Item name (e.g., "Gold Ring 22K")
   - Purity (e.g., "22K")
   - Base price
   - Making charge per gram
   - Quantity and unit
4. Click **Save**

### Create Your First Invoice

1. Click **Invoices** → **Create Invoice**
2. Enter customer details
3. Click **+ Add Item** and select from your stock
4. Adjust quantities and rates if needed
5. Review totals (taxes auto-calculated)
6. Choose status (Paid / Due)
7. Click **Create Invoice**

### Configure Settings

1. Click **Settings** in the sidebar
2. Add shop details:
   - Shop name
   - GST/PAN numbers
   - Address & contact
   - Default tax rates (CGST/SGST)
3. Click **Save Settings**
4. These values auto-populate new invoices

## Features

✨ **Invoice Management**
- Create, edit, view, and delete invoices
- Auto-numbered invoices (INV2025001, etc.)
- Support for SGST/CGST tax calculations
- Discount support

📦 **Stock Management**
- Track inventory items
- Purity and making charge support
- Quick item selection when creating invoices

📊 **Dashboard**
- Revenue trends (30-day chart)
- Outstanding due amounts
- Top customers by spend
- Recent invoices

📱 **Multi-Device**
- Fully responsive design
- Mobile-friendly invoice creation
- Print-ready invoice layout

🔗 **Sharing**
- Export invoices as PDF
- Share via WhatsApp with auto-formatted message
- Export all invoices to Excel

🔐 **Security**
- Supabase Row-Level Security (RLS)
- User data isolation
- Email verification
- Session management

## Build & Deploy

### Production Build

```bash
npm run build
npm start
```

### Deploy to Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

Set environment variables in Vercel project settings:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Deploy to Other Platforms

Works with any Node.js hosting (Netlify, Railway, Render, etc.)

## Troubleshooting

### "Could not find the table 'public.invoices'"

**Cause**: Schema not created in Supabase  
**Fix**: Run `node scripts/verify-supabase.js` and follow the instructions to create tables

### "Email not confirmed"

**Cause**: Email verification required  
**Fix**: Check your email (spam folder!) for Supabase verification link and click it

### "Invalid login credentials"

**Cause**: Wrong email/password  
**Fix**: Double-check credentials or create a new account

### Schema check banner at bottom right

If you see a warning banner, the tables don't exist yet. Run the setup script above.

## Project Structure

```
src/
├── app/                    # Next.js 15 App Router
│   ├── dashboard/         # Protected dashboard routes
│   ├── login/            # Auth pages
│   └── layout.tsx        # Root layout with Supabase provider
├── components/           # Reusable React components
│   ├── invoice-form.tsx  # Invoice creation/editing
│   ├── logo.tsx         # Branding
│   └── ui/              # shadcn/ui components
├── hooks/               # Custom React hooks
│   ├── use-stock-items.tsx
│   ├── use-toast.ts
│   └── use-schema-check.tsx
├── lib/                # Utilities
│   ├── definitions.ts  # TypeScript types
│   ├── utils.ts       # Helpers
│   └── pdf.ts         # PDF generation
└── supabase/          # Supabase integration
    ├── client.ts      # Supabase client
    └── provider.tsx   # Auth context provider

docs/
├── supabase.sql      # Database schema (run this!)
└── backend.json      # API reference

scripts/
├── verify-supabase.js    # Setup verification
└── setup-supabase.ts     # Schema setup (advanced)
```

## Available Scripts

```bash
npm run dev        # Start dev server (Turbopack)
npm run build      # Production build
npm start          # Run production server
npm run lint       # Run ESLint
npm run typecheck  # TypeScript type checking
```

## Environment Variables

### Required

- `NEXT_PUBLIC_SUPABASE_URL` — Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon key (safe for browser)

### Optional (for advanced features)

- `SUPABASE_SERVICE_ROLE` — For server-side operations (never expose in client)

## API Reference

See `docs/backend.json` for detailed API documentation.

3. Start the app and sign up/sign in from `/login`.

3) Firebase project and services

- Create or select a Firebase project.
- Enable Authentication > Sign-in method > Email/Password.
- Create Firestore database in production or test mode.
- Add localhost (or your dev host) to Auth > Settings > Authorized domains.

4) Configure Firebase CLI (already included in this repo)

- `.firebaserc` points to: `studio-6737588015-fde4d` (change to your project id if needed)
- `firebase.json` references the root `firestore.rules` file

To switch projects:
```bash
firebase use <your-project-id>
```

5) Deploy Firestore security rules

```bash
firebase deploy --only firestore:rules
```

Security rules summary (see `firestore.rules`):
- Users can only read/write their own invoices (`resource.data.userId == request.auth.uid`)
- Subcollection `invoices/{invoiceId}/invoiceItems` allowed only if parent invoice belongs to the user
- `userSettings/{userId}` readable/writable only by that user

## Run locally

```bash
npm run dev
```
- Dev server runs on http://localhost:9002
- Visit `/login` to sign in or sign up (Email/Password)

## App flow

1) Settings (Dashboard > Settings): define default CGST/SGST. Stored in `userSettings/{uid}`.
2) Create invoice (Dashboard > Invoices > New):
	 - Items include weights, purity, making, rate, etc.
	 - Totals (subtotal, tax, round-off) are computed in-app.
	 - On create, the parent invoice is written first, then items are created. This ordering ensures Firestore rules (which check the parent) allow item writes.
3) View / Print invoice:
	 - View: `/dashboard/invoices/[id]/view`
	 - Print: `/dashboard/invoices/[id]/print` (A4-optimized layout)

## Scripts

```bash
npm run dev         # Start dev server on port 9002
npm run build       # Build for production
npm run start       # Start production server
npm run lint        # Lint
npm run typecheck   # TypeScript checks
```

## Troubleshooting

1) Authentication: `FirebaseError: auth/invalid-credential`
- Ensure `.env.local` has valid `NEXT_PUBLIC_FIREBASE_*` values
- Restart the dev server after updating env vars
- Enable Email/Password sign-in in Firebase

2) Permissions: `Missing or insufficient permissions`
- Make sure Firestore rules are deployed (see above)
- For listing invoices, rules authorize per-document; your queries should filter by `userId`
- Ad blockers can interfere with Firestore long-polling channels; try a private window or disable the blocker for localhost

3) Firestore deploy fails
- Run with debug to see details:
	```bash
	firebase deploy --only firestore:rules --debug
	```
- Ensure your CLI is set to the right project (`firebase use <id>`) and your account has permission to deploy rules

## Project structure (high level)

```
src/
	app/               # Next.js app routes (App Router)
		login/           # Auth UI (email/password)
		dashboard/       # Authenticated area
			invoices/      # List, new, view, edit, print
	components/        # UI + form components (shadcn/ui)
	firebase/          # Client initialization, providers, hooks, Firestore helpers
	lib/               # Types, helpers, actions
firestore.rules      # Firestore security rules
firebase.json        # Firebase CLI config (rules path)
.firebaserc          # Default Firebase project id
```

## Security

- See `SECURITY.md` for details
- This repo is configured to source Firebase config from env vars (see `.env.local.example`)
- Firestore rules enforce strict user ownership and default deny

## License

MIT
