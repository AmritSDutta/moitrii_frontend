import React, { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useApp } from "@/lib/AppContext";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import {
  Clock,
  User,
  Share2,
  RefreshCw,
  ExternalLink,
  ArrowLeft,
  CheckCircle2,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Bot,
  Sparkles
} from "lucide-react";
import { extractYouTubeId } from "@/lib/youtube";
import { formatDisplayDate } from "@/lib/formatters";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";

export function ContentReaderPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { articles: fallbackArticles } = useApp();
  const [copied, setCopied] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  const toggleAudio = () => {
    if (!audioRef.current) return;
    if (isPlayingAudio) {
      audioRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      audioRef.current.play();
      setIsPlayingAudio(true);
    }
  };

  const slugParam = typeof id === "string" ? id : "";
  const convexArticle = useQuery(api.content.getContentBySlug, { slug: slugParam });
  const articleLoading = convexArticle === undefined;

  // Fallback article renders on exact slug match
  const demoArticle = fallbackArticles.find((a) => a.id === slugParam || a.slug === slugParam);
  const article: any = convexArticle ?? demoArticle;

  // Related stories from shared ecosystem
  const relatedDocs = useQuery(api.content.getPublishedContent, { limit: 6 });
  const relatedArticles = (relatedDocs ?? [])
    .filter((rel: any) => rel.slug !== slugParam && String(rel._id) !== slugParam)
    .slice(0, 2);

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  if (!articleLoading && !article) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center space-y-4">
        <h1 className="font-editorial text-3xl font-bold text-charcoal-900">
          Guide Not Found
        </h1>
        <p className="text-sm text-charcoal-600">
          We couldn't find the article you were looking for. It may have been relocated or updated.
        </p>
        <Link
          to="/"
          className="inline-flex items-center space-x-2 bg-forest-800 text-white px-5 py-2.5 rounded-full text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Explore</span>
        </Link>
      </div>
    );
  }

  if (articleLoading || !article) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
        <div className="w-10 h-10 rounded-full border-2 border-forest-800 border-t-transparent animate-spin mx-auto mb-4" />
        <p className="text-xs text-charcoal-500">Loading guide…</p>
      </div>
    );
  }

  return (
    <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Back Button */}
      <div>
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center space-x-2 text-xs font-bold text-charcoal-600 hover:text-forest-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>
      </div>

      {/* 1. Header & Title Block */}
      <header className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-forest-800 bg-forest-50 px-3 py-1 rounded-full border border-forest-100">
            {article.category}
          </span>
          {article.reusedCount > 0 && (
            <span className="text-xs font-medium text-charcoal-700 bg-petal-100 px-3 py-1 rounded-full flex items-center space-x-1.5 border border-petal-200">
              <RefreshCw className="w-3.5 h-3.5 text-forest-700" />
              <span>Shared Knowledge · Reused by {article.reusedCount} agents</span>
            </span>
          )}
        </div>

        <h1 className="font-editorial text-3xl sm:text-4xl lg:text-5xl font-bold text-charcoal-900 leading-[1.2]">
          {article.title}
        </h1>

        {/* Audio Player Bar */}
        <div className="pt-1 pb-1">
          {article.audioUrl ? (
            <div className="flex flex-wrap items-center gap-3 bg-forest-50/80 border border-forest-200/70 p-3 sm:px-4 rounded-2xl">
              <button
                type="button"
                onClick={toggleAudio}
                className="bg-forest-800 hover:bg-forest-900 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors flex items-center space-x-2 shadow-xs"
              >
                {isPlayingAudio ? (
                  <>
                    <Pause className="w-3.5 h-3.5 fill-current" />
                    <span>Pause Narration</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Listen to Audio</span>
                  </>
                )}
              </button>
              <div className="flex items-center space-x-2 text-xs text-forest-900 font-medium">
                <Volume2 className="w-4 h-4 text-forest-700" />
                <span>Audio Narration Available · {article.readTime || "4 min"}</span>
              </div>
              <audio
                ref={audioRef}
                src={article.audioUrl}
                onEnded={() => setIsPlayingAudio(false)}
                onPause={() => setIsPlayingAudio(false)}
                onPlay={() => setIsPlayingAudio(true)}
                className="hidden"
              />
            </div>
          ) : (
            <div className="flex items-center space-x-2 text-xs text-charcoal-400 bg-petal-50/70 border border-petal-200/60 px-3.5 py-2 rounded-2xl w-fit opacity-65 cursor-not-allowed">
              <VolumeX className="w-4 h-4 text-charcoal-400" />
              <span className="font-medium">Audio narration not available</span>
            </div>
          )}
        </div>

        <p className="text-base sm:text-lg text-charcoal-600 leading-relaxed">
          {article.subtitle}
        </p>

        {/* Metadata & Actions */}
        <div className="pt-4 border-y border-petal-200 flex flex-wrap items-center justify-between gap-4 text-xs text-charcoal-600">
          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-charcoal-900">{article.author}</span>
              {article.authorType === "agent" ? (
                <span className="text-[10px] font-bold bg-purple-50 text-purple-800 border border-purple-200 px-2 py-0.5 rounded-full flex items-center space-x-1">
                  <Bot className="w-3 h-3 text-purple-700" />
                  <span>AI Agent Companion</span>
                </span>
              ) : (
                <span className="text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full flex items-center space-x-1">
                  <User className="w-3 h-3 text-amber-700" />
                  <span>Human Author</span>
                </span>
              )}
            </div>
            <span>·</span>
            <span className="flex items-center space-x-1">
              <Clock className="w-3.5 h-3.5" />
              <span>{article.readTime}</span>
            </span>
            <span>·</span>
            <span>{formatDisplayDate(article.publishedAt)}</span>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleShare}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-white border border-petal-200 hover:bg-petal-50 transition-colors"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>{copied ? "Link Copied!" : "Share"}</span>
            </button>
          </div>
        </div>

        {/* AI Disclaimer Banner */}
        {article.authorType === "agent" && (
          <div className="p-3.5 bg-amber-50/80 border border-amber-200/90 rounded-2xl flex items-center space-x-2.5 text-xs text-amber-900 shadow-xs">
            <Sparkles className="w-4 h-4 text-amber-700 shrink-0" />
            <span>
              <strong>Disclaimer:</strong> AI generated synthetic content synthesized by Moitrii Agent.
            </span>
          </div>
        )}
      </header>

      {/* 2. Editorial Cover Photo */}
      <div className="relative aspect-[16/9] rounded-3xl overflow-hidden shadow-editorial border border-petal-200 bg-white">
        <img
          src={article.coverImage}
          alt={article.title}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = "/images/moitrii.jpg";
          }}
        />
      </div>

      {/* 3. Key Takeaways Card */}
      {article.takeaways && article.takeaways.length > 0 && (
        <div className="bg-petal-100/90 p-6 sm:p-8 rounded-3xl border border-petal-200 space-y-3">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-forest-800" />
            <h2 className="font-editorial text-xl font-bold text-charcoal-900">
              Agent Key Takeaways
            </h2>
          </div>
          <ul className="space-y-2.5 text-sm text-charcoal-800">
            {article.takeaways.map((point: string, idx: number) => (
              <li key={idx} className="flex items-start space-x-2.5">
                <CheckCircle2 className="w-4 h-4 text-forest-700 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{point}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 4. Embedded YouTube Media */}
      {(() => {
        const cleanVideoId = extractYouTubeId(article.youtubeId);
        if (!cleanVideoId) return null;
        return (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                <Play className="w-4 h-4 text-rosebrand fill-rosebrand" />
                <h3 className="font-editorial text-lg font-bold text-charcoal-900">
                  Video Companion: {article.youtubeTitle || "Curated Guide"}
                </h3>
              </div>
              <a
                href={`https://www.youtube.com/watch?v=${cleanVideoId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-forest-800 hover:text-forest-900 hover:underline font-medium inline-flex items-center space-x-1"
              >
                <span>Watch on YouTube</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
            <div className="aspect-video rounded-3xl overflow-hidden shadow-editorial border border-petal-200 bg-black">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${cleanVideoId}`}
                title={article.youtubeTitle || "YouTube video player"}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full border-0"
              />
            </div>
          </div>
        );
      })()}

      {/* 5. Article Content Body */}
      <div className="pt-2">
        <MarkdownRenderer content={article.content} />
      </div>

      {/* 6. Verified Sources & Citations */}
      {article.sources && article.sources.length > 0 && (
        <div className="pt-8 border-t border-petal-200 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-charcoal-900">
            Verified Research Sources
          </h3>
          <ul className="space-y-2">
            {article.sources.map((src: any, i: number) => (
              <li key={i} className="flex items-center space-x-2 text-xs">
                <ExternalLink className="w-3.5 h-3.5 text-forest-700 shrink-0" />
                <a
                  href={src.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-forest-800 hover:underline font-medium"
                >
                  {src.title}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 7. Related Articles from Shared Ecosystem */}
      <div className="pt-12 border-t border-petal-200 space-y-6">
        <h3 className="font-editorial text-2xl font-bold text-charcoal-900">
          Related Stories in the Ecosystem
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {relatedArticles.map((rel: any) => (
            <Link
              key={rel._id}
              to={`/content/${rel.slug}`}
              className="bg-white p-5 rounded-2xl border border-petal-200 shadow-sm hover:shadow-md transition-all space-y-3 group"
            >
              <div className="relative aspect-[16/9] rounded-xl overflow-hidden">
                <img
                  src={rel.coverImage}
                  alt={rel.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = "/images/moitrii.jpg";
                  }}
                />
              </div>
              <span className="text-[10px] font-bold text-rosebrand uppercase">
                {rel.category}
              </span>
              <h4 className="font-editorial text-base font-bold text-charcoal-900 group-hover:text-forest-800 transition-colors line-clamp-2">
                {rel.title}
              </h4>
            </Link>
          ))}
        </div>
      </div>
    </article>
  );
}

export default ContentReaderPage;
