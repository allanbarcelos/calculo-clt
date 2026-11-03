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
  if (!agreementsDb.sourceKinds.includes(a.sourceKind)) errors.push(`${where}: "sourceKind" must be one of ${agreementsDb.sourceKinds.join(', ')}`);
  if (a.calculatedFloors !== undefined && typeof a.calculatedFloors !== 'boolean') errors.push(`${where}: "calculatedFloors" must be true or false`);
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

const fpasCodes = new Set(db['tax-regimes.json'].fpas.flatMap((f) => f.codes.map((c) => c.code)));
for (const f of db['tax-regimes.json'].fpas) {
  if (!fpasCodes.has(f.default)) errors.push(`tax-regimes.json fpas: default "${f.default}" is not a listed code`);
  for (const c of f.codes) {
    const sum = Object.values(c.breakdown).reduce((acc, v) => acc + v, 0);
    if (Math.abs(sum - c.total) > 1e-9) errors.push(`tax-regimes.json fpas ${c.code}: breakdown adds up to ${sum}, not ${c.total}`);
    for (const k of Object.keys(c.breakdown)) if (!f.entities[k]) errors.push(`tax-regimes.json fpas ${c.code}: entity "${k}" has no name`);
  }
}

// Every dated rule must cite its source (directly or on each of its entries).
for (const file of ['federal-rates.json', 'tax-regimes.json', 'wage-floors.json', 'occupational-hazards.json', 'health-plans.json']) {
  for (const [table, items] of Object.entries(db[file])) {
    if (!Array.isArray(items)) continue;
    items.forEach((item, i) => {
      if (!item || typeof item !== 'object' || !item.validFrom || item.source) return;
      const children = Object.values(item).filter(Array.isArray).flat();
      if (!children.length || !children.every((c) => c?.source)) errors.push(`${file} ${table}[${i}]: missing "source"`);
    });
  }
}

// Health plan references: [p25, median, p75, plans, beneficiaries] for every known age band.
const health = db['health-plans.json'];
const bandIds = new Set(health.ageBands.map((b) => b.id));
for (const ref of health.references) {
  if (!ref.weightsSource || !sourceIds.has(ref.weightsSource)) errors.push(`health-plans.json ${ref.reference}: unknown weightsSource "${ref.weightsSource}"`);
  if (!ref.values.BR) errors.push(`health-plans.json ${ref.reference}: missing Brazil ("BR") values`);
  for (const [scope, kinds] of Object.entries(ref.values)) {
    for (const [kind, bands] of Object.entries(kinds)) {
      for (const [band, v] of Object.entries(bands)) {
        const at = `health-plans.json ${ref.reference} ${scope}.${kind}.${band}`;
        if (!bandIds.has(band)) errors.push(`${at}: unknown age band`);
        if (!Array.isArray(v) || v.length !== 5 || !(v[0] > 0 && v[0] <= v[1] && v[1] <= v[2] && v[3] > 0 && v[4] > 0)) errors.push(`${at}: expected [p25 <= median <= p75, plans, beneficiaries]`);
      }
    }
  }
}

// Field texts (hints, notes, option descriptions) must link every legal citation to its source:
// "[CLT, art. 458](source:clt)". Labels of <select> options cannot hold links and are skipped.
const CITATION = /\b(art\.|arts\.|Lei n?º? ?\d|Lei Complementar|LC \d|Decreto|NR-\d|Súmula|ADPF|ADI \d|Portaria|Instrução Normativa|IN RFB)/;
const LINK = /\[[^\]]+\]\(source:[\w-]+\)/g;
function checkCitations(node, path) {
  if (Array.isArray(node)) return node.forEach((n, i) => checkCitations(n, `${path}[${i}]`));
  if (node && typeof node === 'object') {
    return Object.entries(node).forEach(([k, v]) => {
      if (['label', 'law', 'effective', 'title', 'short', 'name', 'source'].includes(k) || /^option/.test(k)) return;
      checkCitations(v, `${path}.${k}`);
    });
  }
  if (typeof node === 'string' && CITATION.test(node.replace(LINK, ''))) errors.push(`${path}: legal citation without a source link: "${node.slice(0, 90)}"`);
}
checkCitations(db['form-text.json'].fields, 'form-text.json fields');
checkCitations(db['occupational-hazards.json'], 'occupational-hazards.json');
checkCitations(db['wage-floors.json'].federalFloors, 'wage-floors.json federalFloors');
checkCitations(db['tax-regimes.json'].regimes, 'tax-regimes.json regimes');

const REQUIRED = {
  'federal-rates.json': ['minimumWage', 'fgts', 'inssEmployee', 'familyAllowance', 'irrf', 'workweek', 'overtime', 'nightWork', 'transportVoucher', 'mealVoucher', 'educationAid', 'notice', 'nationalHolidays', 'leaveStatistics', 'maternityLeave', 'paternityLeave', 'sicknessLeave'],
  'tax-regimes.json': ['regimes', 'rat', 'thirdParties', 'simplesRules', 'fpas'],
  'occupational-hazards.json': ['insalubrity', 'hazardPay'],
  'wage-floors.json': ['states', 'stateFloors', 'federalFloors'],
  'health-plans.json': ['ageBands', 'references'],
};
for (const [file, keys] of Object.entries(REQUIRED)) {
  for (const key of keys) if (!Array.isArray(db[file]?.[key]) || db[file][key].length === 0) errors.push(`${file}: table "${key}" is missing or empty`);
}

if (errors.length) {
  console.error(`Database validation failed (${errors.length}):\n- ${errors.join('\n- ')}`);
  process.exit(1);
}
console.log(`Database OK: ${Object.keys(db).length} files, ${sourceIds.size} sources.`);
