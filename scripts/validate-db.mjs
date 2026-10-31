// Validates the JSON database before every build: dates, references and required tables.
// Usage: node scripts/validate-db.mjs
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const DB_DIR = join(import.meta.dirname, '..', 'src', 'db');
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const SOURCE_LINK = /\(source:([\w-]+)\)/g;

const db = Object.fromEntries(
  readdirSync(DB_DIR)
    .filter((f) => f.endsWith('.json'))
    .map((f) => [f, JSON.parse(readFileSync(join(DB_DIR, f), 'utf8'))]),
);

const errors = [];
const sourceIds = new Set(db['sources.json'].sources.map((s) => s.id));
const calloutIds = new Set(db['content.json'].callouts.map((c) => c.id));

function walk(node, path) {
  if (Array.isArray(node)) {
    node.forEach((child, i) => walk(child, `${path}[${i}]`));
    return;
  }
  if (node && typeof node === 'object') {
    for (const [key, value] of Object.entries(node)) {
      const here = `${path}.${key}`;
      if ((key === 'validFrom' || key === 'validTo') && !ISO_DATE.test(value)) errors.push(`${here}: "${value}" is not YYYY-MM-DD`);
      if (key === 'source' && typeof value === 'string' && !value.includes('{{') && !sourceIds.has(value)) errors.push(`${here}: unknown source "${value}"`);
      if (key === 'callout' && !calloutIds.has(value)) errors.push(`${here}: unknown callout "${value}"`);
      walk(value, here);
    }
    if (node.validFrom && node.validTo && node.validFrom > node.validTo) errors.push(`${path}: validFrom is after validTo`);
    if (path.endsWith('.sources') === false && Array.isArray(node.sources) && node.sources.every((s) => s.id && !s.url)) {
      for (const s of node.sources) if (!sourceIds.has(s.id)) errors.push(`${path}.sources: unknown source "${s.id}"`);
    }
    return;
  }
  if (typeof node === 'string') {
    for (const [, id] of node.matchAll(SOURCE_LINK)) if (!sourceIds.has(id)) errors.push(`${path}: unknown source link "${id}"`);
  }
}

for (const [file, content] of Object.entries(db)) walk(content, file);

for (const source of db['sources.json'].sources) {
  for (const key of ['title', 'short', 'org', 'url']) if (!source[key]) errors.push(`sources.json "${source.id}": missing "${key}"`);
}

for (const group of db['sources.json'].groups) {
  for (const id of group.ids) if (!sourceIds.has(id)) errors.push(`sources.json groups "${group.title}": unknown source "${id}"`);
}

const agreementsDb = db['collective-agreements.json'];
const presetKeys = new Set(Object.keys(agreementsDb.presetFields));
const workweekHours = new Set(db['federal-rates.json'].workweek.flatMap((w) => w.options.map((o) => o.hours)));
const agreementIds = new Set();
for (const a of agreementsDb.agreements) {
  const where = `collective-agreements.json "${a.id}"`;
  for (const key of ['id', 'validFrom', 'validTo', 'kind', 'name', 'territory', 'source']) if (!a[key]) errors.push(`${where}: missing "${key}"`);
  if (!['CCT', 'ACT'].includes(a.kind)) errors.push(`${where}: kind must be CCT or ACT`);
  if (!Array.isArray(a.ufs) || a.ufs.length === 0) errors.push(`${where}: "ufs" must list states or "*"`);
  if (agreementIds.has(`${a.id}@${a.validFrom}`)) errors.push(`${where}: duplicated id and validFrom`);
  agreementIds.add(`${a.id}@${a.validFrom}`);
  if (!a.roles?.length) errors.push(`${where}: needs at least one role`);
  const checkPresets = (presets, at) => {
    for (const [key, p] of Object.entries(presets ?? {})) {
      if (!presetKeys.has(key)) errors.push(`${at}: preset "${key}" is not in presetFields`);
      if (p.value === undefined && p.daily === undefined) errors.push(`${at}: preset "${key}" needs "value" or "daily"`);
      if (!p.clause) errors.push(`${at}: preset "${key}" needs "clause"`);
      if (key === 'weeklyHours' && !workweekHours.has(p.value)) errors.push(`${at}: weeklyHours ${p.value} is not a workweek option`);
    }
  };
  checkPresets(a.presets, where);
  for (const r of a.roles ?? []) {
    if (!r.id || !r.label || !(r.floor > 0) || !r.clause) errors.push(`${where} role "${r.id}": needs id, label, floor and clause`);
    checkPresets(r.presets, `${where} role "${r.id}"`);
  }
}

const REQUIRED = {
  'federal-rates.json': ['minimumWage', 'fgts', 'inssEmployee', 'familyAllowance', 'irrf', 'workweek', 'overtime', 'nightWork', 'transportVoucher', 'mealVoucher', 'educationAid', 'notice'],
  'tax-regimes.json': ['regimes', 'rat', 'thirdParties', 'simplesRules'],
  'occupational-hazards.json': ['insalubrity', 'hazardPay'],
  'wage-floors.json': ['states', 'stateFloors', 'federalFloors'],
};
for (const [file, keys] of Object.entries(REQUIRED)) {
  for (const key of keys) if (!Array.isArray(db[file]?.[key]) || db[file][key].length === 0) errors.push(`${file}: table "${key}" is missing or empty`);
}

if (errors.length) {
  console.error(`Database validation failed (${errors.length}):\n- ${errors.join('\n- ')}`);
  process.exit(1);
}
console.log(`Database OK: ${Object.keys(db).length} files, ${sourceIds.size} sources.`);
