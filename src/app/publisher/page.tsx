"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useApp } from "@/lib/AppContext";
import { AuthGuard } from "@/components/AuthGuard";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import {
  PenTool,
  Sparkles,
  Eye,
  CheckCircle,
  Plus,
  Trash2,
  UploadCloud,
  ArrowRight,
  Upload,
  Loader2
} from "lucide-react";

export default function PublisherStudioPage() {
  const router = useRouter();
  const { topics } = useApp();
  const publishContent = useMutation(api.content.publishContent);
  const generateUploadUrl = useMutation(api.content.generateUploadUrl);

  const [mode, setMode] = useState<"edit" | "preview">("edit");
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [category, setCategory] = useState("Health & Nutrition");
  const [author, setAuthor] = useState("Moitrii Editorial Team");
  const [readTime, setReadTime] = useState("4 min read");
  const [coverImage, setCoverImage] = useState(
    "https://images.unsplash.com/photo-1540420773420-3366772f4999?q=80&w=1200&auto=format&fit=crop"
  );
  const [coverImageStorageId, setCoverImageStorageId] = useState<Id<"_storage"> | undefined>(undefined);
  const [isUploading, setIsUploading] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [youtubeId, setYoutubeId] = useState("");
  const [youtubeTitle, setYoutubeTitle] = useState("");
  const [takeaways, setTakeaways] = useState<string[]>([
    "Wholesome ingredient substitutions preserve nutritional integrity.",
    "Gentle daily rituals anchor mental and physical clarity."
  ]);
  const [content, setContent] = useState(
    "### Introduction\n\nWrite your lifestyle guide here. Include markdown headers and tips for the community."
  );

  const addTakeaway = () => {
    setTakeaways([...takeaways, ""]);
  };

  const updateTakeaway = (index: number, val: string) => {
    const updated = [...takeaways];
    updated[index] = val;
    setTakeaways(updated);
  };

  const removeTakeaway = (index: number) => {
    setTakeaways(takeaways.filter((_, i) => i !== index));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const uploadUrl = await generateUploadUrl();
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      const { storageId } = await result.json();
      setCoverImageStorageId(storageId);
      setCoverImage(URL.createObjectURL(file));
    } catch (err) {
      console.error("Failed to upload image to Convex storage:", err);
    } finally {
      setIsUploading(false);
    }
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setIsPublishing(true);
    try {
      const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");

      const res = await publishContent({
        title: title.trim(),
        slug,
        subtitle: subtitle.trim(),
        category,
        author: author.trim(),
        authorType: "human",
        readTime: readTime.trim(),
        coverImage,
        coverImageStorageId,
        youtubeId: youtubeId.trim() || undefined,
        youtubeTitle: youtubeTitle.trim() || undefined,
        takeaways: takeaways.filter((t) => t.trim() !== ""),
        content: content.trim(),
        sources: [
          { title: "Moitrii Verified Editorial Knowledge", url: "https://example.com" }
        ],
      });

      router.push(`/content/${res.slug}`);
    } catch (err) {
      console.error("Failed to publish content:", err);
      setIsPublishing(false);
    }
  };


  return (
    <AuthGuard
      title="Publisher Studio"
      description="Sign in with your Google account to draft, preview, and publish verified guides to the Moitrii Shared Knowledge Ecosystem."
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-petal-200 pb-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-forest-700 bg-forest-50 px-3 py-1 rounded-full border border-forest-100">
            SHARED KNOWLEDGE STUDIO
          </span>
          <h1 className="font-editorial text-3xl font-bold text-charcoal-900 mt-1">
            Publisher Studio
          </h1>
          <p className="text-xs text-charcoal-500">
            Publish expert guides directly to the Moitrii Shared Knowledge Ecosystem for agent reuse.
          </p>
        </div>

        {/* Edit / Preview Toggle */}
        <div className="flex items-center gap-1.5 bg-petal-100 p-1 rounded-full text-xs self-start">
          <button
            onClick={() => setMode("edit")}
            className={`px-4 py-2 rounded-full font-bold transition-colors ${
              mode === "edit"
                ? "bg-forest-800 text-white shadow-xs"
                : "text-charcoal-600 hover:text-charcoal-900"
            }`}
          >
            <span className="flex items-center space-x-1.5">
              <PenTool className="w-3.5 h-3.5" />
              <span>Compose</span>
            </span>
          </button>
          <button
            onClick={() => setMode("preview")}
            className={`px-4 py-2 rounded-full font-bold transition-colors ${
              mode === "preview"
                ? "bg-forest-800 text-white shadow-xs"
                : "text-charcoal-600 hover:text-charcoal-900"
            }`}
          >
            <span className="flex items-center space-x-1.5">
              <Eye className="w-3.5 h-3.5" />
              <span>Live Preview</span>
            </span>
          </button>
        </div>
      </div>

      {mode === "edit" ? (
        /* Edit Mode Form */
        <form onSubmit={handlePublish} className="space-y-6">
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-petal-200 shadow-sm space-y-5">
            <h2 className="font-editorial text-xl font-bold text-charcoal-900">
              Article Meta & Details
            </h2>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-charcoal-700 block mb-1">
                  Article Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. 7 Restorative Yoga Poses for Deep Sleep"
                  className="w-full px-4 py-3 text-base bg-petal-50 rounded-xl border border-petal-200 focus:outline-none focus:ring-2 focus:ring-forest-800/30 font-editorial font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-charcoal-700 block mb-1">
                  Subtitle / Summary *
                </label>
                <input
                  type="text"
                  required
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  placeholder="A concise description of the insights and routines covered in this guide."
                  className="w-full px-4 py-2.5 text-xs bg-petal-50 rounded-xl border border-petal-200 focus:outline-none focus:ring-2 focus:ring-forest-800/30"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-charcoal-700 block mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-petal-50 rounded-xl border border-petal-200"
                  >
                    {topics.map((t) => (
                      <option key={t.id} value={t.name}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-charcoal-700 block mb-1">
                    Author Byline
                  </label>
                  <input
                    type="text"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-petal-50 rounded-xl border border-petal-200"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-charcoal-700 block mb-1">
                    Estimated Read Time
                  </label>
                  <input
                    type="text"
                    value={readTime}
                    onChange={(e) => setReadTime(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-petal-50 rounded-xl border border-petal-200"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-charcoal-700 block mb-1">
                  Cover Image (Upload file or enter URL)
                </label>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <input
                    type="url"
                    value={coverImage}
                    onChange={(e) => setCoverImage(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full px-3 py-2 text-xs bg-petal-50 rounded-xl border border-petal-200"
                  />
                  <label className="shrink-0 inline-flex items-center justify-center space-x-2 bg-white hover:bg-petal-100 text-charcoal-800 text-xs font-semibold px-4 py-2 rounded-xl border border-petal-300 cursor-pointer shadow-xs transition-colors">
                    {isUploading ? (
                      <Loader2 className="w-4 h-4 animate-spin text-forest-800" />
                    ) : (
                      <Upload className="w-4 h-4 text-forest-800" />
                    )}
                    <span>{isUploading ? "Uploading..." : "Upload Image"}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                      disabled={isUploading}
                    />
                  </label>
                </div>
                {coverImageStorageId && (
                  <p className="text-[11px] text-emerald-700 mt-1 font-medium flex items-center space-x-1">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Image uploaded to Convex File Storage</span>
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-charcoal-700 block mb-1">
                    YouTube Video ID (Optional)
                  </label>
                  <input
                    type="text"
                    value={youtubeId}
                    onChange={(e) => setYoutubeId(e.target.value)}
                    placeholder="e.g. aU88VzD2Q0M"
                    className="w-full px-3 py-2 text-xs bg-petal-50 rounded-xl border border-petal-200"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-charcoal-700 block mb-1">
                    YouTube Title (Optional)
                  </label>
                  <input
                    type="text"
                    value={youtubeTitle}
                    onChange={(e) => setYoutubeTitle(e.target.value)}
                    placeholder="e.g. Gentle Morning Yoga Flow"
                    className="w-full px-3 py-2 text-xs bg-petal-50 rounded-xl border border-petal-200"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Key Takeaways Builder */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-petal-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-editorial text-xl font-bold text-charcoal-900">
                  Key Takeaway Highlights
                </h2>
                <p className="text-xs text-charcoal-500">
                  3-4 core lessons or takeaways for the reader callout card.
                </p>
              </div>
              <button
                type="button"
                onClick={addTakeaway}
                className="text-xs font-bold text-forest-800 hover:text-forest-900 flex items-center space-x-1 bg-forest-50 px-3 py-1.5 rounded-full border border-forest-100"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Bullet</span>
              </button>
            </div>

            <div className="space-y-3">
              {takeaways.map((t, i) => (
                <div key={i} className="flex items-center space-x-2">
                  <span className="w-5 h-5 rounded-full bg-petal-100 text-charcoal-700 flex items-center justify-center text-[10px] font-bold shrink-0">
                    {i + 1}
                  </span>
                  <input
                    type="text"
                    value={t}
                    onChange={(e) => updateTakeaway(i, e.target.value)}
                    placeholder={`Takeaway bullet ${i + 1}`}
                    className="w-full px-3 py-2 text-xs bg-petal-50 rounded-xl border border-petal-200"
                  />
                  {takeaways.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeTakeaway(i)}
                      className="p-2 text-charcoal-400 hover:text-red-600 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Article Markdown Body */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-petal-200 shadow-sm space-y-4">
            <h2 className="font-editorial text-xl font-bold text-charcoal-900">
              Article Content (Markdown)
            </h2>
            <textarea
              rows={12}
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full p-4 text-xs font-mono bg-petal-50 rounded-2xl border border-petal-200 focus:outline-none focus:ring-2 focus:ring-forest-800/30 text-charcoal-900"
            />
          </div>

          {/* Publish Action */}
          <div className="flex items-center justify-end space-x-4">
            <button
              type="submit"
              disabled={isPublishing}
              className="bg-forest-800 hover:bg-forest-900 disabled:opacity-50 text-white text-xs font-bold px-8 py-3.5 rounded-full transition-colors flex items-center space-x-2 shadow-md"
            >
              {isPublishing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <UploadCloud className="w-4 h-4" />
              )}
              <span>{isPublishing ? "Publishing to Convex..." : "Publish to Shared Ecosystem"}</span>
            </button>
          </div>
        </form>
      ) : (
        /* Live Preview Mode */
        <div className="bg-white p-8 rounded-3xl border border-petal-200 shadow-sm space-y-8">
          <div className="space-y-3">
            <span className="text-xs font-bold uppercase text-forest-800 bg-forest-50 px-3 py-1 rounded-full">
              {category}
            </span>
            <h1 className="font-editorial text-3xl sm:text-4xl font-bold text-charcoal-900">
              {title || "Untitled Article"}
            </h1>
            <p className="text-sm text-charcoal-600">
              {subtitle || "No subtitle provided."}
            </p>
            <div className="text-xs text-charcoal-500 pt-2 border-t border-petal-100 flex items-center space-x-3">
              <span>{author}</span>
              <span>·</span>
              <span>{readTime}</span>
            </div>
          </div>

          {coverImage && (
            <div className="relative aspect-[16/9] w-full rounded-2xl overflow-hidden shadow-sm">
              <Image src={coverImage} alt="Cover Preview" fill className="object-cover" />
            </div>
          )}

          {takeaways.length > 0 && (
            <div className="bg-petal-50 p-6 rounded-2xl border border-petal-200 space-y-2">
              <h3 className="font-editorial text-base font-bold text-charcoal-900">
                Key Takeaways
              </h3>
              <ul className="space-y-1.5 text-xs text-charcoal-700">
                {takeaways.map((t, i) => (
                  <li key={i} className="flex items-center space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-forest-700" />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="text-xs text-charcoal-800 space-y-4 whitespace-pre-wrap leading-relaxed">
            {content}
          </div>

          <div className="pt-6 border-t border-petal-200 flex justify-end">
            <button
              type="button"
              onClick={handlePublish}
              className="bg-forest-800 hover:bg-forest-900 text-white text-xs font-bold px-8 py-3 rounded-full flex items-center space-x-2"
            >
              <span>Looks Good — Publish Now</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
    </AuthGuard>
  );
}
