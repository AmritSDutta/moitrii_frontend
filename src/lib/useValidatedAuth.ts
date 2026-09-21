"use client";

import { useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { useConvexAuth } from "@convex-dev/auth/react";
import { api } from "../../convex/_generated/api";
import type { Doc } from "../../convex/_generated/dataModel";

/**
 * If the stored token cannot be validated against the backend within this
 * window (unreachable deployment, stuck handshake, ghost session), fall back
 * to the signed-out UI instead of blocking on a spinner forever.
 */
export const VALIDATION_TIMEOUT_MS = 8000;

export type Viewer = Doc<"users"> & { preferredLanguage: "en" | "bn" | "hi" };

export type ValidatedAuthStatus = "checking" | "signedIn" | "signedOut";

/**
 * Single source of truth for "is the user really logged in".
 *
 * `useConvexAuth().isAuthenticated` only reflects the client's local belief
 * (a token exists in storage). A session is treated as signed in ONLY after
 * the backend confirms it — the `users.viewer` query resolving to a user doc.
 * Anything else (no token, viewer null, or validation that never completes)
 * surfaces as signed out, so the sign-in button always has a path to appear.
 */
export function useValidatedAuth(): {
  status: ValidatedAuthStatus;
  user: Viewer | null | undefined;
  isAuthenticated: boolean;
  authLoading: boolean;
} {
  const { isAuthenticated, isLoading } = useConvexAuth();
  // Subscribe only while authenticated. An always-on subscription keeps its
  // stale unauthenticated result (`null`) for a render after sign-in flips
  // `isAuthenticated` — which reads as a ghost session and would trigger the
  // Navbar's storage-wipe/signOut heal, destroying the fresh token. Skipping
  // the subscription while signed out makes that race impossible.
  const viewer = useQuery(api.users.viewer, isAuthenticated ? {} : "skip");
  const [timedOut, setTimedOut] = useState(false);

  // Validation is pending while the auth handshake runs, or while a claimed
  // session has not yet been confirmed by the viewer query.
  const validating = isLoading || (isAuthenticated && viewer === undefined);

  useEffect(() => {
    if (!validating) {
      setTimedOut(false);
      return;
    }
    const timer = setTimeout(() => setTimedOut(true), VALIDATION_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [validating]);

  let status: ValidatedAuthStatus = "checking";
  if (!validating || timedOut) {
    status = isAuthenticated && viewer ? "signedIn" : "signedOut";
  }

  return {
    status,
    // Raw value: `undefined` (still loading) must stay distinct from `null`
    // (backend says no user) — the ghost-session heal keys on that difference.
    user: viewer as Viewer | null | undefined,
    isAuthenticated,
    authLoading: isLoading,
  };
}
