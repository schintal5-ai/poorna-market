import * as T from 'three';

/** One rain-catching petal. Side 0 (the centre row) is symmetric across the street. */
export const canopySpec = {
  inwardRadius: 6.1 * 0.65,
  outwardRadius: 3.7 * 0.65,
  centreRadius: 3.3,
  lengthRadius: 3.25,
  minimumClearance: 0.5,
  ribRadius: 0.045,
  baseHeight: 4.65,
};

export function canopyPoint(r: number, a: number, side: number, y0: number) {
  const dx = Math.cos(a);
  const shape = 0.84 + 0.16 * Math.cos(3 * a);
  const across = side === 0 ? canopySpec.centreRadius : dx * side < 0 ? canopySpec.inwardRadius : canopySpec.outwardRadius;
  const along = side === 0 ? canopySpec.lengthRadius : 7.1 * 0.65;
  return new T.Vector3(dx * across * shape * r, y0 + 0.15 + 1.35 * r * r + 0.12 * Math.cos(3 * a) * r, Math.sin(a) * along * shape * r);
}

/** Shared runtime/test construction: membrane, all ribs, perimeter and intermediate ring. */
export function createCanopyRoof(side: number, membrane: T.Material, bronze: T.Material) {
  const group = new T.Group();
  const y0 = canopySpec.baseHeight + (side > 0 ? 0.18 : 0);
  const point = (r: number, a: number) => canopyPoint(r, a, side, y0);
  const add = (geometry: T.BufferGeometry, material: T.Material) => {
    const m = new T.Mesh(geometry, material);
    m.castShadow = m.receiveShadow = true;
    group.add(m);
  };
  const tube = (points: T.Vector3[], radius: number) => add(new T.TubeGeometry(new T.CatmullRomCurve3(points), Math.max(12, points.length * 5), radius, 8, false), bronze);
  const segments = 96;
  const rings = 14;
  const vertices: number[] = [];
  const indices: number[] = [];
  for (let j = 0; j <= rings; j++)
    for (let a = 0; a <= segments; a++) {
      const p = point(j / rings, (a / segments) * Math.PI * 2);
      vertices.push(p.x, p.y, p.z);
    }
  for (let j = 0; j < rings; j++)
    for (let a = 0; a < segments; a++) {
      const v = j * (segments + 1) + a;
      indices.push(v, v + 1, v + segments + 1, v + 1, v + segments + 2, v + segments + 1);
    }
  const geo = new T.BufferGeometry();
  geo.setAttribute('position', new T.Float32BufferAttribute(vertices, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  add(geo, membrane);
  for (let i = 0; i < 12; i++) {
    const a = (i * Math.PI) / 6;
    tube([new T.Vector3(0, 3.45, 0), point(0.28, a), point(0.65, a), point(1, a)], canopySpec.ribRadius);
  }
  tube(Array.from({length: 97}, (_, i) => point(1, (i / 96) * Math.PI * 2)), canopySpec.ribRadius);
  tube(Array.from({length: 65}, (_, i) => point(0.55, (i / 64) * Math.PI * 2)), 0.022);
  return group;
}
