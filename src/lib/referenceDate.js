const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
// Rules change at midnight in Brazil, not in UTC (which is 3 hours ahead).
const TIME_ZONE = 'America/Sao_Paulo';

// Today's date in Brazil as YYYY-MM-DD.
export function todayInBrazil(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
}

// A real calendar date (rejects 2026-13-45 and 2026-02-30).
export function isValidIsoDate(text) {
  const match = ISO_DATE.exec(text ?? '');
  if (!match) return false;
  const [, y, m, d] = match.map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}

// Rules in force today, or on the date given in ?data=YYYY-MM-DD (to preview future rules).
export function resolveReferenceDate(search = '', now = new Date()) {
  const requested = new URLSearchParams(search).get('data');
  return isValidIsoDate(requested) ? requested : todayInBrazil(now);
}
