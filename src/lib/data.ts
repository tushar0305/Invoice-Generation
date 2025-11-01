'use server';

import { getFirebaseAdmin } from '@/firebase/server';
import type { Invoice, InvoiceItem } from './definitions';
import { revalidatePath } from 'next/cache';
import { FieldValue } from 'firebase-admin/firestore';

// Mock user ID since login is disabled.
// In a real app, this would come from a real authentication system.
const MOCK_USER_ID = 'user-test-123';

async function getDb() {
  const { firestore } = await getFirebaseAdmin();
  return firestore;
}

function getUserId() {
  // Using a mock user ID because authentication is currently disabled.
  // When you re-enable login, you would replace this with a real call
  // to get the authenticated user's ID, probably from next-auth or similar.
  return MOCK_USER_ID;
}

export async function getInvoices(): Promise<Invoice[]> {
  const db = await getDb();
  const userId = getUserId();
  const invoicesCol = db.collection('invoices');
  const q = invoicesCol.where('userId', '==', userId);
  const invoiceSnapshot = await q.get();

  const invoices = await Promise.all(
    invoiceSnapshot.docs.map(async (doc) => {
      const invoiceData = doc.data() as Omit<Invoice, 'id' | 'items'>;
      const itemsCol = db.collection(`invoices/${doc.id}/items`);
      const itemsSnapshot = await itemsCol.get();
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
  const db = await getDb();
  const userId = getUserId();
  const invoiceDocRef = db.collection('invoices').doc(id);
  const invoiceDoc = await invoiceDocRef.get();

  if (!invoiceDoc.exists || invoiceDoc.data()?.userId !== userId) {
    return undefined;
  }

  const invoiceData = invoiceDoc.data() as Omit<Invoice, 'id' | 'items'>;
  const itemsCol = db.collection(`invoices/${id}/items`);
  const itemsSnapshot = await itemsCol.get();
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
  const db = await getDb();
  const userId = getUserId();
  const invoicesCol = db.collection('invoices');
  const q = invoicesCol.where('userId', '==', userId);
  const snapshot = await q.get();

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
  const db = await getDb();
  const userId = getUserId();
  const batch = db.batch();

  let invoiceId = invoiceData.id;
  let invoiceNumber = '';

  if (invoiceId) {
    // Update existing invoice
    const existingInvoice = await getInvoiceById(invoiceId);
    if (!existingInvoice) {
      throw new Error('Invoice not found for update');
    }
    invoiceNumber = existingInvoice.invoiceNumber;
    const invoiceDocRef = db.collection('invoices').doc(invoiceId);
    const { items, ...invoiceToUpdate } = invoiceData;
    batch.update(invoiceDocRef, { ...invoiceToUpdate, updatedAt: FieldValue.serverTimestamp() });

    // Handle items update (simple overwrite for now)
    const itemsCol = db.collection(`invoices/${invoiceId}/items`);
    const existingItems = await itemsCol.get();
    existingItems.docs.forEach((d) => batch.delete(d.ref));
    invoiceData.items.forEach((item) => {
      const itemDocRef = itemsCol.doc(item.id);
      batch.set(itemDocRef, item);
    });
  } else {
    // Create new invoice
    const newInvoiceRef = db.collection('invoices').doc();
    invoiceId = newInvoiceRef.id;
    invoiceNumber = await getNextInvoiceNumber();
    const { items, ...invoiceToCreate } = invoiceData;
    
    batch.set(newInvoiceRef, {
      ...invoiceToCreate,
      id: invoiceId,
      invoiceNumber: invoiceNumber,
      userId: userId,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    
    // Add items to subcollection
    const itemsCol = db.collection(`invoices/${invoiceId}/items`);
    invoiceData.items.forEach(item => {
        const itemDocRef = itemsCol.doc(item.id);
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
  const db = await getDb();
  const userId = getUserId();
  const invoiceDocRef = db.collection('invoices').doc(invoiceId);
  const invoiceDoc = await invoiceDocRef.get();

  if (!invoiceDoc.exists || invoiceDoc.data()?.userId !== userId) {
    throw new Error("Invoice not found or you don't have permission to delete it.");
  }
  
  // Firestore doesn't automatically delete subcollections, so we do it manually.
  const batch = db.batch();
  const itemsColRef = db.collection(`invoices/${invoiceId}/items`);
  const itemsSnapshot = await itemsColRef.get();
  itemsSnapshot.docs.forEach(doc => batch.delete(doc.ref));

  // Delete the main invoice document
  batch.delete(invoiceDocRef);

  await batch.commit();
  
  revalidatePath('/dashboard/invoices');
  revalidatePath('/dashboard');
}
