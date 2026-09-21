import React from "react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { VALIDATION_TIMEOUT_MS } from "@/lib/useValidatedAuth";

const { viewerMock } = vi.hoisted(() => ({ viewerMock: vi.fn() }));

vi.mock("convex/react", () => ({
  // Emulates the real useQuery contract: "skip" never subscribes (undefined);
  // otherwise return the per-test viewer value. In the signedOut branch,
  // AuthModal's brand-assets query also reads this mock and harmlessly falls
  // back to local images.
  useQuery: vi.fn((_ref: unknown, args?: unknown) =>
    args === "skip" ? undefined : viewerMock()
  ),
  useMutation: vi.fn(),
}));

vi.mock("@convex-dev/auth/react", () => ({
  useConvexAuth: vi.fn(),
  useAuthActions: vi.fn(() => ({ signIn: vi.fn(), signOut: vi.fn() })),
}));

import { useConvexAuth } from "@convex-dev/auth/react";
import { AuthGuard } from "./AuthGuard";

const mockedUseConvexAuth = vi.mocked(useConvexAuth);

const setAuth = (isLoading: boolean, isAuthenticated: boolean) => {
  mockedUseConvexAuth.mockReturnValue({
    isLoading,
    isAuthenticated,
    fetchAccessToken: async () => null,
  });
};

const validViewer = {
  _id: "k107testuser1234567890",
  _creationTime: 0,
  name: "Priya",
  preferredLanguage: "en" as const,
};

describe("AuthGuard (server-validated auth)", () => {
  beforeEach(() => {
    mockedUseConvexAuth.mockReset();
    viewerMock.mockReset().mockReturnValue(undefined);
    vi.useRealTimers();
  });

  test("shows a loading state while the auth handshake is resolving", () => {
    setAuth(true, false);
    viewerMock.mockReturnValue(undefined);

    render(
      <AuthGuard>
        <div>secret area</div>
      </AuthGuard>
    );

    expect(screen.getByText("Checking authentication...")).toBeInTheDocument();
    expect(screen.queryByText("secret area")).not.toBeInTheDocument();
  });

  test("prompts sign in when unauthenticated, even before viewer resolves", () => {
    setAuth(false, false);
    viewerMock.mockReturnValue(undefined);

    render(
      <AuthGuard title="Members Only">
        <div>secret area</div>
      </AuthGuard>
    );

    expect(screen.getByText("Members Only")).toBeInTheDocument();
    expect(screen.getByText("Sign In with Google")).toBeInTheDocument();
    expect(screen.queryByText("secret area")).not.toBeInTheDocument();
  });

  test("treats a ghost session (token present, backend denies user) as signed out", () => {
    setAuth(false, true);
    viewerMock.mockReturnValue(null);

    render(
      <AuthGuard>
        <div>secret area</div>
      </AuthGuard>
    );

    expect(screen.getByText("Sign In with Google")).toBeInTheDocument();
    expect(screen.queryByText("secret area")).not.toBeInTheDocument();
  });

  test("renders children only after the backend confirms the session", () => {
    setAuth(false, true);
    viewerMock.mockReturnValue(validViewer);

    render(
      <AuthGuard>
        <div>secret area</div>
      </AuthGuard>
    );

    expect(screen.getByText("secret area")).toBeInTheDocument();
    expect(screen.queryByText("Sign In with Google")).not.toBeInTheDocument();
  });

  test("falls back to the sign-in screen when validation never completes", () => {
    vi.useFakeTimers();
    setAuth(false, true);
    // Token claims a session but the viewer query hangs (undefined forever).
    viewerMock.mockReturnValue(undefined);

    render(
      <AuthGuard>
        <div>secret area</div>
      </AuthGuard>
    );

    expect(screen.getByText("Checking authentication...")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(VALIDATION_TIMEOUT_MS);
    });

    expect(screen.getByText("Sign In with Google")).toBeInTheDocument();
    expect(screen.queryByText("secret area")).not.toBeInTheDocument();
  });

  test("completes sign-in cleanly: signed-out render, then authenticated with a confirmed viewer", () => {
    // Regression for the stale-null race: signing in must never be read as a
    // ghost session that wipes the fresh token.
    setAuth(false, false);
    viewerMock.mockReturnValue(null);

    const view = render(
      <AuthGuard>
        <div>secret area</div>
      </AuthGuard>
    );
    expect(screen.getByText("Sign In with Google")).toBeInTheDocument();

    // OAuth callback lands: token stored, backend confirms the user.
    setAuth(false, true);
    viewerMock.mockReturnValue(validViewer);
    view.rerender(
      <AuthGuard>
        <div>secret area</div>
      </AuthGuard>
    );

    expect(screen.getByText("secret area")).toBeInTheDocument();
    expect(screen.queryByText("Sign In with Google")).not.toBeInTheDocument();
  });
});
