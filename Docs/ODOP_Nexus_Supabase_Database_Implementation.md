# ODOP Nexus — Supabase Database Implementation Document

**Document Version:** 1.0  
**Purpose:** Direct implementation specification for Antigravity  
**Database Platform:** Supabase  
**Primary Database:** PostgreSQL  
**Authentication:** Supabase Auth  
**Project:** ODOP Nexus — District-Based ODOP Marketplace

---

# 1. Purpose of This Document

This document tells Antigravity exactly what must be created and configured in **Supabase** for the ODOP Nexus project.

Antigravity should use this document as the database implementation specification.

The Supabase project must provide:

- PostgreSQL database
- Supabase Auth
- Row Level Security (RLS)
- Database tables and relationships
- Indexes
- Constraints
- Storage for product images
- Seed/reference data
- Database functions/triggers where necessary

The database must follow the project rules defined in the PRD, TRD and System Design.

---

# 2. Important Architecture Decision

For this project, use:

```text
Frontend
   ↓
Backend/API
   ↓
Supabase PostgreSQL
```

Supabase will be used for:

```text
1. PostgreSQL Database
2. Authentication
3. Row Level Security
4. Product Image Storage
```

The custom backend remains responsible for marketplace business logic such as:

```text
Seller-product district validation
Order creation
Payment verification
Razorpay integration
Role/ownership checks
```

Do NOT move important marketplace business rules entirely into frontend code.

---

# 3. Supabase Project Setup

Create/configure a Supabase project for ODOP Nexus.

Configure:

```text
Project Name:
ODOP Nexus

Database:
PostgreSQL

Authentication:
Supabase Auth

Storage:
Supabase Storage
```

Create separate environment variables for development and production.

The frontend/backend must never expose the Supabase service-role key.

---

# 4. Database Schema Overview

Create these main tables:

```text
profiles
seller_profiles
districts
categories
products
product_images
cart_items
orders
order_items
payments
reviews
```

Relationship overview:

```text
auth.users
    │
    ▼
profiles
    │
    ├──────────────► seller_profiles
    │                      │
    │                      ▼
    │                  districts
    │
    └──────────────► orders
                           │
                           ▼
                      order_items
                           │
                           ▼
                        products
                           │
                 ┌─────────┴─────────┐
                 ▼                   ▼
              sellers             districts
```

---

# 5. Authentication Design

Use **Supabase Auth**.

Supabase Auth manages:

- Email/password registration
- Login
- Logout
- Password reset
- Session management
- Authenticated user identity

The application database must not store passwords.

Supabase stores authentication credentials in:

```text
auth.users
```

Application-specific user information must be stored in:

```text
public.profiles
```

---

# 6. Profiles Table

Create:

```text
public.profiles
```

Suggested fields:

```text
id UUID PRIMARY KEY
full_name TEXT
phone TEXT
role TEXT
avatar_url TEXT
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ
```

`id` must reference:

```text
auth.users(id)
```

Recommended role values:

```text
buyer
seller
admin
```

Do not allow arbitrary role values.

Use a database constraint or enum.

---

# 7. Seller Profiles Table

Create:

```text
public.seller_profiles
```

Fields:

```text
id UUID PRIMARY KEY
user_id UUID UNIQUE
business_name TEXT
phone TEXT
address TEXT
district_id UUID
state TEXT
verification_status TEXT
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ
```

Relationships:

```text
seller_profiles.user_id
        ↓
profiles.id

seller_profiles.district_id
        ↓
districts.id
```

A seller must have exactly one registered district.

Suggested verification values:

```text
pending
approved
rejected
```

---

# 8. Districts Table

Create:

```text
public.districts
```

Fields:

```text
id UUID PRIMARY KEY
name TEXT
state TEXT
slug TEXT UNIQUE
description TEXT
odop_product_name TEXT
is_active BOOLEAN
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ
```

The district table is the central reference for district-based product relationships.

Example:

```text
District
   │
   ├── Seller
   │
   └── Product
```

Do not store district names as free text inside products or sellers.

Use:

```text
district_id
```

instead.

---

# 9. Categories Table

Create:

```text
public.categories
```

Fields:

```text
id UUID PRIMARY KEY
name TEXT
slug TEXT UNIQUE
description TEXT
is_active BOOLEAN
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ
```

Products should reference categories using:

```text
category_id
```

---

# 10. Products Table

Create:

```text
public.products
```

Fields:

```text
id UUID PRIMARY KEY
seller_id UUID
district_id UUID
category_id UUID
name TEXT
slug TEXT UNIQUE
description TEXT
price NUMERIC
stock INTEGER
status TEXT
odop_product_name TEXT
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ
```

Relationships:

```text
seller_id
   ↓
seller_profiles.id

district_id
   ↓
districts.id

category_id
   ↓
categories.id
```

---

# 11. CRITICAL DISTRICT RULE

This is the most important database/business rule in the entire project.

A product must belong to the same district as its seller.

Required relationship:

```text
seller_profiles.district_id
             =
products.district_id
```

Example:

```text
Seller:
district_id = PUNE

Product:
district_id = NASHIK

❌ INVALID
```

Correct:

```text
Seller:
district_id = NASHIK

Product:
district_id = NASHIK

✅ VALID
```

Antigravity must implement this rule in the backend/service layer.

Do not rely only on frontend validation.

---

# 12. Product Images Table

Create:

```text
public.product_images
```

Fields:

```text
id UUID PRIMARY KEY
product_id UUID
image_url TEXT
storage_path TEXT
display_order INTEGER
created_at TIMESTAMPTZ
```

Relationship:

```text
product_images.product_id
        ↓
products.id
```

One product can have multiple images.

---

# 13. Cart Design

Create:

```text
public.cart_items
```

Fields:

```text
id UUID PRIMARY KEY
buyer_id UUID
product_id UUID
quantity INTEGER
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ
```

Relationships:

```text
buyer_id
   ↓
profiles.id

product_id
   ↓
products.id
```

A buyer should not be able to access another buyer's cart.

Recommended unique constraint:

```text
(buyer_id, product_id)
```

This prevents duplicate cart rows for the same buyer/product combination.

---

# 14. Orders Table

Create:

```text
public.orders
```

Fields:

```text
id UUID PRIMARY KEY
buyer_id UUID
total_amount NUMERIC
payment_status TEXT
order_status TEXT
delivery_name TEXT
delivery_phone TEXT
delivery_address TEXT
delivery_city TEXT
delivery_district TEXT
delivery_state TEXT
delivery_pincode TEXT
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ
```

Important:

The delivery address should be stored as an order snapshot.

Do not depend only on the buyer's current profile/address because the buyer may change it later.

---

# 15. Order Items Table

Create:

```text
public.order_items
```

Fields:

```text
id UUID PRIMARY KEY
order_id UUID
product_id UUID
seller_id UUID
product_name TEXT
quantity INTEGER
unit_price NUMERIC
subtotal NUMERIC
created_at TIMESTAMPTZ
```

Relationships:

```text
order_id
   ↓
orders.id

product_id
   ↓
products.id

seller_id
   ↓
seller_profiles.id
```

Important:

Store the purchased product name and unit price as a snapshot.

Example:

```text
Product price today = ₹500

Buyer purchases = ₹500

Product price later changes to ₹650

Historical order item remains = ₹500
```

---

# 16. Payments Table

Create:

```text
public.payments
```

Fields:

```text
id UUID PRIMARY KEY
order_id UUID
provider TEXT
provider_order_id TEXT
provider_payment_id TEXT
amount NUMERIC
status TEXT
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ
```

Suggested provider:

```text
razorpay
```

Suggested payment statuses:

```text
pending
authorized
paid
failed
refunded
```

Payment verification must happen on the backend.

Never trust a payment status sent directly by the browser.

---

# 17. Reviews Table

Create:

```text
public.reviews
```

Fields:

```text
id UUID PRIMARY KEY
product_id UUID
buyer_id UUID
order_id UUID
rating INTEGER
comment TEXT
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ
```

Relationships:

```text
product_id
   ↓
products.id

buyer_id
   ↓
profiles.id

order_id
   ↓
orders.id
```

---

# 18. Review Business Rule

A buyer can review a product only when:

```text
Buyer owns the order
        AND
Product exists in the order
        AND
Order status = delivered
```

Antigravity must enforce this in the backend.

Recommended database uniqueness:

```text
(order_id, product_id, buyer_id)
```

This prevents the same purchase from generating duplicate reviews.

---

# 19. Status Values

Use controlled values rather than arbitrary strings.

## Product

```text
draft
active
inactive
rejected
```

## Seller Verification

```text
pending
approved
rejected
```

## Order

```text
pending_payment
confirmed
processing
shipped
delivered
cancelled
```

Future-ready:

```text
return_requested
returned
refund_pending
refunded
```

## Payment

```text
pending
authorized
paid
failed
refunded
```

---

# 20. Foreign Key Relationships

The database should enforce foreign keys.

Required relationships:

```text
profiles.id
    ↑
seller_profiles.user_id

districts.id
    ↑
seller_profiles.district_id

seller_profiles.id
    ↑
products.seller_id

districts.id
    ↑
products.district_id

categories.id
    ↑
products.category_id

products.id
    ↑
product_images.product_id

profiles.id
    ↑
cart_items.buyer_id

products.id
    ↑
cart_items.product_id

profiles.id
    ↑
orders.buyer_id

orders.id
    ↑
order_items.order_id

products.id
    ↑
order_items.product_id

seller_profiles.id
    ↑
order_items.seller_id

orders.id
    ↑
payments.order_id

products.id
    ↑
reviews.product_id

profiles.id
    ↑
reviews.buyer_id

orders.id
    ↑
reviews.order_id
```

---

# 21. Row Level Security

Enable RLS on all application tables.

```text
profiles
seller_profiles
districts
categories
products
product_images
cart_items
orders
order_items
payments
reviews
```

Do not leave production tables publicly writable.

---

# 22. RLS Rules

## Profiles

Users can:

```text
SELECT their own profile
UPDATE their own profile
```

Admins can manage profiles as required.

## Seller Profiles

Seller can:

```text
SELECT own seller profile
UPDATE own seller profile
```

Public users should not receive private seller information.

Approved seller/business information may be exposed through controlled queries/API responses.

## Products

Public users/buyers can:

```text
SELECT active products
```

Sellers can:

```text
SELECT own products
INSERT own products
UPDATE own products
DELETE/deactivate own products
```

Admins can manage all products.

## Product Images

Users can view images associated with active/public products.

Only the owning seller/admin should be able to modify product images.

## Cart

Buyer can:

```text
SELECT own cart
INSERT own cart items
UPDATE own cart items
DELETE own cart items
```

## Orders

Buyer can:

```text
SELECT own orders
```

Seller can access orders containing their own products through controlled backend queries/policies.

Admin can access all orders.

## Payments

Payment records should not be publicly readable.

Prefer backend/service-level access.

## Reviews

Public users can read reviews for active products.

Only eligible buyers can create their own reviews.

Buyer can update/delete their own review if the product policy permits it.

Admin can moderate reviews.

---

# 23. Service Role Key Rule

The Supabase service-role key has elevated privileges.

Never place:

```text
SUPABASE_SERVICE_ROLE_KEY
```

in frontend code.

Never expose it through:

- React
- browser JavaScript
- public environment variables
- GitHub

Use it only on trusted backend/server environments when necessary.

---

# 24. Supabase Client Configuration

Frontend should use the Supabase project URL and public/anon key only.

Example:

```text
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

Backend should use server-side environment variables.

Example:

```text
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

The service-role key must remain server-side.

---

# 25. Authentication Trigger

When a user registers through Supabase Auth:

```text
auth.users
      ↓
Database Trigger
      ↓
public.profiles
```

Create a profile automatically after successful signup.

The trigger should populate:

```text
id
full_name if available
role
created_at
updated_at
```

Default role:

```text
buyer
```

Seller role should be assigned only through a controlled seller registration process.

Admin roles must never be assignable by ordinary users.

---

# 26. Seller Registration Flow

Recommended flow:

```text
User signs up
      ↓
Supabase Auth creates auth.users
      ↓
profiles row created
      ↓
User chooses seller registration
      ↓
Seller information submitted
      ↓
Seller district selected
      ↓
seller_profiles created
      ↓
Profile role becomes seller after validation/approval
```

The frontend must not be allowed to arbitrarily change:

```text
role = admin
```

---

# 27. District Validation Implementation

When creating a product:

```text
1. Get authenticated seller.
2. Get seller_profiles.district_id.
3. Read submitted product district_id.
4. Compare both IDs.
5. If different → reject.
6. If equal → create product.
```

Pseudo-logic:

```text
sellerDistrict = getSellerDistrict(user.id)

if sellerDistrict != productDistrict:
    reject("Seller and product must belong to the same district")

createProduct()
```

This check must exist in the trusted backend.

---

# 28. Recommended Database Function

Antigravity may create a PostgreSQL function for reusable district validation if appropriate.

Conceptually:

```text
validate_seller_product_district(
    seller_id,
    product_district_id
)
```

It should return success only when:

```text
seller.district_id = product_district_id
```

Do not use a database trigger unless it is carefully designed to avoid blocking legitimate administrative operations.

The primary enforcement should remain in the backend business service, with database constraints/functions used as additional protection where practical.

---

# 29. Product Search Indexes

Create indexes for common queries.

Recommended:

```text
products.seller_id
products.district_id
products.category_id
products.status
products.price
products.created_at
```

For search:

```text
products.name
products.slug
```

For larger datasets, PostgreSQL full-text search can be added later.

Do not introduce a separate search engine for the MVP unless performance requires it.

---

# 30. Order Indexes

Create indexes for:

```text
orders.buyer_id
orders.order_status
orders.payment_status
orders.created_at

order_items.order_id
order_items.product_id
order_items.seller_id
```

---

# 31. Review Indexes

Create indexes for:

```text
reviews.product_id
reviews.buyer_id
reviews.order_id
reviews.created_at
```

---

# 32. Cart Indexes

Create:

```text
INDEX cart_items.buyer_id
INDEX cart_items.product_id
UNIQUE(buyer_id, product_id)
```

---

# 33. Storage Setup

Create a Supabase Storage bucket:

```text
product-images
```

Recommended structure:

```text
product-images/
    {product_id}/
        image-1
        image-2
        image-3
```

The database stores:

```text
storage_path
image_url
```

Do not store image binary data directly in PostgreSQL.

---

# 34. Storage Security

Only appropriate authenticated sellers should be able to upload/update images for their own products.

Public product images may be readable through controlled public storage or signed URLs depending on the final security choice.

Do not allow arbitrary users to overwrite another seller's files.

---

# 35. Seed Data

Create initial reference data for development.

Seed:

```text
Districts
Categories
```

Example category data:

```text
Textiles
Handicrafts
Food Products
Agricultural Products
Traditional Products
Other
```

Do not invent or hard-code incorrect ODOP district mappings merely for production data.

Use verified ODOP reference data when populating real district/product associations.

---

# 36. Database Migration Strategy

All schema changes must be reproducible.

Antigravity should maintain migrations for:

```text
Tables
Columns
Indexes
Foreign Keys
Constraints
Functions
Triggers
RLS Policies
Seed/reference data
```

Do not make undocumented manual production changes.

The final database schema should be exportable/recreatable.

---

# 37. Development Workflow

Antigravity should perform the database work in this order:

```text
1. Create Supabase project
        ↓
2. Configure Auth
        ↓
3. Create districts
        ↓
4. Create categories
        ↓
5. Create profiles
        ↓
6. Create seller_profiles
        ↓
7. Create products
        ↓
8. Create product_images
        ↓
9. Create cart_items
        ↓
10. Create orders
        ↓
11. Create order_items
        ↓
12. Create payments
        ↓
13. Create reviews
        ↓
14. Add foreign keys
        ↓
15. Add constraints
        ↓
16. Add indexes
        ↓
17. Enable RLS
        ↓
18. Add RLS policies
        ↓
19. Configure Storage
        ↓
20. Add seed/reference data
        ↓
21. Test database
```

---

# 38. Database Testing Checklist

Antigravity must test at least these cases.

## Authentication

```text
[ ] Buyer can register
[ ] Buyer can login
[ ] Seller registration works
[ ] Logout works
[ ] Unauthorized users cannot access protected data
```

## Seller

```text
[ ] Seller has a district
[ ] Seller can create own product
[ ] Seller can edit own product
[ ] Seller cannot edit another seller's product
```

## District Rule

```text
[ ] Matching seller/product district succeeds
[ ] Mismatched district is rejected
[ ] Frontend bypass cannot bypass backend validation
```

## Products

```text
[ ] Active products can be discovered
[ ] Inactive products are not publicly listed
[ ] Product belongs to valid seller
[ ] Product belongs to valid district
```

## Cart

```text
[ ] Buyer can add product
[ ] Buyer can change quantity
[ ] Buyer can remove product
[ ] Buyer cannot access another buyer's cart
```

## Orders

```text
[ ] Order belongs to correct buyer
[ ] Order items reference valid products
[ ] Historical price is preserved
[ ] Seller sees only relevant order items
```

## Reviews

```text
[ ] Delivered buyer can review
[ ] Buyer who did not purchase cannot review
[ ] Duplicate review is prevented
```

## RLS

```text
[ ] Buyer cannot read another buyer's private data
[ ] Seller cannot modify another seller's data
[ ] Normal user cannot access admin-only data
```

---

# 39. Important Implementation Rules for Antigravity

Antigravity must follow these rules:

### Rule 1

Do not create duplicate tables for the same entity.

### Rule 2

Use UUIDs for primary keys.

### Rule 3

Use foreign keys instead of storing repeated names wherever a relationship exists.

### Rule 4

Do not store passwords in application tables.

### Rule 5

Do not expose the Supabase service-role key.

### Rule 6

Enable RLS before treating the database as production-ready.

### Rule 7

Do not trust frontend role information.

### Rule 8

Do not rely only on frontend district validation.

### Rule 9

Do not calculate final payment totals only on the client.

### Rule 10

Keep migrations/schema changes reproducible.

### Rule 11

Use transactions for critical multi-step database operations.

### Rule 12

Do not add unnecessary tables or complexity that is not required by the current project.

---

# 40. Final Database Architecture

```text
                    SUPABASE
                       │
        ┌──────────────┼──────────────┐
        │              │              │
        ▼              ▼              ▼
   Supabase Auth   PostgreSQL      Storage
        │              │              │
        ▼              │              ▼
   auth.users          │        product-images
        │              │
        ▼              │
    profiles           │
        │              │
        ├──────► seller_profiles
        │              │
        │              ├──────► districts
        │              │
        │              └──────► products
        │                           │
        │             ┌─────────────┼─────────────┐
        │             ▼             ▼             ▼
        │       product_images   categories     reviews
        │
        ├──────► cart_items
        │
        └──────► orders
                     │
                     ├──────► order_items
                     │
                     └──────► payments
```

---

# 41. Final Critical Relationships

The most important relationships are:

```text
AUTH USER
   ↓
PROFILE
   ↓
SELLER
   ↓
DISTRICT
   ↓
PRODUCT
```

and:

```text
BUYER
   ↓
ORDER
   ↓
ORDER ITEM
   ↓
PRODUCT
```

and:

```text
PRODUCT
   ↓
REVIEW
```

The critical marketplace invariant is:

```text
Seller District = Product District
```

The critical payment invariant is:

```text
Payment must be server-side verified
before an order becomes confirmed/paid.
```

The critical security invariant is:

```text
Users can access only resources they are authorized to access.
```

---

# 42. Definition of Done

Supabase database implementation is complete when:

- [ ] Supabase project is configured.
- [ ] Supabase Auth is working.
- [ ] Profiles are automatically created after signup.
- [ ] Buyer/seller/admin roles are correctly controlled.
- [ ] District table exists.
- [ ] Category table exists.
- [ ] Seller profile table exists.
- [ ] Product table exists.
- [ ] Product images/storage exists.
- [ ] Cart table exists.
- [ ] Orders and order items exist.
- [ ] Payments table exists.
- [ ] Reviews table exists.
- [ ] Foreign keys are configured.
- [ ] Appropriate indexes exist.
- [ ] RLS is enabled.
- [ ] RLS policies are tested.
- [ ] Seller-product district validation works.
- [ ] Storage policies are tested.
- [ ] Seed/reference data is loaded.
- [ ] Database migrations are reproducible.
- [ ] No secret keys are exposed.
- [ ] Database tests pass.

---

# 43. Antigravity Execution Instruction

Antigravity should **not attempt to build the entire database blindly in one step**.

Implement this document in stages.

For every stage:

```text
1. Perform the requested database task.
2. Show/record what was created.
3. Run verification queries/tests.
4. Check that the expected result exists.
5. Fix errors before moving forward.
6. Do not proceed if the database state is inconsistent.
```

The database should be treated as the foundation of ODOP Nexus.

The implementation order should therefore be:

```text
SUPABASE SETUP
      ↓
AUTH
      ↓
CORE TABLES
      ↓
RELATIONSHIPS
      ↓
CONSTRAINTS
      ↓
RLS
      ↓
STORAGE
      ↓
SEED DATA
      ↓
VERIFICATION
      ↓
BACKEND INTEGRATION
```

**Do not start frontend marketplace development until the core database schema, authentication, RLS, district relationships, and basic verification tests are working correctly.**
