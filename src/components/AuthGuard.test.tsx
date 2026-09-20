import React from "react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("convex/react", () => ({
  useQuery: vi.fn(() => undefined),
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

describe("AuthGuard", () => {
  beforeEach(() => {
    mockedUseConvexAuth.mockReset();
  });

  test("shows a loading state while auth is resolving", () => {
    setAuth(true, false);

    render(
      <AuthGuard>
        <div>secret area</div>
      </AuthGuard>
    );

    expect(screen.getByText("Checking authentication...")).toBeInTheDocument();
    expect(screen.queryByText("secret area")).not.toBeInTheDocument();
  });

  test("prompts sign in when unauthenticated and hides children", () => {
    setAuth(false, false);

    render(
      <AuthGuard title="Members Only">
        <div>secret area</div>
      </AuthGuard>
    );

    expect(screen.getByText("Members Only")).toBeInTheDocument();
    expect(screen.getByText("Sign In with Google")).toBeInTheDocument();
    expect(screen.queryByText("secret area")).not.toBeInTheDocument();
  });

  test("renders children when authenticated", () => {
    setAuth(false, true);

    render(
      <AuthGuard>
        <div>secret area</div>
      </AuthGuard>
    );

    expect(screen.getByText("secret area")).toBeInTheDocument();
    expect(screen.queryByText("Sign In with Google")).not.toBeInTheDocument();
  });
});
