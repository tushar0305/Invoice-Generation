'use server';

import {
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getFirestore,
  writeBatch,
  serverTimestamp,
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { initializeFirebase } from '@/firebase';
import type { Invoice, InvoiceItem } from './definitions';
import { revalidatePath } from 'next/cache';

function getDb() {
  return initializeFirebase().firestore;
}

function getUserId() {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) {
    // In a real app, you'd want more robust error handling or redirection.
    // For now, we'll throw an error, as this function should only be called
    // in a context where a user is expected to be logged in.
    throw new Error('User not authenticated. Cannot perform data operations.');
  }
  return user.uid;
}

export async function getInvoices(): Promise<Invoice[]> {
  const db = getDb();
  const userId = getUserId();
  const invoicesCol = collection(db, 'invoices');
  const q = query(invoicesCol, where('userId', '==', userId));
  const invoiceSnapshot = await getDocs(q);
  const invoices = await Promise.all(
    invoiceSnapshot.docs.map(async (doc) => {
      const invoiceData = doc.data() as Omit<Invoice, 'id' | 'items'>;
      const itemsCol = collection(db, `invoices/${doc.id}/items`);
      const itemsSnapshot = await getDocs(itemsCol);
      const items = itemsSnapshot.docs.map(
        (itemDoc) => ({ ...itemDoc.data(), id: itemDoc.id }) as InvoiceItem
      );
      return {
        ...invoiceData,
        id: doc.id,
        items,
      };
    })
  );
  return invoices;
}

export async function getInvoiceById(id: string): Promise<Invoice | undefined> {
  const db = getDb();
  const userId = getUserId();
  const invoiceDocRef = doc(db, 'invoices', id);
  const invoiceDoc = await getDoc(invoiceDocRef);

  if (!invoiceDoc.exists() || invoiceDoc.data().userId !== userId) {
    return undefined;
  }

  const invoiceData = invoiceDoc.data() as Omit<Invoice, 'id' | 'items'>;
  const itemsCol = collection(db, `invoices/${id}/items`);
  const itemsSnapshot = await getDocs(itemsCol);
  const items = itemsSnapshot.docs.map(
    (itemDoc) => ({ ...itemDoc.data(), id: itemDoc.id }) as InvoiceItem
  );

  return {
    ...invoiceData,
    id: invoiceDoc.id,
    items,
  };
}

export async function getNextInvoiceNumber(): Promise<string> {
  const db = getDb();
  const userId = getUserId();
  const invoicesCol = collection(db, 'invoices');
  const q = query(invoicesCol, where('userId', '==', userId));
  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    return 'INV-2024-001';
  }

  const latestInvoiceNumber = snapshot.docs
    .map((doc) => parseInt(doc.data().invoiceNumber.split('-')[2]))
    .reduce((max, current) => Math.max(max, current), 0);

  const nextNumber = latestInvoiceNumber + 1;
  return `INV-2024-${String(nextNumber).padStart(3, '0')}`;
}

export async function saveInvoice(
  invoiceData: Omit<Invoice, 'id' | 'invoiceNumber'> & { id?: string }
): Promise<Invoice> {
  const db = getDb();
  const userId = getUserId();
  const batch = writeBatch(db);

  let invoiceId = invoiceData.id;
  let invoiceNumber = '';

  if (invoiceId) {
    // Update existing invoice
    const existingInvoice = await getInvoiceById(invoiceId);
    if (!existingInvoice) {
      throw new Error('Invoice not found for update');
    }
    invoiceNumber = existingInvoice.invoiceNumber;
    const invoiceDocRef = doc(db, 'invoices', invoiceId);
    const { items, ...invoiceToUpdate } = invoiceData;
    batch.update(invoiceDocRef, { ...invoiceToUpdate, updatedAt: serverTimestamp() });

    // Handle items update (simple overwrite for now)
    const itemsCol = collection(db, `invoices/${invoiceId}/items`);
    const existingItems = await getDocs(itemsCol);
    existingItems.docs.forEach((d) => batch.delete(d.ref));
    invoiceData.items.forEach((item) => {
      const itemDocRef = doc(itemsCol, item.id);
      batch.set(itemDocRef, item);
    });
  } else {
    // Create new invoice
    invoiceId = doc(collection(db, 'invoices')).id;
    invoiceNumber = await getNextInvoiceNumber();
    const invoiceDocRef = doc(db, 'invoices', invoiceId);
    const { items, ...invoiceToCreate } = invoiceData;
    batch.set(invoiceDocRef, {
      ...invoiceToCreate,
      id: invoiceId,
      invoiceNumber: invoiceNumber,
      userId: userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    
    // Add items to subcollection
    const itemsCol = collection(db, `invoices/${invoiceId}/items`);
    invoiceData.items.forEach(item => {
        const itemDocRef = doc(itemsCol, item.id);
        batch.set(itemDocRef, item);
    });
  }

  await batch.commit();

  revalidatePath('/dashboard/invoices');
  revalidatePath(`/dashboard/invoices/${invoiceId}/view`);
  revalidatePath('/dashboard');

  const savedInvoice = await getInvoiceById(invoiceId);
  if (!savedInvoice) {
    throw new Error('Failed to retrieve saved invoice.');
  }
  return savedInvoice;
}

export async function deleteInvoice(invoiceId: string): Promise<void> {
  const db = getDb();
  const userId = getUserId();
  const invoiceDocRef = doc(db, 'invoices', invoiceId);
  const invoiceDoc = await getDoc(invoiceDocRef);

  if (!invoiceDoc.exists() || invoiceDoc.data().userId !== userId) {
    throw new Error("Invoice not found or you don't have permission to delete it.");
  }
  
  // Firestore doesn't automatically delete subcollections, so we do it manually.
  const batch = writeBatch(db);
  const itemsColRef = collection(db, `invoices/${invoiceId}/items`);
  const itemsSnapshot = await getDocs(itemsColRef);
  itemsSnapshot.docs.forEach(doc => batch.delete(doc.ref));

  // Delete the main invoice document
  batch.delete(invoiceDocRef);

  await batch.commit();
  
  revalidatePath('/dashboard/invoices');
  revalidatePath('/dashboard');
}