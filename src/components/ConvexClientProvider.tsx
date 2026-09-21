import { ReactNode } from "react";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient } from "convex/react";

const convexUrl =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_CONVEX_URL) ||
  (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_CONVEX_URL) ||
  "https://brazen-rook-983.convex.cloud";

const convex = new ConvexReactClient(convexUrl);

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  return <ConvexAuthProvider client={convex}>{children}</ConvexAuthProvider>;
}
