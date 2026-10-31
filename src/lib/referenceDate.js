import { toIsoDate } from './versioning.js';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

// Rules in force today, or on the date given in ?data=YYYY-MM-DD (to preview future rules).
export function resolveReferenceDate(search = '', now = new Date()) {
  const requested = new URLSearchParams(search).get('data');
  return requested && ISO_DATE.test(requested) ? requested : toIsoDate(now);
}
