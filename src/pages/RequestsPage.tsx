import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useApp } from "@/lib/AppContext";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import {
  PlusCircle,
  Clock,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  ArrowRight,
  Send
} from "lucide-react";

export function RequestsPage() {
  const { topics, agentState } = useApp();
  const liveRequests = useQuery(api.requests.listUserRequests);
  const createRequestMutation = useMutation(api.requests.createRequest);

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

  const [prompt, setPrompt] = useState("");
  const [category, setCategory] = useState("Health & Nutrition");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [showToast, setShowToast] = useState(false);
  const [, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setSubmitting(true);
    try {
      await createRequestMutation({ prompt: prompt.trim(), category });
      setPrompt("");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 4000);
    } catch (err) {
      console.error("Failed to create request:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredRequests = rawRequests.filter((r: any) => {
    if (statusFilter === "ALL") return true;
    return r.status === statusFilter;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Header */}
      <div className="space-y-2">
        <span className="text-xs font-bold uppercase tracking-widest text-forest-700 bg-forest-50 px-3 py-1 rounded-full border border-forest-100">
          REQUEST LIFECYCLE TRACKER
        </span>
        <h1 className="font-editorial text-3xl sm:text-4xl font-bold text-charcoal-900">
          Request Center & Durable Queue
        </h1>
        <p className="text-sm text-charcoal-600 max-w-2xl">
          Submit lifestyle and wellness research questions at any time. Requests remain safely stored
          in Convex state while your agent sleeps and are processed during the next wake window.
        </p>
      </div>

      {/* 1. Request Composer */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-petal-200 shadow-sm space-y-5">
        <h2 className="font-editorial text-xl font-bold text-charcoal-900 flex items-center space-x-2">
          <PlusCircle className="w-5 h-5 text-forest-800" />
          <span>Submit a New Research Request</span>
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-charcoal-700 block">
              Your Request / Question
            </label>
            <textarea
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. Find 3 budget-friendly boutique homestays in Coorg with organic coffee plantations and walking trails..."
              className="w-full p-4 text-sm bg-petal-50/70 rounded-2xl border border-petal-200 focus:outline-none focus:ring-2 focus:ring-forest-800/30 text-charcoal-900 resize-none"
            />
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <label className="text-xs font-bold text-charcoal-600 shrink-0">Topic:</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="text-xs px-3 py-2 rounded-xl border border-petal-200 bg-white text-charcoal-800 focus:outline-none focus:ring-2 focus:ring-forest-800/30"
              >
                {topics.map((t) => (
                  <option key={t.id} value={t.name}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={!prompt.trim()}
              className="bg-forest-800 hover:bg-forest-900 disabled:opacity-50 text-white text-xs font-bold px-6 py-3 rounded-full transition-colors flex items-center justify-center space-x-2 shadow-sm"
            >
              <Send className="w-4 h-4" />
              <span>Submit to Queue</span>
            </button>
          </div>
        </form>

        {showToast && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              Request added to durable queue! Next scheduled execution: {agentState.nextWakeTime}.
            </span>
          </div>
        )}
      </div>

      {/* 2. Request Filter Bar & History */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-petal-200 pb-4">
          <div>
            <h3 className="font-editorial text-2xl font-bold text-charcoal-900">
              Request History ({rawRequests.length})
            </h3>
            <p className="text-xs text-charcoal-500">
              Real-time lifecycle from PENDING to COMPLETED.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 bg-petal-100/80 p-1 rounded-full text-xs">
            {["ALL", "PENDING", "COMPLETED"].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3.5 py-1.5 rounded-full font-bold transition-colors ${
                  statusFilter === st
                    ? "bg-forest-800 text-white shadow-xs"
                    : "text-charcoal-600 hover:text-charcoal-900"
                }`}
              >
                {st === "ALL" ? "All Requests" : st}
              </button>
            ))}
          </div>
        </div>

        {/* Requests List */}
        <div className="space-y-4">
          {requestsLoading ? (
            <div className="bg-white p-6 rounded-2xl border border-petal-200 text-center">
              <p className="text-xs text-charcoal-500">Loading your request history…</p>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="bg-white p-6 rounded-2xl border border-petal-200 text-center space-y-2">
              <p className="text-xs text-charcoal-500">
                {statusFilter === "ALL"
                  ? "No requests yet."
                  : `No ${statusFilter.toLowerCase()} requests.`}
              </p>
              <p className="text-[11px] text-charcoal-400">
                Submit a research question above — it stays safely queued until your agent's next wake.
              </p>
            </div>
          ) : (
            filteredRequests.map((req: any) => {
              const isDone = req.status === "COMPLETED";
              return (
                <div
                  key={req.id}
                  className="bg-white p-6 rounded-2xl border border-petal-200 shadow-sm space-y-4 hover:border-petal-300 transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center space-x-2">
                      <span
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center space-x-1 ${
                          isDone
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                            : "bg-indigo-50 text-indigo-800 border border-indigo-200"
                        }`}
                      >
                        {isDone ? (
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <Clock className="w-3 h-3 text-indigo-600" />
                        )}
                        <span>{req.status}</span>
                      </span>

                      <span className="text-xs font-bold text-rosebrand">
                        {req.category}
                      </span>
                    </div>

                    <span className="text-[11px] text-charcoal-500">
                      Submitted: {req.submittedAt}
                    </span>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-charcoal-900">
                      &ldquo;{req.prompt}&rdquo;
                    </p>
                    {req.contentTitle && (
                      <div className="mt-2 text-xs text-charcoal-700 bg-petal-50 p-3 rounded-xl border border-petal-200">
                        <strong>Delivered Guide:</strong> {req.contentTitle}
                      </div>
                    )}
                  </div>

                  {/* Footer status / Action */}
                  <div className="pt-3 border-t border-petal-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="flex items-center space-x-2 text-charcoal-500">
                      {req.isReused ? (
                        <span className="flex items-center space-x-1 text-forest-800 font-medium">
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Reused from Shared Knowledge Ecosystem</span>
                        </span>
                      ) : (
                        <span className="flex items-center space-x-1 text-terracotta font-medium">
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Freshly Researched & Synthesized</span>
                        </span>
                      )}
                    </div>

                    {isDone && req.contentId && (
                      <Link
                        to={`/content/${req.contentId}`}
                        className="inline-flex items-center space-x-1 text-xs font-bold text-forest-800 hover:text-forest-900"
                      >
                        <span>Open Guide</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

export default RequestsPage;
