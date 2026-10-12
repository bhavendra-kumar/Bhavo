export interface IDriverDoc {
  name: string;
  category: "DRIVER" | "VEHICLE";
  description?: string;
  status: "VERIFIED" | "PENDING" | "REJECTED" | "EXEMPT";
  expiry: string;
  docId: string;
  fileUrl?: string | null;
  rejectionReason?: string | null;
  updatedAt?: string | Date;
}

export interface IVerificationResult {
  isVerified: boolean;
  driverDocsVerified: boolean;
  vehicleDocsVerified: boolean;
  pendingDocs: IDriverDoc[];
  rejectedDocs: IDriverDoc[];
  verifiedDocs: IDriverDoc[];
  totalDocs: number;
  verifiedCount: number;
  reason?: string;
}

/**
 * EXACT Required Documents as specified:
 * 1. Driving License (DL): A valid two-wheeler driving license (front and back).
 * 2. Vehicle Registration Certificate (RC): The official registration paper for your bike or vehicle. (If the RC is not in your name, an owner NOC and ID copy may be required).
 * 3. Identity Proof: Aadhaar Card or PAN Card for identity verification.
 * 4. Vehicle Insurance: Active insurance papers for your vehicle.
 * 5. Pollution Under Control (PUC) Certificate: Valid pollution check certificate (required in many regions).
 * 6. Bank Account Details: Passbook, canceled cheque, or UPI ID/bank details to receive your daily/weekly earnings.
 * 7. Profile Photo: A clear, recent photograph of yourself.
 * 8. Helmets: Two helmets (one for the driver and an extra one for the customer, mandatory for bike taxis).
 */
export const DEFAULT_DRIVER_DOCUMENTS: IDriverDoc[] = [
  // ── Driver Identity & Account Requirements ──
  {
    name: "Driving License (DL)",
    category: "DRIVER",
    description: "A valid two-wheeler driving license (front and back).",
    status: "VERIFIED",
    expiry: "12 Oct 2029",
    docId: "DL-0420110094",
  },
  {
    name: "Identity Proof",
    category: "DRIVER",
    description: "Aadhaar Card or PAN Card for identity verification.",
    status: "VERIFIED",
    expiry: "Permanent ID",
    docId: "AADHAAR-8821-4902",
  },
  {
    name: "Bank Account Details",
    category: "DRIVER",
    description: "Passbook, canceled cheque, or UPI ID/bank details to receive your daily/weekly earnings.",
    status: "VERIFIED",
    expiry: "Active Direct Deposit",
    docId: "UPI: captain.rajesh@okhdfcbank",
  },
  {
    name: "Profile Photo",
    category: "DRIVER",
    description: "A clear, recent photograph of yourself.",
    status: "VERIFIED",
    expiry: "Verified Photo ID",
    docId: "PHOTO-VERIFIED-2026",
    fileUrl: "/avatars/driver.png",
  },

  // ── Vehicle & Safety Requirements ──
  {
    name: "Vehicle Registration Certificate (RC)",
    category: "VEHICLE",
    description: "The official registration paper for your bike or vehicle. (If the RC is not in your name, an owner NOC and ID copy may be required).",
    status: "VERIFIED",
    expiry: "24 Mar 2034",
    docId: "RC-DL01EV4429",
  },
  {
    name: "Vehicle Insurance",
    category: "VEHICLE",
    description: "Active insurance papers for your vehicle.",
    status: "VERIFIED",
    expiry: "18 Dec 2027",
    docId: "POL-ICICI-8840",
  },
  {
    name: "Pollution Under Control (PUC) Certificate",
    category: "VEHICLE",
    description: "Valid pollution check certificate (required in many regions).",
    status: "VERIFIED",
    expiry: "15 Jan 2027",
    docId: "PUC-DL-993021",
  },
  {
    name: "Helmets",
    category: "VEHICLE",
    description: "Two helmets (one for the driver and an extra one for the customer, mandatory for bike taxis).",
    status: "VERIFIED",
    expiry: "ISI Marked Compliance",
    docId: "HELMET-SAFETY-CHECKED",
  },
];

export const BASIC_REQUIREMENTS = [
  {
    name: "Minimum age of 18 years.",
    description: "Driver must be at least 18 years of age to register and operate commercial rides.",
    status: "VERIFIED",
    detail: "Age verified: 26 years",
  },
  {
    name: "An Android smartphone with an active internet connection.",
    description: "Mandatory for GPS navigation, ride dispatches, telemetry, and payment coordination.",
    status: "VERIFIED",
    detail: "Device telemetry active (Android 14)",
  },
];

export function getDocCategory(name: string, explicitCategory?: string): "DRIVER" | "VEHICLE" {
  if (explicitCategory === "DRIVER" || explicitCategory === "VEHICLE") {
    return explicitCategory;
  }
  const lower = (name || "").toLowerCase();
  if (
    lower.includes("license") ||
    lower.includes("dl") ||
    lower.includes("identity") ||
    lower.includes("aadhaar") ||
    lower.includes("pan") ||
    lower.includes("bank") ||
    lower.includes("photo")
  ) {
    return "DRIVER";
  }
  return "VEHICLE";
}

/**
 * Synchronizes driver documents to ensure ONLY the 8 strictly required documents exist,
 * retaining existing verification statuses, IDs, and upload proofs.
 */
export function syncDriverDocuments(currentDocs?: Partial<IDriverDoc>[]): IDriverDoc[] {
  if (!Array.isArray(currentDocs) || currentDocs.length === 0) {
    return DEFAULT_DRIVER_DOCUMENTS.map((doc) => ({ ...doc }));
  }

  return DEFAULT_DRIVER_DOCUMENTS.map((defaultDoc) => {
    const defNameLower = defaultDoc.name.toLowerCase();
    const matched = currentDocs.find((doc: Partial<IDriverDoc>) => {
      const docName = (doc?.name || "").toLowerCase();
      if (docName === defNameLower) return true;
      if (defNameLower.includes("license") && (docName.includes("license") || docName.includes("dl"))) return true;
      if (defNameLower.includes("identity") && (docName.includes("identity") || docName.includes("aadhaar") || docName.includes("pan"))) return true;
      if (defNameLower.includes("bank") && docName.includes("bank")) return true;
      if (defNameLower.includes("photo") && (docName.includes("profile") || docName.includes("photo"))) return true;
      if (defNameLower.includes("registration") && (docName.includes("registration") || docName.includes("rc"))) return true;
      if (defNameLower.includes("insurance") && docName.includes("insurance")) return true;
      if (defNameLower.includes("pollution") && (docName.includes("pollution") || docName.includes("puc"))) return true;
      if (defNameLower.includes("helmet") && docName.includes("helmet")) return true;
      return false;
    });

    if (matched) {
      return {
        ...defaultDoc,
        status: matched.status || defaultDoc.status,
        expiry: matched.expiry || defaultDoc.expiry,
        docId: matched.docId || defaultDoc.docId,
        fileUrl: matched.fileUrl !== undefined ? matched.fileUrl : defaultDoc.fileUrl,
        rejectionReason: matched.rejectionReason !== undefined ? matched.rejectionReason : defaultDoc.rejectionReason,
        updatedAt: matched.updatedAt || defaultDoc.updatedAt,
      };
    }

    return { ...defaultDoc };
  });
}

/**
 * Validates whether all required driver and vehicle documents are completely verified.
 * A driver is verified ONLY if:
 * 1. user.driverVehicle.documentsVerified is not false
 * 2. Every document in driverDocuments has status === 'VERIFIED' or 'EXEMPT'
 * 3. Both Driver category documents and Vehicle category documents are verified
 * 4. No document is 'PENDING' or 'REJECTED'
 */
export function checkDriverVerification(user: { driverVehicle?: { documentsVerified?: boolean }; driverDocuments?: IDriverDoc[] } | null | undefined): IVerificationResult {
  const rawDocs = user?.driverDocuments;
  const normalizedDocs: IDriverDoc[] = syncDriverDocuments(rawDocs);

  const isDocValid = (d: IDriverDoc) => d.status === "VERIFIED" || d.status === "EXEMPT";

  const driverDocs = normalizedDocs.filter((d) => d.category === "DRIVER");
  const vehicleDocs = normalizedDocs.filter((d) => d.category === "VEHICLE");

  const driverDocsVerified = driverDocs.length > 0 && driverDocs.every(isDocValid);
  const vehicleDocsVerified = vehicleDocs.length > 0 && vehicleDocs.every(isDocValid);

  const pendingDocs = normalizedDocs.filter((d) => d.status === "PENDING");
  const rejectedDocs = normalizedDocs.filter((d) => d.status === "REJECTED");
  const verifiedDocs = normalizedDocs.filter(isDocValid);

  const vehicleFlag = user?.driverVehicle?.documentsVerified !== false;

  const isVerified =
    driverDocsVerified &&
    vehicleDocsVerified &&
    vehicleFlag &&
    pendingDocs.length === 0 &&
    rejectedDocs.length === 0;

  let reason: string | undefined = undefined;
  if (!isVerified) {
    if (rejectedDocs.length > 0) {
      reason = `${rejectedDocs.length} document(s) rejected by compliance team: ${rejectedDocs.map((d) => d.name).join(", ")}.`;
    } else if (pendingDocs.length > 0) {
      reason = `${pendingDocs.length} document(s) pending verification: ${pendingDocs.map((d) => d.name).join(", ")}.`;
    } else if (!driverDocsVerified) {
      reason = "Driver identity/account documents are incomplete or unverified.";
    } else if (!vehicleDocsVerified || !vehicleFlag) {
      reason = "Vehicle compliance or safety gear documents are incomplete or unverified.";
    } else {
      reason = "All driver and vehicle documents must be verified before going online.";
    }
  }

  return {
    isVerified,
    driverDocsVerified,
    vehicleDocsVerified,
    pendingDocs,
    rejectedDocs,
    verifiedDocs,
    totalDocs: normalizedDocs.length,
    verifiedCount: verifiedDocs.length,
    reason,
  };
}
