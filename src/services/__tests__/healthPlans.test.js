import { describe, expect, it } from 'vitest';
import { jsonDatabase } from '../../repositories/database.js';
import { createServices } from '../container.js';

const { healthPlans } = createServices(jsonDatabase, '2026-11-02');

describe('HealthPlanReferenceService', () => {
  it('needs the age band before showing a reference', () => {
    expect(healthPlans.lookup({ uf: 'SP', ageBand: '', accommodation: 'ward' })).toBeNull();
  });

  it('returns state and national quartiles, weighted by beneficiaries (ANS, jun/2026)', () => {
    const ref = healthPlans.lookup({ uf: 'SP', ageBand: '4', accommodation: 'ward' });
    expect(ref).toMatchObject({ reference: '2026-06', accommodation: 'ward', smallSample: false, commercialRange: 0.3 });
    expect(ref.state.low).toBeLessThanOrEqual(ref.state.median);
    expect(ref.state.median).toBeLessThanOrEqual(ref.state.high);
    expect(ref.state.beneficiaries).toBeGreaterThan(1_000_000);
    expect(ref.national.beneficiaries).toBeGreaterThan(ref.state.beneficiaries);
  });

  it('a private room costs more than a ward, and older bands cost more', () => {
    const ward = healthPlans.lookup({ uf: 'BR', ageBand: '4', accommodation: 'ward' }).national.median;
    const room = healthPlans.lookup({ uf: 'BR', ageBand: '4', accommodation: 'private' }).national.median;
    const older = healthPlans.lookup({ uf: 'BR', ageBand: '10', accommodation: 'ward' }).national.median;
    expect(room).toBeGreaterThan(ward);
    expect(older).toBeGreaterThan(ward);
  });

  it('flags states with few employer-plan beneficiaries', () => {
    expect(healthPlans.lookup({ uf: 'AC', ageBand: '4', accommodation: 'ward' }).smallSample).toBe(true);
  });
});
