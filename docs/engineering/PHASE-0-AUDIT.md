# Bhavo Engineering Audit — Phase 0 Master Report

**Date:** October 2026  
**Auditors:** Senior Software Engineer, Senior Backend Engineer, Security Engineer, QA/Test Engineer, DevOps Engineer  
**Target Codebase:** `c:\Users\bhave\Bhavo\my-bhavo`  
**Status:** COMPLETE (Documentation Only — Source Code Unmodified)

---

## 1. Executive Summary

A comprehensive engineering audit of the Bhavo ride-booking platform was executed across architecture, security, database modeling, ride lifecycle, financial integrity, auto-booking, dispatch algorithms, realtime tracking, concurrency, and DevOps readiness.

Bhavo possesses a modern frontend UI built on Next.js 16.2.11 (Turbopack) and React 19.2.4 with Tailwind CSS v4, containing polished layouts for passenger and driver workflows. The project compiles cleanly under TypeScript (`npx tsc --noEmit` exited 0) and builds successfully via `next build`.

However, the backend and business logic layers are in a **pre-production, prototype/simulation state** containing critical vulnerabilities that would lead to catastrophic financial loss, unauthorized driver impersonation, account takeover, and severe server-level denial-of-service under live conditions:

1. **Authentication & Authorization:** The proxy includes an intentional or leftover bypass (`?demo=true`) that circumvents route authentication entirely. Driver endpoints call an insecure fallback (`getDriverUser`) that defaults to a hardcoded driver account (`rajesh.driver@bhavo.in`) if no token is present, allowing anonymous public users to view driver earnings, accept rides, and trigger bank cashouts.
2. **Financial & Pricing Security:** Fare calculation is delegated entirely to the client browser (`BookRide.tsx`). The server accepts client-specified fares with zero server-side pricing verification. Drivers can infinitely claim ₹1,500 incentive bonuses via unverified POST requests. Riders can submit arbitrary tips that credit the driver’s wallet without charging the rider.
3. **Ride Domain & Safety:** Ride OTP verification accepts hardcoded universal test codes (`"1234"`, `"4826"`), as well as empty strings. Driver endpoints lack ride ownership validation, allowing any driver to manipulate or complete another driver’s ride.
4. **Auto-Booking & Matching Gaps:** The platform’s core differentiator—AI Auto-Booking and Recurring Commutes—does not exist as an execution engine. `Commute` is merely a CRUD model; there are no background jobs, cron triggers, or ride generation logic. Furthermore, driver dispatch does not separate eligibility from ranking and completely ignores distance, vehicle match, pet requirements, and preferred drivers.
5. **Realtime & Scalability:** Realtime tracking relies on aggressive HTTP polling (1.5s client poll + 2.5s server-side database poll inside an unmanaged SSE loop). The server relies on in-memory global caches, process-local timeouts for simulated chat replies, and lacks atomic database operations, preventing horizontal scaling.

### Findings Breakdown by Severity

| Severity | Count | Definition |
|---|:---:|---|
| **P0** | **9** | Critical security/data-loss/financial issue or production blocker |
| **P1** | **14** | Serious correctness/security/scalability problem |
| **P2** | **18** | Important maintainability/performance/testability issue |
| **P3** | **11** | Improvement / cleanup / future enhancement |
| **TOTAL** | **52** | Verified findings with exact code citations |

---

## 2. Current Architecture Summary

```
                       [ CLIENT LAYER ]
    +-------------------------------------------------------+
    | Passenger Web / Mobile UI   |   Driver Dashboard / App|
    | (React 19, Zustand Stores)  |   (React 19, Zustand)   |
    +-------------------------------------------------------+
                               |
              HTTP / REST / SSE / ?demo=true bypass
                               |
                      [ NEXT.JS 16 SERVER ]
    +-------------------------------------------------------+
    |  Proxy (src/proxy.ts) - Excludes /api routes          |
    |  ---------------------------------------------------  |
    |  Route Handlers:                                      |
    |   - /api/auth/*    (Bcrypt, Jose JWT)                 |
    |   - /api/user/*    (Ad-hoc JSON parsing, no Zod)      |
    |   - /api/driver/*  (getDriverUser() fallback)         |
    |   - /api/places    (In-memory Map cache, OSM proxy)   |
    +-------------------------------------------------------+
              |                                 |
              v                                 v
     [ MONGODB DATABASE ]             [ PUBLIC 3RD PARTIES ]
    - User (overloaded)               - OpenStreetMap Nominatim
    - Ride (plain coords)             - Project OSRM Routing
    - Commute (dormant CRUD)          - Gmail SMTP (Nodemailer)
    - Place
    - Ticket
```

See [CURRENT-ARCHITECTURE.md](file:///c:/Users/bhave/Bhavo/my-bhavo/docs/engineering/CURRENT-ARCHITECTURE.md) for full structural diagrams and route breakdowns.

---

## 3. Current User Flow Audit

1. **Signup & Login:** Email/password authentication via `POST /api/auth/register` and `POST /api/auth/login`. Sets HTTP-only `auth_token` cookie. Noticeable gap: Product requirement specifies Phone + OTP as primary; currently only email/password exists.
2. **Dashboard:** Fetches `/api/user/dashboard`. If the user has 0 commutes, the endpoint auto-seeds two default commutes into MongoDB. Display metrics (e.g., CO2 saved, on-time rate, corporate pass) are hardcoded formulas.
3. **Ride Booking:** User enters pickup/dropoff. UI queries public OpenStreetMap Nominatim for geocoding and public Project OSRM for routing. Vehicle card calculates fare client-side. When submitted, the client sends `fare`, `distance`, and `duration` directly to `/api/user/rides`. Pet-friendly and Preferred Driver toggles are present in UI state but **dropped before sending to the backend**.
4. **Active Ride Tracking:** Browser starts a dual-tracking loop: an HTTP polling interval every 1.5s against `/api/user/rides/[id]` PLUS an EventSource connection to `/api/user/rides/[id]/stream` (which internally polls MongoDB every 2.5s).
5. **Ride Completion & Rating:** Rider rates trip and enters optional tip. The tip amount is directly added to driver wallet balance without deducting anything from rider wallet or payment gateway.

---

## 4. Current Driver Flow Audit

1. **Authentication:** Driver signs in or navigates to `/driver`. If unauthenticated, `getDriverUser()` falls back to a hardcoded driver (`rajesh.driver@bhavo.in`) and creates 4 fake rides in MongoDB.
2. **Duty Toggle:** Driver toggles duty state via `/api/driver/duty`. Document compliance is checked; however, all 8 driver documents default to `VERIFIED` on User creation.
3. **Dispatch Polling:** When online, the browser polls `GET /api/driver/dispatches` every 1.5s. The backend executes `Ride.findOne({ status: "SEARCHING" })` with zero spatial, vehicle, or driver qualification filtering.
4. **Ride Actions:**
   - **Accept:** Sets `status = "ACCEPTED"` without concurrency locks or check for prior assignment.
   - **Arrived:** Sets `status = "ARRIVED"` without verifying driver assignment.
   - **Start:** Prompts for OTP. Accepts passenger OTP, universal bypass codes `"1234"` and `"4826"`, or an empty string.
   - **Complete:** Sets `status = "COMPLETED"` and `paymentStatus = "PAID"`. Credits driver wallet with fare + hardcoded ₹25 tip. Can be called repeatedly on the same ride to multiply driver balance.
5. **Earnings & Payout:** Driver requests cashout via `POST /api/driver/earnings`. Backend deducts from `user.walletBalance` without a database transaction or payout ledger record, and returns a fake reference ID.
6. **Vehicle & Compliance:** Driver can self-approve documents via `PATCH /api/driver/vehicle` using `action: "VERIFY_ALL"`.

---

## 5. API Inventory Summary

The repository contains 22 API endpoints:
- **Auth (6):** `register`, `login`, `logout`, `forgot-password`, `verify-otp`, `reset-password`.
- **User Domain (7):** `dashboard`, `rides`, `rides/[id]`, `rides/[id]/messages`, `rides/[id]/stream`, `commutes`, `places`, `profile`, `tickets`.
- **Driver Domain (7):** `dashboard`, `duty`, `dispatches`, `rides`, `rides/[id]/messages`, `earnings`, `incentives`, `ratings`, `trips`, `vehicle`, `settings`, `support`.
- **Public Utility (2):** `places`, `contact`.

**Critical Inventory Deficiencies:**
- Only auth endpoints use Zod validation schemas (`registerSchema`, `loginSchema`). All other 16 endpoints use unvalidated `await req.json()`.
- API endpoints are excluded from `src/proxy.ts` middleware.
- Inconsistent JSON structures (`status: "success"` vs `success: true` vs raw arrays).

See [API-INVENTORY.md](file:///c:/Users/bhave/Bhavo/my-bhavo/docs/engineering/API-INVENTORY.md) for endpoint-by-endpoint audit.

---

## 6. Database Model Summary

The database layer utilizes 5 Mongoose models (`src/models/`):
1. **User (`User.ts`):** Overloaded multi-purpose model containing user profile, role, wallet balance, emergency contacts, pets, driver duty state, driver vehicle, driver settings, driver documents, and password reset OTP.
2. **Ride (`Ride.ts`):** Stores ride details. Missing pet requirement field, preferred driver reference, cancellation policy metrics, and payment gateway references. Driver reference is unindexed. Coordinates are stored as raw `[Number]` arrays rather than GeoJSON points.
3. **Commute (`Commute.ts`):** Stores recurring commute templates. Purely passive; no linkage to generated rides.
4. **Place (`Place.ts`):** Saved user places (Home, Work, etc.).
5. **Ticket (`Ticket.ts`):** Customer and driver support tickets.

**Missing Domain Models:**
- `Driver` (should be separate from `User` or structured via a 1-to-1 relationship).
- `Vehicle` (currently embedded in `User`).
- `Wallet` & `LedgerEntry` / `Transaction` (currently a raw float on `User`).
- `Payment` (no payment entity exists).
- `Notification` (no database model exists; frontend notifications are hardcoded).
- `CancellationPolicy` / `FeeConfig`.

See [DATA-MODEL-AUDIT.md](file:///c:/Users/bhave/Bhavo/my-bhavo/docs/engineering/DATA-MODEL-AUDIT.md) for full schema audit.

---

## 7. Security Findings

The codebase exhibits multiple critical security flaws:

### Critical Security Findings (P0)

1. **Proxy Authentication Bypass via Query Parameter:**  
   `src/proxy.ts:13-15` allows any visitor to pass `?demo=true` to access protected `/user/*` and `/driver/*` routes without authentication.
2. **Hardcoded Fallback JWT Secret:**  
   `src/proxy.ts:6`, `src/lib/auth.ts:5`, `src/app/api/auth/login/route.ts:8`, and `src/app/api/user/profile/route.ts:9` all fall back to `"fallback_secret_please_change_me_in_production"`.
3. **Insecure Driver Fallback & Anonymous Impersonation:**  
   `src/lib/driverAuth.ts:77-146` returns the default driver account (`rajesh.driver@bhavo.in`) whenever no session exists, exposing driver operations to unauthenticated callers.
4. **Direct Privilege Escalation on Registration & Login:**  
   `src/lib/validations/auth.ts:7` and `src/app/api/auth/register/route.ts:42` accept `role` from the client body. `src/app/api/auth/login/route.ts:39-42` allows any caller to pass `role: "DRIVER"` and overwrites their role in MongoDB.
5. **Plaintext OTP Response Leakage:**  
   `src/app/api/auth/forgot-password/route.ts:76-84` returns `{ devOtp: otp }` in the JSON response when SMTP is unconfigured or fails.
6. **Universal Hardcoded Ride OTP Bypass:**  
   `src/app/api/driver/rides/route.ts:75` and `src/hooks/driver/useDriverStore.ts:511` allow `"1234"` and `"4826"` to start any ride. Falsy/empty OTP also passes.
7. **Client-Controlled Pricing Manipulation:**  
   `src/app/api/user/rides/route.ts:115` saves the `fare` provided by the client without server validation.
8. **Arbitrary Tip Injection without Rider Debit:**  
   `src/app/api/user/rides/[id]/route.ts:78-88` credits driver wallets with any tip specified by the rider, without charging the rider.
9. **Unrestricted Incentive Claims (Free Money Exploit):**  
   `src/app/api/driver/incentives/route.ts:98-106` credits ₹1,500 on every POST call without verifying quest progress or claim history.

See [SECURITY-AUDIT.md](file:///c:/Users/bhave/Bhavo/my-bhavo/docs/engineering/SECURITY-AUDIT.md) for full vulnerability documentation.

---

## 8. Ride Lifecycle Findings

Target Lifecycle:
$$\text{SEARCHING} \longrightarrow \text{ACCEPTED} \longrightarrow \text{ARRIVED} \longrightarrow \text{IN\_PROGRESS} \longrightarrow \text{COMPLETED}$$

**Deviations in Current Implementation:**
- **No Strict State Machine:** Route handlers do not enforce prerequisite states. For instance, `ARRIVED` can be called from `SEARCHING`, and `COMPLETE` can be called from `ACCEPTED`.
- **Rider-Forced Status Advancement:** `src/app/api/user/rides/[id]/route.ts` and `BookRide.tsx:540` permit riders to advance statuses.
- **Missing Intermediate States:** No driver rejection state, driver timeout state, or passenger no-show state.
- **Lack of Idempotency on Complete:** `POST /api/driver/rides` with `COMPLETE` can be executed multiple times on the same ride, multiplying driver wallet credits.

---

## 9. Payment / Money Findings

- **No Ledger:** Monetary balance is stored as a mutable float (`walletBalance`) on `User`. There is no immutable journal of transactions or double-entry ledger.
- **Race Condition Vulnerabilities:** Balances are updated via non-atomic read-modify-write patterns (`user.walletBalance = user.walletBalance + amount; await user.save()`) without database transactions or MongoDB `$inc`.
- **Cash Ride Inversion Flaw:** When a cash trip is completed, the driver collects physical cash. However, `POST /api/driver/rides` with `COMPLETE` ALSO credits the driver’s platform wallet with `fare + tip`.

---

## 10. Auto Booking Findings

- **No Background Execution:** Auto-booking exists only as a UI mockup (`AutoBookingWidget.tsx`) and a basic CRUD schedule store (`Commute.ts`).
- **No T-60 Dispatch Worker:** There is no scheduler (e.g., BullMQ, cron, worker) to evaluate upcoming commutes, check driver availability 60 minutes prior, or dispatch rides.
- **Commute vs. Ride Coupling:** No schema relationship links generated `Ride` documents back to parent `Commute` schedules.

---

## 11. Dispatch Findings

- **No Spatial Querying:** `GET /api/driver/dispatches` retrieves `Ride.findOne({ status: "SEARCHING" })`. It does not calculate radius, proximity, or driver route orientation.
- **No Eligibility vs. Ranking Separation:** The backend lacks an eligibility evaluation pipeline (vehicle category, documents, pet compatibility) and a ranking engine (ETA, rating, acceptance score, preferred driver).
- **Single Global Offer Collision:** If multiple drivers are online, all drivers retrieve the exact same ride. When one accepts, others receive no invalidation event.

---

## 12. Realtime Findings

- **Aggressive Polling Architecture:**
  - Browser polls `/api/user/rides/[id]` every 1,500ms.
  - Browser opens SSE `/api/user/rides/[id]/stream`, which executes a server-side `setInterval` polling MongoDB every 2,500ms.
  - Driver dashboard polls `/api/driver/dispatches` every 1,500ms and dashboard metrics every 6,000ms.
  - Driver dashboard simulates GPS jitter every 3,000ms via HTTP POST.
- **Resource Exhaustion Risk:** 500 active rides result in over 700 MongoDB queries per second solely from polling.

See [SCALABILITY-AUDIT.md](file:///c:/Users/bhave/Bhavo/my-bhavo/docs/engineering/SCALABILITY-AUDIT.md) for details.

---

## 13. Horizontal Scalability Findings

The current codebase **BLOCKS HORIZONTAL SCALING** due to:
1. **In-Memory Cache:** `queryCache` in `src/app/api/places/route.ts` is an in-memory `Map`. Cache state is not shared across cluster instances.
2. **Process-Bound Timers for Business Logic:** Chat auto-replies in `messages/route.ts` rely on process-local `setTimeout(..., 1500)`. If a request is routed across different instances or an instance restarts, timers are lost.
3. **Database Polling SSE:** Server-sent event streams run uncoordinated Node.js timers polling MongoDB directly rather than using a distributed message broker (e.g., Redis Pub/Sub).

---

## 14. Testing Findings

- **Unit Tests:** None present (0% coverage).
- **Integration Tests:** None present.
- **E2E Tests:** None present.
- **Testing Framework:** Vitest, Jest, and Playwright are not installed. `package.json` contains no test runner.

See [TESTING-GAPS.md](file:///c:/Users/bhave/Bhavo/my-bhavo/docs/engineering/TESTING-GAPS.md) for test matrices.

---

## 15. DevOps Findings

- **TypeScript:** `npx tsc --noEmit` exited **0** (Clean).
- **ESLint:** `npm run lint` exited **1** (17 problems: 12 errors, 5 warnings due to `@typescript-eslint/no-explicit-any`).
- **Next.js Production Build:** `next build` exited **0** (Turbopack production build succeeded).
- **CI/CD:** No GitHub Actions workflows exist.
- **Containerization:** No Dockerfile or docker-compose configuration.
- **Config Management:** Missing `.env.example`.

---

## 16. Code Quality Findings

- **Monolithic Components:** `BookRide.tsx` contains 1,641 lines of mixed UI, geolocation, OSRM routing, fare calculation, modal logic, and polling. `DriverVehicle.tsx` contains 902 lines.
- **Duplicated Logic:** JWT session extraction is re-implemented in `src/app/api/user/profile/route.ts:12-22` instead of importing `@/lib/auth`.

---

## 17. Demo / Mock / Dead Code Findings

1. `rajesh.driver@bhavo.in` hardcoded seed account in `driverAuth.ts:79`.
2. Automatic generation of 4 mock completed rides on first driver load in `driverAuth.ts:165-274`.
3. Auto-seeding of commutes on user dashboard load in `user/dashboard/route.ts:41-62`.
4. Auto-seeding of welcome tickets in `user/tickets/route.ts:24-36`.
5. Fake chat bot auto-reply simulations using `setTimeout` in `messages/route.ts`.
6. Universal test bypass OTP codes `"1234"` and `"4826"`.
7. `POST /api/driver/dispatches` mock simulation endpoint generating random rides.
8. `ACTION: "VERIFY_ALL"` and `"RESET_PENDING"` backdoor simulation toggles in `driver/vehicle/route.ts`.
9. `MobilityInsights.tsx` and `Wallet.tsx` static mock data.

---

## 18. Findings Catalog

### P0 Findings (Critical / Immediate Blocker)

- **P0-1:** `src/proxy.ts:13-15` — `?demo=true` query parameter bypasses authentication for all `/user` and `/driver` routes.
- **P0-2:** `src/lib/auth.ts:5`, `src/proxy.ts:6`, `src/app/api/auth/login/route.ts:8`, `src/app/api/user/profile/route.ts:9` — Insecure hardcoded JWT secret fallback (`"fallback_secret_please_change_me_in_production"`).
- **P0-3:** `src/lib/driverAuth.ts:77-146` — Unauthenticated fallback to default driver account (`rajesh.driver@bhavo.in`), enabling anonymous driver impersonation.
- **P0-4:** `src/app/api/auth/register/route.ts:42` & `src/app/api/auth/login/route.ts:39-42` — Client can assign or escalate role to `"DRIVER"` directly via request payload.
- **P0-5:** `src/app/api/auth/forgot-password/route.ts:76-84` — Plaintext `devOtp` leaked in JSON response when email delivery fails.
- **P0-6:** `src/app/api/driver/rides/route.ts:75` & `src/hooks/driver/useDriverStore.ts:511` — Universal hardcoded ride OTP bypass codes (`"1234"`, `"4826"`), plus falsy/empty string OTP bypass.
- **P0-7:** `src/app/api/user/rides/route.ts:115` & `src/components/user/book-ride/BookRide.tsx:513` — Fare is calculated client-side and accepted by server without verification.
- **P0-8:** `src/app/api/user/rides/[id]/route.ts:78-88` — Unrestricted driver wallet tipping without rider balance debit.
- **P0-9:** `src/app/api/driver/incentives/route.ts:98-106` — Unconditional ₹1,500 wallet credit via `POST /api/driver/incentives` without quest completion or duplicate claim verification.

### P1 Findings (High / Serious Correctness & Security)

- **P1-1:** `src/proxy.ts:53` — Proxy matcher excludes `/api/*` routes, leaving all API route protection to individual handlers.
- **P1-2:** `src/app/api/driver/rides/route.ts:26-115` — Driver ride endpoints lack ownership verification (any driver can accept, arrive, start, or complete any ride).
- **P1-3:** `src/app/api/driver/rides/route.ts:84-115` — `action === "COMPLETE"` is non-idempotent; multiple requests credit driver wallet repeatedly.
- **P1-4:** `src/app/api/driver/rides/route.ts:105-108` — Cash ride completion credits platform wallet in addition to physical cash collected.
- **P1-5:** `src/app/api/driver/vehicle/route.ts:68-81` — Driver can self-verify compliance documents via `action === "VERIFY_ALL"`.
- **P1-6:** `src/app/api/driver/earnings/route.ts:98-112` — Driver payout executes non-atomic balance updates without database transactions, payout ledger records, or bank integration.
- **P1-7:** `src/app/api/driver/dispatches/route.ts:35-39` — Ride dispatch does not filter by driver distance, vehicle type, pet preference, or eligibility.
- **P1-8:** `src/components/user/book-ride/BookRide.tsx:503-518` — Pet-friendly and Preferred Driver toggles are not transmitted to backend.
- **P1-9:** `src/models/Ride.ts:49-155` — `Ride` schema has no fields for pet ride requirements or preferred driver.
- **P1-10:** `src/models/User.ts:118-185` — All new users are seeded with verified driver documents by default.
- **P1-11:** `src/app/api/user/rides/[id]/stream/route.ts:38-81` & `src/hooks/user/useDashboardStore.ts:235-296` — Redundant dual polling (client 1.5s + server SSE 2.5s) exhausts database resources.
- **P1-12:** `src/models/Ride.ts:57-61` — `Ride.driver` field is not indexed.
- **P1-13:** `src/models/User.ts:84-87` & `src/models/Ride.ts:70-73` — Coordinates stored as raw arrays rather than GeoJSON Point with 2dsphere index.
- **P1-14:** `src/app/api/places/route.ts:31-55` — In-memory global `queryCache` prevents horizontal multi-instance scaling.

### P2 Findings (Medium / Architecture & Quality)

- **P2-1:** `src/app/api/driver/rides/[id]/messages/route.ts:96-120` & `src/app/api/user/rides/[id]/messages/route.ts:88-114` — Fake chat auto-replies use process-local `setTimeout(..., 1500)`.
- **P2-2:** `src/app/api/auth/verify-otp/route.ts` & `reset-password/route.ts` — No rate limiting or lockout protection against OTP brute-forcing.
- **P2-3:** `src/models/User.ts:66-73` — Reset OTP stored in plaintext rather than hashed with bcrypt/SHA-256.
- **P2-4:** `src/components/user/book-ride/BookRide.tsx:432-448` — Client-side road routing relies on unauthenticated public Project OSRM demo server.
- **P2-5:** `src/app/api/places/route.ts:286-321` — Dispatches up to 7 concurrent requests to OpenStreetMap Nominatim per query, risking OSM IP ban.
- **P2-6:** `src/components/user/book-ride/BookRide.tsx` (1,641 lines) — Monolithic component combining state, routing, UI, and polling.
- **P2-7:** `src/components/driver/vehicle/DriverVehicle.tsx` (902 lines) — Monolithic component mixing compliance simulation and UI.
- **P2-8:** `src/components/user/mobility-insights/MobilityInsights.tsx` — 100% hardcoded mock data.
- **P2-9:** `src/components/user/wallet/Wallet.tsx` — 100% hardcoded mock balance and transactions; no backend wallet API.
- **P2-10:** `src/app/user/notifications/page.tsx` — 100% hardcoded mock notifications in React state; no database model.
- **P2-11:** `src/components/user/dashboard/AutoBookingWidget.tsx` — Static mockup; no connection to commute schedules.
- **P2-12:** `src/app/api/user/commutes/route.ts` — Commute schedule CRUD has no recurring ride execution engine.
- **P2-13:** `src/app/api/user/dashboard/route.ts:41-62` — GET dashboard mutates database by auto-seeding default commutes.
- **P2-14:** `src/app/api/user/tickets/route.ts:24-36` — GET tickets mutates database by auto-seeding welcome ticket.
- **P2-15:** `src/lib/driverAuth.ts:165-274` — Seeds 4 fake completed rides into MongoDB on driver profile fetch.
- **P2-16:** `src/lib/mongoose.ts:5-9` — Throws uncaught exception at module evaluation time if `DATABASE_URL` is missing.
- **P2-17:** Missing `.env.example` file.
- **P2-18:** Zero test suite (no Jest, Vitest, Playwright, or test runner).

### P3 Findings (Low / Enhancements & Cleanup)

- **P3-1:** `npm run lint` fails with 17 problems (12 errors from `@typescript-eslint/no-explicit-any`).
- **P3-2:** Inconsistent API JSON envelope structures across route handlers.
- **P3-3:** Duplicated `getSession` and `JWT_SECRET` logic in `src/app/api/user/profile/route.ts:12-22`.
- **P3-4:** `src/models/User.ts:22` includes `"USER"` and `"RIDER"` as distinct roles; requirement specifies `"RIDER"`.
- **P3-5:** `src/models/User.ts:39` hardcodes default phone `"+91 98765 43210"`.
- **P3-6:** `src/app/api/contact/route.ts` only logs to console without saving to DB or sending email.
- **P3-7:** `src/app/api/driver/settings/route.ts:39` uses unsafe request body spreading into `driverSettings`.
- **P3-8:** `src/app/api/auth/forgot-password/route.ts:27-37` exposes email enumeration via 404 responses.
- **P3-9:** No health check endpoint (`/api/health`).
- **P3-10:** No Dockerfile or container configuration.
- **P3-11:** No GitHub Actions CI/CD workflows.

---

## 19. Recommended Phase 1 Work

Phase 1 should focus strictly on **Security Hardening, Domain Normalization, and Architecture Stabilization**:

1. **Sprint 1: Security & Auth Hardening (P0 Fixes)**
   - Remove `?demo=true` bypass from `src/proxy.ts`.
   - Protect `/api/*` routes at middleware/proxy level or enforce a centralized `requireAuth` / `requireRole` helper.
   - Remove `fallback_secret_please_change_me_in_production`; require strict environment variables.
   - Eliminate insecure driver fallback in `getDriverUser()`. Unauthenticated requests to driver endpoints must return 401.
   - Remove client-controlled role assignment in registration and login.
   - Remove plaintext OTP response leakage in forgot-password.
   - Remove universal bypass OTP codes (`"1234"`, `"4826"`).
2. **Sprint 2: Financial Integrity & Pricing Engine**
   - Implement server-side pricing engine (`calculateRideFare(pickup, dropoff, vehicleType)`).
   - Reject client-provided fare amounts in `POST /api/user/rides`.
   - Implement immutable `WalletTransaction` ledger.
   - Enforce MongoDB atomic transactions (`session.withTransaction`) for all wallet operations.
   - Fix cash flow: do not credit platform wallet on cash ride completion.
   - Require proof of completion and single-claim verification for driver incentives.
3. **Sprint 3: Ride Domain & Concurrency Controls**
   - Enforce strict ride state transitions via state machine validator.
   - Implement optimistic concurrency / atomic conditional updates (`findOneAndUpdate({ _id, status: "SEARCHING" })`) to prevent double driver acceptance.
   - Validate driver ownership on all driver actions (`driver: driverUser._id`).
   - Add pet requirements and preferred driver references to `Ride` schema and booking payload.
4. **Sprint 4: Database Model Refactoring**
   - Decouple `User` schema: extract `DriverProfile` and `Vehicle` into dedicated collections.
   - Migrate coordinate arrays to GeoJSON Points and add `2dsphere` indexes.
   - Add missing indexes on `Ride` (`driver`, `createdAt`, `status`).
5. **Sprint 5: Auto-Booking Foundation & Dispatch Engine**
   - Decouple `CommuteSchedule` from individual `Ride` instances.
   - Implement background scheduler abstraction for daily commute generation.
   - Separate driver matching into an Eligibility filter and a Ranking algorithm.
6. **Sprint 6: Realtime Optimization & CI/CD**
   - Eliminate dual polling; replace with efficient WebSocket or clean SSE over Redis Pub/Sub.
   - Set up Vitest and Playwright test suites covering critical flows.
   - Fix all ESLint errors. Add GitHub Actions CI and `.env.example`.

---

## 20. Risks & Open Questions

### Critical Risks
- **Financial Risk:** If deployed in current state, bad actors can drain money or credit unlimited free funds via unauthenticated endpoints.
- **Reputational Risk:** Document bypass (`action: "VERIFY_ALL"`) allows unverified drivers to conduct rides with invalid licenses or safety checks.
- **Infrastructure Risk:** Public Nominatim and OSRM usage will trigger IP bans under moderate load.

### Open Questions for Project Owner
1. **SMS Provider for OTP:** Which Indian SMS gateway is preferred for Phone + OTP (e.g., MSG91, Twilio, Fast2SMS, Gupshup)?
2. **Geocoding / Routing Engine:** What is the approved commercial mapping provider to replace public Nominatim/OSRM (e.g., Mapbox, Google Maps Platform, Ola Maps, self-hosted OSRM)?
3. **Background Worker Infrastructure:** Is Redis/BullMQ approved for the deployment target to power the T-60 commute dispatcher?
