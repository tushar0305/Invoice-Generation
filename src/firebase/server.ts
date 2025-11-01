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

let adminApp: App | undefined;

/**
 * Initializes the Firebase Admin SDK if not already initialized.
 * This is a server-side only function.
 */
function initializeAdminApp() {
  if (getApps().length > 0) {
    adminApp = getApps()[0];
    return;
  }
  
  // Use service account credentials directly.
  if (serviceAccount.privateKey && serviceAccount.clientEmail && serviceAccount.projectId) {
    adminApp = initializeApp({
      credential: cert(serviceAccount),
      projectId: firebaseConfig.projectId,
    });
  } else {
      // This path will be taken if environment variables are not set.
      // In a production environment, you should ensure these are always available.
      throw new Error("Firebase Admin initialization failed. Service account credentials are not available in environment variables.");
  }
}

/**
 * Gets the initialized Firebase Admin SDK instances.
 * @returns An object containing the Firestore instance.
 */
export function getFirebaseAdmin() {
  if (!adminApp) {
    initializeAdminApp();
  }
  // At this point, adminApp is guaranteed to be initialized if no error was thrown.
  return {
    firestore: getFirestore(adminApp!),
  };
}
