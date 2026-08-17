/**
 * Safe date parsing and formatting utility to prevent "Invalid Date" errors
 * across Firestore Timestamps, MySQL dates, ISO strings, numeric timestamps, and order references.
 */

export function parseSafeDate(val: any, fallbackId?: string): Date {
  if (!val && !fallbackId) return new Date();

  // If val is an Order object:
  if (val && typeof val === "object" && !("seconds" in val) && !("toDate" in val) && !(val instanceof Date)) {
    const rawVal =
      val.timestamp ??
      val.createdAt ??
      val.created_at ??
      val.date ??
      val.orderDate ??
      val.updatedAt ??
      val.updated_at;
    return parseSafeDate(rawVal, val.id || fallbackId);
  }

  // If Date instance
  if (val instanceof Date && !isNaN(val.getTime())) {
    return val;
  }

  // If Firestore Timestamp object
  if (val && typeof val === "object") {
    if (typeof val.toDate === "function") {
      try {
        const d = val.toDate();
        if (!isNaN(d.getTime())) return d;
      } catch {}
    }
    if (typeof val.seconds === "number") {
      return new Date(val.seconds * 1000);
    }
    if (typeof val._seconds === "number") {
      return new Date(val._seconds * 1000);
    }
  }

  // If number (timestamp)
  if (typeof val === "number" && !isNaN(val) && val > 0) {
    // If seconds (< 100 billion), convert to ms
    const ms = val < 100000000000 ? val * 1000 : val;
    const d = new Date(ms);
    if (!isNaN(d.getTime())) return d;
  }

  // If string
  if (typeof val === "string" && val.trim()) {
    const trimmed = val.trim();
    // Numeric string
    if (/^\d+$/.test(trimmed)) {
      const num = parseInt(trimmed, 10);
      const ms = num < 100000000000 ? num * 1000 : num;
      const d = new Date(ms);
      if (!isNaN(d.getTime())) return d;
    }

    // ISO or formatted date string (replace space with T if standard SQL DATETIME string)
    const sqlNormalized = trimmed.includes(" ") && !trimmed.includes("T") ? trimmed.replace(" ", "T") : trimmed;
    const parsed = new Date(sqlNormalized);
    if (!isNaN(parsed.getTime())) return parsed;

    // Direct parse
    const directParsed = new Date(trimmed);
    if (!isNaN(directParsed.getTime())) return directParsed;
  }

  // Fallback to order ID if it has 10-13 digits timestamp
  if (fallbackId && typeof fallbackId === "string") {
    const match = fallbackId.match(/(\d{10,13})/);
    if (match) {
      const num = parseInt(match[1], 10);
      const ms = num < 100000000000 ? num * 1000 : num;
      const d = new Date(ms);
      if (!isNaN(d.getTime())) return d;
    }
  }

  return new Date();
}

export function formatOrderDate(
  val: any,
  options?: Intl.DateTimeFormatOptions,
  fallbackId?: string
): string {
  const d = parseSafeDate(val, fallbackId);
  try {
    return d.toLocaleString("en-NG", options || {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  } catch {
    return d.toLocaleString();
  }
}

export function getSafeTimestamp(val: any, fallbackId?: string): number {
  return parseSafeDate(val, fallbackId).getTime();
}
