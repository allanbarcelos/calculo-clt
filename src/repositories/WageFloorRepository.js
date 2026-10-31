import { VersionedRepository } from './VersionedRepository.js';

export class WageFloorRepository extends VersionedRepository {
  states() { return this.section.states; }
  defaultState() { return this.section.defaultState; }

  stateFloor(uf) {
    return this.collection('stateFloors', 'uf').find((f) => f.uf === uf) ?? null;
  }

  federalFloors() { return this.collection('federalFloors'); }
}
