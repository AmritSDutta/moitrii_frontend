"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/AppContext";
import { AuthGuard } from "@/components/AuthGuard";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import {
  Heart,
  Utensils,
  Sparkles,
  Activity,
  Sun,
  GraduationCap,
  Home,
  Compass,
  Zap,
  Smile,
  CheckCircle2,
  ArrowRight,
  Loader2
} from "lucide-react";

export default function OnboardingPage() {
  const router = useRouter();
  const { topics, userInterests: fallbackInterests } = useApp();
  const liveInterests = useQuery(api.users.getInterests);
  const updateInterestsMutation = useMutation(api.users.updateInterests);

  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (liveInterests && liveInterests.length > 0) {
      setSelectedInterests(liveInterests);
    } else if (fallbackInterests && fallbackInterests.length > 0) {
      setSelectedInterests(fallbackInterests);
    }
  }, [liveInterests, fallbackInterests]);

  const userInterests = selectedInterests;

  const toggleInterest = async (topicId: string) => {
    const updated = selectedInterests.includes(topicId)
      ? selectedInterests.filter((id) => id !== topicId)
      : [...selectedInterests, topicId];

    setSelectedInterests(updated);
    try {
      await updateInterestsMutation({ topicIds: updated });
    } catch (err) {
      console.error("Failed to sync interests:", err);
    }
  };


  const getIcon = (iconName: string) => {
    switch (iconName) {
      case "Heart": return <Heart className="w-5 h-5" />;
      case "Utensils": return <Utensils className="w-5 h-5" />;
      case "Sparkles": return <Sparkles className="w-5 h-5" />;
      case "Activity": return <Activity className="w-5 h-5" />;
      case "Sun": return <Sun className="w-5 h-5" />;
      case "GraduationCap": return <GraduationCap className="w-5 h-5" />;
      case "Home": return <Home className="w-5 h-5" />;
      case "Compass": return <Compass className="w-5 h-5" />;
      case "Zap": return <Zap className="w-5 h-5" />;
      case "Smile": return <Smile className="w-5 h-5" />;
      default: return <Sparkles className="w-5 h-5" />;
    }
  };

  const lifestyleTopics = topics.filter((t) => t.category === "lifestyle" || t.category === "wellness");
  const youthTopics = topics.filter((t) => t.category === "parenting");

  return (
    <AuthGuard
      title="Personalize Your Agent's Interests"
      description="Sign in with your Google account to customize the lifestyle domains, wellness topics, and cultural streams your personal agent follows."
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <span className="text-xs font-bold uppercase tracking-widest text-forest-700 bg-forest-50 px-3.5 py-1 rounded-full border border-forest-100">
          STEP 1: PERSONALIZE YOUR AGENT
        </span>
        <h1 className="font-editorial text-4xl font-bold text-charcoal-900">
          What Would You Like Moitrii to Follow?
        </h1>
        <p className="text-sm text-charcoal-600">
          Select the life domains, wellness routines, and cultural topics that matter to you.
          Your personal agent will research, curate, and prepare insights aligned with these choices.
        </p>
      </div>

      {/* Floating Summary Bar */}
      <div className="sticky top-24 z-30 bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-petal-200 shadow-md flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-full bg-forest-50 flex items-center justify-center text-forest-800 font-bold text-sm">
            {userInterests.length}
          </div>
          <div>
            <span className="text-xs font-bold text-charcoal-900 block">
              {userInterests.length === 0
                ? "Select at least 1 topic"
                : `${userInterests.length} Topics Selected`}
            </span>
            <span className="text-[11px] text-charcoal-500">
              Personalizing your agent’s wake-up research digest
            </span>
          </div>
        </div>

        <button
          onClick={() => router.push("/dashboard")}
          disabled={userInterests.length === 0}
          className="bg-forest-800 hover:bg-forest-900 disabled:opacity-50 text-white text-xs font-bold px-6 py-2.5 rounded-full transition-all flex items-center space-x-2 shadow-sm"
        >
          <span>Save & Go to Dashboard</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Section 1: Core Lifestyle & Mindful Living */}
      <div className="space-y-6">
        <div className="border-b border-petal-200 pb-2">
          <h2 className="font-editorial text-2xl font-bold text-charcoal-900">
            Core Lifestyle & Mindful Living
          </h2>
          <p className="text-xs text-charcoal-500">
            Everyday nourishment, body wellness, beautiful homes, and peaceful escapes.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {lifestyleTopics.map((topic) => {
            const isSelected = userInterests.includes(topic.id);
            return (
              <div
                key={topic.id}
                onClick={() => toggleInterest(topic.id)}
                className={`p-6 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between space-y-4 ${
                  isSelected
                    ? "bg-white border-forest-800 ring-2 ring-forest-800/20 shadow-md"
                    : "bg-white/80 border-petal-200 hover:bg-white hover:border-petal-300 shadow-sm"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                      isSelected
                        ? "bg-forest-800 text-white"
                        : "bg-petal-100 text-charcoal-700"
                    }`}
                  >
                    {getIcon(topic.icon)}
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                      isSelected
                        ? "bg-forest-800 border-forest-800 text-white"
                        : "border-petal-300"
                    }`}
                  >
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                  </div>
                </div>

                <div>
                  <h3 className="font-editorial text-lg font-bold text-charcoal-900">
                    {topic.name}
                  </h3>
                  <p className="text-xs text-charcoal-600 mt-1 leading-relaxed">
                    {topic.description}
                  </p>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-2">
                  {topic.popularSearches.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] bg-petal-100 text-charcoal-600 px-2 py-0.5 rounded-md"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 2: Parent & Youth Culture */}
      <div className="space-y-6 pt-6">
        <div className="border-b border-petal-200 pb-2">
          <h2 className="font-editorial text-2xl font-bold text-charcoal-900">
            Parenting & Youth Culture
          </h2>
          <p className="text-xs text-charcoal-500">
            Stay connected with what your children, pre-teens, and Gen-Z are watching and discussing.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {youthTopics.map((topic) => {
            const isSelected = userInterests.includes(topic.id);
            return (
              <div
                key={topic.id}
                onClick={() => toggleInterest(topic.id)}
                className={`p-6 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between space-y-4 ${
                  isSelected
                    ? "bg-white border-forest-800 ring-2 ring-forest-800/20 shadow-md"
                    : "bg-white/80 border-petal-200 hover:bg-white hover:border-petal-300 shadow-sm"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                      isSelected
                        ? "bg-forest-800 text-white"
                        : "bg-petal-100 text-charcoal-700"
                    }`}
                  >
                    {getIcon(topic.icon)}
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                      isSelected
                        ? "bg-forest-800 border-forest-800 text-white"
                        : "border-petal-300"
                    }`}
                  >
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                  </div>
                </div>

                <div>
                  <h3 className="font-editorial text-lg font-bold text-charcoal-900">
                    {topic.name}
                  </h3>
                  <p className="text-xs text-charcoal-600 mt-1 leading-relaxed">
                    {topic.description}
                  </p>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-2">
                  {topic.popularSearches.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] bg-petal-100 text-charcoal-600 px-2 py-0.5 rounded-md"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
    </AuthGuard>
  );
}
