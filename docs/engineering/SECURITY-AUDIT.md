# Security Audit & Threat Assessment — Bhavo Platform

**Auditor:** Senior Security Engineer & DevOps Engineer  
**Date:** October 2026  
**Status:** COMPLETE  
**Standard:** OWASP Top 10 API Security Risks (2023)

---

## 1. Vulnerability Summary Matrix

| ID | Title | Severity | CWE | OWASP API | Affected Files |
|---|---|:---:|---|---|---|
| **SEC-01** | Proxy Auth Bypass via `?demo=true` | **P0** | CWE-288 | API2: Broken Authentication | `src/proxy.ts:13-15` |
| **SEC-02** | Hardcoded Fallback JWT Secret | **P0** | CWE-798 | API2: Broken Authentication | `src/proxy.ts:6`, `src/lib/auth.ts:5`, `src/app/api/auth/login/route.ts:8`, `src/app/api/user/profile/route.ts:9` |
| **SEC-03** | Insecure Driver Fallback (Impersonation) | **P0** | CWE-306 | API1: Broken Object Level Auth | `src/lib/driverAuth.ts:77-146` |
| **SEC-04** | Client-Controlled Privilege Escalation | **P0** | CWE-269 | API5: Broken Function Level Auth | `src/app/api/auth/register/route.ts:42`, `src/app/api/auth/login/route.ts:39-42` |
| **SEC-05** | Plaintext OTP Leakage in HTTP Response | **P0** | CWE-200 | API3: Broken Object Property Level Auth | `src/app/api/auth/forgot-password/route.ts:76-84` |
| **SEC-06** | Hardcoded Ride OTP Bypass Codes | **P0** | CWE-287 | API2: Broken Authentication | `src/app/api/driver/rides/route.ts:75`, `src/hooks/driver/useDriverStore.ts:511` |
| **SEC-07** | Client-Controlled Ride Fare Tampering | **P0** | CWE-472 | API6: Unrestricted Resource Consumption | `src/app/api/user/rides/route.ts:115`, `src/components/user/book-ride/BookRide.tsx:513` |
| **SEC-08** | Arbitrary Driver Tipping Without Rider Debit | **P0** | CWE-639 | API1: Broken Object Level Auth | `src/app/api/user/rides/[id]/route.ts:78-88` |
| **SEC-09** | Unrestricted Wallet Incentive Credit (Free Money) | **P0** | CWE-837 | API4: Unrestricted Resource Consumption | `src/app/api/driver/incentives/route.ts:98-106` |
| **SEC-10** | API Routes Excluded from Proxy Matcher | **P1** | CWE-284 | API5: Broken Function Level Auth | `src/proxy.ts:53` |
| **SEC-11** | Missing Ride Ownership Checks (IDOR / BOLA) | **P1** | CWE-639 | API1: Broken Object Level Auth | `src/app/api/driver/rides/route.ts:26-126` |
| **SEC-12** | Driver Compliance Self-Approval Backdoor | **P1** | CWE-285 | API5: Broken Function Level Auth | `src/app/api/driver/vehicle/route.ts:68-81` |
| **SEC-13** | Lack of Rate Limiting on OTP Endpoints | **P2** | CWE-307 | API2: Broken Authentication | `src/app/api/auth/verify-otp/route.ts`, `src/app/api/auth/reset-password/route.ts` |
| **SEC-14** | Plaintext Reset OTP Database Storage | **P2** | CWE-256 | API2: Broken Authentication | `src/models/User.ts:66-73` |

---

## 2. In-Depth Vulnerability Analysis

---

### SEC-01: Proxy Authentication Bypass via Query Parameter
- **Severity:** **P0** (Critical)
- **File:** `src/proxy.ts:13-15`
- **Code Snippet:**
  ```typescript
  if (req.nextUrl.pathname.startsWith("/user") || req.nextUrl.pathname.startsWith("/driver")) {
    if (req.nextUrl.searchParams.get("demo") === "true") {
      return NextResponse.next();
    }
  ```
- **Vulnerability Explanation:**  
  The proxy middleware explicitly checks if the query parameter `demo=true` is present in the URL. If so, it returns `NextResponse.next()`, completely bypassing token validation, JWT verification, and role checks.
- **Exploit Scenario:**  
  An unauthenticated attacker opens `https://bhavo.in/user/dashboard?demo=true` or `https://bhavo.in/driver?demo=true` in any browser. The proxy admits the attacker without requiring authentication.
- **Impact:**  
  Total bypass of frontend routing access controls.
- **Remediation:**  
  Remove lines 13-15 entirely. Never permit query-parameter-based auth bypass in production proxy/middleware code.

---

### SEC-02: Hardcoded Fallback JWT Secret
- **Severity:** **P0** (Critical)
- **Files:**
  - `src/proxy.ts:6`
  - `src/lib/auth.ts:5`
  - `src/app/api/auth/login/route.ts:8`
  - `src/app/api/user/profile/route.ts:9`
- **Code Snippet:**
  ```typescript
  const JWT_SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET || process.env.AUTH_SECRET || "fallback_secret_please_change_me_in_production"
  );
  ```
- **Vulnerability Explanation:**  
  If the `JWT_SECRET` and `AUTH_SECRET` environment variables are omitted or misconfigured, the application falls back to a publicly known static string.
- **Exploit Scenario:**  
  An attacker signs their own JWT containing `{ id: "<any_user_id>", email: "victim@example.com", role: "ADMIN" }` using the known secret `"fallback_secret_please_change_me_in_production"` with algorithm HS256, and sets it in the `auth_token` cookie.
- **Impact:**  
  Complete account takeover, identity forgery, and arbitrary privilege escalation.
- **Remediation:**  
  Remove the fallback string. Require that `JWT_SECRET` be defined; fail startup immediately if it is absent:
  ```typescript
  if (!process.env.JWT_SECRET) {
    throw new Error("FATAL: JWT_SECRET environment variable is missing.");
  }
  ```

---

### SEC-03: Insecure Driver Fallback & Anonymous Impersonation
- **Severity:** **P0** (Critical)
- **File:** `src/lib/driverAuth.ts:77-146`
- **Code Snippet:**
  ```typescript
  export async function getDriverUser() {
    await dbConnect();
    const session = await getSession();
    let user = null;
    if (session?.email) {
      user = await User.findOne({ email: session.email });
    }
    ...
    if (user && user.role === "DRIVER") {
      ...
      return user;
    } else {
      // Dedicated driver account in MongoDB
      const defaultEmail = "rajesh.driver@bhavo.in";
      let defaultDriver = await User.findOne({ email: defaultEmail });
      if (!defaultDriver) {
        defaultDriver = await User.create({
          name: "Rajesh Kumar",
          email: defaultEmail,
          role: "DRIVER",
          ...
        });
      }
      return defaultDriver;
    }
  }
  ```
- **Vulnerability Explanation:**  
  When an unauthenticated user calls any driver endpoint (`/api/driver/dashboard`, `/api/driver/rides`, `/api/driver/duty`, `/api/driver/earnings`), `getSession()` returns `null`. Instead of rejecting the request with an HTTP 401 Unauthorized, `getDriverUser()` falls back to Rajesh Kumar (`rajesh.driver@bhavo.in`), creating the account if it does not exist.
- **Exploit Scenario:**  
  An anonymous script sends `POST /api/driver/earnings` with `{ amount: 4250 }`. The server executes the cashout on Rajesh Kumar’s balance. An anonymous caller can also accept, start, or cancel rides on behalf of Rajesh Kumar.
- **Impact:**  
  Unauthenticated impersonation, financial manipulation, and persistent data tampering.
- **Remediation:**  
  Replace `getDriverUser()` with a strict guard:
  ```typescript
  export async function getDriverUser() {
    const session = await getSession();
    if (!session?.email || session.role !== "DRIVER") {
      throw new AuthError("Unauthorized: Driver access required", 401);
    }
    const driver = await User.findOne({ email: session.email, role: "DRIVER" });
    if (!driver) {
      throw new AuthError("Driver account not found", 404);
    }
    return driver;
  }
  ```

---

### SEC-04: Client-Controlled Privilege Escalation
- **Severity:** **P0** (Critical)
- **Files:**
  - `src/lib/validations/auth.ts:7`
  - `src/app/api/auth/register/route.ts:42`
  - `src/app/api/auth/login/route.ts:39-42`
- **Code Snippet (`auth/login/route.ts:39-42`):**
  ```typescript
  // If user logged in selecting a specific role (e.g. "DRIVER" or "RIDER"), activate that role
  if (role && (role === "DRIVER" || role === "RIDER")) {
    user.role = role;
    await user.save();
  }
  ```
- **Vulnerability Explanation:**  
  The user registration schema permits the client to specify `role: "DRIVER"`. Furthermore, the login endpoint actively updates `user.role` in MongoDB to whichever role the client specifies in the request body.
- **Exploit Scenario:**  
  A normal passenger signs up, sends `{ "role": "DRIVER" }` during login, and the backend updates their account to `DRIVER` in MongoDB and issues a `DRIVER` JWT.
- **Impact:**  
  Direct violation of platform rule: "A user must NOT be able to promote themselves to DRIVER or ADMIN by modifying a request. Driver activation should follow: application -> verification -> approval -> DRIVER role."
- **Remediation:**  
  Remove the `role` field from `registerSchema` and `loginSchema`. All signups must strictly default to `"RIDER"`. Role updates must be restricted to internal admin verification workflows.

---

### SEC-05: Plaintext OTP Leakage in HTTP Response
- **Severity:** **P0** (Critical)
- **File:** `src/app/api/auth/forgot-password/route.ts:76-84`
- **Code Snippet:**
  ```typescript
  // Fallback if SMTP is not configured
  return NextResponse.json(
    {
      status: "success",
      message: `OTP generated for ${user.email}. (Email server not configured in .env)`,
      delivery: "mock",
      devOtp: otp,
    },
    { status: 200 }
  );
  ```
- **Vulnerability Explanation:**  
  If the SMTP server is down or credentials are not configured, the endpoint returns the generated 6-digit OTP directly inside the JSON response.
- **Exploit Scenario:**  
  An attacker submits `POST /api/auth/forgot-password` with `{ "email": "victim@example.com" }`. The server responds with `{ "devOtp": "654321" }`. The attacker then submits `POST /api/auth/reset-password` with `654321` and a new password, taking full control of the victim's account.
- **Impact:**  
  Zero-click account takeover for any registered email.
- **Remediation:**  
  Remove `devOtp` from the response payload immediately. If email fails, return an HTTP 500 error indicating delivery failure without disclosing the secret token.

---

### SEC-06: Universal Hardcoded Ride OTP Bypass Codes
- **Severity:** **P0** (Critical)
- **Files:**
  - `src/app/api/driver/rides/route.ts:75`
  - `src/hooks/driver/useDriverStore.ts:511`
- **Code Snippet (`driver/rides/route.ts:73-77`):**
  ```typescript
  const cleanOtp = String(otp || "").trim();
  // Allow actual ride OTP, or universal test bypass codes
  if (ride.otp && cleanOtp && ride.otp !== cleanOtp && cleanOtp !== "1234" && cleanOtp !== "4826") {
    return NextResponse.json({ status: "error", message: "Invalid OTP code" }, { status: 400 });
  }
  ```
- **Vulnerability Explanation:**  
  1. The server accepts `"1234"` and `"4826"` as valid OTPs for any ride.  
  2. If `otp` is empty (`cleanOtp === ""`), `cleanOtp` is falsy, causing the entire `if` condition to evaluate to `false`, allowing an empty OTP to pass.
- **Exploit Scenario:**  
  A rogue driver accepts a ride and starts the ride without passenger authorization by entering `"1234"`, `"4826"`, or submitting an empty OTP.
- **Impact:**  
  Physical safety hazard: passenger cannot verify driver identity; unauthorized ride starts; fraudulent billing.
- **Remediation:**  
  Enforce exact cryptographic comparison:
  ```typescript
  if (!cleanOtp || cleanOtp !== ride.otp) {
    return NextResponse.json({ status: "error", message: "Invalid verification code" }, { status: 400 });
  }
  ```

---

### SEC-07: Client-Controlled Ride Fare Tampering
- **Severity:** **P0** (Critical Financial)
- **Files:**
  - `src/app/api/user/rides/route.ts:115`
  - `src/components/user/book-ride/BookRide.tsx:513`
- **Code Snippet:**
  ```typescript
  const { pickup, dropoff, vehicleType = "Cab Premium", fare = 350, ... } = body;
  ...
  fare: Number(typeof fare === "string" ? fare.replace(/[^0-9.]/g, "") : fare) || 250,
  ```
- **Vulnerability Explanation:**  
  The server assigns the ride fare directly from the client’s request payload. No server-side pricing algorithm or distance re-calculation takes place.
- **Exploit Scenario:**  
  An attacker books an airport trip from Noida to Delhi T3 (35 km) using a tool like Postman or cURL, passing `{ "fare": 1 }`. The server creates the ride with `fare: 1`. Upon completion, the passenger pays ₹1.
- **Impact:**  
  Direct financial loss and platform revenue depletion.
- **Remediation:**  
  The server must calculate the fare independently based on verified distance and vehicle rate cards:
  ```typescript
  const calculatedFare = await pricingService.calculateFare({
    pickup: pickup.coordinates,
    dropoff: dropoff.coordinates,
    vehicleType,
  });
  ```

---

### SEC-08: Arbitrary Driver Tipping Without Rider Debit
- **Severity:** **P0** (Critical Financial)
- **File:** `src/app/api/user/rides/[id]/route.ts:78-88`
- **Code Snippet:**
  ```typescript
  if (typeof tip === "number") {
    ride.tip = tip;
    // Credit driver with tip if tip > 0
    if (tip > 0 && ride.driver) {
      const driverUser = await User.findById(ride.driver);
      if (driverUser) {
        driverUser.walletBalance = (driverUser.walletBalance || 0) + tip;
        await driverUser.save();
      }
    }
  }
  ```
- **Vulnerability Explanation:**  
  The endpoint allows a rider to rate a ride and supply a tip. The specified tip is credited to the driver’s wallet, but no corresponding deduction occurs on the rider's wallet or payment gateway. Furthermore, the endpoint can be called repeatedly without checking if the ride has already been tipped.
- **Exploit Scenario:**  
  A colluding rider and driver create a trip. The rider calls `PATCH /api/user/rides/[id]` with `action: "rate_trip"` and `tip: 50000` 100 times. The driver’s wallet balance increases by ₹5,000,000 without the rider spending anything. The driver then requests cashout.
- **Impact:**  
  Unlimited money creation out of thin air.
- **Remediation:**  
  Tips must be processed through an escrow/payment gateway charge or deducted atomically from the rider’s wallet within a database transaction before crediting the driver.

---

### SEC-09: Unrestricted Wallet Incentive Credit (Free Money)
- **Severity:** **P0** (Critical Financial)
- **File:** `src/app/api/driver/incentives/route.ts:98-106`
- **Code Snippet:**
  ```typescript
  export async function POST(req: Request) {
    ...
    const bonusMap: Record<string, number> = {
      "quest-daily": 350,
      "quest-weekend": 1500,
    };
    const bonus = bonusMap[questId] || 200;
    user.walletBalance = (user.walletBalance || 0) + bonus;
    await user.save();
    ...
  }
  ```
- **Vulnerability Explanation:**  
  The driver incentive claim endpoint credits bonuses without checking whether the driver actually met quest criteria or whether the quest was already claimed.
- **Exploit Scenario:**  
  A driver runs an automated script sending `POST /api/driver/incentives` with `{ "questId": "quest-weekend" }` every 100 milliseconds. Within minutes, the driver accumulates millions in wallet balance.
- **Impact:**  
  Direct financial loss.
- **Remediation:**  
  Incentive claims must verify completion criteria server-side and log an immutable claim record to prevent duplicate payouts.

---

### SEC-10: API Routes Excluded from Proxy Matcher
- **Severity:** **P1** (High)
- **File:** `src/proxy.ts:53`
- **Code Snippet:**
  ```typescript
  export const config = {
    matcher: [
      "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
    ],
  };
  ```
- **Vulnerability Explanation:**  
  The proxy matcher regex excludes all `/api/*` routes. As a result, `src/proxy.ts` does not execute for API requests; authentication must be enforced individually within each route handler. However, as noted in SEC-03, driver route handlers fall back to an unauthenticated mock driver rather than returning 401.
- **Impact:**  
  Inconsistent route protection and unintentional exposure of sensitive endpoints.
- **Remediation:**  
  Include `/api/*` in the proxy matcher, with explicit exceptions only for public routes (`/api/auth/login`, `/api/auth/register`, `/api/contact`).

---

### SEC-11: Missing Ride Ownership Checks (IDOR / BOLA)
- **Severity:** **P1** (High)
- **File:** `src/app/api/driver/rides/route.ts:26-126`
- **Vulnerability Explanation:**  
  In `POST /api/driver/rides`, actions (`ARRIVED`, `START`, `COMPLETE`, `CANCEL`) query `Ride.findById(rideId)` without verifying that `ride.driver.equals(driverUser._id)`.
- **Exploit Scenario:**  
  Driver A sends `action: "CANCEL"` for Driver B’s ride ID. The ride is cancelled without Driver B’s consent.
- **Impact:**  
  Unauthorized state tampering of rides across drivers.
- **Remediation:**  
  Enforce ownership verification:
  ```typescript
  if (!ride.driver || !ride.driver.equals(driverUser._id)) {
    return NextResponse.json({ status: "error", message: "Forbidden: Not your assigned ride" }, { status: 403 });
  }
  ```

---

### SEC-12: Driver Compliance Self-Approval Backdoor
- **Severity:** **P1** (High)
- **File:** `src/app/api/driver/vehicle/route.ts:68-81`
- **Code Snippet:**
  ```typescript
  if (action === "VERIFY_ALL") {
    user.driverDocuments = user.driverDocuments.map((doc: any) => ({
      ...doc,
      status: "VERIFIED",
    }));
    user.driverVehicle.documentsVerified = true;
  }
  ```
- **Vulnerability Explanation:**  
  Drivers can send a PATCH request with `{ "action": "VERIFY_ALL" }` to instantly mark all compliance documents as verified.
- **Impact:**  
  Unvetted drivers with invalid licenses, missing insurance, or no background checks can operate commercially on the platform.
- **Remediation:**  
  Remove the `VERIFY_ALL` simulation action. Document status must only be updated by authorized compliance admins.
