import React from "react";
import { beforeEach, expect, test, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";

const { createRequestMock } = vi.hoisted(() => ({ createRequestMock: vi.fn() }));

vi.mock("convex/react", () => ({
  useQuery: vi.fn(() => undefined),
  useMutation: vi.fn(() => createRequestMock),
}));

vi.mock("@convex-dev/auth/react", () => ({
  useConvexAuth: vi.fn(() => ({
    isLoading: false,
    isAuthenticated: true,
    fetchAccessToken: async () => null,
  })),
  useAuthActions: vi.fn(() => ({ signIn: vi.fn(), signOut: vi.fn() })),
}));

import { AppProvider } from "@/lib/AppContext";
import { RequestsPage } from "./RequestsPage";

beforeEach(() => {
  createRequestMock.mockReset();
  createRequestMock.mockResolvedValue("req-1");
});

test("submits a prompt through the createRequest mutation in React Router", async () => {
  const user = userEvent.setup();

  render(
    <MemoryRouter>
      <AppProvider>
        <RequestsPage />
      </AppProvider>
    </MemoryRouter>
  );

  const textarea = screen.getByPlaceholderText(/budget-friendly boutique homestays/i);
  await user.type(textarea, "Find immunity boosting soups");

  await user.click(screen.getByRole("button", { name: /submit to queue/i }));

  await waitFor(() =>
    expect(createRequestMock).toHaveBeenCalledWith({
      prompt: "Find immunity boosting soups",
      category: "Health & Nutrition",
    })
  );
});
