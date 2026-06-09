/**
 * Normalize FastAPI / axios error payloads for safe display in UI (toast, alerts).
 * FastAPI 422 validation errors return `detail` as an array of objects — rendering
 * that directly in React causes minified error #31.
 */
export function formatApiError(detail, fallback = "Something went wrong") {
  if (detail == null || detail === "") return fallback;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((entry) => {
        if (typeof entry === "string") return entry;
        if (entry && typeof entry === "object") {
          const field = Array.isArray(entry.loc) ? entry.loc.slice(1).join(".") : "";
          const msg = entry.msg || entry.message || "";
          return field ? `${field}: ${msg}` : msg;
        }
        return String(entry);
      })
      .filter(Boolean)
      .join("; ") || fallback;
  }
  if (typeof detail === "object") {
    return detail.msg || detail.message || fallback;
  }
  return String(detail);
}

export function sanitizeOtp(value) {
  return String(value || "").replace(/\D/g, "").slice(0, 6);
}

export function hasNutritionData(nutrition) {
  if (!nutrition || typeof nutrition !== "object") return false;
  const { calories = 0, protein = 0, carbs = 0, fats = 0 } = nutrition;
  return calories > 0 || protein > 0 || carbs > 0 || fats > 0;
}
