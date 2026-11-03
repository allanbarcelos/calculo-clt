// Composition root: wires repositories and services for one reference date.
import { CollectiveAgreementRepository } from '../repositories/CollectiveAgreementRepository.js';
import { ContentRepository } from '../repositories/ContentRepository.js';
import { FormTextRepository } from '../repositories/FormTextRepository.js';
import { HealthPlanRepository } from '../repositories/HealthPlanRepository.js';
import { HazardRepository } from '../repositories/HazardRepository.js';
import { RatesRepository } from '../repositories/RatesRepository.js';
import { RegimeRepository } from '../repositories/RegimeRepository.js';
import { SourceRepository } from '../repositories/SourceRepository.js';
import { WageFloorRepository } from '../repositories/WageFloorRepository.js';
import { BenefitService } from './BenefitService.js';
import { CalendarService } from './CalendarService.js';
import { CollectiveAgreementService } from './CollectiveAgreementService.js';
import { CompensationService } from './CompensationService.js';
import { ContractService } from './ContractService.js';
import { CostCalculator } from './CostCalculator.js';
import { EmployeeDeductionService } from './EmployeeDeductionService.js';
import { EmployerChargesService } from './EmployerChargesService.js';
import { FatorRService } from './FatorRService.js';
import { FormDefaultsService } from './FormDefaultsService.js';
import { HealthPlanReferenceService } from './HealthPlanReferenceService.js';
import { LeaveReserveService } from './LeaveReserveService.js';
import { ProvisionService } from './ProvisionService.js';
import { RegimeComparisonService } from './RegimeComparisonService.js';
import { TaxAdvantageService } from './TaxAdvantageService.js';
import { WageFloorService } from './WageFloorService.js';

export function createServices(database, referenceDate) {
  const ratesRepository = new RatesRepository(database.federalRates, referenceDate);
  const regimeRepository = new RegimeRepository(database.taxRegimes, referenceDate);
  const wageFloorRepository = new WageFloorRepository(database.wageFloors, referenceDate);
  const hazardRepository = new HazardRepository(database.occupationalHazards, referenceDate);
  const sourceRepository = new SourceRepository(database.sources, referenceDate);
  const contentRepository = new ContentRepository(database.content, referenceDate);
  const formTextRepository = new FormTextRepository(database.formText, referenceDate);
  const healthPlanRepository = new HealthPlanRepository(database.healthPlans, referenceDate);

  const agreementRepository = new CollectiveAgreementRepository(database.collectiveAgreements, referenceDate);
  const collectiveAgreementService = new CollectiveAgreementService(agreementRepository, ratesRepository);
  const employerChargesService = new EmployerChargesService(regimeRepository);
  const calendarService = new CalendarService(ratesRepository, referenceDate);
  const compensationService = new CompensationService(ratesRepository, hazardRepository, calendarService);
  const contractService = new ContractService(ratesRepository);
  const provisionService = new ProvisionService(ratesRepository, employerChargesService, contractService);
  const benefitService = new BenefitService(ratesRepository);
  const employeeDeductionService = new EmployeeDeductionService(ratesRepository);
  const leaveReserveService = new LeaveReserveService(ratesRepository, provisionService, benefitService);
  const costCalculator = new CostCalculator({
    ratesRepository,
    contractService,
    compensationService,
    employerChargesService,
    provisionService,
    benefitService,
    employeeDeductionService,
    leaveReserveService,
  });

  return {
    meta: database.meta,
    referenceDate,
    repositories: {
      rates: ratesRepository,
      regimes: regimeRepository,
      wageFloors: wageFloorRepository,
      hazards: hazardRepository,
      sources: sourceRepository,
      content: contentRepository,
      formText: formTextRepository,
      agreements: agreementRepository,
    },
    agreements: collectiveAgreementService,
    wageFloors: new WageFloorService(wageFloorRepository, ratesRepository, collectiveAgreementService, contractService),
    charges: employerChargesService,
    calendar: calendarService,
    contract: contractService,
    compensation: compensationService,
    provisions: provisionService,
    benefits: benefitService,
    healthPlans: new HealthPlanReferenceService(healthPlanRepository),
    deductions: employeeDeductionService,
    leaveReserve: leaveReserveService,
    calculator: costCalculator,
    comparison: new RegimeComparisonService(regimeRepository, costCalculator),
    taxAdvantages: new TaxAdvantageService(regimeRepository, ratesRepository),
    fatorR: new FatorRService(regimeRepository, ratesRepository),
    formDefaults: new FormDefaultsService({ ratesRepository, regimeRepository, wageFloorRepository }),
  };
}
