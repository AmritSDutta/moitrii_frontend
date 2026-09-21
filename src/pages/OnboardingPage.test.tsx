import React from "react";
import { beforeEach, expect, test, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";

const { updateInterestsMock } = vi.hoisted(() => ({ updateInterestsMock: vi.fn() }));

vi.mock("@/lib/AppContext", async () => {
  const { INITIAL_TOPICS } = await vi.importActual<typeof import("@/lib/mockData")>(
    "@/lib/mockData"
  );
  return {
    useApp: () => ({
      topics: INITIAL_TOPICS,
      userInterests: [],
      agentState: undefined,
      requests: [],
      articles: [],
      videos: [],
      searchQuery: "",
      setSearchQuery: () => {},
      toggleInterest: () => {},
      submitRequest: () => {},
      publishArticle: () => {},
      triggerManualWake: () => {},
    }),
  };
});

vi.mock("convex/react", () => ({
  useQuery: vi.fn(() => []),
  useMutation: vi.fn(() => updateInterestsMock),
}));

vi.mock("@convex-dev/auth/react", () => ({
  useConvexAuth: vi.fn(() => ({
    isLoading: false,
    isAuthenticated: true,
    fetchAccessToken: async () => null,
  })),
  useAuthActions: vi.fn(() => ({ signIn: vi.fn(), signOut: vi.fn() })),
}));

import { OnboardingPage } from "./OnboardingPage";

beforeEach(() => {
  updateInterestsMock.mockReset();
  updateInterestsMock.mockResolvedValue(undefined);
});

test("selecting a topic persists it through updateInterests in React Router", async () => {
  const user = userEvent.setup();

  render(
    <MemoryRouter>
      <OnboardingPage />
    </MemoryRouter>
  );

  await user.click(screen.getByText("Health & Nutrition"));

  await waitFor(() =>
    expect(updateInterestsMock).toHaveBeenCalledWith({ topicIds: ["health"] })
  );
});
