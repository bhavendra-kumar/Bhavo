"use client";

import React from "react";

export function BikeIcon({ className = "w-10 h-7", ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 64 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
      {/* Wheels */}
      <circle cx="14" cy="27" r="8.5" stroke="#0f172a" strokeWidth="2.5" fill="#334155" />
      <circle cx="14" cy="27" r="4" fill="#94a3b8" />
      <circle cx="14" cy="27" r="1.8" fill="#0f172a" />

      <circle cx="50" cy="27" r="8.5" stroke="#0f172a" strokeWidth="2.5" fill="#334155" />
      <circle cx="50" cy="27" r="4" fill="#94a3b8" />
      <circle cx="50" cy="27" r="1.8" fill="#0f172a" />

      {/* Frame & Engine */}
      <path d="M14 27L25 24L31 19L43 14L48 20L50 27" stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M25 24L33 26L41 26" stroke="#475569" strokeWidth="2.5" strokeLinecap="round" />
      <rect x="25" y="21" width="9" height="6" rx="1.5" fill="#64748b" />
      <path d="M28 27L39 29L47 27" stroke="#94a3b8" strokeWidth="2.2" strokeLinecap="round" />

      {/* Fuel Tank & Sporty Body */}
      <path d="M29 17C29 13.5 35 12.5 41 13.5C44 14 45 15.5 42 18.5L32 18.5Z" fill="#0d9488" stroke="#0f766e" strokeWidth="0.8" />
      
      {/* Seat */}
      <path d="M21 16.5C23 16 31 16 32 18.5C29 19 24 19 21 17.5Z" fill="#0f172a" />

      {/* Handlebars */}
      <path d="M50 27L44 11L41 10" stroke="#0f172a" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="41" cy="9.5" r="1.5" fill="#0d9488" />
      {/* Headlight */}
      <path d="M46 12L49 13" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" />
      {/* Rear Fender */}
      <path d="M8 25C9 20 15 19 19 20" stroke="#0d9488" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function AutoIcon({ className = "w-10 h-7", ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 64 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
      {/* Wheels */}
      <circle cx="15" cy="29" r="6.5" stroke="#0f172a" strokeWidth="2.5" fill="#334155" />
      <circle cx="15" cy="29" r="3" fill="#94a3b8" />

      <circle cx="49" cy="29" r="6.5" stroke="#0f172a" strokeWidth="2.5" fill="#334155" />
      <circle cx="49" cy="29" r="3" fill="#94a3b8" />

      {/* Lower Green Body */}
      <path
        d="M10 26L13 18L24 18L24 28L55 28C56 25 56 22 54 18L44 18L44 26Z"
        fill="#047857"
      />
      {/* Yellow livery mid-section */}
      <rect x="23" y="17" width="22" height="10" fill="#facc15" />
      <rect x="13" y="19" width="10" height="8" fill="#facc15" />

      {/* Iconic Curved Canopy / Roof (Dark Charcoal) */}
      <path
        d="M12 18C13 10 18 7 30 7L50 7C55 7 57 11 56 18L51 18C50 11 48 9.5 32 9.5C20 9.5 16 11 15 18Z"
        fill="#0f172a"
      />
      <path d="M14 18L48 18" stroke="#facc15" strokeWidth="1.5" />

      {/* Front Windshield */}
      <path d="M14 18L18 9.5L25 9.5L24 18Z" fill="#38bdf8" fillOpacity="0.4" stroke="#0f172a" strokeWidth="1" />
      {/* Open Entry Cabin */}
      <path d="M26 13L26 27L38 27L38 13Z" fill="#1e293b" fillOpacity="0.85" rx="1.5" />
      {/* Interior passenger seat */}
      <rect x="39" y="19" width="4" height="6" rx="1" fill="#b45309" />

      {/* Headlight & Bumpers */}
      <path d="M9 25L9 27" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M11 29L21 29" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" />
      <path d="M43 29L55 29" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function HatchbackIcon({ className = "w-10 h-7", ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 64 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
      {/* Wheels */}
      <circle cx="16" cy="28" r="6.5" stroke="#0f172a" strokeWidth="2.5" fill="#334155" />
      <circle cx="16" cy="28" r="3" fill="#cbd5e1" />
      <circle cx="48" cy="28" r="6.5" stroke="#0f172a" strokeWidth="2.5" fill="#334155" />
      <circle cx="48" cy="28" r="3" fill="#cbd5e1" />

      {/* Compact Hatchback Body */}
      <path
        d="M6 25C6 24 8 22 11 21L17 16C21 12 26 11 36 11L45 11C47 11 51 14 54 18L58 20C60 21 60 23 60 25L60 27C60 28 58 28 55 28C54 24 42 24 41 28L23 28C22 24 10 24 9 28L6 28Z"
        fill="#0d9488"
      />
      {/* Windows */}
      <path d="M20 16L27 13L35 13L35 19L19 19Z" fill="#e0f2fe" stroke="#0f766e" strokeWidth="1" />
      <path d="M37 13L44 13C46 13 49 15 51 18L51 19L37 19Z" fill="#e0f2fe" stroke="#0f766e" strokeWidth="1" />
      {/* Door Line */}
      <path d="M36 13L36 27" stroke="#0f766e" strokeWidth="1.2" />
      {/* Door Handles */}
      <rect x="38" y="21" width="3.5" height="1.2" rx="0.6" fill="#0f172a" />
      <rect x="25" y="21" width="3.5" height="1.2" rx="0.6" fill="#0f172a" />
      {/* Headlight */}
      <path d="M58 22L55 23" stroke="#fef08a" strokeWidth="2" strokeLinecap="round" />
      {/* Taillight */}
      <path d="M6 23L7 25" stroke="#f43f5e" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function SedanIcon({ className = "w-10 h-7", ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 64 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
      {/* Wheels with alloy finish */}
      <circle cx="16" cy="28" r="6.5" stroke="#0f172a" strokeWidth="2.5" fill="#1e293b" />
      <circle cx="16" cy="28" r="3.2" fill="#e2e8f0" stroke="#0f172a" strokeWidth="1" />
      <circle cx="48" cy="28" r="6.5" stroke="#0f172a" strokeWidth="2.5" fill="#1e293b" />
      <circle cx="48" cy="28" r="3.2" fill="#e2e8f0" stroke="#0f172a" strokeWidth="1" />

      {/* Long Sleek Executive Sedan Body */}
      <path
        d="M4 25C4 23.5 6 22 9 21L15 21C18 16 23 11.5 32 11.5L43 11.5C49 11.5 53 16 56 21L59 21C61 22 62 23.5 62 25L62 27C62 28 60 28 55 28C54 24 42 24 41 28L23 28C22 24 10 24 9 28L4 28Z"
        fill="#0f172a"
      />
      {/* Chrome accent line */}
      <path d="M12 21L58 21" stroke="#38bdf8" strokeWidth="0.8" opacity="0.6" />

      {/* Tinted Aerodynamic Windows */}
      <path d="M18 19.5L23 13.5L34 13.5L34 19.5Z" fill="#38bdf8" fillOpacity="0.45" stroke="#475569" strokeWidth="0.8" />
      <path d="M36 13.5L44 13.5C48 13.5 51 16.5 53 19.5L36 19.5Z" fill="#38bdf8" fillOpacity="0.45" stroke="#475569" strokeWidth="0.8" />

      {/* Door Division & Handles */}
      <path d="M35 13.5L35 27" stroke="#334155" strokeWidth="1" />
      <rect x="38" y="21.5" width="4" height="1.2" rx="0.6" fill="#94a3b8" />
      <rect x="25" y="21.5" width="4" height="1.2" rx="0.6" fill="#94a3b8" />

      {/* Modern LED Headlight */}
      <path d="M60 23L56 24" stroke="#67e8f9" strokeWidth="2" strokeLinecap="round" />
      {/* Taillight */}
      <path d="M4 23L6 24" stroke="#f43f5e" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

export function SuvIcon({ className = "w-10 h-7", ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 64 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
      {/* Large Rugged Wheels with high clearance */}
      <circle cx="16" cy="28" r="7" stroke="#0f172a" strokeWidth="3" fill="#1e293b" />
      <circle cx="16" cy="28" r="3.5" fill="#94a3b8" />
      <circle cx="48" cy="28" r="7" stroke="#0f172a" strokeWidth="3" fill="#1e293b" />
      <circle cx="48" cy="28" r="3.5" fill="#94a3b8" />

      {/* Roof Rails */}
      <path d="M20 7L46 7" stroke="#475569" strokeWidth="2" strokeLinecap="round" />
      <path d="M23 7L23 9M43 7L43 9" stroke="#475569" strokeWidth="1.5" />

      {/* SUV Body - Tall 6-seater extended cabin */}
      <path
        d="M4 25C4 22 7 20 11 20L15 20L17 9C19 8.5 25 8.5 48 8.5L52 14L57 16C60 18 61 20 61 24L61 27C61 28 59 28 56 28C55 23 41 23 40 28L24 28C23 23 9 23 8 28L4 28Z"
        fill="#0f766e"
      />
      {/* 3 rows of windows */}
      <path d="M20 18L20 11L28 11L28 18Z" fill="#ccfbf1" stroke="#115e59" strokeWidth="1" />
      <path d="M30 11L39 11L39 18L30 18Z" fill="#ccfbf1" stroke="#115e59" strokeWidth="1" />
      <path d="M41 11L47 11L51 17L41 18Z" fill="#ccfbf1" stroke="#115e59" strokeWidth="1" />

      {/* Door handles & trim */}
      <rect x="32" y="21" width="4" height="1.5" rx="0.75" fill="#0f172a" />
      <rect x="22" y="21" width="4" height="1.5" rx="0.75" fill="#0f172a" />
      {/* Headlight */}
      <path d="M59 19L57 22" stroke="#fef08a" strokeWidth="2.5" strokeLinecap="round" />
      {/* Taillight */}
      <path d="M4 21L5 24" stroke="#f43f5e" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

export function ParcelDeliveryIcon({ className = "w-10 h-7", ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 64 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
      {/* Wheels */}
      <circle cx="14" cy="28" r="7" stroke="#0f172a" strokeWidth="2.5" fill="#334155" />
      <circle cx="14" cy="28" r="3" fill="#cbd5e1" />

      <circle cx="48" cy="28" r="7" stroke="#0f172a" strokeWidth="2.5" fill="#334155" />
      <circle cx="48" cy="28" r="3" fill="#cbd5e1" />

      {/* Scooter Frame */}
      <path d="M14 28L25 28L30 22L40 22L46 13L43 11" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="43" cy="11" r="1.5" fill="#0d9488" />

      {/* Footboard & Apron */}
      <path d="M30 25L42 25L47 16L43 15Z" fill="#0d9488" />

      {/* Rider Seat */}
      <path d="M26 21C28 20 34 20 35 22L27 22Z" fill="#0f172a" />

      {/* Express Delivery Box on Rear Carrier */}
      <rect x="11" y="10" width="14" height="12" rx="2" fill="#f59e0b" stroke="#b45309" strokeWidth="1.2" />
      <path d="M18 10L18 22" stroke="#d97706" strokeWidth="1.5" />
      <path d="M11 16L25 16" stroke="#d97706" strokeWidth="1.5" />
      {/* Flash delivery badge */}
      <path d="M19 12L16 16H19L17 20L21 15H18L19 12Z" fill="#ffffff" />

      {/* Headlight */}
      <path d="M47 16L50 17" stroke="#facc15" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

export function VehicleIcon({
  type,
  id,
  className = "w-11 h-7",
  ...props
}: {
  type?: string;
  id?: string;
  className?: string;
} & React.SVGProps<SVGSVGElement>) {
  const normalized = (id || type || "").toLowerCase();

  if (normalized.includes("bike") || normalized === "motorcycle") {
    return <BikeIcon className={className} {...props} />;
  }
  if (normalized.includes("auto") || normalized.includes("rickshaw")) {
    return <AutoIcon className={className} {...props} />;
  }
  if (normalized.includes("economy") || normalized.includes("hatchback") || normalized === "mini") {
    return <HatchbackIcon className={className} {...props} />;
  }
  if (normalized.includes("premium") || normalized.includes("sedan")) {
    return <SedanIcon className={className} {...props} />;
  }
  if (normalized.includes("large") || normalized.includes("suv") || normalized.includes("xl")) {
    return <SuvIcon className={className} {...props} />;
  }
  if (normalized.includes("parcel") || normalized.includes("delivery") || normalized.includes("package")) {
    return <ParcelDeliveryIcon className={className} {...props} />;
  }

  // Default fallback to clean sedan
  return <SedanIcon className={className} {...props} />;
}
