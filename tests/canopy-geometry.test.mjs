import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {createCanopyRoof, canopySpec} from '../src/canopy-model.ts';
import {canopies, trees} from '../src/infrastructure.ts';

const bounds = (c) => {
  const mat = new T.MeshBasicMaterial();
  const g = createCanopyRoof(c.side, mat, mat);
  g.position.set(c.x, 0, c.z);
  g.updateMatrixWorld(true);
  return new T.Box3().setFromObject(g, true);
};

test('centre-row petals keep half-metre separation and leave room for the tree crowns', () => {
  const boxes = canopies.map(bounds);
  let minimum = Infinity;
  for (let i = 0; i < boxes.length; i++)
    for (let j = i + 1; j < boxes.length; j++) {
      const a = boxes[i];
      const b = boxes[j];
      minimum = Math.min(minimum, Math.max(0, a.min.z - b.max.z, b.min.z - a.max.z));
    }
  assert.ok(minimum >= canopySpec.minimumClearance, `minimum clearance ${minimum}`);
  // Tree crowns reach 1.4 m from the trunk; petals must leave them room.
  for (const t of trees) for (const b of boxes) assert.ok(Math.max(b.min.z - t.z, t.z - b.max.z) >= 1.4, `petal over tree ${t.id}`);
  // Symmetric petals are centred on the street.
  for (const b of boxes) assert.ok(b.min.x < -2 && b.max.x > 2);
  assert.equal(canopies.length, 7);
});
