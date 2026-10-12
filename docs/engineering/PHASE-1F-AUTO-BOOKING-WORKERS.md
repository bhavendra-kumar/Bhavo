# PHASE 1F: AUTO BOOKING, RECURRING RIDE GENERATION & RELIABLE BACKGROUND EXECUTION
## Master Engineering Documentation & Verification Report

---

### Executive Summary

Phase 1F implements autonomous, idempotent materialization of scheduled recurring commutes into individual ride bookings on Bhavo. Commute schedules (`Commute` model) represent reusable recurring instructions; individual rides (`Ride` model) are materialized exactly once per scheduled occurrence within an early materialization lookahead window (`AUTO_BOOKING_LOOKAHEAD_MINUTES`, default 180 minutes).

The solution strictly enforces timezone safety for Indian Standard Time (`Asia/Kolkata`, UTC+05:30), prevents duplicate ride creation via two-tier idempotency (atomic distributed lease claiming via `AutoBookingOccurrence` and a unique sparse index on `Ride.autoBookingOccurrenceKey`), preserves Phase 1D's driver dispatch lead-time boundary (`RIDE_DISPATCH_LEAD_TIME_MINUTES` = 60 minutes), reuses Phase 1C's authoritative integer paise pricing engine (`calculateAuthoritativeFare`), and exposes an externally invokable cron execution endpoint (`POST /api/cron/auto-booking`) protected by timing-safe `CRON_SECRET` verification.

---

### 1. Recurrence Engine & Timezone Invariance

#### 1.1 Timezone Invariance (`Asia/Kolkata`)
India Standard Time (IST) is UTC+05:30 with zero daylight saving time shifts (`IST_OFFSET_MS = 19,800,000 ms`). The recurrence engine (`src/lib/recurrenceEngine.ts`) never relies on the host operating system's local timezone (`process.env.TZ`) or native JavaScript `Date` getters that use system local time:
- An arbitrary UTC instant is translated to IST by computing `t + IST_OFFSET_MS`.
- Date components (year, month, day, weekday 0–6) are extracted via UTC getters on the offset timestamp.
- Time strings in both 12-hour (`"8:45 AM"`, `"06:30 PM"`) and 24-hour (`"08:45"`, `"18:30"`) formats are parsed deterministically into canonical hours and minutes.
- Reconstructed scheduled instants are mapped back to UTC via `buildIstTimestamp(year, month, day, hours, minutes)`.
- Weekdays are normalized to support case-insensitive full names (`"Monday"`) and 3-letter abbreviations (`"Mon"`).

#### 1.2 Deterministic Occurrence Keys
Every occurrence has a stable canonical key:
```
${commuteId}:${yyyy-MM-dd}_${hhmm}
```
Example: `6529ab81c9a1240012345678:2026-10-12_0845`
Repeated executions across multiple workers or server instances deterministically evaluate to the exact same key.

#### 1.3 Missed and Past Occurrences
If an occurrence's scheduled pickup time has already passed when evaluated:
- The system never creates a ride with a past timestamp (`isPast: true`).
- The occurrence is marked as `SKIPPED_PAST` in `AutoBookingOccurrence`.
- Future occurrences continue to be evaluated normally.

---

### 2. Lookahead Window & Driver Dispatch Integration

#### 2.1 Lookahead Configuration
- `AUTO_BOOKING_LOOKAHEAD_MINUTES`: Environment variable with operational default of 180 minutes (3 hours).
- Validated at startup: `AUTO_BOOKING_LOOKAHEAD_MINUTES >= RIDE_DISPATCH_LEAD_TIME_MINUTES` (ensures rides are materialized early enough for scheduled driver confirmation).
- `AUTO_BOOKING_BATCH_SIZE`: Configurable batch size limit per cron execution (default 50).

#### 2.2 Preservation of Phase 1D Scheduled Dispatch (T−60 Boundary)
- A ride materialized at T−180 minutes is persisted with `scheduledFor` set to the true future pickup time.
- In Phase 1D (`src/app/api/driver/dispatches/route.ts`), driver dispatch discovery explicitly filters:
  ```typescript
  scheduledFor: { $lte: new Date(Date.now() + dispatchLeadTimeMinutes * 60 * 1000) }
  ```
- Because `dispatchLeadTimeMinutes` defaults to 60 minutes, rides created 180 minutes in advance remain in the database in initial state `SEARCHING` with `driver: null`, but are **never returned or offered to drivers** until exactly 60 minutes before pickup (`T−60`).

---

### 3. Durable Idempotency, Leases & Concurrency Safety

#### 3.1 Two-Tier Concurrency Protection
1. **Tier 1 — Distributed Atomic Lease (`AutoBookingOccurrence`)**:
   - `occurrenceKey` is indexed uniquely (`{ occurrenceKey: 1 }`, unique).
   - Before materializing, the worker attempts an atomic `findOneAndUpdate` with condition:
     ```typescript
     {
       occurrenceKey,
       $or: [
         { status: "PENDING" },
         { status: "FAILED_RETRYABLE", retryCount: { $lt: 5 }, leaseExpiresAt: { $lt: atTime } },
         { leaseExpiresAt: { $lt: atTime } } // Expired lease recovery
       ]
     }
     ```
   - Claims an atomic server-generated `leaseId: UUID` and `leaseExpiresAt: now + 60,000ms`.
   - If another worker currently holds an unexpired lease, the query returns `null` and skips the occurrence safely without duplicate work.

2. **Tier 2 — Database Unique Constraint (`Ride.autoBookingOccurrenceKey`)**:
   - MongoDB sparse unique index: `{ autoBookingOccurrenceKey: 1 }`.
   - Even in an extreme edge case where a lease expires while an older worker is still writing, MongoDB rejects duplicate ride creation with `E11000 duplicate key error`.

#### 3.2 Crash Recovery and Reconciliation
- If a worker crashes after `Ride.create` succeeds but before `AutoBookingOccurrence.updateOne` updates the status to `MATERIALIZED`:
  - The subsequent execution detects the existing ride by `autoBookingOccurrenceKey`.
  - Reconciles the occurrence record status to `MATERIALIZED` with `rideId: existingRide._id`.
  - Returns `RECONCILED_EXISTING` without generating a second ride.

#### 3.3 State Machine for Occurrences
- `PENDING`: Discovered and queued for processing.
- `MATERIALIZED`: Successfully created individual ride or reconciled.
- `FAILED_RETRYABLE`: Transient error (e.g., transient network hiccup); retryable with exponential backoff up to 5 attempts.
- `FAILED_PERMANENT`: Terminal error requiring user/operator attention (e.g., coordinates out of range, suspended rider account, deleted commute).
- `SKIPPED_PAST`: Scheduled pickup time passed prior to execution.
- `SKIPPED_PAUSED`: Commute schedule was paused or deleted by rider.

---

### 4. Authoritative Pricing & Booking Integrity

- **Financial Integrity**: Reuses Phase 1C's authoritative pricing engine (`calculateAuthoritativeFare`) in integer paise.
- **No Client Fares Trusted**: Never trusts client-specified fares stored in schedules.
- **Fail Safe**: If coordinates are invalid or pricing cannot be computed, the system records `FAILED_PERMANENT` with diagnostic details and never generates a ride with zero or arbitrary fare.
- **Payment Policy**: Uses the commute schedule's `paymentMethod` (defaults to `"cash"`). Rides are generated with payment status `"PENDING"`; cash or digital payments are never marked `"PAID"` upon booking creation.
- **OTP Generation**: Uses cryptographically secure `crypto.randomInt(1000, 10000).toString()` for pickup verification.

---

### 5. Background Execution & Cron Security

#### 5.1 Endpoint Specification
- **Path**: `POST /api/cron/auto-booking` (and `GET /api/cron/auto-booking` for simple ping invocations).
- **Authentication**: Constant-time verification using `crypto.timingSafeEqual` via shared utility `@/lib/cronAuth.ts`.
- **Authorization Header**: `Bearer <CRON_SECRET>`.
- **Fail Closed**: If `CRON_SECRET` is not set in the environment, the endpoint rejects all requests with `500 CRON_NOT_CONFIGURED`. Missing or invalid tokens return `401 UNAUTHORIZED`.
- **Batch Controls**: Accepts optional `limit` (1–200, default 50) and `lookaheadMinutes` (minimum 60, default 180).
- **Safe Response Payload**: Returns aggregated metrics (`occurrencesScanned`, `ridesMaterialized`, `alreadyMaterialized`, `reconciledExisting`, `skippedPast`, `skippedPaused`, `retryableFailures`, `permanentFailures`, `currentlyLeased`, `durationMs`) without exposing sensitive user data or internal secrets.

#### 5.2 External Scheduler Configuration Requirements
Bhavo is a Next.js App Router application. In accordance with system architecture guidelines:
- **No Process-Local Interval**: The backend does NOT use `setInterval` or in-memory timers, which die on serverless reboots or container spin-downs.
- **External Invocation Required**: Autonomous execution requires configuring an external cron caller.
  - **Vercel Cron** (`vercel.json`):
    ```json
    {
      "crons": [
        {
          "path": "/api/cron/auto-booking",
          "schedule": "* * * * *"
        },
        {
          "path": "/api/driver/dispatches/maintenance",
          "schedule": "* * * * *"
        }
      ]
    }
    ```
  - **Linux / Cloud Cron (e.g. AWS EventBridge / GCP Cloud Scheduler / crontab)**:
    ```bash
    * * * * * curl -X POST -H "Authorization: Bearer $CRON_SECRET" https://bhavo.app/api/cron/auto-booking
    ```

---

### 6. User Experience & Observable Status

- **Commute Dashboard (`src/components/user/my-commute/MyCommute.tsx`)**:
  - Displays recurring schedules with pause/resume controls.
  - Shows an "Auto-Booked Ride: [Status]" badge linking to the generated trip when `lastGeneratedRideId` is present.
  - Truthful status: displays "Scheduled" for upcoming rides, "In Progress" or "Completed" as the driver progresses.

---

### 7. Verification Results

| Check | Tool / Command | Exit Code | Result | Details |
|---|---|---|---|---|
| **Unit & Integration Tests** | `npm test` | **0** | **PASS** | 220 passed across 40 test suites (0 failures, 0 skipped). Includes 27 new tests covering recurrence parsing, timezone calculations, lookahead windows, cron authentication, pricing integrity, T−60 dispatch separation, and lease concurrency. |
| **TypeScript Typecheck** | `npx tsc --noEmit` | **0** | **PASS** | 0 type errors across all application and test files. |
| **ESLint Quality Check** | `npm run lint` | **0** | **PASS** | 0 errors, 0 warnings across all files. |
| **Next.js Production Build** | `npm run build` | **0** | **PASS** | All 43 routes compiled successfully with Turbopack, including `POST /api/cron/auto-booking`. |

---

### 8. Database Migrations & Indexes

1. **`auto_booking_occurrences` Collection**:
   - `{ occurrenceKey: 1 }` (unique)
   - `{ status: 1, scheduledFor: 1, leaseExpiresAt: 1 }` (compound index for fast polling)
   - `{ commuteId: 1, scheduledFor: -1 }` (schedule history index)

2. **`rides` Collection**:
   - `{ autoBookingOccurrenceKey: 1 }` (unique, sparse)
   - `{ commuteId: 1, scheduledFor: -1 }` (foreign key lookup index)

3. **`commutes` Collection**:
   - `{ isActive: 1, updatedAt: -1 }` (active commute batch scanning index)

No destructive migrations or existing data deletions are required. All indexes are created safely via Mongoose schema definitions.
