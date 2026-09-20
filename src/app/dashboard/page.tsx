"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useApp } from "@/lib/AppContext";
import {
  Moon,
  Zap,
  Sparkles,
  Clock,
  ArrowRight,
  CheckCircle,
  Hourglass,
  RefreshCw,
  Send,
  BookOpen,
  Settings,
  Plus
} from "lucide-react";

export default function DashboardPage() {
  const {
    agentState,
    userInterests,
    topics,
    requests,
    articles,
    submitRequest,
    triggerManualWake
  } = useApp();

  const [promptInput, setPromptInput] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Health & Nutrition");
  const [submitting, setSubmitting] = useState(false);
  const [successToast, setSuccessToast] = useState(false);

  const handlePromptSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptInput.trim()) return;

    setSubmitting(true);
    submitRequest(promptInput, selectedCategory);
    setPromptInput("");
    setSubmitting(false);
    setSuccessToast(true);
    setTimeout(() => setSuccessToast(false), 4000);
  };

  const completedRequests = requests.filter((r) => r.status === "COMPLETED");
  const pendingRequests = requests.filter((r) => r.status === "PENDING" || r.status === "PROCESSING");

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* 1. TOP GREETING & AGENT STATUS HERO */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-petal-200 shadow-editorial relative overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left: Greeting & Status */}
          <div className="lg:col-span-8 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="relative w-12 h-12 rounded-full overflow-hidden ring-2 ring-rosebrand/40 shadow-sm">
                <Image
                  src="/images/moitrii_logo.jpg"
                  alt="Moitrii Agent"
                  fill
                  className="object-cover object-top"
                />
              </div>
              <div>
                <h1 className="font-editorial text-2xl sm:text-3xl font-bold text-charcoal-900">
                  Good Morning, Priya
                </h1>
                <p className="text-xs text-charcoal-500">
                  Your dedicated Moitrii agent is managing your personalized lifestyle feeds.
                </p>
              </div>
            </div>

            {/* Agent Live State Box */}
            <div className="p-4 rounded-2xl bg-petal-50 border border-petal-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center space-x-3.5">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm ${
                    agentState.status === "SLEEPING"
                      ? "bg-indigo-50 text-indigo-600 ring-2 ring-indigo-200 animate-pulse-subtle"
                      : "bg-emerald-50 text-emerald-600 ring-2 ring-emerald-300 animate-bounce"
                  }`}
                >
                  {agentState.status === "SLEEPING" ? (
                    <Moon className="w-5 h-5" />
                  ) : (
                    <Zap className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-charcoal-900">
                      Agent Status: {agentState.status}
                    </span>
                    <span className="text-[10px] bg-white px-2 py-0.5 rounded-full border border-petal-200 text-charcoal-600">
                      Tier: {agentState.subscriptionTier}
                    </span>
                  </div>
                  <p className="text-xs text-charcoal-600 mt-0.5">
                    {agentState.statusMessage}
                  </p>
                </div>
              </div>

              {/* Demo Wake Trigger */}
              <button
                onClick={triggerManualWake}
                disabled={agentState.status === "WORKING"}
                className="text-xs bg-white hover:bg-forest-50 text-forest-800 border border-forest-700/30 hover:border-forest-700 px-4 py-2 rounded-full font-bold transition-all shrink-0 flex items-center space-x-1.5 shadow-xs"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>
                  {agentState.status === "WORKING"
                    ? "Agent Researching..."
                    : "Simulate Wake Cycle ⚡"}
                </span>
              </button>
            </div>
          </div>

          {/* Right: Wake Cycle Schedule */}
          <div className="lg:col-span-4 bg-petal-100/70 p-5 rounded-2xl border border-petal-200 space-y-3">
            <div className="flex items-center justify-between text-xs text-charcoal-600">
              <span className="font-bold uppercase tracking-wider text-charcoal-900">
                Wake-Up Schedule
              </span>
              <Clock className="w-4 h-4 text-charcoal-500" />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-charcoal-600">Next Scheduled Wake:</span>
                <span className="font-bold text-forest-900">{agentState.nextWakeTime}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-charcoal-600">Frequency:</span>
                <span className="font-medium text-charcoal-800">{agentState.wakeFrequency}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-charcoal-600">Last Active:</span>
                <span className="text-charcoal-700">{agentState.lastActiveTime}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-petal-200/80 flex items-center justify-between text-[11px] text-charcoal-500">
              <span>{pendingRequests.length} pending request(s) queued</span>
              <Link href="/requests" className="text-forest-800 font-semibold hover:underline">
                View Queue →
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* 2. QUICK REQUEST COMPOSER */}
      <div className="bg-gradient-to-r from-cream-100 to-petal-100 p-6 sm:p-8 rounded-3xl border border-petal-200 shadow-sm space-y-4">
        <div className="space-y-1">
          <span className="text-xs font-bold uppercase tracking-widest text-forest-700">
            NATURAL LANGUAGE PROMPT
          </span>
          <h2 className="font-editorial text-2xl font-bold text-charcoal-900">
            What Would You Like Your Agent to Work On?
          </h2>
          <p className="text-xs text-charcoal-600">
            Submit requests at any time. Your agent will fulfill them during its next scheduled wake-up cycle.
          </p>
        </div>

        <form onSubmit={handlePromptSubmit} className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={promptInput}
              onChange={(e) => setPromptInput(e.target.value)}
              placeholder="e.g. Find 3 easy immunity-boosting soup recipes for rainy season..."
              className="flex-grow px-4 py-3 text-sm bg-white rounded-2xl border border-petal-200 focus:outline-none focus:ring-2 focus:ring-forest-800/30 shadow-xs"
            />

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-3 text-xs bg-white rounded-2xl border border-petal-200 text-charcoal-800 focus:outline-none focus:ring-2 focus:ring-forest-800/30 shrink-0"
            >
              {topics.map((t) => (
                <option key={t.id} value={t.name}>
                  {t.name}
                </option>
              ))}
            </select>

            <button
              type="submit"
              disabled={submitting || !promptInput.trim()}
              className="bg-forest-800 hover:bg-forest-900 disabled:opacity-50 text-white text-xs font-bold px-6 py-3 rounded-2xl transition-colors shadow-sm flex items-center justify-center space-x-2 shrink-0"
            >
              <Send className="w-4 h-4" />
              <span>Submit Request</span>
            </button>
          </div>
        </form>

        {/* Success Toast */}
        {successToast && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center space-x-2 animate-fade-in">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              Request persisted successfully! It is queued for your agent’s next wake window.
            </span>
          </div>
        )}
      </div>

      {/* 3. YOUR INTERESTS STRIP */}
      <div className="flex items-center justify-between flex-wrap gap-4 pb-2 border-b border-petal-200">
        <div>
          <h3 className="font-editorial text-xl font-bold text-charcoal-900">
            Your Active Interests
          </h3>
          <p className="text-xs text-charcoal-500">
            Topics informing your personal agent’s research digest.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {topics
            .filter((t) => userInterests.includes(t.id))
            .map((t) => (
              <span
                key={t.id}
                className="bg-white text-charcoal-800 border border-petal-200 text-xs px-3 py-1.5 rounded-full font-medium shadow-xs"
              >
                {t.name}
              </span>
            ))}
          <Link
            href="/onboarding"
            className="text-xs text-forest-800 hover:text-forest-900 font-bold px-3 py-1.5 rounded-full bg-petal-100 hover:bg-petal-200 flex items-center space-x-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Edit Topics</span>
          </Link>
        </div>
      </div>

      {/* 4. AGENT WORK FEED */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Completed Deliverables */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-editorial text-2xl font-bold text-charcoal-900">
                Ready to Read
              </h3>
              <p className="text-xs text-charcoal-500">
                Deliverables prepared and verified by your agent.
              </p>
            </div>
            <span className="text-xs bg-forest-50 text-forest-800 font-bold px-3 py-1 rounded-full border border-forest-100">
              {completedRequests.length} Ready
            </span>
          </div>

          <div className="space-y-4">
            {completedRequests.map((req) => (
              <div
                key={req.id}
                className="bg-white p-6 rounded-2xl border border-petal-200 shadow-sm hover:shadow-md transition-all space-y-3 group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-rosebrand uppercase tracking-wider">
                      {req.category}
                    </span>
                    <h4 className="font-editorial text-lg font-bold text-charcoal-900 group-hover:text-forest-800 transition-colors">
                      {req.contentTitle || req.prompt}
                    </h4>
                    <p className="text-xs text-charcoal-600 italic">
                      Original prompt: &ldquo;{req.prompt}&rdquo;
                    </p>
                  </div>

                  <Link
                    href={req.contentId ? `/content/${req.contentId}` : `/content/healthy-drinks-kids`}
                    className="bg-forest-800 hover:bg-forest-900 text-white text-xs font-bold px-4 py-2 rounded-full transition-colors shrink-0 flex items-center space-x-1.5 shadow-xs"
                  >
                    <span>Read Guide</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="pt-3 border-t border-petal-100 flex items-center justify-between text-xs text-charcoal-500">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span>Fulfilled at {req.completedAt}</span>
                  </div>
                  {req.isReused && (
                    <span className="text-[10px] bg-petal-100 text-charcoal-700 px-2 py-0.5 rounded-full flex items-center space-x-1">
                      <RefreshCw className="w-3 h-3 text-forest-700" />
                      <span>Shared Knowledge Reuse</span>
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Queued / Processing Requests */}
        <div className="lg:col-span-4 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-editorial text-2xl font-bold text-charcoal-900">
                Queued Tasks
              </h3>
              <p className="text-xs text-charcoal-500">
                Scheduled for next wake-up.
              </p>
            </div>
            <span className="text-xs bg-petal-100 text-charcoal-700 font-bold px-3 py-1 rounded-full">
              {pendingRequests.length} Queued
            </span>
          </div>

          <div className="space-y-4">
            {pendingRequests.length === 0 ? (
              <div className="bg-white p-6 rounded-2xl border border-petal-200 text-center space-y-2">
                <p className="text-xs text-charcoal-500">No pending requests.</p>
                <p className="text-[11px] text-charcoal-400">
                  Use the quick prompt above to give your agent a new task!
                </p>
              </div>
            ) : (
              pendingRequests.map((req) => (
                <div
                  key={req.id}
                  className="bg-white p-5 rounded-2xl border border-petal-200 shadow-sm space-y-2"
                >
                  <div className="flex items-center justify-between text-[10px] text-charcoal-500">
                    <span className="font-bold text-rosebrand uppercase">{req.category}</span>
                    <span className="flex items-center space-x-1 text-indigo-600 font-medium">
                      <Hourglass className="w-3 h-3" />
                      <span>Wake Window: 08:00 AM</span>
                    </span>
                  </div>
                  <p className="text-xs font-medium text-charcoal-900 leading-snug">
                    {req.prompt}
                  </p>
                  <div className="pt-2 text-[10px] text-charcoal-400">
                    Submitted {req.submittedAt}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
