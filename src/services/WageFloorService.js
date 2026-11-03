// Answers "what is the lowest legal salary for this employee?"
export class WageFloorService {
  constructor(wageFloorRepository, ratesRepository, collectiveAgreementService, contractService) {
    this.floors = wageFloorRepository;
    this.rates = ratesRepository;
    this.agreements = collectiveAgreementService;
    this.contract = contractService;
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
    // Apprentices: hourly minimum wage × contracted hours, unless an agreement floor typed by the
    // user is higher (CLT art. 428, §2º: "salvo condição mais favorável").
    if (this.contract?.isApprentice(input)) {
      const value = this.contract.apprenticeFloor(input.weeklyHours);
      const typed = input.hasAgreementFloor && input.agreementFloor > value ? input.agreementFloor : 0;
      return typed ? { value: typed, origin: 'agreement', band: null } : { value, origin: 'apprentice', band: null };
    }
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

  // Form patch after a floor-related change: a defined floor (band, agreement role or typed
  // agreement floor) becomes the salary; clearing it undoes a salary we filled in, but keeps
  // one the user typed.
  floorPatch(data, patch) {
    const next = { ...data, ...patch };
    const hasDefinedFloor = this.contract?.isApprentice(next)
      || Boolean(next.bandId)
      || (next.hasAgreementFloor && next.agreementFloor > 0)
      || Boolean(this.agreements?.selection(next)?.role);
    if (hasDefinedFloor) return { ...patch, salary: this.resolve(next).value, salaryAuto: true };
    return data.salaryAuto ? { ...patch, salary: 0, salaryAuto: false } : patch;
  }

  // Changing the state keeps federal floors, drops state bands and undoes an agreement that
  // does not cover the new state.
  statePatch(data, uf, defaults) {
    const patch = { uf, bandId: this.isFederalBand(data.bandId) ? data.bandId : '' };
    const keepsAgreement = this.agreements.forState(uf).some((a) => a.id === data.agreementId);
    return this.floorPatch(data, keepsAgreement ? patch : { ...this.agreements.revertPatch(data, defaults), ...patch });
  }
}
