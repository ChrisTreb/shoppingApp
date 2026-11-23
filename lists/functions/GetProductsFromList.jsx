/**
 * Parse products array safely from list representation and sort by category then name
 * @param {string|Array} strProducts
 * @returns {Array} arrProducts
 */
export default function getProductsFromList(strProducts) {
  if (!strProducts) return [];
  let arr = [];

  if (Array.isArray(strProducts)) {
    arr = [...strProducts];
  } else {
    try {
      const trimmed = String(strProducts).trim();
      if (!trimmed || trimmed === "[]") return [];
      if (trimmed.startsWith("[")) {
        arr = JSON.parse(trimmed);
      } else {
        // Backward compatibility with legacy comma-separated objects
        arr = JSON.parse(`[${trimmed}]`);
      }
    } catch (err) {
      console.warn("getProductsFromList parsing error:", err);
      return [];
    }
  }

  // Tri systématique par catégorie (type) puis par nom (alphabétique insensible à la casse et accents)
  return arr.sort((a, b) => {
    const typeCompare = (a.type || "").localeCompare(b.type || "", "fr", { sensitivity: "base" });
    if (typeCompare !== 0) return typeCompare;
    return (a.name || "").localeCompare(b.name || "", "fr", { sensitivity: "base" });
  });
}
