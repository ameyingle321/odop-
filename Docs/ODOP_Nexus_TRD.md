# Technical Requirements Document (TRD)
## ODOP Nexus — District-Based ODOP Marketplace

**Document Version:** 1.0  
**Status:** MVP Technical Specification  
**Related Document:** Product Requirements Document (PRD)

---

## 1. Technical Overview

ODOP Nexus is a web-based, district-aware marketplace connecting buyers with local sellers of ODOP/local products.

The technical architecture must enforce the core business relationship:

```text
Seller District = Product District
```

The system must also allow buyers to search by product even when they do not know the relevant district.

The architecture should be modular and future-ready for returns, refunds, logistics, authentication improvements, recommendations and other marketplace capabilities.

---

# 2. Recommended Technology Stack

## 2.1 Frontend

- React.js
- JavaScript
- HTML5
- CSS3
- React Router
- Fetch API or Axios
- Responsive design

## 2.2 Backend

- Node.js
- Express.js
- REST API architecture
- JWT/session-based authentication
- Role-Based Access Control (RBAC)
- Input validation
- Error-handling middleware

## 2.3 Database

- PostgreSQL
- Prisma ORM

## 2.4 Payment

- Razorpay

Payment-sensitive operations must be verified on the server.

## 2.5 File/Image Storage

Product images should be stored using suitable object/cloud storage rather than directly storing large binary files in PostgreSQL.

## 2.6 Deployment

The system should support independent deployment of:

```text
React Frontend
       +
Node.js/Express Backend
       +
PostgreSQL Database
```

---

# 3. System Architecture

```text
┌──────────────────────┐
│       Buyer          │
│       Seller         │
│       Admin          │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│    React Frontend    │
│  UI + Routing + Auth │
└──────────┬───────────┘
           │ HTTPS / REST API
           ▼
┌──────────────────────┐
│   Express Backend    │
│ Controllers / Routes │
│ Services / Middleware│
└───────┬────────┬─────┘
        │        │
        ▼        ▼
┌────────────┐  ┌────────────────┐
│ PostgreSQL │  │    Razorpay    │
│  + Prisma  │  │ Payment Service│
└────────────┘  └────────────────┘
        │
        ▼
┌────────────────────┐
│ Image/File Storage │
└────────────────────┘
```

---

# 4. Application Architecture

The backend should follow a modular structure.

```text
Client
  ↓
Routes
  ↓
Authentication / Authorization Middleware
  ↓
Controllers
  ↓
Services / Business Logic
  ↓
Prisma ORM
  ↓
PostgreSQL
```

### Suggested backend structure

```text
backend/
├── src/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── routes/
│   ├── services/
│   ├── validators/
│   ├── utils/
│   ├── prisma/
│   └── app.js
├── prisma/
│   └── schema.prisma
├── .env
└── package.json
```

### Frontend structure

```text
frontend/
├── src/
│   ├── components/
│   ├── pages/
│   ├── layouts/
│   ├── services/
│   ├── hooks/
│   ├── context/
│   ├── utils/
│   └── App.jsx
├── public/
└── package.json
```

---

# 5. User Roles and Authorization

The system will use three primary roles:

```text
BUYER
SELLER
ADMIN
```

Authorization must be enforced on the backend.

Example:

```text
Buyer
 ├── Search products
 ├── Add to cart
 ├── Place orders
 └── Review products

Seller
 ├── Manage own products
 ├── View own orders
 └── Update fulfillment status

Admin
 ├── Manage users
 ├── Manage sellers
 ├── Manage products
 └── Monitor marketplace
```

A seller must never be able to modify another seller's products or orders.

---

# 6. Authentication

## 6.1 Registration

### Buyer

```text
POST /api/auth/register
```

### Seller

```text
POST /api/auth/register/seller
```

### Login

```text
POST /api/auth/login
```

Authentication should return a secure authenticated session/token.

Passwords must be hashed using a strong password-hashing algorithm such as bcrypt/Argon2.

---

# 7. Core Database Design

The main entities are:

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

---

# 8. Database Relationships

```text
User
 │
 ├──────────────► Seller
 │
 └──────────────► Orders
                       │
                       └── OrderItems ──► Product
                                           │
District ◄─────────────────────────────────┘
   ▲
   │
 Seller
```

### Important relationship

```text
Seller.district_id
        =
Product.district_id
```

This relationship must be enforced by backend business logic.

---

# 9. Suggested Database Schema

## User

```text
id
name
email
phone
password_hash
role
created_at
updated_at
```

## Seller

```text
id
user_id
business_name
address
district_id
state
verification_status
created_at
updated_at
```

## District

```text
id
name
state
description
odop_product_id / association data
created_at
updated_at
```

## Category

```text
id
name
description
```

## Product

```text
id
seller_id
district_id
category_id
name
description
price
stock
status
images
created_at
updated_at
```

## Order

```text
id
buyer_id
total_amount
payment_status
order_status
delivery_address
created_at
updated_at
```

## OrderItem

```text
id
order_id
product_id
seller_id
quantity
unit_price
subtotal
```

## Payment

```text
id
order_id
provider
provider_order_id
provider_payment_id
amount
status
created_at
```

## Review

```text
id
product_id
buyer_id
order_id
rating
comment
created_at
updated_at
```

---

# 10. Critical District Validation

This is the most important custom business rule.

When a seller creates a product:

```text
Seller District
       ↓
Get seller.district_id
       ↓
Product district selected
       ↓
Compare IDs
       ↓
Same?
 ┌─────┴─────┐
YES         NO
 ↓           ↓
Allow      Reject
listing    listing
```

Example:

```text
Seller:
District = Pune

Product:
District = Nashik

Result:
❌ Product cannot be listed.
```

Correct case:

```text
Seller:
District = Nashik

Product:
District = Nashik

Result:
✓ Product can be listed.
```

The frontend may show this validation for user experience, but the backend must enforce it because frontend validation alone can be bypassed.

---

# 11. Product Discovery System

The search system must support product-first discovery.

Example:

```text
Buyer enters:
"Paithani Saree"

        ↓

Search Product
        ↓

Relevant products
        ↓

Display:
Product + District + Seller
```

The buyer does not need to enter a district.

### Search filters

Possible MVP filters:

- Product name
- Category
- District
- Price range
- Rating
- Availability

### Example API

```text
GET /api/products?search=paithani
```

District filter:

```text
GET /api/products?district=nashik
```

Category filter:

```text
GET /api/products?category=textiles
```

---

# 12. Product APIs

### Create Product

```text
POST /api/products
```

Seller authentication required.

### Get Products

```text
GET /api/products
```

### Get Product

```text
GET /api/products/:id
```

### Update Product

```text
PUT /api/products/:id
```

Seller ownership validation required.

### Delete/Deactivate Product

```text
DELETE /api/products/:id
```

---

# 13. Cart System

### APIs

```text
GET    /api/cart
POST   /api/cart/items
PUT    /api/cart/items/:id
DELETE /api/cart/items/:id
```

The server must calculate authoritative prices and totals.

The frontend must not be trusted to submit the final payable amount.

---

# 14. Order Processing

Order flow:

```text
Cart
 ↓
Checkout
 ↓
Create Pending Order
 ↓
Create Payment
 ↓
Razorpay
 ↓
Payment Verification
 ↓
Confirm Order
 ↓
Seller Processing
 ↓
Shipped
 ↓
Delivered
```

### Important

An order should not be considered paid simply because the frontend reports success.

The backend must verify the payment response/signature with the payment provider.

---

# 15. Payment Integration

Planned payment provider:

**Razorpay**

Technical flow:

```text
Frontend
   ↓
Backend creates payment/order
   ↓
Razorpay Checkout
   ↓
Customer pays
   ↓
Payment result
   ↓
Backend verifies payment
   ↓
Database payment status updated
   ↓
Order confirmed
```

Sensitive payment credentials must be stored in environment variables.

Example:

```text
RAZORPAY_KEY_ID
RAZORPAY_KEY_SECRET
```

Secrets must never be committed to Git.

---

# 16. Order Status Model

Initial status:

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

Optional:

```text
CANCELLED
```

The design should leave room for future:

```text
RETURN_REQUESTED
RETURN_APPROVED
RETURNED
REFUND_PENDING
REFUNDED
```

---

# 17. Review System

A review can be submitted only when:

```text
Buyer purchased product
        +
Order belongs to buyer
        +
Order status = DELIVERED
```

This prevents arbitrary reviews.

API:

```text
POST /api/products/:id/reviews
GET  /api/products/:id/reviews
```

---

# 18. Admin APIs

Examples:

```text
GET    /api/admin/users
GET    /api/admin/sellers
PATCH  /api/admin/sellers/:id/status

GET    /api/admin/products
PATCH  /api/admin/products/:id/status

GET    /api/admin/orders
GET    /api/admin/reviews
```

All admin APIs must require:

```text
Authentication
+
ADMIN role
```

---

# 19. Security Requirements

## Authentication Security

- Hash passwords.
- Never store plaintext passwords.
- Use secure authentication tokens/sessions.
- Protect authenticated endpoints.

## Authorization

Every protected operation must verify:

```text
Is authenticated?
       ↓
What role?
       ↓
Does user own this resource?
       ↓
Allow / Deny
```

## API Security

- Validate request bodies.
- Validate query parameters.
- Sanitize/handle user-generated content appropriately.
- Use HTTPS in production.
- Apply rate limiting to sensitive endpoints.
- Use secure CORS configuration.
- Do not expose secrets in frontend code.

---

# 20. Data Integrity

Important database constraints should include:

- Unique user email where applicable.
- Foreign keys between related entities.
- Non-negative product prices.
- Non-negative inventory.
- Valid rating range.
- Required relationships for orders/order items.
- Appropriate indexes for frequent searches.

Transactions should be used for operations that modify multiple related records, especially order/payment workflows.

---

# 21. API Error Handling

The backend should return consistent responses.

Example:

```json
{
  "success": false,
  "message": "Seller and product must belong to the same district."
}
```

Suggested HTTP codes:

```text
200  Success
201  Created
400  Bad Request
401  Unauthorized
403  Forbidden
404  Not Found
409  Conflict
422  Validation Error
500  Internal Server Error
```

---

# 22. Environment Configuration

Sensitive configuration should be stored in `.env`.

Example:

```text
DATABASE_URL=
JWT_SECRET=
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
FRONTEND_URL=
```

`.env` must be included in `.gitignore`.

A safe `.env.example` should be maintained without real secrets.

---

# 23. Image Handling

Product images should follow this flow:

```text
Seller
  ↓
Select Image
  ↓
Upload
  ↓
Cloud/Object Storage
  ↓
Image URL
  ↓
Product Database Record
```

The database should store the image reference/URL rather than large image binaries.

Image validation should include:

- Allowed file types.
- Maximum file size.
- Basic upload security.
- Reasonable image dimensions.

---

# 24. Performance Requirements

The application should:

- Use pagination for product lists.
- Index product search/filter fields.
- Avoid returning unnecessary fields.
- Optimize product images.
- Use database transactions where required.
- Avoid N+1 database queries.
- Support lazy loading where useful.

Product APIs should return paginated results rather than loading the entire catalog.

Example:

```text
GET /api/products?page=1&limit=20
```

---

# 25. Search and Database Indexing

Likely indexed fields:

```text
Product.name
Product.district_id
Product.category_id
Product.seller_id
Product.status
Order.buyer_id
Order.order_status
Review.product_id
```

For larger catalogs, PostgreSQL full-text search or a dedicated search service can be introduced later.

---

# 26. Frontend Requirements

Important pages:

```text
/
├── Home
├── Login
├── Register
├── Seller Registration
├── Product Search
├── Product Details
├── District Explorer
├── Cart
├── Checkout
├── Payment Result
├── My Orders
├── My Reviews
├── Seller Dashboard
├── Seller Products
├── Seller Orders
└── Admin Dashboard
```

The frontend must be responsive for:

- Mobile
- Tablet
- Desktop

---

# 27. State Management

The application can initially use React Context/hooks for limited global state such as:

- Authentication
- Cart
- User information

A larger state-management library can be introduced if application complexity requires it.

Server data should be fetched through a centralized API/service layer.

---

# 28. Validation Rules

### Seller

Required:

- Name/business name
- Contact information
- Address
- District
- State
- Authentication credentials

### Product

Required:

- Name
- Description
- Price
- District
- Category
- Seller
- Stock
- At least one valid product image where required

### Order

Required:

- Buyer
- Order items
- Delivery address
- Payment information/status
- Total amount

---

# 29. Logging and Monitoring

Production backend should log:

- Authentication failures.
- Important API errors.
- Payment events.
- Order state changes.
- Critical validation failures.

Logs must not contain:

- Passwords.
- Payment secrets.
- Authentication secrets.
- Unnecessary sensitive customer information.

---

# 30. Testing Requirements

## Unit Testing

Test:

- District validation.
- Price calculations.
- Order calculations.
- Permission checks.
- Review eligibility.

## API Testing

Test:

- Authentication.
- Product CRUD.
- Search.
- Cart.
- Checkout.
- Payment verification.
- Orders.
- Reviews.

## Integration Testing

Important end-to-end flow:

```text
Seller Registration
      ↓
Create Product
      ↓
District Validation
      ↓
Buyer Search
      ↓
Add to Cart
      ↓
Checkout
      ↓
Payment
      ↓
Order
      ↓
Delivery
      ↓
Review
```

---

# 31. Deployment Architecture

Recommended production structure:

```text
                 Internet
                    │
          ┌─────────┴─────────┐
          ▼                   ▼
   Frontend Hosting      Backend Hosting
      React                 Node.js
          │                   │
          │                   ▼
          │             PostgreSQL
          │
          └──────────► API

                 ┌──────────────┐
                 │   Razorpay   │
                 └──────────────┘
```

Environment-specific configuration should be used for development, testing and production.

---

# 32. Git and Development Workflow

Recommended branches:

```text
main
develop
feature/*
bugfix/*
```

Each feature should be developed independently and merged after testing.

Example:

```text
feature/product-search
feature/seller-registration
feature/payment
feature/order-management
```

---

# 33. MVP Technical Scope

### Must Implement

- Authentication.
- Buyer/seller/admin roles.
- Seller district registration.
- Product CRUD.
- Seller-product district validation.
- Product-first search.
- District filtering.
- Product details.
- Cart.
- Checkout.
- Razorpay payment.
- Order management.
- Basic delivery status.
- Verified purchase reviews.
- Admin management.

### Can Be Deferred

- Advanced recommendation engine.
- Dedicated search engine.
- Automated returns.
- Automated refunds.
- Logistics-provider API.
- Advanced analytics.
- Mobile application.

---

# 34. Future Architecture Readiness

The database and API structure should avoid decisions that make future features difficult.

Future modules can be added:

```text
Current
├── Marketplace
├── Orders
├── Payments
└── Reviews

Future
├── Returns
├── Refunds
├── Logistics
├── Seller Verification
├── Recommendations
├── Analytics
├── Notifications
└── Multi-language
```

The order model should therefore be designed so returns and refunds can later be attached to individual order items rather than forcing a complete redesign.

---

# 35. Technical Acceptance Criteria

The system is technically ready for MVP when:

1. Authentication works for all required roles.
2. Backend authorization prevents role/resource violations.
3. Seller district is stored and linked to the seller.
4. Product district is stored and linked to the product.
5. Backend prevents mismatched seller-product districts.
6. Buyers can search products without knowing the district.
7. Product results expose district and seller information.
8. Cart totals are calculated securely on the server.
9. Razorpay payment results are verified server-side.
10. Successful payment creates/updates the correct order state.
11. Sellers can manage only their own products and orders.
12. Buyers can review only eligible purchased products.
13. Admin-only functions are protected.
14. Database relationships and constraints preserve data integrity.
15. The architecture leaves extension points for returns, refunds and logistics.

---

# 36. Final Technical Summary

The recommended architecture is:

```text
React
  ↓
REST API
  ↓
Node.js + Express
  ↓
Business Logic / RBAC / Validation
  ↓
Prisma ORM
  ↓
PostgreSQL
```

With external services:

```text
Razorpay → Payments
Cloud Storage → Product Images
```

The most important technical rule is:

```text
Seller District
      =
Product District
```

The second major requirement is:

```text
Product-first discovery
```

A buyer can search for a product without knowing its district, while the platform provides the district and seller context.

The MVP should remain simple, secure and modular while keeping the data model and APIs ready for future marketplace capabilities.
