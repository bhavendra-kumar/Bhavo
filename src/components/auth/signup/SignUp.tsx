"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { signInWithGoogle } from "@/lib/firebase";
import {
  User,
  Phone,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Car,
  Navigation,
  AlertCircle,
  Loader2,
} from "lucide-react";
import AuthRoadAnimation from "@/components/auth/AuthRoadAnimation";

interface SignUpProps {
  initialRole?: "RIDER" | "DRIVER";
}

export default function SignUp({ initialRole = "RIDER" }: SignUpProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<"RIDER" | "DRIVER">(initialRole);

  const [focused, setFocused] = useState<string | null>(null);
  const [errors, setErrors] = useState<{
    name?: string;
    phone?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    form?: string;
  }>({});
  const [shake, setShake] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(/[^\d\s]/g, "");
    const digits = raw.replace(/\D/g, "");
    if (digits.length > 10) {
      raw = digits.slice(0, 5) + " " + digits.slice(5, 10);
    } else if (digits.length > 5) {
      raw = digits.slice(0, 5) + " " + digits.slice(5);
    } else {
      raw = digits;
    }
    setPhone(raw);
    if (errors.phone || errors.form) {
      setErrors((prev) => ({ ...prev, phone: undefined, form: undefined }));
    }
  };

  const validate = () => {
    const e: {
      name?: string;
      phone?: string;
      email?: string;
      password?: string;
      confirmPassword?: string;
    } = {};

    // Name validation
    const trimmedName = name.trim();
    if (!trimmedName) {
      e.name = "Full name is required.";
    } else if (trimmedName.length < 2) {
      e.name = "Name must be at least 2 characters.";
    } else if (!/^[a-zA-Z\s.'-]+$/.test(trimmedName)) {
      e.name = "Name can only contain letters, spaces, and hyphens.";
    }

    // Phone validation (10 digit Indian mobile)
    const rawPhone = phone.trim();
    const digitsOnly = rawPhone.replace(/\D/g, "");
    const tenDigits =
      digitsOnly.length === 12 && digitsOnly.startsWith("91")
        ? digitsOnly.slice(2)
        : digitsOnly.length === 11 && digitsOnly.startsWith("0")
          ? digitsOnly.slice(1)
          : digitsOnly;

    if (!rawPhone) {
      e.phone = "Phone number is required.";
    } else if (tenDigits.length !== 10) {
      e.phone = "Please enter a valid 10-digit mobile number.";
    } else if (!/^[6-9]\d{9}$/.test(tenDigits)) {
      e.phone = "Mobile number must start with 6, 7, 8, or 9.";
    }

    // Email validation
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      e.email = "Email address is required.";
    } else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(trimmedEmail)) {
      e.email = "Please enter a valid email address.";
    }

    // Password validation
    if (!password) {
      e.password = "Password is required.";
    } else if (password.length < 6) {
      e.password = "Password must be at least 6 characters.";
    }

    // Confirm password validation
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
      const digitsOnly = phone.trim().replace(/\D/g, "");
      const tenDigits =
        digitsOnly.length === 12 && digitsOnly.startsWith("91")
          ? digitsOnly.slice(2)
          : digitsOnly.length === 11 && digitsOnly.startsWith("0")
            ? digitsOnly.slice(1)
            : digitsOnly;
      const formattedPhone = `+91 ${tenDigits}`;

      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: formattedPhone,
          email: email.trim().toLowerCase(),
          password,
          role,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrors({ form: data.message || "Registration failed. Please try again." });
        setShake(true);
        setTimeout(() => setShake(false), 500);
      } else {
        router.push(
          `/login?registered=true&role=${role.toLowerCase()}&email=${encodeURIComponent(
            email.trim().toLowerCase()
          )}`
        );
      }
    } catch {
      setErrors({ form: "Something went wrong. Please check your connection and try again." });
      setShake(true);
      setTimeout(() => setShake(false), 500);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
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
        setErrors({ form: data.message || "Google sign-up failed." });
        setShake(true);
        setTimeout(() => setShake(false), 500);
      } else {
        const userRole = data?.data?.role || role;
        if (userRole === "DRIVER") {
          router.push("/driver");
        } else if (userRole === "ADMIN") {
          router.push("/admin");
        } else {
          router.push("/user/dashboard");
        }
      }
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error
          ? err.message
          : "Google sign-up was interrupted. Please try again.";
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

        /* Ambient Stars */
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

        /* Centered Container */
        .auth-centered-container {
          width: 100%;
          max-width: 450px;
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
          margin-bottom: 22px;
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

        /* Elevated Form Card */
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

        /* Segmented Role Switcher */
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

        /* Card Header */
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

        /* Form Layout */
        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 13px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
        }

        .form-label {
          font-size: 11.5px;
          font-weight: 700;
          color: #334155;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 6px;
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

        .input-wrapper.focused.rider-focused {
          border-color: #075b55;
          background: #ffffff;
          box-shadow: 0 0 0 3px rgba(7, 91, 85, 0.12);
        }

        .input-wrapper.focused.driver-focused {
          border-color: #ea580c;
          background: #ffffff;
          box-shadow: 0 0 0 3px rgba(234, 88, 12, 0.12);
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
        .input-wrapper.focused.rider-focused .input-icon {
          color: #075b55;
        }
        .input-wrapper.focused.driver-focused .input-icon {
          color: #ea580c;
        }
        .input-wrapper.has-error .input-icon {
          color: #ef4444;
        }

        .phone-prefix-tag {
          position: absolute;
          left: 36px;
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13.5px;
          font-weight: 700;
          color: #475569;
          pointer-events: none;
          user-select: none;
        }
        .phone-prefix-tag::after {
          content: "";
          display: inline-block;
          height: 16px;
          width: 1px;
          background: #cbd5e1;
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

        .auth-phone-input {
          padding-left: 78px !important;
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
          margin: 4px 0 0;
          font-weight: 500;
        }

        .auth-terms-note {
          font-size: 11.5px;
          color: #64748b;
          line-height: 1.5;
          margin: 4px 0 0;
          text-align: center;
        }

        .terms-link {
          color: #075b55;
          font-weight: 600;
          text-decoration: none;
        }
        .terms-link.driver-terms {
          color: #ea580c;
        }
        .terms-link:hover {
          text-decoration: underline;
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
          margin: 16px 0 12px;
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
        .auth-alert.error {
          background: #fef2f2;
          border: 1px solid #fca5a5;
          color: #b91c1c;
        }
        .alert-icon {
          flex-shrink: 0;
          margin-top: 1px;
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

      {/* Ambient Twinkling Stars */}
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

      {/* Centered Form Wrapper */}
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

        {/* Elevated Form Card */}
        <div className={`auth-card ${shake ? "auth-card-shake" : ""}`}>
          {/* Role Switcher Tabs */}
          <div className="auth-role-tabs" role="tablist">
            <button
              type="button"
              id="tab-signup-rider"
              role="tab"
              aria-selected={role === "RIDER"}
              onClick={() => {
                setRole("RIDER");
                setErrors({});
              }}
              className={`auth-role-tab ${role === "RIDER" ? "active rider" : ""}`}
            >
              <Car size={15} />
              <span>Sign Up as Rider</span>
            </button>
            <button
              type="button"
              id="tab-signup-driver"
              role="tab"
              aria-selected={role === "DRIVER"}
              onClick={() => {
                setRole("DRIVER");
                setErrors({});
              }}
              className={`auth-role-tab ${role === "DRIVER" ? "active driver" : ""}`}
            >
              <Navigation size={15} />
              <span>Sign Up as Driver</span>
            </button>
          </div>

          {/* Card Header */}
          <div className="auth-card-header">
            <h1 className="auth-title">
              {role === "RIDER" ? "Create Rider Account" : "Join as Captain / Driver"}
            </h1>
            <p className="auth-subtitle">
              {role === "RIDER"
                ? "Fast, transparent, and fair rides across your city."
                : "Drive on your terms with daily bonuses and instant payouts."}
            </p>
          </div>

          {/* Form Alert */}
          {errors.form && (
            <div className="auth-alert error">
              <AlertCircle size={16} className="alert-icon" />
              <span>{errors.form}</span>
            </div>
          )}

          {/* Sign Up Form */}
          <form onSubmit={handleSubmit} noValidate className="auth-form">
            {/* Full Name */}
            <div className="form-group">
              <label htmlFor="signup-name" className="form-label">
                Full Name
              </label>
              <div
                className={`input-wrapper ${focused === "name" ? (role === "RIDER" ? "focused rider-focused" : "focused driver-focused") : ""} ${errors.name ? "has-error" : ""}`}
              >
                <User size={16} className="input-icon" />
                <input
                  id="signup-name"
                  type="text"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (errors.name || errors.form) {
                      setErrors((prev) => ({ ...prev, name: undefined, form: undefined }));
                    }
                  }}
                  onFocus={() => setFocused("name")}
                  onBlur={() => setFocused(null)}
                  placeholder="Enter Your Name"
                  className="auth-input"
                />
              </div>
              {errors.name && (
                <p className="field-error">
                  <AlertCircle size={12} />
                  <span>{errors.name}</span>
                </p>
              )}
            </div>

            {/* Phone Number */}
            <div className="form-group">
              <label htmlFor="signup-phone" className="form-label">
                Phone Number
              </label>
              <div
                className={`input-wrapper ${focused === "phone" ? (role === "RIDER" ? "focused rider-focused" : "focused driver-focused") : ""} ${errors.phone ? "has-error" : ""}`}
              >
                <Phone size={16} className="input-icon" />
                <span className="phone-prefix-tag">+91</span>
                <input
                  id="signup-phone"
                  type="tel"
                  autoComplete="tel"
                  maxLength={11}
                  value={phone}
                  onChange={handlePhoneChange}
                  onFocus={() => setFocused("phone")}
                  onBlur={() => setFocused(null)}
                  placeholder="Enter Your Number"
                  className="auth-input auth-phone-input"
                />
              </div>
              {errors.phone && (
                <p className="field-error">
                  <AlertCircle size={12} />
                  <span>{errors.phone}</span>
                </p>
              )}
            </div>

            {/* Email Address */}
            <div className="form-group">
              <label htmlFor="signup-email" className="form-label">
                Email Address
              </label>
              <div
                className={`input-wrapper ${focused === "email" ? (role === "RIDER" ? "focused rider-focused" : "focused driver-focused") : ""} ${errors.email ? "has-error" : ""}`}
              >
                <Mail size={16} className="input-icon" />
                <input
                  id="signup-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email || errors.form) {
                      setErrors((prev) => ({ ...prev, email: undefined, form: undefined }));
                    }
                  }}
                  onFocus={() => setFocused("email")}
                  onBlur={() => setFocused(null)}
                  placeholder="Enter your Email"
                  className="auth-input"
                />
              </div>
              {errors.email && (
                <p className="field-error">
                  <AlertCircle size={12} />
                  <span>{errors.email}</span>
                </p>
              )}
            </div>

            {/* Password */}
            <div className="form-group">
              <label htmlFor="signup-password" className="form-label">
                Password
              </label>
              <div
                className={`input-wrapper ${focused === "password" ? (role === "RIDER" ? "focused rider-focused" : "focused driver-focused") : ""} ${errors.password ? "has-error" : ""}`}
              >
                <Lock size={16} className="input-icon" />
                <input
                  id="signup-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password || errors.form) {
                      setErrors((prev) => ({ ...prev, password: undefined, form: undefined }));
                    }
                  }}
                  onFocus={() => setFocused("password")}
                  onBlur={() => setFocused(null)}
                  placeholder="At least 6 characters"
                  className="auth-input"
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

            {/* Confirm Password */}
            <div className="form-group">
              <label htmlFor="signup-confirm-password" className="form-label">
                Confirm Password
              </label>
              <div
                className={`input-wrapper ${focused === "confirmPassword" ? (role === "RIDER" ? "focused rider-focused" : "focused driver-focused") : ""} ${errors.confirmPassword ? "has-error" : ""}`}
              >
                <Lock size={16} className="input-icon" />
                <input
                  id="signup-confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (errors.confirmPassword || errors.form) {
                      setErrors((prev) => ({ ...prev, confirmPassword: undefined, form: undefined }));
                    }
                  }}
                  onFocus={() => setFocused("confirmPassword")}
                  onBlur={() => setFocused(null)}
                  placeholder="Confirm Your Password"
                  className="auth-input"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="password-toggle-btn"
                  aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="field-error">
                  <AlertCircle size={12} />
                  <span>{errors.confirmPassword}</span>
                </p>
              )}
            </div>

            {/* Terms notice */}
            <p className="auth-terms-note">
              By registering as a {role === "RIDER" ? "Rider" : "Driver"}, you agree to Bhavo&apos;s{" "}
              <Link href="/terms" className={`terms-link ${role === "DRIVER" ? "driver-terms" : ""}`}>
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className={`terms-link ${role === "DRIVER" ? "driver-terms" : ""}`}>
                Privacy Policy
              </Link>.
            </p>

            {/* Submit Button */}
            <button
              type="submit"
              id="signup-submit-btn"
              disabled={loading || googleLoading}
              className={`auth-submit-btn ${role === "RIDER" ? "rider-btn" : "driver-btn"}`}
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <span>{role === "RIDER" ? "Register as Rider" : "Register as Driver"}</span>
                  <ArrowRight size={16} className="btn-arrow" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="auth-divider">
            <span className="divider-line" />
            <span className="divider-text">OR CONTINUE WITH</span>
            <span className="divider-line" />
          </div>

          {/* Google Sign Up Button */}
          <button
            type="button"
            id="google-signup-btn"
            onClick={handleGoogleSignUp}
            disabled={loading || googleLoading}
            className="google-auth-btn"
          >
            {googleLoading ? (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Loader2 size={16} className="animate-spin" />
                <span>Connecting to Google...</span>
              </div>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
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
                <span>Continue with Google</span>
              </>
            )}
          </button>

          {/* Footer Switcher */}
          <div className="auth-footer-nav">
            Already registered?{" "}
            <Link
              href={`/login?role=${role.toLowerCase()}`}
              className={`footer-link ${role === "DRIVER" ? "driver-link" : ""}`}
            >
              Log in as {role === "RIDER" ? "Rider" : "Driver"} →
            </Link>
          </div>
        </div>

      </div>

      {/* Animated Bottom Road with Specialized Cab and Auto */}
      <AuthRoadAnimation />
    </div>
  );
}
