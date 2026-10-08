# Engineering Roadmap: Phase 1 & Beyond — Bhavo Platform

**Author:** Senior Staff Software & Systems Architect  
**Date:** October 2026  
**Status:** DRAFT PROPOSAL (For Project Owner Review)

---

## 1. Roadmap Overview & Milestones

```
┌─────────────────────────────────────────────────────────────┐
│                 PHASE 0: AUDIT (CURRENT)                    │
│ Complete codebase inspection, risk cataloging, documentation│
└──────────────────────────────┬──────────────────────────────┘
                               │ Approval
                               v
┌─────────────────────────────────────────────────────────────┐
│             PHASE 1: HARDENING & CORE ENGINE                │
│ 1.1 Security & Auth Hardening (P0 Fixes)                    │
│ 1.2 Financial Integrity & Server Pricing Engine             │
│ 1.3 Ride Domain State Machine & Concurrency Controls        │
│ 1.4 Database Normalization & Index Optimization             │
│ 1.5 Driver Matching (Eligibility vs. Ranking Engine)        │
│ 1.6 Auto-Booking & Commute Scheduler (T-60 Worker)          │
│ 1.7 Realtime Optimization (SSE / WebSocket over Redis)       │
│ 1.8 Automated Testing Suite & CI/CD                         │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               v
┌─────────────────────────────────────────────────────────────┐
│           PHASE 2: PAYMENT & PRODUCTION OPERATIONS          │
│ - Razorpay Payment Gateway & Webhook Idempotency            │
│ - Post-Ride Online Payment & Cash Reconciliation            │
│ - Production Monitoring, Telemetry & Logging (Sentry/Datadog│
└──────────────────────────────┬──────────────────────────────┘
                               │
                               v
┌─────────────────────────────────────────────────────────────┐
│              PHASE 3: ADMIN & EXPANSION (LATER)             │
│ - Admin Panel for Document Verification & Dispatch Oversight│
│ - Corporate / Business Accounts                             │
│ - Multi-Region & Multi-Currency Expansion                   │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Phase 1 Detailed Implementation Workstream

### Workstream 1.1: Security, Auth & Access Control Hardening
- **Objective:** Eliminate all P0 authentication bypasses and privilege escalation vulnerabilities.
- **Tasks:**
  1. Remove `?demo=true` proxy bypass from `src/proxy.ts`.
  2. Enforce strict environment checking for `JWT_SECRET`; reject static fallback string.
  3. Remove insecure driver fallback (`getDriverUser`) in `src/lib/driverAuth.ts`; unauthenticated driver requests must return HTTP 401.
  4. Restrict registration to `RIDER` role only; remove client role modification from `auth/register` and `auth/login`.
  5. Remove plaintext `devOtp` leakage from `auth/forgot-password`.
  6. Remove universal test codes (`"1234"`, `"4826"`) and falsy OTP bypasses from ride start verification.
  7. Protect API routes via centralized auth middleware or higher-order handler guards.

### Workstream 1.2: Financial & Pricing Integrity Engine
- **Objective:** Establish server-authoritative pricing and atomic balance management.
- **Tasks:**
  1. Build server-side pricing engine (`calculateRideFare`) with configured base fare, distance rate, duration rate, and minimum pricing.
  2. Disallow client-provided `fare` values in `POST /api/user/rides`.
  3. Create immutable `WalletTransaction` collection to log all credits and debits.
  4. Implement atomic MongoDB updates (`$inc`) and multi-document transactions for wallet balance changes.
  5. Fix cash ride completion flow: do not credit the driver's platform wallet on cash payments.
  6. Secure driver incentive claims with eligibility verification and duplicate claim protection.

### Workstream 1.3: Ride Domain, State Machine & Concurrency Controls
- **Objective:** Eliminate race conditions and enforce strict ride state transitions.
- **Tasks:**
  1. Implement a finite state machine validator enforcing:
     $$\text{SEARCHING} \to \text{ACCEPTED} \to \text{ARRIVED} \to \text{IN\_PROGRESS} \to \text{COMPLETED}$$
  2. Implement atomic conditional updates (`findOneAndUpdate({ _id, status: "SEARCHING" })`) to prevent double driver acceptance.
  3. Enforce driver ride ownership on all actions (`ARRIVED`, `START`, `COMPLETE`, `CANCEL`).
  4. Transmit and persist `petFriendly` and `preferredDriver` fields in `Ride` documents.

### Workstream 1.4: Database Normalization & Index Optimization
- **Objective:** Prevent document bloat, eliminate collection scans, and enable spatial querying.
- **Tasks:**
  1. Decouple `User` model: create dedicated `DriverProfile` and `Vehicle` collections.
  2. Migrate coordinates to GeoJSON Point format (`{ type: "Point", coordinates: [lng, lat] }`) and add `2dsphere` indexes.
  3. Add missing indexes: `Ride.driver`, `Ride.createdAt`, `Ride.status`, `Ticket.status`.

### Workstream 1.5: Driver Matching (Eligibility vs. Ranking Separation)
- **Objective:** Implement structured two-stage driver matching.
- **Tasks:**
  1. **Stage 1 (Eligibility Filter):** Filter drivers by online status, vehicle compliance, active document verification, spatial radius, and pet compatibility.
  2. **Stage 2 (Ranking Engine):** Sort eligible drivers by preferred driver match, ETA, distance, and driver rating.

### Workstream 1.6: Auto-Booking & Recurring Commute Dispatch Engine
- **Objective:** Build background execution engine for daily commutes.
- **Tasks:**
  1. Decouple `CommuteSchedule` from individual `Ride` instances.
  2. Implement background cron/scheduler job evaluating active commutes for the current day.
  3. Implement T-60 minute driver confirmation request workflow.
  4. Implement fallback dispatch if preferred driver is unavailable or rejects.

### Workstream 1.7: Realtime Architecture Optimization
- **Objective:** Eliminate redundant database polling and reduce server load.
- **Tasks:**
  1. Consolidate client tracking into a single stream, removing the redundant 1.5s HTTP poll.
  2. Replace server-side MongoDB polling in SSE with an event-driven pub/sub mechanism.
  3. Remove process-local `setTimeout` chat bot auto-replies.

### Workstream 1.8: Automated Testing & CI/CD
- **Objective:** Establish automated quality gates.
- **Tasks:**
  1. Install Vitest and Supertest; configure in-memory MongoDB test environment.
  2. Implement integration test suites covering critical user, driver, security, and concurrency flows.
  3. Fix all 17 ESLint problems in `src/`.
  4. Create GitHub Actions CI pipeline running lint, typecheck, and tests on all PRs.
  5. Provide `.env.example` template.

---

## 3. Post-Phase 1 Backlog (Deferred by Product Rule)

1. **Phase 2 (Payment Integration):**
   - Razorpay SDK integration, order creation, payment signature verification.
   - Razorpay webhook handler with idempotency replay protection.
   - Post-ride online payment completion flow.
2. **Phase 3 (Admin Panel & Platform Expansion):**
   - Dedicated Admin web panel for document review, driver verification, and platform oversight.
   - Corporate / Business account passes and billing pools.
   - Multi-currency / international localization.
