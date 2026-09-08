"use client";

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import { X } from "lucide-react";

export type DialogVariant = "danger" | "warning" | "success" | "info" | "default";

export interface DialogOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: DialogVariant;
}

interface DialogState extends DialogOptions {
  isOpen: boolean;
  type: "confirm" | "alert";
  resolve: (value: boolean) => void;
}

interface DialogContextType {
  confirm: (options: DialogOptions | string) => Promise<boolean>;
  alert: (options: DialogOptions | string) => Promise<void>;
}

const DialogContext = createContext<DialogContextType | null>(null);

export function useDialog() {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error("useDialog must be used within a DialogProvider");
  }
  return context;
}

export function DialogProvider({ children }: { children: React.ReactNode }) {
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const confirmButtonRef = useRef<HTMLButtonElement | null>(null);

  const confirm = useCallback((options: DialogOptions | string): Promise<boolean> => {
    return new Promise((resolve) => {
      const parsedOptions: DialogOptions =
        typeof options === "string"
          ? {
              title: options,
              message: "",
              confirmText: options.toLowerCase().includes("delete") ? "Delete" : options.toLowerCase().includes("cancel") ? "Cancel ride" : "Continue",
              cancelText: options.toLowerCase().includes("ride") ? "Keep ride" : "Cancel",
              variant: options.toLowerCase().includes("cancel") || options.toLowerCase().includes("delete") ? "danger" : "default",
            }
          : {
              confirmText: options.variant === "danger" ? "Confirm" : "Continue",
              cancelText: "Cancel",
              variant: "default",
              ...options,
            };

      setDialog({
        ...parsedOptions,
        isOpen: true,
        type: "confirm",
        resolve,
      });
    });
  }, []);

  const alert = useCallback((options: DialogOptions | string): Promise<void> => {
    return new Promise((resolve) => {
      const isEmergency = typeof options === "string" && (options.toLowerCase().includes("sos") || options.toLowerCase().includes("emergency"));
      const parsedOptions: DialogOptions =
        typeof options === "string"
          ? {
              title: isEmergency ? "Emergency SOS" : "Notice",
              message: options,
              confirmText: "OK",
              variant: isEmergency ? "danger" : "info",
            }
          : {
              confirmText: "OK",
              variant: "info",
              ...options,
            };

      setDialog({
        ...parsedOptions,
        isOpen: true,
        type: "alert",
        resolve: () => resolve(),
      });
    });
  }, []);

  // Intercept window.alert on client-side so legacy or unmigrated alerts also look native
  useEffect(() => {
    if (typeof window === "undefined") return;
    const originalAlert = window.alert;

    window.alert = (message?: unknown) => {
      alert(String(message ?? ""));
    };

    return () => {
      window.alert = originalAlert;
    };
  }, [alert]);

  // Auto-focus confirm button and handle Escape key
  useEffect(() => {
    if (dialog?.isOpen) {
      const timer = setTimeout(() => {
        confirmButtonRef.current?.focus();
      }, 50);

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          dialog.resolve(false);
          setDialog(null);
        }
      };

      window.addEventListener("keydown", handleKeyDown);
      return () => {
        clearTimeout(timer);
        window.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [dialog]);

  const handleConfirm = () => {
    if (!dialog) return;
    dialog.resolve(true);
    setDialog(null);
  };

  const handleCancel = () => {
    if (!dialog) return;
    dialog.resolve(false);
    setDialog(null);
  };

  const isDanger = dialog?.variant === "danger";

  return (
    <DialogContext.Provider value={{ confirm, alert }}>
      {children}

      {dialog && dialog.isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-9999 flex items-end sm:items-center justify-center sm:p-4"
          style={{ background: "rgba(2, 18, 17, 0.55)", backdropFilter: "blur(6px)" }}
          onClick={dialog.type === "alert" ? handleConfirm : undefined}
        >
          <div
            className="w-full sm:max-w-95 bg-white sm:rounded-2xl rounded-t-2xl overflow-hidden shadow-2xl"
            style={{ boxShadow: "0 -4px 40px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.06)" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top strip colour based on variant */}
            <div
              className="h-1 w-full"
              style={{
                background: isDanger
                  ? "linear-gradient(90deg, #e11d48, #f43f5e)"
                  : "linear-gradient(90deg, #0d9488, #0f766e)",
              }}
            />

            <div className="px-5 pt-5 pb-2">
              {/* Header row */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  {dialog.title && (
                    <p
                      className="text-[16px] font-extrabold leading-tight"
                      style={{ color: isDanger ? "#be123c" : "#134e4a" }}
                    >
                      {dialog.title}
                    </p>
                  )}
                  {dialog.message ? (
                    <p className="text-[13.5px] text-slate-500 leading-relaxed mt-1">
                      {dialog.message}
                    </p>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="shrink-0 mt-0.5 text-slate-300 hover:text-slate-500 transition-colors cursor-pointer"
                  title="Close"
                >
                  <X size={17} />
                </button>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 px-5 pb-5 pt-3">
              {dialog.type === "confirm" ? (
                <>
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="flex-1 py-2.5 rounded-xl text-[13.5px] font-semibold transition-all active:scale-95 cursor-pointer"
                    style={{
                      background: "#f1f5f9",
                      color: "#475569",
                    }}
                  >
                    {dialog.cancelText || "Cancel"}
                  </button>
                  <button
                    ref={confirmButtonRef}
                    type="button"
                    onClick={handleConfirm}
                    className="flex-1 py-2.5 rounded-xl text-white text-[13.5px] font-bold transition-all active:scale-95 cursor-pointer"
                    style={{
                      background: isDanger
                        ? "linear-gradient(135deg, #e11d48, #be123c)"
                        : "linear-gradient(135deg, #0d9488, #0f766e)",
                      boxShadow: isDanger
                        ? "0 2px 10px rgba(225,29,72,0.3)"
                        : "0 2px 10px rgba(13,148,136,0.3)",
                    }}
                  >
                    {dialog.confirmText || "Confirm"}
                  </button>
                </>
              ) : (
                <button
                  ref={confirmButtonRef}
                  type="button"
                  onClick={handleConfirm}
                  className="flex-1 py-2.5 rounded-xl text-white text-[13.5px] font-bold transition-all active:scale-95 cursor-pointer"
                  style={{
                    background: isDanger
                      ? "linear-gradient(135deg, #e11d48, #be123c)"
                      : "linear-gradient(135deg, #0d9488, #0f766e)",
                    boxShadow: isDanger
                      ? "0 2px 10px rgba(225,29,72,0.3)"
                      : "0 2px 10px rgba(13,148,136,0.3)",
                  }}
                >
                  {dialog.confirmText || "Got it"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </DialogContext.Provider>
  );
}
