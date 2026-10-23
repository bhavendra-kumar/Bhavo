"use client";

import React from "react";

/**
 * High-fidelity, 2.5D animatic vehicle illustrations inspired by Ola, Rapido & Uber platforms.
 * Features realistic shadows, metallic gradients, glass reflections, chrome trim,
 * and subtle CSS micro-animations for idle suspension breathing, wheel shimmer, and headlight flares.
 */

export function BikeIcon({ className = "w-12 h-8", ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 110 65"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`animatic-veh bike-veh ${className}`}
      {...props}
    >
      <defs>
        {/* Ground Shadow */}
        <radialGradient id="bike-shadow-grad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#0f172a" stopOpacity="0.32" />
          <stop offset="60%" stopColor="#0f172a" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#0f172a" stopOpacity="0" />
        </radialGradient>

        {/* Glossy Teal/Emerald Metallic Paint */}
        <linearGradient id="bike-paint" x1="20" y1="18" x2="65" y2="35" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="35%" stopColor="#0d9488" />
          <stop offset="100%" stopColor="#044e47" />
        </linearGradient>

        {/* Specular Highlight Streak */}
        <linearGradient id="bike-highlight" x1="25" y1="16" x2="52" y2="24" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>

        {/* Chrome & Silver Metals */}
        <linearGradient id="bike-chrome" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f8fafc" />
          <stop offset="50%" stopColor="#94a3b8" />
          <stop offset="100%" stopColor="#cbd5e1" />
        </linearGradient>

        {/* Tire Rubber Gradient */}
        <radialGradient id="bike-tire-grad" cx="40%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#334155" />
          <stop offset="70%" stopColor="#0f172a" />
          <stop offset="100%" stopColor="#020617" />
        </radialGradient>

        {/* Wheel Alloy Rim */}
        <radialGradient id="bike-rim-grad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#f1f5f9" />
          <stop offset="55%" stopColor="#64748b" />
          <stop offset="100%" stopColor="#334155" />
        </radialGradient>

        {/* Headlight Beam Glow */}
        <radialGradient id="bike-light-beam" cx="0%" cy="50%" r="100%">
          <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.8" />
          <stop offset="40%" stopColor="#67e8f9" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* 1. Road Ground Shadow */}
      <ellipse cx="54" cy="56" rx="42" ry="5.5" fill="url(#bike-shadow-grad)" className="veh-road-shadow" />

      {/* 2. Suspension & Chassis Group (Animatic Floating) */}
      <g className="veh-chassis">
        {/* Headlight Flare Projection */}
        <path d="M78 27L105 20L102 38L77 32Z" fill="url(#bike-light-beam)" opacity="0.6" className="veh-light-glow" />

        {/* Exhaust System (Lower rear) */}
        <path
          d="M32 44L44 42L60 41L70 43L72 45L61 45L42 45L31 46Z"
          fill="url(#bike-chrome)"
          stroke="#475569"
          strokeWidth="0.8"
        />
        <rect x="23" y="42" width="16" height="5.5" rx="2.5" fill="#1e293b" stroke="#334155" strokeWidth="0.8" />
        <ellipse cx="23" cy="44.7" rx="1.5" ry="2.7" fill="#64748b" />

        {/* Rear Wheel & Swingarm */}
        <g className="veh-wheel-rear">
          <circle cx="25" cy="42" r="14" fill="url(#bike-tire-grad)" stroke="#090d16" strokeWidth="2.5" />
          <circle cx="25" cy="42" r="9" fill="url(#bike-rim-grad)" stroke="#1e293b" strokeWidth="1" />
          {/* Alloy Spokes */}
          <circle cx="25" cy="42" r="5" fill="#0f172a" />
          <line x1="25" y1="33" x2="25" y2="51" stroke="#cbd5e1" strokeWidth="1.6" />
          <line x1="16" y1="42" x2="34" y2="42" stroke="#cbd5e1" strokeWidth="1.6" />
          <line x1="18.5" y1="35.5" x2="31.5" y2="48.5" stroke="#cbd5e1" strokeWidth="1.2" />
          <line x1="31.5" y1="35.5" x2="18.5" y2="48.5" stroke="#cbd5e1" strokeWidth="1.2" />
          <circle cx="25" cy="42" r="2.5" fill="#f8fafc" />
          <circle cx="25" cy="42" r="6" stroke="#94a3b8" strokeWidth="0.8" strokeDasharray="1.5 1.5" />
        </g>

        {/* Rear Swingarm and Mono-Shock Suspension */}
        <path d="M25 42L44 38L48 41L30 44Z" fill="#334155" stroke="#1e293b" strokeWidth="0.8" />
        <line x1="42" y1="33" x2="37" y2="41" stroke="#e11d48" strokeWidth="3.2" strokeLinecap="round" />
        <line x1="42" y1="33" x2="37" y2="41" stroke="#ffffff" strokeWidth="1" strokeDasharray="1.2 1.8" />

        {/* Engine Block & Transmission (Center) */}
        <rect x="42" y="34" width="16" height="13" rx="3" fill="#1e293b" stroke="#334155" strokeWidth="1" />
        <rect x="45" y="37" width="11" height="8" rx="1.5" fill="#334155" />
        {/* Engine Cooling Fins */}
        <line x1="44" y1="36" x2="55" y2="36" stroke="#64748b" strokeWidth="0.9" />
        <line x1="44" y1="39" x2="56" y2="39" stroke="#64748b" strokeWidth="0.9" />
        <line x1="44" y1="42" x2="54" y2="42" stroke="#64748b" strokeWidth="0.9" />
        <circle cx="50" cy="43" r="2.2" fill="#94a3b8" />

        {/* Front Wheel & Telescopic Suspension Fork */}
        <g className="veh-wheel-front">
          <circle cx="82" cy="42" r="14" fill="url(#bike-tire-grad)" stroke="#090d16" strokeWidth="2.5" />
          <circle cx="82" cy="42" r="9" fill="url(#bike-rim-grad)" stroke="#1e293b" strokeWidth="1" />
          {/* Front Alloy Spokes */}
          <circle cx="82" cy="42" r="5" fill="#0f172a" />
          <line x1="82" y1="33" x2="82" y2="51" stroke="#cbd5e1" strokeWidth="1.6" />
          <line x1="73" y1="42" x2="91" y2="42" stroke="#cbd5e1" strokeWidth="1.6" />
          <line x1="75.5" y1="35.5" x2="88.5" y2="48.5" stroke="#cbd5e1" strokeWidth="1.2" />
          <line x1="88.5" y1="35.5" x2="75.5" y2="48.5" stroke="#cbd5e1" strokeWidth="1.2" />
          <circle cx="82" cy="42" r="2.5" fill="#f8fafc" />
          {/* Disc Brake Caliper */}
          <circle cx="82" cy="42" r="6" stroke="#94a3b8" strokeWidth="0.8" strokeDasharray="1.5 1.5" />
          <path d="M85 36C87 38 88 40 87 42" stroke="#e11d48" strokeWidth="2.5" strokeLinecap="round" />
        </g>

        {/* Front Fork & Mudguard */}
        <path d="M72 18L82 42" stroke="url(#bike-chrome)" strokeWidth="2.8" strokeLinecap="round" />
        <path d="M70 20L79 41" stroke="#1e293b" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M73 30C75 27 82 27 88 32" stroke="#0d9488" strokeWidth="3" strokeLinecap="round" />

        {/* Motorcycle Body: Sculpted Fuel Tank & Fairing */}
        <path
          d="M44 26C45 22 51 18 63 19C69 19.5 73 24 71 29L64 34L45 34C43 32 43 28 44 26Z"
          fill="url(#bike-paint)"
          stroke="#064e3b"
          strokeWidth="1.2"
        />

        {/* Tank Glossy Specular Light Stripe */}
        <path
          d="M50 20C55 19 63 19.5 68 22C64 24 57 23 50 20Z"
          fill="url(#bike-highlight)"
        />

        {/* Bhavo Accent Emblem */}
        <path d="M57 23L59 25L55 27L57 23Z" fill="#fef08a" opacity="0.9" />

        {/* Ergonomic Stepped Saddle (Rider + Pillion) */}
        <path
          d="M26 27C30 26 36 27 42 30L46 31C43 33 37 34 32 34C28 34 25 31 26 27Z"
          fill="#1e293b"
          stroke="#0f172a"
          strokeWidth="1"
        />
        <path d="M28 28C33 27.5 38 28.5 43 31" stroke="#475569" strokeWidth="0.8" />

        {/* Tail Cowl & Red LED Brake Light */}
        <path d="M22 28L30 27L32 31L23 32Z" fill="url(#bike-paint)" stroke="#064e3b" strokeWidth="0.8" />
        <path d="M21 29L22 32" stroke="#ef4444" strokeWidth="2.2" strokeLinecap="round" />

        {/* Front Cowl, Windscreen, Handlebar & Side Mirror */}
        <path d="M66 18L74 24L77 28L71 30L67 24Z" fill="url(#bike-paint)" stroke="#064e3b" strokeWidth="0.9" />
        <path d="M68 17L72 13L75 18Z" fill="#38bdf8" fillOpacity="0.7" stroke="#0284c7" strokeWidth="0.8" />

        {/* Handlebars & Mirror */}
        <path d="M67 17L63 14" stroke="#0f172a" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M64 14L60 11" stroke="#64748b" strokeWidth="1.4" strokeLinecap="round" />
        <ellipse cx="59.5" cy="10.5" rx="2" ry="1.4" fill="#38bdf8" stroke="#0f172a" strokeWidth="0.8" />

        {/* Projector LED Headlamp */}
        <ellipse cx="76.5" cy="28.5" rx="2" ry="3.2" fill="#e0f2fe" stroke="#38bdf8" strokeWidth="1" />
        <circle cx="76.5" cy="28.5" r="1.3" fill="#ffffff" />
      </g>
    </svg>
  );
}

export function AutoIcon({ className = "w-12 h-8", ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 110 65"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`animatic-veh auto-veh ${className}`}
      {...props}
    >
      <defs>
        <radialGradient id="auto-shadow-grad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#0f172a" stopOpacity="0.35" />
          <stop offset="65%" stopColor="#0f172a" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#0f172a" stopOpacity="0" />
        </radialGradient>

        {/* Iconic Sunshine Yellow Hood Paint */}
        <linearGradient id="auto-yellow-grad" x1="20" y1="12" x2="80" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="25%" stopColor="#facc15" />
          <stop offset="70%" stopColor="#eab308" />
          <stop offset="100%" stopColor="#ca8a04" />
        </linearGradient>

        {/* Emerald Green Lower Skirt */}
        <linearGradient id="auto-green-grad" x1="18" y1="36" x2="82" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#059669" />
          <stop offset="60%" stopColor="#047857" />
          <stop offset="100%" stopColor="#064e3b" />
        </linearGradient>

        {/* Black Canvas Roof Texture */}
        <linearGradient id="auto-roof-grad" x1="15" y1="8" x2="75" y2="28" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#334155" />
          <stop offset="50%" stopColor="#1e293b" />
          <stop offset="100%" stopColor="#0f172a" />
        </linearGradient>

        {/* Windscreen Glass */}
        <linearGradient id="auto-glass" x1="55" y1="13" x2="78" y2="28" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#e0f2fe" stopOpacity="0.85" />
          <stop offset="50%" stopColor="#7dd3fc" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#bae6fd" stopOpacity="0.65" />
        </linearGradient>

        <radialGradient id="auto-headlight" cx="0%" cy="50%" r="100%">
          <stop offset="0%" stopColor="#fef08a" stopOpacity="0.8" />
          <stop offset="50%" stopColor="#facc15" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#eab308" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* 1. Ground Shadow */}
      <ellipse cx="53" cy="56" rx="41" ry="5.5" fill="url(#auto-shadow-grad)" className="veh-road-shadow" />

      {/* 2. Auto Body & Chassis */}
      <g className="veh-chassis">
        {/* Headlight Flare */}
        <path d="M84 39L106 32L103 48L83 45Z" fill="url(#auto-headlight)" opacity="0.6" className="veh-light-glow" />

        {/* Rear Wheel */}
        <g className="veh-wheel-rear">
          <circle cx="28" cy="46" r="11.5" fill="#0f172a" stroke="#020617" strokeWidth="2" />
          <circle cx="28" cy="46" r="7" fill="#475569" stroke="#1e293b" strokeWidth="1" />
          <circle cx="28" cy="46" r="4" fill="#cbd5e1" />
          <circle cx="28" cy="46" r="1.8" fill="#0f172a" />
        </g>

        {/* Front Wheel & Mudguard */}
        <g className="veh-wheel-front">
          <circle cx="78" cy="46" r="11.5" fill="#0f172a" stroke="#020617" strokeWidth="2" />
          <circle cx="78" cy="46" r="7" fill="#475569" stroke="#1e293b" strokeWidth="1" />
          <circle cx="78" cy="46" r="4" fill="#cbd5e1" />
          <circle cx="78" cy="46" r="1.8" fill="#0f172a" />
        </g>
        {/* Front Mudguard Arc */}
        <path d="M70 42C72 36 82 36 86 42" stroke="url(#auto-yellow-grad)" strokeWidth="3" strokeLinecap="round" />

        {/* Lower Emerald Green Body Shell */}
        <path
          d="M17 42C17 38 20 36 24 36L44 36L50 36L72 36L80 40C84 42 84 45 80 47L72 47L68 47L37 47L22 47C18 47 17 45 17 42Z"
          fill="url(#auto-green-grad)"
          stroke="#064e3b"
          strokeWidth="1"
        />
        {/* Chrome Side Trim Accent */}
        <path d="M22 39L78 39" stroke="#a7f3d0" strokeWidth="0.8" opacity="0.7" />

        {/* Yellow Mid-Body Panel & Front Cowl */}
        <path
          d="M20 36L20 28C20 28 32 28 42 28L44 36L20 36Z"
          fill="url(#auto-yellow-grad)"
          stroke="#b45309"
          strokeWidth="0.8"
        />
        {/* Front Nose Cowl */}
        <path
          d="M62 36L64 26L74 27L82 36C84 38 84 41 81 42L70 42L62 36Z"
          fill="url(#auto-yellow-grad)"
          stroke="#b45309"
          strokeWidth="1"
        />

        {/* Open Cabin Passenger Area */}
        <rect x="36" y="22" width="28" height="15" fill="#1e293b" rx="2" />
        {/* Passenger Bench Seat (Ribbed) */}
        <path d="M26 31C26 27 28 25 32 25L38 25L38 36L26 36Z" fill="#334155" />
        <line x1="30" y1="26" x2="30" y2="35" stroke="#475569" strokeWidth="1" />
        <line x1="34" y1="26" x2="34" y2="35" stroke="#475569" strokeWidth="1" />

        {/* Steering Handlebars & Meter Console */}
        <path d="M66 31L62 26" stroke="#94a3b8" strokeWidth="2.2" strokeLinecap="round" />
        <circle cx="62" cy="25" r="1.8" fill="#facc15" />

        {/* Front Windscreen with Chrome Pillars & Glass Reflection */}
        <path
          d="M62 13L74 14C76 14 77 15 78 17L82 28L65 27L62 13Z"
          fill="url(#auto-glass)"
          stroke="#334155"
          strokeWidth="1"
        />
        {/* Wiper Blade & Arm */}
        <line x1="68" y1="26" x2="74" y2="17" stroke="#0f172a" strokeWidth="1.2" strokeLinecap="round" />
        {/* Glass Reflection Highlight */}
        <line x1="66" y1="15" x2="72" y2="26" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />

        {/* Classic Black Canvas Canopy (Roof) */}
        <path
          d="M18 24C18 13 25 8 45 8L70 8C74 8 77 10 77 14L62 14L46 14C28 14 21 16 19 24Z"
          fill="url(#auto-roof-grad)"
          stroke="#090d16"
          strokeWidth="1.2"
        />
        {/* Yellow Canopy Piping Border */}
        <path d="M18 23C22 13 32 10 50 10L72 10" stroke="#facc15" strokeWidth="1.2" fill="none" />
        {/* Rear Canvas Ventilation Quarter Window */}
        <ellipse cx="25" cy="18" rx="4.5" ry="3.5" fill="#38bdf8" fillOpacity="0.5" stroke="#0f172a" strokeWidth="0.8" />

        {/* Chrome Front Round Headlight */}
        <circle cx="82" cy="40" r="3.6" fill="#fef08a" stroke="#d97706" strokeWidth="1" />
        <circle cx="82" cy="40" r="1.8" fill="#ffffff" />

        {/* Front Bumper & Safety Rail */}
        <path d="M80 45L86 45L86 48L79 48" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" />
        <rect x="15" y="44" width="4" height="2" rx="1" fill="#ef4444" />
      </g>
    </svg>
  );
}

export function HatchbackIcon({ className = "w-12 h-8", ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 110 65"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`animatic-veh hatch-veh ${className}`}
      {...props}
    >
      <defs>
        <radialGradient id="hatch-shadow-grad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#0f172a" stopOpacity="0.38" />
          <stop offset="65%" stopColor="#0f172a" stopOpacity="0.14" />
          <stop offset="100%" stopColor="#0f172a" stopOpacity="0" />
        </radialGradient>

        {/* Glossy Modern Teal Metallic Gradient */}
        <linearGradient id="hatch-paint-grad" x1="12" y1="16" x2="95" y2="44" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#14b8a6" />
          <stop offset="35%" stopColor="#0d9488" />
          <stop offset="75%" stopColor="#0f766e" />
          <stop offset="100%" stopColor="#115e59" />
        </linearGradient>

        {/* Sunlight Specular Sweep Streak */}
        <linearGradient id="hatch-specular" x1="25" y1="18" x2="88" y2="28" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
          <stop offset="60%" stopColor="#a7f3d0" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>

        {/* Cyan Privacy Glass */}
        <linearGradient id="hatch-glass" x1="30" y1="14" x2="75" y2="28" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#e0f2fe" stopOpacity="0.9" />
          <stop offset="50%" stopColor="#38bdf8" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#0284c7" stopOpacity="0.75" />
        </linearGradient>

        {/* Wheel Alloy */}
        <radialGradient id="hatch-alloy-rim" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#f8fafc" />
          <stop offset="60%" stopColor="#64748b" />
          <stop offset="100%" stopColor="#1e293b" />
        </radialGradient>

        <radialGradient id="hatch-light-beam" cx="0%" cy="50%" r="100%">
          <stop offset="0%" stopColor="#a7f3d0" stopOpacity="0.8" />
          <stop offset="50%" stopColor="#38bdf8" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#0d9488" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* 1. Ground Shadow */}
      <ellipse cx="54" cy="56" rx="44" ry="5.5" fill="url(#hatch-shadow-grad)" className="veh-road-shadow" />

      {/* 2. Chassis & Body (Smooth Glide) */}
      <g className="veh-chassis">
        {/* Headlight Projection */}
        <path d="M88 36L108 30L106 46L86 42Z" fill="url(#hatch-light-beam)" opacity="0.6" className="veh-light-glow" />

        {/* Rear Wheel (Detailed Alloy) */}
        <g className="veh-wheel-rear">
          <circle cx="28" cy="46" r="12" fill="#0f172a" stroke="#020617" strokeWidth="2.4" />
          <circle cx="28" cy="46" r="7.5" fill="url(#hatch-alloy-rim)" stroke="#334155" strokeWidth="1" />
          {/* 5-Spoke Star Rim */}
          <line x1="28" y1="39" x2="28" y2="53" stroke="#f1f5f9" strokeWidth="1.8" />
          <line x1="21" y1="46" x2="35" y2="46" stroke="#f1f5f9" strokeWidth="1.8" />
          <line x1="23" y1="41" x2="33" y2="51" stroke="#cbd5e1" strokeWidth="1.4" />
          <circle cx="28" cy="46" r="3.2" fill="#0f172a" stroke="#94a3b8" strokeWidth="0.8" />
          <circle cx="28" cy="46" r="1.4" fill="#14b8a6" />
        </g>

        {/* Front Wheel (Detailed Alloy) */}
        <g className="veh-wheel-front">
          <circle cx="78" cy="46" r="12" fill="#0f172a" stroke="#020617" strokeWidth="2.4" />
          <circle cx="78" cy="46" r="7.5" fill="url(#hatch-alloy-rim)" stroke="#334155" strokeWidth="1" />
          <line x1="78" y1="39" x2="78" y2="53" stroke="#f1f5f9" strokeWidth="1.8" />
          <line x1="71" y1="46" x2="85" y2="46" stroke="#f1f5f9" strokeWidth="1.8" />
          <line x1="73" y1="41" x2="83" y2="51" stroke="#cbd5e1" strokeWidth="1.4" />
          <circle cx="78" cy="46" r="3.2" fill="#0f172a" stroke="#94a3b8" strokeWidth="0.8" />
          <circle cx="78" cy="46" r="1.4" fill="#14b8a6" />
        </g>

        {/* Main Aerodynamic Car Body Shell */}
        <path
          d="M12 40C12 36 15 32 20 30L30 22C38 15 48 14 62 14L74 14C78 14 83 18 87 24L93 28C96 30 98 33 98 37L98 42C98 45 96 46 92 46C90 41 70 41 68 46L38 46C36 41 18 41 16 46L13 46C12 46 12 43 12 40Z"
          fill="url(#hatch-paint-grad)"
          stroke="#064e3b"
          strokeWidth="1.2"
        />

        {/* Specular Light Reflection Sweep on Shoulder Line */}
        <path
          d="M22 30C36 28 62 26 90 32C82 34 52 32 24 33Z"
          fill="url(#hatch-specular)"
        />

        {/* Tinted Panoramic Windows & Pillars */}
        {/* Front Windshield */}
        <path
          d="M62 16L72 16C75 16 79 19 82 24L83 26L63 26L62 16Z"
          fill="url(#hatch-glass)"
          stroke="#0f172a"
          strokeWidth="0.8"
        />
        {/* Passenger & Rear Windows */}
        <path
          d="M36 23L46 17L60 17L61 26L35 26Z"
          fill="url(#hatch-glass)"
          stroke="#0f172a"
          strokeWidth="0.8"
        />
        {/* Glass Reflection Streaks */}
        <line x1="48" y1="18" x2="42" y2="25" stroke="#ffffff" strokeWidth="1.4" strokeLinecap="round" opacity="0.75" />
        <line x1="72" y1="18" x2="67" y2="25" stroke="#ffffff" strokeWidth="1.4" strokeLinecap="round" opacity="0.75" />

        {/* Door Shut Lines & Center B-Pillar */}
        <line x1="61" y1="16" x2="61" y2="44" stroke="#093832" strokeWidth="1.2" />
        <line x1="42" y1="26" x2="42" y2="44" stroke="#093832" strokeWidth="0.9" />

        {/* Chrome Door Handles */}
        <rect x="64" y="31" width="5" height="1.6" rx="0.8" fill="#f8fafc" stroke="#334155" strokeWidth="0.6" />
        <rect x="45" y="31" width="5" height="1.6" rx="0.8" fill="#f8fafc" stroke="#334155" strokeWidth="0.6" />

        {/* Side Mirror */}
        <ellipse cx="66" cy="27" rx="3" ry="1.8" fill="url(#hatch-paint-grad)" stroke="#064e3b" strokeWidth="0.8" />
        <ellipse cx="66" cy="27" rx="1.8" ry="1" fill="#38bdf8" />

        {/* Projector LED Headlight Assembly */}
        <path d="M88 29L95 32L92 36L85 34Z" fill="#e0f2fe" stroke="#38bdf8" strokeWidth="1" />
        <circle cx="90" cy="33" r="1.5" fill="#ffffff" />
        {/* Ice-Blue LED DRL Strip */}
        <path d="M86 35L93 36" stroke="#22d3ee" strokeWidth="1.5" strokeLinecap="round" />

        {/* Rear Red Wrap-around Tail Light */}
        <path d="M12 36C12 32 14 30 17 30L17 38L13 38Z" fill="#ef4444" stroke="#991b1b" strokeWidth="0.8" />
        <rect x="13" y="33" width="2" height="3" rx="0.5" fill="#fca5a5" />

        {/* Sporty Rear Roof Spoiler */}
        <path d="M28 20L34 22L28 23Z" fill="#0f172a" />
      </g>
    </svg>
  );
}

export function SedanIcon({ className = "w-12 h-8", ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 110 65"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`animatic-veh sedan-veh ${className}`}
      {...props}
    >
      <defs>
        <radialGradient id="sedan-shadow-grad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#0f172a" stopOpacity="0.42" />
          <stop offset="65%" stopColor="#0f172a" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#0f172a" stopOpacity="0" />
        </radialGradient>

        {/* Executive Midnight Obsidian / Dark Slate Lustrous Paint */}
        <linearGradient id="sedan-paint-grad" x1="10" y1="14" x2="98" y2="46" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#334155" />
          <stop offset="30%" stopColor="#1e293b" />
          <stop offset="70%" stopColor="#0f172a" />
          <stop offset="100%" stopColor="#020617" />
        </linearGradient>

        {/* Specular Executive Light Streak */}
        <linearGradient id="sedan-specular" x1="15" y1="20" x2="95" y2="28" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.75" />
          <stop offset="50%" stopColor="#ffffff" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
        </linearGradient>

        {/* Luxury Smoked Tint Glass */}
        <linearGradient id="sedan-glass" x1="28" y1="12" x2="80" y2="26" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#e2e8f0" stopOpacity="0.8" />
          <stop offset="45%" stopColor="#38bdf8" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#0284c7" stopOpacity="0.65" />
        </linearGradient>

        {/* Diamond Cut Multi-spoke Rim */}
        <radialGradient id="sedan-rim-grad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#f8fafc" />
          <stop offset="60%" stopColor="#475569" />
          <stop offset="100%" stopColor="#0f172a" />
        </radialGradient>

        <radialGradient id="sedan-xenon-beam" cx="0%" cy="50%" r="100%">
          <stop offset="0%" stopColor="#67e8f9" stopOpacity="0.85" />
          <stop offset="50%" stopColor="#38bdf8" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#0284c7" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* 1. Ground Shadow (Extended Wheelbase) */}
      <ellipse cx="55" cy="56" rx="46" ry="5.5" fill="url(#sedan-shadow-grad)" className="veh-road-shadow" />

      {/* 2. Executive Sedan Body (Silky Float) */}
      <g className="veh-chassis">
        {/* Xenon Headlight Beam Flare */}
        <path d="M92 37L109 30L107 48L90 43Z" fill="url(#sedan-xenon-beam)" opacity="0.65" className="veh-light-glow" />

        {/* Rear Wheel (Turbine Alloy) */}
        <g className="veh-wheel-rear">
          <circle cx="27" cy="46" r="12" fill="#020617" stroke="#000000" strokeWidth="2.5" />
          <circle cx="27" cy="46" r="7.8" fill="url(#sedan-rim-grad)" stroke="#334155" strokeWidth="1" />
          {/* Multi-Spoke Turbine Rays */}
          <line x1="27" y1="39" x2="27" y2="53" stroke="#f8fafc" strokeWidth="1.5" />
          <line x1="20" y1="46" x2="34" y2="46" stroke="#f8fafc" strokeWidth="1.5" />
          <line x1="22" y1="41" x2="32" y2="51" stroke="#f8fafc" strokeWidth="1.3" />
          <line x1="32" y1="41" x2="22" y2="51" stroke="#f8fafc" strokeWidth="1.3" />
          <circle cx="27" cy="46" r="3" fill="#0f172a" stroke="#cbd5e1" strokeWidth="0.8" />
          <circle cx="27" cy="46" r="1.2" fill="#ef4444" />
        </g>

        {/* Front Wheel (Turbine Alloy) */}
        <g className="veh-wheel-front">
          <circle cx="81" cy="46" r="12" fill="#020617" stroke="#000000" strokeWidth="2.5" />
          <circle cx="81" cy="46" r="7.8" fill="url(#sedan-rim-grad)" stroke="#334155" strokeWidth="1" />
          <line x1="81" y1="39" x2="81" y2="53" stroke="#f8fafc" strokeWidth="1.5" />
          <line x1="74" y1="46" x2="88" y2="46" stroke="#f8fafc" strokeWidth="1.5" />
          <line x1="76" y1="41" x2="86" y2="51" stroke="#f8fafc" strokeWidth="1.3" />
          <line x1="86" y1="41" x2="76" y2="51" stroke="#f8fafc" strokeWidth="1.3" />
          <circle cx="81" cy="46" r="3" fill="#0f172a" stroke="#cbd5e1" strokeWidth="0.8" />
          <circle cx="81" cy="46" r="1.2" fill="#ef4444" />
        </g>

        {/* Long, Sleek Sedan Body Profile */}
        <path
          d="M8 40C8 36 12 33 18 31L26 31C32 23 42 15 58 15L74 15C82 15 87 22 91 30L96 32C99 34 100 37 100 40L100 43C100 45 98 46 94 46C92 41 72 41 70 46L38 46C36 41 17 41 15 46L10 46C9 46 8 43 8 40Z"
          fill="url(#sedan-paint-grad)"
          stroke="#090d16"
          strokeWidth="1.2"
        />

        {/* Dynamic Specular Body Crease Line */}
        <path
          d="M14 31C30 30 65 29 97 34C88 35 55 33 16 33Z"
          fill="url(#sedan-specular)"
        />

        {/* Chrome Bottom Sill Line */}
        <path d="M38 45L70 45" stroke="#f1f5f9" strokeWidth="1" opacity="0.8" />

        {/* Panoramic Tinted Windows with Chrome Border */}
        {/* Windshield */}
        <path
          d="M62 17L74 17C79 17 84 22 86 28L63 28L62 17Z"
          fill="url(#sedan-glass)"
          stroke="#475569"
          strokeWidth="0.8"
        />
        {/* Passenger Glass */}
        <path
          d="M32 28C36 21 44 17 59 17L60 28L31 28Z"
          fill="url(#sedan-glass)"
          stroke="#475569"
          strokeWidth="0.8"
        />
        {/* Chrome Window Outline Trim */}
        <path d="M31 28C35 20 45 16 75 16C80 16 85 21 87 28" stroke="#f8fafc" strokeWidth="1" fill="none" opacity="0.9" />

        {/* Specular Window Reflection Glint */}
        <line x1="50" y1="18" x2="44" y2="27" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
        <line x1="74" y1="18" x2="68" y2="27" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />

        {/* Center Pillar & Door Lines */}
        <line x1="61" y1="17" x2="61" y2="44" stroke="#1e293b" strokeWidth="1.4" />
        <line x1="44" y1="28" x2="44" y2="44" stroke="#1e293b" strokeWidth="0.9" />

        {/* Chrome Door Handles */}
        <rect x="65" y="32" width="5.5" height="1.6" rx="0.8" fill="#f8fafc" stroke="#475569" strokeWidth="0.6" />
        <rect x="47" y="32" width="5.5" height="1.6" rx="0.8" fill="#f8fafc" stroke="#475569" strokeWidth="0.6" />

        {/* Chrome Side Mirror with LED repeater */}
        <ellipse cx="67" cy="28.5" rx="3.2" ry="1.8" fill="#1e293b" stroke="#f8fafc" strokeWidth="0.8" />
        <line x1="65" y1="28.5" x2="69" y2="28.5" stroke="#38bdf8" strokeWidth="0.8" />

        {/* Jewel-Eye LED Matrix Headlight Assembly */}
        <path d="M91 32L98 34L95 38L88 36Z" fill="#e0f2fe" stroke="#38bdf8" strokeWidth="1" />
        <circle cx="91.5" cy="34.5" r="1.2" fill="#ffffff" />
        <circle cx="94.5" cy="35.5" r="1.2" fill="#ffffff" />
        <path d="M89 37L96 38" stroke="#67e8f9" strokeWidth="1.5" strokeLinecap="round" />

        {/* Horizontal Chrome Grille Slats */}
        <path d="M96 38L99 39" stroke="#cbd5e1" strokeWidth="1.2" />
        <path d="M94 40L98 41" stroke="#cbd5e1" strokeWidth="1.2" />

        {/* Wrap-around Red LED Tail Light */}
        <path d="M8 35C8 32 10 30 14 30L14 37L9 37Z" fill="#ef4444" stroke="#991b1b" strokeWidth="0.8" />
        <line x1="9" y1="33" x2="13" y2="33" stroke="#fca5a5" strokeWidth="1" />

        {/* Shark Fin Roof Antenna */}
        <path d="M37 16L40 13L42 16Z" fill="#0f172a" />
      </g>
    </svg>
  );
}

export function SuvIcon({ className = "w-12 h-8", ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 110 65"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`animatic-veh suv-veh ${className}`}
      {...props}
    >
      <defs>
        <radialGradient id="suv-shadow-grad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#0f172a" stopOpacity="0.4" />
          <stop offset="65%" stopColor="#0f172a" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#0f172a" stopOpacity="0" />
        </radialGradient>

        {/* Titanium Deep Emerald / Teal SUV Paint */}
        <linearGradient id="suv-paint-grad" x1="10" y1="10" x2="96" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0f766e" />
          <stop offset="40%" stopColor="#0d9488" />
          <stop offset="80%" stopColor="#064e3b" />
          <stop offset="100%" stopColor="#042f2e" />
        </linearGradient>

        {/* Roof Rails Chrome */}
        <linearGradient id="suv-rail-grad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#cbd5e1" />
          <stop offset="50%" stopColor="#f8fafc" />
          <stop offset="100%" stopColor="#94a3b8" />
        </linearGradient>

        <linearGradient id="suv-glass" x1="28" y1="12" x2="85" y2="28" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ccfbf1" stopOpacity="0.85" />
          <stop offset="50%" stopColor="#2dd4bf" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#0f766e" stopOpacity="0.7" />
        </linearGradient>

        <radialGradient id="suv-alloy-rim" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#f8fafc" />
          <stop offset="55%" stopColor="#64748b" />
          <stop offset="100%" stopColor="#0f172a" />
        </radialGradient>

        <radialGradient id="suv-headlight-flare" cx="0%" cy="50%" r="100%">
          <stop offset="0%" stopColor="#fef08a" stopOpacity="0.85" />
          <stop offset="50%" stopColor="#22d3ee" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#0f766e" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* 1. Ground Shadow (Large Footprint) */}
      <ellipse cx="54" cy="56" rx="45" ry="6" fill="url(#suv-shadow-grad)" className="veh-road-shadow" />

      {/* 2. Muscular SUV Chassis */}
      <g className="veh-chassis">
        {/* Headlight Flare */}
        <path d="M88 34L108 26L105 44L86 40Z" fill="url(#suv-headlight-flare)" opacity="0.65" className="veh-light-glow" />

        {/* Heavy-Duty Rugged Alloy Wheels (Rear) */}
        <g className="veh-wheel-rear">
          <circle cx="28" cy="46" r="12.5" fill="#0f172a" stroke="#000000" strokeWidth="2.8" />
          <circle cx="28" cy="46" r="8" fill="url(#suv-alloy-rim)" stroke="#334155" strokeWidth="1" />
          {/* Rugged 6-Spoke Hub */}
          <line x1="28" y1="39" x2="28" y2="53" stroke="#f1f5f9" strokeWidth="1.8" />
          <line x1="21" y1="46" x2="35" y2="46" stroke="#f1f5f9" strokeWidth="1.8" />
          <line x1="23" y1="42" x2="33" y2="50" stroke="#cbd5e1" strokeWidth="1.5" />
          <line x1="33" y1="42" x2="23" y2="50" stroke="#cbd5e1" strokeWidth="1.5" />
          <circle cx="28" cy="46" r="3.4" fill="#0f172a" stroke="#cbd5e1" strokeWidth="1" />
        </g>

        {/* Heavy-Duty Rugged Alloy Wheels (Front) */}
        <g className="veh-wheel-front">
          <circle cx="78" cy="46" r="12.5" fill="#0f172a" stroke="#000000" strokeWidth="2.8" />
          <circle cx="78" cy="46" r="8" fill="url(#suv-alloy-rim)" stroke="#334155" strokeWidth="1" />
          <line x1="78" y1="39" x2="78" y2="53" stroke="#f1f5f9" strokeWidth="1.8" />
          <line x1="71" y1="46" x2="85" y2="46" stroke="#f1f5f9" strokeWidth="1.8" />
          <line x1="73" y1="42" x2="83" y2="50" stroke="#cbd5e1" strokeWidth="1.5" />
          <line x1="83" y1="42" x2="73" y2="50" stroke="#cbd5e1" strokeWidth="1.5" />
          <circle cx="78" cy="46" r="3.4" fill="#0f172a" stroke="#cbd5e1" strokeWidth="1" />
        </g>

        {/* Black Protective Wheel Arch Cladding */}
        <path d="M17 46C18 38 38 38 39 46" stroke="#0f172a" strokeWidth="3" fill="none" />
        <path d="M67 46C68 38 88 38 89 46" stroke="#0f172a" strokeWidth="3" fill="none" />

        {/* Upright Bold SUV Body Structure */}
        <path
          d="M10 40C10 34 14 30 20 28L24 16C26 12 32 11 48 11L72 11C77 11 82 15 85 20L91 26C95 28 97 31 97 36L97 42C97 44 95 45 91 45C89 41 69 41 67 45L39 45C37 41 17 41 15 45L11 45C10 45 10 43 10 40Z"
          fill="url(#suv-paint-grad)"
          stroke="#064e3b"
          strokeWidth="1.2"
        />

        {/* Integrated Silver Roof Luggage Rails */}
        <path d="M28 8L76 8" stroke="url(#suv-rail-grad)" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M33 8L33 11M52 8L52 11M70 8L70 11" stroke="#64748b" strokeWidth="1.8" />

        {/* 3-Row Panoramic Tinted Windows */}
        {/* Windshield */}
        <path
          d="M66 14L74 14C78 14 82 18 84 23L85 25L67 25L66 14Z"
          fill="url(#suv-glass)"
          stroke="#0f172a"
          strokeWidth="0.8"
        />
        {/* Middle Passenger Window */}
        <path
          d="M46 14L63 14L64 25L46 25Z"
          fill="url(#suv-glass)"
          stroke="#0f172a"
          strokeWidth="0.8"
        />
        {/* 3rd Row Quarter Window */}
        <path
          d="M26 18L43 14L43 25L26 25Z"
          fill="url(#suv-glass)"
          stroke="#0f172a"
          strokeWidth="0.8"
        />

        {/* Window Reflection Streaks */}
        <line x1="36" y1="16" x2="31" y2="24" stroke="#ffffff" strokeWidth="1.4" opacity="0.7" />
        <line x1="56" y1="16" x2="51" y2="24" stroke="#ffffff" strokeWidth="1.4" opacity="0.7" />
        <line x1="76" y1="16" x2="71" y2="24" stroke="#ffffff" strokeWidth="1.4" opacity="0.7" />

        {/* Structural Door Pillars */}
        <line x1="65" y1="13" x2="65" y2="43" stroke="#093832" strokeWidth="1.4" />
        <line x1="45" y1="13" x2="45" y2="43" stroke="#093832" strokeWidth="1.4" />

        {/* Chrome Door Handles */}
        <rect x="68" y="30" width="5.5" height="1.8" rx="0.9" fill="#f8fafc" stroke="#334155" strokeWidth="0.6" />
        <rect x="49" y="30" width="5.5" height="1.8" rx="0.9" fill="#f8fafc" stroke="#334155" strokeWidth="0.6" />

        {/* Side Footstep Cladding Board */}
        <rect x="40" y="44" width="26" height="2" rx="1" fill="#334155" stroke="#0f172a" strokeWidth="0.5" />

        {/* Dual-Barrel High-Intensity LED Headlights */}
        <path d="M86 28L94 31L92 36L85 34Z" fill="#e0f2fe" stroke="#38bdf8" strokeWidth="1" />
        <circle cx="88.5" cy="32" r="1.4" fill="#ffffff" />
        <circle cx="91.5" cy="33.5" r="1.4" fill="#ffffff" />

        {/* Commanding Upright Chrome SUV Grille */}
        <path d="M93 36L96 37L94 40L92 39Z" fill="#cbd5e1" stroke="#64748b" strokeWidth="0.8" />
        <line x1="93" y1="38" x2="95" y2="38.5" stroke="#0f172a" strokeWidth="1" />

        {/* Rear LED Light & Spoiler */}
        <path d="M10 34C10 30 12 28 15 28L15 36L11 36Z" fill="#ef4444" stroke="#991b1b" strokeWidth="0.8" />
        <path d="M22 14L28 13L27 16Z" fill="#0f172a" />
      </g>
    </svg>
  );
}

export function ParcelDeliveryIcon({ className = "w-12 h-8", ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 110 65"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`animatic-veh parcel-veh ${className}`}
      {...props}
    >
      <defs>
        <radialGradient id="parcel-shadow-grad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#0f172a" stopOpacity="0.32" />
          <stop offset="60%" stopColor="#0f172a" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#0f172a" stopOpacity="0" />
        </radialGradient>

        {/* Branded Bhavo Express Delivery Box (Amber & Gold) */}
        <linearGradient id="parcel-box-grad" x1="10" y1="12" x2="38" y2="36" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="25%" stopColor="#f59e0b" />
          <stop offset="80%" stopColor="#d97706" />
          <stop offset="100%" stopColor="#b45309" />
        </linearGradient>

        {/* Electric Delivery Scooter Teal */}
        <linearGradient id="scooter-paint" x1="32" y1="20" x2="82" y2="45" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#14b8a6" />
          <stop offset="50%" stopColor="#0d9488" />
          <stop offset="100%" stopColor="#064e3b" />
        </linearGradient>

        <radialGradient id="parcel-light-beam" cx="0%" cy="50%" r="100%">
          <stop offset="0%" stopColor="#fef08a" stopOpacity="0.8" />
          <stop offset="50%" stopColor="#f59e0b" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#d97706" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* 1. Ground Shadow */}
      <ellipse cx="53" cy="56" rx="42" ry="5.5" fill="url(#parcel-shadow-grad)" className="veh-road-shadow" />

      {/* 2. Delivery Scooter & Express Box */}
      <g className="veh-chassis">
        {/* Speed Headlight Projection */}
        <path d="M78 28L104 22L101 40L77 34Z" fill="url(#parcel-light-beam)" opacity="0.6" className="veh-light-glow" />

        {/* Rear Wheel */}
        <g className="veh-wheel-rear">
          <circle cx="26" cy="44" r="12" fill="#0f172a" stroke="#000000" strokeWidth="2.2" />
          <circle cx="26" cy="44" r="7" fill="#64748b" stroke="#334155" strokeWidth="1" />
          <circle cx="26" cy="44" r="3" fill="#cbd5e1" />
          <circle cx="26" cy="44" r="1.4" fill="#0d9488" />
        </g>

        {/* Front Wheel */}
        <g className="veh-wheel-front">
          <circle cx="80" cy="44" r="12" fill="#0f172a" stroke="#000000" strokeWidth="2.2" />
          <circle cx="80" cy="44" r="7" fill="#64748b" stroke="#334155" strokeWidth="1" />
          <circle cx="80" cy="44" r="3" fill="#cbd5e1" />
          <circle cx="80" cy="44" r="1.4" fill="#0d9488" />
        </g>
        <path d="M72 34C74 30 84 30 87 36" stroke="#0d9488" strokeWidth="3" strokeLinecap="round" />

        {/* Electric Scooter Chassis & Floorboard */}
        <path
          d="M26 44L44 44L52 38L62 38L72 24L68 20L60 36L46 36L38 41L26 44Z"
          fill="url(#scooter-paint)"
          stroke="#064e3b"
          strokeWidth="1"
        />

        {/* Comfortable Saddle */}
        <path d="M38 31C42 29 50 30 54 34L40 35Z" fill="#1e293b" stroke="#0f172a" strokeWidth="1" />

        {/* Front Steering Column & Cowl */}
        <path d="M68 20L76 29L74 34L67 27Z" fill="url(#scooter-paint)" stroke="#064e3b" strokeWidth="1" />
        <path d="M67 19L64 14" stroke="#0f172a" strokeWidth="2.2" strokeLinecap="round" />
        <ellipse cx="62" cy="12" rx="2" ry="1.4" fill="#38bdf8" stroke="#0f172a" strokeWidth="0.8" />

        {/* LED Projector Headlamp */}
        <ellipse cx="76.5" cy="29.5" rx="2.2" ry="3" fill="#fef08a" stroke="#f59e0b" strokeWidth="1" />
        <circle cx="76.5" cy="29.5" r="1.2" fill="#ffffff" />

        {/* Rear Courier Rack Carrier */}
        <path d="M22 36L38 36L38 40L20 40Z" fill="#334155" stroke="#1e293b" strokeWidth="0.8" />

        {/* BHAVO Express Delivery Cargo Box */}
        <rect
          x="14"
          y="15"
          width="26"
          height="22"
          rx="3.5"
          fill="url(#parcel-box-grad)"
          stroke="#92400e"
          strokeWidth="1.2"
        />
        {/* Box Security Straps */}
        <line x1="27" y1="15" x2="27" y2="37" stroke="#b45309" strokeWidth="1.8" />
        <line x1="14" y1="26" x2="40" y2="26" stroke="#b45309" strokeWidth="1.8" />
        {/* Express Lightning Bolt Badge */}
        <path
          d="M28 19L24 25H28L26 31L32 23H27L28 19Z"
          fill="#ffffff"
          stroke="#b45309"
          strokeWidth="0.6"
        />
        {/* Lock Latch */}
        <rect x="25.5" y="24.5" width="3" height="3" rx="0.5" fill="#f8fafc" stroke="#78350f" strokeWidth="0.6" />
      </g>
    </svg>
  );
}

/**
 * Universal VehicleIcon dispatcher matching any ID or category string.
 */
export function VehicleIcon({
  type,
  id,
  className = "w-12 h-8",
  ...props
}: {
  type?: string;
  id?: string;
  className?: string;
} & React.SVGProps<SVGSVGElement>) {
  const normalized = (id || type || "").toLowerCase();

  if (normalized.includes("bike") || normalized === "motorcycle" || normalized === "moto") {
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

  return <SedanIcon className={className} {...props} />;
}
