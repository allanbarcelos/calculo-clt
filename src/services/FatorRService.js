// Simples Nacional "Fator R": payroll / revenue over 12 months decides Anexo III vs V.
export class FatorRService {
  constructor(regimeRepository, contractService) {
    this.regimes = regimeRepository;
    this.contract = contractService;
  }

  threshold() { return this.regimes.simplesRules().fatorRThreshold; }

  // Payroll that counts for Fator R: 12 salaries + 13th + vacation bonus, plus FGTS.
  yearlyPayroll(gross, input = {}) {
    return gross * (12 + 1 + 1 / 3) * (1 + this.contract.fgts(input).monthlyRate);
  }

  maxRevenueSupported(gross, input = {}) {
    return this.yearlyPayroll(gross, input) / this.threshold();
  }
}
