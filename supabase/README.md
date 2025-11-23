# Supabase Database Setup

This directory contains the complete database schema and policies for the Invoice Generation application.

## 📁 File Structure

```
supabase/
├── schema.sql              # Complete database schema
├── policies.sql            # All RLS policies
├── diagnostic_queries.sql  # Troubleshooting queries
├── README.md              # This file
├── migrations/            # Ordered migration files
│   ├── 000_complete_setup.sql
│   ├── 001_rbac_multishop.sql
│   ├── 002_fix_rls_recursion.sql
│   ├── 003_robust_rls.sql
│   ├── 004_fix_missing_shops.sql
│   ├── 005_invitations.sql
│   ├── 006_cleanup_invites.sql
│   ├── 007_create_shop_rpc.sql
│   └── 008_fix_user_owner_role.sql
└── functions/             # Supabase Edge Functions
    ├── create-staff-member/
    └── delete-staff-member/
```

### Core Files (Use These!)
- **`schema.sql`** - Complete database schema (tables, indexes, functions)
- **`policies.sql`** - All Row Level Security (RLS) policies
- **`migrations/`** - Ordered migration files for incremental updates

### Helper Files
- **`diagnostic_queries.sql`** - Diagnostic queries for troubleshooting
- **`functions/`** - Supabase Edge Functions

## 🚀 Quick Start

### Option 1: Fresh Database Setup
Run these in order in your Supabase SQL Editor:

```sql
-- 1. Create all tables and indexes
\i schema.sql

-- 2. Set up RLS policies
\i policies.sql

-- 3. Reload schema cache
NOTIFY pgrst, 'reload schema';
```

### Option 2: Using Supabase CLI
```bash
# Link to your project (first time only)
supabase link --project-ref your-project-ref

# Apply schema
psql $DATABASE_URL -f supabase/schema.sql

# Apply policies
psql $DATABASE_URL -f supabase/policies.sql
```

## 📊 Schema Overview

### Tables
- **`shops`** - Shop/store information
- **`user_shop_roles`** - User roles within shops (owner/manager/staff)
- **`user_preferences`** - User settings and preferences
- **`customers`** - Customer information
- **`stock_items`** - Inventory/stock management
- **`invoices`** - Invoice records
- **`user_settings`** - Legacy user settings (for backward compatibility)

### Key Features
- ✅ Multi-shop support with RBAC
- ✅ Row Level Security (RLS) enabled on all tables
- ✅ Automatic timestamps
- ✅ Soft deletes via CASCADE
- ✅ Indexes for performance

## 🔄 Migration Workflow

### Using Migrations
The `migrations/` folder contains ordered migration files:
- `000_complete_setup.sql` - Initial database setup
- `001_rbac_multishop.sql` - Multi-shop RBAC implementation
- `002_fix_rls_recursion.sql` - RLS policy fixes
- `003_robust_rls.sql` - Enhanced RLS policies
- `004_fix_missing_shops.sql` - Shop creation fixes
- `005_invitations.sql` - Staff invitation system
- `006_cleanup_invites.sql` - Invitation cleanup
- `007_create_shop_rpc.sql` - Shop creation RPC function
- `008_fix_user_owner_role.sql` - Owner role fixes

### Adding New Features
1. Modify `schema.sql` and `policies.sql` for reference
2. Create a new migration in `migrations/` directory (format: `009_feature_name.sql`)
3. Test locally
4. Deploy to production

### Troubleshooting
If you encounter issues:
1. Check RLS policies: `SELECT * FROM pg_policies;`
2. Run diagnostic queries: `\i diagnostic_queries.sql`
3. Reload schema cache: `NOTIFY pgrst, 'reload schema';`

## 🔐 Security Notes

- All tables have RLS enabled
- Users can only access data for shops they belong to
- Owners have full control, managers have limited control, staff have read-only access
- Service role key required for admin operations (stored in Supabase Secrets)

## 📝 Maintenance

### Regular Tasks
- [ ] Monitor query performance
- [ ] Review and optimize indexes
- [ ] Clean up old/archived data
- [ ] Update policies as features evolve

### Schema Changes
Always update both files together:
1. Update `schema.sql` with table changes
2. Update `policies.sql` with corresponding policy changes
3. Test thoroughly before deploying

## 🆘 Support

If you need to reset the database:
```sql
-- WARNING: This will delete ALL data!
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;

-- Then run schema.sql and policies.sql
```

---

**Last Updated:** 2025-11-23  
**Version:** 1.0
