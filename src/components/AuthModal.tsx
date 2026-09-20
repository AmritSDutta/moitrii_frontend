"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useAuthActions } from "@convex-dev/auth/react";
import { X, Sparkles, ShieldCheck, AlertCircle, ArrowRight } from "lucide-react";
import { useBrandAssets } from "@/lib/useBrandAssets";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { logoUrl } = useBrandAssets();
  const { signIn } = useAuthActions();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      await signIn("google");
    } catch (err: any) {
      console.error("Google Auth error:", err);
      setError(
        err?.message ||
          "Could not initialize Google sign-in. Please ensure Google OAuth credentials are set in Convex."
      );
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
              Welcome to Moitrii
            </h2>
            <p className="text-xs text-charcoal-600 mt-1 max-w-xs mx-auto leading-relaxed">
              Connect your Google account to access your personal lifestyle AI companion, saved interests, and deliverable queue.
            </p>
          </div>
        </div>

        {/* Action Area */}
        <div className="space-y-4 my-6">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="button"
            disabled={loading}
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center space-x-3 py-3.5 px-4 bg-white hover:bg-petal-50 disabled:opacity-60 border border-petal-300 rounded-2xl text-xs sm:text-sm font-semibold text-charcoal-900 transition-all shadow-sm hover:shadow group"
          >
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>{loading ? "Connecting to Google..." : "Continue with Google"}</span>
            <ArrowRight className="w-4 h-4 text-charcoal-400 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        {/* Privacy & Trust Badge */}
        <div className="pt-4 border-t border-petal-200/80 flex items-center justify-center space-x-2 text-[11px] text-charcoal-500">
          <ShieldCheck className="w-4 h-4 text-forest-700 shrink-0" />
          <span>Private & Secure · Convex Cloud Auth</span>
        </div>
      </div>
    </div>
  );
};

