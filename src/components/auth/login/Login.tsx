"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface LoginProps {
  isRegistered?: boolean;
  initialEmail?: string;
}

export default function Login({ isRegistered = false, initialEmail = "" }: LoginProps) {
  const router = useRouter();
  const [successMsg, setSuccessMsg] = useState("");
  const displayMsg = successMsg || (isRegistered ? "Registration successful! Please log in." : "");
  type ViewState = "login" | "forgot_otp" | "forgot_reset";
  const [view, setView] = useState<ViewState>("login");
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  const [focused, setFocused] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ email?: string; password?: string; otp?: string; newPassword?: string; confirmNewPassword?: string; form?: string }>({});
  const [shake, setShake] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  React.useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const requestOtp = async (targetEmail: string) => {
    if (!targetEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(targetEmail)) {
      setErrors((prev) => ({ ...prev, email: "Please enter a valid email first to reset your password." }));
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }
    setLoading(true);
    setErrors({});
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: targetEmail.trim().toLowerCase() }),
      });
      const data = await res.json();
      if (res.ok) {
        setView("forgot_otp");
        setDevOtp(data.devOtp || null);
        setResendCooldown(30);
        setErrors({});
      } else {
        setErrors({ form: data.message || "Failed to send OTP." });
        setShake(true);
        setTimeout(() => setShake(false), 500);
      }
    } catch {
      setErrors({ form: "Network error. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  const validate = () => {
    const e: { email?: string; password?: string; otp?: string; newPassword?: string; confirmNewPassword?: string } = {};
    if (view === "login") {
      if (!email.trim()) {
        e.email = "Email is required.";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        e.email = "Please enter a valid email address.";
      }
      if (!password) {
        e.password = "Password is required.";
      } else if (password.length < 6) {
        e.password = "Password must be at least 6 characters.";
      }
    }
    if (view === "forgot_otp") {
      if (otp.some(digit => digit === "")) {
        e.otp = "Please enter the complete 6-digit OTP.";
      }
    }
    if (view === "forgot_reset") {
      if (!newPassword) {
        e.newPassword = "New password is required.";
      } else if (newPassword.length < 8) {
        e.newPassword = "Password must be at least 8 characters.";
      }
      if (!confirmNewPassword) {
        e.confirmNewPassword = "Confirm password is required.";
      } else if (newPassword !== confirmNewPassword) {
        e.confirmNewPassword = "Passwords do not match.";
      }
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

    if (view === "login") {
      try {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
        });

        if (!res.ok) {
          const data = await res.json();
          setErrors({ form: data.message || "Invalid email or password." });
          setShake(true);
          setTimeout(() => setShake(false), 500);
        } else {
          router.push("/user/dashboard");
        }
      } catch {
        setErrors({ form: "An unexpected error occurred." });
        setShake(true);
        setTimeout(() => setShake(false), 500);
      } finally {
        setLoading(false);
      }
    } else if (view === "forgot_otp") {
      try {
        const otpString = otp.join("");
        const res = await fetch("/api/auth/verify-otp", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, otp: otpString })
        });
        const data = await res.json();
        if (res.ok) {
          setView("forgot_reset");
        } else {
          setErrors({ form: data.message || "Invalid OTP." });
          setShake(true);
          setTimeout(() => setShake(false), 500);
        }
      } catch {
        setErrors({ form: "An unexpected error occurred." });
      } finally {
        setLoading(false);
      }
    } else if (view === "forgot_reset") {
      try {
        const otpString = otp.join("");
        const res = await fetch("/api/auth/reset-password", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, otp: otpString, newPassword })
        });
        const data = await res.json();
        if (res.ok) {
          setView("login");
          setPassword("");
          setNewPassword("");
          setConfirmNewPassword("");
          setOtp(["", "", "", "", "", ""]);
          setSuccessMsg("Password reset successfully! Please log in.");
        } else {
          setErrors({ form: data.message || "Failed to reset password." });
          setShake(true);
          setTimeout(() => setShake(false), 500);
        }
      } catch {
        setErrors({ form: "An unexpected error occurred." });
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <>
      <style>{`
        /* ── Vehicle & Scene Animations ── */
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
        @keyframes speed-line {
          0%   { opacity: 0.6; width: 40px; }
          100% { opacity: 0;   width: 80px; }
        }
        /* ── Title ── */
        @keyframes title-glow {
          0%, 100% { filter: drop-shadow(0 0 24px rgba(20,184,166,0.45)); }
          50%       { filter: drop-shadow(0 0 56px rgba(20,184,166,0.8)); }
        }
        /* ── Stars ── */
        @keyframes twinkle {
          0%, 100% { opacity: 0.2; transform: scale(1); }
          50%       { opacity: 1;   transform: scale(1.4); }
        }
        /* ── Building windows ── */
        @keyframes win-blink {
          0%, 90%, 100% { opacity: 1; }
          92%, 98%       { opacity: 0; }
        }
        /* ── Form card entrance ── */
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(30px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        /* ── Form reveal ── */
        @keyframes expandDown {
          from { opacity: 0; max-height: 0; }
          to   { opacity: 1; max-height: 300px; }
        }
        .car-drive { animation: car-drive 5.5s linear infinite; }
        .wheel-spin { animation: wheel-spin 0.4s linear infinite; transform-box: fill-box; transform-origin: center; }
        .lane-dash { animation: lane-dash 0.9s linear infinite; }
        .headlight { animation: headlight-beam 2s ease-in-out infinite; }
        .bhavo-title { animation: title-glow 3s ease-in-out infinite; }
        .form-card { animation: slideIn 0.7s cubic-bezier(0.22,1,0.36,1) both; }
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

        /* Auth responsive */
        @media (max-width: 1023px) {
          .auth-scene { display: none !important; }
          .auth-form-col { background: linear-gradient(135deg, #030f0f 0%, #042f2e 60%, #064e3b 100%) !important; min-height: 100vh !important; }
          .mobile-bhavo { display: block !important; }
        }
        @media (max-width: 640px) {
          .auth-form-col { padding: 32px 16px !important; }
          .form-card { padding: 32px 20px 28px !important; border-radius: 24px !important; }
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
          {/* ── Sky gradient glow ── */}
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(20,184,166,0.12) 0%, transparent 70%)" }} />

          {/* ── Stars ── */}
          {[
            { x: 12, y: 6, d: "1.8s", dl: "0s" }, { x: 25, y: 10, d: "2.3s", dl: "0.5s" },
            { x: 40, y: 4, d: "1.5s", dl: "0.2s" }, { x: 58, y: 8, d: "2.8s", dl: "1s" },
            { x: 70, y: 5, d: "1.9s", dl: "0.7s" }, { x: 85, y: 11, d: "2.1s", dl: "0.3s" },
            { x: 92, y: 7, d: "1.6s", dl: "0.9s" }, { x: 18, y: 15, d: "2.5s", dl: "0.4s" },
            { x: 48, y: 14, d: "1.7s", dl: "1.2s" }, { x: 78, y: 16, d: "2.2s", dl: "0.6s" },
            { x: 33, y: 3, d: "3s", dl: "1.5s" }, { x: 62, y: 13, d: "2s", dl: "0.1s" },
          ].map((s, i) => (
            <div key={i} style={{
              position: "absolute", left: `${s.x}%`, top: `${s.y}%`,
              width: 3, height: 3, borderRadius: "50%", background: "#fff",
              animation: `twinkle ${s.d} ease-in-out infinite`,
              animationDelay: s.dl,
            }} />
          ))}

          {/* ── BHAVO Giant Title ── */}
          <div style={{ position: "relative", zIndex: 10, padding: "44px 48px 0" }}>
            <Link href="/" style={{ textDecoration: "none" }}>
              <div className="bhavo-title" style={{
                fontSize: "clamp(64px, 7vw, 96px)",
                fontWeight: 900,
                letterSpacing: "-4px",
                lineHeight: 1,
                background: "linear-gradient(135deg, #ffffff 0%, #5eead4 40%, #34d399 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                marginBottom: 10,
              }}>
                BHAVO
              </div>
            </Link>
            <p style={{ color: "rgba(94,234,212,0.8)", fontSize: 13, fontWeight: 600, letterSpacing: "3px", textTransform: "uppercase" }}>
              Your City. Your Ride.
            </p>
          </div>

          {/* ── City Skyline ── */}
          <div style={{ position: "absolute", bottom: 200, left: 0, right: 0, display: "flex", alignItems: "flex-end" }}>
            {/* Buildings */}
            {[
              { w: 48, h: 180, x: 0, col: "#071f1f", wins: [[14, 30], [14, 60], [14, 90], [14, 120], [14, 150]], d: "2.1s" },
              { w: 36, h: 130, x: 52, col: "#082020", wins: [[10, 20], [10, 50], [10, 80], [10, 110]], d: "1.7s" },
              { w: 60, h: 220, x: 92, col: "#062020", wins: [[14, 20], [14, 50], [14, 80], [14, 110], [14, 140], [14, 170], [34, 20], [34, 50], [34, 80], [34, 110], [34, 140], [34, 170]], d: "2.8s" },
              { w: 40, h: 150, x: 156, col: "#071e1e", wins: [[10, 30], [10, 60], [10, 90], [10, 120]], d: "1.4s" },
              { w: 52, h: 190, x: 200, col: "#062222", wins: [[14, 30], [14, 60], [14, 90], [14, 120], [14, 150], [32, 30], [32, 60], [32, 90]], d: "3s" },
              { w: 44, h: 140, x: 256, col: "#071f1f", wins: [[12, 30], [12, 60], [12, 90], [12, 110]], d: "1.9s" },
              { w: 68, h: 240, x: 304, col: "#061c1c", wins: [[14, 20], [14, 55], [14, 90], [14, 125], [14, 160], [14, 200], [40, 20], [40, 55], [40, 90], [40, 125], [40, 160], [40, 200]], d: "2.4s" },
              { w: 36, h: 120, x: 376, col: "#082424", wins: [[10, 30], [10, 60], [10, 90]], d: "1.6s" },
              { w: 48, h: 170, x: 416, col: "#072020", wins: [[12, 30], [12, 60], [12, 90], [12, 130]], d: "2.9s" },
              { w: 40, h: 200, x: 468, col: "#061e1e", wins: [[12, 30], [12, 65], [12, 100], [12, 135], [12, 170]], d: "1.5s" },
            ].map((b, bi) => (
              <div key={bi} style={{ position: "absolute", left: b.x, bottom: 0, width: b.w, height: b.h, background: b.col, flexShrink: 0 }}>
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

            {/* Building silhouettes far right */}
            <div style={{ position: "absolute", right: 0, bottom: 0, width: 200, height: 280, background: "#051a1a" }} />
            <div style={{ position: "absolute", right: 80, bottom: 0, width: 120, height: 200, background: "#062020" }} />
          </div>

          {/* ── Road Section ── */}
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 200 }}>
            {/* Road surface */}
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 200, background: "linear-gradient(180deg, #111827 0%, #0d1117 100%)" }} />

            {/* Road edge lines */}
            <div style={{ position: "absolute", bottom: 195, left: 0, right: 0, height: 5, background: "rgba(20,184,166,0.6)" }} />
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 4, background: "#374151" }} />

            {/* Sidewalk */}
            <div style={{ position: "absolute", bottom: 195, left: 0, right: 0, height: 6, background: "#1f2937" }} />

            {/* Center dashes — scrolling */}
            <div className="lane-dash" style={{ position: "absolute", bottom: 90, left: 0, display: "flex", gap: 48 }}>
              {Array.from({ length: 20 }).map((_, i) => (
                <div key={i} style={{ width: 48, height: 5, background: "rgba(255,255,255,0.25)", borderRadius: 3, flexShrink: 0 }} />
              ))}
            </div>

            {/* Road glow from headlights */}
            <div className="headlight" style={{
              position: "absolute", bottom: 50, left: "12%",
              width: 200, height: 80,
              background: "radial-gradient(ellipse 100% 60% at 0% 50%, rgba(254,249,195,0.25) 0%, transparent 100%)",
            }} />

            {/* ── Car SVG ── */}
            <div className="car-drive" style={{ position: "absolute", bottom: 88, left: 0 }}>
              <svg viewBox="0 0 220 72" width="220" height="72" style={{ display: "block", overflow: "visible", transform: "scaleX(-1)" }}>
                {/* Speed lines — trail behind (right side when flipped) */}
                <rect x="228" y="26" width="72" height="3" rx="2" fill="rgba(20,184,166,0.5)" opacity="0.7" />
                <rect x="228" y="36" width="52" height="2" rx="1" fill="rgba(20,184,166,0.3)" opacity="0.5" />
                <rect x="228" y="44" width="80" height="2" rx="1" fill="rgba(20,184,166,0.4)" opacity="0.6" />

                {/* Car shadow */}
                <ellipse cx="110" cy="70" rx="88" ry="5" fill="rgba(0,0,0,0.5)" />

                {/* Car body */}
                <path d="M12 44 Q12 32 26 32 L78 32 Q92 10 120 10 L160 10 Q178 10 188 32 L198 32 Q208 32 208 44 L208 58 Q203 64 196 64 L24 64 Q16 64 12 58 Z" fill="#0d9488" />

                {/* Roof/cabin */}
                <path d="M78 32 Q90 12 118 12 L158 12 Q174 12 182 32" fill="#0a7a6e" />

                {/* Windshield */}
                <path d="M82 32 Q92 14 117 14 L152 14 Q166 14 174 32" fill="rgba(186,230,253,0.45)" stroke="rgba(186,230,253,0.2)" strokeWidth="1" />

                {/* Side windows */}
                <rect x="84" y="16" width="32" height="14" rx="3" fill="rgba(186,230,253,0.3)" />
                <rect x="120" y="16" width="30" height="14" rx="3" fill="rgba(186,230,253,0.3)" />

                {/* Door line */}
                <line x1="120" y1="34" x2="120" y2="62" stroke="rgba(0,0,0,0.25)" strokeWidth="1.5" />

                {/* Door handles */}
                <rect x="96" y="46" width="14" height="3" rx="1.5" fill="rgba(255,255,255,0.25)" />
                <rect x="128" y="46" width="14" height="3" rx="1.5" fill="rgba(255,255,255,0.25)" />

                {/* Headlights */}
                <rect x="2" y="38" width="14" height="7" rx="2" fill="#fef9c3" />
                <ellipse cx="0" cy="41" rx="16" ry="8" fill="rgba(254,249,195,0.35)" className="headlight" />

                {/* Tail lights */}
                <rect x="200" y="38" width="10" height="7" rx="2" fill="#f87171" />

                {/* Teal accent strip */}
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

            {/* Road reflection */}
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 80, background: "linear-gradient(180deg, transparent 0%, rgba(20,184,166,0.04) 100%)" }} />
          </div>


          {/* ── Noise overlay ── */}
          <div className="noise-overlay" style={{ opacity: 0.035, zIndex: 5 }} />
        </div>

        {/* ════════════════════════════════════════════
            RIGHT — Auth Form
        ════════════════════════════════════════════ */}
        <div className="auth-form-col" style={{
          flex: 1, minWidth: 0, display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          padding: "40px 24px",
          background: "#f0fdf9",
          position: "relative", overflowY: "auto", overflowX: "hidden",
        }}>
          {/* Soft background circles */}
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

          {/* ── Card ── */}
          <div className={`form-card${shake ? " form-shake" : ""}`} style={{
            width: "100%", maxWidth: 400,
            background: "#ffffff",
            borderRadius: 28,
            padding: "44px 40px 40px",
            boxShadow: "0 0 0 1px rgba(20,184,166,0.08), 0 4px 6px rgba(0,0,0,0.03), 0 16px 48px rgba(0,0,0,0.07), 0 40px 80px rgba(0,0,0,0.05)",
            position: "relative", zIndex: 10,
          }}>
            {/* Card top accent */}
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, background: "linear-gradient(90deg, #0d9488, #34d399, #0d9488)", borderRadius: "28px 28px 0 0", backgroundSize: "200% 100%", animation: "lane-dash 3s linear infinite" }} />

            <div style={{ marginBottom: 28 }}>
              {view === "login" && (
                <>
                  <h2 style={{ fontSize: 26, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.8px", marginBottom: 6 }}>
                    Welcome back 👋
                  </h2>
                  <p style={{ color: "#64748b", fontSize: 14, lineHeight: 1.5 }}>
                    Sign in to your Bhavo account.
                  </p>
                </>
              )}
              {view === "forgot_otp" && (
                <>
                  <button onClick={() => setView("login")} type="button" style={{ background: "none", border: "none", color: "#64748b", fontSize: 14, display: "flex", alignItems: "center", gap: 6, cursor: "pointer", padding: 0, marginBottom: 16 }}><svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg> Back to login</button>
                  <h2 style={{ fontSize: 26, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.8px", marginBottom: 6 }}>
                    Verify OTP
                  </h2>
                  <p style={{ color: "#64748b", fontSize: 14, lineHeight: 1.5 }}>
                    Enter the 6-digit code sent to {email || "your email"}.
                  </p>
                </>
              )}
              {view === "forgot_reset" && (
                <>
                  <h2 style={{ fontSize: 26, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.8px", marginBottom: 6 }}>
                    Reset Password
                  </h2>
                  <p style={{ color: "#64748b", fontSize: 14, lineHeight: 1.5 }}>
                    Please enter your new password below.
                  </p>
                </>
              )}
            </div>

            {/* ── Dynamic Form ── */}
            {displayMsg && (
              <div style={{ marginBottom: 16, padding: "10px 12px", background: "#f0fdf4", border: "1px solid #4ade80", borderRadius: 8, color: "#166534", fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                {displayMsg}
              </div>
            )}
            {errors.form && (
              <div style={{ marginBottom: 16, padding: "10px 12px", background: "#fef2f2", border: "1px solid #f87171", borderRadius: 8, color: "#b91c1c", fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                {errors.form}
              </div>
            )}
            <form onSubmit={handleSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {view === "login" && (
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 7, letterSpacing: "0.4px", textTransform: "uppercase" }} htmlFor="login-email">
                    Email
                  </label>
                  <div style={{ position: "relative" }}>
                    <span style={{
                      position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)",
                      color: errors.email ? "#ef4444" : focused === "email" ? "#0d9488" : "#94a3b8", transition: "color 0.2s", pointerEvents: "none",
                    }}>
                      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </span>
                    <input
                      id="login-email" type="email"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); if (errors.email) setErrors(prev => ({ ...prev, email: undefined })); }}
                      onFocus={() => setFocused("email")} onBlur={() => setFocused(null)}
                      placeholder="Enter Your Email"
                      style={{
                        width: "100%", paddingLeft: 38, paddingRight: 14, paddingTop: 12, paddingBottom: 12,
                        borderRadius: 12, fontSize: 14, color: "#0f172a", outline: "none", fontFamily: "inherit",
                        border: errors.email ? "1.5px solid #ef4444" : focused === "email" ? "1.5px solid #0d9488" : "1.5px solid #e2e8f0",
                        background: errors.email ? "#fff5f5" : focused === "email" ? "#fff" : "#f8fafc",
                        boxShadow: errors.email ? "0 0 0 4px rgba(239,68,68,0.1)" : focused === "email" ? "0 0 0 4px rgba(13,148,136,0.1)" : "none",
                        transition: "all 0.2s ease", boxSizing: "border-box",
                      }}
                    />
                  </div>
                  {errors.email && (
                    <p className="field-error">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" /></svg>
                      {errors.email}
                    </p>
                  )}
                </div>
              )}

              {view === "login" && (
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 7 }}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", letterSpacing: "0.4px", textTransform: "uppercase" }} htmlFor="login-password">Password</label>
                    <button type="button" onClick={() => requestOtp(email)} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", fontSize: 12, color: "#0d9488", fontWeight: 600 }}>Forgot Password?</button>
                  </div>
                  <div style={{ position: "relative" }}>
                    <span style={{
                      position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)",
                      color: errors.password ? "#ef4444" : focused === "password" ? "#0d9488" : "#94a3b8", transition: "color 0.2s", pointerEvents: "none",
                    }}>
                      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </span>
                    <input
                      id="login-password" type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); if (errors.password) setErrors(prev => ({ ...prev, password: undefined })); }}
                      onFocus={() => setFocused("password")} onBlur={() => setFocused(null)}
                      placeholder="••••••••"
                      style={{
                        width: "100%", paddingLeft: 38, paddingRight: 40, paddingTop: 12, paddingBottom: 12,
                        borderRadius: 12, fontSize: 14, color: "#0f172a", outline: "none", fontFamily: "inherit",
                        border: errors.password ? "1.5px solid #ef4444" : focused === "password" ? "1.5px solid #0d9488" : "1.5px solid #e2e8f0",
                        background: errors.password ? "#fff5f5" : focused === "password" ? "#fff" : "#f8fafc",
                        boxShadow: errors.password ? "0 0 0 4px rgba(239,68,68,0.1)" : focused === "password" ? "0 0 0 4px rgba(13,148,136,0.1)" : "none",
                        transition: "all 0.2s ease", boxSizing: "border-box",
                      }}
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      style={{ position: "absolute", right: 13, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: 0, display: "flex" }}>
                      {showPassword ? (
                        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                      ) : (
                        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="field-error">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" /></svg>
                      {errors.password}
                    </p>
                  )}
                </div>
              )}

              {view === "forgot_otp" && (
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 7, letterSpacing: "0.4px", textTransform: "uppercase" }}>One-Time Password</label>
                  <div style={{ display: "flex", gap: 8, justifyContent: "space-between" }}>
                    {otp.map((digit, idx) => (
                      <input key={idx} type="text" maxLength={1} value={digit}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9]/g, "");
                          const newOtp = [...otp];
                          newOtp[idx] = val;
                          setOtp(newOtp);
                          if (errors.otp) setErrors(prev => ({ ...prev, otp: undefined }));
                          if (val && idx < 5) {
                            document.getElementById(`otp-${idx + 1}`)?.focus();
                          }
                        }}
                        onPaste={(e) => {
                          e.preventDefault();
                          const pasted = e.clipboardData.getData("text").replace(/[^0-9]/g, "").slice(0, 6);
                          if (pasted) {
                            const newOtp = [...otp];
                            for (let i = 0; i < 6; i++) {
                              newOtp[i] = pasted[i] || "";
                            }
                            setOtp(newOtp);
                            if (errors.otp) setErrors(prev => ({ ...prev, otp: undefined }));
                            const nextIdx = Math.min(pasted.length, 5);
                            document.getElementById(`otp-${nextIdx}`)?.focus();
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Backspace" && !digit && idx > 0) {
                            document.getElementById(`otp-${idx - 1}`)?.focus();
                          }
                        }}
                        id={`otp-${idx}`}
                        style={{ width: "100%", height: 54, textAlign: "center", fontSize: 20, fontWeight: 700, borderRadius: 12, border: errors.otp ? "1.5px solid #ef4444" : "1.5px solid #e2e8f0", outline: "none", color: "#0f172a", background: errors.otp ? "#fff5f5" : "#f8fafc", transition: "all 0.2s ease" }}
                        onFocus={(e) => { e.target.style.borderColor = "#0d9488"; e.target.style.background = "#fff"; e.target.style.boxShadow = "0 0 0 4px rgba(13,148,136,0.1)"; }}
                        onBlur={(e) => { e.target.style.borderColor = errors.otp ? "#ef4444" : "#e2e8f0"; e.target.style.background = errors.otp ? "#fff5f5" : "#f8fafc"; e.target.style.boxShadow = "none"; }}
                      />
                    ))}
                  </div>
                  {errors.otp && <p className="field-error"><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>{errors.otp}</p>}

                  {/* Resend & Email Change Controls */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
                    <button
                      type="button"
                      onClick={() => { setView("login"); setDevOtp(null); }}
                      style={{ background: "none", border: "none", color: "#0d9488", fontSize: 12, fontWeight: 600, cursor: "pointer", padding: 0 }}
                    >
                      Wrong email? Change
                    </button>
                    <button
                      type="button"
                      disabled={resendCooldown > 0 || loading}
                      onClick={() => requestOtp(email)}
                      style={{
                        background: "none",
                        border: "none",
                        color: resendCooldown > 0 ? "#94a3b8" : "#0d9488",
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: resendCooldown > 0 ? "not-allowed" : "pointer",
                        padding: 0,
                      }}
                    >
                      {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend OTP"}
                    </button>
                  </div>

                  {/* Development mode test OTP banner */}
                  {devOtp && (
                    <div style={{ marginTop: 14, padding: "10px 14px", background: "#f0fdfa", border: "1.5px dashed #0d9488", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#0f766e", textTransform: "uppercase", letterSpacing: "0.5px" }}>Dev Mode OTP</div>
                        <div style={{ fontSize: 18, fontWeight: 900, color: "#115e59", letterSpacing: 4, fontFamily: "monospace" }}>{devOtp}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const digits = devOtp.split("").slice(0, 6);
                          setOtp(digits);
                          if (errors.otp) setErrors(prev => ({ ...prev, otp: undefined }));
                        }}
                        style={{ padding: "6px 12px", background: "#0d9488", color: "#fff", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                      >
                        Auto-fill
                      </button>
                    </div>
                  )}
                </div>
              )}

              {view === "forgot_reset" && (
                <>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 7, letterSpacing: "0.4px", textTransform: "uppercase" }} htmlFor="new-password">New Password</label>
                    <div style={{ position: "relative" }}>
                      <span style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: errors.newPassword ? "#ef4444" : focused === "newPassword" ? "#0d9488" : "#94a3b8", transition: "color 0.2s", pointerEvents: "none" }}>
                        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                      </span>
                      <input id="new-password" type={showNewPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => { setNewPassword(e.target.value); if (errors.newPassword) setErrors(prev => ({ ...prev, newPassword: undefined })); }}
                        onFocus={() => setFocused("newPassword")} onBlur={() => setFocused(null)}
                        placeholder="••••••••"
                        style={{ width: "100%", paddingLeft: 38, paddingRight: 40, paddingTop: 12, paddingBottom: 12, borderRadius: 12, fontSize: 14, color: "#0f172a", outline: "none", fontFamily: "inherit", border: errors.newPassword ? "1.5px solid #ef4444" : focused === "newPassword" ? "1.5px solid #0d9488" : "1.5px solid #e2e8f0", background: errors.newPassword ? "#fff5f5" : focused === "newPassword" ? "#fff" : "#f8fafc", boxShadow: errors.newPassword ? "0 0 0 4px rgba(239,68,68,0.1)" : focused === "newPassword" ? "0 0 0 4px rgba(13,148,136,0.1)" : "none", transition: "all 0.2s ease", boxSizing: "border-box" }} />
                      <button type="button" onClick={() => setShowNewPassword(!showNewPassword)}
                        style={{ position: "absolute", right: 13, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: 0, display: "flex" }}>
                        {showNewPassword ? (
                          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                        ) : (
                          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                        )}
                      </button>
                    </div>
                    {errors.newPassword && <p className="field-error"><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>{errors.newPassword}</p>}
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 7, letterSpacing: "0.4px", textTransform: "uppercase" }} htmlFor="confirm-new-password">Confirm Password</label>
                    <div style={{ position: "relative" }}>
                      <span style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: errors.confirmNewPassword ? "#ef4444" : focused === "confirmNewPassword" ? "#0d9488" : "#94a3b8", transition: "color 0.2s", pointerEvents: "none" }}>
                        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                      </span>
                      <input id="confirm-new-password" type={showConfirmNewPassword ? "text" : "password"}
                        value={confirmNewPassword}
                        onChange={(e) => { setConfirmNewPassword(e.target.value); if (errors.confirmNewPassword) setErrors(prev => ({ ...prev, confirmNewPassword: undefined })); }}
                        onFocus={() => setFocused("confirmNewPassword")} onBlur={() => setFocused(null)}
                        placeholder="••••••••"
                        style={{ width: "100%", paddingLeft: 38, paddingRight: 40, paddingTop: 12, paddingBottom: 12, borderRadius: 12, fontSize: 14, color: "#0f172a", outline: "none", fontFamily: "inherit", border: errors.confirmNewPassword ? "1.5px solid #ef4444" : focused === "confirmNewPassword" ? "1.5px solid #0d9488" : "1.5px solid #e2e8f0", background: errors.confirmNewPassword ? "#fff5f5" : focused === "confirmNewPassword" ? "#fff" : "#f8fafc", boxShadow: errors.confirmNewPassword ? "0 0 0 4px rgba(239,68,68,0.1)" : focused === "confirmNewPassword" ? "0 0 0 4px rgba(13,148,136,0.1)" : "none", transition: "all 0.2s ease", boxSizing: "border-box" }} />
                      <button type="button" onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                        style={{ position: "absolute", right: 13, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: 0, display: "flex" }}>
                        {showConfirmNewPassword ? (
                          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                        ) : (
                          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                        )}
                      </button>
                    </div>
                    {errors.confirmNewPassword && <p className="field-error"><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>{errors.confirmNewPassword}</p>}
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-shimmer"
                style={{
                  width: "100%", padding: "13px 20px",
                  background: loading ? "#6ee7df" : "linear-gradient(135deg, #0d9488 0%, #059669 100%)",
                  color: "#fff", border: "none", borderRadius: 13,
                  fontSize: 14, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
                  boxShadow: "0 4px 20px rgba(13,148,136,0.3), inset 0 1px 0 rgba(255,255,255,0.15)",
                  transition: "all 0.25s ease", fontFamily: "inherit",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  opacity: loading ? 0.8 : 1,
                  marginTop: 4,
                }}
                onMouseEnter={(e) => { if (!loading) { (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 28px rgba(13,148,136,0.4), inset 0 1px 0 rgba(255,255,255,0.2)"; } }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 20px rgba(13,148,136,0.3), inset 0 1px 0 rgba(255,255,255,0.15)"; }}
              >
                {loading ? (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} style={{ animation: "wheel-spin 0.7s linear infinite" }}><path strokeLinecap="round" d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" /></svg>
                    {view === "login" ? "Logging in…" : "Please wait..."}
                  </>
                ) : (
                  <>
                    {view === "login" && "Login In"}
                    {view === "forgot_otp" && "Verify OTP"}
                    {view === "forgot_reset" && "Reset Password"}
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </>
                )}
              </button>
            </form>

            {view === "login" && (
              <>
                {/* ── Divider ── */}
                <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "24px 0 20px" }}>
                  <div style={{ flex: 1, height: 1, background: "#f1f5f9" }} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#94a3b8", letterSpacing: "0.5px", textTransform: "uppercase" }}>or continue with</span>
                  <div style={{ flex: 1, height: 1, background: "#f1f5f9" }} />
                </div>

                {/* ── Google Button (bottom) ── */}
                <button
                  onClick={() => console.log("Google auth")}
                  style={{
                    width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 12,
                    padding: "13px 20px",
                    background: "#fff", border: "1.5px solid #e2e8f0",
                    borderRadius: 14, fontSize: 15, fontWeight: 700, color: "#1e293b",
                    cursor: "pointer",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
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
                  Continue with Google
                </button>

                {/* ── No account ── */}
                <div style={{ marginTop: 24, textAlign: "center", color: "#64748b", fontSize: 14 }}>
                  New to Bhavo?{" "}
                  <Link href="/signup" style={{ color: "#0d9488", fontWeight: 700, textDecoration: "none" }}>
                    Create an account →
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 1023px) {
          .mobile-bhavo { display: block !important; }
        }
      `}</style>
    </>
  );
}
