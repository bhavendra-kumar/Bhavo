"use client";

import React, { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Send,
  CheckCircle2,
  AlertCircle,
  Mail,
  Clock,
  ShieldCheck,
  MessageSquare,
  Loader2,
  Copy,
  Check,
  Phone,
  User,
  BadgeCheck,
  Zap,
} from "lucide-react";

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  subject?: string;
  message?: string;
}

const TOPIC_CHIPS = [
  { id: "General Inquiry", label: "General Question" },
  { id: "Commute Assistance", label: "Daily Commute Pass" },
  { id: "Pet Travel", label: "Pet-Friendly Rides" },
  { id: "Captain Onboarding", label: "Captain / Driver Desk" },
  { id: "Billing & Fares", label: "Fares & Billing" },
  { id: "Other", label: "Other" },

];

export default function ContactSection() {
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    subject: "General Inquiry",
    message: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [apiErrorMessage, setApiErrorMessage] = useState("");
  const [copiedEmail, setCopiedEmail] = useState(false);

  const copyEmailToClipboard = () => {
    navigator.clipboard.writeText("bhavendrakumar007@gmail.com");
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2200);
  };

  const validateField = (name: keyof FormData, value: string): string => {
    const trimmed = value.trim();

    switch (name) {
      case "firstName":
        if (!trimmed) return "First name is required.";
        if (trimmed.length < 2) return "Must be at least 2 characters.";
        if (!/^[a-zA-Z\s'-]+$/.test(trimmed)) {
          return "Please enter a valid name (letters only).";
        }
        return "";

      case "lastName":
        if (trimmed && !/^[a-zA-Z\s'-]+$/.test(trimmed)) {
          return "Please enter a valid last name (letters only).";
        }
        return "";

      case "email":
        if (!trimmed) return "Email address is required.";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(trimmed)) {
          return "Please enter a valid email address (e.g. name@example.com).";
        }
        return "";

      case "phone":
        if (trimmed && !/^[0-9+\s()-]{7,15}$/.test(trimmed)) {
          return "Please enter a valid phone number.";
        }
        return "";

      case "message":
        if (!trimmed) return "Message is required.";
        if (trimmed.length < 10) return "Message must be at least 10 characters.";
        if (trimmed.length > 2000) return "Message cannot exceed 2000 characters.";
        return "";

      default:
        return "";
    }
  };

  const validateAll = (): FormErrors => {
    const newErrors: FormErrors = {};
    const firstNameErr = validateField("firstName", formData.firstName);
    if (firstNameErr) newErrors.firstName = firstNameErr;

    const lastNameErr = validateField("lastName", formData.lastName);
    if (lastNameErr) newErrors.lastName = lastNameErr;

    const emailErr = validateField("email", formData.email);
    if (emailErr) newErrors.email = emailErr;

    const phoneErr = validateField("phone", formData.phone);
    if (phoneErr) newErrors.phone = phoneErr;

    const messageErr = validateField("message", formData.message);
    if (messageErr) newErrors.message = messageErr;

    return newErrors;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    const fieldName = name as keyof FormData;

    setFormData((prev) => ({ ...prev, [fieldName]: value }));

    if (apiErrorMessage) setApiErrorMessage("");

    if (touched[fieldName]) {
      const fieldError = validateField(fieldName, value);
      setErrors((prev) => ({ ...prev, [fieldName]: fieldError || undefined }));
    }
  };

  const handleBlur = (
    e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    const fieldName = name as keyof FormData;

    setTouched((prev) => ({ ...prev, [fieldName]: true }));
    const fieldError = validateField(fieldName, value);
    setErrors((prev) => ({ ...prev, [fieldName]: fieldError || undefined }));
  };

  const selectTopic = (topic: string) => {
    setFormData((prev) => ({ ...prev, subject: topic }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setTouched({
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      subject: true,
      message: true,
    });

    const validationErrors = validateAll();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      setApiErrorMessage("Please correct the highlighted fields before submitting.");
      return;
    }

    setStatus("submitting");
    setApiErrorMessage("");

    try {
      const submissionPayload = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || undefined,
        subject: formData.subject,
        message: formData.message.trim(),
      };

      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submissionPayload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Failed to submit message. Please try again.");
      }

      setStatus("success");
    } catch (err: unknown) {
      const error = err as Error;
      setApiErrorMessage(error?.message || "Something went wrong. Please try again.");
      setStatus("error");
    }
  };

  const resetForm = () => {
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      subject: "General Inquiry",
      message: "",
    });
    setErrors({});
    setTouched({});
    setStatus("idle");
    setApiErrorMessage("");
  };

  return (
    <section
      id="contact"
      style={{
        background: "linear-gradient(180deg, #F6FAF8 0%, #FFFFFF 100%)",
        padding: "80px 24px 96px",
        scrollMarginTop: 80,
        position: "relative",
        overflow: "hidden",
        borderTop: "1px solid #e5ece9",
        borderBottom: "1px solid #e5ece9",
      }}
    >
      {/* Ambient background glow orbs */}
      <div
        style={{
          position: "absolute",
          top: "-10%",
          right: "-5%",
          width: 500,
          height: 500,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(16, 184, 166, 0.09) 0%, rgba(255, 255, 255, 0) 70%)",
          filter: "blur(60px)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "-10%",
          left: "-5%",
          width: 450,
          height: 450,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(7, 91, 85, 0.07) 0%, rgba(255, 255, 255, 0) 70%)",
          filter: "blur(60px)",
          pointerEvents: "none",
        }}
      />

      <div style={{ maxWidth: 1180, margin: "0 auto", position: "relative", zIndex: 1 }}>
        {/* Section Header */}
        <div style={{ textAlign: "center", maxWidth: 760, margin: "0 auto 52px" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              fontSize: 12,
              fontWeight: 800,
              color: "#075B55",
              background: "rgba(7, 91, 85, 0.08)",
              border: "1px solid rgba(7, 91, 85, 0.2)",
              padding: "6px 16px",
              borderRadius: 99,
              letterSpacing: 1.4,
              textTransform: "uppercase",
              marginBottom: 18,
              boxShadow: "0 2px 10px rgba(7, 91, 85, 0.06)",
            }}
          >
            <Sparkles size={14} style={{ color: "#10B8A6" }} />
            <span>Dedicated BHAVO Support Desk</span>
          </div>

          <h2
            style={{
              fontSize: "clamp(30px, 4.2vw, 46px)",
              fontWeight: 900,
              color: "#142B29",
              letterSpacing: "-1.2px",
              lineHeight: 1.15,
              margin: "0 0 16px",
            }}
          >
            We Are Here to Help Every Step of the Way
          </h2>

          <p style={{ fontSize: 16.5, color: "#475569", lineHeight: 1.65, margin: 0 }}>
            Have a question about daily office commutes, pet-friendly cabs, driver onboarding,
            or enterprise rides? Reach out directly to our leadership and operations desk.
          </p>
        </div>

        {/* Contact Split Grid: Left Profile Showcase & Right Form */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(330px, 430px) 1fr",
            gap: 36,
            alignItems: "stretch",
          }}
          className="contact-layout-split"
        >
          {/* ================= LEFT COLUMN: BHAVENDRA KUMAR PROFILE CARD ================= */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            style={{
              background: "#ffffff",
              border: "1px solid #e0ece8",
              borderRadius: 30,
              padding: "36px 32px 30px",
              boxShadow: "0 20px 48px -12px rgba(7, 91, 85, 0.08), 0 2px 8px rgba(0, 0, 0, 0.02)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Top Teal Gradient Accent Bar */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: 5,
                background: "linear-gradient(90deg, #075B55 0%, #10B8A6 50%, #14b8a6 100%)",
              }}
            />

            <div>
              {/* Profile Photo Stage */}
              <div
                style={{
                  position: "relative",
                  width: 176,
                  height: 196,
                  margin: "6px auto 22px",
                }}
              >
                {/* Glowing ring backdrop */}
                <div
                  style={{
                    position: "absolute",
                    inset: -3,
                    borderRadius: 26,
                    background: "linear-gradient(135deg, #10B8A6 0%, #075B55 60%, #14b8a6 100%)",
                    opacity: 0.7,
                    filter: "blur(2px)",
                  }}
                />

                <div
                  style={{
                    position: "relative",
                    width: "100%",
                    height: "100%",
                    borderRadius: 24,
                    overflow: "hidden",
                    border: "3px solid #ffffff",
                    boxShadow: "0 14px 32px rgba(7, 91, 85, 0.2)",
                    background: "#075B55",
                  }}
                >
                  <Image
                    src="/bhavendra-kumar.jpg"
                    alt="Bhavendra Kumar"
                    fill
                    sizes="176px"
                    priority
                    style={{
                      objectFit: "cover",
                      objectPosition: "50% 12%",
                    }}
                  />
                </div>

                {/* Animated Pulsing Status Badge */}
                <div
                  style={{
                    position: "absolute",
                    bottom: -11,
                    left: "50%",
                    transform: "translateX(-50%)",
                    background: "#ffffff",
                    padding: "5px 14px",
                    borderRadius: 99,
                    boxShadow: "0 6px 18px rgba(7, 91, 85, 0.16)",
                    display: "flex",
                    alignItems: "center",
                    gap: 7,
                    whiteSpace: "nowrap",
                    fontSize: 12,
                    fontWeight: 800,
                    color: "#075B55",
                    border: "1.5px solid #ccfbf1",
                  }}
                >
                  <span
                    style={{
                      position: "relative",
                      display: "flex",
                      width: 9,
                      height: 9,
                    }}
                  >
                    <span
                      style={{
                        position: "absolute",
                        display: "inline-flex",
                        height: "100%",
                        width: "100%",
                        borderRadius: "50%",
                        backgroundColor: "#10B8A6",
                        opacity: 0.75,
                        animation: "ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite",
                      }}
                    />
                    <span
                      style={{
                        position: "relative",
                        display: "inline-flex",
                        borderRadius: "50%",
                        width: 9,
                        height: 9,
                        backgroundColor: "#10B8A6",
                      }}
                    />
                  </span>
                  <span>Active Now • Ready to Help</span>
                </div>
              </div>

              {/* Founder Header */}
              <div style={{ textAlign: "center", marginTop: 20, marginBottom: 20 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    marginBottom: 4,
                  }}
                >
                  <h3
                    style={{
                      fontSize: 23,
                      fontWeight: 900,
                      color: "#142B29",
                      letterSpacing: "-0.6px",
                      margin: 0,
                    }}
                  >
                    Bhavendra Kumar
                  </h3>
                  <BadgeCheck size={20} style={{ color: "#10B8A6" }} />
                </div>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 12,
                    fontWeight: 800,
                    color: "#075B55",
                    background: "rgba(7, 91, 85, 0.08)",
                    border: "1px solid rgba(7, 91, 85, 0.15)",
                    padding: "3px 12px",
                    borderRadius: 99,
                    letterSpacing: 0.5,
                  }}
                >
                </div>
              </div>

              {/* Personal Message Quote Box */}
              <div
                style={{
                  background: "linear-gradient(145deg, #F0FDF9 0%, #ECFDF5 100%)",
                  border: "1.5px solid #ccefe7",
                  borderRadius: 22,
                  padding: "20px 22px",
                  position: "relative",
                  boxShadow: "0 6px 20px rgba(7, 91, 85, 0.04)",
                  marginBottom: 22,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 7,
                    marginBottom: 10,
                    color: "#075B55",
                  }}
                >
                  <MessageSquare size={16} style={{ color: "#10B8A6" }} />
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 800,
                      textTransform: "uppercase",
                      letterSpacing: 1.2,
                      color: "#075B55",
                    }}
                  >
                    Personal Guarantee
                  </span>
                </div>

                <p
                  style={{
                    fontSize: 14.5,
                    color: "#133532",
                    lineHeight: 1.65,
                    fontWeight: 600,
                    margin: 0,
                    fontStyle: "italic",
                  }}
                >
                  &ldquo;Hey, we are here to help you, please send us your enquiry, we will reach you shortly, Thank You.&rdquo;
                </p>

                <div
                  style={{
                    marginTop: 10,
                    textAlign: "right",
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#0d9488",
                  }}
                >
                  — Bhavendra & the BHAVO Team
                </div>
              </div>

              {/* Fast Response Metrics Mini-Grid */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 10,
                  marginBottom: 20,
                }}
              >
                <div
                  style={{
                    background: "#F7FAF9",
                    border: "1px solid #e5ece9",
                    borderRadius: 14,
                    padding: "12px 14px",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 10,
                      background: "rgba(16, 184, 166, 0.15)",
                      color: "#075B55",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Zap size={16} />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 900, color: "#142B29" }}>
                      &lt; 15 Mins
                    </div>
                    <div style={{ fontSize: 11, color: "#64748b" }}>Commute Hours</div>
                  </div>
                </div>

                <div
                  style={{
                    background: "#F7FAF9",
                    border: "1px solid #e5ece9",
                    borderRadius: 14,
                    padding: "12px 14px",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 10,
                      background: "rgba(16, 184, 166, 0.15)",
                      color: "#075B55",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Clock size={16} />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 900, color: "#142B29" }}>
                      7 Days / Week
                    </div>
                    <div style={{ fontSize: 11, color: "#64748b" }}>Active Support</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Direct Email with Quick One-Click Copy */}
            <div
              style={{
                borderTop: "1px solid #eef3f1",
                paddingTop: 18,
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  background: "#F8FAFB",
                  border: "1px solid #e5ece9",
                  borderRadius: 14,
                  padding: "10px 14px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 8,
                      background: "#075B55",
                      color: "#ffffff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Mail size={14} />
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b" }}>
                      DIRECT DESK
                    </div>
                    <div style={{ fontSize: 13.5, fontWeight: 800, color: "#075B55" }}>
                      bhavendrakumar007@gmail.com
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={copyEmailToClipboard}
                  title="Copy email address"
                  style={{
                    background: copiedEmail ? "#10B8A6" : "#ffffff",
                    color: copiedEmail ? "#ffffff" : "#075B55",
                    border: "1px solid #d1deda",
                    borderRadius: 8,
                    padding: "6px 10px",
                    fontSize: 11.5,
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    transition: "all 0.2s ease",
                  }}
                >
                  {copiedEmail ? (
                    <>
                      <Check size={13} />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={13} />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 12,
                  color: "#64748b",
                  paddingLeft: 4,
                }}
              >
                <ShieldCheck size={14} style={{ color: "#10B8A6" }} />
                <span>100% human-assisted response from BHAVO team</span>
              </div>
            </div>
          </motion.div>

          {/* ================= RIGHT COLUMN: INTERACTIVE ENQUIRY FORM ================= */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            style={{
              background: "#ffffff",
              border: "1px solid #e0ece8",
              borderRadius: 30,
              padding: "40px 38px",
              boxShadow: "0 20px 48px -12px rgba(7, 91, 85, 0.08), 0 2px 8px rgba(0, 0, 0, 0.02)",
              position: "relative",
            }}
          >
            {status === "success" ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{
                  textAlign: "center",
                  padding: "54px 16px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 18,
                }}
              >
                <div
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: "50%",
                    background: "rgba(16, 184, 166, 0.15)",
                    color: "#075B55",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 10px 28px rgba(16, 184, 166, 0.3)",
                  }}
                >
                  <CheckCircle2 size={40} />
                </div>
                <h3 style={{ fontSize: 26, fontWeight: 900, color: "#142B29", margin: 0 }}>
                  Enquiry Successfully Received!
                </h3>
                <p style={{ fontSize: 15.5, color: "#64748b", maxWidth: 460, lineHeight: 1.65, margin: 0 }}>
                  Thank you, <strong style={{ color: "#142B29" }}>{formData.firstName}</strong>. Bhavendra
                  and the BHAVO operations desk have received your message. We will reach back to you at{" "}
                  <strong style={{ color: "#075B55" }}>{formData.email}</strong> promptly.
                </p>
                <button
                  type="button"
                  onClick={resetForm}
                  style={{
                    marginTop: 14,
                    background: "linear-gradient(135deg, #075B55 0%, #0d9488 100%)",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: 14,
                    padding: "14px 28px",
                    fontSize: 14.5,
                    fontWeight: 800,
                    cursor: "pointer",
                    boxShadow: "0 6px 20px rgba(7, 91, 85, 0.25)",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-1px)")}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
                >
                  Send Another Enquiry
                </button>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} noValidate>
                {/* Form Title */}
                <div style={{ marginBottom: 24 }}>
                  <h3
                    style={{
                      fontSize: 24,
                      fontWeight: 900,
                      color: "#142B29",
                      letterSpacing: "-0.5px",
                      margin: "0 0 6px",
                    }}
                  >
                    We&apos;d love to Hear from you
                  </h3>
                  <p style={{ fontSize: 14.5, color: "#64748b", margin: 0 }}>
                    Fill out the form below and we will get back to you with personalized assistance.
                  </p>
                </div>

                {/* API Global Error Message */}
                <AnimatePresence>
                  {apiErrorMessage && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      style={{
                        background: "#fef2f2",
                        border: "1px solid #fecaca",
                        color: "#b91c1c",
                        borderRadius: 14,
                        padding: "12px 16px",
                        marginBottom: 20,
                        fontSize: 13.5,
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                      }}
                    >
                      <AlertCircle size={16} style={{ flexShrink: 0 }} />
                      <span>{apiErrorMessage}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Quick Topic Chips */}
                <div style={{ marginBottom: 20 }}>
                  <label
                    style={{
                      display: "block",
                      fontSize: 12.5,
                      fontWeight: 800,
                      color: "#142B29",
                      textTransform: "uppercase",
                      letterSpacing: 0.8,
                      marginBottom: 8,
                    }}
                  >
                    Select Inquiry Topic
                  </label>
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 8,
                    }}
                  >
                    {TOPIC_CHIPS.map((chip) => {
                      const isSelected = formData.subject === chip.id;
                      return (
                        <button
                          key={chip.id}
                          type="button"
                          onClick={() => selectTopic(chip.id)}
                          style={{
                            background: isSelected ? "#075B55" : "#F5F8F7",
                            color: isSelected ? "#ffffff" : "#334155",
                            border: isSelected ? "1px solid #075B55" : "1px solid #e2ece9",
                            padding: "7px 14px",
                            borderRadius: 99,
                            fontSize: 12.5,
                            fontWeight: isSelected ? 800 : 600,
                            cursor: "pointer",
                            transition: "all 0.18s ease",
                            boxShadow: isSelected ? "0 4px 12px rgba(7, 91, 85, 0.22)" : "none",
                          }}
                        >
                          {chip.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* First Name & Last Name Grid */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 16,
                    marginBottom: 16,
                  }}
                  className="name-grid"
                >
                  {/* First Name */}
                  <div>
                    <label
                      htmlFor="firstName"
                      style={{
                        display: "block",
                        fontSize: 13,
                        fontWeight: 700,
                        color: errors.firstName && touched.firstName ? "#dc2626" : "#142B29",
                        marginBottom: 6,
                      }}
                    >
                      First Name <span style={{ color: "#dc2626" }}>*</span>
                    </label>
                    <div style={{ position: "relative" }}>
                      <input
                        id="firstName"
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        placeholder="Enter Your First Name"
                        style={{
                          width: "100%",
                          padding: "12px 14px 12px 38px",
                          borderRadius: 14,
                          border:
                            errors.firstName && touched.firstName
                              ? "1.5px solid #ef4444"
                              : "1px solid #dbe6e3",
                          fontSize: 14,
                          color: "#142B29",
                          outline: "none",
                          background:
                            errors.firstName && touched.firstName ? "#fff8f8" : "#F7FAF9",
                          transition: "all 0.2s ease",
                        }}
                      />
                      <User
                        size={16}
                        style={{
                          position: "absolute",
                          left: 13,
                          top: "50%",
                          transform: "translateY(-50%)",
                          color: errors.firstName && touched.firstName ? "#ef4444" : "#94a3b8",
                          pointerEvents: "none",
                        }}
                      />
                    </div>
                    {errors.firstName && touched.firstName && (
                      <p
                        style={{
                          color: "#dc2626",
                          fontSize: 12,
                          marginTop: 5,
                          marginBottom: 0,
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                          fontWeight: 500,
                        }}
                      >
                        <AlertCircle size={12} />
                        {errors.firstName}
                      </p>
                    )}
                  </div>

                  {/* Last Name */}
                  <div>
                    <label
                      htmlFor="lastName"
                      style={{
                        display: "block",
                        fontSize: 13,
                        fontWeight: 700,
                        color: errors.lastName && touched.lastName ? "#dc2626" : "#142B29",
                        marginBottom: 6,
                      }}
                    >
                      Last Name
                    </label>
                    <input
                      id="lastName"
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      placeholder="Enter Your Last Name"
                      style={{
                        width: "100%",
                        padding: "12px 14px",
                        borderRadius: 14,
                        border:
                          errors.lastName && touched.lastName
                            ? "1.5px solid #ef4444"
                            : "1px solid #dbe6e3",
                        fontSize: 14,
                        color: "#142B29",
                        outline: "none",
                        background:
                          errors.lastName && touched.lastName ? "#fff8f8" : "#F7FAF9",
                        transition: "all 0.2s ease",
                      }}
                    />
                    {errors.lastName && touched.lastName && (
                      <p
                        style={{
                          color: "#dc2626",
                          fontSize: 12,
                          marginTop: 5,
                          marginBottom: 0,
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                          fontWeight: 500,
                        }}
                      >
                        <AlertCircle size={12} />
                        {errors.lastName}
                      </p>
                    )}
                  </div>
                </div>

                {/* Email & Phone Grid */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1.2fr 1fr",
                    gap: 16,
                    marginBottom: 16,
                  }}
                  className="contact-info-grid"
                >
                  {/* Email */}
                  <div>
                    <label
                      htmlFor="email"
                      style={{
                        display: "block",
                        fontSize: 13,
                        fontWeight: 700,
                        color: errors.email && touched.email ? "#dc2626" : "#142B29",
                        marginBottom: 6,
                      }}
                    >
                      Email Address <span style={{ color: "#dc2626" }}>*</span>
                    </label>
                    <div style={{ position: "relative" }}>
                      <input
                        id="email"
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        placeholder="Enter Your Email"
                        style={{
                          width: "100%",
                          padding: "12px 14px 12px 38px",
                          borderRadius: 14,
                          border:
                            errors.email && touched.email
                              ? "1.5px solid #ef4444"
                              : "1px solid #dbe6e3",
                          fontSize: 14,
                          color: "#142B29",
                          outline: "none",
                          background:
                            errors.email && touched.email ? "#fff8f8" : "#F7FAF9",
                          transition: "all 0.2s ease",
                        }}
                      />
                      <Mail
                        size={16}
                        style={{
                          position: "absolute",
                          left: 13,
                          top: "50%",
                          transform: "translateY(-50%)",
                          color: errors.email && touched.email ? "#ef4444" : "#94a3b8",
                          pointerEvents: "none",
                        }}
                      />
                    </div>
                    {errors.email && touched.email && (
                      <p
                        style={{
                          color: "#dc2626",
                          fontSize: 12,
                          marginTop: 5,
                          marginBottom: 0,
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                          fontWeight: 500,
                        }}
                      >
                        <AlertCircle size={12} />
                        {errors.email}
                      </p>
                    )}
                  </div>

                  {/* Phone Number (Optional) */}
                  <div>
                    <label
                      htmlFor="phone"
                      style={{
                        display: "block",
                        fontSize: 13,
                        fontWeight: 700,
                        color: errors.phone && touched.phone ? "#dc2626" : "#142B29",
                        marginBottom: 6,
                      }}
                    >
                      Phone / WhatsApp{" "}
                      <span style={{ fontSize: 11, fontWeight: 500, color: "#94a3b8" }}>
                        (Optional)
                      </span>
                    </label>
                    <div style={{ position: "relative" }}>
                      <input
                        id="phone"
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        placeholder="Enter Your Number"
                        style={{
                          width: "100%",
                          padding: "12px 14px 12px 38px",
                          borderRadius: 14,
                          border:
                            errors.phone && touched.phone
                              ? "1.5px solid #ef4444"
                              : "1px solid #dbe6e3",
                          fontSize: 14,
                          color: "#142B29",
                          outline: "none",
                          background:
                            errors.phone && touched.phone ? "#fff8f8" : "#F7FAF9",
                          transition: "all 0.2s ease",
                        }}
                      />
                      <Phone
                        size={16}
                        style={{
                          position: "absolute",
                          left: 13,
                          top: "50%",
                          transform: "translateY(-50%)",
                          color: errors.phone && touched.phone ? "#ef4444" : "#94a3b8",
                          pointerEvents: "none",
                        }}
                      />
                    </div>
                    {errors.phone && touched.phone && (
                      <p
                        style={{
                          color: "#dc2626",
                          fontSize: 12,
                          marginTop: 5,
                          marginBottom: 0,
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                          fontWeight: 500,
                        }}
                      >
                        <AlertCircle size={12} />
                        {errors.phone}
                      </p>
                    )}
                  </div>
                </div>

                {/* Message Field */}
                <div style={{ marginBottom: 24 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 6,
                    }}
                  >
                    <label
                      htmlFor="message"
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: errors.message && touched.message ? "#dc2626" : "#142B29",
                      }}
                    >
                      Message <span style={{ color: "#dc2626" }}>*</span>
                    </label>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: formData.message.length > 1800 ? "#e11d48" : "#94a3b8",
                      }}
                    >
                      {formData.message.length}/2000
                    </span>
                  </div>
                  <textarea
                    id="message"
                    name="message"
                    rows={4}
                    value={formData.message}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="Tell us what you need help with (commute route, schedule, pet travel, fleet registration, or general queries)..."
                    style={{
                      width: "100%",
                      padding: "14px",
                      borderRadius: 14,
                      border:
                        errors.message && touched.message
                          ? "1.5px solid #ef4444"
                          : "1px solid #dbe6e3",
                      fontSize: 14,
                      color: "#142B29",
                      outline: "none",
                      background:
                        errors.message && touched.message ? "#fff8f8" : "#F7FAF9",
                      resize: "vertical",
                      fontFamily: "inherit",
                      transition: "all 0.2s ease",
                      lineHeight: 1.6,
                    }}
                  />
                  {errors.message && touched.message && (
                    <p
                      style={{
                        color: "#dc2626",
                        fontSize: 12,
                        marginTop: 5,
                        marginBottom: 0,
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        fontWeight: 500,
                      }}
                    >
                      <AlertCircle size={12} />
                      {errors.message}
                    </p>
                  )}
                </div>

                {/* Submit Action Button */}
                <button
                  type="submit"
                  disabled={status === "submitting"}
                  style={{
                    width: "100%",
                    background: "linear-gradient(135deg, #075B55 0%, #0d9488 100%)",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: 14,
                    padding: "16px 24px",
                    fontSize: 15.5,
                    fontWeight: 800,
                    cursor: status === "submitting" ? "not-allowed" : "pointer",
                    opacity: status === "submitting" ? 0.75 : 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 10,
                    boxShadow: "0 8px 24px rgba(7, 91, 85, 0.28)",
                    transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                  }}
                  onMouseEnter={(e) => {
                    if (status !== "submitting") {
                      e.currentTarget.style.boxShadow = "0 12px 30px rgba(7, 91, 85, 0.38)";
                      e.currentTarget.style.transform = "translateY(-2px)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = "0 8px 24px rgba(7, 91, 85, 0.28)";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  {status === "submitting" ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      <span>Transmitting Enquiry...</span>
                    </>
                  ) : (
                    <>
                      <Send size={17} />
                      <span>Send Enquiry</span>
                    </>
                  )}
                </button>

                {/* Privacy & Trust Note */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    fontSize: 12,
                    color: "#94a3b8",
                    marginTop: 14,
                  }}
                >
                  <ShieldCheck size={14} style={{ color: "#10B8A6" }} />
                  <span>Your details are completely secure and used solely to answer your inquiry.</span>
                </div>
              </form>
            )}
          </motion.div>
        </div>
      </div>

      <style>{`
        @keyframes ping {
          75%, 100% {
            transform: scale(2);
            opacity: 0;
          }
        }
        @media (max-width: 960px) {
          .contact-layout-split {
            grid-template-columns: 1fr !important;
            gap: 32px !important;
          }
        }
        @media (max-width: 600px) {
          .name-grid,
          .contact-info-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  );
}
