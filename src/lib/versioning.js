// Every database item may carry validFrom / validTo (YYYY-MM-DD, inclusive).
// These helpers select what is in force on a reference date.

export function toIsoDate(date) {
  return date.toISOString().slice(0, 10);
}

export function isActive(item, isoDate) {
  if (item.validFrom && item.validFrom > isoDate) return false;
  if (item.validTo && item.validTo < isoDate) return false;
  return true;
}

// Single-value tables (e.g. minimum wage): the active version with the latest validFrom.
// Falls back to the most recent past version so the site never breaks between updates.
export function pickVersion(versions, isoDate) {
  const byStart = [...versions].sort((a, b) => (a.validFrom ?? '').localeCompare(b.validFrom ?? ''));
  const active = byStart.filter((v) => isActive(v, isoDate));
  if (active.length) return active[active.length - 1];
  const past = byStart.filter((v) => (v.validFrom ?? '') <= isoDate);
  return past[past.length - 1] ?? null;
}

// Collections (e.g. regimes, wage floors): every active item; when several versions
// share the same key, keep only the latest one.
export function activeItems(items, isoDate, key = 'id') {
  const latest = new Map();
  for (const item of items) {
    if (!isActive(item, isoDate)) continue;
    const id = item[key] ?? Symbol('anonymous');
    const current = latest.get(id);
    if (!current || (item.validFrom ?? '') > (current.validFrom ?? '')) latest.set(id, item);
  }
  return [...latest.values()];
}
