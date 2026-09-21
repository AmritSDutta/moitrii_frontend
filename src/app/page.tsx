"use client";

import React, { useState, useEffect, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useApp } from "@/lib/AppContext";
import { useBrandAssets } from "@/lib/useBrandAssets";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import {
  Search,
  Sparkles,
  ArrowRight,
  Clock,
  BookOpen,
  Share2,
  RefreshCw,
  Play,
  Heart,
  ShieldCheck,
  CheckCircle2
} from "lucide-react";

function HomeContent() {
  const { articles: fallbackArticles, topics, videos, searchQuery, setSearchQuery } = useApp();
  const { heroUrl } = useBrandAssets();
  const searchParams = useSearchParams();
  const topicParam = searchParams.get("topic");

  const [selectedTopicFilter, setSelectedTopicFilter] = useState<string>("all");
  const [activeVideoModal, setActiveVideoModal] = useState<string | null>(null);

  useEffect(() => {
    if (topicParam) {
      const matched = topics.find(
        (t) => t.id.toLowerCase() === topicParam.toLowerCase() || t.name.toLowerCase() === topicParam.toLowerCase()
      );
      if (matched) {
        setSelectedTopicFilter(matched.name);
      } else {
        setSelectedTopicFilter(topicParam);
      }
    }
  }, [topicParam, topics]);

  const convexArticles = useQuery(api.content.getPublishedContent, {
    category: selectedTopicFilter === "all" ? undefined : selectedTopicFilter,
  });

  // Prefer live Convex articles if available; otherwise use fallback
  const rawArticles =
    convexArticles && convexArticles.length > 0
      ? convexArticles.map((a: any) => ({
          id: a.slug || a._id,
          title: a.title,
          slug: a.slug,
          subtitle: a.subtitle,
          category: a.category,
          author: a.author,
          readTime: a.readTime,
          publishedAt: a.publishedAt.includes("T")
            ? new Date(a.publishedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })
            : a.publishedAt,
          coverImage: a.coverImage,
          reusedCount: a.reusedCount ?? 0,
        }))
      : fallbackArticles;

  const filteredArticles = rawArticles.filter((art: any) => {
    const matchesSearch =
      searchQuery === "" ||
      art.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      art.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      art.category.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTopic =
      selectedTopicFilter === "all" ||
      art.category.toLowerCase().includes(selectedTopicFilter.toLowerCase());

    return matchesSearch && matchesTopic;
  });



  const popularPills = [
    "Ayurvedic Drinks",
    "Studio Ghibli Guide",
    "Darjeeling Homestays",
    "Morning Flow",
    "Gen-Z Trends",
    "Clean Skincare"
  ];

  return (
    <div className="space-y-20 pb-16">
      {/* 1. HERO SECTION (Guided by moitrii_theme.png and moitrii.jpg) */}
      <section className="relative pt-8 pb-12 md:pt-14 md:pb-16 border-b border-petal-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Content Column */}
            <div className="lg:col-span-6 space-y-6 lg:pr-4">
              <div className="inline-flex items-center space-x-2">
                <span className="text-xs font-bold uppercase tracking-widest text-forest-700 bg-forest-50 border border-forest-100 px-3.5 py-1 rounded-full">
                  DISCOVER YOUR BEST SELF
                </span>
                <span className="text-xs text-rosebrand font-medium">
                  · মৈত্রী · मैत्री
                </span>
              </div>

              <h1 className="font-editorial text-4xl sm:text-5xl lg:text-[3.25rem] font-bold text-charcoal-900 leading-[1.15] tracking-tight">
                Empowering the Modern Woman to Live Beautifully
              </h1>

              <p className="text-base sm:text-lg text-charcoal-600 leading-relaxed max-w-xl">
                Affordable personal AI companion designed for the modern Indian woman. 
                Grounded in intentional living, wellness, family, and calm technology.
              </p>

              {/* Search Bar (Matching moitrii_theme.png) */}
              <div className="pt-2">
                <form
                  onSubmit={(e) => e.preventDefault()}
                  className="relative flex items-center max-w-lg bg-white rounded-full p-1.5 shadow-editorial border border-petal-200/90 focus-within:ring-2 focus-within:ring-forest-800/30 transition-all"
                >
                  <Search className="w-5 h-5 text-charcoal-500 ml-4 shrink-0" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search ayurvedic coolers, anime guides, wellness..."
                    className="w-full px-3 py-2 text-sm text-charcoal-900 bg-transparent focus:outline-none placeholder:text-charcoal-500/70"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const el = document.getElementById("articles-section");
                      el?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="bg-forest-800 hover:bg-forest-900 text-white text-sm font-semibold px-6 py-2.5 rounded-full transition-colors shrink-0 shadow-sm"
                  >
                    Search
                  </button>
                </form>

                {/* Popular Search Pills */}
                <div className="flex flex-wrap items-center gap-2 mt-4 pt-1 text-xs">
                  <span className="text-charcoal-500 font-medium">Popular searches:</span>
                  {popularPills.map((pill) => (
                    <button
                      key={pill}
                      onClick={() => setSearchQuery(pill)}
                      className="bg-white/80 hover:bg-white text-charcoal-700 px-3 py-1 rounded-full border border-petal-200 shadow-xs hover:border-forest-500/40 transition-all"
                    >
                      {pill}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Call to Action */}
              <div className="pt-2 flex flex-wrap items-center gap-4">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center space-x-2 bg-rosebrand hover:bg-rosebrand-dark text-white px-5 py-2.5 rounded-full text-sm font-semibold shadow-md transition-all hover:translate-y-[-1px]"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Open Your Agent Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/onboarding"
                  className="inline-flex items-center space-x-1.5 text-xs text-charcoal-700 hover:text-charcoal-900 font-semibold px-4 py-2.5 rounded-full border border-petal-300 hover:bg-white transition-all"
                >
                  <span>Choose Your Topics</span>
                </Link>
              </div>
            </div>

            {/* Right Image Column with full moitrii.jpg & subtle guide card */}
            <div className="lg:col-span-6 relative flex flex-col items-center">
              <div className="relative w-full max-w-[540px] aspect-square rounded-[2rem] overflow-hidden shadow-editorial ring-1 ring-petal-300/80 bg-white group">
                <Image
                  src={heroUrl}
                  alt="Moitrii - A friend for a more beautiful you"
                  fill
                  className="object-contain transition-transform duration-700 group-hover:scale-[1.02]"
                  priority
                />
              </div>

              {/* Companion Guide Card (Placed cleanly to not obstruct the image text) */}
              <div className="w-full max-w-[540px] mt-3 bg-white/95 backdrop-blur-md p-4 sm:p-5 rounded-2xl shadow-card border border-petal-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all hover:shadow-editorial">
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="w-2 h-2 rounded-full bg-forest-700 animate-pulse" />
                    <h3 className="font-editorial text-base font-bold text-charcoal-900">
                      Wellness Starts Here
                    </h3>
                  </div>
                  <p className="text-xs text-charcoal-600 leading-relaxed">
                    Explore practical guides for food, self-care, parenting, and calm home routines.
                  </p>
                </div>
                <Link
                  href="#articles-section"
                  className="inline-flex items-center space-x-1.5 text-xs font-bold text-forest-800 hover:text-forest-900 shrink-0 bg-forest-50 hover:bg-forest-100 px-4 py-2 rounded-full transition-colors border border-forest-100 self-start sm:self-auto"
                >
                  <span>Read Latest Guides</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. WHAT'S HOT / READER-FAVORITE ARTICLES */}
      <section id="articles-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
          <span className="text-xs font-bold uppercase tracking-widest text-forest-700 block">
            WHAT&apos;S HOT
          </span>
          <h2 className="font-editorial text-3xl sm:text-4xl font-bold text-charcoal-900">
            Reader-Favorite Articles
          </h2>
          <p className="text-sm text-charcoal-600">
            Start with the guides most likely to pull readers deeper into intentional, balanced living.
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center justify-center flex-wrap gap-2 mb-10">
          <button
            onClick={() => setSelectedTopicFilter("all")}
            className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${
              selectedTopicFilter === "all"
                ? "bg-forest-800 text-white shadow-sm"
                : "bg-white text-charcoal-700 border border-petal-200 hover:bg-petal-100"
            }`}
          >
            All Stories
          </button>
          {topics.slice(0, 6).map((t) => (
            <button
              key={t.id}
              onClick={() => setSelectedTopicFilter(t.name)}
              className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                selectedTopicFilter === t.name
                  ? "bg-forest-800 text-white shadow-sm"
                  : "bg-white text-charcoal-700 border border-petal-200 hover:bg-petal-100"
              }`}
            >
              {t.name}
            </button>
          ))}
        </div>

        {/* Article Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredArticles.map((article: any) => (
            <article
              key={article.id}
              className="bg-white rounded-2xl overflow-hidden border border-petal-200/90 shadow-card hover:shadow-editorial transition-all hover:translate-y-[-4px] flex flex-col group"
            >
              {/* Cover Image */}
              <Link href={`/content/${article.id}`} className="relative aspect-[16/10] overflow-hidden block">
                <Image
                  src={article.coverImage}
                  alt={article.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                  <span className="bg-white/90 backdrop-blur-sm text-charcoal-900 text-[11px] font-semibold px-2.5 py-1 rounded-full shadow-xs">
                    {article.category}
                  </span>
                  {article.reusedCount > 0 && (
                    <span className="bg-forest-800 text-white text-[10px] font-medium px-2 py-1 rounded-full flex items-center space-x-1 shadow-xs">
                      <RefreshCw className="w-3 h-3" />
                      <span>Reused by {article.reusedCount} agents</span>
                    </span>
                  )}
                </div>
              </Link>

              {/* Card Body */}
              <div className="p-6 flex-grow flex flex-col justify-between space-y-4">
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-xs text-charcoal-500">
                    <span className="flex items-center space-x-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{article.readTime}</span>
                    </span>
                    <span>{article.publishedAt}</span>
                  </div>

                  <Link href={`/content/${article.id}`}>
                    <h3 className="font-editorial text-xl font-bold text-charcoal-900 group-hover:text-forest-800 transition-colors leading-snug line-clamp-2">
                      {article.title}
                    </h3>
                  </Link>

                  <p className="text-xs text-charcoal-600 line-clamp-3 leading-relaxed">
                    {article.subtitle}
                  </p>
                </div>

                <div className="pt-4 border-t border-petal-100 flex items-center justify-between">
                  <span className="text-[11px] text-charcoal-500 font-medium truncate max-w-[180px]">
                    {article.author}
                  </span>
                  <Link
                    href={`/content/${article.id}`}
                    className="text-xs font-bold text-forest-800 hover:text-forest-900 flex items-center space-x-1"
                  >
                    <span>Read Guide</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* 3. POPULAR CATEGORIES */}
      <section className="bg-white/40 backdrop-blur-xs py-16 border-y border-petal-200/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-12 space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-forest-700 block">
              CURATED DOMAINS
            </span>
            <h2 className="font-editorial text-3xl font-bold text-charcoal-900">
              Popular Categories
            </h2>
            <p className="text-xs sm:text-sm text-charcoal-600">
              Personalized knowledge streams your agent tracks and explores for you.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {topics.map((topic) => (
              <Link
                key={topic.id}
                href={`/onboarding`}
                className="bg-white p-5 rounded-2xl border border-petal-200 shadow-sm hover:shadow-md hover:border-forest-700/40 transition-all text-center group"
              >
                <div className="w-10 h-10 rounded-full bg-petal-50 mx-auto mb-3 flex items-center justify-center text-forest-800 group-hover:bg-forest-800 group-hover:text-white transition-colors">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h3 className="font-editorial text-sm font-bold text-charcoal-900 group-hover:text-forest-800 transition-colors">
                  {topic.name}
                </h3>
                <span className="text-[10px] text-charcoal-500 mt-1 block">
                  {topic.popularSearches.length} Key Guides
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 4. TRENDING VIDEOS SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 space-y-4 md:space-y-0">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-forest-700 block mb-1">
              MULTIMEDIA DISCOVERY
            </span>
            <h2 className="font-editorial text-3xl font-bold text-charcoal-900">
              Trending Lifestyle & Mindful Videos
            </h2>
            <p className="text-xs sm:text-sm text-charcoal-600">
              Curated audio-visual companions discovered by agents during research cycles.
            </p>
          </div>
          <Link
            href="/dashboard"
            className="text-xs font-bold text-forest-800 hover:text-forest-900 flex items-center space-x-1.5"
          >
            <span>Ask your agent for video breakdowns</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {videos.map((vid) => (
            <div
              key={vid.id}
              className="bg-white rounded-2xl overflow-hidden border border-petal-200 shadow-sm hover:shadow-md transition-all group"
            >
              <div
                onClick={() => setActiveVideoModal(vid.youtubeId)}
                className="relative aspect-video cursor-pointer overflow-hidden block"
              >
                <Image
                  src={vid.thumbnail}
                  alt={vid.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-charcoal-900/30 group-hover:bg-charcoal-900/20 transition-colors flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <Play className="w-5 h-5 text-forest-800 fill-forest-800 ml-0.5" />
                  </div>
                </div>
                <span className="absolute bottom-2.5 right-2.5 bg-black/75 text-white text-[10px] font-medium px-2 py-0.5 rounded">
                  {vid.duration}
                </span>
              </div>

              <div className="p-5 space-y-2">
                <span className="text-[10px] font-bold text-rosebrand uppercase tracking-wider">
                  {vid.category}
                </span>
                <h3 className="font-editorial text-base font-bold text-charcoal-900 line-clamp-2 leading-snug">
                  {vid.title}
                </h3>
                <p className="text-xs text-charcoal-500">{vid.channel}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Video Modal */}
      {activeVideoModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl overflow-hidden max-w-3xl w-full shadow-2xl relative">
            <button
              onClick={() => setActiveVideoModal(null)}
              className="absolute top-3 right-3 z-10 bg-black/50 text-white rounded-full p-2 hover:bg-black text-xs"
            >
              ✕
            </button>
            <div className="aspect-video w-full">
              <iframe
                src={`https://www.youtube.com/embed/${activeVideoModal}?autoplay=1`}
                title="YouTube Video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full border-0"
              />
            </div>
          </div>
        </div>
      )}

      {/* 5. ABOUT MOITRII & CALM TECHNOLOGY BANNER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-forest-900 to-forest-800 rounded-3xl p-8 sm:p-12 text-white shadow-xl relative overflow-hidden">
          <div className="relative z-10 max-w-2xl space-y-5">
            <div className="inline-flex items-center space-x-2 bg-white/10 px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm">
              <Sparkles className="w-3.5 h-3.5 text-goldbrand-light" />
              <span>Affordable Persistent AI Platform</span>
            </div>
            <h2 className="font-editorial text-3xl sm:text-4xl font-bold leading-tight">
              Personal AI Shouldn&apos;t Be a Luxury
            </h2>
            <p className="text-sm text-forest-100 leading-relaxed">
              Every woman deserves a dedicated companion that understands her rhythm.
              Moitrii gives every user identical state-of-the-art AI intelligence—your subscription
              only controls how often your agent wakes up to conduct research.
            </p>
            <div className="pt-2 flex flex-wrap gap-4">
              <Link
                href="/onboarding"
                className="bg-white text-forest-900 hover:bg-petal-50 font-bold px-6 py-3 rounded-full text-xs transition-colors shadow-md"
              >
                Get Started Free
              </Link>
              <Link
                href="/dashboard"
                className="bg-forest-700/60 hover:bg-forest-700 text-white border border-white/20 font-medium px-6 py-3 rounded-full text-xs transition-colors"
              >
                View Agent Dashboard
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<div className="min-h-screen py-24 text-center text-xs text-charcoal-500">Loading Moitrii...</div>}>
      <HomeContent />
    </Suspense>
  );
}
