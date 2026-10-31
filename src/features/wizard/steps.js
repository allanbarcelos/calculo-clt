import BenefitsStep from '../steps/benefits/BenefitsStep.jsx';
import CompanyStep from '../steps/company/CompanyStep.jsx';
import FloorStep from '../steps/floor/FloorStep.jsx';
import OtherCostsStep from '../steps/otherCosts/OtherCostsStep.jsx';
import PayStep from '../steps/pay/PayStep.jsx';
import ResultStep from '../steps/result/ResultStep.jsx';

// Add, remove or reorder steps here; titles and intros live in form-text.json (steps.<id>).
export const STEPS = [
  { id: 'company', Component: CompanyStep },
  { id: 'floor', Component: FloorStep },
  { id: 'pay', Component: PayStep, startsCalculation: true },
  { id: 'benefits', Component: BenefitsStep },
  { id: 'other', Component: OtherCostsStep },
  { id: 'result', Component: ResultStep, isResult: true },
];
