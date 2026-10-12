# Bhavo Phase 1A Hardening: Corrective Pass & Follow-up Report

## 1. Executive Summary
Following the completion of the baseline Phase 1A audit, a narrowly scoped corrective pass was executed to resolve the three remaining security issues before approving Phase 1A:
1. **Issue 1 — Stale JWT / Token Revocation**: Prevented suspended accounts or stale sessions from authenticating by introducing an authoritative database `tokenVersion` check and `status: "ACTIVE" | "SUSPENDED" | "DISABLED"` enforcement in `requireAuth()`.
2. **Issue 2 — Login Rate Limiting**: Implemented IP + Account brute-force rate limiting via an extensible `IRateLimiter` abstraction (`InMemoryRateLimiter` safe for single instance, ready for Redis multi-instance) with generic authentication failure responses to eliminate account enumeration.
3. **Issue 3 — Runtime Driver Dispatch Simulation**: Isolated `POST /api/driver/dispatches` behind a strict environment guard (`NODE_ENV === "production"` rejects with 403 `SIMULATION_DISABLED`), ensuring fake/demo rides cannot be injected into the production database while preserving legitimate dispatch polling (`GET /api/driver/dispatches`).

---

## 2. Technical Implementation Details

### 2.1 Issue 1: JWT Revocation & Session Invalidation Approach
- **Database Schema (`src/models/User.ts`)**:
  - Added `status: { type: String, enum: ["ACTIVE", "SUSPENDED", "DISABLED"], default: "ACTIVE" }`.
  - Added `tokenVersion: { type: Number, default: 0 }`.
- **JWT Embedding (`src/lib/auth.ts`)**:
  - `signAuthToken()` embeds the current `tokenVersion` into the JWT claims payload.
- **Authoritative Validation (`requireAuth()`)**:
  - Protected routes fetch the live user record from MongoDB.
  - If `user.status === "SUSPENDED" || user.status === "DISABLED"`, authentication fails immediately with 403 `ACCOUNT_SUSPENDED`.
  - If `tokenVersionInJwt !== user.tokenVersion`, authentication fails immediately with 401 `TOKEN_REVOKED`.
- **Revocation Triggering**:
  - `revokeUserSessions(userId)` increments `user.tokenVersion`, immediately invalidating all active tokens across devices without requiring Redis.
  - `POST /api/auth/reset-password` increments `user.tokenVersion`, invalidating all sessions across all devices upon password reset.

### 2.2 Issue 2: Login Rate-Limiting Approach
- **Abstraction (`src/lib/rateLimit.ts`)**:
  - Defined decoupled `IRateLimiter` interface (`check`, `recordFailure`, `reset`).
  - Implemented `InMemoryRateLimiter` supporting max attempts (default 5) and sliding window/cooldown (default 15 minutes).
  - Current status: **SAFE FOR SINGLE INSTANCE**. Designed to drop in a Redis-backed adapter for **MULTI-INSTANCE** without changing route handlers or API contracts.
- **Key Formulation (`getLoginRateLimitKey(ip, email)`)**:
  - Combines sanitized client IP and lowercase normalized email: `login:<ip>:<email>`.
  - Strict privacy & security guarantee: Passwords, tokens, or plaintext credentials are never stored in rate-limit keys or state records.
- **Account Enumeration Prevention**:
  - `POST /api/auth/login` returns the identical generic message `{ status: "error", message: "Invalid email or password" }` with HTTP 401 for both non-existent accounts and invalid passwords.
  - Failure counters record against `login:<ip>:<email>` regardless of whether the email exists.
  - When the threshold is exceeded, HTTP 429 `TOO_MANY_REQUESTS` is returned with a `Retry-After` header.
- **Legitimate Success**:
  - Successful authentication clears the failure counter for that IP + account pair.

### 2.3 Issue 3: Dispatch Simulation Isolation
- **Isolation Mechanism (`src/app/api/driver/dispatches/route.ts`)**:
  - Added strict environment check in `POST /api/driver/dispatches`:
    ```typescript
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        {
          status: "error",
          code: "SIMULATION_DISABLED",
          message: "Simulation dispatch endpoint is disabled in production environment.",
        },
        { status: 403 }
      );
    }
    ```
- **Hardening Micro-Correction (Zero Override in Production)**:
  - Removed `ALLOW_DISPATCH_SIMULATION !== "true"` override mechanism from production runtime code.
  - Simulation is development/test only (`development` or `test` environments).
  - Production can NEVER enable the simulation endpoint under any environment variable setting.
- **Driver Dispatch Polling Preserved**:
  - `GET /api/driver/dispatches` retrieves legitimate pending rides in `SEARCHING` state from MongoDB without creating simulated test rides.
- **Access Control Enforced**:
  - `getDriverUser(req)` runs first, ensuring unauthorized or unauthenticated callers are rejected with 401/403 before any simulation logic can evaluate.

---

## 3. Files Changed
1. `src/models/User.ts`
   - Added `status` (`ACTIVE`, `SUSPENDED`, `DISABLED`) and `tokenVersion` (Number).
2. `src/lib/auth.ts`
   - Added `tokenVersion` to `SessionPayload`.
   - Updated `signAuthToken()` to include `tokenVersion`.
   - Updated `requireAuth()` to enforce `status` and `tokenVersion` checks.
   - Added `revokeUserSessions(userId)` utility.
3. `src/lib/rateLimit.ts` (New File)
   - Created `IRateLimiter` interface, `InMemoryRateLimiter`, `loginRateLimiter` singleton, and `getLoginRateLimitKey()`.
4. `src/app/api/auth/login/route.ts`
   - Integrated `loginRateLimiter.check()` and `recordFailure()`.
   - Enforced generic error responses to prevent account enumeration.
   - Enforced account status check (`SUSPENDED`/`DISABLED`).
   - Embedded `user.tokenVersion` in JWT.
   - Reset rate limit on successful authentication.
5. `src/app/api/auth/reset-password/route.ts`
   - Incremented `user.tokenVersion` on password reset to immediately invalidate all existing sessions.
6. `src/app/api/driver/dispatches/route.ts`
   - Added environment isolation guard blocking simulation creation when `NODE_ENV === "production"`.
7. `tests/token-revocation.test.ts` (New File)
   - 5 automated tests for tokenVersion matching, token revocation, new token validity, and suspended/disabled account blocking.
8. `tests/login-rate-limit.test.ts` (New File)
   - 6 automated tests for attempt threshold blocking, cooldown expiry, successful reset, account isolation, generic enumeration prevention, and credential-free state.
9. `tests/dispatch-isolation.test.ts` (New File)
   - 6 automated tests for production blocking (with and without override), legitimate GET dispatch polling, dev/test execution, and unauthorized access rejection.

---

## 4. Tests Added & Full Suite Matrix
Total automated test suite now comprises **50 tests across 9 test suites**:

### Token Revocation (`tests/token-revocation.test.ts`)
- Scenario 1: Existing valid token with matching tokenVersion succeeds authentication.
- Scenario 2: Token with incorrect/mismatched tokenVersion is rejected with TOKEN_REVOKED.
- Scenario 3: User tokenVersion increment immediately invalidates previously issued token.
- Scenario 4: Newly issued token with updated tokenVersion succeeds authentication.
- Scenario 5: Suspended/disabled user cannot access protected APIs even with a cryptographically valid token.

### Login Rate Limiting (`tests/login-rate-limit.test.ts`)
- Scenario 1: Repeated failed attempts trigger rate limiting (blocks after threshold).
- Scenario 2: Rate limiting block eventually expires after the cooldown window.
- Scenario 3: Valid login works normally before threshold is reached and resets counter.
- Scenario 4: Different users are not incorrectly blocked because of one user's failure pattern.
- Scenario 5: Generic authentication error responses prevent account enumeration.
- Scenario 6: Rate-limit key and state strictly omit passwords, secrets, and JWT tokens.

### Dispatch Simulation Isolation (`tests/dispatch-isolation.test.ts`)
- Scenario 1: NODE_ENV=production with ALLOW_DISPATCH_SIMULATION unset returns 403 SIMULATION_DISABLED.
- Scenario 2: NODE_ENV=production with ALLOW_DISPATCH_SIMULATION=true STILL returns 403 SIMULATION_DISABLED (no override).
- Scenario 3: NODE_ENV=development allows simulation ride generation for verified driver.
- Scenario 4: NODE_ENV=test allows simulation ride generation for verified driver.
- Scenario 5: Normal driver dispatch GET functionality continues to work without creating rides.
- Scenario 6: Unauthorized or non-driver callers remain blocked from triggering simulation.

### Baseline Phase 1A Tests (Maintained & Passing)
- `tests/auth.test.ts`: Scenarios 1–8 (JWT signing, invalid password, tampered token, expired token, malformed token, missing token, fail-fast secret, suspended status).
- `tests/role-security.test.ts`: Scenarios 9–15 (Registration RIDER enforcement, login role tampering, RIDER->DRIVER forbidden, DRIVER->ADMIN forbidden, unauthenticated 401).
- `tests/demo-bypass.test.ts`: Scenarios 16–18 (?demo=true bypass removal, arbitrary query params, zero demo driver fallbacks).
- `tests/driver-security.test.ts`: Scenarios 19–22 (DRIVER allowed, RIDER forbidden 403, driverId session binding, no DB demo creation).
- `tests/otp-security.test.ts`: Scenarios 23–29 (Universal OTP 1234/4826 rejection, empty OTP rejection, single-use, devOtp removal, log masking).
- `tests/session-cookie.test.ts`: Scenarios 30–33 (httpOnly: true, secure in production, SameSite: lax, maxAge: 7d).

---

## 5. Verification Results
- **Automated Tests**: 50 passed, 0 failed, 9 test suites.
- **TypeScript Static Typecheck (`npx tsc --noEmit`)**: Pass (0 errors).
- **ESLint (`npm run lint`)**: Pass (0 errors, 0 warnings).
- **Production Build (`npm run build`)**: Pass (Turbopack, 44 routes compiled).

---

## 6. Remaining Deferred Issues
The following findings are strictly outside the Phase 1A authentication hardening scope and are scheduled for subsequent roadmap phases:

| Severity | File | Problem | Recommended Future Phase |
| :--- | :--- | :--- | :--- |
| High | `src/app/api/driver/rides/route.ts` | State machine race condition: multiple drivers could concurrently accept the same ride without distributed locking | Phase 1B (Ride State Machine & Concurrency) |
| High | `src/app/api/user/rides/route.ts` | Concurrent ride booking race condition; absence of atomic ride state transitions | Phase 1B (Ride State Machine & Concurrency) |
| Medium | `src/lib/rateLimit.ts` | `InMemoryRateLimiter` is single-instance; needs Redis-backed adapter for horizontally scaled clusters | Phase 1C / Phase 4 (Redis & Distributed Infrastructure) |
| Medium | `src/app/api/auth/forgot-password/route.ts` | Simulated email provider when SMTP is unconfigured; requires production SMS/WhatsApp gateway (Twilio/Gupshup) | Phase 2 (Communications & External Integrations) |
| Low | `src/components/auth/signup/SignUp.tsx` | Role toggle on signup form is cosmetically present (server strictly forces RIDER); dedicated driver onboarding wizard required | Phase 2 (Driver Application & Onboarding Workflow) |
