import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  validateDriverCoordinates,
  isLocationValidAndFresh,
  calculateHaversineDistanceKm,
} from "../src/lib/driverEligibility";

describe("Phase 1D: Driver Location Validation & Freshness Tests", () => {
  it("Accepts valid Delhi coordinates", () => {
    const coords: [number, number] = [28.6139, 77.209];
    assert.equal(validateDriverCoordinates(coords), true);
  });

  it("Accepts valid zero-valued coordinates [0, 0] without falsy rejection", () => {
    const coords: [number, number] = [0, 0];
    assert.equal(validateDriverCoordinates(coords), true);
  });

  it("Accepts valid extreme boundary coordinates", () => {
    assert.equal(validateDriverCoordinates([90, 180]), true);
    assert.equal(validateDriverCoordinates([-90, -180]), true);
    assert.equal(validateDriverCoordinates([0, -180]), true);
    assert.equal(validateDriverCoordinates([90, 0]), true);
  });

  it("Rejects latitude exceeding 90 or below -90", () => {
    assert.equal(validateDriverCoordinates([90.0001, 77.209]), false);
    assert.equal(validateDriverCoordinates([-90.0001, 77.209]), false);
    assert.equal(validateDriverCoordinates([120, 77.209]), false);
  });

  it("Rejects longitude exceeding 180 or below -180", () => {
    assert.equal(validateDriverCoordinates([28.6139, 180.0001]), false);
    assert.equal(validateDriverCoordinates([28.6139, -180.0001]), false);
    assert.equal(validateDriverCoordinates([28.6139, 250]), false);
  });

  it("Rejects NaN, Infinity, strings, and non-finite numbers", () => {
    assert.equal(validateDriverCoordinates([NaN, 77.209]), false);
    assert.equal(validateDriverCoordinates([28.6139, Infinity]), false);
    assert.equal(validateDriverCoordinates([-Infinity, 77.209]), false);
    assert.equal(validateDriverCoordinates(["28.6139" as unknown as number, 77.209]), false);
  });

  it("Rejects non-array, empty array, or single element input", () => {
    assert.equal(validateDriverCoordinates(null), false);
    assert.equal(validateDriverCoordinates(undefined), false);
    assert.equal(validateDriverCoordinates([]), false);
    assert.equal(validateDriverCoordinates([28.6139]), false);
    assert.equal(validateDriverCoordinates([28.6139, 77.209, 100]), false);
  });

  it("Fresh location within 120 seconds is eligible", () => {
    const now = new Date("2026-10-09T12:00:00.000Z");
    const freshTimestamp = new Date("2026-10-09T11:59:30.000Z"); // 30s ago
    const coords: [number, number] = [28.6139, 77.209];

    const isFresh = isLocationValidAndFresh(coords, freshTimestamp, 120, now);
    assert.equal(isFresh, true);
  });

  it("Location older than 120 seconds is deemed stale and ineligible", () => {
    const now = new Date("2026-10-09T12:00:00.000Z");
    const staleTimestamp = new Date("2026-10-09T11:57:59.000Z"); // 121s ago
    const coords: [number, number] = [28.6139, 77.209];

    const isFresh = isLocationValidAndFresh(coords, staleTimestamp, 120, now);
    assert.equal(isFresh, false);
  });

  it("Legacy records lacking updated timestamp are treated as stale", () => {
    const now = new Date("2026-10-09T12:00:00.000Z");
    const coords: [number, number] = [28.6139, 77.209];

    assert.equal(isLocationValidAndFresh(coords, null, 120, now), false);
    assert.equal(isLocationValidAndFresh(coords, undefined, 120, now), false);
  });

  it("Haversine calculates accurate geodesic distance between Delhi NCR locations", () => {
    // Connaught Place to Noida Sector 18 is approx ~13.5 - 14.5 km straight line
    const cpCoords: [number, number] = [28.6315, 77.2167];
    const noida18Coords: [number, number] = [28.5708, 77.3261];

    const distKm = calculateHaversineDistanceKm(cpCoords, noida18Coords);
    assert.ok(distKm >= 12 && distKm <= 15, `Expected ~13km, got ${distKm}`);
  });

  it("Haversine distance with identical coordinates returns 0", () => {
    const coords: [number, number] = [28.6139, 77.209];
    assert.equal(calculateHaversineDistanceKm(coords, coords), 0);
  });
});
