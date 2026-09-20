"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Sparkles, Heart, ShieldCheck, RefreshCw, Feather } from "lucide-react";
import { useBrandAssets } from "@/lib/useBrandAssets";

export const Footer: React.FC = () => {
  const { logoUrl } = useBrandAssets();

  return (
    <footer className="bg-petal-100/90 border-t border-petal-200 mt-20 pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-petal-200">
          {/* Brand Col */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center space-x-3">
              <div className="relative w-10 h-10 rounded-full overflow-hidden ring-2 ring-rosebrand/30 shadow">
                <Image
                  src={logoUrl}
                  alt="Moitrii Emblem"
                  fill
                  className="object-cover object-top"
                />
              </div>
              <span className="font-brand-title text-2xl font-bold text-charcoal-900">
                Moitrii
              </span>
            </div>
            <p className="text-xs text-charcoal-600 leading-relaxed">
              Affordable personal AI companion designed for the modern Indian woman. 
              Grounded in intentional living, wellness, family, and calm technology.
            </p>
            <div className="text-[11px] text-charcoal-500 italic space-y-0.5">
              <p>বাংলা: আপনার পাশে, একটি সুন্দর আগামীর জন্য</p>
              <p>हिंदी: हर दिन आपके साथ, एक सुंदर कल के लिए</p>
            </div>
          </div>

          {/* Navigation Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-charcoal-900 mb-4">
              Explore Moitrii
            </h4>
            <ul className="space-y-2.5 text-xs text-charcoal-600">
              <li>
                <Link href="/" className="hover:text-forest-800 transition-colors">
                  Reader-Favorite Articles
                </Link>
              </li>
              <li>
                <Link href="/onboarding" className="hover:text-forest-800 transition-colors">
                  Topic Subscriptions
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-forest-800 transition-colors">
                  Personal Agent Dashboard
                </Link>
              </li>
              <li>
                <Link href="/requests" className="hover:text-forest-800 transition-colors">
                  Request Center & History
                </Link>
              </li>
              <li>
                <Link href="/publisher" className="hover:text-forest-800 transition-colors">
                  Publisher Studio
                </Link>
              </li>
            </ul>
          </div>

          {/* Philosophy & Architecture */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-charcoal-900 mb-4">
              Our Core Philosophy
            </h4>
            <ul className="space-y-3 text-xs text-charcoal-600">
              <li className="flex items-start space-x-2">
                <ShieldCheck className="w-4 h-4 text-forest-700 shrink-0 mt-0.5" />
                <span><strong>Equal Intelligence:</strong> All users get the exact same powerful AI capability.</span>
              </li>
              <li className="flex items-start space-x-2">
                <RefreshCw className="w-4 h-4 text-terracotta shrink-0 mt-0.5" />
                <span><strong>Sleeping Agent Model:</strong> Subscription pricing controls only wake periodicity, not capabilities.</span>
              </li>
              <li className="flex items-start space-x-2">
                <Feather className="w-4 h-4 text-rosebrand shrink-0 mt-0.5" />
                <span><strong>Shared Knowledge:</strong> Agents reuse verified guides to preserve compute and provide instant answers.</span>
              </li>
            </ul>
          </div>

          {/* Newsletter / Contact */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-charcoal-900 mb-4">
              Intentional Digest
            </h4>
            <p className="text-xs text-charcoal-600 mb-3">
              Receive your agent’s curated lifestyle summary in your morning inbox.
            </p>
            <div className="flex items-center space-x-2">
              <input
                type="email"
                placeholder="Your email address"
                className="w-full text-xs px-3 py-2 rounded-full border border-petal-200 bg-white focus:outline-none focus:ring-1 focus:ring-forest-800"
              />
              <button className="bg-forest-800 hover:bg-forest-900 text-white text-xs px-4 py-2 rounded-full font-medium transition-colors shrink-0 shadow-sm">
                Subscribe
              </button>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-charcoal-500 space-y-4 sm:space-y-0">
          <p>© 2026 Moitrii. Built for the Convex Hackathon. All rights reserved.</p>
          <div className="flex items-center space-x-6">
            <span>Modern Lifestyle</span>
            <span>·</span>
            <span>Calm Technology</span>
            <span>·</span>
            <span>Convex Backend</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
