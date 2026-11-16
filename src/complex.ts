import * as T from 'three';
import type {Kit} from './geometry';
import type {Props} from './props';
import {complex, complexLength, bayWidth, bayX, archX, archCount, isEntrance, shopConnections} from './infrastructure';

/** Ground-floor tenants of the complex, in bay order from the entrance end. */
const unitNames: [string, string][] = [
  ['Poorna Opticals', 'కళ్లద్దాలు'], ['Sri Sai Mobiles', 'మొబైల్స్'], ['Lakshmi Provisions', 'లక్ష్మి కిరాణా'], ['Coastal Handlooms', 'చేనేత వస్త్రాలు'],
  ['Poorna Spice House', 'సుగంధ ద్రవ్యాలు'], ['Srinivasa Brassware', 'ఇత్తడి వస్తువులు'], ['Vizag Coffee Works', 'విశాఖ కాఫీ'], ['Andhra Weaves', 'ఆంధ్ర చేనేత'],
  ['Sundara Pottery', 'మట్టి పాత్రలు'], ['Market Book House', 'పుస్తకాలు'], ['The Coconut Store', 'కొబ్బరి దుకాణం'], ['Sagar Dry Fruits', 'డ్రై ఫ్రూట్స్'],
  ['Kalamkari Studio', 'కలంకారి'], ['Ratnam Footwear', 'చెప్పులు'], ['Padma Silks', 'పద్మ సిల్క్స్'], ['The Pickle Pantry', 'పచ్చళ్ళు'],
  ['Sri Ganesh Utensils', 'వంట పాత్రలు'], ['Jasmine & Marigold', 'మల్లెపూలు'], ['Heritage Tailors', 'దర్జీ దుకాణం'], ['Clay & Copper', 'మట్టి రాగి'],
  ['The Paper Shop', 'కాగితం దుకాణం'], ['Bangle Bazaar', 'గాజులు'], ['Annapurna Sweets', 'మిఠాయిలు'], ['Sea Salt & Spice', 'ఉప్పు మసాలా'],
  ['Kondapalli Toys', 'కొండపల్లి బొమ్మలు'], ['Courtyard Collective', 'పూర్ణ మార్కెట్'],
];
const unitGoods = ['brass', 'books', 'produce', 'textiles', 'produce', 'brass', 'food', 'textiles', 'craft', 'books', 'produce', 'produce', 'textiles', 'craft', 'textiles', 'produce', 'brass', 'flowers', 'textiles', 'craft', 'books', 'craft', 'food', 'produce', 'craft', 'craft'];

/** Openings measured from Elevation AA' (metres; its 4 m floors scale the drawing at 23.5 px/m). Widths are ratios of the bay pitch. */
export const windowSpec = {widthRatio: 0.61, low: 0.17, upperLow: 4.34, top: 11.36};
export const archSpec = {widthRatio: 1.54, panelRatio: 1.6, springing: 0.15, panelTop: 4};

/** A round-bottomed ("U") window outline centred on cx, from its lowest point to its flat top. */
function uOutline<P extends T.Path>(path: P, cx: number, hw: number, low: number, top: number, grow = 0): P {
  const cy = low + hw;
  path.moveTo(cx - hw - grow, top + grow);
  path.lineTo(cx - hw - grow, cy);
  path.absarc(cx, cy, hw + grow, Math.PI, 0, false);
  path.lineTo(cx + hw + grow, top + grow);
  path.lineTo(cx - hw - grow, top + grow);
  return path;
}

/** Ground-floor arch of module k: a near-semicircular opening from the elevation's circles. */
function archGeom(k: number) {
  const c = archX(k);
  const R = (archSpec.widthRatio * bayWidth) / 2;
  return {k, c, R, l: c - R, r: c + R, pw: archSpec.panelRatio * bayWidth};
}
type Arch = ReturnType<typeof archGeom>;
function archOutline<P extends T.Path>(path: P, a: Arch): P {
  path.lineTo(a.l, 0);
  path.lineTo(a.l, archSpec.springing);
  path.absellipse(a.c, archSpec.springing, a.R, a.R, Math.PI, 0, true, 0);
  path.lineTo(a.r, 0);
  return path;
}

let hatch: T.CanvasTexture | undefined;
/** The pink glazing of the elevation: tinted glass behind fine vertical lattice lines (one tile per metre). */
function hatchTexture() {
  if (hatch) return hatch;
  const c = document.createElement('canvas');
  c.width = 64;
  c.height = 64;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = 'rgba(244,170,182,0.55)';
  ctx.fillRect(0, 0, 64, 64);
  ctx.fillStyle = 'rgba(255,238,240,0.8)';
  for (let x = 0; x < 64; x += 8) ctx.fillRect(x + 3, 0, 2, 64);
  hatch = new T.CanvasTexture(c);
  hatch.wrapS = hatch.wrapT = T.RepeatWrapping;
  hatch.colorSpace = T.SRGBColorSpace;
  hatch.anisotropy = 4;
  return hatch;
}

/** Builds the G+2 shopping complex of Elevation AA' along the west frontage. */
export function buildComplex(k: Kit, p: Props) {
  const m = k.materials;
  const g = new T.Group();
  // Local frame: +x runs down the street from the entrance end, +y is up, +z faces the street.
  g.position.set(complex.side * complex.faceX, 0, complex.zStart);
  g.rotation.y = Math.PI / 2;
  k.root.add(g);
  const L = complexLength;
  const H = complex.floors * complex.floorHeight;
  const wall = m.get('plaster', 0xf3ede2, 0.32);
  const pinkPlaster = m.get('plaster', 0xe8a2ac, 0.4);
  const trim = m.get('plaster', 0xfbf7ef, 0.5);
  const frame = m.get('metal', 0x3f4442);
  const stone = m.get('stone', 0xcfc5b0, 0.5);
  const shopGlass = new T.MeshPhysicalMaterial({color: 0x8ea4a6, transparent: true, opacity: 0.38, roughness: 0.06, metalness: 0.2, envMapIntensity: 1.2, side: T.DoubleSide});
  const pinkGlass = new T.MeshStandardMaterial({map: hatchTexture(), transparent: true, depthWrite: false, roughness: 0.45, emissive: 0xf0a0ac, emissiveIntensity: 0.08, side: T.DoubleSide});
  const depth = 0.42;
  const hw = (windowSpec.widthRatio * bayWidth) / 2;
  const arches = Array.from({length: archCount}, (_, i) => archGeom(i));

  // Facade wall: one extrusion, with the arches cut from the base and every window cut through.
  const s = new T.Shape();
  s.moveTo(0, 0);
  for (const a of arches) archOutline(s, a);
  s.lineTo(L, 0);
  s.lineTo(L, H);
  s.lineTo(0, H);
  s.lineTo(0, 0);
  for (let b = 0; b < complex.bays; b++) s.holes.push(uOutline(new T.Path(), bayX(b), hw, b < complex.tallBays ? windowSpec.low : windowSpec.upperLow, windowSpec.top));
  const wallMesh = k.mesh(new T.ExtrudeGeometry(s, {depth, bevelEnabled: false, curveSegments: 18}), wall, g);
  wallMesh.position.z = -depth;

  // Pink panel behind every arch (the pink squares of the elevation), with a framed opening.
  for (const a of arches) {
    const ps = new T.Shape();
    ps.moveTo(a.c - a.pw / 2, 0);
    archOutline(ps, a);
    ps.lineTo(a.c + a.pw / 2, 0);
    ps.lineTo(a.c + a.pw / 2, archSpec.panelTop);
    ps.lineTo(a.c - a.pw / 2, archSpec.panelTop);
    ps.lineTo(a.c - a.pw / 2, 0);
    k.mesh(new T.ExtrudeGeometry(ps, {depth: 0.08, bevelEnabled: false, curveSegments: 24}), pinkPlaster, g);
    const curve = new T.EllipseCurve(a.c, archSpec.springing, a.R, a.R, 0, Math.PI, false, 0);
    const pts = curve.getPoints(40).map((v) => new T.Vector3(v.x, v.y, 0.1));
    k.tube([new T.Vector3(a.r, 0, 0.1), ...pts, new T.Vector3(a.l, 0, 0.1)], 0.05, frame, g);
    k.box(0.5, 0.42, 0.12, a.c, archSpec.springing + a.R + 0.12, 0.12, trim, g);
  }

  // Parapet, roof band, end pilasters, plinth and coping: the horizontal lines of the drawing.
  k.box(L, complex.parapet, depth, L / 2, H + complex.parapet / 2, -depth / 2, wall, g);
  k.box(L + 0.3, 0.16, 0.62, L / 2, H + complex.parapet + 0.08, -0.2, trim, g);
  k.box(L, 0.14, 0.12, L / 2, H, 0.05, trim, g);
  for (const u of [0.25, L - 0.25]) k.box(0.5, H + complex.parapet, 0.16, u, (H + complex.parapet) / 2, 0.06, trim, g);
  for (let i = 0; i <= arches.length; i++) {
    const from = i === 0 ? 0 : arches[i - 1].r;
    const to = i === arches.length ? L : arches[i].l;
    k.box(to - from, 0.22, 0.06, (from + to) / 2, 0.11, 0.03, stone, g);
  }
  // Building volume behind the facade.
  k.box(L, 0.3, complex.depth, L / 2, H + 0.15, -complex.depth / 2, m.get('plain', 0xb9b2a6), g);
  k.box(L, H, 0.3, L / 2, H / 2, -complex.depth, m.get('plaster', 0xe6dfd2, 0.3), g);
  for (const u of [0, L]) k.box(0.3, H + complex.parapet, complex.depth, u, (H + complex.parapet) / 2, -complex.depth / 2, m.get('plaster', 0xe6dfd2, 0.3), g);
  for (let f = 1; f < complex.floors; f++) k.box(L, 0.25, 3.4, L / 2, f * complex.floorHeight - 0.12, -1.9, m.get('plain', 0x9d958a), g);
  // Rooftop break tanks that feed the upper floors from the harvested supply.
  for (const z of [24, -28]) {
    const u = complex.zStart - z;
    k.cylinder(1.25, 1.7, u, H + 0.3 + 0.85, -6.5, m.get('plain', 0x4f6a6d), g);
    k.cylinder(1.3, 0.12, u, H + 0.3 + 1.76, -6.5, m.get('metal', 0x8f9a97), g);
  }

  // Pink lattice glazing and frames, built once per window type and placed in every bay.
  const kinds = [windowSpec.low, windowSpec.upperLow].map((low) => {
    const glassGeo = new T.ShapeGeometry(uOutline(new T.Shape(), 0, hw, low, windowSpec.top), 18);
    const ring = uOutline(new T.Shape(), 0, hw, low, windowSpec.top, 0.07);
    ring.holes.push(uOutline(new T.Path(), 0, hw, low, windowSpec.top));
    return {glassGeo, frameGeo: new T.ExtrudeGeometry(ring, {depth: 0.07, bevelEnabled: false, curveSegments: 14})};
  });
  let unit = 0;
  for (let b = 0; b < complex.bays; b++) {
    const tall = b < complex.tallBays;
    const kind = kinds[tall ? 0 : 1];
    const uc = bayX(b);
    k.mesh(kind.frameGeo, frame, g).position.set(uc, 0, -0.03);
    const gl = k.mesh(kind.glassGeo, pinkGlass, g);
    gl.position.set(uc, 0, -0.22);
    gl.castShadow = false;
    if (tall) for (const v of [complex.floorHeight, complex.floorHeight * 2]) k.box(hw * 2, 0.06, 0.06, uc, v, -0.2, frame, g);
    // Upper floors: lit rooms behind the glazing, so the facade never reads as a flat repeat.
    for (let f = 1; f < complex.floors; f++) {
      const v0 = f * complex.floorHeight;
      k.box(bayWidth - 0.12, complex.floorHeight - 0.3, 0.05, uc, v0 + complex.floorHeight / 2, -3.2, m.interior, g);
      k.box(bayWidth - 0.12, 0.05, 3, uc, v0 + 0.02, -1.7, m.get('wood', 0x8a6b4c), g);
      k.box(0.06, complex.floorHeight - 0.3, 3, (b + 1) * bayWidth, v0 + complex.floorHeight / 2, -1.7, m.get('plaster', 0xe9e2d5), g);
    }
    if (tall) shopUnit(k, p, g, uc, unit++, bayWidth, hw * 2 - 0.1, 2.7);
  }
  for (const a of arches) {
    if (isEntrance(a.k)) archway(k, g, a, frame, trim, stone);
    else {
      const glass = new T.Shape();
      glass.moveTo(a.l, 0);
      archOutline(glass, a);
      glass.lineTo(a.l, 0);
      const gl = k.mesh(new T.ShapeGeometry(glass, 24), shopGlass, g);
      gl.position.z = -0.2;
      gl.castShadow = false;
      shopUnit(k, p, g, a.c, unit++, a.r - a.l, 3.2, 2.9);
    }
  }
}

/** A ground-floor shopfront: name board on the glazing and a lit shop behind it. */
function shopUnit(k: Kit, p: Props, g: T.Group, uc: number, unit: number, cell: number, plaqueW: number, plaqueY: number) {
  const m = k.materials;
  const name = unitNames[unit % unitNames.length];
  // The shop belongs to the nearest underground branch (the supply layout is unchanged).
  const z = complex.zStart - uc;
  const connection = shopConnections.filter((c) => c.building === 'complex').reduce((a, b) => (Math.abs(b.z - z) < Math.abs(a.z - z) ? b : a));
  connection.name = name[0];
  const plaque = k.label(name[0], name[1], plaqueW, 0.5, uc, plaqueY, -0.12, ['#3f4f4a', '#7a3f48', '#2f4a5c', '#6b5536'][unit % 4], g);
  plaque.castShadow = false;
  const w = cell - 0.16;
  const back = -5;
  k.box(w, 3.9, 0.06, uc, 1.95, back, m.interior, g);
  k.box(w, 0.05, -back, uc, 0.03, back / 2, m.get('stone', 0xd8cdb6, 2), g);
  k.box(0.08, 3.9, -back, uc + cell / 2 - 0.04, 1.95, back / 2, m.get('plaster', 0xeee6d8), g);
  k.box(w, 0.04, 0.04, uc, 3.6, -1.2, m.glow, g);
  const type = unitGoods[unit % unitGoods.length];
  const shelf = m.get('wood', [0xb09874, 0x8c6a4b, 0x6f5a46][unit % 3]);
  for (let s = 0; s < 3; s++) {
    k.box(w - 0.3, 0.05, 0.42, uc, 0.6 + s * 0.6, back + 0.3, shelf, g);
    for (let q = 0; q < 5; q++) {
      const x = uc - (w - 0.6) / 2 + q * ((w - 0.6) / 4);
      p.product(type, x, 0.63 + s * 0.6, back + 0.3, q + s, g, false);
    }
  }
  k.box(w * 0.55, 0.9, 0.6, uc, 0.45, -2.4, shelf, g);
  k.box(w * 0.58, 0.05, 0.66, uc, 0.92, -2.4, m.get('stone', 0xe7dcc6), g);
  for (let q = 0; q < 3; q++) p.product(type, uc - 0.35 + q * 0.35, 0.95, -2.4, q, g, false);
}

/** A walk-through entrance under one of the great arches: lit passage with stairs to the upper floors. */
function archway(k: Kit, g: T.Group, a: Arch, frame: T.Material, trim: T.Material, stone: T.Material) {
  const m = k.materials;
  for (const u of [a.l - 0.05, a.r + 0.05]) k.box(0.1, archSpec.springing + 0.1, 0.1, u, 0.1, 0.1, frame, g);
  const D = complex.depth - 0.4;
  k.box(a.r - a.l, 0.04, D, a.c, 0.02, -D / 2, stone, g);
  for (const u of [a.l + 0.15, a.r - 0.15]) k.box(0.3, complex.floorHeight, D, u, complex.floorHeight / 2, -D / 2 - 0.4, m.get('plaster', 0xf1e9dc, 0.5), g);
  k.box(a.r - a.l, 0.08, D, a.c, complex.floorHeight - 0.2, -D / 2 - 0.4, m.get('plaster', 0xf6efe4), g);
  for (const z of [-2, -5, -8]) k.box(1.4, 0.05, 0.16, a.c, complex.floorHeight - 0.27, z, m.glow, g);
  // Stair to the upper floors at the back of the passage.
  for (let i = 0; i < 14; i++) k.box(2.2, 0.18, 0.32, a.c + 0.9, 0.09 + i * 0.18, -6.2 - i * 0.32, stone, g);
  k.box(1.6, 3.6, 0.06, a.c - 1.25, 1.8, -D + 0.05, m.interior, g);
  k.label('POORNA SHOPPING COMPLEX', 'Shops · first & second floors ↑', 2, 0.5, a.c - 1.25, 2.4, -D + 0.12, '#7a3f48', g);
  const nb = k.label('UPPER FLOORS', 'Lift · Stairs · Restrooms', 1.2, 0.36, a.l + 0.32, 2.1, -2.6, '#3f4f4a', g);
  nb.rotation.y = Math.PI / 2;
}
