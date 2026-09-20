"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useApp } from "@/lib/AppContext";
import { useBrandAssets } from "@/lib/useBrandAssets";
import { useConvexAuth, useAuthActions } from "@convex-dev/auth/react";
import { AuthModal } from "@/components/AuthModal";
import {
  Sparkles,
  Compass,
  LayoutDashboard,
  Inbox,
  PenTool,
  BookmarkCheck,
  Moon,
  Zap,
  Menu,
  X,
  User,
  LogOut,
  LogIn
} from "lucide-react";

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const { agentState, userInterests, topics } = useApp();
  const { logoUrl } = useBrandAssets();

  let isAuthenticated = false;
  let isLoading = false;
  let signOut = async () => {};

  try {
    const auth = useConvexAuth();
    if (auth) {
      isAuthenticated = auth.isAuthenticated;
      isLoading = auth.isLoading;
    }
  } catch (e) {
    // Graceful fallback during static generation or unconfigured auth
  }

  try {
    const actions = useAuthActions();
    if (actions) {
      signOut = actions.signOut;
    }
  } catch (e) {
    // Graceful fallback
  }

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const navLinks = [
    { name: "Explore", href: "/", icon: Compass },
    { name: "My Agent", href: "/dashboard", icon: LayoutDashboard },
    { name: "Request Center", href: "/requests", icon: Inbox },
    { name: "Interests", href: "/onboarding", icon: BookmarkCheck },
    { name: "Publisher Studio", href: "/publisher", icon: PenTool },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-petal-200/80 shadow-xs">
        {/* Top Main Navigation */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo & Brand Identity */}
            <Link href="/" className="flex items-center space-x-3 group">
              <div
                className="relative w-9 h-9 rounded-full overflow-hidden ring-2 ring-rosebrand/30 shadow-xs shrink-0 group-hover:ring-forest-700/40 transition-colors"
                style={{ width: 36, height: 36, minWidth: 36, minHeight: 36, maxWidth: 36, maxHeight: 36 }}
              >
                <Image
                  src={logoUrl}
                  alt="Moitrii Logo"
                  width={36}
                  height={36}
                  className="w-full h-full object-cover object-center rounded-full"
                  style={{ width: 36, height: 36, objectFit: "cover", objectPosition: "center" }}
                  priority
                />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center space-x-2">
                  <span className="font-brand-title text-xl sm:text-2xl font-bold tracking-tight text-charcoal-900 group-hover:text-forest-800 transition-colors">
                    Moitrii
                  </span>
                  <span className="text-[11px] bg-rosebrand-soft text-rosebrand px-2 py-0.5 rounded-full font-medium border border-rosebrand/20">
                    মৈত্রী · मैत्री
                  </span>
                </div>
                <span className="text-[10px] text-charcoal-500 tracking-wide">
                  Modern Lifestyle · Calm Companion
                </span>
              </div>
            </Link>

            {/* Desktop Nav Links */}
            <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center space-x-2 px-3.5 py-2 rounded-full text-sm font-medium transition-all ${
                      isActive
                        ? "bg-forest-800 text-white shadow-sm"
                        : "text-charcoal-700 hover:text-charcoal-900 hover:bg-petal-100/80"
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-charcoal-500"}`} />
                    <span>{link.name}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Right Status & Auth/Profile Controls */}
            <div className="hidden lg:flex items-center space-x-3">
              {/* Agent Live Badge */}
              <Link
                href="/dashboard"
                className="flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-cream-100 border border-petal-200 shadow-sm hover:border-forest-500/40 transition-colors"
              >
                <div className="relative flex items-center justify-center">
                  {agentState.status === "SLEEPING" ? (
                    <>
                      <Moon className="w-3.5 h-3.5 text-indigo-500" />
                      <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-indigo-400 rounded-full animate-ping opacity-75" />
                    </>
                  ) : (
                    <>
                      <Zap className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping opacity-75" />
                    </>
                  )}
                </div>
                <div className="text-left">
                  <span className="text-[11px] font-semibold text-charcoal-800 block leading-tight">
                    {agentState.status === "SLEEPING" ? "Agent Resting" : "Agent Active"}
                  </span>
                  <span className="text-[10px] text-charcoal-500 block leading-tight">
                    Wake: 08:00 AM
                  </span>
                </div>
              </Link>

              {/* Convex Auth Sign In / User Button */}
              {isAuthenticated ? (
                <div className="relative">
                  <button
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center space-x-2 bg-petal-100 hover:bg-petal-200 border border-petal-200 px-3 py-1.5 rounded-full text-xs font-semibold text-charcoal-800 transition-colors"
                  >
                    <div className="w-6 h-6 rounded-full bg-forest-800 text-white flex items-center justify-center text-[10px]">
                      P
                    </div>
                    <span>Priya</span>
                  </button>

                  {userDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-petal-200 p-2 text-xs space-y-1 z-50">
                      <div className="px-3 py-2 border-b border-petal-100">
                        <span className="font-bold text-charcoal-900 block">Priya Sharma</span>
                        <span className="text-[10px] text-charcoal-500 block">Daily Companion Plan</span>
                      </div>
                      <Link
                        href="/dashboard"
                        onClick={() => setUserDropdownOpen(false)}
                        className="block px-3 py-2 rounded-xl hover:bg-petal-50 text-charcoal-700"
                      >
                        Dashboard
                      </Link>
                      <Link
                        href="/onboarding"
                        onClick={() => setUserDropdownOpen(false)}
                        className="block px-3 py-2 rounded-xl hover:bg-petal-50 text-charcoal-700"
                      >
                        Topic Interests ({userInterests.length})
                      </Link>
                      <button
                        onClick={() => {
                          signOut();
                          setUserDropdownOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-red-50 text-red-600 font-medium flex items-center space-x-1.5"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => setAuthModalOpen(true)}
                  className="flex items-center space-x-1.5 bg-forest-800 hover:bg-forest-900 text-white text-xs font-bold px-4 py-2 rounded-full transition-colors shadow-xs"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </button>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-charcoal-700 hover:bg-petal-100"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Category Sub-Navigation Bar (Editorial Category Strip) */}
        <div className="border-t border-petal-200/60 bg-white/50 backdrop-blur-xs">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 overflow-x-auto scrollbar-none flex items-center space-x-6 text-xs text-charcoal-700">
            <span className="font-semibold uppercase tracking-wider text-[10px] text-charcoal-500 shrink-0">
              Editorial Streams:
            </span>
            {topics.map((t) => (
              <Link
                key={t.id}
                href={`/?topic=${t.id}`}
                className="whitespace-nowrap hover:text-forest-800 hover:font-medium transition-colors"
              >
                {t.name}
              </Link>
            ))}
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-petal-200 bg-petal-50 px-4 pt-2 pb-6 space-y-3">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center space-x-3 px-4 py-2.5 rounded-xl text-sm font-medium ${
                    isActive
                      ? "bg-forest-800 text-white"
                      : "text-charcoal-800 hover:bg-petal-100"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{link.name}</span>
                </Link>
              );
            })}
            <div className="pt-2 border-t border-petal-200 flex items-center justify-between text-xs text-charcoal-600">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  if (isAuthenticated) {
                    signOut();
                  } else {
                    setAuthModalOpen(true);
                  }
                }}
                className="text-forest-800 font-bold flex items-center space-x-1"
              >
                {isAuthenticated ? "Sign Out" : "Sign In / Register"}
              </button>
              <Link href="/onboarding" className="text-charcoal-600">
                {userInterests.length} Topics
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Convex Auth Modal Dialog */}
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </>
  );
};
