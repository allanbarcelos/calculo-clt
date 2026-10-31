import { VersionedRepository } from './VersionedRepository.js';

export class HazardRepository extends VersionedRepository {
  insalubrity() { return this.version('insalubrity'); }
  hazardPay() { return this.version('hazardPay'); }
}
