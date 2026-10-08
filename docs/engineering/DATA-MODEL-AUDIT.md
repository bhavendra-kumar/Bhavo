# Data Model & Schema Audit — Bhavo Platform

**Auditor:** Senior Backend & Database Engineer  
**Date:** October 2026  
**Status:** COMPLETE

---

## 1. Existing Model Audit

### 1. User Model (`src/models/User.ts`)
- **Status:** **Overloaded / God Object**
- **Lines of Code:** 193
- **Analysis:**  
  The `User` model currently aggregates multiple unrelated sub-domains into a single document:
  - User identity: `name`, `email`, `password`, `role`, `avatar`, `phone`.
  - Financial state: `walletBalance` (raw number, no ledger).
  - Passenger telemetry: `emergencyContacts`, `pets`.
  - Auth reset: `resetOtp`, `resetOtpExpiry`.
  - Driver telemetry: `isOnline`, `dutyState`, `driverCoordinates`.
  - Driver vehicle: `driverVehicle` object (`model`, `numberPlate`, `fuelType`, `batteryOrFuelLevel`, `documentsVerified`, `insuranceValidUntil`).
  - Driver settings: `driverSettings` (`autoAccept`, `audioCues`, `petFriendly`, `maxDistance`, `destinationMode`, `destinationAddress`).
  - Driver compliance documents: `driverDocuments` array containing 8 embedded documents with default `status: "VERIFIED"`.
- **Architectural Issues:**
  1. Every new user created gets default driver vehicle data, default driver settings, and 8 verified driver documents, causing unnecessary storage bloat.
  2. Lacks a 2dsphere index on `driverCoordinates`.
  3. `walletBalance` is a raw number on the user document without transaction journals.

### 2. Ride Model (`src/models/Ride.ts`)
- **Status:** **Incomplete Domain Representation**
- **Lines of Code:** 160
- **Fields Present:** `rider`, `driver`, `driverDetails`, `driverCoordinates`, `pickup`, `dropoff`, `vehicleType`, `fare`, `distance`, `duration`, `status`, `otp`, `scheduledFor`, `paymentMethod`, `paymentStatus`, `messages`, `tip`, `riderRating`, `riderCompliments`, `cancellationReason`.
- **Missing Fields:**
  - `petFriendly`: Missing. Cannot enforce pet ride matching.
  - `preferredDriver`: Missing. Cannot track preferred driver matching attempts.
  - `paymentDetails`: Missing Razorpay order ID, payment ID, signature, or payment gateway timestamps.
  - `cancellationPolicy`: Missing cancellation fee, cancellation party, and waiting time.
  - `commuteSchedule`: Missing reference linking generated rides to recurring commute schedules.
- **Index Issues:**
  - `driver` reference has **no index**, resulting in collection scans when querying rides by driver (`Ride.find({ driver: driverId })`).
  - `createdAt` and `updatedAt` are not indexed, slowing dashboard sort queries.
  - Coordinates are stored as raw `[Number]` arrays rather than GeoJSON points.

### 3. Commute Model (`src/models/Commute.ts`)
- **Status:** **Passive Schedule Template**
- **Lines of Code:** 69
- **Fields:** `rider`, `title`, `pickup`, `dropoff`, `time`, `days`, `vehicleType`, `isActive`.
- **Analysis:**  
  The model functions purely as a CRUD template. It has no execution history, no last-dispatched timestamp, no generated ride linkages, and no configuration for driver advance notification windows (T-60 minutes).

### 4. Place Model (`src/models/Place.ts`)
- **Status:** **Adequate**
- **Fields:** `rider`, `name`, `address`, `coordinates`, `tag`, `isFavorite`.
- **Note:** Stores coordinates as raw `[Number]` array without GeoJSON indexing.

### 5. Ticket Model (`src/models/Ticket.ts`)
- **Status:** **Functional**
- **Fields:** `user`, `ticketId`, `category`, `subject`, `description`, `status`, `priority`, `resolutionNotes`.
- **Note:** `status` and `priority` lack indexes for admin queue querying.

---

## 2. Missing Domain Models

To support production ride-hailing and financial compliance, the following models must be created in Phase 1:

1. **`DriverProfile`:** Decouple from `User`. Holds license numbers, verification state, duty state, background check references, and approval timestamps.
2. **`Vehicle`:** Dedicated collection. Holds registration number, make, model, category, document references, and owner details.
3. **`Wallet` & `LedgerEntry` / `Transaction`:** Immutable double-entry ledger tracking every credit, debit, hold, tip, and cashout with unique transaction IDs and references.
4. **`Payment`:** Tracks online (Razorpay) and offline (Cash) payments, payment states (`PENDING`, `AUTHORIZED`, `CASH_COLLECTED`, `FAILED`, `REFUNDED`), order IDs, and webhook idempotency tokens.
5. **`Notification`:** Persists user and driver in-app notifications with read/unread status.
6. **`CancellationPolicy`:** Configurable server-side policy defining grace periods, fees, and driver compensation.

---

## 3. Schema Comparison: Current vs. Target Architecture

```
CURRENT (Overloaded User & Implicit State):
┌────────────────────────┐         ┌────────────────────────┐
│         User           │         │          Ride          │
│ - identity fields      │1       *│ - rider (ref User)     │
│ - walletBalance (float)│─────────│ - driver (ref User)    │
│ - driverVehicle        │         │ - fare (raw float)     │
│ - driverDocuments      │         │ - status               │
│ - driverDutyState      │         │ - plain coords         │
└────────────────────────┘         └────────────────────────┘

TARGET (Normalized Domain Entities):
┌──────────┐ 1      1 ┌───────────────┐ 1      * ┌───────────────┐
│   User   │──────────│ DriverProfile │──────────│    Vehicle    │
└──────────┘          └───────────────┘          └───────────────┘
     │ 1                     │ 1
     │                       │
     │ 1                     │ 1
┌──────────┐          ┌───────────────┐
│  Wallet  │          │ Wallet(Driver)│
└──────────┘          └───────────────┘
     │ 1                     │ 1
     │ *                     │ *
┌──────────────┐      ┌───────────────┐
│ LedgerEntry  │      │  LedgerEntry  │
└──────────────┘      └───────────────┘
     │                       │
     └───────────┬───────────┘
                 │
                 v
         ┌───────────────┐
         │     Ride      │
         │ - rider       │
         │ - driver      │
         │ - petFriendly │
         │ - GeoJSON pts │
         └───────────────┘
                 │ 1
                 │ 1
         ┌───────────────┐
         │    Payment    │
         │ - Razorpay /  │
         │   Cash flow   │
         └───────────────┘
```
