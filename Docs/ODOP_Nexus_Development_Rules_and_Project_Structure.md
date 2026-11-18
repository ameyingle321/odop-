# ODOP Nexus — Development Rules & Project Structure

**Document Version:** 1.0  
**Purpose:** Senior-development standards and project structure guide  
**Project:** ODOP Nexus — District-Based ODOP Marketplace  
**Audience:** Antigravity, developers, reviewers, and project maintainers

---

# 1. Purpose

This document defines the coding, architecture, security, database, Git, UI, API, testing, and file-organization rules that must be followed while building ODOP Nexus.

The goal is to prevent the project from becoming difficult to understand or maintain as more features are added.

The project must be developed as a **real modular application**, not as a collection of quick fixes.

---

# 2. Core Development Principles

Follow these principles throughout the project.

## 2.1 Build for Maintainability

Prefer:

```text
Simple + modular + understandable
```

over:

```text
Complex + clever + difficult to maintain
```

Every important piece of logic should have an obvious location.

---

## 2.2 Separation of Responsibilities

Do not put everything into one file.

Separate:

```text
UI
↓
API communication
↓
Business logic
↓
Database operations
```

For example:

```text
React Component
      ↓
API Service
      ↓
Backend Route
      ↓
Controller
      ↓
Service
      ↓
Supabase
```

---

## 2.3 Never Duplicate Business Logic

If a rule exists in one central place, do not rewrite it differently throughout the application.

Example:

```text
Seller District = Product District
```

The authoritative validation must exist in the backend/service layer.

Frontend validation can provide immediate feedback, but it must not be the only validation.

---

# 3. Technology Rules

Use the technologies already selected for the project unless there is a strong technical reason to change them.

## Frontend

```text
React
JavaScript
HTML
CSS
React Router
```

## Backend

```text
Node.js
Express.js
REST APIs
```

## Database / Platform

```text
Supabase
PostgreSQL
Supabase Auth
Supabase Storage
```

## ORM / Database Access

Use the project-approved database access approach consistently.

Do not introduce multiple competing database-access patterns without a clear reason.

## Payment

```text
Razorpay
```

---

# 4. Project Architecture

Use a clear separation:

```text
Frontend
   ↓
Backend API
   ↓
Business Logic
   ↓
Supabase
   ├── PostgreSQL
   ├── Auth
   └── Storage
```

The frontend must not directly implement sensitive business operations.

---

# 5. Recommended Root File Structure

Maintain the project approximately like this:

```text
odop-nexus/
│
├── frontend/
│
├── backend/
│
├── database/
│
├── docs/
│
├── scripts/
│
├── tests/
│
├── .gitignore
├── README.md
└── package.json
```

Do not randomly create files in the root directory.

---

# 6. Frontend File Structure

Recommended structure:

```text
frontend/
│
├── public/
│
├── src/
│   │
│   ├── assets/
│   │   ├── images/
│   │   ├── icons/
│   │   └── fonts/
│   │
│   ├── components/
│   │   ├── common/
│   │   ├── layout/
│   │   ├── product/
│   │   ├── cart/
│   │   ├── order/
│   │   └── seller/
│   │
│   ├── pages/
│   │   ├── public/
│   │   ├── auth/
│   │   ├── buyer/
│   │   ├── seller/
│   │   └── admin/
│   │
│   ├── layouts/
│   │
│   ├── services/
│   │   ├── authService.js
│   │   ├── productService.js
│   │   ├── cartService.js
│   │   ├── orderService.js
│   │   └── reviewService.js
│   │
│   ├── hooks/
│   │
│   ├── context/
│   │
│   ├── utils/
│   │
│   ├── constants/
│   │
│   ├── routes/
│   │
│   ├── styles/
│   │
│   ├── lib/
│   │
│   ├── App.jsx
│   └── main.jsx
│
├── .env
├── .env.example
├── package.json
└── README.md
```

---

# 7. Frontend Folder Responsibilities

## `components/`

Reusable UI components.

Examples:

```text
ProductCard
SearchBar
Navbar
Footer
Modal
Button
OrderStatus
RatingStars
```

A component should be reusable where practical.

---

## `pages/`

Complete screens/routes.

Examples:

```text
Home
ProductSearch
ProductDetails
Cart
Checkout
Orders
SellerDashboard
AdminDashboard
```

Do not put reusable components here unless they are specific to one page.

---

## `services/`

API communication.

Example:

```text
productService.js
```

contains functions such as:

```text
getProducts()
getProductById()
createProduct()
updateProduct()
deleteProduct()
```

Do not scatter raw API calls throughout random components.

---

## `hooks/`

Reusable React hooks.

Examples:

```text
useAuth
useProducts
useCart
useOrders
```

---

## `context/`

Global application state that genuinely needs to be shared.

Examples:

```text
AuthContext
CartContext
```

Do not put every piece of state into global context.

---

## `utils/`

Small reusable utility functions.

Examples:

```text
formatCurrency()
formatDate()
validateEmail()
```

Do not place business-critical operations here simply because they are convenient.

---

## `constants/`

Central values such as:

```text
ORDER_STATUSES
USER_ROLES
PRODUCT_STATUSES
```

Avoid repeating magic strings throughout the application.

---

# 8. Backend File Structure

Recommended:

```text
backend/
│
├── src/
│   │
│   ├── config/
│   │   ├── env.js
│   │   └── supabase.js
│   │
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── product.routes.js
│   │   ├── seller.routes.js
│   │   ├── cart.routes.js
│   │   ├── order.routes.js
│   │   ├── payment.routes.js
│   │   ├── review.routes.js
│   │   └── admin.routes.js
│   │
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── product.controller.js
│   │   ├── seller.controller.js
│   │   ├── cart.controller.js
│   │   ├── order.controller.js
│   │   ├── payment.controller.js
│   │   ├── review.controller.js
│   │   └── admin.controller.js
│   │
│   ├── services/
│   │   ├── auth.service.js
│   │   ├── product.service.js
│   │   ├── seller.service.js
│   │   ├── cart.service.js
│   │   ├── order.service.js
│   │   ├── payment.service.js
│   │   └── review.service.js
│   │
│   ├── middleware/
│   │   ├── auth.middleware.js
│   │   ├── role.middleware.js
│   │   ├── validation.middleware.js
│   │   └── error.middleware.js
│   │
│   ├── validators/
│   │
│   ├── utils/
│   │
│   ├── constants/
│   │
│   ├── app.js
│   └── server.js
│
├── tests/
├── .env
├── .env.example
├── package.json
└── README.md
```

---

# 9. Backend Responsibility Rules

Follow:

```text
Route
  ↓
Middleware
  ↓
Controller
  ↓
Service
  ↓
Database
```

## Routes

Only define endpoints and attach middleware.

Do not put complicated business logic in routes.

---

## Controllers

Controllers should:

- Read request data.
- Call the appropriate service.
- Return the response.

Controllers should remain relatively thin.

Avoid putting 100+ lines of business logic into controllers.

---

## Services

Services contain business logic.

Examples:

```text
product.service.js
order.service.js
payment.service.js
```

The following must belong in services:

```text
District validation
Order creation
Price calculation
Stock validation
Payment verification
Review eligibility
```

---

# 10. Database Rules

Supabase is the database platform.

The database structure must remain normalized and relational.

Use:

```text
Foreign Keys
Indexes
Constraints
RLS
```

Do not duplicate data unnecessarily.

---

# 11. Critical Business Rules

These rules must never be bypassed.

## Rule 1 — District Integrity

```text
Seller District = Product District
```

A Pune seller cannot list a Nashik product.

---

## Rule 2 — Seller Ownership

A seller can modify only products belonging to that seller.

```text
Authenticated Seller
       ↓
Check product.seller_id
       ↓
Must match current seller
```

---

## Rule 3 — Buyer Order Privacy

A buyer can view only their own orders.

---

## Rule 4 — Review Eligibility

A review requires:

```text
Valid Buyer
+
Valid Order
+
Product in Order
+
Order Delivered
```

---

## Rule 5 — Payment Verification

Never trust:

```text
Frontend says payment successful
```

The backend must verify the payment with Razorpay.

---

## Rule 6 — Server-Side Price Calculation

The frontend must never be the final authority for:

```text
Product price
Quantity
Subtotal
Order total
```

The backend must calculate/verify them.

---

# 12. Supabase Rules

Use Supabase for:

```text
PostgreSQL
Authentication
Row Level Security
Storage
```

Enable RLS on all application tables.

At minimum:

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

---

# 13. Supabase Security Rules

Never expose:

```text
SUPABASE_SERVICE_ROLE_KEY
```

to the frontend.

It must remain server-side.

Frontend can use the public/anon key according to the Supabase security model.

Use environment variables.

---

# 14. Authentication Rules

Supabase Auth is the authentication source.

Do not create a second independent password system.

Use:

```text
auth.users
```

for authentication identity.

Use:

```text
profiles
```

for application-level user information.

---

# 15. Authorization Rules

Never trust the frontend to determine permissions.

Bad:

```text
if (user.role === "admin") {
   show admin data
}
```

The backend/database must independently enforce authorization.

Frontend role checks are only for UI convenience.

---

# 16. API Rules

All API endpoints must have a clear purpose.

Use consistent naming:

```text
GET    /api/products
GET    /api/products/:id
POST   /api/products
PUT    /api/products/:id
DELETE /api/products/:id
```

Do not create inconsistent endpoint names such as:

```text
/getProducts
/productFetch
/fetchAllProductsNow
```

---

# 17. API Response Format

Use a consistent structure.

Success:

```json
{
  "success": true,
  "data": {}
}
```

Error:

```json
{
  "success": false,
  "message": "Product not found."
}
```

For validation errors:

```json
{
  "success": false,
  "message": "Validation failed.",
  "errors": {}
}
```

Do not expose raw database errors to users.

---

# 18. Error Handling

Use centralized backend error handling.

```text
Request
  ↓
Route
  ↓
Controller
  ↓
Service
  ↓
Error
  ↓
Central Error Middleware
  ↓
Safe API Response
```

Never leave random:

```text
console.log(error)
```

as the application's only error handling.

Logs can exist for debugging, but users must receive clean messages.

---

# 19. Environment Variables

Use:

```text
.env
.env.example
```

Example:

```text
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
FRONTEND_URL=
```

Never commit `.env`.

`.env.example` can be committed with empty/example values.

---

# 20. Git Rules

Use Git from the beginning.

Recommended:

```text
main
develop
feature/*
bugfix/*
```

Example:

```text
feature/seller-registration
feature/product-search
feature/cart
feature/payment
```

Do not directly experiment on `main`.

---

# 21. Commit Rules

Commits should describe what changed.

Good:

```text
feat: add seller registration
feat: implement district validation
fix: prevent duplicate cart items
fix: correct order total calculation
docs: update database setup
```

Bad:

```text
update
changes
final
final2
new
test
```

Keep commits focused.

---

# 22. Pull Request / Review Rules

Before merging a feature:

```text
Code works
+
Tests pass
+
No secrets exposed
+
No unnecessary files
+
No console/debug leftovers
+
Existing features still work
```

Review the diff before merging.

---

# 23. Naming Conventions

## JavaScript

Use:

```text
camelCase
```

Examples:

```text
getProducts
createOrder
productId
sellerDistrict
```

## React Components

Use:

```text
PascalCase
```

Examples:

```text
ProductCard.jsx
SearchBar.jsx
OrderStatus.jsx
```

## Files

Use consistent naming.

For backend:

```text
product.controller.js
product.service.js
product.routes.js
```

---

# 24. Component Rules

React components should be reasonably small.

If a component becomes difficult to understand, split it.

Avoid:

```text
1000-line ProductPage.jsx
```

Prefer:

```text
ProductPage
├── ProductGallery
├── ProductInfo
├── SellerInfo
├── ProductActions
└── ReviewSection
```

---

# 25. UI Rules

The UI should be consistent across:

```text
Buyer
Seller
Admin
```

Maintain a common design system.

Centralize:

```text
Colors
Typography
Spacing
Buttons
Inputs
Cards
Modals
Badges
Status indicators
```

Do not randomly create different button styles on every page.

---

# 26. Responsive Design

Every important user-facing page must work on:

```text
Mobile
Tablet
Desktop
```

Do not design only for desktop.

At minimum test:

```text
360px
768px
1024px
1440px
```

---

# 27. Accessibility Rules

Use semantic HTML.

Prefer:

```text
button
nav
main
section
header
footer
form
label
```

over unnecessary generic `div` elements.

Inputs must have labels.

Images should have meaningful `alt` text.

Interactive elements must be keyboard accessible.

---

# 28. Loading States

Every important async operation should have a loading state.

Examples:

```text
Loading products...
Creating product...
Processing payment...
Loading orders...
```

Do not leave users staring at a blank screen.

---

# 29. Empty States

Every list should handle empty data.

Examples:

```text
No products found.
Your cart is empty.
You have no orders yet.
No reviews yet.
```

Do not assume the database always contains data.

---

# 30. Error States

Pages should handle:

```text
Network failure
Unauthorized access
Not found
Server error
Validation error
Payment failure
```

Example:

```text
Something went wrong.
Please try again.
```

Do not expose technical stack traces.

---

# 31. Security Rules

Never:

- Store plaintext passwords.
- Put secrets in frontend code.
- Trust client-side role checks.
- Trust client-side prices.
- Trust client-side payment success.
- Disable RLS for convenience.
- Expose private database data unnecessarily.
- Commit API secrets.
- Use `dangerouslySetInnerHTML` without a legitimate, sanitized need.

---

# 32. Input Validation

Validate data at multiple levels where appropriate:

```text
Frontend validation
       +
Backend validation
       +
Database constraints
```

Frontend validation improves UX.

Backend validation protects the system.

Database constraints protect data integrity.

---

# 33. Product Validation

Before product creation:

```text
Validate name
Validate description
Validate price
Validate stock
Validate category
Validate district
Validate seller ownership
Validate district relationship
Validate image requirements
```

---

# 34. Order Safety

When creating an order:

```text
1. Verify authenticated buyer.
2. Read current product information.
3. Verify product is active.
4. Verify stock.
5. Calculate price on server.
6. Calculate total on server.
7. Create order transactionally.
8. Initiate payment.
9. Verify payment.
10. Update order status.
```

Do not trust the frontend's submitted total.

---

# 35. Stock Management

Stock must be validated server-side.

Example:

```text
Available stock = 5
Buyer requests = 7

Result:
❌ Reject
```

When order/payment processing changes inventory, use safe transactional logic to reduce race-condition problems.

---

# 36. Payment Rules

Razorpay integration must be isolated in:

```text
payment.service.js
```

Do not spread payment logic across:

```text
React components
Product services
Order pages
Random utility files
```

Payment secrets remain server-side.

---

# 37. Logging Rules

Log useful technical information:

```text
API failures
Payment events
Order state changes
Authentication failures
Critical database errors
```

Never log:

```text
Passwords
API secrets
Payment secrets
Full authentication tokens
```

---

# 38. Performance Rules

Do not optimize prematurely, but avoid obvious performance problems.

Follow:

- Pagination for product lists.
- Pagination for orders/reviews where needed.
- Optimized product images.
- Database indexes.
- Avoid unnecessary API requests.
- Avoid repeated database queries.
- Lazy-load heavy UI where useful.
- Do not fetch entire tables when only a subset is needed.

---

# 39. API and Database Query Rules

Never retrieve unnecessary fields.

Bad:

```text
SELECT everything for every product request
```

Prefer returning only what the page needs.

Use pagination:

```text
?page=1&limit=20
```

---

# 40. File Size Rules

Avoid giant files.

As a practical guideline:

```text
Small file → Good
Medium file → Review
Very large file → Split responsibility
```

Do not mechanically split every 50 lines. Split when responsibilities become unclear.

---

# 41. Documentation Rules

Maintain:

```text
docs/
├── PRD.md
├── TRD.md
├── SYSTEM_DESIGN.md
├── DATABASE.md
├── API.md
├── UI_UX.md
├── IMPLEMENTATION_PLAN.md
├── TESTING.md
└── DEPLOYMENT.md
```

Documentation must be updated when major architecture decisions change.

---

# 42. Do Not Create Unnecessary Documentation

Documentation should describe actual implementation.

Do not create documents just to increase document count.

Every document should have a clear purpose.

---

# 43. Testing Structure

Recommended:

```text
tests/
├── unit/
├── integration/
└── e2e/
```

Examples:

```text
unit/
  districtValidation.test.js

integration/
  productApi.test.js
  orderApi.test.js

e2e/
  buyerPurchaseFlow.test.js
```

---

# 44. Minimum Testing Requirements

Before calling MVP complete, test:

### Authentication

```text
Register
Login
Logout
Unauthorized access
```

### Seller

```text
Seller registration
Product creation
Product editing
Ownership restrictions
```

### District Rule

```text
Same district → allowed
Different district → rejected
Frontend bypass → still rejected
```

### Buyer

```text
Search
Product details
Cart
Checkout
Orders
Reviews
```

### Payment

```text
Success
Failure
Invalid verification
Duplicate/callback scenarios
```

### Security

```text
Buyer cannot access another buyer's order
Seller cannot modify another seller's product
Normal user cannot perform admin operations
```

---

# 45. Antigravity Development Rules

Antigravity must work in small, verifiable stages.

For each task:

```text
1. Understand the task.
2. Inspect existing code.
3. Plan the change.
4. Implement the smallest correct change.
5. Run the application/tests.
6. Verify the expected behavior.
7. Check for regressions.
8. Report what changed.
9. Only then move to the next task.
```

Do not allow Antigravity to rewrite unrelated parts of the project while implementing one feature.

---

# 46. Antigravity Must Not

Do not allow it to:

```text
❌ Rewrite the entire project unnecessarily
❌ Delete working features without reason
❌ Replace the selected tech stack without approval
❌ Create duplicate implementations
❌ Hard-code secrets
❌ Disable security controls to make an error disappear
❌ Disable RLS just to fix a permission problem
❌ Put all logic into one file
❌ Create fake backend responses instead of implementing the API
❌ Use mock data as the permanent implementation
❌ Mark unfinished features as complete
```

---

# 47. Handling Errors During Development

When something fails:

```text
Error
 ↓
Understand root cause
 ↓
Fix root cause
 ↓
Retest
```

Do not use:

```text
random workaround
```

Example:

If Supabase returns a permission error:

```text
Do NOT disable RLS immediately.
```

Instead check:

```text
Authentication
↓
User identity
↓
Role
↓
RLS policy
↓
Query
```

---

# 48. No Fake Functionality

The final application must not contain fake functionality presented as real.

Examples of unacceptable final behavior:

```text
"Payment successful" without payment verification
"Order placed" without database order
"Seller approved" without actual state change
"Product uploaded" without persistence
```

Mock data is acceptable during early UI development, but it must be clearly temporary and replaced before the corresponding feature is considered complete.

---

# 49. Development Checkpoints

At the end of every major module, verify:

```text
Frontend works
Backend works
Database works
Authentication works
Authorization works
Error handling works
Responsive UI works
No existing feature broke
```

---

# 50. Recommended Development Phases

## Phase 1 — Foundation

```text
Project setup
Folder structure
Environment variables
Supabase connection
Git setup
```

## Phase 2 — Database

```text
Tables
Relationships
RLS
Storage
Seed data
Database testing
```

## Phase 3 — Authentication

```text
Buyer registration
Login
Logout
Seller registration
Roles
Authorization
```

## Phase 4 — Marketplace

```text
Products
Categories
Districts
Seller product management
District validation
Search
Product details
```

## Phase 5 — Purchase

```text
Cart
Checkout
Razorpay
Orders
Seller fulfillment
```

## Phase 6 — Trust

```text
Reviews
Seller information
Error states
Validation
```

## Phase 7 — Admin

```text
Admin dashboard
User management
Seller management
Product management
Order monitoring
```

## Phase 8 — Quality

```text
Testing
Security review
Performance review
Responsive testing
Bug fixing
```

## Phase 9 — Deployment

```text
Production database
Backend deployment
Frontend deployment
Environment variables
Domain/configuration
Final testing
```

---

# 51. Definition of Done for a Feature

A feature is **not complete** merely because the UI exists.

A feature is complete when:

```text
UI
+
API
+
Business Logic
+
Database
+
Authentication/Authorization
+
Validation
+
Error Handling
+
Testing
```

are implemented where applicable.

Example:

### Product Creation

Not complete:

```text
Add Product form exists.
```

Complete:

```text
Form
 ↓
API
 ↓
Authentication
 ↓
Seller ownership
 ↓
District validation
 ↓
Database persistence
 ↓
Image upload
 ↓
Success/error handling
 ↓
Testing
```

---

# 52. Project Cleanliness Rules

Before every major milestone:

Remove:

```text
Unused imports
Unused components
Dead code
Temporary debug logs
Temporary mock data
Unused dependencies
Duplicate functions
Old commented-out implementations
```

Do not leave multiple abandoned versions of the same feature.

---

# 53. Dependency Rules

Before installing a new package, ask:

```text
Do we actually need it?
Can the existing stack handle it?
Does it add significant complexity?
Is it maintained?
```

Avoid installing multiple libraries that solve the same problem.

---

# 54. Configuration Rules

Centralize configuration.

Do not scatter:

```text
API URLs
Supabase URLs
Payment configuration
Feature flags
```

throughout components.

Use environment variables/configuration files.

---

# 55. Architecture Change Rule

If a proposed change affects:

```text
Database architecture
Authentication
Payment system
API structure
Core business rules
Technology stack
```

stop and review the PRD/TRD/System Design before implementing it.

Do not silently change architecture.

---

# 56. Core ODOP Nexus Invariants

These are non-negotiable:

```text
1. Seller belongs to a district.
2. Product belongs to a district.
3. Seller district must equal product district.
4. Buyers can discover products without knowing the district.
5. Seller can manage only own resources.
6. Buyer can access only own private order data.
7. Reviews require an eligible purchase.
8. Payment must be verified server-side.
9. Final prices/totals are server-authoritative.
10. Supabase RLS must protect database access.
```

---

# 57. Final Recommended Structure

The final repository should look approximately like:

```text
odop-nexus/
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── layouts/
│   │   ├── services/
│   │   ├── hooks/
│   │   ├── context/
│   │   ├── constants/
│   │   ├── utils/
│   │   ├── routes/
│   │   ├── styles/
│   │   ├── lib/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── .env.example
│   └── package.json
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── middleware/
│   │   ├── validators/
│   │   ├── constants/
│   │   ├── utils/
│   │   ├── app.js
│   │   └── server.js
│   ├── tests/
│   ├── .env.example
│   └── package.json
│
├── database/
│   ├── migrations/
│   ├── seeds/
│   └── README.md
│
├── docs/
│   ├── PRD.md
│   ├── TRD.md
│   ├── SYSTEM_DESIGN.md
│   ├── DATABASE.md
│   ├── API.md
│   ├── UI_UX.md
│   ├── IMPLEMENTATION_PLAN.md
│   ├── TESTING.md
│   └── DEPLOYMENT.md
│
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── scripts/
│
├── .gitignore
├── README.md
└── package.json
```

---

# 58. Final Senior Developer Rule

The most important rule for this project is:

> **Do not optimize for “getting the website working quickly.” Optimize for getting each feature working correctly, securely, and in a structure that the next developer can understand.**

For ODOP Nexus, every feature should follow:

```text
Requirement
    ↓
Design
    ↓
Database/API
    ↓
Backend Logic
    ↓
Frontend
    ↓
Validation
    ↓
Testing
    ↓
Verification
```

The project should remain understandable to someone who did not build it.

That is the standard to follow throughout development.
