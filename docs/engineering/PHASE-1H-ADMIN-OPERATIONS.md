# Bhavo Phase 1H: Admin Dashboard, Driver Verification & Operational Controls

## 1. Executive Summary

Phase 1H establishes Bhavo's administrative operations, compliance verification engine, and platform governance framework. The implementation enforces strict server-side authorization boundaries, deterministic document review lifecycles, safe account status mutators, read-only operational ride investigations, support ticket workflows, and an immutable, append-only administrative audit log.

All administrative routes and APIs are secured against privilege escalation, unauthenticated access, and cross-role leakage. Account status modifications enforce safety invariants—including preventing the immediate suspension of drivers with trips currently in progress—and automatically revoke active sessions across devices via `tokenVersion` increments.

---

## 2. Security & Authorization Architecture

### 2.1 Role-Based Access Control (RBAC)
- **Authority Boundary**: Platform access is strictly partitioned into three roles: `RIDER`, `DRIVER`, and `ADMIN`.
- **Public Registration Isolation**: Public registration (`/api/auth/register`) strictly forces the `RIDER` role. Administrative credentials cannot be created via public sign-up endpoints.
- **Middleware Boundary Protection (`src/proxy.ts`)**:
  - The `/admin` path prefix is protected at the edge middleware boundary.
  - Unauthenticated requests are redirected directly to `/login`.
  - Authenticated requests with non-`ADMIN` roles are redirected away from `/admin` to their respective dashboards (`/user/dashboard` or `/driver`).
- **Server-Side Verification (`src/lib/auth.ts`)**:
  - `requireAdmin(req?: Request)` enforces server-side role validation, verifying JWT validity, session status (`ACTIVE`), and `user.role === "ADMIN"`.
  - Requests failing authentication return `401 Unauthorized`.
  - Requests failing authorization return `403 Forbidden`.

### 2.2 Immediate Session Invalidation
- When an administrator modifies a user's status to `SUSPENDED` or `DISABLED`:
  1. The user's `tokenVersion` integer is atomically incremented (`$inc: { tokenVersion: 1 }`).
  2. Future API requests carrying previously issued JWTs are rejected immediately by `requireAuth` and `requireAdmin` with `401 TOKEN_REVOKED`.
  3. If the user is a driver, `isOnline` is forced to `false` and `dutyState` is reset to `OFFLINE`.

---

## 3. Administrative API Inventory

| Method | Endpoint | Description | Guard / Safety Controls |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/admin/overview` | Platform health metrics, backlog counters, online fleet telemetry | `requireAdmin` |
| `GET` | `/api/admin/drivers` | Paginated driver compliance directory with status and vehicle filters | `requireAdmin` |
| `GET` | `/api/admin/drivers/[id]` | Comprehensive driver inspection including documents and vehicle details | `requireAdmin` |
| `POST` | `/api/admin/drivers/[id]/documents` | Approve or reject compliance documents (license, RC, insurance, permit) | `requireAdmin`, mandatory reason $\ge 5$ chars, audit logging |
| `GET` | `/api/admin/users` | Paginated user accounts directory with role, status, and text search | `requireAdmin` |
| `POST` | `/api/admin/users/[id]/status` | Suspend, disable, or reactivate user accounts | `requireAdmin`, active ride conflict check, session invalidation |
| `GET` | `/api/admin/rides` | Read-only ride operations log with status and payment filters | `requireAdmin`, excludes raw location coordinates |
| `GET` | `/api/admin/rides/[id]` | Deep ride inspection with authoritative fare breakdown and timeline | `requireAdmin`, strictly read-only |
| `GET` | `/api/admin/support` | Paginated support ticket queue with priority and status filters | `requireAdmin` |
| `PATCH`| `/api/admin/support/[id]` | Update ticket status, triage priority, and internal resolution notes | `requireAdmin`, audit logging |
| `GET` | `/api/admin/audit-logs` | Immutable audit trail query with actor, action, and target filtering | `requireAdmin` |

---

## 4. Operational Invariants & Data Safety

### 4.1 Driver Document Review Lifecycle
- Document types supported: `drivingLicense`, `vehicleRc`, `vehicleInsurance`, `commercialPermit`, `policeVerification`.
- State transitions: `PENDING` $\rightarrow$ `APPROVED` or `REJECTED`.
- When an individual document is approved or rejected:
  - The document's `status`, `rejectionReason`, `verifiedAt`, and `verifiedBy` fields are updated.
  - The driver's overall `driverProfile.isVerified` flag is recomputed atomically:
    - If **all** required documents (`drivingLicense`, `vehicleRc`, `vehicleInsurance`) are `APPROVED`, `isVerified` is marked `true`.
    - If any required document is `REJECTED` or still `PENDING`, `isVerified` is set to `false`.

### 4.2 Active Ride Suspension Safety Invariant
- Suspending a driver who is currently executing a trip (`ACCEPTED`, `ARRIVED`, or `IN_PROGRESS`) would leave passengers stranded and introduce state machine race conditions.
- **Invariant**: The backend queries for any active rides assigned to the driver before applying `SUSPENDED` or `DISABLED`.
- If an active trip exists, the mutation is rejected with `409 Conflict` and an explanatory message.

### 4.3 Immutable Administrative Audit Logging
- **Model**: `src/models/AdminAuditLog.ts`
- **Fields**:
  - `actorId`, `actorEmail`, `actorRole`: Identification of the administrative operator.
  - `action`: Specific administrative action (e.g., `DOCUMENT_APPROVE`, `USER_SUSPEND`, `TICKET_UPDATE`).
  - `targetType`: Entity class (`USER`, `DRIVER`, `RIDE`, `SUPPORT_TICKET`, `SYSTEM`).
  - `targetId`: Unique ID of the affected resource.
  - `details`: Metadata snapshot of the before/after state and reasoning.
  - `ipAddress`, `userAgent`: Network telemetry.
- **Automated Credential Redaction (`src/lib/adminAudit.ts`)**:
  - All metadata objects logged to `AdminAuditLog` are recursively sanitized against sensitive keys (`password`, `token`, `otp`, `secret`, `authorization`, `creditCard`).

---

## 5. Administrative Frontend Interface

The administrative portal is located under `/admin` and styled with Bhavo's emerald/teal design system:

1. **Platform Overview (`/admin`)**: Real-time counter widgets for verification backlogs, active trips, fleet telemetry (online vs on-trip drivers), and high-priority support queues.
2. **Driver Verification (`/admin/drivers` & `/admin/drivers/[id]`)**: Full compliance review workspace featuring document previews, status tags, and approval/rejection modals with mandatory feedback.
3. **User Accounts (`/admin/users`)**: Directory of riders and drivers with search, status filtering, and an account suspension dialog enforcing mandatory reasoning.
4. **Ride Operations (`/admin/rides` & `/admin/rides/[id]`)**: Read-only trip logs and authoritative pricing audit details (base fare, distance rate, pet-friendly surcharge, settlement status).
5. **Support Ticket Queue (`/admin/support`)**: Helpdesk queue with urgency tags, triage priority selectors, and internal resolution note tracking.
6. **Audit Trail Viewer (`/admin/audit-logs`)**: Complete historical log viewer with JSON detail inspection modals and actor attribution.

---

## 6. Verification and Validation Results

All checks passed with zero errors:

| Check | Tool / Command | Result |
| :--- | :--- | :--- |
| **Unit & Integration Tests** | `npm test` | **247 / 247 passed** across 47 suites (including 27 new tests in `tests/admin-operations.test.ts`) |
| **TypeScript Compilation** | `npx tsc --noEmit` | **0 errors** |
| **Static Code Analysis** | `npm run lint` | **0 errors, 0 warnings** |
| **Production Build** | `npm run build` | **Successfully compiled** all 49 routes with Next.js Turbopack |
