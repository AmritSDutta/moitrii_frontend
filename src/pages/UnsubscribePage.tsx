import React, { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { CheckCircle2, HeartHandshake, Mail, ArrowRight, Home, RefreshCw } from "lucide-react";

export function UnsubscribePage() {
  const [searchParams] = useSearchParams();
  const emailParam = searchParams.get("email") || "";

  const [email, setEmail] = useState(emailParam);
  const [status, setStatus] = useState<"idle" | "processing" | "unsubscribed" | "resubscribed" | "error">("idle");
  const [message, setMessage] = useState("");

  const unsubscribeMutation = useMutation(api.subscribers.unsubscribeDigest);
  const subscribeMutation = useMutation(api.subscribers.subscribeDigest);

  // If email is passed directly in URL query, handle cleanly on initial page load
  useEffect(() => {
    if (emailParam && status === "idle") {
      handleUnsubscribe(emailParam);
    }
  }, [emailParam]);

  const handleUnsubscribe = async (targetEmail: string) => {
    const trimmed = targetEmail.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      setStatus("error");
      setMessage("Please enter a valid email address.");
      return;
    }

    setStatus("processing");
    try {
      await unsubscribeMutation({ email: trimmed });
      setStatus("unsubscribed");
      setMessage(`You have been unsubscribed from the weekly digest (${trimmed}).`);
    } catch (err) {
      console.error("Unsubscribe error:", err);
      setStatus("error");
      setMessage("Could not process unsubscribe request. Please try again.");
    }
  };

  const handleResubscribe = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) return;

    setStatus("processing");
    try {
      await subscribeMutation({ email: trimmed, source: "unsubscribe_resubscribe" });
      setStatus("resubscribed");
      setMessage(`✨ Welcome back! Your subscription for ${trimmed} has been reactivated.`);
    } catch (err) {
      console.error("Resubscribe error:", err);
      setStatus("error");
      setMessage("Could not reactivate subscription. Please try again.");
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-20 text-center">
      <div className="inline-flex items-center space-x-2 bg-petal-100 text-forest-800 text-xs font-semibold px-4 py-1.5 rounded-full border border-petal-200 mb-6">
        <HeartHandshake className="w-3.5 h-3.5 text-rosebrand" />
        <span>Digest Preferences</span>
      </div>

      <h1 className="font-editorial text-3xl sm:text-4xl font-bold text-charcoal-900 tracking-tight mb-3">
        {status === "resubscribed"
          ? "Welcome Back to Moitrii"
          : status === "unsubscribed"
          ? "You Have Been Unsubscribed"
          : "Weekly Digest Preferences"}
      </h1>

      <p className="text-sm sm:text-base text-charcoal-600 max-w-lg mx-auto mb-8 leading-relaxed">
        {status === "resubscribed"
          ? "Your weekly intentional lifestyle digest is back on track. We are delighted to continue accompanying you on your calm living journey."
          : status === "unsubscribed"
          ? "We respect your digital space and quiet moments. You will no longer receive our Sunday lifestyle digests."
          : "Manage your Moitrii intentional lifestyle digest subscription."}
      </p>

      {/* Main Action Box */}
      <div className="bg-white border border-petal-200 rounded-2xl p-6 sm:p-8 shadow-xs max-w-md mx-auto mb-10 text-left">
        {status === "unsubscribed" ? (
          <div className="text-center space-y-4">
            <div className="w-12 h-12 bg-forest-50 text-forest-800 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <p className="text-xs text-charcoal-600">
              {message}
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={handleResubscribe}
                className="inline-flex items-center space-x-2 text-xs text-forest-800 font-semibold hover:underline"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Changed your mind? Click here to resubscribe.</span>
              </button>
            </div>
          </div>
        ) : status === "resubscribed" ? (
          <div className="text-center space-y-4">
            <div className="w-12 h-12 bg-rosebrand/10 text-rosebrand rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <p className="text-xs text-charcoal-700 font-medium">
              {message}
            </p>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleUnsubscribe(email);
            }}
            className="space-y-4"
          >
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-charcoal-800 mb-1.5">
                Subscriber Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-charcoal-400 absolute left-3 top-3" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  required
                  className="w-full text-xs pl-9 pr-3 py-2.5 rounded-lg border border-petal-300 focus:outline-none focus:ring-2 focus:ring-forest-800/20 bg-petal-50/50"
                />
              </div>
            </div>

            {message && status === "error" && (
              <p className="text-xs text-terracotta">{message}</p>
            )}

            <button
              type="submit"
              disabled={status === "processing"}
              className="w-full bg-forest-800 hover:bg-forest-900 disabled:opacity-50 text-white text-xs font-semibold py-2.5 rounded-lg transition-colors shadow-xs"
            >
              {status === "processing" ? "Processing..." : "Confirm Unsubscribe"}
            </button>
          </form>
        )}
      </div>

      <div className="flex items-center justify-center gap-4">
        <Link
          to="/"
          className="inline-flex items-center space-x-2 bg-white hover:bg-petal-50 text-charcoal-800 text-xs sm:text-sm font-semibold px-5 py-2.5 rounded-full border border-petal-300 transition-all shadow-xs"
        >
          <Home className="w-4 h-4 text-forest-700" />
          <span>Return to Moitrii Home</span>
          <ArrowRight className="w-4 h-4 text-charcoal-400" />
        </Link>
      </div>
    </div>
  );
}

export default UnsubscribePage;
