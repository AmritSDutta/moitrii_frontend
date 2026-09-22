/**
 * Date and time formatting utilities for Moitrii.
 * Provides human-readable, minimal editorial date and wake-time formatting.
 */

/**
 * Returns the ordinal suffix ('st', 'nd', 'rd', 'th') for a day number.
 */
export function getOrdinalSuffix(day: number): string {
  if (day >= 11 && day <= 13) {
    return "th";
  }
  switch (day % 10) {
    case 1:
      return "st";
    case 2:
      return "nd";
    case 3:
      return "rd";
    default:
      return "th";
  }
}

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const WEEKDAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/**
 * Formats an ISO string, timestamp number, or Date object into the human-readable
 * editorial format: "[Day][Ordinal] [Month], [Weekday], [YY]"
 * Example: "2026-09-22T11:10:08.404Z" -> "22nd Sep, Tue, 26"
 * 
 * If the input is already a non-ISO friendly relative string (e.g. "Today, 08:30 AM", "Just now"),
 * it is safely returned as-is to preserve demo/fallback state.
 */
export function formatDisplayDate(dateInput?: string | number | Date | null): string {
  if (!dateInput) return "";

  // If already a pre-formatted or relative string without ISO markers or digits
  if (typeof dateInput === "string") {
    const trimmed = dateInput.trim();
    if (!trimmed) return "";

    // Check if it looks like an ISO date or standard timestamp
    const hasIsoMarker = trimmed.includes("T") || /^\d{4}-\d{2}-\d{2}/.test(trimmed);
    if (!hasIsoMarker) {
      // Test if it parses as a valid full date string
      const parsedMs = Date.parse(trimmed);
      if (Number.isNaN(parsedMs)) {
        return trimmed; // Return relative mock strings like "Today, 08:30 AM", "Yesterday"
      }
      // If it parsed and has no time format or year, check if it was just a simple word
      if (!/\d{4}/.test(trimmed) && (trimmed.toLowerCase().includes("ago") || trimmed.toLowerCase().includes("today") || trimmed.toLowerCase().includes("yesterday"))) {
        return trimmed;
      }
    }
  }

  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (Number.isNaN(date.getTime())) {
    return typeof dateInput === "string" ? dateInput : "";
  }

  const day = date.getDate();
  const ordinal = getOrdinalSuffix(day);
  const month = MONTH_NAMES[date.getMonth()];
  const weekday = WEEKDAY_NAMES[date.getDay()];
  const year2Digit = String(date.getFullYear()).slice(-2);

  return `${day}${ordinal} ${month}, ${weekday}, ${year2Digit}`;
}

/**
 * Normalizes 24h wake time ("HH:mm", e.g. "23:00" or "07:15") into 12h representation ("11:00 PM" or "07:15 AM").
 * Falls back to "11:00 PM" if missing or invalid.
 */
export function formatWakeTime12h(wakeTimeOfDay?: string | null): string {
  if (!wakeTimeOfDay || typeof wakeTimeOfDay !== "string") {
    return "11:00 PM";
  }

  const match = /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/.exec(wakeTimeOfDay.trim());
  if (!match) {
    // If it's already a 12h string like "11:00 PM", return as-is
    if (/^\d{1,2}:\d{2}\s*(AM|PM)/i.test(wakeTimeOfDay.trim())) {
      return wakeTimeOfDay.trim();
    }
    return "11:00 PM";
  }

  const hour = parseInt(match[1], 10);
  const minute = parseInt(match[2], 10);
  const period = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  const hourStr = hour12 < 10 ? `0${hour12}` : `${hour12}`;
  const minStr = minute < 10 ? `0${minute}` : `${minute}`;

  return `${hourStr}:${minStr} ${period}`;
}
