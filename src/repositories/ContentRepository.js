import { VersionedRepository } from './VersionedRepository.js';

export class ContentRepository extends VersionedRepository {
  // null when the explainer is not in force (e.g. a rule that was retired)
  explainer(id) { return this.collection('explainers').find((e) => e.id === id) ?? null; }
  callout(id) { return this.collection('callouts').find((c) => c.id === id) ?? null; }
  breakdownGroup(id) { return this.section.breakdown.groups[id] ?? id; }
  breakdownItem(id) { return this.section.breakdown.items[id] ?? id; }
  label(id) {
    const text = this.section.labels?.[id];
    if (text === undefined) throw new Error(`content.json: "labels.${id}" not found`);
    return text;
  }

  method() { return this.section.method; }
  footer() { return this.section.footer; }
}
