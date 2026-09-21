import Google from "@auth/core/providers/google";
import { convexAuth } from "@convex-dev/auth/server";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    // Always show Google's account chooser so each sign-in is an explicit
    // account selection instead of silently resuming the previous session.
    Google({
      authorization: {
        params: {
          prompt: "select_account",
        },
      },
    }),
  ],
});
