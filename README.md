# Cálculo CLT — CLT employee cost calculator

Single-page React (Vite) app that walks a Brazilian business owner through the real monthly and yearly cost of a CLT employee. The UI is in Brazilian Portuguese because that is the target audience.

## Run

```
npm install
npm run dev          # http://localhost:5173
npm test             # calculation and render tests
npm run db:validate  # checks the JSON database
npm run build        # validates the database, runs the tests, then builds dist/
```

Behind a corporate proxy, set `NODE_OPTIONS=--use-system-ca` before `npm install`.

Preview the rules in force on another date with `?data=YYYY-MM-DD` (e.g. `http://localhost:5173/?data=2027-01-01`).

## Architecture

```
src/
  db/             JSON database: every rate, table, wage floor, source and explanatory text
  repositories/   read the database and resolve the version in force on the reference date
  services/       business rules (one responsibility each) + container.js (composition root)
  context/        React context that injects the services into the UI
  hooks/          useServices, usePersistentState, useBreakdownLabels
  components/ui/  generic, data-driven UI (fields, Explainer, ContentCallout, DataTable, RichText)
  components/layout/  header, hero, method, sources, footer
  features/wizard/    stepper, navigation, live summary, step list (steps.js)
  features/steps/     one folder per step, split into small sections
scripts/validate-db.mjs   database validation run before every build
```

- **Single responsibility:** `CompensationService` (gross pay, legal monthly limits), `CalendarService` (working days, national holidays, DSR factor), `EmployerChargesService` (INSS, RAT, third parties), `ProvisionService` (13th salary, vacation, FGTS fine, notice), `BenefitService`, `EmployeeDeductionService` (INSS, IRRF, family allowance), `LeaveReserveService` (maternity, paternity and sickness leave), `ContractService` (standard or apprentice contract: FGTS rate, fine, notice, floor), `TaxAdvantageService` (Lucro Real: IRPJ/CSLL deduction, PAT, PIS/COFINS credits), `WageFloorService`, `CollectiveAgreementService`, `FatorRService`, `RegimeComparisonService`, and `CostCalculator`, which only orchestrates them.
- **Open/closed:** new regimes, wage floors, rates or explanatory texts are added to the database, not to the code.
- **Liskov:** every repository extends `VersionedRepository` and resolves versions the same way.
- **Interface segregation:** components receive only the data they use; sections read only their own repository.
- **Dependency inversion:** services receive repositories in their constructor, and the UI receives services through `ServicesProvider`. `repositories/database.js` is the only module that knows the data comes from JSON files.

## The database (`src/db`)

| File | Content |
|---|---|
| `federal-rates.json` | minimum wage, FGTS, INSS and IRRF tables, family allowance, workweek, overtime, night work, vouchers, education aid, notice |
| `tax-regimes.json` | tax regimes and their payroll charges, RAT/FAP, third parties, payroll relief schedule, Simples rules |
| `wage-floors.json` | states, state wage floor laws and bands, floors set by federal law |
| `occupational-hazards.json` | insalubrity grades and hazard pay |
| `sources.json` | official sources and how they are grouped on the page |
| `content.json` | explanatory blocks, callouts, breakdown labels, method cards, footer |
| `form-text.json` | step titles, section legends, field labels, hints, options and notes |
| `collective-agreements.json` | collective agreements (CCT/ACT): floors per role and the values they pre-fill (`presets`) |

### Adding a collective agreement

Add an item to `agreements` with `id`, `validFrom`/`validTo`, `kind` (`CCT` or `ACT`), `ufs` (states, or `["*"]` for nationwide), `name`, `territory`, `registration`, `source` (an id in `sources.json`), `roles` (`id`, `label`, `floor`, `clause`) and optional `presets`, `notes`.

Every agreement states where its values came from in `sourceKind`: `registry` (the text registered with the Ministry of Labour, or the parties' copy with its registration number), `parties` (signed by the unions, registration not found), `copy` (a third-party reproduction of the registered text) or `summary` (news or a summary, not the text). Set `calculatedFloors: true` when floors were derived from announced raises. Anything other than `registry`, an expired agreement or calculated floors is flagged as soon as the agreement is chosen and again on the result, always with where to get the official text (Sistema Mediador, by registration number or by state/municipality/category, and the signing unions). The site is a reference, not the official source.

Agreements of the same series replace each other: the series is the `id` without the trailing year (`sp-asseio-2025` → `sp-asseio`), or an explicit `series`. When the latest one expires and the next is not in the database yet, it stays listed for `expiredGraceDays`, flagged as expired. Presets may sit on the agreement or on a role (the role wins). Allowed preset keys are listed in `presetFields`; each needs a `clause` and a `value` (or `daily` for meal vouchers, converted to monthly with `days` or 22 days). `npm run db:validate` checks all of this.
| `health-plans.json` | ANS reference monthly price of employer health plans per state, age band and accommodation (generated, see below) |
| `meta.json` | site name and last review date |

### Versioning

Any item can carry `validFrom` / `validTo` (YYYY-MM-DD, inclusive). The site uses what is in force on the reference date (today, or `?data=`):

- **Single-value tables** (e.g. `minimumWage`): the active version with the latest `validFrom`. If nothing is active, the most recent past version is used so the site never breaks.
- **Collections** (regimes, state floors, explainers, sources): every active item; when several share the same `id` (or `uf`), the latest wins.
- **Optional rules** (e.g. `payrollRelief`): disappear from the UI when no version is in force.

### Common updates

- **New minimum wage:** add `{ "validFrom": "2027-01-01", "value": ..., "source": "..." }` to `minimumWage`. Federal floors defined as multiples of the minimum wage follow automatically.
- **New INSS / IRRF table:** add a new version with its `validFrom`.
- **New state floor law:** add an item to `stateFloors` with the same `uf` and a later `validFrom`; set `validTo` on the old one if it expires.
- **New rule or explanation:** add an explainer or callout to `content.json`. Text supports `**bold**`, `[label](source:id)` and `{{variable}}` / `{{variable|money|percent|number}}`.
- **New source:** add it to `sources.json` and to a group. `npm run db:validate` fails if any reference points to a missing source.

### Automatic filling

- **FPAS:** picking the code fills the third-party rate and shows its composition (`tax-regimes.json` → `fpas`).
- **DSR:** computed from the calendar of the reference year (Sundays + national holidays in `nationalHolidays`).
- **Warnings:** overtime, night and rest-day hours above the legal monthly limits; insalubrity and hazard pay never add up (the larger is kept).

### Apprentice contract and tax advantages

- **Apprentice** (`federal-rates.json` → `apprentice`): FGTS at 2%, no FGTS fine or notice when the contract ends on its term, floor = hourly minimum wage × contracted hours, warnings for overtime and long workweeks.
- **Lucro Real** (`tax-regimes.json` → `corporateIncomeTax`, `pisCofinsNonCumulative`, `patIncentive`): the result shows, apart from the monthly cost, the IRPJ/CSLL saving on the employee's cost, the PAT incentive, PIS/COFINS credits for cleaning/maintenance companies and the Empresa Cidadã deduction, ending in the net cost. Other regimes get a short explanation of why there is no such saving.

### Health plan reference prices

The benefits step shows, once the employee's age band is chosen, the typical monthly price of an employer health plan (outpatient + hospital) in the state: the beneficiary-weighted median and quartiles of the commercial value (VCM) operators register with ANS. It only suggests a value; the user decides whether to use it. Operators may sell up to 30% above or below the VCM.

To update (ANS publishes June and December):

1. From https://dadosabertos.ans.gov.br/FTP/PDA/ download into one folder: `caracteristicas_produtos_saude_suplementar-008/pda-008-caracteristicas_produtos_saude_suplementar.csv`, `valor_comercial_medio_por_municipio_NTRP-054/pda-054-geografia.csv`, `valor_comercial_medio_por_municipio_NTRP-054/<AAAAMM>.zip` and every `informacoes_consolidadas_de_beneficiarios-024/<AAAAMM>/pda-024-icb-*.zip`; unzip them all there.
2. Run `node scripts/update-health-plan-prices.mjs <folder> <AAAAMM>` (about 4 minutes; the VCM file has ~90 million rows).

After editing, run `npm run build`: it validates the database, runs the tests and generates the new version of the site in `dist/`.
