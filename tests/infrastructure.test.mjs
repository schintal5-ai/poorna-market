import {test} from 'node:test';
import assert from 'node:assert/strict';
import {centreRow, canopies, shopConnections, waterStages, rowSpacing, complex, bayWidth, archCount, archZ, complexHeight, complexLength} from '../src/infrastructure.ts';
import {canWalk} from '../src/navigation.ts';

test('the centre row alternates harvester and tree every six metres down the middle of the street', () => {
  assert.ok(centreRow.length >= 12);
  centreRow.forEach((r, i) => {
    assert.equal(r.x, 0);
    assert.equal(r.kind, i % 2 ? 'tree' : 'harvester');
    if (i) assert.equal(centreRow[i - 1].z - r.z, rowSpacing);
  });
  assert.equal(new Set(centreRow.map((r) => r.id)).size, centreRow.length);
  // No harvester columns remain at the street sides.
  for (const c of canopies) assert.equal(c.x, 0);
  for (let z = -40; z <= 38; z++) assert.ok(canopies.some((c) => Math.abs(c.z - z) <= 12), 'unserved corridor at ' + z);
});

test('harvester columns and tree seat walls are solid', () => {
  for (const r of centreRow) {
    assert.equal(canWalk(r.x, r.z), false);
    assert.equal(canWalk(r.x + 0.3, r.z), false);
  }
});

test('every complex unit and street shop has a unique separate non-potable branch', () => {
  assert.equal(shopConnections.length, 39);
  assert.equal(new Set(shopConnections.map((c) => c.id)).size, 39);
  assert.equal(shopConnections.filter((c) => c.building === 'complex' && c.side === -1).length, 26);
  assert.equal(shopConnections.filter((c) => c.building === 'street' && c.side === 1).length, 13);
  for (const shop of shopConnections) {
    assert.equal(shop.supply, 'non-potable-main');
    assert.equal(shop.collection, 'collection-main');
  }
  assert.equal(waterStages.length, 6);
});

test("the complex follows Elevation AA': G+2, 4 m floors, 23 bays, 8 arched modules, same frontage", () => {
  assert.equal(complex.floors, 3);
  assert.equal(complex.floorHeight, 4);
  assert.equal(complex.bays, 23);
  assert.equal(complex.tallBays, 6);
  assert.equal(archCount, 8);
  assert.equal(complex.tallBays + 2 * archCount + 1, complex.bays);
  assert.equal(complexLength, 104);
  assert.ok(Math.abs(bayWidth - 104 / 23) < 1e-9);
  assert.equal(archZ.length, complex.entranceArches.length);
  assert.ok(complexHeight > 12 && complexHeight < 13.5);
  assert.equal(complex.side, -1);
});
