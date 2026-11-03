// Builds src/db/health-plans.json from ANS open data: the commercial monthly value (VCM) that
// operators register for each employer health plan, weighted by each plan's active
// beneficiaries in the state. Run twice a year, when ANS publishes a new semester.
//
// Download into one folder (https://dadosabertos.ans.gov.br/FTP/PDA/):
//   caracteristicas_produtos_saude_suplementar-008/pda-008-caracteristicas_produtos_saude_suplementar.csv
//   valor_comercial_medio_por_municipio_NTRP-054/pda-054-geografia.csv
//   valor_comercial_medio_por_municipio_NTRP-054/<AAAAMM>.zip  (unzipped: <AAAAMM>.csv)
//   informacoes_consolidadas_de_beneficiarios-024/<AAAAMM>/pda-024-icb-*.csv  (unzipped, all states)
// Usage: node scripts/update-health-plan-prices.mjs <folder> <AAAAMM>
import { createReadStream, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createInterface } from 'node:readline';

const [folder, period] = process.argv.slice(2);
if (!folder || !/^\d{6}$/.test(period ?? '')) {
  console.error('Usage: node scripts/update-health-plan-prices.mjs <folder> <AAAAMM>');
  process.exit(1);
}

const COMPLETE = new Set(['Ambulatorial + Hospitalar com obstetrícia', 'Ambulatorial + Hospitalar sem obstetrícia']);
const ACCOMMODATION = { Coletiva: 'ward', Individual: 'private' };
const MIN_PLANS = 5;

async function* rows(path) {
  const lines = createInterface({ input: createReadStream(path, { encoding: 'utf8' }), crlfDelay: Infinity });
  let header = null;
  for await (const line of lines) {
    const cells = line.split(';').map((c) => c.replace(/^"|"$/g, ''));
    if (!header) header = cells;
    else yield Object.fromEntries(header.map((h, i) => [h, cells[i]]));
  }
}

// 1. Active employer plans with full coverage (outpatient + hospital), by accommodation.
const category = new Map();
const idByCode = new Map();
for await (const p of rows(join(folder, 'pda-008-caracteristicas_produtos_saude_suplementar.csv'))) {
  if (p.SITUACAO_PLANO !== 'Ativo' || p.CONTRATACAO !== 'Coletivo empresarial') continue;
  const cat = COMPLETE.has(p.SGMT_ASSISTENCIAL) && ACCOMMODATION[p.ACOMODACAO_HOSPITALAR];
  if (!cat) continue;
  category.set(p.ID_PLANO, cat);
  idByCode.set(p.CD_PLANO, p.ID_PLANO);
}

// 2. Active employer-contract beneficiaries per plan and state.
const weight = new Map();
const beneficiaryFiles = readdirSync(folder).filter((f) => /^pda-024-icb-.*\.csv$/.test(f));
for (const file of beneficiaryFiles) {
  for await (const b of rows(join(folder, file))) {
    if (b.DE_CONTRATACAO_PLANO !== 'Coletivo Empresarial') continue;
    const plan = idByCode.get(b.CD_PLANO);
    const n = Number(b.QT_BENEFICIARIO_ATIVO);
    if (plan && n > 0) weight.set(`${plan}|${b.SG_UF}`, (weight.get(`${plan}|${b.SG_UF}`) ?? 0) + n);
  }
}

// 3. Mean VCM of each plan in each state, per age band.
const ufOf = new Map();
for await (const g of rows(join(folder, 'pda-054-geografia.csv'))) ufOf.set(g.CD_MUNICIPIO, g.SG_UF);
const sums = new Map();
const vcmLines = createInterface({ input: createReadStream(join(folder, `${period}.csv`), { encoding: 'utf8' }), crlfDelay: Infinity });
let first = true;
for await (const line of vcmLines) {
  if (first) { first = false; continue; }
  const [municipality, plan, band, vcm] = line.split(';');
  if (!category.has(plan)) continue;
  const uf = ufOf.get(municipality);
  if (!uf || !weight.has(`${plan}|${uf}`)) continue;
  const value = Number(vcm.replace(',', '.'));
  if (!(value > 0)) continue;
  const key = `${plan}|${uf}|${band}`;
  const s = sums.get(key) ?? [0, 0];
  s[0] += value; s[1] += 1;
  sums.set(key, s);
}

// 4. Beneficiary-weighted quartiles per state (and Brazil), accommodation and age band.
const samples = new Map();
for (const [key, [sum, count]] of sums) {
  const [plan, uf, band] = key.split('|');
  const w = weight.get(`${plan}|${uf}`);
  for (const scope of [uf, 'BR']) {
    const k = `${scope}|${category.get(plan)}|${band}`;
    if (!samples.has(k)) samples.set(k, []);
    samples.get(k).push([sum / count, w]);
  }
}
const round = (n) => Math.round(n * 100) / 100;
function quartiles(pairs) {
  pairs.sort((a, b) => a[0] - b[0]);
  const total = pairs.reduce((acc, [, w]) => acc + w, 0);
  return [0.25, 0.5, 0.75].map((q) => {
    let run = 0;
    for (const [v, w] of pairs) { run += w; if (run >= q * total) return round(v); }
    return round(pairs.at(-1)[0]);
  }).concat([pairs.length, total]);
}
const values = {};
for (const [k, pairs] of samples) {
  if (pairs.length < MIN_PLANS) continue;
  const [scope, cat, band] = k.split('|');
  ((values[scope] ??= {})[cat] ??= {})[band] = quartiles(pairs);
}

// 5. Keep everything else in the database file, replace this period's reference.
const target = new URL('../src/db/health-plans.json', import.meta.url);
const db = JSON.parse(readFileSync(target, 'utf8'));
const reference = `${period.slice(0, 4)}-${period.slice(4)}`;
const entry = { validFrom: `${reference}-01`, reference, source: 'ansVcm', weightsSource: 'ansBeneficiaries', values };
db.references = [...db.references.filter((r) => r.reference !== reference), entry].sort((a, b) => a.validFrom.localeCompare(b.validFrom));
const compact = (v) => JSON.stringify(v);
const scopes = Object.keys(values).sort((a, b) => (a === 'BR' ? -1 : b === 'BR' ? 1 : a.localeCompare(b)));
const body = db.references.map((r) => {
  const lines = Object.keys(r.values).sort((a, b) => (a === 'BR' ? -1 : b === 'BR' ? 1 : a.localeCompare(b)))
    .map((s) => `        ${JSON.stringify(s)}: ${compact(r.values[s])}`).join(',\n');
  const head = Object.entries(r).filter(([k]) => k !== 'values').map(([k, v]) => `"${k}": ${JSON.stringify(v)}`).join(', ');
  return `    {\n      ${head},\n      "values": {\n${lines}\n      }\n    }`;
}).join(',\n');
const rest = Object.entries(db).filter(([k]) => k !== 'references')
  .map(([k, v]) => `  ${JSON.stringify(k)}: ${JSON.stringify(v, null, 2).replace(/\n/g, '\n  ')}`).join(',\n');
writeFileSync(target, `{\n${rest},\n  "references": [\n${body}\n  ]\n}\n`);
console.log(`health-plans.json: ${reference}, ${scopes.length} scopes, ${weight.size} plan/state weights`);
