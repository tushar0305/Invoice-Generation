'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/supabase/client';
import type { Scheme, CreateSchemePayload } from '@/lib/scheme-types';

export function useSchemes(shopId: string | null | undefined) {
    const [schemes, setSchemes] = useState<Scheme[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchSchemes = useCallback(async () => {
        if (!shopId) {
            setSchemes([]);
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const { data, error } = await supabase
                .from('schemes')
                .select('*')
                .eq('shop_id', shopId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setSchemes(data as unknown as Scheme[] || []);
        } catch (err: any) {
            console.error('Error fetching schemes:', err);
            setError(err);
        } finally {
            setIsLoading(false);
        }
    }, [shopId]);

    useEffect(() => {
        fetchSchemes();
    }, [fetchSchemes]);

    const createScheme = async (payload: CreateSchemePayload) => {
        try {
            const { data, error } = await supabase
                .from('schemes')
                .insert([payload])
                .select()
                .single();

            if (error) throw error;
            setSchemes(prev => [data as unknown as Scheme, ...prev]);
            return { data, error: null };
        } catch (err: any) {
            console.error('Error creating scheme:', err);
            return { data: null, error: err };
        }
    };

    const toggleSchemeStatus = async (id: string, currentStatus: boolean) => {
        try {
            const { error } = await supabase
                .from('schemes')
                .update({ is_active: !currentStatus })
                .eq('id', id);

            if (error) throw error;
            setSchemes(prev => prev.map(s => s.id === id ? { ...s, is_active: !currentStatus } : s));
            return { error: null };
        } catch (err: any) {
            return { error: err };
        }
    };

    return {
        schemes,
        isLoading,
        error,
        createScheme,
        toggleSchemeStatus,
        refresh: fetchSchemes
    };
}
