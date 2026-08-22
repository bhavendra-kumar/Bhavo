"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SignUp() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("RIDER");
  const [focused, setFocused] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string; confirmPassword?: string; form?: string }>({});
  const [shake, setShake] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const validate = () => {
    const e: { name?: string; email?: string; password?: string; confirmPassword?: string } = {};
    if (!name.trim()) {
      e.name = "Full name is required.";
    }
    if (!email.trim()) {
      e.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      e.email = "Please enter a valid email address.";
    }
    if (!password) {
      e.password = "Password is required.";
    } else if (password.length < 8) {
      e.password = "Password must be at least 8 characters.";
    }
    if (!confirmPassword) {
      e.confirmPassword = "Confirm password is required.";
    } else if (password !== confirmPassword) {
      e.confirmPassword = "Passwords do not match.";
    }
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }
    setErrors({});
    setLoading(true);
    
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        setErrors({ form: data.message || "Registration failed" });
        setShake(true);
        setTimeout(() => setShake(false), 500);
      } else {
        router.push("/login?registered=true");
      }
    } catch {
      setErrors({ form: "Something went wrong. Please try again." });
      setShake(true);
      setTimeout(() => setShake(false), 500);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @keyframes car-drive {
          0%   { transform: translateX(-260px); }
          100% { transform: translateX(calc(50vw + 60px)); }
        }
        @keyframes lane-dash {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-96px); }
        }
        @keyframes wheel-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes headlight-beam {
          0%, 100% { opacity: 0.55; }
          50%       { opacity: 0.9; }
        }
        @keyframes title-glow {
          0%, 100% { filter: drop-shadow(0 0 24px rgba(20,184,166,0.45)); }
          50%       { filter: drop-shadow(0 0 56px rgba(20,184,166,0.8)); }
        }
        @keyframes twinkle {
          0%, 100% { opacity: 0.2; transform: scale(1); }
          50%       { opacity: 1;   transform: scale(1.4); }
        }
        @keyframes win-blink {
          0%, 90%, 100% { opacity: 1; }
          92%, 98%       { opacity: 0; }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(30px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes expandDown {
          from { opacity: 0; max-height: 0; }
          to   { opacity: 1; max-height: 400px; }
        }
        .car-drive  { animation: car-drive 5.5s linear infinite; }
        .wheel-spin { animation: wheel-spin 0.4s linear infinite; transform-box: fill-box; transform-origin: center; }
        .lane-dash  { animation: lane-dash 0.9s linear infinite; }
        .headlight  { animation: headlight-beam 2s ease-in-out infinite; }
        .bhavo-title { animation: title-glow 3s ease-in-out infinite; }
        .form-card  { animation: slideIn 0.7s cubic-bezier(0.22,1,0.36,1) both; }
        .email-section { animation: expandDown 0.4s ease forwards; overflow: hidden; }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%       { transform: translateX(-8px); }
          40%       { transform: translateX(8px); }
          60%       { transform: translateX(-5px); }
          80%       { transform: translateX(5px); }
        }
        .form-shake { animation: shake 0.45s cubic-bezier(0.36,0.07,0.19,0.97) both; }
        .field-error { font-size: 12px; color: #ef4444; margin-top: 5px; display: flex; align-items: center; gap: 4px; }
        @media (max-width: 1023px) {
          .auth-scene { display: none !important; }
          .auth-form-col { background: linear-gradient(135deg, #030f0f 0%, #042f2e 60%, #064e3b 100%) !important; }
          .mobile-bhavo { display: block !important; }
        }
      `}</style>

      <div style={{ display: "flex", minHeight: "100vh", fontFamily: "var(--font-geist-sans), -apple-system, sans-serif", alignItems: "flex-start" }}>

        {/* ════════════════════════════════════════════
            LEFT — Animated Night City Scene
        ════════════════════════════════════════════ */}
        <div className="auth-scene" style={{
          position: "sticky", top: 0, width: "52%", flexShrink: 0, height: "100vh",
          background: "linear-gradient(180deg, #020b0b 0%, #021a1a 45%, #042f2e 100%)",
          overflow: "hidden", display: "flex", flexDirection: "column",
        }}>
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(20,184,166,0.12) 0%, transparent 70%)" }} />

          {/* Stars */}
          {[
            { x: 8, y: 5, d: "2.2s", dl: "0.2s" }, { x: 22, y: 9, d: "1.7s", dl: "0.8s" },
            { x: 38, y: 3, d: "2.6s", dl: "0s" }, { x: 55, y: 7, d: "1.9s", dl: "1.1s" },
            { x: 68, y: 12, d: "2.4s", dl: "0.4s" }, { x: 82, y: 6, d: "1.5s", dl: "0.9s" },
            { x: 91, y: 10, d: "2s", dl: "0.3s" }, { x: 15, y: 14, d: "2.7s", dl: "0.6s" },
            { x: 45, y: 13, d: "1.8s", dl: "1.3s" }, { x: 75, y: 15, d: "2.3s", dl: "0.1s" },
            { x: 30, y: 4, d: "3.1s", dl: "1.6s" }, { x: 60, y: 11, d: "1.6s", dl: "0.7s" },
          ].map((s, i) => (
            <div key={i} style={{
              position: "absolute", left: `${s.x}%`, top: `${s.y}%`,
              width: 3, height: 3, borderRadius: "50%", background: "#fff",
              animation: `twinkle ${s.d} ease-in-out infinite`,
              animationDelay: s.dl,
            }} />
          ))}

          {/* BHAVO Giant Title */}
          <div style={{ position: "relative", zIndex: 10, padding: "44px 48px 0" }}>
            <Link href="/" style={{ textDecoration: "none" }}>
              <div className="bhavo-title" style={{
                fontSize: "clamp(64px, 7vw, 96px)", fontWeight: 900,
                letterSpacing: "-4px", lineHeight: 1,
                background: "linear-gradient(135deg, #ffffff 0%, #5eead4 40%, #34d399 100%)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                marginBottom: 10,
              }}>
                BHAVO
              </div>
            </Link>
            <p style={{ color: "rgba(94,234,212,0.8)", fontSize: 13, fontWeight: 600, letterSpacing: "3px", textTransform: "uppercase" }}>
              Your City. Your Ride.
            </p>
          </div>

          {/* City Skyline */}
          <div style={{ position: "absolute", bottom: 200, left: 0, right: 0, display: "flex", alignItems: "flex-end" }}>
            {[
              { w: 48, h: 200, x: 0, col: "#071f1f", wins: [[14, 30], [14, 65], [14, 100], [14, 140], [14, 175]], d: "2.1s" },
              { w: 36, h: 140, x: 52, col: "#082020", wins: [[10, 25], [10, 60], [10, 95], [10, 120]], d: "1.7s" },
              { w: 60, h: 250, x: 92, col: "#062020", wins: [[14, 20], [14, 55], [14, 90], [14, 125], [14, 160], [14, 200], [38, 20], [38, 55], [38, 90], [38, 125], [38, 160], [38, 200]], d: "2.8s" },
              { w: 40, h: 160, x: 156, col: "#071e1e", wins: [[10, 30], [10, 65], [10, 100], [10, 135]], d: "1.4s" },
              { w: 52, h: 210, x: 200, col: "#062222", wins: [[14, 30], [14, 65], [14, 100], [14, 135], [14, 170], [34, 30], [34, 65], [34, 100]], d: "3s" },
              { w: 44, h: 155, x: 256, col: "#071f1f", wins: [[12, 30], [12, 65], [12, 100], [12, 130]], d: "1.9s" },
              { w: 70, h: 260, x: 304, col: "#061c1c", wins: [[15, 20], [15, 55], [15, 90], [15, 125], [15, 160], [15, 210], [42, 20], [42, 55], [42, 90], [42, 125], [42, 160], [42, 210]], d: "2.4s" },
              { w: 36, h: 130, x: 378, col: "#082424", wins: [[10, 30], [10, 65], [10, 95]], d: "1.6s" },
              { w: 48, h: 180, x: 418, col: "#072020", wins: [[12, 30], [12, 65], [12, 100], [12, 145]], d: "2.9s" },
              { w: 40, h: 220, x: 470, col: "#061e1e", wins: [[12, 30], [12, 65], [12, 100], [12, 140], [12, 180]], d: "1.5s" },
            ].map((b, bi) => (
              <div key={bi} style={{ position: "absolute", left: b.x, bottom: 0, width: b.w, height: b.h, background: b.col }}>
                {b.wins.map(([wx, wy], wi) => (
                  <div key={wi} style={{
                    position: "absolute", left: wx, top: b.h - wy - 14,
                    width: 8, height: 10, background: "rgba(254,249,195,0.65)",
                    animation: `win-blink ${b.d} ease-in-out infinite`,
                    animationDelay: `${(bi * 0.3 + wi * 0.7) % 3}s`,
                  }} />
                ))}
              </div>
            ))}
            <div style={{ position: "absolute", right: 0, bottom: 0, width: 200, height: 290, background: "#051a1a" }} />
            <div style={{ position: "absolute", right: 80, bottom: 0, width: 120, height: 210, background: "#062020" }} />
          </div>

          {/* Road Section */}
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 200 }}>
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 200, background: "linear-gradient(180deg, #111827 0%, #0d1117 100%)" }} />
            <div style={{ position: "absolute", bottom: 195, left: 0, right: 0, height: 5, background: "rgba(20,184,166,0.6)" }} />

            {/* Lane dashes */}
            <div className="lane-dash" style={{ position: "absolute", bottom: 90, left: 0, display: "flex", gap: 48 }}>
              {Array.from({ length: 20 }).map((_, i) => (
                <div key={i} style={{ width: 48, height: 5, background: "rgba(255,255,255,0.25)", borderRadius: 3, flexShrink: 0 }} />
              ))}
            </div>

            {/* Headlight glow on road */}
            <div className="headlight" style={{
              position: "absolute", bottom: 50, left: "12%",
              width: 200, height: 80,
              background: "radial-gradient(ellipse 100% 60% at 0% 50%, rgba(254,249,195,0.25) 0%, transparent 100%)",
            }} />

            {/* Car */}
            <div className="car-drive" style={{ position: "absolute", bottom: 88, left: 0 }}>
              <svg viewBox="0 0 220 72" width="220" height="72" style={{ display: "block", overflow: "visible", transform: "scaleX(-1)" }}>
                {/* Speed lines — trail behind (right side when flipped) */}
                <rect x="228" y="26" width="72" height="3" rx="2" fill="rgba(20,184,166,0.5)" opacity="0.7" />
                <rect x="228" y="36" width="52" height="2" rx="1" fill="rgba(20,184,166,0.3)" opacity="0.5" />
                <rect x="228" y="44" width="80" height="2" rx="1" fill="rgba(20,184,166,0.4)" opacity="0.6" />

                {/* Shadow */}
                <ellipse cx="110" cy="70" rx="88" ry="5" fill="rgba(0,0,0,0.5)" />

                {/* Body */}
                <path d="M12 44 Q12 32 26 32 L78 32 Q92 10 120 10 L160 10 Q178 10 188 32 L198 32 Q208 32 208 44 L208 58 Q203 64 196 64 L24 64 Q16 64 12 58 Z" fill="#0d9488" />
                <path d="M78 32 Q90 12 118 12 L158 12 Q174 12 182 32" fill="#0a7a6e" />
                <path d="M82 32 Q92 14 117 14 L152 14 Q166 14 174 32" fill="rgba(186,230,253,0.45)" stroke="rgba(186,230,253,0.2)" strokeWidth="1" />
                <rect x="84" y="16" width="32" height="14" rx="3" fill="rgba(186,230,253,0.3)" />
                <rect x="120" y="16" width="30" height="14" rx="3" fill="rgba(186,230,253,0.3)" />
                <line x1="120" y1="34" x2="120" y2="62" stroke="rgba(0,0,0,0.25)" strokeWidth="1.5" />
                <rect x="96" y="46" width="14" height="3" rx="1.5" fill="rgba(255,255,255,0.25)" />
                <rect x="128" y="46" width="14" height="3" rx="1.5" fill="rgba(255,255,255,0.25)" />
                <rect x="2" y="38" width="14" height="7" rx="2" fill="#fef9c3" />
                <ellipse cx="0" cy="41" rx="16" ry="8" fill="rgba(254,249,195,0.35)" className="headlight" />
                <rect x="200" y="38" width="10" height="7" rx="2" fill="#f87171" />
                <rect x="12" y="53" width="196" height="3" rx="1" fill="rgba(20,184,166,0.4)" />

                {/* Front wheel */}
                <circle cx="54" cy="64" r="14" fill="#111827" />
                <g className="wheel-spin" style={{ transformOrigin: "54px 64px" }}>
                  <circle cx="54" cy="64" r="9" fill="#1e293b" />
                  <line x1="54" y1="56" x2="54" y2="72" stroke="#374151" strokeWidth="2" />
                  <line x1="46" y1="64" x2="62" y2="64" stroke="#374151" strokeWidth="2" />
                  <circle cx="54" cy="64" r="3" fill="#475569" />
                </g>

                {/* Rear wheel */}
                <circle cx="168" cy="64" r="14" fill="#111827" />
                <g className="wheel-spin" style={{ transformOrigin: "168px 64px" }}>
                  <circle cx="168" cy="64" r="9" fill="#1e293b" />
                  <line x1="168" y1="56" x2="168" y2="72" stroke="#374151" strokeWidth="2" />
                  <line x1="160" y1="64" x2="176" y2="64" stroke="#374151" strokeWidth="2" />
                  <circle cx="168" cy="64" r="3" fill="#475569" />
                </g>
              </svg>
            </div>

            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 80, background: "linear-gradient(180deg, transparent 0%, rgba(20,184,166,0.04) 100%)" }} />
          </div>


          <div className="noise-overlay" style={{ opacity: 0.035, zIndex: 5 }} />
        </div>

        {/* ════════════════════════════════════════════
            RIGHT — Sign Up Form
        ════════════════════════════════════════════ */}
        <div className="auth-form-col" style={{
          flex: 1, minWidth: 0, display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          padding: "40px 24px",
          background: "#f0fdf9",
          position: "relative", overflowY: "auto", overflowX: "hidden",
        }}>
          <div style={{ position: "absolute", top: "-15%", right: "-10%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(20,184,166,0.08) 0%, transparent 70%)", pointerEvents: "none" }} />
          <div style={{ position: "absolute", bottom: "-15%", left: "-10%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(16,185,129,0.06) 0%, transparent 70%)", pointerEvents: "none" }} />

          {/* Mobile BHAVO */}
          <div style={{ display: "none" }} className="mobile-bhavo">
            <Link href="/" style={{ textDecoration: "none" }}>
              <div style={{ fontSize: 48, fontWeight: 900, letterSpacing: "-2px", background: "linear-gradient(135deg, #0d9488 0%, #34d399 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", marginBottom: 32, textAlign: "center" }}>
                BHAVO
              </div>
            </Link>
          </div>

          {/* Card */}
          <div className={`form-card${shake ? " form-shake" : ""}`} style={{
            width: "100%", maxWidth: 400,
            background: "#ffffff", borderRadius: 28,
            padding: "44px 40px 40px",
            boxShadow: "0 0 0 1px rgba(20,184,166,0.08), 0 4px 6px rgba(0,0,0,0.03), 0 16px 48px rgba(0,0,0,0.07), 0 40px 80px rgba(0,0,0,0.05)",
            position: "relative", zIndex: 10,
          }}>
            {/* Top accent bar */}
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, background: "linear-gradient(90deg, #0d9488, #34d399, #0d9488)", borderRadius: "28px 28px 0 0", backgroundSize: "200% 100%", animation: "lane-dash 3s linear infinite" }} />

            <div style={{ marginBottom: 28 }}>
              <h2 style={{ fontSize: 26, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.8px", marginBottom: 6 }}>
                Create an account
              </h2>
              <p style={{ color: "#64748b", fontSize: 14, lineHeight: 1.5 }}>
                Join Bhavo and start your journey today.
              </p>
            </div>

            {/* Email Form */}
            <form onSubmit={handleSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {/* Name */}
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 7, letterSpacing: "0.4px", textTransform: "uppercase" }} htmlFor="signup-name">Full name</label>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: errors.name ? "#ef4444" : focused === "name" ? "#0d9488" : "#94a3b8", transition: "color 0.2s", pointerEvents: "none" }}>
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  </span>
                  <input id="signup-name" type="text"
                    value={name}
                    onChange={(e) => { setName(e.target.value); if (errors.name) setErrors(prev => ({ ...prev, name: undefined })); }}
                    onFocus={() => setFocused("name")} onBlur={() => setFocused(null)}
                    placeholder="John Doe"
                    style={{ width: "100%", paddingLeft: 38, paddingRight: 14, paddingTop: 12, paddingBottom: 12, borderRadius: 12, fontSize: 14, color: "#0f172a", outline: "none", fontFamily: "inherit", border: errors.name ? "1.5px solid #ef4444" : focused === "name" ? "1.5px solid #0d9488" : "1.5px solid #e2e8f0", background: errors.name ? "#fff5f5" : focused === "name" ? "#fff" : "#f8fafc", boxShadow: errors.name ? "0 0 0 4px rgba(239,68,68,0.1)" : focused === "name" ? "0 0 0 4px rgba(13,148,136,0.1)" : "none", transition: "all 0.2s ease", boxSizing: "border-box" }} />
                </div>
                {errors.name && <p className="field-error"><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>{errors.name}</p>}
              </div>

              {/* Email */}
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 7, letterSpacing: "0.4px", textTransform: "uppercase" }} htmlFor="signup-email">Email</label>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: errors.email ? "#ef4444" : focused === "email" ? "#0d9488" : "#94a3b8", transition: "color 0.2s", pointerEvents: "none" }}>
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  </span>
                  <input id="signup-email" type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); if (errors.email) setErrors(prev => ({ ...prev, email: undefined })); }}
                    onFocus={() => setFocused("email")} onBlur={() => setFocused(null)}
                    placeholder="Enter your Email"
                    style={{ width: "100%", paddingLeft: 38, paddingRight: 14, paddingTop: 12, paddingBottom: 12, borderRadius: 12, fontSize: 14, color: "#0f172a", outline: "none", fontFamily: "inherit", border: errors.email ? "1.5px solid #ef4444" : focused === "email" ? "1.5px solid #0d9488" : "1.5px solid #e2e8f0", background: errors.email ? "#fff5f5" : focused === "email" ? "#fff" : "#f8fafc", boxShadow: errors.email ? "0 0 0 4px rgba(239,68,68,0.1)" : focused === "email" ? "0 0 0 4px rgba(13,148,136,0.1)" : "none", transition: "all 0.2s ease", boxSizing: "border-box" }} />
                </div>
                {errors.email && <p className="field-error"><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>{errors.email}</p>}
              </div>

              {/* Password */}
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 7, letterSpacing: "0.4px", textTransform: "uppercase" }} htmlFor="signup-password">Password</label>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: errors.password ? "#ef4444" : focused === "password" ? "#0d9488" : "#94a3b8", transition: "color 0.2s", pointerEvents: "none" }}>
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                  </span>
                  <input id="signup-password" type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); if (errors.password) setErrors(prev => ({ ...prev, password: undefined })); }}
                    onFocus={() => setFocused("password")} onBlur={() => setFocused(null)}
                    placeholder="Enter Your Password"
                    style={{ width: "100%", paddingLeft: 38, paddingRight: 40, paddingTop: 12, paddingBottom: 12, borderRadius: 12, fontSize: 14, color: "#0f172a", outline: "none", fontFamily: "inherit", border: errors.password ? "1.5px solid #ef4444" : focused === "password" ? "1.5px solid #0d9488" : "1.5px solid #e2e8f0", background: errors.password ? "#fff5f5" : focused === "password" ? "#fff" : "#f8fafc", boxShadow: errors.password ? "0 0 0 4px rgba(239,68,68,0.1)" : focused === "password" ? "0 0 0 4px rgba(13,148,136,0.1)" : "none", transition: "all 0.2s ease", boxSizing: "border-box" }} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    style={{ position: "absolute", right: 13, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: 0, display: "flex" }}>
                    {showPassword ? (
                      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                    ) : (
                      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    )}
                  </button>
                </div>
                {errors.password
                  ? <p className="field-error"><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>{errors.password}</p>
                  : <p style={{ marginTop: 6, fontSize: 11, color: "#94a3b8" }}>Must be at least 8 characters long.</p>
                }
              </div>

              {/* Confirm Password */}
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 7, letterSpacing: "0.4px", textTransform: "uppercase" }} htmlFor="signup-confirm-password">Confirm Password</label>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: errors.confirmPassword ? "#ef4444" : focused === "confirmPassword" ? "#0d9488" : "#94a3b8", transition: "color 0.2s", pointerEvents: "none" }}>
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                  </span>
                  <input id="signup-confirm-password" type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => { setConfirmPassword(e.target.value); if (errors.confirmPassword) setErrors(prev => ({ ...prev, confirmPassword: undefined })); }}
                    onFocus={() => setFocused("confirmPassword")} onBlur={() => setFocused(null)}
                    placeholder="Confirm Your Password"
                    style={{ width: "100%", paddingLeft: 38, paddingRight: 40, paddingTop: 12, paddingBottom: 12, borderRadius: 12, fontSize: 14, color: "#0f172a", outline: "none", fontFamily: "inherit", border: errors.confirmPassword ? "1.5px solid #ef4444" : focused === "confirmPassword" ? "1.5px solid #0d9488" : "1.5px solid #e2e8f0", background: errors.confirmPassword ? "#fff5f5" : focused === "confirmPassword" ? "#fff" : "#f8fafc", boxShadow: errors.confirmPassword ? "0 0 0 4px rgba(239,68,68,0.1)" : focused === "confirmPassword" ? "0 0 0 4px rgba(13,148,136,0.1)" : "none", transition: "all 0.2s ease", boxSizing: "border-box" }} />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={{ position: "absolute", right: 13, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: 0, display: "flex" }}>
                    {showConfirmPassword ? (
                      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                    ) : (
                      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="field-error"><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>{errors.confirmPassword}</p>
                )}
              </div>

              {/* Role Selection */}
              <div style={{ marginTop: 4, marginBottom: 4 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 7, letterSpacing: "0.4px", textTransform: "uppercase" }}>I am a...</label>
                <div style={{ display: "flex", background: "#f1f5f9", borderRadius: 12, padding: 4, position: "relative" }}>
                  {/* Sliding highlight */}
                  <div style={{ 
                    position: "absolute", top: 4, bottom: 4, left: role === "RIDER" ? 4 : "50%", right: role === "RIDER" ? "50%" : 4,
                    background: "#fff", borderRadius: 10, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)" 
                  }} />
                  
                  <button type="button" onClick={() => setRole("RIDER")} style={{ flex: 1, padding: "10px 0", border: "none", background: "transparent", cursor: "pointer", position: "relative", zIndex: 1, fontSize: 14, fontWeight: 700, color: role === "RIDER" ? "#0d9488" : "#64748b", transition: "color 0.2s" }}>
                    Rider
                  </button>
                  <button type="button" onClick={() => setRole("DRIVER")} style={{ flex: 1, padding: "10px 0", border: "none", background: "transparent", cursor: "pointer", position: "relative", zIndex: 1, fontSize: 14, fontWeight: 700, color: role === "DRIVER" ? "#0d9488" : "#64748b", transition: "color 0.2s" }}>
                    Driver
                  </button>
                </div>
              </div>

              {errors.form && (
                <div style={{ padding: "10px 12px", background: "#fef2f2", border: "1px solid #f87171", borderRadius: 8, color: "#b91c1c", fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  {errors.form}
                </div>
              )}

              <p style={{ fontSize: 11, color: "#94a3b8", lineHeight: 1.6 }}>
                By signing up you agree to our{" "}
                <Link href="/terms" style={{ color: "#0d9488", fontWeight: 600, textDecoration: "none" }}>Terms</Link>
                {" "}and{" "}
                <Link href="/privacy" style={{ color: "#0d9488", fontWeight: 600, textDecoration: "none" }}>Privacy Policy</Link>.
              </p>

              <button type="submit" disabled={loading} className="btn-shimmer"
                style={{ width: "100%", padding: "13px 20px", background: loading ? "#6ee7df" : "linear-gradient(135deg, #0d9488 0%, #059669 100%)", color: "#fff", border: "none", borderRadius: 13, fontSize: 14, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", boxShadow: "0 4px 20px rgba(13,148,136,0.3), inset 0 1px 0 rgba(255,255,255,0.15)", transition: "all 0.25s ease", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, opacity: loading ? 0.8 : 1 }}
                onMouseEnter={(e) => { if (!loading) { (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 28px rgba(13,148,136,0.4), inset 0 1px 0 rgba(255,255,255,0.2)"; } }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 20px rgba(13,148,136,0.3), inset 0 1px 0 rgba(255,255,255,0.15)"; }}
              >
                {loading ? (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} style={{ animation: "wheel-spin 0.7s linear infinite" }}><path strokeLinecap="round" d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
                    Creating account…
                  </>
                ) : (
                  <>
                    Create Account
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "24px 0 20px" }}>
              <div style={{ flex: 1, height: 1, background: "#f1f5f9" }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: "#94a3b8", letterSpacing: "0.5px", textTransform: "uppercase" }}>or continue with</span>
              <div style={{ flex: 1, height: 1, background: "#f1f5f9" }} />
            </div>

            {/* Google Button (bottom) */}
            <button
              onClick={() => console.log("Google auth")}
              style={{
                width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 12,
                padding: "13px 20px",
                background: "#fff", border: "1.5px solid #e2e8f0",
                borderRadius: 14, fontSize: 15, fontWeight: 700, color: "#1e293b",
                cursor: "pointer", boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                transition: "all 0.2s ease", fontFamily: "inherit",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "#0d9488";
                (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 20px rgba(13,148,136,0.15)";
                (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "#e2e8f0";
                (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 8px rgba(0,0,0,0.06)";
                (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Sign up with Google
            </button>

            {/* Footer link */}
            <div style={{ marginTop: 24, textAlign: "center", color: "#64748b", fontSize: 14 }}>
              Already have an account?{" "}
              <Link href="/login" style={{ color: "#0d9488", fontWeight: 700, textDecoration: "none" }}>
                Log in →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
