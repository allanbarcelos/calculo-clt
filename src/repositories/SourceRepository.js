import { VersionedRepository } from './VersionedRepository.js';

export class SourceRepository extends VersionedRepository {
  get(id) {
    const source = this.collection('sources').find((s) => s.id === id);
    if (!source) throw new Error(`Source "${id}" not found in sources.json`);
    return source;
  }

  groups() {
    const available = new Set(this.collection('sources').map((s) => s.id));
    return this.section.groups
      .map((g) => ({ ...g, ids: g.ids.filter((id) => available.has(id)) }))
      .filter((g) => g.ids.length > 0);
  }
}
