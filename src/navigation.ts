import {centreRow, obstacleRadius, basketStand} from './infrastructure.ts';

/** Walking envelope: the two promenade lanes either side of the centre row, plus the gaps across it. */
export const walkHalfWidth = 4.95;
export const walkZ = {min: -47, max: 46};

export function canWalk(x: number, z: number) {
  if (!Number.isFinite(x) || !Number.isFinite(z)) return false;
  if (Math.abs(x) > walkHalfWidth || z < walkZ.min || z > walkZ.max) return false;
  for (const r of centreRow) {
    const radius = obstacleRadius[r.kind];
    if (Math.abs(z - r.z) < radius && Math.hypot(x - r.x, z - r.z) < radius) return false;
  }
  if (Math.abs(x - basketStand.x) < basketStand.w / 2 + 0.2 && Math.abs(z - basketStand.z) < basketStand.d / 2 + 0.2) return false;
  return true;
}
