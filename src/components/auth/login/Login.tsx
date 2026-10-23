"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { signInWithGoogle } from "@/lib/firebase";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  Car,
  Navigation,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import AuthRoadAnimation from "@/components/auth/AuthRoadAnimation";

interface LoginProps {
  isRegistered?: boolean;
  initialEmail?: string;
  initialRole?: "RIDER" | "DRIVER";
  redirectTo?: string;
}

export default function Login({
  isRegistered = false,
  initialEmail = "",
  initialRole = "RIDER",
  redirectTo = "",
}: LoginProps) {
  const router = useRouter();
  const redirectUrl =
    redirectTo ||
    (typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("redirect") || ""
      : "");
  const [role, setRole] = useState<"RIDER" | "DRIVER">(initialRole);
  const [successMsg, setSuccessMsg] = useState("");
  const displayMsg =
    successMsg ||
    (isRegistered
      ? role === "DRIVER"
        ? "Captain registration successful! Please log in to your driver portal."
        : "Rider registration successful! Please log in to your account."
      : "");

  type ViewState = "login" | "forgot_otp" | "forgot_reset";
  const [view, setView] = useState<ViewState>("login");
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  const [focused, setFocused] = useState<string | null>(null);
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    otp?: string;
    newPassword?: string;
    confirmNewPassword?: string;
    form?: string;
  }>({});
  const [shake, setShake] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [roleMismatchTarget, setRoleMismatchTarget] = useState<
    "RIDER" | "DRIVER" | null
  >(null);

  React.useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const requestOtp = async (targetEmail: string) => {
    if (!targetEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(targetEmail)) {
      setErrors((prev) => ({
        ...prev,
        email: "Please enter a valid email address first to reset your password.",
      }));
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
    const e: {
      email?: string;
      password?: string;
      otp?: string;
      newPassword?: string;
      confirmNewPassword?: string;
    } = {};
    if (view === "login") {
      const trimmedEmail = email.trim();
      if (!trimmedEmail) {
        e.email = "Email is required.";
      } else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(trimmedEmail)) {
        e.email = "Please enter a valid email address.";
      }
      if (!password) {
        e.password = "Password is required.";
      } else if (password.length < 6) {
        e.password = "Password must be at least 6 characters.";
      }
    }
    if (view === "forgot_otp") {
      if (otp.some((digit) => digit === "")) {
        e.otp = "Please enter the complete 6-digit OTP.";
      } else if (otp.some((digit) => !/^\d$/.test(digit))) {
        e.otp = "OTP must contain digits only.";
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
          body: JSON.stringify({
            email: email.trim().toLowerCase(),
            password,
            role,
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          setErrors({ form: data.message || "Invalid email or password." });
          if (data.code === "ROLE_MISMATCH") {
            setRoleMismatchTarget(
              data.accountRole || (role === "RIDER" ? "DRIVER" : "RIDER")
            );
          } else {
            setRoleMismatchTarget(null);
          }
          setShake(true);
          setTimeout(() => setShake(false), 500);
        } else {
          setRoleMismatchTarget(null);
          const resData = await res.json();
          const userRole = resData?.data?.role || role;
          if (userRole === "DRIVER") {
            router.push("/driver");
          } else if (userRole === "ADMIN") {
            router.push("/admin");
          } else {
            router.push(redirectUrl || "/user/dashboard");
          }
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
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, otp: otpString }),
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
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, otp: otpString, newPassword }),
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

  const handleGoogleSignIn = async () => {
    setErrors({});
    setGoogleLoading(true);
    try {
      const googleUser = await signInWithGoogle();
      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firebaseIdToken: googleUser.firebaseIdToken,
          googleIdToken: googleUser.googleIdToken,
          role,
          clientEmail: googleUser.email,
          clientName: googleUser.name,
          clientPhoto: googleUser.photoURL,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrors({ form: data.message || "Google sign-in failed." });
        if (data.code === "ROLE_MISMATCH") {
          setRoleMismatchTarget(
            data.accountRole || (role === "RIDER" ? "DRIVER" : "RIDER")
          );
        } else {
          setRoleMismatchTarget(null);
        }
        setShake(true);
        setTimeout(() => setShake(false), 500);
      } else {
        setRoleMismatchTarget(null);
        const userRole = data?.data?.role || role;
        if (userRole === "DRIVER") {
          router.push("/driver");
        } else if (userRole === "ADMIN") {
          router.push("/admin");
        } else {
          router.push(redirectUrl || "/user/dashboard");
        }
      }
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error
          ? err.message
          : "Google sign-in was interrupted. Please try again.";
      setErrors({ form: errorMsg });
      setShake(true);
      setTimeout(() => setShake(false), 500);
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="auth-page-root">
      <style>{`
        .auth-page-root {
          min-height: 100vh;
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          position: relative;
          background: radial-gradient(circle at 50% 8%, rgba(13, 148, 136, 0.22) 0%, transparent 60%),
                      radial-gradient(circle at 85% 85%, rgba(6, 78, 59, 0.25) 0%, transparent 50%),
                      radial-gradient(circle at 15% 90%, rgba(16, 185, 129, 0.15) 0%, transparent 50%),
                      #020b0b;
          font-family: var(--font-outfit), system-ui, -apple-system, sans-serif;
          padding: 48px 16px 80px;
          overflow-x: hidden;
          box-sizing: border-box;
        }

        /* Ambient Stars Background */
        .auth-stars-layer {
          position: absolute;
          inset: 0;
          pointer-events: none;
          overflow: hidden;
        }

        @keyframes twinkleStar {
          0%, 100% { opacity: 0.25; transform: scale(0.9); }
          50% { opacity: 0.95; transform: scale(1.35); }
        }

        /* Centered Main Wrapper */
        .auth-centered-container {
          width: 100%;
          max-width: 440px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
          z-index: 10;
        }

        /* Top Brand Header */
        .auth-brand-header {
          text-align: center;
          margin-bottom: 24px;
        }

        .auth-brand-link {
          text-decoration: none;
          display: inline-flex;
          flex-direction: column;
          align-items: center;
          transition: transform 0.2s ease;
        }

        .auth-brand-link:hover {
          transform: translateY(-2px);
        }

        .auth-brand-logo {
          height: 64px;
          width: auto;
          display: block;
          filter: drop-shadow(0 0 24px rgba(20, 184, 166, 0.5));
        }

        .auth-brand-tagline {
          color: rgba(94, 234, 212, 0.85);
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 3px;
          text-transform: uppercase;
          margin: 6px 0 0;
        }

        /* Ultra-Clean Elevated Card */
        .auth-card {
          width: 100%;
          background: #ffffff;
          border-radius: 24px;
          padding: 32px 30px 28px;
          box-shadow: 0 25px 65px -12px rgba(0, 0, 0, 0.45),
                      0 4px 20px rgba(7, 91, 85, 0.12),
                      0 0 0 1px rgba(226, 232, 240, 0.8);
          position: relative;
          box-sizing: border-box;
          animation: cardSlideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        @keyframes cardSlideUp {
          from {
            opacity: 0;
            transform: translateY(24px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes cardShakeAnim {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-7px); }
          40% { transform: translateX(7px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }
        .auth-card-shake {
          animation: cardShakeAnim 0.45s ease both;
        }

        /* Modern Segmented Role Switcher */
        .auth-role-tabs {
          display: flex;
          background: #f1f5f9;
          border-radius: 12px;
          padding: 3.5px;
          margin-bottom: 22px;
          border: 1px solid #e2e8f0;
          position: relative;
        }

        .auth-role-tab {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          padding: 9px 12px;
          border: none;
          border-radius: 9px;
          background: transparent;
          color: #64748b;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          font-family: inherit;
        }

        .auth-role-tab.active.rider {
          background: #075b55;
          color: #ffffff;
          box-shadow: 0 3px 10px rgba(7, 91, 85, 0.28);
        }

        .auth-role-tab.active.driver {
          background: #ea580c;
          color: #ffffff;
          box-shadow: 0 3px 10px rgba(234, 88, 12, 0.28);
        }

        /* Card Header Typography */
        .auth-card-header {
          text-align: center;
          margin-bottom: 20px;
        }

        .auth-title {
          font-size: 22px;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: -0.6px;
          margin: 0 0 6px;
        }

        .auth-subtitle {
          color: #64748b;
          font-size: 13px;
          line-height: 1.45;
          margin: 0;
        }

        /* Back to Login Button */
        .auth-back-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: none;
          border: none;
          color: #0d9488;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          padding: 0;
          margin-bottom: 12px;
          transition: color 0.2s;
        }
        .auth-back-btn:hover {
          color: #0f766e;
        }

        /* Form Layout & Inputs */
        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
        }

        .label-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 6px;
        }

        .form-label {
          font-size: 12px;
          font-weight: 700;
          color: #334155;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .forgot-link {
          background: none;
          border: none;
          padding: 0;
          color: #075b55;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: color 0.15s;
        }
        .forgot-link:hover {
          color: #0f766e;
          text-decoration: underline;
        }

        .input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          width: 100%;
          box-sizing: border-box;
          background: #f8fafc;
          border: 1.5px solid #e2e8f0;
          border-radius: 12px;
          transition: all 0.2s ease;
        }

        .input-wrapper.focused {
          border-color: #075b55;
          background: #ffffff;
          box-shadow: 0 0 0 3px rgba(7, 91, 85, 0.12);
        }

        .input-wrapper.has-error {
          border-color: #ef4444;
          background: #fef2f2;
          box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
        }

        .input-icon {
          position: absolute;
          left: 13px;
          color: #94a3b8;
          pointer-events: none;
          transition: color 0.2s;
        }
        .input-wrapper.focused .input-icon {
          color: #075b55;
        }
        .input-wrapper.has-error .input-icon {
          color: #ef4444;
        }

        .auth-input {
          width: 100%;
          padding: 11px 40px 11px 38px;
          background: transparent;
          border: none;
          outline: none;
          font-size: 13.5px;
          font-weight: 500;
          color: #0f172a;
          font-family: inherit;
          box-sizing: border-box;
        }
        .auth-input::placeholder {
          color: #94a3b8;
          font-weight: 400;
        }

        .password-toggle-btn {
          position: absolute;
          right: 12px;
          background: none;
          border: none;
          color: #94a3b8;
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: color 0.15s;
        }
        .password-toggle-btn:hover {
          color: #334155;
        }

        .field-error {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 11.5px;
          color: #dc2626;
          margin: 5px 0 0;
          font-weight: 500;
        }

        /* Submit Button */
        .auth-submit-btn {
          width: 100%;
          padding: 12px 20px;
          border: none;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 700;
          color: #ffffff;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-top: 4px;
          transition: all 0.25s cubic-bezier(0.2, 0.8, 0.2, 1);
          font-family: inherit;
        }

        .auth-submit-btn.rider-btn {
          background: linear-gradient(135deg, #075b55 0%, #0d9488 100%);
          box-shadow: 0 6px 18px rgba(7, 91, 85, 0.25);
        }
        .auth-submit-btn.rider-btn:hover:not(:disabled) {
          transform: translateY(-1.5px);
          box-shadow: 0 10px 24px rgba(7, 91, 85, 0.35);
        }

        .auth-submit-btn.driver-btn {
          background: #ea580c;
          box-shadow: 0 6px 18px rgba(234, 88, 12, 0.28);
        }
        .auth-submit-btn.driver-btn:hover:not(:disabled) {
          background: #c2410c;
          transform: translateY(-1.5px);
          box-shadow: 0 10px 24px rgba(234, 88, 12, 0.38);
        }

        .auth-submit-btn:disabled {
          opacity: 0.75;
          cursor: not-allowed;
          transform: none;
        }

        .btn-arrow {
          transition: transform 0.2s ease;
        }
        .auth-submit-btn:hover:not(:disabled) .btn-arrow {
          transform: translateX(3px);
        }

        /* Divider */
        .auth-divider {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 18px 0 14px;
        }

        .divider-line {
          flex: 1;
          height: 1px;
          background: #e2e8f0;
        }

        .divider-text {
          font-size: 11px;
          font-weight: 700;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.6px;
        }

        /* Google OAuth Button */
        .google-auth-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 11px 16px;
          background: #ffffff;
          border: 1.5px solid #e2e8f0;
          border-radius: 12px;
          font-size: 13.5px;
          font-weight: 700;
          color: #1e293b;
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: inherit;
        }
        .google-auth-btn:hover:not(:disabled) {
          border-color: #cbd5e1;
          background: #f8fafc;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
          transform: translateY(-1px);
        }
        .google-auth-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .google-btn-loading {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        /* Footer Nav */
        .auth-footer-nav {
          margin-top: 18px;
          text-align: center;
          font-size: 13px;
          color: #64748b;
        }

        .footer-link {
          color: #075b55;
          font-weight: 700;
          text-decoration: none;
          transition: color 0.15s;
        }
        .footer-link:hover {
          color: #0f766e;
          text-decoration: underline;
        }

        .footer-link.driver-link {
          color: #ea580c;
        }
        .footer-link.driver-link:hover {
          color: #c2410c;
        }

        /* Alerts */
        .auth-alert {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          padding: 10px 12px;
          border-radius: 10px;
          font-size: 12.5px;
          margin-bottom: 14px;
        }
        .auth-alert.success {
          background: #f0fdf4;
          border: 1px solid #86efac;
          color: #15803d;
        }
        .auth-alert.error {
          background: #fef2f2;
          border: 1px solid #fca5a5;
          color: #b91c1c;
        }
        .alert-icon {
          flex-shrink: 0;
          margin-top: 1px;
        }
        .alert-content p {
          margin: 0;
          font-weight: 500;
          line-height: 1.4;
        }
        .alert-action-btn {
          margin-top: 6px;
          padding: 5px 10px;
          background: #dc2626;
          color: #ffffff;
          border: none;
          border-radius: 6px;
          font-size: 11.5px;
          font-weight: 700;
          cursor: pointer;
        }

        /* Trust Footer */
        .auth-trust-footer {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-size: 11px;
          color: rgba(148, 163, 184, 0.7);
          margin-top: 20px;
        }

        @media (max-width: 480px) {
          .auth-card {
            padding: 24px 20px 22px;
            border-radius: 20px;
          }
          .auth-title {
            font-size: 20px;
          }
          .auth-page-root {
            padding: 32px 12px 60px;
          }
        }
      `}</style>

      {/* Ambient Twinkling Stars Layer */}
      <div className="auth-stars-layer">
        {[
          { x: 10, y: 12, d: "2.1s" },
          { x: 25, y: 22, d: "1.8s" },
          { x: 42, y: 8, d: "2.7s" },
          { x: 65, y: 15, d: "1.9s" },
          { x: 82, y: 24, d: "2.3s" },
          { x: 92, y: 10, d: "2.5s" },
          { x: 18, y: 70, d: "2.0s" },
          { x: 80, y: 75, d: "2.2s" },
        ].map((s, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${s.x}%`,
              top: `${s.y}%`,
              width: 3,
              height: 3,
              borderRadius: "50%",
              background: "#5eead4",
              animation: `twinkleStar ${s.d} ease-in-out infinite`,
            }}
          />
        ))}
      </div>

      {/* Main Centered Box */}
      <div className="auth-centered-container">
        {/* Top Centered Brand */}
        <div className="auth-brand-header">
          <Link href="/" className="auth-brand-link">
            <Image
              src="/bhavo-title.png"
              alt="Bhavo"
              width={200}
              height={70}
              className="auth-brand-logo"
              priority
            />
            <p className="auth-brand-tagline">YOUR CITY. YOUR RIDE.</p>
          </Link>
        </div>

        {/* Form Card */}
        <div className={`auth-card ${shake ? "auth-card-shake" : ""}`}>
          {/* Role Switcher Tabs */}
          {view === "login" && (
            <div className="auth-role-tabs" role="tablist">
              <button
                type="button"
                id="tab-login-rider"
                role="tab"
                aria-selected={role === "RIDER"}
                onClick={() => {
                  setRole("RIDER");
                  setErrors({});
                  setRoleMismatchTarget(null);
                }}
                className={`auth-role-tab ${role === "RIDER" ? "active rider" : ""}`}
              >
                <Car size={15} />
                <span>Login as Rider</span>
              </button>
              <button
                type="button"
                id="tab-login-driver"
                role="tab"
                aria-selected={role === "DRIVER"}
                onClick={() => {
                  setRole("DRIVER");
                  setErrors({});
                  setRoleMismatchTarget(null);
                }}
                className={`auth-role-tab ${role === "DRIVER" ? "active driver" : ""}`}
              >
                <Navigation size={15} />
                <span>Login as Driver</span>
              </button>
            </div>
          )}

          {/* Card Header */}
          <div className="auth-card-header">
            {view === "login" && (
              <>
                <h2 className="auth-title">
                  {role === "RIDER" ? "Welcome Back" : "Captain Portal"}
                </h2>
                <p className="auth-subtitle">
                  {role === "RIDER"
                    ? "Sign in to book rides, track commutes, and access your Bhavo wallet."
                    : "Sign in to access your shift dispatches and earnings."}
                </p>
              </>
            )}

            {view === "forgot_otp" && (
              <>
                <button
                  onClick={() => setView("login")}
                  type="button"
                  className="auth-back-btn"
                >
                  <ArrowLeft size={14} />
                  <span>Back to login</span>
                </button>
                <h2 className="auth-title">Verify 6-Digit OTP</h2>
                <p className="auth-subtitle">
                  Enter the 6-digit code sent to{" "}
                  <strong>{email || "your email"}</strong>.
                </p>
              </>
            )}

            {view === "forgot_reset" && (
              <>
                <h2 className="auth-title">Reset Password</h2>
                <p className="auth-subtitle">
                  Please enter your new password below.
                </p>
              </>
            )}
          </div>

          {/* Feedback Messages */}
          {displayMsg && (
            <div className="auth-alert success" role="alert">
              <CheckCircle2 size={16} className="alert-icon" />
              <span>{displayMsg}</span>
            </div>
          )}

          {errors.form && (
            <div className="auth-alert error" role="alert">
              <AlertCircle size={16} className="alert-icon" />
              <div className="alert-content">
                <p>{errors.form}</p>
                {roleMismatchTarget && (
                  <button
                    type="button"
                    onClick={() => {
                      setRole(roleMismatchTarget);
                      setRoleMismatchTarget(null);
                      setErrors({});
                    }}
                    className="alert-action-btn"
                  >
                    Switch to {roleMismatchTarget === "DRIVER" ? "Driver" : "Rider"} Login &rarr;
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate className="auth-form">
            {view === "login" && (
              <>
                <div className="form-group">
                  <label htmlFor="login-email" className="form-label">
                    Email
                  </label>
                  <div
                    className={`input-wrapper ${focused === "email" ? "focused" : ""
                      } ${errors.email ? "has-error" : ""}`}
                  >
                    <Mail size={16} className="input-icon" />
                    <input
                      id="login-email"
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (errors.email || errors.form)
                          setErrors((prev) => ({ ...prev, email: undefined, form: undefined }));
                      }}
                      onFocus={() => setFocused("email")}
                      onBlur={() => setFocused(null)}
                      placeholder="Enter Your Email"
                      className="auth-input"
                      autoComplete="email"
                    />
                  </div>
                  {errors.email && (
                    <p className="field-error">
                      <AlertCircle size={12} />
                      <span>{errors.email}</span>
                    </p>
                  )}
                </div>

                <div className="form-group">
                  <div className="label-row">
                    <label htmlFor="login-password" className="form-label">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => requestOtp(email)}
                      className="forgot-link"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div
                    className={`input-wrapper ${focused === "password" ? "focused" : ""
                      } ${errors.password ? "has-error" : ""}`}
                  >
                    <Lock size={16} className="input-icon" />
                    <input
                      id="login-password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (errors.password || errors.form)
                          setErrors((prev) => ({ ...prev, password: undefined, form: undefined }));
                      }}
                      onFocus={() => setFocused("password")}
                      onBlur={() => setFocused(null)}
                      placeholder="••••••••"
                      className="auth-input"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="password-toggle-btn"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="field-error">
                      <AlertCircle size={12} />
                      <span>{errors.password}</span>
                    </p>
                  )}
                </div>
              </>
            )}

            {view === "forgot_otp" && (
              <div className="form-group">
                <label className="form-label">One-Time Password</label>
                <div style={{ display: "flex", gap: 8, justifyContent: "space-between" }}>
                  {otp.map((digit, idx) => (
                    <input
                      key={idx}
                      id={`otp-${idx}`}
                      type="text"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, "");
                        const newOtp = [...otp];
                        newOtp[idx] = val;
                        setOtp(newOtp);
                        if (errors.otp)
                          setErrors((prev) => ({ ...prev, otp: undefined }));
                        if (val && idx < 5) {
                          document.getElementById(`otp-${idx + 1}`)?.focus();
                        }
                      }}
                      onPaste={(e) => {
                        e.preventDefault();
                        const pasted = e.clipboardData
                          .getData("text")
                          .replace(/[^0-9]/g, "")
                          .slice(0, 6);
                        if (pasted) {
                          const newOtp = [...otp];
                          for (let i = 0; i < 6; i++) {
                            newOtp[i] = pasted[i] || "";
                          }
                          setOtp(newOtp);
                          if (errors.otp)
                            setErrors((prev) => ({ ...prev, otp: undefined }));
                          const nextIdx = Math.min(pasted.length, 5);
                          document.getElementById(`otp-${nextIdx}`)?.focus();
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Backspace" && !digit && idx > 0) {
                          document.getElementById(`otp-${idx - 1}`)?.focus();
                        }
                      }}
                      style={{
                        width: "100%",
                        height: 48,
                        textAlign: "center",
                        fontSize: 18,
                        fontWeight: 700,
                        borderRadius: 12,
                        border: errors.otp
                          ? "1.5px solid #ef4444"
                          : "1.5px solid #e2e8f0",
                        outline: "none",
                        color: "#0f172a",
                        background: errors.otp ? "#fff5f5" : "#f8fafc",
                        transition: "all 0.2s ease",
                      }}
                    />
                  ))}
                </div>
                {errors.otp && (
                  <p className="field-error">
                    <AlertCircle size={12} />
                    <span>{errors.otp}</span>
                  </p>
                )}

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginTop: 10,
                  }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setView("login");
                      setDevOtp(null);
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#075b55",
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                      padding: 0,
                    }}
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
                      color: resendCooldown > 0 ? "#94a3b8" : "#075b55",
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: resendCooldown > 0 ? "not-allowed" : "pointer",
                      padding: 0,
                    }}
                  >
                    {resendCooldown > 0
                      ? `Resend in ${resendCooldown}s`
                      : "Resend OTP"}
                  </button>
                </div>

                {devOtp && (
                  <div
                    style={{
                      marginTop: 12,
                      padding: "10px 12px",
                      background: "#f0fdfa",
                      border: "1.5px dashed #0d9488",
                      borderRadius: 10,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: "#0f766e",
                          textTransform: "uppercase",
                        }}
                      >
                        Dev Mode OTP
                      </div>
                      <div
                        style={{
                          fontSize: 17,
                          fontWeight: 900,
                          color: "#115e59",
                          letterSpacing: 3,
                          fontFamily: "monospace",
                        }}
                      >
                        {devOtp}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const digits = devOtp.split("").slice(0, 6);
                        setOtp(digits);
                        if (errors.otp)
                          setErrors((prev) => ({ ...prev, otp: undefined }));
                      }}
                      style={{
                        padding: "5px 10px",
                        background: "#075b55",
                        color: "#fff",
                        border: "none",
                        borderRadius: 6,
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      Auto-fill
                    </button>
                  </div>
                )}
              </div>
            )}

            {view === "forgot_reset" && (
              <>
                <div className="form-group">
                  <label htmlFor="new-password" className="form-label">
                    New Password
                  </label>
                  <div
                    className={`input-wrapper ${focused === "newPassword" ? "focused" : ""
                      } ${errors.newPassword ? "has-error" : ""}`}
                  >
                    <Lock size={16} className="input-icon" />
                    <input
                      id="new-password"
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        if (errors.newPassword)
                          setErrors((prev) => ({
                            ...prev,
                            newPassword: undefined,
                          }));
                      }}
                      onFocus={() => setFocused("newPassword")}
                      onBlur={() => setFocused(null)}
                      placeholder="••••••••"
                      className="auth-input"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="password-toggle-btn"
                    >
                      {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {errors.newPassword && (
                    <p className="field-error">
                      <AlertCircle size={12} />
                      <span>{errors.newPassword}</span>
                    </p>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="confirm-new-password" className="form-label">
                    Confirm Password
                  </label>
                  <div
                    className={`input-wrapper ${focused === "confirmNewPassword" ? "focused" : ""
                      } ${errors.confirmNewPassword ? "has-error" : ""}`}
                  >
                    <ShieldCheck size={16} className="input-icon" />
                    <input
                      id="confirm-new-password"
                      type={showConfirmNewPassword ? "text" : "password"}
                      value={confirmNewPassword}
                      onChange={(e) => {
                        setConfirmNewPassword(e.target.value);
                        if (errors.confirmNewPassword)
                          setErrors((prev) => ({
                            ...prev,
                            confirmNewPassword: undefined,
                          }));
                      }}
                      onFocus={() => setFocused("confirmNewPassword")}
                      onBlur={() => setFocused(null)}
                      placeholder="••••••••"
                      className="auth-input"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmNewPassword(!showConfirmNewPassword)
                      }
                      className="password-toggle-btn"
                    >
                      {showConfirmNewPassword ? (
                        <EyeOff size={16} />
                      ) : (
                        <Eye size={16} />
                      )}
                    </button>
                  </div>
                  {errors.confirmNewPassword && (
                    <p className="field-error">
                      <AlertCircle size={12} />
                      <span>{errors.confirmNewPassword}</span>
                    </p>
                  )}
                </div>
              </>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`auth-submit-btn ${role === "DRIVER" ? "driver-btn" : "rider-btn"
                }`}
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>{view === "login" ? "Signing In..." : "Verifying..."}</span>
                </>
              ) : (
                <>
                  <span>
                    {view === "login" &&
                      (role === "RIDER" ? "Login as Rider" : "Login as Driver")}
                    {view === "forgot_otp" && "Verify OTP & Continue"}
                    {view === "forgot_reset" && "Reset Password"}
                  </span>
                  <ArrowRight size={16} className="btn-arrow" />
                </>
              )}
            </button>
          </form>

          {/* Social Sign-in & Switchers */}
          {view === "login" && (
            <>
              <div className="auth-divider">
                <span className="divider-line" />
                <span className="divider-text">or continue with</span>
                <span className="divider-line" />
              </div>

              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading || googleLoading}
                className="google-auth-btn"
              >
                {googleLoading ? (
                  <div className="google-btn-loading">
                    <Loader2 size={16} className="animate-spin text-emerald-600" />
                    <span>Connecting to Google...</span>
                  </div>
                ) : (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24">
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                      />
                    </svg>
                    <span>
                      Continue as {role === "RIDER" ? "Rider" : "Driver"} with Google
                    </span>
                  </>
                )}
              </button>

              <div className="auth-footer-nav">
                {role === "RIDER" ? (
                  <span>
                    New to Bhavo?{" "}
                    <Link href="/signup?role=rider" className="footer-link">
                      Register as Rider &rarr;
                    </Link>
                  </span>
                ) : (
                  <span>
                    Want to drive with Bhavo?{" "}
                    <Link
                      href="/signup?role=driver"
                      className="footer-link driver-link"
                    >
                      Register as Driver &rarr;
                    </Link>
                  </span>
                )}
              </div>
            </>
          )}
        </div>

      </div>

      {/* Animated Bottom Road with Specialized Cab and Auto */}
      <AuthRoadAnimation />
    </div>
  );
}
