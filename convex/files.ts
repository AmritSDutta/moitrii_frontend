import { query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

export const STATIC_STORAGE_IDS = {
  logo: "kg27f12h6g3hjmskn5s251hw7x8erg7k" as Id<"_storage">,
  hero: "kg22awb76r9wfhgcn444n1p6hh8es3j6" as Id<"_storage">,
};

/**
 * Returns the public Convex Edge CDN URLs for Moitrii's logo and hero artwork.
 */
export const getBrandAssets = query({
  args: {},
  handler: async (ctx) => {
    const logoUrl = await ctx.storage.getUrl(STATIC_STORAGE_IDS.logo);
    const heroUrl = await ctx.storage.getUrl(STATIC_STORAGE_IDS.hero);

    return {
      logoUrl: logoUrl || "/images/moitrii_logo.jpg",
      heroUrl: heroUrl || "/images/moitrii.jpg",
    };
  },
});
