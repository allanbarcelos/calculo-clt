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

  // Floors set by federal law. Floors defined for a reference workweek (nursing: 44h) are
  // proportional to the contracted hours.
  federalFloors(weeklyHours) {
    const minimumWage = this.rates.minimumWage();
    return this.floors.federalFloors().map((f) => {
      const full = f.value ?? f.minimumWageMultiple * minimumWage;
      const scale = f.referenceWeeklyHours && weeklyHours ? Math.min(1, weeklyHours / f.referenceWeeklyHours) : 1;
      return { ...f, value: full * scale, fullValue: full };
    });
  }

  findBand(uf, bandId, weeklyHours) {
    if (!bandId) return null;
    return (
      this.stateFloor(uf)?.bands.find((b) => b.id === bandId) ??
      this.federalFloors(weeklyHours).find((f) => f.id === bandId) ??
      null
    );
  }

  // State band that covers domestic workers, when the state has a floor law.
  domesticBand(uf) {
    const state = this.stateFloor(uf);
    return state?.bands.find((b) => b.id === state.domesticBand) ?? null;
  }

  isFederalBand(bandId) {
    return this.federalFloors().some((f) => f.id === bandId);
  }

  // The collective agreement prevails over the state law (LC 103/2000), but never goes below
  // a floor set by federal law; otherwise the state or federal floor applies, never below the
  // national minimum wage.
  resolve(input) {
    const { uf, bandId, hasAgreementFloor, agreementFloor } = input;
    const minimumWage = this.rates.minimumWage();
    // A day worker is not an employee: there is no wage floor for the daily rate.
    if (this.contract?.isDayWorker(input)) return { value: 0, origin: 'dayWorker', band: null };
    // Apprentices: hourly minimum wage × contracted hours, unless an agreement floor typed by the
    // user is higher (CLT art. 428, §2º: "salvo condição mais favorável").
    if (this.contract?.isApprentice(input)) {
      const value = this.contract.apprenticeFloor(input.weeklyHours);
      const typed = input.hasAgreementFloor && input.agreementFloor > value ? input.agreementFloor : 0;
      return typed ? { value: typed, origin: 'agreement', band: null } : { value, origin: 'apprentice', band: null };
    }
    const band = this.findBand(uf, bandId, input.weeklyHours);
    const federal = band && this.isFederalBand(bandId) ? band.value : 0;
    const selection = this.agreements?.selection(input);
    if (selection?.role) {
      return { value: Math.max(minimumWage, selection.role.floor, federal), origin: 'agreementRole', band: null, ...selection };
    }
    if (hasAgreementFloor && agreementFloor > 0) {
      return { value: Math.max(minimumWage, agreementFloor, federal), origin: 'agreement', band: null };
    }
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
    const household = this.contract?.isHousehold(data);
    const bandId = household ? (this.domesticBand(uf)?.id ?? '') : (this.isFederalBand(data.bandId) ? data.bandId : '');
    const patch = { uf, bandId };
    const keepsAgreement = this.agreements.forState(uf).some((a) => a.id === data.agreementId);
    return this.floorPatch(data, keepsAgreement ? patch : { ...this.agreements.revertPatch(data, defaults), ...patch });
  }

  // Changing the employer: a household drops collective agreements (they cover companies) and
  // starts at the state band for domestic workers; back to a company, that band is dropped.
  regimePatch(data, regime, defaults) {
    const patch = this.contract.regimePatch(data, regime);
    const next = { ...data, ...patch };
    const wasHousehold = this.contract.isHousehold(data);
    if (this.contract.isHousehold(next) && !wasHousehold) {
      Object.assign(patch, this.agreements.revertPatch(data, defaults), { bandId: this.domesticBand(data.uf)?.id ?? '' });
    } else if (!this.contract.isHousehold(next) && wasHousehold && data.bandId === this.domesticBand(data.uf)?.id) {
      patch.bandId = '';
    }
    if (wasHousehold === this.contract.isHousehold(next)) return { ...patch };
    return this.floorPatch(data, patch);
  }
}
