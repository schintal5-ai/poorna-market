import * as T from 'three';
import type {Kit} from './geometry';
import type {Props} from './props';
import {complex, complexLength, bayWidth, isArchBay, shopConnections} from './infrastructure';

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

/** Window proportions measured from the elevation (metres above each floor). */
export const windowSpec = {width: 1.78, bottom: 0.25, roundTop: 0.25 + 0.89, glassTop: 2.1, bandTop: 2.35, top: 3.45};
export const archSpec = {width: 4.8, springing: 1.6, rise: 1.9};

function windowPath<P extends T.Path>(path: P, uc: number, v0: number, grow = 0): P {
  const hw = windowSpec.width / 2 + grow;
  path.moveTo(uc - hw, v0 + windowSpec.top + grow);
  path.lineTo(uc - hw, v0 + windowSpec.roundTop);
  path.absarc(uc, v0 + windowSpec.roundTop, hw, Math.PI, 0, false);
  path.lineTo(uc + hw, v0 + windowSpec.top + grow);
  path.lineTo(uc - hw, v0 + windowSpec.top + grow);
  return path;
}

let lattice: T.CanvasTexture | undefined;
/** The pink hatched transom panels of the elevation: tinted glass behind a fine square lattice. */
function latticeTexture() {
  if (lattice) return lattice;
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 160;
  const ctx = c.getContext('2d')!;
  const g = ctx.createLinearGradient(0, 0, 0, 160);
  g.addColorStop(0, '#f4b8c0');
  g.addColorStop(1, '#e597a3');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 160);
  ctx.strokeStyle = '#fff4f2';
  ctx.lineWidth = 3;
  for (let x = 0; x <= 256; x += 21.3) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 160);
    ctx.stroke();
  }
  for (let y = 0; y <= 160; y += 21.3) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(256, y);
    ctx.stroke();
  }
  ctx.strokeStyle = '#b86c78';
  ctx.lineWidth = 6;
  ctx.strokeRect(0, 0, 256, 160);
  lattice = new T.CanvasTexture(c);
  lattice.colorSpace = T.SRGBColorSpace;
  lattice.anisotropy = 4;
  return lattice;
}

/** Builds the G+2 shopping complex of the owner's elevation along the west frontage. */
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
  const glass = new T.MeshPhysicalMaterial({color: 0x8ea4a6, transparent: true, opacity: 0.38, roughness: 0.06, metalness: 0.2, envMapIntensity: 1.2, side: T.DoubleSide});
  const transom = new T.MeshStandardMaterial({map: latticeTexture(), roughness: 0.45, emissive: 0xf0a0ac, emissiveIntensity: 0.05});
  const depth = 0.42;
  const arches: {l: number; r: number; c: number}[] = [];
  for (let b = 0; b < complex.modules * complex.baysPerModule; b++) {
    const local = b % complex.baysPerModule;
    if ((complex.archBays as readonly number[]).includes(local)) {
      const c = (b + 1) * bayWidth;
      arches.push({l: c - archSpec.width / 2, r: c + archSpec.width / 2, c});
    }
  }

  // Facade walls, one extrusion per floor with every window (and the ground-floor arches) cut through.
  for (let f = 0; f < complex.floors; f++) {
    const v0 = f * complex.floorHeight;
    const s = new T.Shape();
    s.moveTo(0, v0);
    if (f === 0)
      for (const a of arches) {
        s.lineTo(a.l, 0);
        s.lineTo(a.l, archSpec.springing);
        s.absellipse(a.c, archSpec.springing, archSpec.width / 2, archSpec.rise, Math.PI, 0, true, 0);
        s.lineTo(a.r, 0);
      }
    s.lineTo(L, v0);
    s.lineTo(L, v0 + complex.floorHeight);
    s.lineTo(0, v0 + complex.floorHeight);
    s.lineTo(0, v0);
    for (let b = 0; b < complex.modules * complex.baysPerModule; b++) {
      if (f === 0 && isArchBay(b)) continue;
      s.holes.push(windowPath(new T.Path(), (b + 0.5) * bayWidth, v0));
    }
    const geo = new T.ExtrudeGeometry(s, {depth, bevelEnabled: false, curveSegments: 14});
    const mesh = k.mesh(geo, wall, g);
    mesh.position.z = -depth;
  }
  // Parapet, floor bands, plinth, end pilasters and coping: the horizontal lines of the drawing.
  k.box(L, complex.parapet, depth, L / 2, H + complex.parapet / 2, -depth / 2, wall, g);
  k.box(L + 0.3, 0.16, 0.62, L / 2, H + complex.parapet + 0.08, -0.2, trim, g);
  for (const v of [complex.floorHeight, complex.floorHeight * 2, H]) k.box(L, 0.14, 0.12, L / 2, v, 0.05, trim, g);
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

  // Shared window parts, built once in window space and placed in every bay.
  // Lower U-shaped glazing only (below the transom band).
  const lower = new T.Shape();
  const hw = windowSpec.width / 2;
  lower.moveTo(-hw, windowSpec.glassTop);
  lower.lineTo(-hw, windowSpec.roundTop);
  lower.absarc(0, windowSpec.roundTop, hw, Math.PI, 0, false);
  lower.lineTo(hw, windowSpec.glassTop);
  lower.lineTo(-hw, windowSpec.glassTop);
  const lowerGlass = new T.ShapeGeometry(lower, 18);
  const ring = windowPath(new T.Shape(), 0, 0, 0.07);
  ring.holes.push(windowPath(new T.Path(), 0, 0));
  const frameGeo = new T.ExtrudeGeometry(ring, {depth: 0.07, bevelEnabled: false, curveSegments: 14});
  const transomGeo = new T.PlaneGeometry(windowSpec.width, windowSpec.top - windowSpec.bandTop);
  let unit = 0;
  for (let f = 0; f < complex.floors; f++)
    for (let b = 0; b < complex.modules * complex.baysPerModule; b++) {
      if (f === 0 && isArchBay(b)) continue;
      const uc = (b + 0.5) * bayWidth;
      const v0 = f * complex.floorHeight;
      const fr = k.mesh(frameGeo, frame, g);
      fr.position.set(uc, v0, -0.03);
      const gl = k.mesh(lowerGlass, glass, g);
      gl.position.set(uc, v0, -0.22);
      gl.castShadow = false;
      const tr = k.mesh(transomGeo, transom, g);
      tr.position.set(uc, v0 + (windowSpec.top + windowSpec.bandTop) / 2, -0.2);
      k.box(windowSpec.width, windowSpec.bandTop - windowSpec.glassTop, 0.1, uc, v0 + (windowSpec.glassTop + windowSpec.bandTop) / 2, -0.18, trim, g);
      k.box(0.05, windowSpec.glassTop - windowSpec.bottom, 0.06, uc, v0 + (windowSpec.glassTop + windowSpec.bottom) / 2, -0.2, frame, g);
      k.box(windowSpec.width + 0.24, 0.07, 0.24, uc, v0 + windowSpec.bottom - 0.02, 0.04, trim, g);
      if (f === 0) {
        shopUnit(k, p, g, uc, unit);
        unit++;
      } else {
        // Upper floors: lit rooms with varied blinds, so the facade never reads as a flat repeat.
        k.box(bayWidth - 0.12, complex.floorHeight - 0.3, 0.05, uc, v0 + complex.floorHeight / 2, -3.2, m.interior, g);
        const blind = (b * 7 + f * 3) % 5;
        if (blind < 3) k.box(windowSpec.width - 0.08, 0.35 + blind * 0.45, 0.02, uc, v0 + windowSpec.glassTop - (0.35 + blind * 0.45) / 2, -0.4, m.get('fabric', [0xe8dcc6, 0xd9c7a8, 0xc9d0c6][blind], 2), g);
        k.box(bayWidth - 0.12, 0.05, 3, uc, v0 + 0.02, -1.7, m.get('wood', 0x8a6b4c), g);
        k.box(0.06, complex.floorHeight - 0.3, 3, (b + 1) * bayWidth, v0 + complex.floorHeight / 2, -1.7, m.get('plaster', 0xe9e2d5), g);
      }
    }
  for (const a of arches) archway(k, g, a, pinkPlaster, frame, trim, stone);
}

/** A ground-floor shopfront: glazed U-window, name board in the transom band, and a lit shop behind. */
function shopUnit(k: Kit, p: Props, g: T.Group, uc: number, unit: number) {
  const m = k.materials;
  const name = unitNames[unit % unitNames.length];
  const connection = shopConnections.filter((c) => c.building === 'complex')[unit];
  if (connection) connection.name = name[0];
  const plaque = k.label(name[0], name[1], windowSpec.width - 0.06, windowSpec.bandTop - windowSpec.glassTop - 0.03, uc, (windowSpec.glassTop + windowSpec.bandTop) / 2, -0.12, ['#3f4f4a', '#7a3f48', '#2f4a5c', '#6b5536'][unit % 4], g);
  plaque.castShadow = false;
  const w = bayWidth - 0.16;
  const back = -5;
  k.box(w, 3.9, 0.06, uc, 1.95, back, m.interior, g);
  k.box(w, 0.05, -back, uc, 0.03, back / 2, m.get('stone', 0xd8cdb6, 2), g);
  k.box(0.08, 3.9, -back, uc + bayWidth / 2 - 0.04, 1.95, back / 2, m.get('plaster', 0xeee6d8), g);
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

/** One of the great arched entrances: pink spandrels, framed opening and a lit passage with stairs. */
function archway(k: Kit, g: T.Group, a: {l: number; r: number; c: number}, pink: T.Material, frame: T.Material, trim: T.Material, stone: T.Material) {
  const m = k.materials;
  const s = new T.Shape();
  s.moveTo(a.l, archSpec.springing);
  s.lineTo(a.l, complex.floorHeight - 0.08);
  s.lineTo(a.r, complex.floorHeight - 0.08);
  s.lineTo(a.r, archSpec.springing);
  s.absellipse(a.c, archSpec.springing, archSpec.width / 2, archSpec.rise, 0, Math.PI, false, 0);
  const spandrel = k.mesh(new T.ShapeGeometry(s, 24), pink, g);
  spandrel.position.z = 0.015;
  const curve = new T.EllipseCurve(a.c, archSpec.springing, archSpec.width / 2, archSpec.rise, 0, Math.PI, false, 0);
  const pts = curve.getPoints(32).map((v) => new T.Vector3(v.x, v.y, 0.04));
  k.tube([new T.Vector3(a.r, 0, 0.04), ...pts, new T.Vector3(a.l, 0, 0.04)], 0.05, frame, g);
  for (const u of [a.l - 0.05, a.r + 0.05]) k.box(0.1, complex.floorHeight, 0.1, u, complex.floorHeight / 2, 0.05, frame, g);
  k.box(0.5, 0.42, 0.12, a.c, archSpec.springing + archSpec.rise + 0.1, 0.07, trim, g);
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
