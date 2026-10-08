# Current Architecture Document — Bhavo Platform

**Version:** 0.1.0-audit  
**Date:** October 2026  
**Auditors:** Senior Software & Backend Engineers

---

## 1. High-Level Architecture Overview

Bhavo is structured as a full-stack Next.js application using the App Router architecture. The application is served as a unified monolithic deployment running on Node.js / Next.js 16 with React 19.

```
                              Internet / Clients
                                      │
                         ┌────────────┴────────────┐
                         │   Next.js 16 (Node)     │
                         │   (Turbopack Engine)    │
                         └────────────┬────────────┘
                                      │
            ┌─────────────────────────┼─────────────────────────┐
            │                         │                         │
     [ Public Marketing ]      [ Passenger Panel ]       [ Driver Panel ]
     `/(main)/*`               `/user/*`                 `/driver/*`
     (Static/SSR React)        (Client-Side Zustand)     (Client-Side Zustand)
            │                         │                         │
            └─────────────────────────┼─────────────────────────┘
                                      │
                          [ Next.js API Routes ]
                          `/api/auth/*`
                          `/api/user/*`
                          `/api/driver/*`
                          `/api/places`
                                      │
                        ┌─────────────┴─────────────┐
                        │                           │
                 [ MongoDB Mongoose ]        [ External Public APIs ]
                 - User                      - Nominatim (OSM)
                 - Ride                      - Project OSRM
                 - Commute                   - Gmail SMTP
                 - Place
                 - Ticket
```

---

## 2. Directory Structure & File Map

```
my-bhavo/
├── public/                 # Static assets, branding, avatars, icons
├── src/
│   ├── app/                # Next.js App Router (pages and API routes)
│   │   ├── (main)/         # Public landing, marketing, and legal routes
│   │   │   ├── about/page.tsx
│   │   │   ├── blog/page.tsx
│   │   │   ├── contact/page.tsx
│   │   │   ├── features/page.tsx
│   │   │   ├── how-it-works/page.tsx
│   │   │   ├── privacy/page.tsx
│   │   │   └── terms/page.tsx
│   │   ├── api/            # Server Route Handlers
│   │   │   ├── auth/       # Authentication (register, login, OTP, reset)
│   │   │   ├── driver/     # Driver panel endpoints (duty, rides, vehicle)
│   │   │   ├── user/       # Passenger endpoints (rides, commutes, tickets)
│   │   │   ├── contact/    # Contact form log submission
│   │   │   └── places/     # Nominatim geocoding & nearby POI proxy
│   │   ├── driver/         # Driver dashboard & sub-routes
│   │   │   ├── earnings/page.tsx
│   │   │   ├── incentives/page.tsx
│   │   │   ├── ratings/page.tsx
│   │   │   ├── settings/page.tsx
│   │   │   ├── support/page.tsx
│   │   │   ├── trips/page.tsx
│   │   │   ├── vehicle/page.tsx
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx
│   │   ├── user/           # Passenger panel & sub-routes
│   │   │   ├── book-ride/page.tsx
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── mobility-insights/page.tsx
│   │   │   ├── my-commute/page.tsx
│   │   │   ├── notifications/page.tsx
│   │   │   ├── places/page.tsx
│   │   │   ├── profile/page.tsx
│   │   │   ├── settings/page.tsx
│   │   │   ├── support/page.tsx
│   │   │   ├── trips/page.tsx
│   │   │   ├── wallet/page.tsx
│   │   │   ├── layout.tsx
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx        # Public root landing page
│   ├── components/         # Modular React UI components
│   │   ├── auth/           # Login and Signup component views
│   │   ├── driver/         # Driver layout, dashboard, modals, vehicle views
│   │   ├── public-website/ # Landing page sections, navbars, footers
│   │   ├── ui/             # Core design system primitives (Base UI / Radix)
│   │   └── user/           # User layout, dashboard widgets, booking components
│   ├── hooks/              # Global Zustand state stores & hooks
│   │   ├── driver/useDriverStore.ts
│   │   ├── user/useDashboardStore.ts
│   │   └── user/useUserStore.ts
│   ├── lib/                # Shared utilities & database helpers
│   │   ├── auth.ts         # User session & Jose JWT verification
│   │   ├── driverAuth.ts   # Driver session extraction & mock fallback
│   │   ├── driverCompliance.ts # Document validation & verification rules
│   │   ├── email.ts        # Nodemailer SMTP transporter
│   │   ├── mongoose.ts     # Global cached MongoDB Mongoose connection
│   │   ├── utils.ts        # CSS class merging (clsx + twMerge)
│   │   └── validations/auth.ts # Zod schemas for registration & login
│   ├── models/             # Mongoose schemas & TypeScript interfaces
│   │   ├── Commute.ts
│   │   ├── Place.ts
│   │   ├── Ride.ts
│   │   ├── Ticket.ts
│   │   └── User.ts
│   └── proxy.ts            # Next.js 16 Proxy / Middleware
├── .env                    # Environment secrets
├── eslint.config.mjs       # Flat ESLint 9 configuration
├── next.config.ts          # Next.js configuration
├── package.json            # Scripts and dependencies
└── tsconfig.json           # TypeScript configuration
```

---

## 4. Component & State Architecture

### Client-Side State Management (Zustand)

State management is separated into three stores inside `src/hooks/`:

1. **`useUserStore` (`src/hooks/user/useUserStore.ts`):**
   - Manages top-level user identity, sidebar open/collapsed state, and calls `GET /api/user/profile`.
2. **`useDashboardStore` (`src/hooks/user/useDashboardStore.ts`):**
   - Coordinates passenger dashboard data: active rides, upcoming rides, commutes, stats, and places.
   - Manages SSE streams via `EventSource('/api/user/rides/[id]/stream')`.
   - Manages an active polling timer (`setInterval`) querying `/api/user/rides/[id]` every 1,500ms.
3. **`useDriverStore` (`src/hooks/driver/useDriverStore.ts`):**
   - Controls driver telemetry, duty state (`OFFLINE`, `ONLINE_SEARCHING`, `DISPATCH_ALERT`, `ON_TRIP`), active incoming dispatch, current trip actions, document verification state, and earnings stats.
   - Executes dispatch polling against `GET /api/driver/dispatches` every 1,500ms.

---

## 5. End-to-End Data Flow Diagrams

### Flow 1: Passenger Ride Booking

```
Passenger Browser             Next.js Server                MongoDB
       │                            │                          │
       │── 1. Geocode search ──────>│                          │
       │   `GET /api/places?q=...`  │── Query Nominatim ──────>│ (OSM)
       │<─ Lat/Lng, Address ────────│                          │
       │                            │                          │
       │── 2. Route calculation ──────────────────────────────>│ (Project OSRM)
       │<─ Distance, Duration, Polyline ───────────────────────│
       │                            │                          │
       │── 3. Submit Ride Booking ─>│                          │
       │   `POST /api/user/rides`   │                          │
       │   { pickup, dropoff,       │                          │
       │     vehicleType, fare }    │── Create Ride Document ─>│
       │                            │   status: "SEARCHING"    │
       │<─ Ride created (OTP) ──────│                          │
       │                            │                          │
       │── 4. Start Realtime Poll ─>│                          │
       │   (Poll 1.5s + SSE Stream) │── MongoDB Poll (2.5s) ──>│
```

### Flow 2: Driver Dispatch & Trip Execution

```
Driver Browser                Next.js Server                MongoDB
       │                            │                          │
       │── 1. Poll Dispatches ─────>│                          │
       │   `GET /api/driver/        │── Ride.findOne(          │
       │    dispatches`             │   status: "SEARCHING") ─>│
       │<─ Returns latest ride ─────│                          │
       │                            │                          │
       │── 2. Accept Ride ─────────>│                          │
       │   `POST /api/driver/rides` │── ride.status = ACCEPTED │
       │   action: "ACCEPT"         │   ride.driver = driverId │
       │<─ Confirmed ───────────────│                          │
       │                            │                          │
       │── 3. Start Ride ──────────>│                          │
       │   action: "START"          │── Validate OTP           │
       │   (OTP or "1234")          │   status = IN_PROGRESS ─>│
       │<─ Confirmed ───────────────│                          │
       │                            │                          │
       │── 4. Complete Ride ───────>│                          │
       │   action: "COMPLETE"       │── ride.status = COMPLETED│
       │                            │   driver.wallet += fare  │
       │<─ Confirmed ───────────────│                          │
```

---

## 6. External Third-Party Dependencies

| Dependency | Purpose | Integration Point | Risk / Limitation |
|---|---|---|---|
| **OpenStreetMap Nominatim** | Forward / Reverse Geocoding, Nearby POIs | `src/app/api/places/route.ts` | Free public service. Strict 1 req/sec policy. Multi-threaded queries risk IP blacklisting. |
| **Project OSRM** | Road route geometry, distance & duration | `src/components/user/book-ride/BookRide.tsx:432` | Public demo server called directly from client browsers. No SLA; subject to throttling or downtime. |
| **Leaflet / React-Leaflet** | Interactive map rendering & marker display | `src/components/user/book-ride/LeafletMap.tsx` | Client-only render (`ssr: false`). Functional, but tiles pulled from public OpenStreetMap tile servers. |
| **Nodemailer / Gmail** | Transactional OTP email dispatch | `src/lib/email.ts` | Configured via environment variables; fallback returns OTP in HTTP responses when down. |
