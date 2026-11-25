import BenefitsStep from '../steps/benefits/BenefitsStep.jsx';
import CompanyStep from '../steps/company/CompanyStep.jsx';
import FloorStep from '../steps/floor/FloorStep.jsx';
import OtherCostsStep from '../steps/otherCosts/OtherCostsStep.jsx';
import PayStep from '../steps/pay/PayStep.jsx';
import ResultStep from '../steps/result/ResultStep.jsx';

// Add, remove or reorder steps here; titles and intros live in form-text.json (steps.<id>).
// hiddenFor(data, services) skips a step that does not apply (a day worker has no benefits or
// accruals). Hidden steps must come after the step where that choice is made.
const forDayWorker = (data, services) => services.contract.isDayWorker(data);

export const STEPS = [
  { id: 'company', Component: CompanyStep },
  { id: 'floor', Component: FloorStep },
  { id: 'pay', Component: PayStep, startsCalculation: true },
  { id: 'benefits', Component: BenefitsStep, hiddenFor: forDayWorker },
  { id: 'other', Component: OtherCostsStep, hiddenFor: forDayWorker },
  { id: 'result', Component: ResultStep, isResult: true },
];

export const visibleSteps = (data, services) => STEPS.filter((s) => !s.hiddenFor?.(data, services));
