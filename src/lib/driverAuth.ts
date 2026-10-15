import { requireRole, AuthUser } from "@/lib/auth";
import {
  checkDriverVerification,
  syncDriverDocuments,
  IDriverDoc,
} from "@/lib/driverCompliance";

export async function getDriverUser(req?: Request): Promise<AuthUser> {
  const user = await requireRole("DRIVER", req);

  let needsSave = false;

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

  const compliance = checkDriverVerification(user);
  if (user.driverVehicle && user.driverVehicle.documentsVerified !== compliance.isVerified) {
    user.driverVehicle.documentsVerified = compliance.isVerified;
    needsSave = true;
  }

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
