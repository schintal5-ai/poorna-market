import {test} from 'node:test';
import assert from 'node:assert/strict';
import {canWalk} from '../src/navigation.ts';
import {stops} from '../src/data.ts';

test('both promenade lanes run the full street and every destination is reachable', () => {
  for (let z = -47; z <= 46; z += 0.1) for (const x of [-3, 3]) assert.ok(canWalk(x, z), `${x},${z}`);
  for (const s of stops) assert.ok(canWalk(s.x, s.z), s.name);
});

test('walking cannot enter vendor bays or leave either gateway', () => {
  for (let z = -47; z <= 46; z++) {
    assert.equal(canWalk(5.2, z), false);
    assert.equal(canWalk(-5.2, z), false);
  }
  assert.equal(canWalk(3, -47.01), false);
  assert.equal(canWalk(3, 46.01), false);
});

test('invalid navigation coordinates fail closed', () => {
  for (const n of [NaN, Infinity, -Infinity]) {
    assert.equal(canWalk(n, 0), false);
    assert.equal(canWalk(0, n), false);
  }
});
