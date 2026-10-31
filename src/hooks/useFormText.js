import { fillTemplate } from '../lib/template.js';
import { useServices } from './useServices.js';

const FIELD_PROPS = ['label', 'hint', 'prefix', 'suffix'];

// Reads form texts from form-text.json and fills their {{placeholders}}.
export function useFormText() {
  const texts = useServices().repositories.formText;
  return {
    // Props ready to spread on a field: { label, hint, prefix, suffix }
    field(id, vars) {
      const entry = texts.field(id);
      return Object.fromEntries(FIELD_PROPS.filter((k) => entry[k] !== undefined).map((k) => [k, fillTemplate(entry[k], vars)]));
    },
    // Any other plain text of a field entry (options, button labels, errors).
    text(id, key, vars) {
      const value = texts.field(id)[key];
      if (value === undefined) throw new Error(`form-text.json: "fields.${id}.${key}" not found`);
      return fillTemplate(value, vars);
    },
    // Unfilled text with markup, for <RichText text={...} vars={...} />.
    raw(id, key) {
      const value = texts.field(id)[key];
      if (value === undefined) throw new Error(`form-text.json: "fields.${id}.${key}" not found`);
      return value;
    },
    section: (id) => texts.sectionLegend(id),
    step: (id) => texts.step(id),
  };
}
