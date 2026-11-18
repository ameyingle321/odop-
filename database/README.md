# ODOP Nexus — Database

This directory contains database migration, seed, and verification files for the ODOP Nexus platform.

## Structure

```
database/
├── migrations/
│   ├── 001_schema.sql             Core tables (profiles, districts, categories, etc.)
│   ├── 002_indexes.sql            Performance indexes for all tables
│   ├── 003_rls_policies.sql       Row Level Security policies
│   ├── 004_functions_triggers.sql Functions and triggers (auth, district validation, updated_at)
│   ├── 005_storage.sql            Supabase Storage bucket and policies
│   └── full_migration.sql         Combined migration (run this in Supabase SQL Editor)
├── seeds/
│   ├── 001_districts.sql          ODOP district reference data (25 districts)
│   └── 002_categories.sql         Product category reference data (11 categories)
├── run-migrations.js              Migration runner (connectivity check + instructions)
├── verify-database.js             Comprehensive database verification test
└── README.md                      This file
```

## Setup

### Initial Setup (First Time)

1. Ensure `backend/.env` has the correct Supabase credentials
2. Open the [Supabase SQL Editor](https://supabase.com/dashboard) for your project
3. Copy the contents of `migrations/full_migration.sql` and run it
4. This creates all tables, indexes, RLS policies, functions, triggers, storage, and seed data

### Verification

After running the migration, verify the database:

```bash
node database/verify-database.js
```

This runs 11 test groups covering connectivity, table existence, seed data,
constraints, foreign keys, RLS policies, district validation, and storage.

## Implementation Details

- **Platform:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth (auto-creates profile on signup)
- **Row Level Security:** Enabled on all 11 application tables
- **Storage:** Supabase Storage (`product-images` bucket)
- **District Validation:** `validate_seller_product_district()` function
- **Auto-updated timestamps:** `update_updated_at()` trigger on all relevant tables

## Tables (11)

| Table | Purpose |
|-------|---------|
| `profiles` | User profiles linked to `auth.users` |
| `districts` | ODOP district reference data |
| `categories` | Product category reference data |
| `seller_profiles` | Seller business profiles with district |
| `products` | Product listings |
| `product_images` | Product image references |
| `cart_items` | Buyer shopping cart |
| `orders` | Customer orders with delivery snapshot |
| `order_items` | Order line items with price snapshots |
| `payments` | Payment records |
| `reviews` | Product reviews |

## Critical Rule

> **Seller District = Product District**
>
> A product must belong to the same district as its seller.
> This is enforced by the backend service layer + the `validate_seller_product_district()` database function.

## Notes

- Do not create tables or modify the schema outside of tracked migration files.
- The service-role key must never be exposed to the frontend.
- See `Docs/ODOP_Nexus_Supabase_Database_Implementation.md` for the full specification.
