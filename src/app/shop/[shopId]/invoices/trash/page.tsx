/**
 * Trash Page - Deleted Invoices View
 * Shows soft-deleted invoices with restore functionality
 */

import { TrashClient } from './trash-client';

export default async function TrashPage({
    params,
}: {
    params: Promise<{ shopId: string }>;
}) {
    const { shopId } = await params;

    return <TrashClient shopId={shopId} />;
}
