import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ConvexClientProvider } from "@/components/ConvexClientProvider";
import { AppProvider } from "@/lib/AppContext";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { AuthGuard } from "@/components/AuthGuard";
import { HomePage } from "@/pages/HomePage";
import { DashboardPage } from "@/pages/DashboardPage";
import { RequestsPage } from "@/pages/RequestsPage";
import { OnboardingPage } from "@/pages/OnboardingPage";
import { ContentReaderPage } from "@/pages/ContentReaderPage";
import { PublisherPage } from "@/pages/PublisherPage";
import { UnsubscribePage } from "@/pages/UnsubscribePage";
import { NotFoundPage } from "@/pages/NotFoundPage";

export function App() {
  return (
    <ConvexClientProvider>
      <AppProvider>
        <BrowserRouter>
          <div className="min-h-screen flex flex-col text-charcoal-900 antialiased selection:bg-rosebrand/20 selection:text-charcoal-900">
            <Navbar />
            <main className="flex-grow">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/explore" element={<HomePage />} />
                <Route
                  path="/dashboard"
                  element={
                    <AuthGuard
                      title="Personal Agent Dashboard"
                      description="Sign in with your Google account to interact with your personal AI agent, track scheduled wake cycles, and manage deliverables."
                    >
                      <DashboardPage />
                    </AuthGuard>
                  }
                />
                <Route
                  path="/requests"
                  element={
                    <AuthGuard
                      title="Request Center & Durable Queue"
                      description="Sign in with Google to submit research prompts, track scheduled wake windows, and view your personalized deliverable history."
                    >
                      <RequestsPage />
                    </AuthGuard>
                  }
                />
                <Route
                  path="/onboarding"
                  element={
                    <AuthGuard
                      title="Personalize Your Agent's Interests"
                      description="Sign in with your Google account to customize the lifestyle domains, wellness topics, and cultural streams your personal agent follows."
                    >
                      <OnboardingPage />
                    </AuthGuard>
                  }
                />
                <Route path="/content/:id" element={<ContentReaderPage />} />
                <Route path="/unsubscribe" element={<UnsubscribePage />} />
                <Route
                  path="/publisher"
                  element={
                    <AuthGuard
                      title="Publisher Studio"
                      description="Sign in with your Google account to draft, preview, and publish verified guides to the Moitrii Shared Knowledge Ecosystem."
                    >
                      <PublisherPage />
                    </AuthGuard>
                  }
                />
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </BrowserRouter>
      </AppProvider>
    </ConvexClientProvider>
  );
}

export default App;
