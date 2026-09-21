import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useApp } from "@/lib/AppContext";
import { useBrandAssets } from "@/lib/useBrandAssets";
import { useQuery, useMutation } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "../../convex/_generated/api";
import {
  Moon,
  Zap,
  Sparkles,
  ArrowRight,
  CheckCircle,
  Hourglass,
  RefreshCw,
  Send,
  Settings,
  Plus,
  Loader2,
  X,
  AlertCircle,
  Languages,
  Mail,
  LogOut
} from "lucide-react";

export function DashboardPage() {
  const navigate = useNavigate();
  const { signOut } = useAuthActions();
  const {
    agentState: fallbackAgentState,
    topics,
    triggerManualWake,
  } = useApp();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (err) {
      console.error("Sign out failed:", err);
    }
    navigate("/");
  };

  const { logoUrl } = useBrandAssets();
  const user = useQuery(api.users.viewer);
  const liveAgent = useQuery(api.agents.getAgentState);
  const liveInterests = useQuery(api.users.getInterests);
  const liveRequests = useQuery(api.requests.listUserRequests);
  const createRequestMutation = useMutation(api.requests.createRequest);
  const updateWakeScheduleMutation = useMutation(api.agents.updateWakeSchedule);
  const updatePreferredLanguageMutation = useMutation(api.users.updatePreferredLanguage);

  const displayName = user?.name || user?.email?.split("@")[0] || "Friend";

  const agentState = liveAgent || fallbackAgentState;
  const userInterests = liveInterests ?? [];

  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedWakeTime, setSelectedWakeTime] = useState(
    (liveAgent as any)?.wakeTimeOfDay || "23:00"
  );
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [scheduleError, setScheduleError] = useState("");
  const [scheduleSuccess, setScheduleSuccess] = useState(false);

  const [updatingLanguage, setUpdatingLanguage] = useState(false);
  const [languageToast, setLanguageToast] = useState(false);

  const handleLanguageChange = async (lang: "en" | "bn" | "hi") => {
    setUpdatingLanguage(true);
    try {
      await updatePreferredLanguageMutation({ language: lang });
      setLanguageToast(true);
      setTimeout(() => setLanguageToast(false), 3000);
    } catch (err) {
      console.error("Failed to update preferred language:", err);
    } finally {
      setUpdatingLanguage(false);
    }
  };

  const requestsLoading = liveRequests === undefined;
  const rawRequests = (liveRequests ?? []).map((r) => ({
    id: r._id,
    prompt: r.prompt,
    category: r.category,
    status: r.status,
    submittedAt: r.submittedAt,
    scheduledFor: r.scheduledFor,
    completedAt: r.completedAt,
    contentId: r.contentId,
    contentTitle: r.contentTitle,
    isReused: r.isReused,
    reuseNote: r.reuseNote,
  }));

  const [promptInput, setPromptInput] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Health & Nutrition");
  const [submitting, setSubmitting] = useState(false);
  const [successToast, setSuccessToast] = useState(false);

  const handlePromptSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptInput.trim()) return;

    setSubmitting(true);
    try {
      await createRequestMutation({
        prompt: promptInput.trim(),
        category: selectedCategory,
      });
      setPromptInput("");
      setSuccessToast(true);
      setTimeout(() => setSuccessToast(false), 4000);
    } catch (err) {
      console.error("Failed to create request:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const WAKE_SCHEDULE_PRESETS = [
    { label: "07:00 AM IST (Morning)", value: "07:00" },
    { label: "09:00 AM IST", value: "09:00" },
    { label: "12:00 PM IST (Noon)", value: "12:00" },
    { label: "03:00 PM IST (Afternoon)", value: "15:00" },
    { label: "06:00 PM IST (Evening)", value: "18:00" },
    { label: "09:00 PM IST", value: "21:00" },
    { label: "11:00 PM IST (Default)", value: "23:00" },
    { label: "12:00 AM IST (Midnight)", value: "00:00" },
  ];

  const handleScheduleSave = async (timeToSet?: string) => {
    const target = timeToSet || selectedWakeTime;
    setScheduleError("");

    setSavingSchedule(true);
    try {
      await updateWakeScheduleMutation({
        wakeTimeOfDay: target,
      });
      setSelectedWakeTime(target);
      setScheduleSuccess(true);
      setTimeout(() => {
        setScheduleSuccess(false);
        setShowScheduleModal(false);
      }, 1200);
    } catch (err: any) {
      setScheduleError(err?.message || "Failed to update wake schedule.");
    } finally {
      setSavingSchedule(false);
    }
  };

  const completedRequests = rawRequests.filter((r: any) => r.status === "COMPLETED");
  const pendingRequests = rawRequests.filter((r: any) => r.status === "PENDING" || r.status === "PROCESSING");

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* 1. TOP GREETING & AGENT STATUS HERO */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-petal-200 shadow-editorial relative overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left: Greeting & Status */}
          <div className="lg:col-span-8 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center space-x-3">
                <div
                  className="relative w-12 h-12 rounded-full overflow-hidden ring-2 ring-rosebrand/40 shadow-sm shrink-0"
                  style={{ width: 48, height: 48, minWidth: 48, maxWidth: 48 }}
                >
                  <img
                    src={logoUrl}
                    alt="Moitrii Agent"
                    className="w-full h-full object-cover object-center rounded-full"
                  />
                </div>
                <div>
                  <h1 className="font-editorial text-2xl sm:text-3xl font-bold text-charcoal-900">
                    Good Morning, {displayName}
                  </h1>
                  <p className="text-xs text-charcoal-500">
                    Your dedicated Moitrii agent is managing your personalized lifestyle feeds.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleSignOut}
                className="inline-flex items-center space-x-1.5 text-xs text-charcoal-600 hover:text-red-600 bg-petal-100 hover:bg-red-50 border border-petal-200 hover:border-red-200 px-3.5 py-1.5 rounded-full font-medium transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
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
                  <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-charcoal-900">
                      Agent Status: {agentState.status}
                    </span>
                    <span className="text-[10px] bg-white px-2 py-0.5 rounded-full border border-petal-200 text-charcoal-600">
                      Tier: {agentState.subscriptionTier}
                    </span>
                    <span className="text-[10px] bg-forest-50 px-2 py-0.5 rounded-full border border-forest-200/60 text-forest-800 font-medium flex items-center space-x-1">
                      <Mail className="w-2.5 h-2.5" />
                      <span>{(liveAgent as any)?.email || (agentState as any).email || "agent@agentmail.to"}</span>
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

          {/* Right: Sidebar Stack */}
          <div className="lg:col-span-4 space-y-4">
            {/* Wake-Up Schedule Card */}
            <div className="bg-petal-100/70 p-5 rounded-2xl border border-petal-200 space-y-3">
              <div className="flex items-center justify-between text-xs text-charcoal-600">
                <span className="font-bold uppercase tracking-wider text-charcoal-900">
                  Wake-Up Schedule
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedWakeTime((liveAgent as any)?.wakeTimeOfDay || "23:00");
                    setScheduleError("");
                    setScheduleSuccess(false);
                    setShowScheduleModal(true);
                  }}
                  className="text-[11px] text-forest-800 hover:text-forest-900 font-bold underline flex items-center space-x-1"
                >
                  <Settings className="w-3 h-3" />
                  <span>Modify</span>
                </button>
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
                <Link to="/requests" className="text-forest-800 font-semibold hover:underline">
                  View Queue →
                </Link>
              </div>
            </div>

            {/* Preferred Language Card */}
            <div className="bg-petal-100/70 p-4 sm:p-5 rounded-2xl border border-petal-200 space-y-3">
              <div className="flex items-center justify-between text-xs text-charcoal-600">
                <div className="flex items-center space-x-1.5">
                  <Languages className="w-3.5 h-3.5 text-forest-700" />
                  <span className="font-bold uppercase tracking-wider text-charcoal-900">
                    Agent Language
                  </span>
                </div>
                {updatingLanguage && (
                  <span className="text-[11px] text-forest-700 flex items-center space-x-1 font-medium">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Saving...</span>
                  </span>
                )}
              </div>

              {/* Segmented Pill Track */}
              <div className="bg-petal-200/50 p-1 rounded-xl flex items-center gap-1 border border-petal-200/80">
                {[
                  { code: "en", label: "English", tag: "EN" },
                  { code: "bn", label: "বাংলা", tag: "BN" },
                  { code: "hi", label: "हिन्दी", tag: "HI" },
                ].map((item) => {
                  const currentLang = (user as any)?.preferredLanguage ?? "en";
                  const isActive = currentLang === item.code;
                  return (
                    <button
                      key={item.code}
                      type="button"
                      disabled={updatingLanguage}
                      onClick={() => handleLanguageChange(item.code as any)}
                      className={`flex-1 py-2 px-2 rounded-lg text-center transition-all duration-200 flex items-center justify-center space-x-1.5 ${
                        isActive
                          ? "bg-white text-forest-900 font-bold shadow-xs border border-petal-200/60 ring-1 ring-forest-900/5"
                          : "text-charcoal-600 hover:text-charcoal-900 hover:bg-white/40 font-medium text-xs"
                      }`}
                    >
                      <span className="text-xs">{item.label}</span>
                      <span
                        className={`text-[10px] px-1 py-0.2 rounded font-mono ${
                          isActive
                            ? "bg-forest-50 text-forest-800 font-semibold"
                            : "bg-petal-200/60 text-charcoal-500"
                        }`}
                      >
                        {item.tag}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Dynamic Contextual Helper */}
              <div className="text-[11px] text-charcoal-500 flex items-center justify-between pt-0.5">
                <span>
                  {((user as any)?.preferredLanguage ?? "en") === "bn"
                    ? "গবেষণা ও অডিও বাংলায় প্রস্তুত হবে"
                    : ((user as any)?.preferredLanguage ?? "en") === "hi"
                    ? "रिसर्च और ऑडियो हिन्दी में तैयार होगा"
                    : "Synthesizing research & audio in English"}
                </span>
                {languageToast && (
                  <span className="text-emerald-700 font-semibold flex items-center space-x-0.5">
                    <CheckCircle className="w-3 h-3 text-emerald-600" />
                    <span>Saved</span>
                  </span>
                )}
              </div>
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
            to="/onboarding"
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
            {requestsLoading ? (
              <div className="bg-white p-6 rounded-2xl border border-petal-200 text-center">
                <p className="text-xs text-charcoal-500">Loading your agent's work…</p>
              </div>
            ) : completedRequests.length === 0 ? (
              <div className="bg-white p-6 rounded-2xl border border-petal-200 text-center space-y-2">
                <p className="text-xs text-charcoal-500">No deliverables yet.</p>
                <p className="text-[11px] text-charcoal-400">
                  Submit a prompt above — your agent will prepare a guide at its next wake.
                </p>
              </div>
            ) : (
              completedRequests.map((req: any) => (
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
                      to={req.contentId ? `/content/${req.contentId}` : `/content/healthy-drinks-kids`}
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
              ))
            )}
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
            {requestsLoading ? (
              <div className="bg-white p-6 rounded-2xl border border-petal-200 text-center">
                <p className="text-xs text-charcoal-500">Loading queued tasks…</p>
              </div>
            ) : pendingRequests.length === 0 ? (
              <div className="bg-white p-6 rounded-2xl border border-petal-200 text-center space-y-2">
                <p className="text-xs text-charcoal-500">No pending requests.</p>
                <p className="text-[11px] text-charcoal-400">
                  Use the quick prompt above to give your agent a new task!
                </p>
              </div>
            ) : (
              pendingRequests.map((req: any) => (
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

      {/* SCHEDULE MODAL */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 border border-petal-200 shadow-editorial space-y-6 relative">
            <div className="flex items-center justify-between border-b border-petal-100 pb-4">
              <div className="flex items-center space-x-2">
                <Moon className="w-5 h-5 text-forest-800" />
                <h3 className="font-editorial text-xl font-bold text-charcoal-900">
                  Agent Wake Schedule
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowScheduleModal(false)}
                className="p-1 rounded-full text-charcoal-400 hover:text-charcoal-700 hover:bg-petal-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Calm Tech Info Banner */}
            <div className="p-4 bg-forest-50/70 border border-forest-200/50 rounded-2xl text-xs text-forest-900 space-y-1">
              <div className="font-bold flex items-center space-x-1.5 text-forest-800">
                <Sparkles className="w-3.5 h-3.5 text-forest-700" />
                <span>Personalized Wake Schedule</span>
              </div>
              <p className="text-forest-700 text-[11px] leading-relaxed">
                Choose any time of day (IST) for your dedicated AI companion to wake, research,
                and deliver lifestyle insights to your queue.
              </p>
            </div>

            {/* Presets Grid */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-charcoal-700 uppercase tracking-wider block">
                Quick Presets (IST)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {WAKE_SCHEDULE_PRESETS.map((preset) => {
                  const isSelected = selectedWakeTime === preset.value;
                  return (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => {
                        setSelectedWakeTime(preset.value);
                        setScheduleError("");
                      }}
                      className={`px-3 py-2 text-xs rounded-xl border text-left transition-all ${
                        isSelected
                          ? "bg-forest-800 text-white border-forest-800 font-bold shadow-xs"
                          : "bg-white text-charcoal-700 border-petal-200 hover:border-forest-700/50"
                      }`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Time Picker */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-charcoal-700 uppercase tracking-wider block">
                Or Custom Wake Time
              </label>
              <input
                type="time"
                value={selectedWakeTime}
                onChange={(e) => {
                  setSelectedWakeTime(e.target.value);
                  setScheduleError("");
                }}
                className="w-full px-4 py-2.5 text-sm bg-petal-50 rounded-xl border border-petal-200 text-charcoal-800 focus:outline-none focus:ring-2 focus:ring-forest-800/30 font-mono"
              />
            </div>

            {/* Error Message */}
            {scheduleError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span>{scheduleError}</span>
              </div>
            )}

            {/* Success Message */}
            {scheduleSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Schedule updated successfully!</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setShowScheduleModal(false)}
                className="px-4 py-2.5 text-xs text-charcoal-600 hover:text-charcoal-900 font-medium rounded-xl hover:bg-petal-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleScheduleSave()}
                disabled={savingSchedule || !selectedWakeTime}
                className="px-6 py-2.5 text-xs bg-forest-800 hover:bg-forest-900 disabled:opacity-50 text-white font-bold rounded-xl shadow-xs transition-colors flex items-center space-x-2"
              >
                {savingSchedule && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Save Schedule</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DashboardPage;
