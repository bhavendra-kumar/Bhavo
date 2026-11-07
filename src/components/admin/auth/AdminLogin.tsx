"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  AlertCircle,
  Loader2,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";

interface AdminLoginProps {
  redirectUrl?: string;
  currentRole?: string;
}

export default function AdminLogin({
  redirectUrl = "/admin",
  currentRole,
}: AdminLoginProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError("Please enter your admin email address.");
      return;
    }
    if (!password) {
      setError("Please enter your admin password.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: trimmedEmail.toLowerCase(),
          password,
          role: "ADMIN",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Invalid administrator credentials.");
        setLoading(false);
        return;
      }

      if (data?.data?.role !== "ADMIN") {
        setError("Access denied. This account does not have administrator privileges.");
        setLoading(false);
        return;
      }

      // Redirect to refresh server layout and cookie session
      router.push(redirectUrl || "/admin");
      router.refresh();
    } catch {
      setError("A network error occurred while connecting to authentication service.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 flex flex-col justify-between items-center text-slate-100 p-4 sm:p-6 selection:bg-teal-500 selection:text-white">
      {/* Background Ambient Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-15%] left-[20%] w-125 h-125 rounded-full bg-teal-500/10 blur-[130px]" />
        <div className="absolute bottom-[-10%] right-[25%] w-112.5 h-112.5 rounded-full bg-cyan-500/5 blur-[120px]" />
      </div>

      {/* Top Bar Header */}
      <header className="w-full max-w-5xl flex items-center justify-between py-4 z-10">
        <Link
          href="/"
          className="flex items-center gap-2 text-slate-400 hover:text-white text-xs font-medium transition-colors"
        >
          <ArrowLeft size={14} />
          <span>Back to Bhavo Home</span>
        </Link>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
          <span className="text-[11px] font-mono tracking-wider text-slate-400 uppercase">
            Internal Operations System
          </span>
        </div>
      </header>

      {/* Main Login Card */}
      <main className="w-full max-w-md my-auto py-8 z-10">
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 shadow-2xl rounded-2xl p-6 sm:p-8">
          {/* Brand & Pill Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center gap-2 mb-3">
              <Image
                src="/bhavo-title.png"
                alt="Bhavo"
                width={110}
                height={36}
                className="h-8 w-auto object-contain brightness-110"
                priority
              />
              <span className="text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 rounded bg-teal-500/15 text-teal-300 border border-teal-500/30">
                Ops Portal
              </span>
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              Admin & Dispatch Command
            </h1>
            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
              Authorized operations staff and system administrators only.
            </p>
          </div>

          {/* Active Session Notification */}
          {currentRole && currentRole !== "ADMIN" && (
            <div className="mb-5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs flex items-start gap-2.5">
              <AlertCircle size={16} className="text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">Notice:</span> You are currently signed in with a <span className="font-mono text-amber-300 uppercase">{currentRole}</span> account. Authenticate below with an admin account to switch to the Operations Console.
              </div>
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
              <AlertCircle size={16} className="text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{error}</div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div>
              <label
                htmlFor="admin-email"
                className="block text-xs font-semibold text-slate-300 mb-1.5 tracking-wide"
              >
                Administrator Email
              </label>
              <div className="relative">
                <Mail
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                />
                <input
                  id="admin-email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="Enter Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  className="w-full bg-slate-950/70 border border-slate-700/80 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all disabled:opacity-50"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="admin-password"
                className="block text-xs font-semibold text-slate-300 mb-1.5 tracking-wide"
              >
                Password
              </label>
              <div className="relative">
                <Lock
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                />
                <input
                  id="admin-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  placeholder="Enter administrator password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="w-full bg-slate-950/70 border border-slate-700/80 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 focus:outline-none"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 px-4 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-sm tracking-wide transition-all shadow-lg shadow-teal-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin text-slate-950" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Admin Portal</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Security Guarantee Pill */}
          <div className="mt-6 pt-5 border-t border-slate-800/80 flex items-center justify-center gap-2 text-[11px] text-slate-400 text-center">
            <ShieldCheck size={14} className="text-teal-400 shrink-0" />
            <span>256-Bit Encrypted Session • Audit Logging Enabled</span>
          </div>
        </div>

        {/* Alternative Nav */}
        <div className="mt-6 text-center text-xs text-slate-500 space-x-4">
          <Link
            href="/login"
            className="hover:text-slate-300 transition-colors underline-offset-4 hover:underline"
          >
            Rider & Captain Login
          </Link>
          <span>•</span>
          <Link
            href="/"
            className="hover:text-slate-300 transition-colors underline-offset-4 hover:underline"
          >
            Bhavo Home
          </Link>
        </div>
      </main>

      {/* Footer Info */}
      <footer className="w-full max-w-5xl py-4 text-center text-[11px] text-slate-600 z-10">
        &copy; {new Date().getFullYear()} Bhavo Technologies Inc. All rights reserved. Access strictly restricted to authorized staff.
      </footer>
    </div>
  );
}

