// Answers "what is the lowest legal salary for this employee?"
export class WageFloorService {
  constructor(wageFloorRepository, ratesRepository, collectiveAgreementService) {
    this.floors = wageFloorRepository;
    this.rates = ratesRepository;
    this.agreements = collectiveAgreementService;
  }

  states() { return this.floors.states(); }
  stateFloor(uf) { return this.floors.stateFloor(uf); }

  federalFloors() {
    const minimumWage = this.rates.minimumWage();
    return this.floors.federalFloors().map((f) => ({
      ...f,
      value: f.value ?? f.minimumWageMultiple * minimumWage,
    }));
  }

  findBand(uf, bandId) {
    if (!bandId) return null;
    return (
      this.stateFloor(uf)?.bands.find((b) => b.id === bandId) ??
      this.federalFloors().find((f) => f.id === bandId) ??
      null
    );
  }

  isFederalBand(bandId) {
    return this.federalFloors().some((f) => f.id === bandId);
  }

  // The collective agreement prevails over the state law (LC 103/2000); otherwise the
  // state or federal floor applies, never below the national minimum wage.
  resolve(input) {
    const { uf, bandId, hasAgreementFloor, agreementFloor } = input;
    const minimumWage = this.rates.minimumWage();
    const selection = this.agreements?.selection(input);
    if (selection?.role) {
      return { value: Math.max(minimumWage, selection.role.floor), origin: 'agreementRole', band: null, ...selection };
    }
    if (hasAgreementFloor && agreementFloor > 0) {
      return { value: Math.max(minimumWage, agreementFloor), origin: 'agreement', band: null };
    }
    const band = this.findBand(uf, bandId);
    if (band && band.value > minimumWage) return { value: band.value, origin: 'band', band };
    return { value: minimumWage, origin: 'national', band };
  }
}
