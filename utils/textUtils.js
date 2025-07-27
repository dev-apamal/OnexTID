// utils/textUtils.js

/**
 * Capitalizes the first letter of each word in a string
 * @param {string} text - The text to format
 * @returns {string} - Formatted text with title case
 */
export function toTitleCase(text) {
  if (!text) return "";

  return text
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Alternative: Handles multiple spaces and special characters better
 * @param {string} text - The text to format
 * @returns {string} - Formatted text
 */
export function toTitleCaseAdvanced(text) {
  if (!text) return "";

  return text.toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}

// Usage examples:
// toTitleCase("full time") → "Full Time"
// toTitleCase("part-time remote") → "Part-time Remote"
// toTitleCase("CONTRACT WORK") → "Contract Work"
