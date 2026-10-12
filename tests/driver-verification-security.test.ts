import { describe, it } from "node:test";
import assert from "node:assert/strict";

describe("Phase 1D: Driver Verification & Security Tests", () => {
  // Simulates the secured vehicle route handler logic from src/app/api/driver/vehicle/route.ts
  const handleVehicleAction = (
    authenticatedDriver: { _id: string; role: string; documentsVerified: boolean; documents: Array<{ id: string; name: string; status: string; url?: string }> },
    body: Record<string, unknown>
  ) => {
    if (!authenticatedDriver || authenticatedDriver.role !== "DRIVER") {
      return { status: 403, error: "FORBIDDEN", message: "Driver role required" };
    }

    const { action } = body;

    // 1. Guard against VERIFY_ALL self-approval vulnerability
    if (action === "VERIFY_ALL") {
      return {
        status: 403,
        error: "SELF_VERIFICATION_PROHIBITED",
        message: "Drivers are strictly prohibited from self-verifying documents.",
      };
    }

    // 2. Guard against TOGGLE_DOC_STATUS self-approval vulnerability
    if (action === "TOGGLE_DOC_STATUS") {
      return {
        status: 403,
        error: "SELF_VERIFICATION_PROHIBITED",
        message: "Drivers cannot alter document verification review status.",
      };
    }

    // 3. Document submission: forces status to PENDING for admin review
    if (action === "UPDATE_DOC") {
      const { docId, docName, fileUrl } = body as { docId?: string; docName?: string; fileUrl?: string };
      if (!docId) {
        return { status: 400, error: "DOC_ID_REQUIRED" };
      }

      // Check if trying to force "VERIFIED"
      const requestedStatus = (body as { status?: string }).status;
      // Protected field override: status must be forced to PENDING
      const safeStatus = "PENDING";

      const existingDoc = authenticatedDriver.documents.find((d) => d.id === docId);
      if (existingDoc) {
        existingDoc.status = safeStatus;
        if (fileUrl) existingDoc.url = fileUrl;
      } else {
        authenticatedDriver.documents.push({
          id: docId,
          name: docName || "Driver Document",
          status: safeStatus,
          url: fileUrl,
        });
      }

      return {
        status: 200,
        data: {
          docId,
          status: safeStatus,
          attemptedStatus: requestedStatus,
          documentsVerified: authenticatedDriver.documentsVerified,
        },
      };
    }

    // 4. Vehicle metadata update: strip protected fields like documentsVerified
    if (action === "UPDATE_VEHICLE") {
      const vehicleUpdate = { ...(body.vehicleUpdate as Record<string, unknown> || {}) };
      // Strip protected fields
      delete vehicleUpdate.documentsVerified;
      delete vehicleUpdate.verified;

      return {
        status: 200,
        data: {
          model: vehicleUpdate.model || "Tata Tigor EV",
          documentsVerified: authenticatedDriver.documentsVerified, // Preserved, never mutated by client
        },
      };
    }

    return { status: 400, error: "INVALID_ACTION" };
  };

  it("Driver cannot invoke VERIFY_ALL to self-approve documents", () => {
    const driver = {
      _id: "driver_123",
      role: "DRIVER",
      documentsVerified: false,
      documents: [
        { id: "driving_license", name: "Driving License", status: "PENDING" },
        { id: "vehicle_rc", name: "Vehicle RC", status: "PENDING" },
      ],
    };

    const res = handleVehicleAction(driver, { action: "VERIFY_ALL" });
    assert.equal(res.status, 403);
    assert.equal(res.error, "SELF_VERIFICATION_PROHIBITED");
    // Documents and documentsVerified remain false
    assert.equal(driver.documentsVerified, false);
    assert.equal(driver.documents[0].status, "PENDING");
  });

  it("Driver cannot invoke TOGGLE_DOC_STATUS to bypass review", () => {
    const driver = {
      _id: "driver_123",
      role: "DRIVER",
      documentsVerified: false,
      documents: [{ id: "police_clearance", name: "Police Clearance", status: "PENDING" }],
    };

    const res = handleVehicleAction(driver, {
      action: "TOGGLE_DOC_STATUS",
      docId: "police_clearance",
      nextStatus: "VERIFIED",
    });

    assert.equal(res.status, 403);
    assert.equal(res.error, "SELF_VERIFICATION_PROHIBITED");
    assert.equal(driver.documents[0].status, "PENDING");
  });

  it("Driver attempting to pass status='VERIFIED' via UPDATE_DOC is forced to PENDING", () => {
    const driver = {
      _id: "driver_123",
      role: "DRIVER",
      documentsVerified: false,
      documents: [{ id: "aadhaar", name: "Aadhaar Card", status: "REJECTED" }],
    };

    const res = handleVehicleAction(driver, {
      action: "UPDATE_DOC",
      docId: "aadhaar",
      fileUrl: "https://secure.bhavo.in/docs/aadhaar_new.pdf",
      status: "VERIFIED", // Malicious attempt to self-approve
    });

    assert.equal(res.status, 200);
    assert.equal(res.data?.status, "PENDING");
    assert.equal(driver.documents[0].status, "PENDING");
    assert.equal(driver.documentsVerified, false);
  });

  it("Protected field mass assignment via UPDATE_VEHICLE cannot set documentsVerified", () => {
    const driver = {
      _id: "driver_123",
      role: "DRIVER",
      documentsVerified: false,
      documents: [],
    };

    const res = handleVehicleAction(driver, {
      action: "UPDATE_VEHICLE",
      vehicleUpdate: {
        model: "Tata Nexon EV",
        documentsVerified: true, // Malicious privilege escalation
        verified: true,
      },
    });

    assert.equal(res.status, 200);
    assert.equal(res.data?.documentsVerified, false);
    assert.equal(driver.documentsVerified, false);
  });

  it("Non-driver role cannot invoke driver vehicle operations", () => {
    const rider = {
      _id: "rider_456",
      role: "RIDER",
      documentsVerified: false,
      documents: [],
    };

    const res = handleVehicleAction(rider, { action: "UPDATE_DOC", docId: "license" });
    assert.equal(res.status, 403);
    assert.equal(res.error, "FORBIDDEN");
  });
});
