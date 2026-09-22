import React, { useState, useEffect, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useApp } from "@/lib/AppContext";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import {
  Search,
  Sparkles,
  ArrowRight,
  Clock,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Filter,
  BookOpen
} from "lucide-react";
import { formatDisplayDate } from "@/lib/formatters";

const PAGE_SIZE = 12;

export function ExplorePage() {
  const { topics } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();

  const categoryParam = searchParams.get("category") || "all";
  const pageParam = parseInt(searchParams.get("page") || "1", 10);
  const searchParam = searchParams.get("q") || "";

  const [selectedCategory, setSelectedCategory] = useState<string>(categoryParam);
  const [currentPage, setCurrentPage] = useState<number>(isNaN(pageParam) || pageParam < 1 ? 1 : pageParam);
  const [searchInput, setSearchInput] = useState<string>(searchParam);
  const [debouncedSearch, setDebouncedSearch] = useState<string>(searchParam);

  // Sync state when URL params change
  useEffect(() => {
    if (categoryParam !== selectedCategory) {
      setSelectedCategory(categoryParam);
    }
  }, [categoryParam]);

  useEffect(() => {
    if (pageParam !== currentPage && !isNaN(pageParam) && pageParam >= 1) {
      setCurrentPage(pageParam);
    }
  }, [pageParam]);

  useEffect(() => {
    if (searchParam !== searchInput) {
      setSearchInput(searchParam);
      setDebouncedSearch(searchParam);
    }
  }, [searchParam]);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchInput);
      if (searchInput !== searchParam) {
        setSearchParams((prev) => {
          const next = new URLSearchParams(prev);
          if (searchInput.trim()) {
            next.set("q", searchInput.trim());
          } else {
            next.delete("q");
          }
          next.set("page", "1");
          return next;
        });
        setCurrentPage(1);
      }
    }, 300);
    return () => clearTimeout(handler);
  }, [searchInput]);

  const updateCategory = (category: string) => {
    setSelectedCategory(category);
    setCurrentPage(1);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (category === "all") {
        next.delete("category");
      } else {
        next.set("category", category);
      }
      next.set("page", "1");
      return next;
    });
  };

  const updatePage = (newPage: number) => {
    setCurrentPage(newPage);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("page", newPage.toString());
      return next;
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const convexData = useQuery(api.content.getPaginatedContent, {
    category: selectedCategory === "all" ? undefined : selectedCategory,
    page: currentPage,
    pageSize: PAGE_SIZE,
    search: debouncedSearch.trim() ? debouncedSearch.trim() : undefined,
  });

  const isLoading = convexData === undefined;
  const articles = useMemo(() => {
    return (convexData?.articles ?? []).map((a: any) => ({
      id: a.slug || a._id,
      title: a.title,
      slug: a.slug,
      subtitle: a.subtitle,
      category: a.category,
      author: a.author,
      readTime: a.readTime,
      publishedAt: formatDisplayDate(a.publishedAt),
      coverImage: a.coverImage,
      reusedCount: a.reusedCount ?? 0,
    }));
  }, [convexData]);

  const totalCount = convexData?.totalCount ?? 0;
  const totalPages = convexData?.totalPages ?? 1;

  return (
    <div className="min-h-screen bg-cream-50/50 pb-24">
      {/* Header Banner */}
      <section className="bg-white border-b border-petal-200/80 pt-10 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-forest-50 border border-forest-100 text-forest-800 text-xs font-semibold mb-3">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Moitrii Knowledge Ecosystem</span>
            </div>
            <h1 className="font-editorial text-3xl sm:text-4xl lg:text-5xl font-bold text-charcoal-900 tracking-tight">
              Explore All Curated Stories
            </h1>
            <p className="mt-3 text-sm sm:text-base text-charcoal-600 leading-relaxed">
              Browse guides, verified routines, and AI-synthesized research across modern lifestyle, wellness, culinary arts, and mindful living.
            </p>

            {/* Search Input Bar */}
            <div className="mt-6 relative max-w-xl">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-charcoal-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search articles by title, topic, or keyword..."
                className="w-full pl-11 pr-4 py-3 bg-cream-50/80 border border-petal-300 rounded-2xl text-xs sm:text-sm text-charcoal-900 placeholder:text-charcoal-400 focus:outline-none focus:ring-2 focus:ring-forest-700/30 focus:border-forest-700 transition-all shadow-xs"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => setSearchInput("")}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-xs text-charcoal-400 hover:text-charcoal-700 cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Category Filter Pills */}
        <div className="flex items-center justify-between flex-wrap gap-3 pb-6 border-b border-petal-200/60">
          <div className="flex items-center space-x-2 text-xs font-semibold text-charcoal-500 shrink-0">
            <Filter className="w-3.5 h-3.5" />
            <span>Filter Topic:</span>
          </div>

          <div className="flex items-center flex-wrap gap-2 flex-grow">
            <button
              onClick={() => updateCategory("all")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                selectedCategory === "all"
                  ? "bg-forest-800 text-white shadow-xs"
                  : "bg-white text-charcoal-700 border border-petal-200 hover:bg-petal-100 cursor-pointer"
              }`}
            >
              All Stories
            </button>
            {topics.map((t) => {
              const isSelected =
                selectedCategory.toLowerCase() === t.name.toLowerCase() ||
                selectedCategory.toLowerCase() === t.id.toLowerCase();
              return (
                <button
                  key={t.id}
                  onClick={() => updateCategory(t.name)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    isSelected
                      ? "bg-forest-800 text-white shadow-xs"
                      : "bg-white text-charcoal-700 border border-petal-200 hover:bg-petal-100 cursor-pointer"
                  }`}
                >
                  {t.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Results Metadata Bar */}
        <div className="py-4 flex items-center justify-between text-xs text-charcoal-500">
          <div>
            {!isLoading && (
              <span>
                Showing{" "}
                <strong className="text-charcoal-800">
                  {totalCount === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1}
                </strong>
                –
                <strong className="text-charcoal-800">
                  {Math.min(currentPage * PAGE_SIZE, totalCount)}
                </strong>{" "}
                of <strong className="text-charcoal-800">{totalCount}</strong> stories
                {selectedCategory !== "all" && ` in ${selectedCategory}`}
              </span>
            )}
          </div>
          {totalPages > 1 && (
            <span className="hidden sm:inline-block">
              Page {currentPage} of {totalPages}
            </span>
          )}
        </div>

        {/* 4-Card Single Row / Compact Grid (12 items per page) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {isLoading ? (
            Array.from({ length: 8 }).map((_, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl overflow-hidden border border-petal-200 p-4 space-y-3 animate-pulse"
              >
                <div className="aspect-[16/10] bg-petal-100 rounded-xl" />
                <div className="h-4 bg-petal-100 rounded w-3/4" />
                <div className="h-3 bg-petal-100 rounded w-1/2" />
              </div>
            ))
          ) : articles.length === 0 ? (
            <div className="col-span-full bg-white p-12 rounded-3xl border border-petal-200 text-center space-y-4 shadow-sm">
              <div className="w-12 h-12 rounded-full bg-petal-100 text-forest-800 mx-auto flex items-center justify-center">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="font-editorial text-xl font-bold text-charcoal-900">
                No matching articles found
              </h3>
              <p className="text-xs sm:text-sm text-charcoal-500 max-w-md mx-auto leading-relaxed">
                {searchInput
                  ? `No guides matched your query "${searchInput}". Try clearing your search or exploring another category.`
                  : `No articles have been published in ${selectedCategory === "all" ? "this collection" : selectedCategory} yet.`}
              </p>
              <div className="pt-2 flex items-center justify-center gap-3">
                {(selectedCategory !== "all" || searchInput) && (
                  <button
                    onClick={() => {
                      updateCategory("all");
                      setSearchInput("");
                    }}
                    className="text-xs bg-petal-100 hover:bg-petal-200 text-charcoal-800 px-4 py-2 rounded-full font-semibold transition-colors cursor-pointer"
                  >
                    Reset All Filters
                  </button>
                )}
                <Link
                  to="/dashboard"
                  className="text-xs bg-forest-800 hover:bg-forest-900 text-white px-5 py-2 rounded-full font-bold transition-colors shadow-xs"
                >
                  Synthesize in Agent Dashboard →
                </Link>
              </div>
            </div>
          ) : (
            articles.map((article: any) => (
              <article
                key={article.id}
                className="bg-white rounded-2xl overflow-hidden border border-petal-200/90 shadow-card hover:shadow-editorial transition-all hover:translate-y-[-3px] flex flex-col group"
              >
                {/* Cover Image */}
                <Link to={`/content/${article.id}`} className="relative aspect-[16/10] overflow-hidden block">
                  <img
                    src={article.coverImage}
                    alt={article.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = "/images/moitrii.jpg";
                    }}
                  />
                  <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1">
                    <span className="bg-white/95 backdrop-blur-sm text-charcoal-900 text-[10px] font-semibold px-2 py-0.5 rounded-full shadow-xs">
                      {article.category}
                    </span>
                    {article.reusedCount > 0 && (
                      <span className="bg-forest-800 text-white text-[9px] font-medium px-1.5 py-0.5 rounded-full flex items-center space-x-1 shadow-xs">
                        <RefreshCw className="w-2.5 h-2.5" />
                        <span>{article.reusedCount}</span>
                      </span>
                    )}
                  </div>
                </Link>

                {/* Card Body - Compact */}
                <div className="p-4 sm:p-5 flex-grow flex flex-col justify-between space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-charcoal-500">
                      <span className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>{article.readTime}</span>
                      </span>
                      <span>{article.publishedAt}</span>
                    </div>

                    <Link to={`/content/${article.id}`}>
                      <h3 className="font-editorial text-base sm:text-lg font-bold text-charcoal-900 group-hover:text-forest-800 transition-colors leading-snug line-clamp-2">
                        {article.title}
                      </h3>
                    </Link>

                    <p className="text-xs text-charcoal-600 line-clamp-2 leading-relaxed">
                      {article.subtitle}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-petal-100 flex items-center justify-between">
                    <span className="text-[11px] text-charcoal-500 font-medium truncate max-w-[120px]">
                      {article.author}
                    </span>
                    <Link
                      to={`/content/${article.id}`}
                      className="text-xs font-bold text-forest-800 hover:text-forest-900 flex items-center space-x-1"
                    >
                      <span>Read Guide</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="mt-12 flex items-center justify-center space-x-2">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => updatePage(currentPage - 1)}
              className={`p-2 rounded-full border text-xs font-semibold flex items-center space-x-1 transition-all ${
                currentPage <= 1
                  ? "border-petal-200 text-charcoal-300 cursor-not-allowed bg-petal-50/50"
                  : "border-petal-300 text-charcoal-700 bg-white hover:bg-petal-100 cursor-pointer shadow-xs"
              }`}
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline pr-1">Prev</span>
            </button>

            {/* Page number pills */}
            <div className="flex items-center space-x-1">
              {Array.from({ length: totalPages }).map((_, idx) => {
                const pageNum = idx + 1;
                // Show first, last, current, and adjacent pages if many pages
                if (
                  totalPages > 7 &&
                  pageNum !== 1 &&
                  pageNum !== totalPages &&
                  Math.abs(pageNum - currentPage) > 2
                ) {
                  if (Math.abs(pageNum - currentPage) === 3) {
                    return (
                      <span key={pageNum} className="px-2 text-xs text-charcoal-400">
                        ...
                      </span>
                    );
                  }
                  return null;
                }

                const isActive = pageNum === currentPage;
                return (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => updatePage(pageNum)}
                    className={`w-8 h-8 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                      isActive
                        ? "bg-forest-800 text-white shadow-xs font-bold"
                        : "bg-white text-charcoal-700 border border-petal-200 hover:bg-petal-100"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => updatePage(currentPage + 1)}
              className={`p-2 rounded-full border text-xs font-semibold flex items-center space-x-1 transition-all ${
                currentPage >= totalPages
                  ? "border-petal-200 text-charcoal-300 cursor-not-allowed bg-petal-50/50"
                  : "border-petal-300 text-charcoal-700 bg-white hover:bg-petal-100 cursor-pointer shadow-xs"
              }`}
              aria-label="Next page"
            >
              <span className="hidden sm:inline pl-1">Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

export default ExplorePage;
