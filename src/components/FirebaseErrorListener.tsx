'use client';

import { useState, useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

/**
 * An invisible component that listens for globally emitted 'permission-error' events.
 * It throws any received error to be caught by Next.js's global-error.tsx.
 */
export function FirebaseErrorListener() {
  // Use the specific error type for the state for type safety.
  const [error, setError] = useState<FirestorePermissionError | null>(null);

  useEffect(() => {
    // The callback now expects a strongly-typed error, matching the event payload.
    const handleError = (error: FirestorePermissionError) => {
      // Set error in state to trigger a re-render.
      setError(error);
    };

    // The typed emitter will enforce that the callback for 'permission-error'
    // matches the expected payload type (FirestorePermissionError).
    errorEmitter.on('permission-error', handleError);

    // Unsubscribe on unmount to prevent memory leaks.
    return () => {
      errorEmitter.off('permission-error', handleError);
    };
  }, []);

  // On re-render, if an error exists in state, throw it.
  if (error) {
    // Temporary mitigation: don't crash the app if reading userSettings is blocked.
    // The create-invoice flow can still proceed with default tax values.
    // Once Firestore rules are successfully deployed, this suppression can be removed.
    const path = (error as any)?.request?.path as string | undefined;
    if (path && (path.includes('/documents/userSettings/') || path.includes('/documents/stockItems'))) {
      if (typeof window !== 'undefined') {
        // eslint-disable-next-line no-console
        console.warn('Suppressed Firestore permission error for path:', path);
      }
      return null;
    }

    throw error;
  }

  // This component renders nothing.
  return null;
}
