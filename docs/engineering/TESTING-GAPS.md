# Testing Gap Analysis & Test Matrix — Bhavo Platform

**Auditor:** QA & Test Automation Engineer  
**Date:** October 2026  
**Status:** COMPLETE (Zero Coverage Baseline Identified)

---

## 1. Current Test Coverage Baseline

| Test Category | Present | Framework Installed | Coverage Percentage |
|---|:---:|:---:|:---:|
| **Unit Tests** | No | None | 0.0% |
| **Integration Tests** | No | None | 0.0% |
| **API Route Tests** | No | None | 0.0% |
| **End-to-End (E2E) Tests** | No | None | 0.0% |
| **Security Regression Tests** | No | None | 0.0% |
| **Load / Performance Tests** | No | None | 0.0% |

**Package.json Test Scripts:**  
There is **no test command** defined in `package.json`. The scripts section contains only:
```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "eslint"
}
```

---

## 2. Critical Test Matrices for Phase 1

### Matrix 1: Passenger / User Domain

| ID | Test Scenario | Type | Target Endpoint / Component | Assertion Criteria |
|---|---|---|---|---|
| **USR-01** | Rider signup creates `RIDER` role only | Integration | `POST /api/auth/register` | Role is strictly `"RIDER"`, even if body contains `{ role: "DRIVER" }`. |
| **USR-02** | Rider cannot self-promote to `DRIVER` on login | Integration | `POST /api/auth/login` | Passing `{ role: "DRIVER" }` does not update `User.role`. |
| **USR-03** | Server calculates ride fare independently | Unit/API | `POST /api/user/rides` | Fare matches rate card $(base + dist \times perKm)$; client `fare` is rejected. |
| **USR-04** | Pet-friendly flag persisted on Ride document | Integration | `POST /api/user/rides` | Created `Ride.petFriendly === true` when selected in UI. |
| **USR-05** | Active ride prevents second concurrent instant ride | Integration | `POST /api/user/rides` | Returns HTTP 409 Conflict if rider has ride in `SEARCHING` or `IN_PROGRESS`. |
| **USR-06** | Rider can cancel only non-completed rides | Integration | `PATCH /api/user/rides/[id]` | HTTP 400 when attempting to cancel `COMPLETED` or `CANCELLED` ride. |
| **USR-07** | Rider tipping debits rider wallet atomically | Integration | `PATCH /api/user/rides/[id]` | Rider wallet balance decrements by tip; driver wallet balance increments. |

### Matrix 2: Driver Domain

| ID | Test Scenario | Type | Target Endpoint / Component | Assertion Criteria |
|---|---|---|---|---|
| **DRV-01** | Unauthenticated request to driver API returns 401 | Security/API | `GET /api/driver/dashboard` | Returns HTTP 401 Unauthorized; does not return mock Rajesh Kumar. |
| **DRV-02** | Unverified driver cannot toggle online | Unit/API | `POST /api/driver/duty` | Returns HTTP 403 Forbidden with `DOCUMENTS_UNVERIFIED` code. |
| **DRV-03** | Driver receives only geographically eligible dispatches | Integration | `GET /api/driver/dispatches` | Rides beyond configured max radius or incompatible with vehicle are not returned. |
| **DRV-04** | Driver cannot start ride with invalid or bypass OTP | Security/API | `POST /api/driver/rides` | Codes `"1234"` and `"4826"` return HTTP 400 Invalid OTP. |
| **DRV-05** | Driver can only modify assigned rides (Ownership) | Security/API | `POST /api/driver/rides` | Driver B receives HTTP 403 when updating Driver A’s ride. |
| **DRV-06** | Ride completion is strictly idempotent | Concurrency | `POST /api/driver/rides` | Sending 5 concurrent `COMPLETE` calls credits driver wallet exactly once. |
| **DRV-07** | Driver cashout verifies sufficient balance | Integration | `POST /api/driver/earnings` | HTTP 400 when cashout amount exceeds current balance; balance never goes negative. |

### Matrix 3: Concurrency & Race Conditions

| ID | Test Scenario | Type | Tools | Assertion Criteria |
|---|---|---|---|---|
| **CNC-01** | Two drivers accepting the same ride simultaneously | Race Condition | Vitest / Promise.all | Exactly one driver receives HTTP 200; the second receives HTTP 409. |
| **CNC-02** | Concurrent driver incentive claims | Race Condition | Vitest / Promise.all | Sending 10 concurrent claim requests credits wallet exactly once. |
| **CNC-03** | Concurrent cashout and tip credits | Race Condition | Vitest / Mongo Tx | Final wallet balance equals exact arithmetic sum; no lost updates. |

---

## 3. Recommended Testing Stack for Phase 1

1. **Unit & API Testing:** **Vitest** + **Supertest** + **mongodb-memory-server** (fast in-memory execution without external database dependencies).
2. **End-to-End (E2E) Testing:** **Playwright** running automated headless browser flows for passenger booking, driver acceptance, and trip completion.
3. **CI Integration:** GitHub Actions runner executing `lint`, `typecheck`, `vitest`, and `playwright` on every pull request.
