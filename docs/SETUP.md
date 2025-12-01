# Setup Guide for Invoice-Generation

## Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account (free tier works)

## Quick Start

### 1. Environment Setup

Copy `.env.local.example` to `.env.local` and fill in your Supabase credentials:

```bash
cp .env.local.example .env.local
```

Then edit `.env.local`:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

Find these values in your Supabase project:
- **Project URL**: Settings → General → Project URL
- **Anon Key**: Settings → API → `anon` key

### 2. Create Supabase Schema

The schema must be created in your Supabase database before the app can work.

#### Option A: Automatic Verification (Recommended)

Run the verification script to check your setup:

```bash
node scripts/verify-supabase.js
```

This will:
- ✅ Verify your environment variables are set
- ✅ Confirm the schema file exists
- 📋 Show manual setup instructions

#### Option B: Manual Setup

1. Open your Supabase project: https://app.supabase.com
2. Go to **SQL Editor** → Click **New Query**
3. Copy the entire contents of `docs/supabase.sql`
4. Paste into the query editor
5. Click **Run**

This creates:
- `stock_items` — Manage jewelry inventory
- `invoices` — Store invoice records
- `invoice_items` — Individual items in each invoice
- `user_settings` — Shop and tax configuration
- All necessary Row Level Security (RLS) policies

### 3. Install Dependencies

```bash
npm install
```

### 4. Start Development Server

```bash
npm run dev
```

The app will be available at **http://localhost:9002**

## First Use

### Create an Account

1. Go to http://localhost:9002/login
2. Click "Create an account"
3. Verify your email (check spam folder)
4. Sign in

### Add Stock Items

1. Go to **Dashboard** → **Stock Management**
2. Click **+ Add Stock** button
3. Fill in item details (name, purity, price, quantity)
4. Click **Save**

### Create an Invoice

1. Go to **Dashboard** → **Invoices** → **Create Invoice**
2. Enter customer details
3. Click **+ Add Item** and select items from stock
4. Review totals (with SGST/CGST applied)
5. Click **Create Invoice**

### Configure Settings

1. Go to **Dashboard** → **Settings**
2. Fill in shop name, GST number, PAN, tax rates, etc.
3. Click **Save Settings**
4. These values auto-populate new invoices

## Troubleshooting

### Error: "Could not find the table 'public.invoices'"

**Solution**: Schema not created yet. Run the setup instructions in step 2 above.

### Error: "Email not confirmed"

**Solution**: Check your email (including spam) for the verification link from Supabase. Click it to confirm your account.

### Error: "Invalid login credentials"

**Solution**: Check your email and password. If forgotten, sign up with a new account.

### Stuck on login screen

**Solution**: 
- Ensure `.env.local` has correct Supabase URL and anon key
- Check browser console for errors (F12 → Console tab)
- Verify your internet connection

## Build for Production

```bash
npm run build
npm start
```

## Available Scripts

- `npm run dev` — Start dev server with Turbopack
- `npm run build` — Create production build
- `npm start` — Run production server
- `npm run lint` — Run ESLint
- `npm run typecheck` — Run TypeScript type checking

## Technologies Used

- **Frontend**: Next.js 15 (Turbopack), React 18, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + RLS)
- **Forms**: React Hook Form + Zod validation
- **UI**: Radix UI components
- **Charts**: Recharts
- **Export**: XLSX for Excel, jsPDF for PDFs

## Project Structure

```
src/
├── app/              # Next.js 15 App Router
├── components/       # Reusable React components
├── hooks/           # Custom React hooks
├── lib/             # Utilities and definitions
└── supabase/        # Supabase client & provider
docs/
├── supabase.sql     # Database schema (run this!)
└── backend.json     # API documentation
```

## API Routes (Optional)

To add server-side API endpoints:

```
src/app/api/[route]/route.ts
```

Example with Supabase service role:

```typescript
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE!
  );
  // Your logic here
}
```

## Support & Issues

For issues or feature requests, check the repository or contact the maintainer.

---

**Happy invoicing! 🎉**
