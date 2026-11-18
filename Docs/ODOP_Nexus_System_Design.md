# ODOP Nexus — System Design Document

**Version:** 1.0  
**Status:** MVP System Design  
**Related Documents:** PRD v1.0, TRD v1.0

## 1. Purpose

This document defines the architecture and internal design of ODOP Nexus, a district-aware marketplace for ODOP/local products. It translates the PRD and TRD into system modules, user flows, application architecture, database relationships, API interactions, security, payment, order processing, deployment, and future extension points.

## 2. Core System Principles

### District Integrity

```text
Seller District = Product District
```

A seller cannot list a product associated with a different district.

### Product-First Discovery

A buyer does not need to know the district before searching.

```text
Search Product
     ↓
Find Relevant Products
     ↓
Show District + Seller
     ↓
Purchase
```

## 3. High-Level Architecture

```text
┌──────────────────────┐
│ Buyer / Seller / Admin│
└──────────┬───────────┘
           ↓
┌──────────────────────┐
│    React Frontend    │
└──────────┬───────────┘
           │ HTTPS / REST
           ↓
┌────────────────────────────┐
│ Node.js + Express Backend  │
│ Routes → Middleware →       │
│ Controllers → Services      │
└───────┬────────────┬───────┘
        ↓            ↓
┌──────────────┐  ┌───────────┐
│ PostgreSQL   │  │ Razorpay  │
│ + Prisma     │  │ Payments  │
└──────┬───────┘  └───────────┘
       ↓
┌──────────────────┐
│ Image/File Store │
└──────────────────┘
```

## 4. Major Modules

```text
ODOP Nexus
├── Authentication & Authorization
├── Buyer
│   ├── Product Discovery
│   ├── District Discovery
│   ├── Product Details
│   ├── Cart
│   ├── Checkout
│   ├── Orders
│   └── Reviews
├── Seller
│   ├── Registration
│   ├── Profile
│   ├── Product Management
│   ├── District Validation
│   └── Order Management
├── Admin
│   ├── Users
│   ├── Sellers
│   ├── Products
│   ├── Districts
│   ├── Orders
│   └── Reviews
├── Marketplace
│   ├── Products
│   ├── Categories
│   ├── Districts
│   └── Search
└── Orders & Payments
```

## 5. User Roles

### Buyer

Register/login, search products, discover districts, view products/sellers, manage cart, checkout, pay, view orders, and review eligible purchases.

### Seller

Register, provide district information, manage profile, create/manage products, upload images, view own orders, and update fulfillment status.

### Admin

Manage users, sellers, products, categories, districts, orders, and reported content.

## 6. Role-Based Access Control

Backend authorization must verify authentication, role, and resource ownership.

```text
Request
  ↓
Authenticated?
  ↓
Role Check
  ↓
Ownership Check
  ↓
Permission Check
  ↓
Allow / Deny
```

A seller can modify only their own products and orders. Buyers can access only their own private order information.

## 7. Frontend Architecture

```text
frontend/
├── src/
│   ├── components/
│   ├── pages/
│   ├── layouts/
│   ├── services/
│   ├── hooks/
│   ├── context/
│   └── utils/
└── package.json
```

Important pages:

```text
Home
Login / Register
Seller Registration
Products / Search
Product Details
District Explorer
Cart
Checkout
Payment Result
My Orders
Seller Dashboard
Admin Dashboard
```

## 8. Backend Architecture

The backend follows:

```text
HTTP Request
     ↓
Route
     ↓
Middleware
     ↓
Controller
     ↓
Service / Business Logic
     ↓
Prisma ORM
     ↓
PostgreSQL
```

Suggested structure:

```text
backend/
├── src/
│   ├── config/
│   ├── routes/
│   ├── controllers/
│   ├── services/
│   ├── middleware/
│   ├── validators/
│   └── utils/
├── prisma/
│   └── schema.prisma
├── .env
└── package.json
```

## 9. Database Architecture

Core entities:

```text
User
Seller
District
Category
Product
Cart
CartItem
Order
OrderItem
Payment
Review
```

Relationship:

```text
User
├── Buyer
│   └── Orders
│       └── OrderItems
│           └── Product
│               ├── Seller
│               ├── District
│               ├── Category
│               └── Reviews
└── Seller
    └── District
```

## 10. Critical District Relationship

```text
Seller
  │
  └── district_id
          │
          │ MUST MATCH
          ▼
Product
  │
  └── district_id
```

Backend rule:

```text
seller.district_id == product.district_id
```

Example:

```text
Seller District: Pune
Product District: Nashik
Result: REJECT
```

The frontend may display the validation, but the backend must enforce it.

## 11. Seller Registration Flow

```text
Register
   ↓
Business Information
   ↓
Select District
   ↓
Create Seller Profile
   ↓
Verification if required
   ↓
Seller Dashboard
```

The registered district becomes the reference district for the seller's product listings.

## 12. Product Creation Flow

```text
Seller Dashboard
      ↓
Add Product
      ↓
Enter Product Data
      ↓
Select District
      ↓
Get Seller District
      ↓
Compare District IDs
      ↓
   ┌──┴──┐
 MATCH  MISMATCH
   ↓       ↓
 ALLOW   REJECT
```

## 13. Product Discovery

### Product-first

```text
Buyer Search
     ↓
Product API
     ↓
Database Search
     ↓
Products
     ↓
Product + District + Seller
```

Example:

```text
GET /api/products?search=paithani
```

### District-first

```text
Select District
     ↓
District API
     ↓
Associated Products
```

Filters can include product name, district, category, price, rating, availability, and pagination.

## 14. Product Details

```text
GET /api/products/:id
```

The backend retrieves:

```text
Product
Seller
District
Category
Reviews
```

The UI should clearly communicate:

```text
Product → District → Seller
```

## 15. Cart

```text
Add Product
     ↓
Validate Product
     ↓
Validate Stock
     ↓
Create/Update Cart Item
```

The server must calculate authoritative prices and totals.

Suggested APIs:

```text
GET    /api/cart
POST   /api/cart/items
PUT    /api/cart/items/:id
DELETE /api/cart/items/:id
```

## 16. Checkout and Payment

```text
Cart
 ↓
Validate Cart + Stock
 ↓
Calculate Total on Server
 ↓
Create Pending Order
 ↓
Create Razorpay Payment
 ↓
Customer Pays
 ↓
Backend Verifies Payment
 ↓
Confirm Order
```

A frontend success message must never be treated as proof of payment.

## 17. Order Lifecycle

```text
PENDING_PAYMENT
       ↓
CONFIRMED
       ↓
PROCESSING
       ↓
SHIPPED
       ↓
DELIVERED
```

Optional MVP status:

```text
CANCELLED
```

Future statuses:

```text
RETURN_REQUESTED
RETURN_APPROVED
RETURNED
REFUND_PENDING
REFUNDED
```

`OrderItem` should preserve the unit price at purchase time so later product-price changes do not alter historical orders.

## 18. Seller Order Flow

```text
New Order
   ↓
Seller Dashboard
   ↓
View Relevant Order
   ↓
Process
   ↓
Update Status
   ↓
Shipped
   ↓
Delivered
```

A seller can access only orders containing their products.

## 19. Review Architecture

A review is allowed only when:

```text
Buyer purchased product
        +
Order belongs to buyer
        +
Order = DELIVERED
```

Review fields:

```text
Buyer
Product
Order
Rating
Comment
Timestamp
```

## 20. Admin Architecture

```text
Admin Login
    ↓
Admin Dashboard
    ├── Users
    ├── Sellers
    ├── Products
    ├── Districts
    ├── Orders
    └── Reviews
```

Admin endpoints require authentication plus the `ADMIN` role.

## 21. API Domains

```text
/api/auth
/api/users
/api/sellers
/api/districts
/api/categories
/api/products
/api/cart
/api/orders
/api/payments
/api/reviews
/api/admin
```

Representative endpoints:

```text
POST   /api/auth/register
POST   /api/auth/login

GET    /api/products
GET    /api/products/:id
POST   /api/products
PUT    /api/products/:id

GET    /api/cart
POST   /api/cart/items
DELETE /api/cart/items/:id

POST   /api/orders
GET    /api/orders
GET    /api/orders/:id

POST   /api/payments/create
POST   /api/payments/verify

POST   /api/products/:id/reviews
GET    /api/products/:id/reviews
```

## 22. Authentication

```text
Login
 ↓
Validate Credentials
 ↓
Create Secure Session/Token
 ↓
Frontend Authentication State
 ↓
Protected API Request
 ↓
Authentication Middleware
 ↓
User + Role Identified
```

Passwords must be securely hashed. Secrets must not be exposed to the frontend.

## 23. Image Handling

```text
Seller
 ↓
Select Image
 ↓
Upload
 ↓
Object/Cloud Storage
 ↓
Image URL
 ↓
Product Record
```

PostgreSQL should store image references/URLs rather than large image binaries.

## 24. Security

Required controls:

- HTTPS in production
- Secure password hashing
- Authentication
- RBAC
- Resource ownership checks
- Input validation
- Secure CORS
- Rate limiting for sensitive endpoints
- Secure headers
- Environment-based secrets
- Server-side payment verification
- No secrets in Git/frontend

## 25. Data Integrity

Important invariants:

```text
User email → Unique
Product price → >= 0
Product stock → >= 0
Review rating → Valid range
Seller district = Product district
Order total → Server calculated
Review → Valid purchase required
```

Use database transactions for multi-record operations such as order/payment workflows.

## 26. Error Handling

Standard response:

```json
{
  "success": false,
  "message": "Seller and product must belong to the same district."
}
```

Suggested codes:

```text
200 OK
201 Created
400 Bad Request
401 Unauthorized
403 Forbidden
404 Not Found
409 Conflict
422 Validation Error
500 Internal Server Error
```

## 27. Deployment Architecture

```text
                Internet
                   │
        ┌──────────┴──────────┐
        ▼                     ▼
React Frontend          Node/Express API
        │                     │
        │                     ├── PostgreSQL
        │                     ├── Razorpay
        │                     └── File Storage
        └──────── HTTPS API ──┘
```

Separate development, testing/staging, and production environments should be supported.

## 28. Environment Configuration

Example variables:

```text
DATABASE_URL=
JWT_SECRET=
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
FRONTEND_URL=
```

Real secrets must never be committed to source control. Maintain an `.env.example` without real values.

## 29. Scalability

The MVP should remain simple:

```text
React → Express → PostgreSQL
```

If usage grows, the architecture can later introduce:

```text
Load Balancer
Multiple API Instances
Redis Cache
CDN
Search Engine
Background Jobs
Queues
```

These are not required for the initial MVP.

## 30. Future-Ready Modules

```text
Current
├── Marketplace
├── Seller
├── Buyer
├── Orders
├── Payments
└── Reviews

Future
├── Returns
├── Refunds
├── Logistics
├── Seller Verification
├── Notifications
├── Recommendations
├── Analytics
├── Multi-language
└── Mobile App
```

Returns can later be modeled as:

```text
Order
 └── OrderItem
       └── ReturnRequest
             └── Refund
```

This avoids redesigning the core order model.

## 31. End-to-End System Flow

```text
SELLER
  ↓
Registration
  ↓
District Selection
  ↓
Seller Dashboard
  ↓
Add Product
  ↓
District Validation
  ↓
Product Listed
  │
  │
BUYER
  ↓
Search Product
  ↓
Discover District + Seller
  ↓
Product Details
  ↓
Cart
  ↓
Checkout
  ↓
Razorpay
  ↓
Server-side Verification
  ↓
Order
  ↓
Seller Processing
  ↓
Shipped
  ↓
Delivered
  ↓
Review
```

## 32. Recommended Build Order

```text
1. Project Setup
2. Database + Prisma
3. Authentication
4. Roles + Authorization
5. District Management
6. Seller Module
7. Product Module
8. District Validation
9. Product Search/Discovery
10. Buyer Frontend
11. Cart
12. Checkout
13. Razorpay
14. Orders
15. Seller Order Management
16. Reviews
17. Admin Dashboard
18. Testing
19. Deployment
```

This sequence follows the project's dependencies and makes each major stage independently testable.

## 33. System Invariants

These must always remain true:

1. Every product belongs to a seller.
2. Product district equals seller district.
3. Order items reference valid products.
4. Sellers can modify only their own resources.
5. Buyers can access only their own private order information.
6. Only eligible buyers can create reviews.
7. Payment success is verified server-side.

## 34. System Completion Criteria

The system is complete for MVP when:

- Buyer, seller, and admin roles work independently.
- Authentication and authorization protect private operations.
- Sellers are associated with districts.
- Products are associated with districts.
- District mismatch is rejected by the backend.
- Buyers can search products without knowing the district.
- Product pages show district and seller information.
- Cart and checkout calculate totals securely on the server.
- Razorpay payments are verified server-side.
- Orders follow the defined lifecycle.
- Sellers can manage their own products/orders.
- Eligible buyers can submit reviews.
- Admin can manage essential marketplace data.
- Database relationships maintain integrity.
- The system can be deployed as separate frontend/backend/database services.
- Future returns, refunds, and logistics can be added without replacing the core architecture.

## 35. Final Architecture Summary

```text
                 ODOP NEXUS
                      │
        ┌─────────────┴─────────────┐
        ▼                           ▼
 React Frontend                  Users
        │
        │ HTTPS / REST
        ▼
 Node.js + Express
        │
 ┌──────┼──────────┐
 ▼      ▼          ▼
Auth  Business   Payments
      Logic      Razorpay
 │      │
 │      ▼
 └──► Prisma
          │
          ▼
      PostgreSQL
          │
          ▼
    File Storage
```

The architectural center is:

```text
          DISTRICT
          /               /             SELLER ─── PRODUCT
```

with the mandatory rule:

```text
SELLER DISTRICT = PRODUCT DISTRICT
```

and the primary buyer journey:

```text
SEARCH PRODUCT
      ↓
DISCOVER DISTRICT
      ↓
DISCOVER SELLER
      ↓
PURCHASE
      ↓
DELIVERY
      ↓
REVIEW
```
