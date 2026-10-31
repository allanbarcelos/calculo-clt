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

- **Single responsibility:** `CompensationService` (gross pay), `EmployerChargesService` (INSS, RAT, third parties), `ProvisionService` (13th salary, vacation, FGTS fine, notice), `BenefitService`, `EmployeeDeductionService` (INSS, IRRF, family allowance), `WageFloorService`, `FatorRService`, `RegimeComparisonService`, and `CostCalculator`, which only orchestrates them.
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

Add an item to `agreements` with `id`, `validFrom`/`validTo`, `kind` (`CCT` or `ACT`), `ufs` (states, or `["*"]` for nationwide), `name`, `territory`, `registration`, `source` (an id in `sources.json`), `roles` (`id`, `label`, `floor`, `clause`) and optional `presets`, `notes`. Presets may sit on the agreement or on a role (the role wins). Allowed preset keys are listed in `presetFields`; each needs a `clause` and a `value` (or `daily` for meal vouchers, converted to monthly with `days` or 22 days). `npm run db:validate` checks all of this.
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

After editing, run `npm run build`: it validates the database, runs the tests and generates the new version of the site in `dist/`.
