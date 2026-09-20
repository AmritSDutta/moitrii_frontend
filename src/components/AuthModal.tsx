"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useAuthActions } from "@convex-dev/auth/react";
import { X, Lock, Mail, User, Sparkles, ArrowRight, AlertCircle, CheckCircle2 } from "lucide-react";
import { useBrandAssets } from "@/lib/useBrandAssets";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { logoUrl } = useBrandAssets();
  const { signIn } = useAuthActions();
  const [step, setStep] = useState<"signIn" | "signUp">("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const formData = new FormData();
      formData.set("email", email);
      formData.set("password", password);
      formData.set("flow", step);
      if (step === "signUp" && name) {
        formData.set("name", name);
      }

      await signIn("password", formData);
      setSuccess(step === "signIn" ? "Welcome back to Moitrii!" : "Account created successfully!");
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err: any) {
      console.error("Auth error:", err);
      setError(
        err?.message ||
          "Authentication failed. Please verify your credentials or check your connection."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-charcoal-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-petal-200 overflow-hidden animate-fade-in">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-full text-charcoal-400 hover:text-charcoal-700 hover:bg-petal-100 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header with Logo */}
        <div className="text-center space-y-3 mb-6">
          <div
            className="relative w-12 h-12 rounded-full overflow-hidden ring-2 ring-rosebrand/40 shadow-sm mx-auto shrink-0"
            style={{ width: 48, height: 48, minWidth: 48, minHeight: 48, maxWidth: 48, maxHeight: 48 }}
          >
            <Image
              src={logoUrl}
              alt="Moitrii Emblem"
              width={48}
              height={48}
              className="w-full h-full object-cover object-center rounded-full"
              style={{ width: 48, height: 48, objectFit: "cover", objectPosition: "center" }}
            />
          </div>
          <div>
            <h2 className="font-editorial text-2xl font-bold text-charcoal-900">
              {step === "signIn" ? "Welcome Back to Moitrii" : "Create Your Companion"}
            </h2>
            <p className="text-xs text-charcoal-500 mt-0.5">
              {step === "signIn"
                ? "Sign in to access your persistent agent and request queue."
                : "Join Moitrii for your dedicated lifestyle AI companion."}
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex bg-petal-100 p-1 rounded-full text-xs font-bold mt-4">
            <button
              type="button"
              onClick={() => {
                setStep("signIn");
                setError(null);
              }}
              className={`flex-1 py-1.5 rounded-full transition-colors ${
                step === "signIn"
                  ? "bg-white text-forest-800 shadow-xs"
                  : "text-charcoal-600 hover:text-charcoal-900"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setStep("signUp");
                setError(null);
              }}
              className={`flex-1 py-1.5 rounded-full transition-colors ${
                step === "signUp"
                  ? "bg-white text-forest-800 shadow-xs"
                  : "text-charcoal-600 hover:text-charcoal-900"
              }`}
            >
              Create Account
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {step === "signUp" && (
            <div className="space-y-1">
              <label className="text-xs font-bold text-charcoal-700 block">Your Name</label>
              <div className="relative flex items-center">
                <User className="w-4 h-4 text-charcoal-400 absolute left-3.5" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Priya Sharma"
                  className="w-full pl-10 pr-4 py-2.5 text-xs bg-petal-50/80 rounded-xl border border-petal-200 focus:outline-none focus:ring-2 focus:ring-forest-800/30 text-charcoal-900"
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-bold text-charcoal-700 block">Email Address</label>
            <div className="relative flex items-center">
              <Mail className="w-4 h-4 text-charcoal-400 absolute left-3.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-10 pr-4 py-2.5 text-xs bg-petal-50/80 rounded-xl border border-petal-200 focus:outline-none focus:ring-2 focus:ring-forest-800/30 text-charcoal-900"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-charcoal-700 block">Password</label>
            <div className="relative flex items-center">
              <Lock className="w-4 h-4 text-charcoal-400 absolute left-3.5" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 text-xs bg-petal-50/80 rounded-xl border border-petal-200 focus:outline-none focus:ring-2 focus:ring-forest-800/30 text-charcoal-900"
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-start space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{success}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-forest-800 hover:bg-forest-900 disabled:opacity-50 text-white text-xs font-bold py-3 rounded-xl transition-colors shadow-sm flex items-center justify-center space-x-2 mt-2"
          >
            <span>
              {loading
                ? "Connecting..."
                : step === "signIn"
                ? "Sign In to Moitrii"
                : "Create Companion Account"}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Footer Note */}
        <p className="text-[11px] text-center text-charcoal-400 mt-5 leading-relaxed">
          Protected by Convex Cloud Auth · Calm Technology
        </p>
      </div>
    </div>
  );
};
