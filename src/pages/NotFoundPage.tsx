import React from "react";
import { Link } from "react-router-dom";
import { Compass, Sparkles, Home, ArrowRight } from "lucide-react";

export function NotFoundPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-20 text-center">
      <div className="inline-flex items-center space-x-2 bg-petal-100 text-forest-800 text-xs font-semibold px-4 py-1.5 rounded-full border border-petal-200 mb-6">
        <Sparkles className="w-3.5 h-3.5 text-rosebrand" />
        <span>Page Not Found</span>
      </div>

      <h1 className="font-editorial text-4xl sm:text-5xl font-bold text-charcoal-900 tracking-tight mb-4">
        A Quiet Moment Off the Path
      </h1>

      <p className="text-sm sm:text-base text-charcoal-600 max-w-xl mx-auto mb-10 leading-relaxed">
        The story or resource you are looking for may have moved or been curated into another section of the Moitrii Shared Knowledge Ecosystem.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-4">
        <Link
          to="/"
          className="inline-flex items-center space-x-2 bg-forest-800 hover:bg-forest-900 text-white text-xs sm:text-sm font-semibold px-6 py-3 rounded-full transition-all shadow-sm"
        >
          <Home className="w-4 h-4" />
          <span>Return Home</span>
        </Link>
        <Link
          to="/dashboard"
          className="inline-flex items-center space-x-2 bg-white hover:bg-petal-50 text-charcoal-800 text-xs sm:text-sm font-semibold px-6 py-3 rounded-full border border-petal-300 transition-all shadow-xs"
        >
          <Compass className="w-4 h-4 text-forest-700" />
          <span>Go to Agent Dashboard</span>
          <ArrowRight className="w-4 h-4 text-charcoal-400" />
        </Link>
      </div>
    </div>
  );
}

export default NotFoundPage;
