'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/supabase/client';
import { useUser } from '@/supabase/provider';
import { useActiveShop } from '@/hooks/use-active-shop';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, CheckCircle, XCircle } from 'lucide-react';

export default function DebugPage() {
    const { user } = useUser();
    const { activeShop, userRole, isLoading: hookLoading, refreshShops } = useActiveShop();
    const [roles, setRoles] = useState<any>(null);
    const [shops, setShops] = useState<any>(null);
    const [settings, setSettings] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const handleRefresh = async () => {
        setRefreshing(true);
        await refreshShops();
        await loadRawData();
        setTimeout(() => setRefreshing(false), 1000);
    };

    const loadRawData = async () => {
        if (!user) {
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            // 1. Fetch Roles
            const { data: rolesData, error: rolesError } = await supabase
                .from('user_shop_roles')
                .select('*')
                .eq('user_id', user.uid);

            setRoles({ data: rolesData, error: rolesError });

            // 2. Fetch Shops (if roles exist)
            let shopsData = null;
            let shopsError = null;
            if (rolesData && rolesData.length > 0) {
                const ids = rolesData.map((r: any) => r.shop_id);
                const res = await supabase
                    .from('shops')
                    .select('*')
                    .in('id', ids);
                shopsData = res.data;
                shopsError = res.error;
            }
            setShops({ data: shopsData, error: shopsError });

            // 3. Fetch Settings (Removed as user_settings is deprecated)
            setSettings({ data: null, error: null });

        } catch (e: any) {
            console.error('Debug page error:', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadRawData();
    }, [user]);

    if (!user) return <div className="p-8">Please login</div>;

    const rolesHaveData = roles?.data && roles.data.length > 0;
    const shopsHaveData = shops?.data && shops.data.length > 0;
    const activeShopExists = activeShop !== null;

    return (
        <div className="p-8 space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold mb-2">🔍 Staff Access Debug Dashboard</h1>
                    <p className="text-muted-foreground">This page shows exactly what the app sees. Check the status indicators below.</p>
                </div>
                <button
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50"
                >
                    {refreshing ? '🔄 Refreshing...' : '🔄 Refresh Data'}
                </button>
            </div>

            <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>📋 Next Step: Check Browser Console</AlertTitle>
                <AlertDescription>
                    <p className="mb-2">Press <kbd className="px-2 py-1 bg-slate-200 rounded text-xs">F12</kbd> or <kbd className="px-2 py-1 bg-slate-200 rounded text-xs">Cmd+Option+I</kbd> to open Developer Tools.</p>
                    <p className="text-sm">Look for console messages starting with 🔄, 📊, ✅, or ❌ to see what the hook is doing.</p>
                    <p className="text-sm mt-2">Click the <strong>Refresh Data</strong> button above and watch the console output.</p>
                </AlertDescription>
            </Alert>

            {/* Status Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Alert variant={rolesHaveData ? "default" : "destructive"} className={rolesHaveData ? "border-green-500 bg-green-50" : ""}>
                    {rolesHaveData ? <CheckCircle className="h-4 w-4 text-green-600" /> : <XCircle className="h-4 w-4" />}
                    <AlertTitle>{rolesHaveData ? "✅ User Roles Found" : "❌ No User Roles"}</AlertTitle>
                    <AlertDescription>
                        {rolesHaveData
                            ? `Found ${roles.data.length} role(s). You are: ${roles.data[0]?.role}`
                            : "You are not assigned to any shop!"}
                    </AlertDescription>
                </Alert>

                <Alert variant={shopsHaveData ? "default" : "destructive"} className={shopsHaveData ? "border-green-500 bg-green-50" : ""}>
                    {shopsHaveData ? <CheckCircle className="h-4 w-4 text-green-600" /> : <XCircle className="h-4 w-4" />}
                    <AlertTitle>{shopsHaveData ? "✅ Shops Accessible" : "❌ No Shops Found"}</AlertTitle>
                    <AlertDescription>
                        {shopsHaveData
                            ? `Can access ${shops.data.length} shop(s)`
                            : "RLS Policy might be blocking shop access"}
                    </AlertDescription>
                </Alert>

                <Alert variant={activeShopExists ? "default" : "destructive"} className={activeShopExists ? "border-green-500 bg-green-50" : ""}>
                    {activeShopExists ? <CheckCircle className="h-4 w-4 text-green-600" /> : <XCircle className="h-4 w-4" />}
                    <AlertTitle>{activeShopExists ? "✅ Active Shop Loaded" : "❌ No Active Shop"}</AlertTitle>
                    <AlertDescription>
                        {activeShopExists
                            ? `Shop: ${activeShop.shopName}`
                            : "The app cannot load your active shop!"}
                    </AlertDescription>
                </Alert>
            </div>

            {/* Diagnosis */}
            {!rolesHaveData && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>🚨 Critical Issue Detected</AlertTitle>
                    <AlertDescription>
                        <p className="mb-2"><strong>You are not assigned to any shop.</strong></p>
                        <p className="text-sm">The owner needs to invite you again, OR the RLS policy for <code>user_shop_roles</code> is blocking access.</p>
                        <p className="text-sm mt-2">Run the SQL script at <code>supabase/fix_rls.sql</code> in the Supabase SQL Editor.</p>
                    </AlertDescription>
                </Alert>
            )}

            {rolesHaveData && !shopsHaveData && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>🚨 RLS Policy Issue Detected</AlertTitle>
                    <AlertDescription>
                        <p className="mb-2"><strong>You have a role, but the app cannot read the shop data.</strong></p>
                        <p className="text-sm">The RLS policy for <code>shops</code> is blocking access.</p>
                        <p className="text-sm mt-2">Run the SQL script at <code>supabase/fix_rls.sql</code> in the Supabase SQL Editor.</p>
                    </AlertDescription>
                </Alert>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                    <CardHeader><CardTitle>User Info</CardTitle></CardHeader>
                    <CardContent>
                        <pre className="text-xs bg-slate-950 text-white p-4 rounded overflow-auto max-h-96">
                            {JSON.stringify({ uid: user.uid, email: user.email }, null, 2)}
                        </pre>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle>Active Shop Hook State</CardTitle></CardHeader>
                    <CardContent>
                        <pre className="text-xs bg-slate-950 text-white p-4 rounded overflow-auto max-h-96">
                            {JSON.stringify({ activeShop, userRole, isLoading: hookLoading }, null, 2)}
                        </pre>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle>1. User Shop Roles (Raw DB Query)</CardTitle></CardHeader>
                    <CardContent>
                        <pre className="text-xs bg-slate-950 text-white p-4 rounded overflow-auto max-h-96">
                            {JSON.stringify(roles, null, 2)}
                        </pre>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle>2. Shops (Raw DB Query)</CardTitle></CardHeader>
                    <CardContent>
                        <pre className="text-xs bg-slate-950 text-white p-4 rounded overflow-auto max-h-96">
                            {JSON.stringify(shops, null, 2)}
                        </pre>
                    </CardContent>
                </Card>

                <Card className="md:col-span-2">
                    <CardHeader><CardTitle>3. User Settings (Deprecated)</CardTitle></CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">user_settings table has been removed. Settings are now part of the shops table.</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
