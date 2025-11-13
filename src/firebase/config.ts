const cfg = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Dev-time safety: Surface a clear error if env vars are missing
if (typeof window !== 'undefined') {
  const missing = Object.entries(cfg)
    .filter(([_, v]) => !v)
    .map(([k]) => k);
  if (missing.length) {
    // Throwing here makes the problem obvious during local dev
    // and prevents confusing auth/invalid-credential errors later.
    throw new Error(
      `Missing Firebase client env vars: ${missing.join(', ')}.\n` +
      'Add them to .env.local (see .env.local.example) and restart the dev server.'
    );
  }
}

export const firebaseConfig = cfg as {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
};
