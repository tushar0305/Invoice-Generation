'use client';

import { useState, useCallback, useEffect } from 'react';
import type { InventoryItem, CreateInventoryItemPayload, UpdateInventoryItemPayload } from '@/lib/inventory-types';

interface UseInventoryOptions {
    shopId: string | null | undefined;
    autoFetch?: boolean;
}

interface InventoryState {
    items: InventoryItem[];
    isLoading: boolean;
    error: string | null;
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
    counts: {
        all: number;
        inStock: number;
        reserved: number;
        sold: number;
    };
}

interface InventoryFilters {
    status?: string;
    metal_type?: string;
    purity?: string;
    category?: string;
    location?: string;
    q?: string;
    page?: number;
    limit?: number;
}

export function useInventory({ shopId, autoFetch = true }: UseInventoryOptions) {
    const [state, setState] = useState<InventoryState>({
        items: [],
        isLoading: false,
        error: null,
        pagination: { page: 1, limit: 50, total: 0, totalPages: 0 },
        counts: { all: 0, inStock: 0, reserved: 0, sold: 0 },
    });

    const fetchItems = useCallback(async (filters: InventoryFilters = {}) => {
        if (!shopId) return;

        setState(prev => ({ ...prev, isLoading: true, error: null }));

        try {
            const params = new URLSearchParams();
            params.set('shopId', shopId);
            if (filters.status) params.set('status', filters.status);
            if (filters.metal_type) params.set('metal_type', filters.metal_type);
            if (filters.purity) params.set('purity', filters.purity);
            if (filters.category) params.set('category', filters.category);
            if (filters.location) params.set('location', filters.location);
            if (filters.q) params.set('q', filters.q);
            if (filters.page) params.set('page', String(filters.page));
            if (filters.limit) params.set('limit', String(filters.limit));

            const response = await fetch(`/api/v1/inventory?${params.toString()}`);
            const data = await response.json();

            if (!response.ok) throw new Error(data.error || 'Failed to fetch inventory');

            setState({
                items: data.items,
                isLoading: false,
                error: null,
                pagination: data.pagination,
                counts: data.counts,
            });
        } catch (error: any) {
            setState(prev => ({
                ...prev,
                isLoading: false,
                error: error.message,
            }));
        }
    }, [shopId]);

    const createItem = useCallback(async (payload: CreateInventoryItemPayload) => {
        try {
            const response = await fetch('/api/v1/inventory', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const data = await response.json();

            if (!response.ok) throw new Error(data.error || 'Failed to create item');

            // Refresh list
            fetchItems();

            return { item: data.item, error: null };
        } catch (error: any) {
            return { item: null, error: error.message };
        }
    }, [fetchItems]);

    const updateItem = useCallback(async (itemId: string, payload: UpdateInventoryItemPayload) => {
        try {
            const response = await fetch(`/api/v1/inventory/${itemId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const data = await response.json();

            if (!response.ok) throw new Error(data.error || 'Failed to update item');

            // Update in local state
            setState(prev => ({
                ...prev,
                items: prev.items.map(item =>
                    item.id === itemId || item.tag_id === itemId ? data.item : item
                ),
            }));

            return { item: data.item, error: null };
        } catch (error: any) {
            return { item: null, error: error.message };
        }
    }, []);

    const getItem = useCallback(async (itemId: string) => {
        try {
            const response = await fetch(`/api/v1/inventory/${itemId}`);
            const data = await response.json();

            if (!response.ok) throw new Error(data.error || 'Item not found');

            return { item: data.item, history: data.history, error: null };
        } catch (error: any) {
            return { item: null, history: [], error: error.message };
        }
    }, []);

    const deleteItem = useCallback(async (itemId: string) => {
        try {
            const response = await fetch(`/api/v1/inventory/${itemId}`, {
                method: 'DELETE',
            });
            const data = await response.json();

            if (!response.ok) throw new Error(data.error || 'Failed to delete item');

            // Remove from local state
            setState(prev => ({
                ...prev,
                items: prev.items.filter(item => item.id !== itemId && item.tag_id !== itemId),
            }));

            return { success: true, error: null };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }, []);

    useEffect(() => {
        if (autoFetch && shopId) {
            fetchItems();
        }
    }, [autoFetch, shopId, fetchItems]);

    return {
        ...state,
        fetchItems,
        createItem,
        updateItem,
        getItem,
        deleteItem,
        refetch: () => fetchItems(),
    };
}
