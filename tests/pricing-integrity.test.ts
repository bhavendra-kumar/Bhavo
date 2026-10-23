import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  calculateAuthoritativeFare,
  resolveRateCard,
  rupeesToPaise,
  paiseToRupees,
  calculateGeodesicDistanceKm,
  PricingError,
  AUTHORITATIVE_RATE_CARDS,
} from "../src/lib/pricingEngine";

describe("Phase 1C: Server-Authoritative Pricing Integrity Tests", () => {
  const delhiCenter: [number, number] = [28.6139, 77.209];
  const noidaSector62: [number, number] = [28.628, 77.3649];

  it("Rate cards strictly use integer paise for base rate and per-km rate", () => {
    for (const [key, card] of Object.entries(AUTHORITATIVE_RATE_CARDS)) {
      assert.ok(Number.isInteger(card.baseRatePaise), `${key} baseRatePaise must be integer`);
      assert.ok(card.baseRatePaise > 0, `${key} baseRatePaise must be positive`);
      assert.ok(Number.isInteger(card.perKmPaise), `${key} perKmPaise must be integer`);
      assert.ok(card.perKmPaise > 0, `${key} perKmPaise must be positive`);
    }

    assert.equal(AUTHORITATIVE_RATE_CARDS.bike.baseRatePaise, 1000);
    assert.equal(AUTHORITATIVE_RATE_CARDS.bike.perKmPaise, 50);
    assert.equal(AUTHORITATIVE_RATE_CARDS.premium.baseRatePaise, 7000);
    assert.equal(AUTHORITATIVE_RATE_CARDS.premium.perKmPaise, 50);
  });

  it("Calculates authoritative fare matching rate card formula in integer paise", () => {
    const result = calculateAuthoritativeFare({
      pickupCoordinates: delhiCenter,
      dropoffCoordinates: noidaSector62,
      vehicleType: "Cab Premium",
      claimedDistanceKm: 20.0,
    });

    assert.equal(result.distanceKm, 20.0);
    assert.equal(result.fareInPaise, 8000);
    assert.equal(result.fareInRupees, 80);
    assert.equal(result.pricingSnapshot.baseFarePaise, 7000);
    assert.equal(result.pricingSnapshot.distanceFarePaise, 1000);
    assert.equal(result.pricingSnapshot.petFriendlySurchargePaise, 0);
    assert.equal(result.pricingSnapshot.totalFarePaise, 8000);
    assert.equal(result.pricingSnapshot.currency, "INR");
    assert.equal(result.pricingSnapshot.rateRuleVersion, "v1_standard");
  });

  it("Applies pet-friendly 15% surcharge strictly in integer paise", () => {
    const normal = calculateAuthoritativeFare({
      pickupCoordinates: delhiCenter,
      dropoffCoordinates: noidaSector62,
      vehicleType: "Cab Premium",
      claimedDistanceKm: 20.0,
      petFriendly: false,
    });

    const pet = calculateAuthoritativeFare({
      pickupCoordinates: delhiCenter,
      dropoffCoordinates: noidaSector62,
      vehicleType: "Cab Premium",
      claimedDistanceKm: 20.0,
      petFriendly: true,
    });

    assert.equal(pet.pricingSnapshot.petFriendlySurchargePaise, 1200);
    assert.equal(pet.fareInPaise, 9200);
    assert.equal(pet.fareInRupees, 92);
    assert.equal(pet.fareInPaise, normal.fareInPaise + 1200);
  });

  it("Rejects client-claimed distance that is physically shorter than line-of-sight geodesic distance", () => {
    const geodesic = calculateGeodesicDistanceKm(delhiCenter, noidaSector62);
    assert.ok(geodesic > 14, `Geodesic distance should be ~15km, was ${geodesic}`);

    assert.throws(
      () =>
        calculateAuthoritativeFare({
          pickupCoordinates: delhiCenter,
          dropoffCoordinates: noidaSector62,
          vehicleType: "Cab Premium",
          claimedDistanceKm: 2.0,
        }),
      (err: unknown) => {
        const error = err as PricingError;
        assert.equal(error.statusCode, 400);
        assert.equal(error.code, "INVALID_DISTANCE_MANIPULATION");
        return true;
      }
    );
  });

  it("Rejects excessively inflated claimed distance", () => {
    assert.throws(
      () =>
        calculateAuthoritativeFare({
          pickupCoordinates: delhiCenter,
          dropoffCoordinates: noidaSector62,
          vehicleType: "Cab Premium",
          claimedDistanceKm: 500.0,
        }),
      (err: unknown) => {
        const error = err as PricingError;
        assert.equal(error.statusCode, 400);
        assert.equal(error.code, "EXCESSIVE_DISTANCE");
        return true;
      }
    );
  });

  it("Computes authoritative road distance from geodesic tortuosity when distance is omitted", () => {
    const result = calculateAuthoritativeFare({
      pickupCoordinates: delhiCenter,
      dropoffCoordinates: noidaSector62,
      vehicleType: "Bike",
    });

    const geodesic = calculateGeodesicDistanceKm(delhiCenter, noidaSector62);
    assert.ok(result.distanceKm >= geodesic);
    assert.ok(result.fareInPaise > 0);
    assert.equal(result.rateCard.id, "bike");
  });

  it("Rejects invalid, malformed, or out-of-range coordinates", () => {
    assert.throws(
      () =>
        calculateAuthoritativeFare({
          pickupCoordinates: [95, 77.2] as [number, number],
          dropoffCoordinates: noidaSector62,
          vehicleType: "Auto",
        }),
      (err: unknown) => {
        const error = err as PricingError;
        assert.equal(error.statusCode, 400);
        assert.equal(error.code, "INVALID_COORDINATES");
        return true;
      }
    );

    assert.throws(
      () =>
        calculateAuthoritativeFare({
          pickupCoordinates: [NaN, 77.2] as [number, number],
          dropoffCoordinates: noidaSector62,
          vehicleType: "Auto",
        }),
      (err: unknown) => {
        const error = err as PricingError;
        assert.equal(error.code, "INVALID_COORDINATES");
        return true;
      }
    );
  });

  it("Rejects identical pickup and drop-off points", () => {
    assert.throws(
      () =>
        calculateAuthoritativeFare({
          pickupCoordinates: delhiCenter,
          dropoffCoordinates: delhiCenter,
          vehicleType: "Auto",
        }),
      (err: unknown) => {
        const error = err as PricingError;
        assert.equal(error.statusCode, 400);
        assert.equal(error.code, "IDENTICAL_LOCATIONS");
        return true;
      }
    );
  });

  it("Rejects unsupported vehicle categories with descriptive safe error", () => {
    assert.throws(
      () => resolveRateCard("Helicopter"),
      (err: unknown) => {
        const error = err as PricingError;
        assert.equal(error.statusCode, 400);
        assert.equal(error.code, "UNSUPPORTED_VEHICLE");
        return true;
      }
    );
  });

  it("Monetary converters strictly validate numbers and reject negatives, non-finites, and unsafe integers", () => {
    assert.equal(rupeesToPaise(100), 10000);
    assert.equal(rupeesToPaise(12.5), 1250);
    assert.equal(rupeesToPaise(0), 0);
    assert.equal(paiseToRupees(10000), 100);
    assert.equal(paiseToRupees(1250), 12.5);

    assert.throws(() => rupeesToPaise(-50), (err: unknown) => (err as PricingError).code === "NEGATIVE_AMOUNT");
    assert.throws(() => rupeesToPaise(NaN), (err: unknown) => (err as PricingError).code === "INVALID_AMOUNT");
    assert.throws(() => rupeesToPaise(Infinity), (err: unknown) => (err as PricingError).code === "INVALID_AMOUNT");
    assert.throws(() => paiseToRupees(10.5), (err: unknown) => (err as PricingError).code === "INVALID_PAISE");
  });

  it("API /api/rides/estimate POST returns authoritative multi-category fares in integer paise and rupees", async () => {
    const { POST } = await import("../src/app/api/rides/estimate/route");
    const req = new Request("http://localhost:3000/api/rides/estimate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pickupCoordinates: delhiCenter,
        dropoffCoordinates: noidaSector62,
        vehicleType: "Cab Premium",
        claimedDistanceKm: 20.0,
        petFriendly: false,
      }),
    });

    const res = await POST(req);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.status, "success");
    assert.equal(body.data.selectedVehicle, "Cab Premium");
    assert.equal(body.data.fareInRupees, 80);
    assert.equal(body.data.fareInPaise, 8000);
    assert.ok(Array.isArray(body.data.estimates));
    assert.ok(body.data.estimates.length >= 5);
  });

  it("API /api/rides/estimate POST rejects missing coordinates with 400", async () => {
    const { POST } = await import("../src/app/api/rides/estimate/route");
    const req = new Request("http://localhost:3000/api/rides/estimate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        vehicleType: "Cab Premium",
      }),
    });

    const res = await POST(req);
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.status, "error");
    assert.equal(body.code, "INVALID_COORDINATES");
  });

  it("API /api/rides/estimate POST rejects manipulated client distance", async () => {
    const { POST } = await import("../src/app/api/rides/estimate/route");
    const req = new Request("http://localhost:3000/api/rides/estimate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pickupCoordinates: delhiCenter,
        dropoffCoordinates: noidaSector62,
        claimedDistanceKm: 1.5, // Geodesic is ~16km
      }),
    });

    const res = await POST(req);
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.status, "error");
    assert.equal(body.code, "INVALID_DISTANCE_MANIPULATION");
  });

  it("API /api/rides/estimate GET returns valid calculation for query parameters", async () => {
    const { GET } = await import("../src/app/api/rides/estimate/route");
    const req = new Request(
      `http://localhost:3000/api/rides/estimate?pickupLat=${delhiCenter[0]}&pickupLng=${delhiCenter[1]}&dropoffLat=${noidaSector62[0]}&dropoffLng=${noidaSector62[1]}&vehicleType=Bike`
    );

    const res = await GET(req);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.status, "success");
    assert.equal(body.data.selectedVehicle, "Bike");
    assert.ok(body.data.fareInRupees > 0);
  });
});
