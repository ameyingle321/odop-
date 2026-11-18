# Product Requirements Document (PRD)
## ODOP Nexus — District-Based ODOP Marketplace

**Document Version:** 1.0  
**Status:** Product Definition / MVP  
**Product Type:** Web-based marketplace  
**Primary Users:** Buyers, Sellers, Platform Admin

---

## 1. Product Overview

ODOP Nexus is a district-based digital marketplace designed around India's One District One Product (ODOP) concept. The platform connects buyers with local sellers while maintaining a strong relationship between a product, its originating district, and the seller offering it.

The platform solves a key discovery problem: a buyer may want a particular traditional/local product but may not know which district it is famous for or where to find a suitable seller.

The marketplace therefore supports both **product-first discovery** and **district-aware discovery**.

### Core Principle

> A seller and the product they list must belong to the same district.

For example, a seller registered in Pune cannot list a Nashik-specific ODOP product.

---

## 2. Problem Statement

Buyers often have difficulty discovering authentic district-specific products because:

- They may know the product but not its famous district.
- Local sellers may have limited digital reach.
- Existing marketplaces generally focus on products and sellers rather than district-level identity.
- Buyers may have difficulty understanding where a traditional product originates.
- Local producers can struggle to reach customers outside their district.

ODOP Nexus aims to provide a structured marketplace where district identity is part of the product discovery and seller ecosystem.

---

## 3. Product Vision

To create a trusted digital marketplace where buyers can discover authentic district-associated products and purchase them from sellers belonging to the same district.

### Vision Statement

**Discover the product. Discover its district. Discover its local seller. Buy with confidence.**

---

## 4. Goals

### Primary Goals

1. Create a marketplace for ODOP/local district products.
2. Connect buyers with district-based sellers.
3. Allow buyers to find products without already knowing their district.
4. Maintain seller-product district consistency.
5. Provide a simple purchasing and delivery workflow.
6. Support product reviews to improve buyer trust.
7. Keep the architecture ready for future returns, refunds, logistics, and advanced features.

### Non-Goals for MVP

The first version will not focus on:

- Complex return management.
- Advanced logistics management.
- Large-scale warehouse management.
- Subscription services.
- Advanced seller analytics.
- AI-heavy personalization.

These can be introduced in future versions.

---

## 5. Target Users

### 5.1 Buyer

A customer looking for traditional, local, handmade, or ODOP-related products.

**Needs:**
- Search products.
- Discover the relevant district.
- View seller information.
- Compare product details and prices.
- Place orders.
- Make payments.
- Track basic order status.
- Review purchased products.

### 5.2 Seller

A local producer, artisan, manufacturer, or eligible business selling products associated with their district.

**Needs:**
- Register as a seller.
- Provide district information.
- Add products.
- Manage inventory/product information.
- Receive orders.
- Update order status.
- View customer reviews.

### 5.3 Admin

The platform administrator responsible for maintaining marketplace integrity.

**Needs:**
- Manage users and sellers.
- Manage products and categories.
- Verify or manage district/product information.
- Monitor orders.
- Manage reported content.
- Maintain platform data.

---

## 6. User Roles

| Role | Main Responsibilities |
|---|---|
| Buyer | Discover, purchase, receive and review products |
| Seller | Register, list products and fulfill orders |
| Admin | Manage users, sellers, products, districts and marketplace operations |

---

## 7. Core User Journey

### Buyer Journey

**Landing Page → Search/Explore → Product Discovery → Product Details → Cart → Checkout → Payment → Order → Delivery → Review**

### Seller Journey

**Registration → Seller Details → District Selection/Verification → Seller Dashboard → Add Product → Product Validation → Product Listing → Receive Order → Fulfill Order**

### Admin Journey

**Admin Login → Dashboard → Manage Sellers → Manage Products → Manage District Data → Monitor Orders → Manage Reviews/Reports**

---

## 8. Registration and Onboarding

### Buyer Registration

Buyer can create an account using basic information such as:

- Name
- Email/mobile
- Password
- Address

### Seller Registration

Seller registration should collect:

- Seller name/business name
- Contact information
- Address
- District
- State
- Seller/business verification information as required
- Login credentials

### District Rule

The seller's registered district becomes a key attribute of the seller.

A product listed by that seller must satisfy:

**Seller District = Product District**

The system must prevent inconsistent district-product listings.

---

## 9. Product Management

Each product should contain:

- Product ID
- Product name
- Description
- Images
- Price
- Category
- District
- Seller ID
- Available quantity
- Product status
- ODOP/product association
- Created/updated timestamps

### Product Validation

Before publishing a product:

1. Identify the seller's registered district.
2. Identify the product's selected district.
3. Compare both values.
4. If they match → product can proceed.
5. If they do not match → listing is rejected or requires admin intervention.

---

## 10. Buyer Product Discovery

The platform must support multiple discovery methods.

### A. Product-First Search

The buyer can search for a product without knowing its district.

Example:

**Buyer searches:** `Paithani Saree`

The system can show relevant products and their associated district information.

### B. District-First Search

The buyer can browse products by district.

Example:

**Buyer selects:** `Nashik`

The system displays products associated with that district.

### C. Category Search

Buyer can browse products by categories such as:

- Textiles
- Handicrafts
- Food products
- Agricultural products
- Traditional products
- Other ODOP/local categories

### D. Search Assistance

The system should make district information visible during discovery so buyers can learn:

**Product → Associated District → Seller**

The buyer should not be forced to know the district before searching.

---

## 11. Product Details Page

The product page should display:

- Product images
- Product name
- Price
- Description
- Seller
- Seller district
- Product district
- Availability
- Product/category information
- Ratings and reviews
- Add to Cart
- Buy Now

The district association should be clearly visible to support transparency.

---

## 12. Cart

Buyer can:

- Add products.
- Remove products.
- Change quantity.
- View subtotal.
- View applicable delivery charges.
- View total amount.
- Proceed to checkout.

---

## 13. Checkout

Checkout should collect/confirm:

- Delivery address
- Contact details
- Order items
- Quantity
- Product price
- Delivery charge
- Total amount
- Payment method

The MVP will use **Razorpay** for online payment integration, subject to the final payment-provider setup and applicable fees/availability.

---

## 14. Order Management

### Order Status

The initial order lifecycle should be simple:

**Pending Payment → Confirmed → Processing → Shipped → Delivered**

Possible cancellation status can be supported where appropriate.

### Buyer

Buyer can:

- View current orders.
- View order details.
- See order status.
- View previous orders.

### Seller

Seller can:

- View incoming orders.
- Accept/process orders.
- Update fulfillment status.
- Mark orders as shipped/fulfilled.

---

## 15. Delivery

For MVP, delivery management should remain simple.

The system should store:

- Delivery address
- Order status
- Basic shipment/fulfillment information
- Delivery status

Advanced logistics integration can be added later.

---

## 16. Reviews and Ratings

After an order is delivered, the buyer can submit:

- Rating
- Written review

Reviews should be associated with:

- Buyer
- Product
- Order
- Seller where applicable

Only eligible buyers who purchased the product should be allowed to submit verified purchase reviews.

---

## 17. Admin Requirements

Admin should be able to:

### User Management
- View users.
- Manage buyer accounts.
- Manage seller accounts.

### Seller Management
- Review seller information.
- Approve/reject seller registration where verification is required.
- Manage seller status.

### Product Management
- View products.
- Approve/reject products where moderation is required.
- Manage categories.
- Correct/remove invalid listings.

### District Management
- Maintain district data.
- Maintain product-district associations.
- Prevent invalid district relationships.

### Order Management
- View orders.
- Monitor order status.
- Handle operational issues.

### Review Management
- Monitor reported/inappropriate reviews.
- Remove content that violates platform rules.

---

## 18. Functional Requirements

### FR-01 Authentication
The system shall allow buyers, sellers and admins to authenticate according to their roles.

### FR-02 Seller Registration
The system shall allow sellers to register their district and business information.

### FR-03 Product Listing
The system shall allow approved sellers to create product listings.

### FR-04 District Validation
The system shall validate that the seller district matches the product district.

### FR-05 Product Search
The system shall allow buyers to search for products without knowing their district.

### FR-06 District Discovery
The system shall show the district associated with a product.

### FR-07 Cart
The system shall allow buyers to manage products in a shopping cart.

### FR-08 Checkout
The system shall allow buyers to confirm delivery details and order information.

### FR-09 Payment
The system shall support online payment through the selected payment gateway, planned as Razorpay.

### FR-10 Orders
The system shall create and manage orders through defined order statuses.

### FR-11 Delivery
The system shall maintain basic delivery/fulfillment status.

### FR-12 Reviews
The system shall allow eligible buyers to review purchased products.

### FR-13 Admin Control
The system shall provide administrative management of marketplace data.

---

## 19. Non-Functional Requirements

### Performance
- Search and common pages should load quickly under normal traffic.
- Database queries should be indexed appropriately.

### Security
- Passwords must never be stored in plain text.
- Authentication must use secure session/token mechanisms.
- Role-based authorization must prevent unauthorized actions.
- Payment information should be handled through the payment provider rather than stored unnecessarily.

### Scalability
The architecture should support future growth in:

- Users
- Sellers
- Products
- Districts
- Orders

### Availability
The system should be designed for reliable access and graceful handling of service failures.

### Maintainability
The application should use modular frontend, backend and database components.

---

## 20. Suggested System Structure

### Frontend

- React
- JavaScript
- HTML/CSS
- Responsive UI

### Backend

- Node.js
- Express.js
- REST APIs
- Authentication and authorization

### Database

- PostgreSQL
- Prisma ORM

### Supporting Services

- Payment gateway: Razorpay
- Image/file storage: suitable cloud storage
- Deployment: suitable frontend/backend hosting

The exact technology choices can be adjusted during TRD/system design.

---

## 21. High-Level Architecture

```text
                    ┌───────────────────┐
                    │      Buyer        │
                    └─────────┬─────────┘
                              │
                              ▼
                    ┌───────────────────┐
                    │   React Frontend  │
                    └─────────┬─────────┘
                              │ REST API
                              ▼
                    ┌───────────────────┐
                    │ Node.js / Express │
                    │     Backend       │
                    └──────┬─────┬──────┘
                           │     │
                ┌──────────┘     └───────────┐
                ▼                            ▼
       ┌────────────────┐          ┌─────────────────┐
       │  PostgreSQL    │          │ Payment Gateway │
       │ + Prisma ORM   │          │    Razorpay     │
       └────────────────┘          └─────────────────┘
                ▲
                │
       ┌────────┴─────────┐
       │      Seller      │
       └──────────────────┘
```

---

## 22. Important Data Relationships

```text
District
   │
   ├── Products
   │      │
   │      └── Seller
   │
   └── ODOP Information

Buyer
   │
   └── Orders
          │
          ├── Order Items
          │       └── Product
          │
          └── Payment

Product
   │
   └── Reviews
```

A critical business rule is:

```text
Seller.district_id == Product.district_id
```

---

## 23. MVP Scope

### Included

- Buyer registration/login
- Seller registration/login
- Admin login
- District-based seller information
- Product listing
- Seller-product district validation
- Product search
- District browsing
- Product details
- Cart
- Checkout
- Razorpay payment integration
- Basic order management
- Basic delivery status
- Product reviews and ratings
- Admin management

### Not Included Initially

- Automated returns
- Automated refunds
- Advanced logistics
- Complex seller analytics
- AI recommendation engine
- Multi-vendor advanced settlement
- Subscription system
- Advanced loyalty program

---

## 24. Future Scope

The architecture should be designed so the platform can later support:

1. Return and refund management.
2. Advanced delivery tracking.
3. Logistics-provider integration.
4. Seller verification/KYC enhancements.
5. AI-powered product recommendations.
6. Search using natural language.
7. Product authenticity verification.
8. District/product storytelling.
9. Seller analytics.
10. Personalized buyer recommendations.
11. Multi-language support.
12. Mobile application.
13. Advanced payment and seller settlement workflows.

---

## 25. Success Metrics

The MVP can be evaluated using:

- Number of registered sellers.
- Number of active product listings.
- Number of districts represented.
- Number of registered buyers.
- Product search-to-product-view rate.
- Product-view-to-order conversion.
- Number of completed orders.
- Payment success rate.
- Delivery completion rate.
- Review submission rate.
- Seller listing validation failure rate.

---

## 26. Key Product Differentiator

The central differentiator is not simply selling local products online.

It is the structured relationship:

**PRODUCT ↔ DISTRICT ↔ SELLER**

This relationship allows the marketplace to answer an important buyer question:

> **“I want this product, but where is it actually associated with?”**

The buyer can start with the product and discover its district rather than needing to know the district beforehand.

---

## 27. Acceptance Criteria for MVP

The MVP is considered functionally complete when:

- A buyer can register and log in.
- A seller can register with a district.
- A seller can create a product listing.
- The system prevents a seller from listing a product belonging to another district.
- A buyer can search for a product without entering a district.
- Product details show the associated district and seller.
- A buyer can add products to a cart.
- A buyer can complete checkout.
- Payment can be processed through the configured gateway.
- An order is created after successful payment.
- Seller and buyer can see relevant order status.
- A buyer can review an eligible delivered product.
- Admin can manage essential users, sellers, products and orders.

---

## 28. Product Summary

ODOP Nexus is a **district-aware marketplace** focused on improving the discovery and sale of local/ODOP products.

Its most important product rule is:

> **A seller can sell only products associated with the seller's own registered district.**

At the same time, buyers are not required to know the district beforehand. They can search for what they want and discover the relevant district and local seller through the platform.

The MVP focuses on a clean marketplace experience:

**Discover → Understand Origin → Buy → Receive → Review**

Future versions can expand this foundation into a larger ODOP ecosystem involving logistics, returns, authenticity, recommendations, analytics and other services.
