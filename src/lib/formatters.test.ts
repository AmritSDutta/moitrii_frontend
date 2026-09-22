import { describe, it, expect } from "vitest";
import { getOrdinalSuffix, formatDisplayDate, formatWakeTime12h } from "./formatters";

describe("formatters", () => {
  describe("getOrdinalSuffix", () => {
    it("handles 1st, 2nd, 3rd correctly", () => {
      expect(getOrdinalSuffix(1)).toBe("st");
      expect(getOrdinalSuffix(2)).toBe("nd");
      expect(getOrdinalSuffix(3)).toBe("rd");
      expect(getOrdinalSuffix(4)).toBe("th");
      expect(getOrdinalSuffix(21)).toBe("st");
      expect(getOrdinalSuffix(22)).toBe("nd");
      expect(getOrdinalSuffix(23)).toBe("rd");
      expect(getOrdinalSuffix(31)).toBe("st");
    });

    it("handles 11th, 12th, 13th edge cases", () => {
      expect(getOrdinalSuffix(11)).toBe("th");
      expect(getOrdinalSuffix(12)).toBe("th");
      expect(getOrdinalSuffix(13)).toBe("th");
    });
  });

  describe("formatDisplayDate", () => {
    it("formats ISO timestamps into human-readable ordinal format", () => {
      // 2026-06-27 is a Saturday
      const formatted = formatDisplayDate("2026-06-27T10:00:00.000Z");
      expect(formatted).toMatch(/27th Jun, Sat, 26/);
    });

    it("formats standard ISO string with timezone cleanly", () => {
      const formatted = formatDisplayDate("2026-09-22T11:10:08.404Z");
      expect(formatted).toContain("Sep");
      expect(formatted).toContain("26");
    });

    it("preserves relative mock strings", () => {
      expect(formatDisplayDate("Today, 08:30 AM")).toBe("Today, 08:30 AM");
      expect(formatDisplayDate("Yesterday")).toBe("Yesterday");
      expect(formatDisplayDate("Just now")).toBe("Just now");
    });

    it("handles empty / null inputs gracefully", () => {
      expect(formatDisplayDate("")).toBe("");
      expect(formatDisplayDate(null)).toBe("");
      expect(formatDisplayDate(undefined)).toBe("");
    });
  });

  describe("formatWakeTime12h", () => {
    it("formats 24h times to 12h representation", () => {
      expect(formatWakeTime12h("23:00")).toBe("11:00 PM");
      expect(formatWakeTime12h("07:15")).toBe("07:15 AM");
      expect(formatWakeTime12h("00:30")).toBe("12:30 AM");
      expect(formatWakeTime12h("12:45")).toBe("12:45 PM");
      expect(formatWakeTime12h("15:00")).toBe("03:00 PM");
    });

    it("handles invalid or fallback cases", () => {
      expect(formatWakeTime12h(undefined)).toBe("11:00 PM");
      expect(formatWakeTime12h("invalid")).toBe("11:00 PM");
      expect(formatWakeTime12h("11:00 PM")).toBe("11:00 PM");
    });
  });
});
