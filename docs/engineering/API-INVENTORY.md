# API Inventory & Endpoint Audit — Bhavo Platform

**Auditor:** Senior Backend Engineer  
**Date:** October 2026  
**Status:** COMPLETE (All 22 Endpoints Verified)

---

## 1. Inventory Summary

| Method | Route | Auth | Role | Validation | Ownership Check | Idempotent |
|---|---|:---:|:---:|:---:|:---:|:---:|
| `POST` | `/api/auth/register` | No | None | Zod | N/A | No |
| `POST` | `/api/auth/login` | No | None | Partial | N/A | Yes |
| `POST` | `/api/auth/logout` | No | None | None | N/A | Yes |
| `POST` | `/api/auth/forgot-password` | No | None | None | N/A | No |
| `POST` | `/api/auth/verify-otp` | No | None | None | N/A | Yes |
| `POST` | `/api/auth/reset-password` | No | None | None | N/A | No |
| `GET` | `/api/user/dashboard` | Yes | RIDER | None | User scoped | Yes (Seeds DB) |
| `GET` | `/api/user/rides` | Yes | RIDER | Query param | User scoped | Yes |
| `POST` | `/api/user/rides` | Yes | RIDER | None | User scoped | No |
| `GET` | `/api/user/rides/[id]` | Yes | RIDER | None | User scoped | Yes |
| `PATCH`| `/api/user/rides/[id]` | Yes | RIDER | None | User scoped | No (Money leak) |
| `GET` | `/api/user/rides/[id]/stream` | Yes | RIDER | None | User scoped | Yes (Polls DB) |
| `GET` | `/api/user/rides/[id]/messages`| Yes | RIDER | None | User scoped | Yes (Seeds DB) |
| `POST` | `/api/user/rides/[id]/messages`| Yes | RIDER | None | User scoped | No (Bot reply) |
| `GET` | `/api/user/commutes` | Yes | RIDER | None | User scoped | Yes |
| `POST` | `/api/user/commutes` | Yes | RIDER | None | User scoped | No |
| `PATCH`| `/api/user/commutes` | Yes | RIDER | None | User scoped | Yes |
| `DELETE`| `/api/user/commutes`| Yes | RIDER | Query param | User scoped | Yes |
| `GET` | `/api/user/places` | Yes | RIDER | None | User scoped | Yes |
| `POST` | `/api/user/places` | Yes | RIDER | None | User scoped | No |
| `PATCH`| `/api/user/places` | Yes | RIDER | None | User scoped | Yes |
| `DELETE`| `/api/user/places`| Yes | RIDER | Query param | User scoped | Yes |
| `GET` | `/api/user/profile` | Yes | RIDER | None | User scoped | Yes |
| `PATCH`| `/api/user/profile` | Yes | RIDER | None | User scoped | Yes |
| `GET` | `/api/user/tickets` | Yes | RIDER | None | User scoped | Yes (Seeds DB) |
| `POST` | `/api/user/tickets` | Yes | RIDER | None | User scoped | No |
| `GET` | `/api/driver/dashboard` | Insecure | DRIVER | None | Insecure fallback | Yes |
| `GET` | `/api/driver/duty` | Insecure | DRIVER | None | Insecure fallback | Yes |
| `POST` | `/api/driver/duty` | Insecure | DRIVER | None | Insecure fallback | Yes |
| `GET` | `/api/driver/dispatches` | Insecure | DRIVER | None | Insecure fallback | Yes (No filter) |
| `POST` | `/api/driver/dispatches` | Insecure | DRIVER | None | Insecure fallback | No (Simulated) |
| `POST` | `/api/driver/rides` | Insecure | DRIVER | None | **None** | No (Race & Leak) |
| `GET` | `/api/driver/rides/[id]/messages`| Insecure | DRIVER | None | **None** | Yes (Seeds DB) |
| `POST` | `/api/driver/rides/[id]/messages`| Insecure | DRIVER | None | **None** | No (Bot reply) |
| `GET` | `/api/driver/earnings` | Insecure | DRIVER | None | Insecure fallback | Yes |
| `POST` | `/api/driver/earnings` | Insecure | DRIVER | None | Insecure fallback | No (No Tx) |
| `GET` | `/api/driver/incentives` | Insecure | DRIVER | None | Insecure fallback | Yes |
| `POST` | `/api/driver/incentives` | Insecure | DRIVER | None | Insecure fallback | No (Free Money) |
| `GET` | `/api/driver/ratings` | Insecure | DRIVER | None | Insecure fallback | Yes |
| `GET` | `/api/driver/trips` | Insecure | DRIVER | Query param | Insecure fallback | Yes |
| `GET` | `/api/driver/vehicle` | Insecure | DRIVER | None | Insecure fallback | Yes |
| `PATCH`| `/api/driver/vehicle` | Insecure | DRIVER | None | Insecure fallback | No (Backdoor) |
| `GET` | `/api/driver/settings` | Insecure | DRIVER | None | Insecure fallback | Yes |
| `POST` | `/api/driver/settings` | Insecure | DRIVER | None | Insecure fallback | No (Unsafe spread) |
| `GET` | `/api/driver/support` | Insecure | DRIVER | None | Insecure fallback | Yes |
| `POST` | `/api/driver/support` | Insecure | DRIVER | None | Insecure fallback | No |
| `GET` | `/api/places` | None | Public | Query param | N/A | Yes (OSM proxy) |
| `POST` | `/api/contact` | None | Public | None | N/A | No (Console only) |

---

## 2. Detailed Route Evaluations

### 1. `POST /api/auth/register`
- **File:** `src/app/api/auth/register/route.ts`
- **Authentication:** None.
- **Validation:** Uses `registerSchema` from `@/lib/validations/auth.ts`.
- **Finding:** Accepts `role` from the client body (`role: z.enum(["RIDER", "DRIVER"]).optional()`), enabling unauthorized self-assignment of the `DRIVER` role.
- **Severity:** **P0**

### 2. `POST /api/auth/login`
- **File:** `src/app/api/auth/login/route.ts`
- **Authentication:** Verifies email and password using bcrypt.
- **Validation:** Checks that `email` and `password` strings exist.
- **Finding:** Contains `if (role && (role === "DRIVER" || role === "RIDER")) { user.role = role; await user.save(); }`. Any client can escalate to `DRIVER` on login.
- **Severity:** **P0**

### 3. `POST /api/auth/forgot-password`
- **File:** `src/app/api/auth/forgot-password/route.ts`
- **Authentication:** None.
- **Finding:** Leaks plaintext `devOtp` in the response JSON if SMTP fails or is unconfigured. Allows user enumeration by returning a 404 if the email does not exist.
- **Severity:** **P0**

### 4. `POST /api/user/rides`
- **File:** `src/app/api/user/rides/route.ts`
- **Authentication:** `getSession()`.
- **Validation:** None. No Zod schema.
- **Finding:** Takes client-specified `fare`, `distance`, and `duration` directly from the request body. No server-side fare calculation or rate card validation. Ignores pet preferences and preferred drivers.
- **Severity:** **P0**

### 5. `PATCH /api/user/rides/[id]`
- **File:** `src/app/api/user/rides/[id]/route.ts`
- **Authentication:** `getSession()`.
- **Finding:**
  1. Allows riders to submit arbitrary tips that credit the driver’s wallet without debiting the rider or charging a payment card.
  2. Allows riders to advance ride status arbitrarily via `action === "advance_status"`.
- **Severity:** **P0**

### 6. `GET /api/user/rides/[id]/stream`
- **File:** `src/app/api/user/rides/[id]/stream/route.ts`
- **Authentication:** `getSession()`.
- **Finding:** Uses an unmanaged `setInterval` inside a Server-Sent Events stream to query MongoDB every 2.5 seconds per connected client. Does not scale horizontally and risks database connection exhaustion.
- **Severity:** **P1**

### 7. `POST /api/driver/rides`
- **File:** `src/app/api/driver/rides/route.ts`
- **Authentication:** Uses `getDriverUser()`, which falls back to Rajesh Kumar if unauthenticated.
- **Finding:**
  1. Accepts `"1234"` and `"4826"` as bypass OTPs. Empty OTP also passes.
  2. Lacks ride ownership validation (any driver can manipulate another driver’s ride).
  3. `action === "COMPLETE"` is non-idempotent; multiple calls repeatedly credit the driver's wallet.
  4. Cash ride completion credits the platform wallet in addition to cash collected.
- **Severity:** **P0**

### 8. `POST /api/driver/incentives`
- **File:** `src/app/api/driver/incentives/route.ts`
- **Authentication:** `getDriverUser()`.
- **Finding:** Credits ₹1,500 bonuses directly to the driver's wallet on every POST request without verifying quest progress or claim history.
- **Severity:** **P0**

### 9. `PATCH /api/driver/vehicle`
- **File:** `src/app/api/driver/vehicle/route.ts`
- **Authentication:** `getDriverUser()`.
- **Finding:** Contains a backdoor action (`action === "VERIFY_ALL"`) that allows drivers to self-approve all compliance documents.
- **Severity:** **P1**

### 10. `GET /api/places`
- **File:** `src/app/api/places/route.ts`
- **Authentication:** Public.
- **Finding:** Stores cache entries in an in-memory `Map` (blocks horizontal scaling). Executes up to 7 concurrent requests per query to OpenStreetMap Nominatim, risking an IP ban from OSM.
- **Severity:** **P1**
