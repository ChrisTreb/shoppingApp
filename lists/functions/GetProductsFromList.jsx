/**
 * Parse products array safely from list representation
 * @param {string|Array} strProducts
 * @returns {Array} arrProducts
 */
export default function getProductsFromList(strProducts) {
  if (!strProducts) return [];
  if (Array.isArray(strProducts)) return strProducts;

  try {
    const trimmed = String(strProducts).trim();
    if (!trimmed || trimmed === "[]") return [];
    if (trimmed.startsWith("[")) {
      return JSON.parse(trimmed);
    }
    // Backward compatibility with legacy comma-separated objects
    return JSON.parse(`[${trimmed}]`);
  } catch (err) {
    console.warn("getProductsFromList parsing error:", err);
    return [];
  }
}
