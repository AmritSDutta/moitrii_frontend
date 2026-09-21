"use client";

import React, { useState } from "react";
import { useValidatedAuth } from "@/lib/useValidatedAuth";
import { AuthModal } from "@/components/AuthModal";
import { Lock, Sparkles, ArrowRight } from "lucide-react";

interface AuthGuardProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({
  children,
  title = "Member Exclusive Area",
  description = "Please sign in with your Google account to access your personal AI agent, request history, and custom interests.",
}) => {
  const { status } = useValidatedAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Children render only after the backend confirms the session (viewer query
  // resolved to a user) — never on the client's local token belief alone.
  if (status === "checking") {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24 text-center">
        <div className="w-10 h-10 rounded-full border-2 border-forest-800 border-t-transparent animate-spin mx-auto mb-4" />
        <p className="text-xs text-charcoal-500">Checking authentication...</p>
      </div>
    );
  }

  if (status === "signedOut") {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center animate-fade-in">
        <div className="w-14 h-14 rounded-full bg-petal-100 text-forest-800 flex items-center justify-center mx-auto mb-6 ring-4 ring-petal-200 shadow-sm">
          <Lock className="w-6 h-6 text-forest-800" />
        </div>
        <div className="inline-flex items-center space-x-1.5 bg-petal-100 text-forest-800 text-xs font-semibold px-3 py-1 rounded-full border border-petal-200 mb-4">
          <Sparkles className="w-3.5 h-3.5 text-rosebrand" />
          <span>Member Exclusive</span>
        </div>
        <h1 className="font-editorial text-3xl sm:text-4xl font-bold text-charcoal-900 tracking-tight mb-3">
          {title}
        </h1>
        <p className="text-sm text-charcoal-600 max-w-md mx-auto mb-8 leading-relaxed">
          {description}
        </p>
        <button
          onClick={() => setAuthModalOpen(true)}
          className="inline-flex items-center space-x-2 bg-forest-800 hover:bg-forest-900 text-white text-sm font-semibold px-6 py-3 rounded-full transition-all shadow-md hover:shadow-lg"
        >
          <span>Sign In with Google</span>
          <ArrowRight className="w-4 h-4" />
        </button>
        <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
      </div>
    );
  }

  return <>{children}</>;
};
