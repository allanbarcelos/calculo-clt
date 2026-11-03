// Collective agreements (CCT/ACT): floors per role and the values they set for other
// form fields. The values pre-fill the form but stay editable.
export class CollectiveAgreementService {
  constructor(agreementRepository, ratesRepository) {
    this.agreements = agreementRepository;
    this.rates = ratesRepository;
  }

  forState(uf) { return this.agreements.forState(uf); }

  // Why an agreement's values must be checked against the official text before use.
  warnings(agreement) {
    if (!agreement) return null;
    const expired = Boolean(agreement.expired);
    const unofficial = agreement.sourceKind !== 'registry';
    const calculated = Boolean(agreement.calculatedFloors);
    return { expired, unofficial, calculated, any: expired || unofficial || calculated };
  }

  get(id) { return this.agreements.get(id); }

  role(agreementId, roleId) {
    return this.get(agreementId)?.roles.find((r) => r.id === roleId) ?? null;
  }

  // Selected agreement + role, only if both still exist and cover the state.
  selection({ uf, agreementId, agreementRoleId }) {
    const agreement = this.get(agreementId);
    if (!agreement || !(agreement.ufs.includes('*') || agreement.ufs.includes(uf))) return null;
    const role = agreement.roles.find((r) => r.id === agreementRoleId) ?? null;
    return { agreement, role };
  }

  // { field: { value, clause, format } } — agreement-wide values overridden by the role's own.
  presets(agreementId, roleId) {
    const agreement = this.get(agreementId);
    if (!agreement) return {};
    const role = this.role(agreementId, roleId);
    const merged = { ...agreement.presets, ...role?.presets };
    const days = this.rates.transportVoucher().defaultDays;

    return Object.fromEntries(
      Object.entries(merged)
        .filter(([key]) => this.agreements.presetField(key))
        .map(([key, preset]) => {
          // Daily meal values become monthly using the default number of working days.
          const value = preset.daily !== undefined ? preset.daily * (preset.days ?? days) : preset.value;
          return [key, { value, clause: preset.clause, format: this.agreements.presetField(key).format, daily: preset.daily }];
        }),
    );
  }

  // Form patch for a chosen agreement/role: salary at the role floor plus every preset.
  // Apprentices keep their own floor (hourly minimum wage), so keepSalary skips the role floor.
  applyPatch(agreementId, roleId, { keepSalary = false } = {}) {
    const role = this.role(agreementId, roleId);
    const presets = this.presets(agreementId, roleId);
    const patch = { agreementId, agreementRoleId: roleId ?? '' };
    if (role && !keepSalary) {
      patch.salary = Math.max(this.rates.minimumWage(), role.floor);
      patch.salaryAuto = true;
    }
    for (const [key, preset] of Object.entries(presets)) {
      patch[key] = preset.value;
      const enables = this.agreements.presetField(key).enables;
      if (enables) patch[enables] = true;
    }
    return patch;
  }

  // Undo the values a previous agreement filled in, keeping anything the user changed since.
  revertPatch(data, defaults) {
    const presets = this.presets(data.agreementId, data.agreementRoleId);
    const patch = { agreementId: '', agreementRoleId: '' };
    for (const [key, preset] of Object.entries(presets)) {
      if (data[key] === preset.value) patch[key] = defaults[key];
      const enables = this.agreements.presetField(key).enables;
      if (enables && data[key] === preset.value) patch[enables] = defaults[enables];
    }
    if (data.salaryAuto && this.role(data.agreementId, data.agreementRoleId)) {
      patch.salary = 0;
      patch.salaryAuto = false;
    }
    return patch;
  }
}
