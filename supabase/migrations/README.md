# RBAC and Multi-Shop Migration Guide

## Overview

This guide will help you apply the RBAC (Role-Based Access Control) and multi-shop database migration to your Supabase project.

---

## ⚠️ Important: Backup First!

**Before running any migration, create a backup of your Supabase database.**

### How to Backup:
1. Go to your Supabase project dashboard
2. Navigate to **Database** → **Backups**
3. Click **Create Backup**
4. Wait for confirmation

---

## Step 1: Review the Migration SQL

The migration file is located at: `migrations/001_rbac_multishop.sql`

**What it does:**
- Creates 3 new tables: `shops`, `user_shop_roles`, `user_preferences`
- Adds `shop_id` column to `invoices` and `stock_items`
- Adds audit fields (`created_by`, `updated_by`) to all major tables
- Migrates existing data from `user_settings` to `shops`
- Assigns all existing users as "Owner" of their default shop
- Updates all RLS policies for shop-based access
- Creates helper functions for invite codes and role checking

---

## Step 2: Test on Staging (Recommended)

If you have a staging Supabase project:

1. Copy your production data to staging
2. Run the migration on staging first
3. Test all functionality
4. Only then proceed to production

---

## Step 3: Run the Migration

### Option A: Using Supabase Dashboard (Recommended)

1. Open your Supabase project dashboard
2. Go to **SQL Editor**
3. Click **New Query**
4. Copy the entire contents of `migrations/001_rbac_multishop.sql`
5. Paste into the editor
6. Click **Run** (or press `Cmd/Ctrl + Enter`)
7. Wait for completion (may take 30-60 seconds)

![Migration Steps](https://img.supabase.io/docs/guides/database/migrations.png)

### Option B: Using Supabase CLI

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref your-project-ref

# Run the migration
supabase db push --file migrations/001_rbac_multishop.sql
```

---

## Step 4: Verify Migration Success

After running the migration, execute these verification queries in the SQL Editor:

### 1. Check if all users have a default shop

```sql
SELECT u.id, u.email, s.shop_name 
FROM auth.users u
LEFT JOIN shops s ON s.created_by = u.id
WHERE s.id IS NULL;
```

**Expected result**: 0 rows (all users should have a shop)

### 2. Check if all users are assigned as "owner"

```sql
SELECT u.id, u.email, usr.role, s.shop_name
FROM auth.users u
LEFT JOIN user_shop_roles usr ON usr.user_id = u.id
LEFT JOIN shops s ON s.id = usr.shop_id
WHERE usr.role IS NULL;
```

**Expected result**: 0 rows (all users should have owner role)

### 3. Check if all invoices have shop_id

```sql
SELECT COUNT(*) as invoices_without_shop
FROM invoices 
WHERE shop_id IS NULL;
```

**Expected result**: `invoices_without_shop = 0`

### 4. Check if all stock_items have shop_id

```sql
SELECT COUNT(*) as stock_items_without_shop
FROM stock_items 
WHERE shop_id IS NULL;
```

**Expected result**: `stock_items_without_shop = 0`

### 5. Verify RLS policies are applied

```sql
SELECT tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('shops', 'user_shop_roles', 'invoices', 'stock_items');
```

**Expected result**: Should see multiple policies for each table

---

## Step 5: Update Application Code

Now that the database is ready, you need to integrate it with the frontend.

### 1. Wrap your app with ActiveShopProvider

Edit `src/app/layout.tsx`:

```typescript
import { ActiveShopProvider } from '@/hooks/use-active-shop';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <UserProvider> {/* Existing Supabase auth provider */}
          <ActiveShopProvider> {/* NEW: Wrap with shop provider */}
            {children}
          </ActiveShopProvider>
        </UserProvider>
      </body>
    </html>
  );
}
```

### 2. Use the hook in components

Example: Update invoice queries to use `activeShop.id`

```typescript
'use client';
import { useActiveShop } from '@/hooks/use-active-shop';

export function InvoiceList() {
  const { activeShop, permissions } = useActiveShop();

  useEffect(() => {
    if (!activeShop) return;

    const { data } = await supabase
      .from('invoices')
      .select('*')
      .eq('shop_id', activeShop.id); // Use active shop

    // ...
  }, [activeShop?.id]);

  return (
    <div>
      {permissions.canCreateInvoices && (
        <Button>Create Invoice</Button>
      )}
    </div>
  );
}
```

---

## Step 6: Test in Development

1. Start your Next.js dev server:
   ```bash
   npm run dev
   ```

2. Sign in with an existing account

3. Verify:
   - Dashboard loads without errors
   - Invoices are visible
   - Stock items are visible
   - Settings page loads

4. Check browser console for errors

---

## Common Issues

### Issue: "relation 'shops' does not exist"

**Cause**: Migration didn't run successfully

**Fix**: 
- Re-run the migration SQL
- Check for errors in the SQL Editor output
- Ensure you're connected to the right database

---

### Issue: "null value in column 'shop_id' violates not-null constraint"

**Cause**: Data backfill didn't complete before constraints were added

**Fix**: 
1. Remove NOT NULL constraint:
   ```sql
   ALTER TABLE invoices ALTER COLUMN shop_id DROP NOT NULL;
   ALTER TABLE stock_items ALTER COLUMN shop_id DROP NOT NULL;
   ```

2. Re-run backfill queries (see migration file Phase 3)

3. Re-add constraints:
   ```sql
   ALTER TABLE invoices ALTER COLUMN shop_id SET NOT NULL;
   ALTER TABLE stock_items ALTER COLUMN shop_id SET NOT NULL;
   ```

---

### Issue: "permission denied for table invoices"

**Cause**: RLS policies blocking access

**Fix**:
- Verify user is logged in (`SELECT auth.uid()` should return UUID)
- Check if user has entry in `user_shop_roles`:
  ```sql
  SELECT * FROM user_shop_roles WHERE user_id = auth.uid();
  ```
- If no entry, manually create:
  ```sql
  INSERT INTO user_shop_roles (user_id, shop_id, role, accepted_at)
  SELECT auth.uid(), s.id, 'owner', now()
  FROM shops s WHERE s.created_by = auth.uid()
  LIMIT 1;
  ```

---

## Next Steps

After successful migration:

1. ✅ **Implement Staff Management UI**
   - Location: `src/app/dashboard/staff/page.tsx`
   - Features: Invite staff, generate codes, view team

2. ✅ **Build Shop Switcher Component**
   - Location: `src/components/shop-switcher.tsx`
   - Show in header/sidebar for owners with multiple shops

3. ✅ **Update All Queries**
   - Replace `user_id` filters with `shop_id`
   - Use `useActiveShop()` hook everywhere

4. ✅ **Role-Based UI**
   - Hide/disable features based on `permissions` object
   - Add role badges to user avatars

---

## Rollback (Emergency Only)

If migration causes issues and you need to rollback:

```sql
-- WARNING: This will delete the new tables and revert to old structure

-- Drop new tables
DROP TABLE IF EXISTS user_preferences CASCADE;
DROP TABLE IF EXISTS user_shop_roles CASCADE;
DROP TABLE IF EXISTS shops CASCADE;

-- Remove new columns
ALTER TABLE invoices DROP COLUMN IF EXISTS shop_id;
ALTER TABLE invoices DROP COLUMN IF EXISTS created_by;
ALTER TABLE invoices DROP COLUMN IF EXISTS updated_by;

ALTER TABLE stock_items DROP COLUMN IF EXISTS shop_id;
ALTER TABLE stock_items DROP COLUMN IF EXISTS created_by;
ALTER TABLE stock_items DROP COLUMN IF EXISTS updated_by;

-- Restore old RLS policies (you'll need to recreate them manually)
```

**Note**: Only do this if absolutely necessary. Rollback may cause data loss if users have already created shops or invited staff.

---

## Need Help?

- Check Supabase logs: Dashboard → Logs → Postgres Logs
- Test queries in SQL Editor
- Review RLS policies: Dashboard → Authentication → Policies

---

## Migration Checklist

- [ ] Created database backup
- [ ] Tested on staging environment
- [ ] Ran migration SQL successfully
- [ ] Verified all users have shops
- [ ] Verified all invoices have shop_id
- [ ] Verified all stock items have shop_id
- [ ] Wrapped app with ActiveShopProvider
- [ ] Tested login and dashboard
- [ ] No console errors
- [ ] Ready for production use
