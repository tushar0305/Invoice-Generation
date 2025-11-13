# Invoice Generation (Next.js + Firebase)

>A production-ready Next.js (App Router) app for creating, managing, and printing invoices with Firebase Auth and Firestore.

## Stack

- Next.js 15 (App Router) + React 18 + TypeScript
- Firebase (Auth, Firestore)
- Tailwind CSS + shadcn/ui
- date-fns, lucide-react icons

## Prerequisites

- Node.js 18+ and npm
- Firebase CLI installed and logged in
	```bash
	npm i -g firebase-tools
	firebase login
	```

## Setup

1) Install dependencies
```bash
npm install
```

2) Environment variables

- Copy `.env.local.example` to `.env.local` and fill the values from your Firebase project settings (Project settings > General > Your apps).
- Required client env vars:
	- `NEXT_PUBLIC_FIREBASE_API_KEY`
	- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
	- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
	- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
	- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
	- `NEXT_PUBLIC_FIREBASE_APP_ID`

- Optional server-only (Admin SDK) env vars (if/when you add server code):
	- `FIREBASE_PROJECT_ID`
	- `FIREBASE_CLIENT_EMAIL`
	- `FIREBASE_PRIVATE_KEY`

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
