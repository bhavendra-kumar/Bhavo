import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { rankEligibleCandidates } from "../src/lib/dispatchRanking";
import { IDriverCandidate } from "../src/lib/driverEligibility";

describe("Phase 1D: Deterministic Candidate Ranking Tests", () => {
  const makeCandidate = (
    id: string,
    rating: number = 4.9,
    vehicleType: string = "Cab Premium"
  ): IDriverCandidate => ({
    _id: id,
    role: "DRIVER",
    status: "ACTIVE",
    isOnline: true,
    dutyState: "ONLINE_SEARCHING",
    rating,
    driverCoordinates: [28.6139, 77.209],
    driverCoordinatesUpdatedAt: new Date(),
    driverVehicle: { type: vehicleType, documentsVerified: true },
    driverSettings: { petFriendly: true },
  });

  it("Eligible preferred driver always ranks first regardless of proximity", () => {
    const candidates = [
      { driver: makeCandidate("driver_close", 4.9), distanceKm: 1.0 },
      { driver: makeCandidate("driver_pref", 4.8), distanceKm: 4.5 },
      { driver: makeCandidate("driver_far", 5.0), distanceKm: 8.0 },
    ];

    const ranked = rankEligibleCandidates(candidates, "driver_pref");

    assert.equal(ranked.length, 3);
    assert.equal(ranked[0].driver._id, "driver_pref");
    assert.equal(ranked[0].isPreferred, true);
    assert.equal(ranked[1].driver._id, "driver_close");
    assert.equal(ranked[2].driver._id, "driver_far");
  });

  it("Ineligible preferred driver (not in candidate list) safely falls back to proximity ordering", () => {
    const candidates = [
      { driver: makeCandidate("driver_mid", 4.9), distanceKm: 3.5 },
      { driver: makeCandidate("driver_closest", 4.9), distanceKm: 0.8 },
      { driver: makeCandidate("driver_far", 4.9), distanceKm: 6.2 },
    ];

    const ranked = rankEligibleCandidates(candidates, "driver_offline_vip");

    assert.equal(ranked.length, 3);
    assert.equal(ranked[0].driver._id, "driver_closest");
    assert.equal(ranked[1].driver._id, "driver_mid");
    assert.equal(ranked[2].driver._id, "driver_far");
  });

  it("Candidates within same 500m proximity bucket are ordered by rating DESC", () => {
    const candidates = [
      { driver: makeCandidate("driver_lower_rating", 4.6), distanceKm: 1.1 },
      { driver: makeCandidate("driver_higher_rating", 4.95), distanceKm: 1.3 },
    ];

    const ranked = rankEligibleCandidates(candidates);

    assert.equal(ranked[0].driver._id, "driver_higher_rating");
    assert.equal(ranked[1].driver._id, "driver_lower_rating");
  });

  it("Candidates in different 500m proximity buckets prioritize closer bucket over rating", () => {
    const candidates = [
      { driver: makeCandidate("driver_far_superstar", 5.0), distanceKm: 1.2 },
      { driver: makeCandidate("driver_close_standard", 4.7), distanceKm: 0.4 },
    ];

    const ranked = rankEligibleCandidates(candidates);

    assert.equal(ranked[0].driver._id, "driver_close_standard");
    assert.equal(ranked[1].driver._id, "driver_far_superstar");
  });

  it("Stable deterministic tie-breaker uses driver _id lexicographical order", () => {
    const candidates = [
      { driver: makeCandidate("driver_zebra", 4.9), distanceKm: 2.1 },
      { driver: makeCandidate("driver_alpha", 4.9), distanceKm: 2.1 },
      { driver: makeCandidate("driver_beta", 4.9), distanceKm: 2.1 },
    ];

    const ranked = rankEligibleCandidates(candidates);

    assert.equal(ranked[0].driver._id, "driver_alpha");
    assert.equal(ranked[1].driver._id, "driver_beta");
    assert.equal(ranked[2].driver._id, "driver_zebra");
  });

  it("Empty or null candidate list returns empty array", () => {
    assert.deepEqual(rankEligibleCandidates([]), []);
    assert.deepEqual(rankEligibleCandidates(null as unknown as []), []);
  });
});
