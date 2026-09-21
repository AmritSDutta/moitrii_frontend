import "@testing-library/jest-dom/vitest";
import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

afterEach(() => {
  cleanup();
});

// Mock window.scrollTo
if (typeof window !== "undefined") {
  window.scrollTo = vi.fn();
}
