import { pickVersion } from '../lib/versioning.js';
import { VersionedRepository } from './VersionedRepository.js';

// Labels, hints and notes of the form. An entry may be a plain object or a list of
// dated versions, like any other table.
export class FormTextRepository extends VersionedRepository {
  entry(group, id) {
    const value = this.section[group]?.[id];
    if (value === undefined) throw new Error(`form-text.json: "${group}.${id}" not found`);
    return Array.isArray(value) ? pickVersion(value, this.referenceDate) : value;
  }

  step(id) { return this.entry('steps', id); }
  sectionLegend(id) { return this.entry('sections', id); }
  field(id) { return this.entry('fields', id); }
}
