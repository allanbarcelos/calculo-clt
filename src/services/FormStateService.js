// Brings form data saved in an earlier visit in line with today's rules and database: wrong
// types fall back to defaults, a replaced agreement moves to its successor, a band that no
// longer exists is dropped, and a salary filled from the floor follows the current floor.
export class FormStateService {
  constructor({ formDefaultsService, wageFloorService, collectiveAgreementService, contractService }) {
    this.formDefaults = formDefaultsService;
    this.wageFloors = wageFloorService;
    this.agreements = collectiveAgreementService;
    this.contract = contractService;
  }

  // Keeps only known fields whose type matches the default (numbers must be finite).
  sanitize(stored, defaults) {
    const data = { ...defaults };
    if (!stored || typeof stored !== 'object' || Array.isArray(stored)) return data;
    for (const [key, fallback] of Object.entries(defaults)) {
      const value = stored[key];
      if (typeof value !== typeof fallback) continue;
      if (typeof value === 'number' && !Number.isFinite(value)) continue;
      data[key] = value;
    }
    return data;
  }

  // A saved agreement that is gone or was replaced: undo what it filled in, then apply the
  // agreement now in force in its series (same role when it still exists).
  agreementPatch(data, defaults) {
    if (!data.agreementId || this.agreements.selection(data)) return {};
    const revert = this.agreements.revertPatch(data, defaults);
    const successor = this.agreements.current(data.agreementId);
    const covers = successor && (successor.ufs.includes('*') || successor.ufs.includes(data.uf));
    if (!covers || successor.id === data.agreementId) return revert;
    const roleId = successor.roles.some((r) => r.id === data.agreementRoleId) ? data.agreementRoleId : '';
    const reverted = { ...data, ...revert };
    return { ...revert, ...this.agreements.applyPatch(successor.id, roleId, { keepSalary: this.contract.isApprentice(reverted) || !data.salaryAuto }) };
  }

  restore(stored) {
    const defaults = this.formDefaults.defaults();
    let data = this.sanitize(stored, defaults);
    // A contract type the employer does not offer (e.g. apprentice for a household).
    if (!this.contract.types(data).includes(data.contractType)) data = { ...data, ...this.contract.switchPatch(data, 'standard') };
    data = { ...data, ...this.agreementPatch(data, defaults) };
    if (data.bandId && !this.wageFloors.findBand(data.uf, data.bandId, data.weeklyHours)) data.bandId = '';
    if (data.salaryAuto && data.salary > 0) data.salary = this.wageFloors.resolve(data).value;
    // A salary reset by the agreement revert restarts from the floor once the user reaches it.
    if (data.salary === 0) data.salaryAuto = false;
    return data;
  }
}
