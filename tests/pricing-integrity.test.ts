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
  const noidaSector62: [number, number] = [28.628, 77.3649]; // ~15.2 km straight line

  // 1. Rate cards use integer paise
  it("Rate cards strictly use integer paise for base rate and per-km rate", () => {
    for (const [key, card] of Object.entries(AUTHORITATIVE_RATE_CARDS)) {
      assert.ok(Number.isInteger(card.baseRatePaise), `${key} baseRatePaise must be integer`);
      assert.ok(card.baseRatePaise > 0, `${key} baseRatePaise must be positive`);
      assert.ok(Number.isInteger(card.perKmPaise), `${key} perKmPaise must be integer`);
      assert.ok(card.perKmPaise > 0, `${key} perKmPaise must be positive`);
    }

    assert.equal(AUTHORITATIVE_RATE_CARDS.bike.baseRatePaise, 4000); // ₹40
    assert.equal(AUTHORITATIVE_RATE_CARDS.bike.perKmPaise, 1200);    // ₹12
    assert.equal(AUTHORITATIVE_RATE_CARDS.premium.baseRatePaise, 12000); // ₹120
    assert.equal(AUTHORITATIVE_RATE_CARDS.premium.perKmPaise, 3200);     // ₹32
  });

  // 2. Authoritative fare calculation produces exact integer paise and snapshot
  it("Calculates authoritative fare matching rate card formula in integer paise", () => {
    const result = calculateAuthoritativeFare({
      pickupCoordinates: delhiCenter,
      dropoffCoordinates: noidaSector62,
      vehicleType: "Cab Premium",
      claimedDistanceKm: 20.0,
    });

    // Premium: base 12,000 paise (₹120) + 20 km * 3,200 paise (₹640) = 76,000 paise (₹760)
    assert.equal(result.distanceKm, 20.0);
    assert.equal(result.fareInPaise, 76000);
    assert.equal(result.fareInRupees, 760);
    assert.equal(result.pricingSnapshot.baseFarePaise, 12000);
    assert.equal(result.pricingSnapshot.distanceFarePaise, 64000);
    assert.equal(result.pricingSnapshot.petFriendlySurchargePaise, 0);
    assert.equal(result.pricingSnapshot.totalFarePaise, 76000);
    assert.equal(result.pricingSnapshot.currency, "INR");
    assert.equal(result.pricingSnapshot.rateRuleVersion, "v1_standard");
  });

  // 3. Pet-friendly surcharge applies +15% in integer paise
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

    // 76,000 paise * 15% = 11,400 paise. Total = 87,400 paise (₹874)
    assert.equal(pet.pricingSnapshot.petFriendlySurchargePaise, 11400);
    assert.equal(pet.fareInPaise, 87400);
    assert.equal(pet.fareInRupees, 874);
    assert.equal(pet.fareInPaise, normal.fareInPaise + 11400);
  });

  // 4. Geodesic distance lower bound enforcement: rejects artificially low distance
  it("Rejects client-claimed distance that is physically shorter than line-of-sight geodesic distance", () => {
    const geodesic = calculateGeodesicDistanceKm(delhiCenter, noidaSector62);
    assert.ok(geodesic > 14, `Geodesic distance should be ~15km, was ${geodesic}`);

    assert.throws(
      () =>
        calculateAuthoritativeFare({
          pickupCoordinates: delhiCenter,
          dropoffCoordinates: noidaSector62,
          vehicleType: "Cab Premium",
          claimedDistanceKm: 2.0, // Fraudulent 2km claim for 15km trip
        }),
      (err: unknown) => {
        const error = err as PricingError;
        assert.equal(error.statusCode, 400);
        assert.equal(error.code, "INVALID_DISTANCE_MANIPULATION");
        return true;
      }
    );
  });

  // 5. Rejects excessive or out-of-bounds claimed distance
  it("Rejects excessively inflated claimed distance", () => {
    assert.throws(
      () =>
        calculateAuthoritativeFare({
          pickupCoordinates: delhiCenter,
          dropoffCoordinates: noidaSector62,
          vehicleType: "Cab Premium",
          claimedDistanceKm: 500.0, // Fraudulent 500km for ~15km trip
        }),
      (err: unknown) => {
        const error = err as PricingError;
        assert.equal(error.statusCode, 400);
        assert.equal(error.code, "EXCESSIVE_DISTANCE");
        return true;
      }
    );
  });

  // 6. Automatically falls back to estimated road distance (tortuosity) when client distance is omitted
  it("Computes authoritative road distance from geodesic tortuosity when distance is omitted", () => {
    const result = calculateAuthoritativeFare({
      pickupCoordinates: delhiCenter,
      dropoffCoordinates: noidaSector62,
      vehicleType: "Bike",
    });

    const geodesic = calculateGeodesicDistanceKm(delhiCenter, noidaSector62);
    // Road distance estimate is ~1.3x geodesic
    assert.ok(result.distanceKm >= geodesic);
    assert.ok(result.fareInPaise > 0);
    assert.equal(result.rateCard.id, "bike");
  });

  // 7. Rejects invalid coordinates (out of range, NaN, non-finite, wrong shape)
  it("Rejects invalid, malformed, or out-of-range coordinates", () => {
    assert.throws(
      () =>
        calculateAuthoritativeFare({
          pickupCoordinates: [95, 77.2] as [number, number], // Lat > 90
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

  // 8. Rejects identical pickup and drop-off coordinates
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

  // 9. Rejects unknown or unsupported vehicle types
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

  // 10. Monetary conversion validation (rupeesToPaise, paiseToRupees)
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
});
