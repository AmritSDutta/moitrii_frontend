"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useApp } from "@/lib/AppContext";
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
  Search
} from "lucide-react";

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const { agentState, userInterests, topics } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { name: "Explore", href: "/", icon: Compass },
    { name: "My Agent", href: "/dashboard", icon: LayoutDashboard },
    { name: "Request Center", href: "/requests", icon: Inbox },
    { name: "Interests", href: "/onboarding", icon: BookmarkCheck },
    { name: "Publisher Studio", href: "/publisher", icon: PenTool },
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#FAF4F0]/95 backdrop-blur-md border-b border-petal-200">
      {/* Top Main Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo & Brand Identity */}
          <Link href="/" className="flex items-center space-x-3.5 group">
            <div className="relative w-12 h-12 rounded-full overflow-hidden ring-2 ring-rosebrand/30 shadow-md transition-transform group-hover:scale-105">
              <Image
                src="/images/moitrii_logo.jpg"
                alt="Moitrii Logo"
                fill
                className="object-cover object-top"
                priority
              />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center space-x-2">
                <span className="font-brand-title text-2xl font-bold tracking-tight text-charcoal-900 group-hover:text-forest-800 transition-colors">
                  Moitrii
                </span>
                <span className="text-xs bg-rosebrand-soft text-rosebrand px-2 py-0.5 rounded-full font-medium border border-rosebrand/20">
                  মৈত্রী · मैत्री
                </span>
              </div>
              <span className="text-[11px] text-charcoal-500 tracking-wide">
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

          {/* Right Status & Quick Profile */}
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

            {/* Topic pill count */}
            <Link
              href="/onboarding"
              className="text-xs bg-petal-100 hover:bg-petal-200 text-charcoal-700 px-3 py-1.5 rounded-full font-medium transition-colors border border-petal-200"
            >
              {userInterests.length} Topics Followed
            </Link>
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
      <div className="border-t border-petal-200/80 bg-[#FAF4F0]/80">
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
            <span>Agent Status: <strong>{agentState.status}</strong></span>
            <Link href="/onboarding" className="text-forest-800 font-medium">
              Manage {userInterests.length} Topics →
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
