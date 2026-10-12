# Bhavo Phase 1I: Production Readiness, Security Hardening, Scalability & Deployment Reliability

## 1. Executive Summary

Phase 1I transitions Bhavo from a feature-complete development platform into a secure, observable, recoverable, and deployment-ready mobility system. Every critical subsystem—runtime configuration, session security, database connection pooling, index management, multi-instance concurrency, realtime Server-Sent Events (SSE), background cron scheduling, operational health probes, rate limiting, and structured logging—has been audited, hardened, and verified with automated test suites and production build checks.

### Verification Milestone Summary
- **Test Suite**: **271 / 271 passed** across 52 test suites (`npm test`), including comprehensive production-readiness benchmarks and driver exclusivity concurrency tests.
- **TypeScript Compilation**: **0 errors** (`npx tsc --noEmit`).
- **Static Code Analysis**: **0 errors, 0 warnings** (`npm run lint`).
- **Production Next.js Build**: **49 routes compiled successfully** with Next.js Turbopack (`npm run build`).

---

## 2. Discovered Deployment Architecture

### 2.1 Technology Stack & Runtime
- **Application Framework**: Next.js 16.2.11 (App Router) on Node.js 20+ runtime.
- **Rendering & Execution Model**: Hybrid serverless / container-compatible HTTP request-driven architecture.
  - 17 static pages (`/`, `/about`, `/features`, `/how-it-works`, `/terms`, `/privacy`, `/contact`, `/blog`, etc.)
  - 32 dynamic API routes and authenticated portal pages under `/user/*`, `/driver/*`, and `/admin/*`.
  - Edge middleware boundary (`src/proxy.ts`) enforcing role isolation, path guards, and cache controls.
- **Primary Database**: MongoDB accessed via Mongoose 9.9.3.
- **Session Layer**: Stateless JWT cookies signed via Jose 6.2.9 with server-side database invalidation (`tokenVersion`).
- **Live Online Payments (Gateway)**: **Deliberately absent/disabled in current repository**. The platform operates exclusively on server-authoritative cash collection (`CASH_COLLECTED_BY_DRIVER`) and platform wallet balances represented strictly in integer paise.

### 2.2 Deployment Topology Compatibility
- **Serverless (Vercel / Cloud Run)**: Supported. Stateless request routing, connection pooling with global connection caching, and request abort listeners on streaming routes.
- **Single-Instance Node.js / Docker**: Fully supported.
- **Multi-Instance Cluster**: Supported with shared MongoDB state. Concurrency-critical business invariants (ride acceptance, driver reservations, financial ledger idempotency, auto-booking occurrence lease locks) are enforced directly on the shared MongoDB database.
  - *Identified Limitation*: The default rate-limiting layer (`InMemoryRateLimiter`) operates in process memory. In a multi-instance cluster without Redis, limits are enforced per-instance rather than globally.

---

## 3. Runtime Configuration & Secret Management

Centralized runtime configuration validation is implemented in [`src/lib/runtimeConfig.ts`](file:///c:/Users/bhave/Bhavo/my-bhavo/src/lib/runtimeConfig.ts):

### 3.1 Validation Rules & Entropy Requirements
- **`DATABASE_URL`**: Must start with `mongodb://` or `mongodb+srv://`. Rejects empty strings, whitespace, or malformed protocols. In development/test environments, safe local defaults are permitted.
- **`JWT_SECRET` / `AUTH_SECRET`**: Required. In production (`NODE_ENV=production`), enforces a strict minimum length of 32 characters and rejects known insecure default placeholders (`"your-jwt-secret-min-32-chars"`, `"changeme"`, `"secret"`).
- **`CRON_SECRET`**: Required for all background maintenance and auto-booking workers. Enforces a 32-character minimum in production and fails closed if missing.
- **Operational Numeric Variables**:
  - `RIDE_DISPATCH_LEAD_TIME_MINUTES`: Positive integer [1, 1440], default 60m.
  - `DISPATCH_OFFER_TTL_SECONDS`: Positive integer [5, 300], default 25s.
  - `DISPATCH_MAX_RADIUS_KM`: Positive number [1, 100], default 10 km.
  - `DISPATCH_MAX_ATTEMPTS`: Positive integer [1, 50], default 8 attempts.
  - `DRIVER_LOCATION_MAX_AGE_SECONDS`: Positive integer [10, 3600], default 120s.
  - `AUTO_BOOKING_LOOKAHEAD_MINUTES`: Positive integer $\ge$ dispatch lead time, default 180m.
  - `AUTO_BOOKING_BATCH_SIZE`: Positive integer [1, 200], default 50 records.

### 3.2 Secret Protection Guarantees
- Raw secrets are never returned in API responses, health checks, error messages, or logs.
- Validation errors indicate *which* configuration setting failed without printing secret values.
- `.env.example` documents safe placeholders only.

---

## 4. HTTP, API & Browser Security Hardening

### 4.1 Production HTTP Security Headers
Configured in [`next.config.ts`](file:///c:/Users/bhave/Bhavo/my-bhavo/next.config.ts) and applied to all incoming routes:
- `X-Frame-Options: DENY`: Prevents clickjacking and unauthorized iframe embedding.
- `X-Content-Type-Options: nosniff`: Prevents MIME-sniffing exploits.
- `Referrer-Policy: strict-origin-when-cross-origin`: Restricts referrer data to secure origins.
- `Permissions-Policy: camera=(), microphone=(), geolocation=(self)`: Restricts browser sensors while permitting geolocation for mapping and route navigation.
- `X-DNS-Prefetch-Control: on`: Optimizes DNS resolution safely.
- `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`: Enforces HTTPS in production.

### 4.2 Cache-Control on Authenticated Dashboards
Configured in [`src/proxy.ts`](file:///c:/Users/bhave/Bhavo/my-bhavo/src/proxy.ts):
- Requests to `/admin/*`, `/user/*`, and `/driver/*` set `Cache-Control: no-store, no-cache, must-revalidate, private` to prevent shared proxy caching and browser back-button exposure after logout.

### 4.3 Cookie & Session Security
- `auth_token` cookie is strictly configured with:
  - `httpOnly: true` (prevents JavaScript access via XSS)
  - `secure: true` in production (enforces HTTPS transport)
  - `sameSite: "lax"` (mitigates CSRF on cross-site requests)
  - `path: "/"` with explicit expiration

---

## 5. Domain Rate Limiting & Abuse Prevention

Operation-tailored rate limiting is implemented in [`src/lib/rateLimit.ts`](file:///c:/Users/bhave/Bhavo/my-bhavo/src/lib/rateLimit.ts):

| Endpoint / Operation | Rate Limit Threshold | Key Composition | Purpose |
| :--- | :--- | :--- | :--- |
| `POST /api/auth/login` | 5 attempts / 15 min | `login:<ip>:<email>` | Credential stuffing & brute-force mitigation |
| `POST /api/auth/forgot-password` | 3 requests / 15 min | `forgot:<ip>:<email>` | SMTP flood & email enumeration prevention |
| `POST /api/auth/verify-otp` | 5 attempts / 10 min | `otp:<ip>:<email>` | 6-digit OTP brute-force protection |
| `POST /api/driver/rides (UPDATE_LOCATION)` | 60 updates / 60 sec | `<driverId>` | Telemetry flooding & socket write protection |
| `POST /api/contact` | 5 submissions / 15 min | `contact:<ip>` | Contact form spam mitigation |
| `POST /api/user/tickets` | 10 tickets / 15 min | `<userId>` | Support queue flooding prevention |
| `GET /api/*/stream` | 15 connects / 60 sec | `<userId>` | SSE connection exhaustion defense |

*Multi-Instance Topology Note*: The `IRateLimiter` interface is cleanly decoupled. In a horizontal cluster requiring strictly shared rate limits, a Redis-backed implementation can be substituted without modifying route handler code.

---

## 6. MongoDB Connection Pooling & Index Reliability

### 6.1 Connection Pooling
Hardened in [`src/lib/mongoose.ts`](file:///c:/Users/bhave/Bhavo/my-bhavo/src/lib/mongoose.ts):
- `maxPoolSize`: 20 connections per process (configurable via `MONGODB_MAX_POOL_SIZE`).
- `minPoolSize`: 2 connections kept warm.
- `socketTimeoutMS`: 45,000ms.
- `serverSelectionTimeoutMS`: 5,000ms.
- `connectTimeoutMS`: 10,000ms.
- Connection caching across hot-reloads and serverless function invocations via `global.mongoose`.
- Database URI evaluation is lazy inside `dbConnect()`, preventing build failures during static compilation.

### 6.2 Model Index Catalog & Deployment
Managed idempotently via [`src/lib/ensureIndexes.ts`](file:///c:/Users/bhave/Bhavo/my-bhavo/src/lib/ensureIndexes.ts):

- **`User`**:
  - `{ email: 1 }` (unique)
  - `{ role: 1, status: 1, isOnline: 1, dutyState: 1 }` (targeted driver candidate discovery)
  - `{ role: 1, status: 1 }` (directory queries)
- **`Ride`**:
  - `{ status: 1, driver: 1, scheduledFor: 1 }` (driver active trip exclusivity)
  - `{ rider: 1, status: 1 }` (rider active ride check)
  - `{ _id: 1, rider: 1, status: 1 }` (SSE stream authorization)
  - `{ _id: 1, driver: 1, status: 1 }` (driver stream authorization)
  - `{ "currentOffer.driverId": 1, "currentOffer.expiresAt": 1 }` (offer expiration sweeps)
  - `{ status: 1, dispatchStatus: 1, scheduledFor: 1 }` (dispatch worker queries)
  - `{ autoBookingOccurrenceKey: 1 }` (unique sparse index for auto booking idempotency)
  - `{ status: 1, createdAt: -1 }` (admin operations filter)
  - `{ createdAt: -1 }` (general history)
- **`Transaction`**:
  - `{ idempotencyKey: 1 }` (unique financial idempotency)
  - `{ entityType: 1, entityId: 1, eventType: 1, sequence: 1 }` (unique composite business event)
  - `{ userId: 1, createdAt: -1 }` (user ledger history)
- **`AutoBookingOccurrence`**:
  - `{ occurrenceKey: 1 }` (unique recurrence materialization)
  - `{ status: 1, scheduledFor: 1 }` (worker lease queries)
  - `{ commuteId: 1, scheduledFor: 1 }` (commute timeline lookups)
  - `{ rider: 1, scheduledFor: 1 }` (rider schedule queries)
- **`Ticket`**:
  - `{ ticketId: 1 }` (unique, generated with timestamp + entropy)
  - `{ status: 1, priority: 1, createdAt: -1 }` (admin support queue)
  - `{ user: 1, createdAt: -1 }` (user ticket history)
- **`AdminAuditLog`**:
  - `{ createdAt: -1 }`
  - `{ targetType: 1, targetId: 1, createdAt: -1 }`
  - `{ actor: 1, createdAt: -1 }`
  - `{ action: 1, createdAt: -1 }`

---

## 7. Multi-Instance Concurrency & Business Invariants

All core business invariants are enforced authoritatively via **shared MongoDB atomic operations, document-level locks, and unique indexes**, independent of process memory:

| Invariant | Enforcement Mechanism | Failure / Conflict Behavior |
| :--- | :--- | :--- |
| **Atomic Ride Acceptance** | CAS write on `Ride.findOneAndUpdate({ _id: rideId, status: "SEARCHING", driver: null, ... }, { $set: { status: "ACCEPTED", driver: driverId } })`. | Winner acquires ride; concurrent competitor drivers receive `409 Conflict (RIDE_ALREADY_ACCEPTED)`. |
| **Driver Active Trip Exclusivity & Concurrency** | Atomic reservation directly on the driver document: `User.findOneAndUpdate({ _id: driverId, status: "ACTIVE", isOnline: true, dutyState: { $in: ["ONLINE_SEARCHING", "DISPATCH_ALERT"] }, $or: [{ activeRideId: null }, { activeRideId: { $exists: false } }, { activeRideId: rideId }] }, { $set: { dutyState: "ON_TRIP", activeRideId: rideId } })`. | Simultaneous acceptance requests for different rides by the same driver cannot both succeed. Exactly one acquires the document lock; competing request receives `409 DRIVER_OCCUPIED`. |
| **Conditional Reservation Release** | All release paths (`User.updateOne({ _id: driverId, activeRideId: rideId }, { $set: { dutyState: ..., activeRideId: null } })`) are strictly conditioned on the specific `rideId`. Covers: failed Ride CAS assignment, ride completion, cancellation by driver, and cancellation by rider. | Mismatched release attempts (e.g. from an unassigned ride or stale request) are safely rejected and cannot release another active ride's driver lock. |
| **Inactive / Suspended Driver Gate** | `transitionToAccepted` checks `driverUser.status === "ACTIVE"`. `driverReserved` atomic query requires `status: "ACTIVE"`. | Inactive, suspended, or disabled drivers fail closed with `403 DRIVER_INACTIVE` and cannot reserve or accept rides. |
| **Targeted Dispatch Offers** | Atomic update on `Ride.currentOffer` + driver duty state transition `DISPATCH_ALERT`. | Conditional write; offers auto-expire via TTL and are swept idempotently. |
| **Financial Ledger Idempotency** | Unique index on `Transaction.idempotencyKey` + composite index `{ entityType, entityId, eventType, sequence }`. | Duplicate requests catch Mongo error E11000 and return existing settled transaction safely without double-crediting. |
| **Auto Booking Occurrence Materialization** | Atomic lease claim via `findOneAndUpdate({ status: "PENDING", leaseExpiresAt: { $lt: now } }, { $set: { status: "CLAIMED", leaseId, leaseExpiresAt } })` + unique index on `autoBookingOccurrenceKey`. | Exactly-once ride creation; duplicate workers cannot double-materialize. |
| **Admin Document Review Consistency** | Admin decisions update `targetDoc.status` and atomically re-evaluate `checkDriverVerification`. | If driver fails compliance, `isOnline` is forced to `false` and `dutyState` to `OFFLINE`. |
| **Driver Active Trip Suspension Safety** | Admin status route queries `Ride.findOne({ driver: driverId, status: { $in: ["ACCEPTED", "ARRIVED", "IN_PROGRESS"] } })` before suspension. | Rejected with `409 Conflict` to prevent stranding passengers mid-journey. |
| **Session Invalidation** | Atomic increment on `User.tokenVersion`. Future JWT verification rejects mismatched tokenVersion. | Immediate `401 TOKEN_REVOKED` across all application instances. |

---

## 8. Realtime SSE Tracking & Capacity Analysis

### 8.1 Stream Lifecycle & Resource Management
- **Routes**: `/api/user/rides/[id]/stream` and `/api/driver/rides/[id]/stream`.
- **Immediate State**: Client receives an immediate authoritative snapshot upon connection.
- **Resource Cleanup**: Stream registers `req.signal.addEventListener("abort")` which clears `setInterval` timers and closes controllers on client disconnect, page close, or network drop.
- **Terminal Shutdown**: When a ride reaches `COMPLETED` or `CANCELLED`, the stream emits the terminal event, clears timers, and closes cleanly.
- **Lean Queries**: Periodic polling queries use `.lean()` to avoid Mongoose document hydration overhead.

### 8.2 Database Query Rate Capacity Estimates (Mathematical Projections)
*Methodology Note*: These figures are **mathematical model estimates** derived directly from the application's synchronization interval ($QPS = \frac{\text{Concurrent Connections}}{2.0\text{ seconds}}$). They are **NOT measured production load** under live multi-client network saturation:

| Concurrent Active Streams | Estimated Query Rate (QPS) | Projected MongoDB Resource Impact (Indexed by `_id` + `role`) |
| :--- | :--- | :--- |
| **10 active connections** | **5 QPS** | Negligible (< 1% CPU on small replica set) |
| **100 active connections** | **50 QPS** | Low (~2–5% CPU on M10 / small cluster) |
| **500 active connections** | **250 QPS** | Moderate; fully manageable with replica set read secondary |
| **1,000 active connections** | **500 QPS** | Approaching polling limit for single database node |

*Scaling Recommendation*: For deployments exceeding 500 concurrent active tracking streams, transition from polling-based SSE to MongoDB Change Streams with Redis Pub/Sub to eliminate periodic database query load.

---

## 9. Durable Background Jobs & Cron Invocation

- **Endpoints in Source Control**:
  - `GET /api/cron/auto-booking` & `POST /api/cron/auto-booking`
  - `GET /api/driver/dispatches/maintenance` & `POST /api/driver/dispatches/maintenance`
- **Authentication**: Both endpoints verify `CRON_SECRET` using `crypto.timingSafeEqual` in [`src/lib/cronAuth.ts`](file:///c:/Users/bhave/Bhavo/my-bhavo/src/lib/cronAuth.ts).
- **HTTP Method Support**: Both endpoints accept both `GET` and `POST` methods, ensuring compatibility with standard cloud schedulers (Vercel Cron, Google Cloud Scheduler, AWS EventBridge, cron-job.org).
- **Idempotency & Lease Protection**: Auto-booking occurrences use distributed leases (`leaseExpiresAt`) preventing overlapping cron runs from duplicating rides. Expired dispatch sweeps are idempotent and bounded to batches of 100 offers.
- **External Registration Status**: **Configured in source, but NOT registered in external hosting deployment**. The application does NOT rely on an in-process `setInterval` timer (which is non-durable and dies on process restart). An external cloud scheduler must be registered by an operator in the hosting console.

---

## 10. Payment & Financial Production Gates

- **Status**: Live external payment gateway (Razorpay) is **deliberately disabled**.
- **Enforcement**:
  - `isLivePaymentEnabled()` in `src/lib/runtimeConfig.ts` returns `false` unless explicitly approved credentials exist.
  - Public registration and ride creation strictly require server-authoritative integer paise amounts.
  - Cash collection is verified through driver confirmation (`/api/driver/rides/[id]/cash`) and recorded in the immutable `Transaction` ledger.
  - Physical cash collected by a driver does **not** credit platform wallet balances.
- **Prerequisites for Live Online Payments**:
  1. Business approval of merchant account and commission split policy.
  2. Installation of verified provider SDK.
  3. Server-authoritative order creation and signature verification.
  4. Raw request body verification on webhooks.
  5. Webhook deduplication through ledger transaction idempotency.

---

## 11. Operational Observability & Health Probes

### 11.1 Health Probes
- **Liveness (`/api/health/liveness`)**: Returns `200` with uptime and timestamp. Instantaneous, bounded response.
- **Readiness (`/api/health/readiness`)**: Executes a bounded database ping via `checkDatabaseHealth()`. Returns `200` when ready, `503` when disconnected. Excludes all credentials and connection strings.
- **Operational Status (`/api/health`)**: Reports high-level service status, environment, and configuration flags without leaking secret strings.

### 11.2 Privacy-Safe Structured Logger
Implemented in [`src/lib/logger.ts`](file:///c:/Users/bhave/Bhavo/my-bhavo/src/lib/logger.ts):
- Recursively masks sensitive fields (`password`, `token`, `otp`, `secret`, `authorization`, `creditCard`).
- Emits structured JSON logs to stdout/stderr.

---

## 12. Backup, Disaster Recovery & Release Procedures

### 12.1 Critical Data Assets
- `users`: Account identities, hashed passwords, tokenVersions, compliance verification records.
- `rides`: Authoritative ride state machine history, pricing snapshots, audit timelines.
- `transactions`: Immutable financial ledger records.
- `adminauditlogs`: Immutable regulatory and operational review records.
- `autobookingoccurrences`: Commute recurrence processing state.
- `tickets`: Customer support queue records.

### 12.2 Backup Strategy
- **Managed Database (MongoDB Atlas)**:
  - Enable Continuous Cloud Backups with 1-minute Point-in-Time Recovery (PITR).
  - Configure 7-day daily snapshots and 4-week weekly snapshots.
- **Self-Hosted MongoDB**:
  - Run automated daily `mongodump --uri="$DATABASE_URL" --gzip --archive=/backups/bhavo-$(date +%F).gz`.
  - Store encrypted backups in off-site object storage (AWS S3 with Object Lock or GCP Cloud Storage).

### 12.3 Disaster Recovery Procedure
1. Provision target MongoDB cluster.
2. Restore latest snapshot: `mongorestore --uri="$TARGET_DATABASE_URL" --gzip --archive=/backups/bhavo-latest.gz`.
3. Run index deployment utility: `npm run db:indexes` (or `npx tsx scripts/deployIndexes.ts`).
   > [!IMPORTANT]
   > `npm test` executes the test suite in Node.js and does **NOT** deploy database indexes to MongoDB. The authoritative and supported procedure for deploying indexes is `npm run db:indexes`.
   > 
   > **Prerequisites for Index Deployment**:
   > - `DATABASE_URL` configured in environment pointing to target database.
   > - Network connectivity to MongoDB cluster (IP access list / VPC peering).
   > - Database user credentials possessing `createIndex` / index management permissions.
   > - **Safety Guarantee**: `ensureAllIndexes()` is strictly additive and idempotent; it never drops collections, deletes documents, or executes destructive migrations.
4. Point application `DATABASE_URL` to the restored instance.
5. Verify `/api/health/readiness` returns status `ready`.

### 12.4 Safe Release & Rollback Procedure
1. Execute CI pipeline (`npm ci && npm run lint && npx tsc --noEmit && npm test && npm run build`).
2. Run database index sync: `npm run db:indexes`.
3. Deploy application bundle.
4. Execute smoke tests on `/api/health` and `/api/health/readiness`.
5. **Rollback**: If anomalies occur, revert application container or commit without touching database records. Because schema updates in Phase 1I are strictly additive and non-destructive, previous application builds remain 100% compatible.

---

## 13. Core Domain Latency & Performance Evidence

*Benchmarking Disclosure & Scope*:
- The following figures are **synthetic in-memory micro-benchmarks** executing localized CPU algorithms across 1,000 iterations in `tests/production-readiness.test.ts`.
- They reflect algorithmic efficiency and CPU overhead.
- They do **NOT** represent end-to-end HTTP request latency, network round-trip time (RTT), or database I/O latencies under multi-user concurrency.

| Benchmark | Iterations | Total Duration | Average Latency | Target Threshold | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Haversine Geodesic Distance** | 1,000 | **3.94 ms** | **0.0039 ms** (3.9 μs) | < 20 ms | **PASS** |
| **Authoritative Integer-Paise Fare Calculation** | 1,000 | **13.97 ms** | **0.014 ms** (14 μs) | < 50 ms | **PASS** |
| **Driver Candidate Eligibility Gate Evaluation** | 1,000 | **27.17 ms** | **0.027 ms** (27 μs) | < 50 ms | **PASS** |
| **Vehicle Compatibility Matrix Resolution** | 4 cases | **0.61 ms** | **0.15 ms** | < 5 ms | **PASS** |

All core algorithmic functions exhibit sub-millisecond execution times, comfortably supporting high-throughput dispatch evaluations without CPU bottlenecks.

---

## 14. Production Prerequisites Classification & Operational Readiness

Every launch prerequisite is explicitly classified using available repository and execution evidence:

| # | Launch Prerequisite | Status Classification | Evidence & Operational Requirement |
| :--- | :--- | :--- | :--- |
| **1** | **Production JWT / Auth Secrets** | **Requires external operator action** | `src/lib/runtimeConfig.ts` enforces $\ge 32$ chars in production and rejects insecure default strings. Operator must provision `JWT_SECRET` / `AUTH_SECRET` in hosting console using `openssl rand -base64 32`. |
| **2** | **Production `CRON_SECRET`** | **Requires external operator action** | `src/lib/cronAuth.ts` enforces constant-time validation and fails closed if unset. Operator must provision `CRON_SECRET` in hosting environment and configure scheduler headers. |
| **3** | **Auto Booking Scheduler** | **Configured in source but not verified in deployment** | `/api/cron/auto-booking` supports GET/POST with lease locks and idempotency keys. No external scheduler is registered in source (no `vercel.json` cron block). Operator must register cron job (e.g. Vercel Cron, Google Cloud Scheduler) at 2m interval. |
| **4** | **Dispatch Maintenance Scheduler** | **Configured in source but not verified in deployment** | `/api/driver/dispatches/maintenance` supports GET/POST with expired offer sweep. Operator must register cron trigger at 1m interval in hosting console. |
| **5** | **MongoDB Network & Pool Settings** | **Requires external operator action** | `src/lib/mongoose.ts` sets `maxPoolSize: 20`, `minPoolSize: 2`, `socketTimeoutMS: 45000`. Operator must verify connection limits match MongoDB Atlas plan and whitelist application IPs / VPC peering in Atlas console. |
| **6** | **Transactional SMTP Credentials** | **Requires external operator action** | `src/lib/email.ts` integrates Nodemailer with HTML templates and production OTP log redaction. Operator must configure `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` with an approved email provider (e.g. AWS SES, SendGrid, Postmark) and test OTP delivery. |
| **7** | **MongoDB Backups & Restore Drill** | **Requires external operator action** | Backup runbook is documented; physical snapshotting and recovery drills require Atlas Continuous Cloud Backups (or mongodump cron) configured in cloud infrastructure and tested on a staging cluster. |
| **8** | **Approved Pricing Configuration** | **Verified in repository** | Server-authoritative rate cards are established in `src/lib/pricingEngine.ts` (`AUTHORITATIVE_RATE_CARDS` for Bike, Auto, Cab Economy, Cab Premium, Cab Large, Parcel Express). Integer-paise calculations and distance validation verified by 271 automated tests. |
| **9** | **Razorpay Gateways Safely Disabled** | **Verified in repository** | Online payment collection remains completely disabled (`isLivePaymentEnabled() === false`). Platform operates exclusively on server-authoritative cash collection (`CASH_COLLECTED_BY_DRIVER`) and integer-paise wallet ledger. No fake success bypasses exist. |
| **10** | **Monitoring & Incident Alerting** | **Requires external operator action** | Endpoints `/api/health`, `/api/health/liveness`, `/api/health/readiness` and structured logger (`src/lib/logger.ts`) are implemented. Operator must point external monitoring service (e.g. Datadog, BetterStack, PagerDuty) at health endpoints to trigger alerts on 503 or downtime. |
