import { initializeApp, getApps, App, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { firebaseConfig } from './config';

// IMPORTANT: Do not expose this to the client-side.
// This is a server-only file.
const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
};

let adminApp: App;

/**
 * Initializes the Firebase Admin SDK if not already initialized.
 * This is a server-side only function.
 */
async function initializeAdminApp() {
  if (getApps().length > 0) {
    adminApp = getApps()[0];
    return;
  }
  
  try {
     // Try to initialize using Application Default Credentials (common in Cloud environments)
    adminApp = initializeApp();
  } catch (e) {
    console.warn("Could not initialize Firebase with Application Default Credentials. Falling back to service account.");
    // Fallback to service account key if ADC fails or is not configured.
    // This is common for local development.
    if (serviceAccount.privateKey && serviceAccount.clientEmail && serviceAccount.projectId) {
      adminApp = initializeApp({
        credential: cert(serviceAccount),
        projectId: firebaseConfig.projectId,
      });
    } else {
        throw new Error("Firebase Admin initialization failed. Service account credentials are not available.");
    }
  }
}

/**
 * Gets the initialized Firebase Admin SDK instances.
 * @returns An object containing the Firestore instance.
 */
export async function getFirebaseAdmin() {
  if (!adminApp) {
    await initializeAdminApp();
  }
  return {
    firestore: getFirestore(adminApp),
  };
}
