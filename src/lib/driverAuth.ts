import { requireRole } from "@/lib/auth";
import {
  checkDriverVerification,
  syncDriverDocuments,
  IDriverDoc,
} from "@/lib/driverCompliance";

/**
 * Server-side helper to authenticate and retrieve the current DRIVER user.
 * 
 * Enforces:
 * 1. User must be authenticated (401 if missing/invalid session).
 * 2. User must have DRIVER role (403 if RIDER or other role).
 * 3. Never falls back to hardcoded/demo accounts (no rajesh.driver@bhavo.in).
 * 4. Never creates rides, riders, or vehicles during authentication.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getDriverUser(req?: Request): Promise<any> {
  // 1. Authenticate and enforce DRIVER role
  const user = await requireRole("DRIVER", req);

  let needsSave = false;

  // 2. Synchronize driver documents if document array is present
  if (user.driverDocuments && Array.isArray(user.driverDocuments) && user.driverDocuments.length > 0) {
    const syncedDocs = syncDriverDocuments(user.driverDocuments);
    const isDifferent =
      user.driverDocuments.length !== syncedDocs.length ||
      user.driverDocuments.some(
        (d: IDriverDoc, i: number) => d.name !== syncedDocs[i]?.name
      );

    if (isDifferent) {
      user.driverDocuments = syncedDocs;
      needsSave = true;
    }
  }

  // 3. Verify compliance status and enforce duty state
  const compliance = checkDriverVerification(user);
  if (user.driverVehicle && user.driverVehicle.documentsVerified !== compliance.isVerified) {
    user.driverVehicle.documentsVerified = compliance.isVerified;
    needsSave = true;
  }

  // STRICT: If documents are not verified, driver CANNOT be online
  if (!compliance.isVerified && user.isOnline) {
    user.isOnline = false;
    user.dutyState = "OFFLINE";
    needsSave = true;
  }

  if (needsSave) {
    await user.save();
  }

  return user;
}
