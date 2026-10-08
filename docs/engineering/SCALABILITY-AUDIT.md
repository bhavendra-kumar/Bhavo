# Scalability & Concurrency Audit — Bhavo Platform

**Auditor:** Senior DevOps & Backend Systems Engineer  
**Date:** October 2026  
**Status:** COMPLETE

---

## 1. Horizontal Scalability Assessment

### Target Production Topology
```
                          Load Balancer
                                │
             ┌──────────────────┼──────────────────┐
             │                  │                  │
        [ App #1 ]         [ App #2 ]         [ App #3 ]
             │                  │                  │
             └──────────────────┼──────────────────┘
                                │
                    ┌───────────┴───────────┐
                    │                       │
             [ Redis Cluster ]      [ MongoDB Replica Set ]
             - Pub/Sub & Queues     - Primary & Secondaries
             - Distributed Cache
```

### Classification of State & Mechanisms

| Component / Pattern | Location | Classification | Rationale & Remediation |
|---|---|:---:|---|
| In-memory `queryCache` | `src/app/api/places/route.ts:31` | **BLOCKS HORIZONTAL SCALING** | Process-local `Map` cache. State is not shared across instances. Must use distributed Redis caching. |
| Server-side SSE `setInterval` | `src/app/api/user/rides/[id]/stream/route.ts:38` | **BLOCKS HORIZONTAL SCALING** | Runs uncoordinated Node.js timers polling MongoDB directly. Must be replaced with Redis Pub/Sub event broadcasting. |
| Process-bound chat `setTimeout` | `src/app/api/driver/rides/[id]/messages/route.ts:96` | **BLOCKS HORIZONTAL SCALING** | Relies on process-local timers to simulate passenger replies. Fails across instances or upon pod restarts. |
| Global Mongoose Connection Cache | `src/lib/mongoose.ts:17` | **SAFE** | Uses `global.mongoose` connection caching across hot reloads in development; standard Next.js pattern. |
| Stateless JWT Authentication | `src/lib/auth.ts:21` | **SAFE** | Decodes signed JWT from cookies without server-side in-memory session lookups. |
| Dual-Polling Loop | `useDashboardStore.ts:235` + `stream/route.ts:38` | **NEEDS REFACTOR** | Client polls HTTP every 1.5s while holding open an SSE stream polling MongoDB every 2.5s. Overwhelms DB. |
| Non-atomic Balance Updates | `src/app/api/driver/rides/route.ts:106` | **BLOCKS HORIZONTAL SCALING** | Uses read-modify-write (`walletBalance = balance + amt; save()`). Concurrent requests on different nodes cause lost updates. |
| Unlocked Ride Acceptance | `src/app/api/driver/rides/route.ts:42` | **BLOCKS HORIZONTAL SCALING** | No atomic lock on ride acceptance. Two drivers on separate instances can accept the same ride simultaneously. |

---

## 2. Concurrency & Race Condition Analysis

### 1. Two Drivers Accepting the Same Ride
- **Current Flow:**
  1. Driver A on App #1 executes `Ride.findById(rideId)`. Status is `"SEARCHING"`.
  2. Driver B on App #2 executes `Ride.findById(rideId)`. Status is `"SEARCHING"`.
  3. Driver A sets `ride.status = "ACCEPTED"; ride.driver = driverA; await ride.save();`.
  4. Driver B sets `ride.status = "ACCEPTED"; ride.driver = driverB; await ride.save();`.
- **Result:** Both drivers receive success confirmations. Driver B overwrites Driver A in MongoDB. Driver A arrives at pickup only to find Driver B has the passenger.
- **Remediation:** Atomic conditional update:
  ```typescript
  const updatedRide = await Ride.findOneAndUpdate(
    { _id: rideId, status: "SEARCHING" },
    { $set: { status: "ACCEPTED", driver: driverUser._id } },
    { new: true }
  );
  if (!updatedRide) {
    return NextResponse.json({ status: "error", message: "Ride already accepted by another driver" }, { status: 409 });
  }
  ```

### 2. Double-Debit / Double-Credit Race Conditions
- **Current Flow:**  
  `driverUser.walletBalance = (driverUser.walletBalance || 0) + creditedAmount; await driverUser.save();`
- **Result:** If a payout and an incentive credit arrive concurrently on separate pods, one of the updates is silently lost.
- **Remediation:** Use atomic MongoDB `$inc` operations inside multi-document transactions:
  ```typescript
  await User.updateOne({ _id: driverUser._id }, { $inc: { walletBalance: creditedAmount } });
  ```

---

## 3. Realtime Traffic & Database Query Projections

Under the current polling architecture:

$$\text{Queries Per Second (QPS)} = \left( \frac{\text{Active Riders}}{1.5} \right) + \left( \frac{\text{Active Riders}}{2.5} \right) + \left( \frac{\text{Online Drivers}}{1.5} \right)$$

| Concurrent Active Rides | Online Drivers | Client HTTP Polls/sec | Server SSE DB Polls/sec | Driver Dispatch Polls/sec | **Total Polling QPS on MongoDB** |
|:---:|:---:|:---:|:---:|:---:|:---:|
| 100 | 100 | 66.7 | 40.0 | 66.7 | **173.4 QPS** |
| 500 | 500 | 333.3 | 200.0 | 333.3 | **866.6 QPS** |
| 2,000 | 2,000 | 1,333.3 | 800.0 | 1,333.3 | **3,466.6 QPS** |
| 10,000 | 10,000 | 6,666.7 | 4,000.0 | 6,666.7 | **17,333.4 QPS** |

**Conclusion:**  
At just 500 active rides, the platform generates nearly **900 queries per second solely from polling loops**, exhausting MongoDB connection pools and causing CPU spikes. Transitioning to WebSockets or Redis Pub/Sub is essential for production scalability.
