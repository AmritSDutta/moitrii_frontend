"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import {
  Topic,
  Article,
  VideoItem,
  AgentRequest,
  AgentState,
  INITIAL_TOPICS,
  INITIAL_ARTICLES,
  INITIAL_VIDEOS,
  INITIAL_AGENT_STATE,
  INITIAL_REQUESTS,
} from "./mockData";

interface AppContextType {
  topics: Topic[];
  userInterests: string[];
  agentState: AgentState;
  requests: AgentRequest[];
  articles: Article[];
  videos: VideoItem[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  toggleInterest: (topicId: string) => void;
  submitRequest: (prompt: string, category?: string) => AgentRequest;
  publishArticle: (article: Omit<Article, "id" | "publishedAt" | "reusedCount">) => Article;
  triggerManualWake: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [topics] = useState<Topic[]>(INITIAL_TOPICS);
  const [userInterests, setUserInterests] = useState<string[]>([
    "health",
    "cooking",
    "kids",
    "travel",
    "wellness"
  ]);
  const [agentState, setAgentState] = useState<AgentState>(INITIAL_AGENT_STATE);
  const [requests, setRequests] = useState<AgentRequest[]>(INITIAL_REQUESTS);
  const [articles, setArticles] = useState<Article[]>(INITIAL_ARTICLES);
  const [videos] = useState<VideoItem[]>(INITIAL_VIDEOS);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Toggle user interest
  const toggleInterest = (topicId: string) => {
    setUserInterests((prev) =>
      prev.includes(topicId) ? prev.filter((id) => id !== topicId) : [...prev, topicId]
    );
  };

  // Submit request into queue
  const submitRequest = (prompt: string, category: string = "General Lifestyle"): AgentRequest => {
    const newReq: AgentRequest = {
      id: `req-${Date.now()}`,
      prompt,
      category,
      status: "PENDING",
      submittedAt: "Just now",
      scheduledFor: agentState.nextWakeTime,
      isReused: false,
    };
    setRequests((prev) => [newReq, ...prev]);
    return newReq;
  };

  // Publish new article to shared ecosystem
  const publishArticle = (
    newArticleData: Omit<Article, "id" | "publishedAt" | "reusedCount">
  ): Article => {
    const article: Article = {
      ...newArticleData,
      id: `art-${Date.now()}`,
      publishedAt: "Just now",
      reusedCount: 0,
      isReused: false,
    };
    setArticles((prev) => [article, ...prev]);
    return article;
  };

  // Interactive manual wake simulation for demo & testing
  const triggerManualWake = () => {
    setAgentState((prev) => ({
      ...prev,
      status: "WORKING",
      statusMessage: "Agent woke up on schedule. Evaluating pending requests and shared knowledge...",
      activeTask: "Synthesizing research & validating content",
    }));

    setTimeout(() => {
      // Transition pending requests to completed
      setRequests((prev) =>
        prev.map((req) =>
          req.status === "PENDING"
            ? {
                ...req,
                status: "COMPLETED",
                completedAt: "Just now",
                contentTitle: "Generated Lifestyle & Wellness Guide",
                isReused: true,
                reuseNote: "Matched with validated guidelines from Shared Knowledge Base.",
              }
            : req
        )
      );

      setAgentState((prev) => ({
        ...prev,
        status: "SLEEPING",
        statusMessage: "Tasks completed and delivered. Returning to peaceful sleep until next cycle.",
        lastActiveTime: "Just now",
        activeTask: undefined,
      }));
    }, 3500);
  };

  return (
    <AppContext.Provider
      value={{
        topics,
        userInterests,
        agentState,
        requests,
        articles,
        videos,
        searchQuery,
        setSearchQuery,
        toggleInterest,
        submitRequest,
        publishArticle,
        triggerManualWake,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
};
