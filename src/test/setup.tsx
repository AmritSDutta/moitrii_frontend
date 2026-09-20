import "@testing-library/jest-dom/vitest";
import React from "react";
import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

afterEach(() => {
  cleanup();
});

const NEXT_IMAGE_ONLY_PROPS = [
  "fill",
  "priority",
  "quality",
  "placeholder",
  "blurDataURL",
  "loader",
  "sizes",
  "unoptimized",
];

vi.mock("next/image", () => ({
  __esModule: true,
  default: ({
    src,
    alt,
    ...rest
  }: { src?: unknown; alt?: string } & Record<string, unknown>) => {
    const resolvedSrc =
      typeof src === "string" ? src : ((src as { src?: string } | undefined)?.src ?? "");
    const domProps = { ...rest };
    for (const key of NEXT_IMAGE_ONLY_PROPS) {
      delete domProps[key];
    }
    return React.createElement("img", { src: resolvedSrc, alt: alt ?? "", ...domProps });
  },
}));
