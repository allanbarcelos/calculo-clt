// Dots grouping thousands, as in "2.500" or "1.000.000", with no decimal comma.
const THOUSANDS_ONLY = /^-?[1-9]\d{0,2}(\.\d{3})+$/;

// Accepts "1.874,36" and "2.500" (pt-BR) and "1874.36".
export function parseInput(text) {
  const cleaned = String(text).replace(/[^\d,.-]/g, '');
  let normalized = cleaned;
  if (cleaned.includes(',')) normalized = cleaned.replace(/\./g, '').replace(',', '.');
  else if (THOUSANDS_ONLY.test(cleaned)) normalized = cleaned.replace(/\./g, '');
  const n = parseFloat(normalized);
  return Number.isFinite(n) ? n : 0;
}
