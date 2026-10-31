// Simples Nacional "Fator R": payroll / revenue over 12 months decides Anexo III vs V.
export class FatorRService {
  constructor(regimeRepository, ratesRepository) {
    this.regimes = regimeRepository;
    this.rates = ratesRepository;
  }

  threshold() { return this.regimes.simplesRules().fatorRThreshold; }

  // Payroll that counts for Fator R: 12 salaries + 13th + vacation bonus, plus FGTS.
  yearlyPayroll(gross) {
    return gross * (12 + 1 + 1 / 3) * (1 + this.rates.fgts().monthlyRate);
  }

  maxRevenueSupported(gross) {
    return this.yearlyPayroll(gross) / this.threshold();
  }
}
