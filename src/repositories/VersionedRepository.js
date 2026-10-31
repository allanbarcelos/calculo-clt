import { activeItems, pickVersion } from '../lib/versioning.js';

// Base class: every repository reads one section of the database and resolves
// versions for the same reference date.
export class VersionedRepository {
  constructor(section, referenceDate) {
    this.section = section;
    this.referenceDate = referenceDate;
  }

  version(key) {
    const versions = this.section[key];
    if (!versions) throw new Error(`Database table "${key}" not found`);
    const version = pickVersion(versions, this.referenceDate);
    if (!version) throw new Error(`No version of "${key}" in force on ${this.referenceDate}`);
    return version;
  }

  // Like version(), but returns null when nothing is in force (optional rules).
  optionalVersion(key) {
    const active = activeItems(this.section[key] ?? [], this.referenceDate, '__none__');
    return active.sort((a, b) => (a.validFrom ?? '').localeCompare(b.validFrom ?? '')).at(-1) ?? null;
  }

  collection(key, idKey = 'id') {
    return activeItems(this.section[key] ?? [], this.referenceDate, idKey);
  }
}
