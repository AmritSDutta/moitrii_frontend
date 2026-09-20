"use client";

import { useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

/**
 * Returns dynamic Convex CDN asset URLs for logo and hero images
 * with automatic fallback to local public images.
 * Also synchronizes the browser tab favicon with the dynamic logoUrl.
 */
export function useBrandAssets() {
  let data: { logoUrl?: string; heroUrl?: string } | undefined;

  try {
    data = useQuery(api.files.getBrandAssets);
  } catch (e) {
    // Fallback when the query throws during static generation or against an
    // unreachable deployment — keeps Navbar/AuthModal rendering with local assets.
  }

  const logoUrl = data?.logoUrl || "/images/moitrii_logo.jpg";
  const heroUrl = data?.heroUrl || "/images/moitrii.jpg";

  useEffect(() => {
    if (typeof document !== "undefined" && logoUrl) {
      let link = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
      if (!link) {
        link = document.createElement("link");
        link.rel = "icon";
        document.head.appendChild(link);
      }
      link.href = logoUrl;
    }
  }, [logoUrl]);

  return {
    logoUrl,
    heroUrl,
  };
}

