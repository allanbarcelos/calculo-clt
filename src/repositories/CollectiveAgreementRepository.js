import { isActive } from '../lib/versioning.js';
import { VersionedRepository } from './VersionedRepository.js';

const DAY_MS = 86_400_000;

// Agreements of the same series (e.g. "sp-asseio-2025" and "sp-asseio-2026") replace each
// other. When the latest one has expired and the next is not registered yet, it stays
// available for expiredGraceDays, flagged as expired, so the user still sees the last floors.
export function seriesOf(agreement) {
  return agreement.series ?? agreement.id.replace(/-\d{4}(-\d{4})?$/, '');
}

export class CollectiveAgreementRepository extends VersionedRepository {
  available() {
    if (this.cache) return this.cache;
    const graceDays = this.section.expiredGraceDays ?? 0;
    const graceStart = new Date(Date.parse(this.referenceDate) - graceDays * DAY_MS).toISOString().slice(0, 10);
    const latest = new Map();
    for (const a of this.section.agreements) {
      if (a.validFrom > this.referenceDate) continue;
      const active = isActive(a, this.referenceDate);
      if (!active && a.validTo < graceStart) continue;
      const key = seriesOf(a);
      const current = latest.get(key);
      if (!current || a.validFrom > current.validFrom) latest.set(key, { ...a, expired: !active });
    }
    this.cache = [...latest.values()];
    return this.cache;
  }

  // Agreements covering the state; "*" in ufs means nationwide.
  forState(uf) {
    return this.available().filter((a) => a.ufs.includes('*') || a.ufs.includes(uf));
  }

  get(id) {
    if (!id) return null;
    return this.available().find((a) => a.id === id) ?? null;
  }

  // The agreement as registered, even if a newer one of its series replaced it (to undo the
  // values it filled in).
  record(id) {
    if (!id) return null;
    return this.section.agreements.find((a) => a.id === id) ?? null;
  }

  // The agreement now offered in the same series as id (itself, or the one that replaced it).
  current(id) {
    const record = this.record(id);
    if (!record) return null;
    const series = seriesOf(record);
    return this.available().find((a) => seriesOf(a) === series) ?? null;
  }

  presetField(key) { return this.section.presetFields[key] ?? null; }
}
