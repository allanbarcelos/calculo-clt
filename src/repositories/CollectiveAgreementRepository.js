import { VersionedRepository } from './VersionedRepository.js';

export class CollectiveAgreementRepository extends VersionedRepository {
  // Agreements in force covering the state; "*" in ufs means nationwide.
  forState(uf) {
    return this.collection('agreements').filter((a) => a.ufs.includes('*') || a.ufs.includes(uf));
  }

  get(id) {
    if (!id) return null;
    return this.collection('agreements').find((a) => a.id === id) ?? null;
  }

  presetField(key) { return this.section.presetFields[key] ?? null; }
}
