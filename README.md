# Reebs Hybrid ERP and SaaS Platform
A unified operating system for hybrid retail and rental businesses.

Live Demo: https://reebspartythemes.netlify.app/

## Project Overview
Most ERP systems handle retail or rentals. Reebs ERP bridges both. It provides a unified inventory core that manages stock-based sales alongside time-based asset reservations, reconciled into a single financial ledger.

What started as a bespoke solution for a Ghanaian retail and events company is being re-engineered into a SaaS platform designed to scale across multiple organizations while maintaining strict data isolation.

## Tech Stack
- Frontend: React, Vite, React Router, Context (auth, cart, currency), CSS (global and component styles)
- Backend: Node.js serverless functions on Netlify, REST API
- Database: PostgreSQL (Railway)
- Schema and migrations: Prisma
- Queries and services: pg, Netlify Functions
- Tooling: Playwright, ESLint, Netlify CLI

## Core Modules
### Commerce Engine
- Unified inventory for SKU sales and serialized rental assets
- Order management with atomic writes
- Booking system with date-based availability checks

### Financial Intelligence
- General ledger with revenue and cost attribution
- Invoicing with branded PDF output
- Expense tracking for net profit visibility

### Logistics and Supply Chain
- Dispatch workflows for delivery and pickup
- Digital waivers with signature capture
- Maintenance tracking for asset health

### Workforce Management
- HR profiles with role-based access control
- Timesheets for operational crews

### SaaS Infrastructure
- Admin console for system oversight
- Authentication and permissions for manager and staff roles

## Technical Highlights and Challenges
### Hybrid inventory model
Retail order items and rental bookings flow through a single checkout path. Serverless functions validate availability, pricing, and totals before committing changes.

### Integer-based financials
All money values are stored as integer cents to avoid floating point drift.

```js
const toCents = (val) =>
  Math.round(parseFloat(String(val).replace(/[^\d.-]/g, "")) * 100);
```

### Data normalization at the API boundary
Input parsing in inventory and order services sanitizes currency strings and prevents invalid values from entering the ledger.

### Shared product-to-vendor linking
Inventory items can now link to multiple vendors through a dedicated `productVendorLink` table. One primary vendor is still preserved for compatibility, but supplier relationships now support one-to-many links for inventory management, vendor auto-linking, and water restock suggestions.

### Shared search input behavior
Search fields across the admin and storefront now follow one shared interaction pattern:
- Search icon inside the input
- Clear/cancel button inside the input
- Clear action restores focus to the field
- Native browser search cancel controls are suppressed so only one clear action appears

## UI Platform Conventions
- Use `src/components/SearchField.jsx` for search inputs instead of building one-off search controls.
- The mobile sidebar drawer is rendered as a body-level overlay from `src/components/PortalSidebar.jsx` so it opens above page content on mobile Safari.
- The fixed admin bottom nav gets its clearance from `src/styles/components/PortalSidebar.css`; individual pages should not add duplicate bottom-nav padding.
- Admin redesign work should follow the current frameless rule: avoid unnecessary background fills and borders unless a screen explicitly needs them.

## SaaS Business Model
Example tiers for positioning and pricing.

| Tier | Target | Key Features | Pricing Strategy |
| --- | --- | --- | --- |
| Starter | Solo retailer | Inventory, POS, invoicing | GHS 250 per month |
| Growth | Rental agency | Bookings, waivers, dispatch | GHS 600 per month |
| Scale | Enterprise | API access, custom integrations | Custom |

## Screenshots
1. Command Center dashboard for stock value, revenue split, and net profit
2. Digital waiver for on-site signature capture
3. Fleet dispatch and delivery status tracking

## Getting Started (Local Dev)
### Clone and install

```bash
git clone https://github.com/yourusername/reebs-website.git
cd reebs-website
npm install
```

### Environment setup
Create a `.env` file at the project root.

```
DATABASE_URL="postgresql://user:password@localhost:5432/reebs"
MANAGER_APP_SECRET="change-me"
USER_APP_SECRET="change-me"
MANAGER_PIN_HASH="scrypt$..."
```

Optional integrations:

```
GOOGLE_MAPS_API_KEY="optional"
WHATSAPP_ACCESS_TOKEN="optional"
WHATSAPP_PHONE_NUMBER_ID="optional"
WHATSAPP_MANAGER_PHONE="optional"
```

### Database and migrations

```bash
npx prisma migrate dev
```

### Run the app
For frontend only:

```bash
npm run dev
```

For full stack (Netlify functions + Vite):

```bash
npm run netlify
```

### Tests

```bash
npm run test:e2e
```

### Build check

```bash
npm run build
```

## Maps and Geocoding
The admin bookings Map view renders a Leaflet map and geocodes venue addresses server-side via `netlify/functions/geocode.js`.

- Default geocoder: OpenStreetMap Nominatim
- Optional fallback: Google Geocoding API

To enable the Google fallback, set `GOOGLE_MAPS_API_KEY` in your environment and enable the Geocoding API in Google Cloud.

## WhatsApp Order and Booking Notifications
Orders and bookings can send a WhatsApp message to the manager via the Meta WhatsApp Cloud API.

Set these environment variables:

- `WHATSAPP_ACCESS_TOKEN`
- `WHATSAPP_PHONE_NUMBER_ID`
- `WHATSAPP_MANAGER_PHONE`

## Contact
Created by Nana 
Portfolio: nanaabaackah.com
LinkedIn: https://www.linkedin.com/in/nana-aba-ackah/
Email: nanaabaackah@gmail.com
