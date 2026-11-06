import * as T from 'three';
import {Kit} from './geometry';
import {Props} from './props';
import {vendors} from './data';
import {buildCanopies} from './water';
import {shopConnections, trees, seatWall, basketStand} from './infrastructure';
import {buildComplex} from './complex';

const shopNames = [['Ratnam General Stores', 'జనరల్ స్టోర్స్'], ['Padma Silks', 'పద్మ సిల్క్స్'], ['The Pickle Pantry', 'పచ్చళ్ళు'], ['Sri Ganesh Utensils', 'వంట పాత్రలు'], ['Jasmine & Marigold', 'మల్లెపూలు'], ['Kerala Bhavan', 'కేరళ భవన్'], ['Heritage Tailors', 'దర్జీ దుకాణం'], ['Clay & Copper', 'మట్టి రాగి'], ['The Paper Shop', 'కాగితం దుకాణం'], ['Farmers’ Collective', 'రైతు బజార్'], ['Annapurna Tiffin', 'అన్నపూర్ణ టిఫిన్'], ['Sea Salt & Spice', 'ఉప్పు మసాలా'], ['The Courtyard Collective', 'పూర్ణ మార్కెట్']];
const shopTypes = ['produce', 'textiles', 'produce', 'brass', 'flowers', 'food', 'textiles', 'brass', 'books', 'produce', 'food', 'produce', 'craft'];

export interface Architecture {floor: T.Mesh}

export function buildArchitecture(k: Kit): Architecture {
  const p = new Props(k);
  const m = k.materials;
  // Paving: kept out of batching so the water-network view can make it see-through.
  const paving = m.get('stone', 0xf6edda).clone();
  for (const map of [paving.map, paving.normalMap, paving.roughnessMap]) if (map) {
    map.repeat.set(17.2 / 2.4, 112 / 2.4);
  }
  const floor = k.mesh(new T.PlaneGeometry(17.2, 112), paving);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.005;
  floor.castShadow = false;
  floor.userData.noBatch = true;
  // Terracotta borders mark the promenade edges; brass drainage strips run beside the stalls.
  for (const s of [-1, 1]) {
    k.box(0.13, 0.015, 106, s * 5.0, 0.012, 0, m.get('ceramic', 0x995944));
    k.box(0.12, 0.025, 106, s * 7.9, 0.014, 0, m.get('metal', 0x677064));
    for (let z = -52; z < 54; z += 0.4) k.box(0.1, 0.012, 0.035, s * 7.9, 0.032, z, m.get('plain', 0x263b32));
  }
  // A distinct central band under the harvester and tree row.
  k.box(2.3, 0.012, 82, 0, 0.008, -1, m.get('stone', 0xd9c7a4, 6));
  for (const s of [-1, 1]) k.box(0.08, 0.016, 82, s * 1.2, 0.012, -1, m.get('ceramic', 0x995944));

  buildComplex(k, p);
  buildStreetShops(k, p);
  buildVendors(k, p);

  // Centre row: rain harvesters alternate with trees ringed by circular seat walls.
  buildCanopies(k);
  for (const t of trees) {
    p.tree(t.x, t.z, false);
    seat(k, t.x, t.z);
  }
  for (const z of [-40, -16, 8, 32, 44]) for (const s of [-1, 1]) p.lantern(s * 7.95, z + 2.4);
  for (const z of [-42, -18, 6, 30]) for (const s of [-1, 1]) p.bench(s * 5.5, z + 2.5, s);

  // Basket stand at the entrance (the baskets themselves are interactive, see shopping.ts).
  const st = basketStand;
  k.box(st.w, 0.06, st.d, st.x, 0.86, st.z, m.get('wood', 0x9f8662));
  for (const dx of [-1, 1]) for (const dz of [-1, 1]) k.box(0.06, 0.84, 0.06, st.x + dx * (st.w / 2 - 0.08), 0.42, st.z + dz * (st.d / 2 - 0.08), m.get('metal', 0x4f6251));
  k.box(st.w - 0.1, 0.04, st.d - 0.1, st.x, 0.3, st.z, m.get('wood', 0x786245));
  k.cylinder(0.025, 1.9, st.x - st.w / 2 + 0.05, 0.95, st.z, m.get('metal', 0x4f6251));
  const sign = k.label('Take a basket', 'Pick goods from any stall', 0.95, 0.32, st.x - st.w / 2 + 0.05, 1.95, st.z, '#a6432d');
  sign.position.x += 0.48;
  const back = k.label('Take a basket', 'Pick goods from any stall', 0.95, 0.32, st.x - st.w / 2 + 0.53, 1.95, st.z, '#a6432d');
  back.rotation.y = Math.PI;

  // Gateways at both ends.
  for (const z of [-54, 55]) {
    const g = new T.Group();
    g.position.z = z;
    g.rotation.y = z < 0 ? 0 : Math.PI;
    k.root.add(g);
    k.box(24, 7.6, 3, 0, 3.8, -1.5, m.get('plaster', 0xdcd0b7, 3), g);
    for (let x = -10; x <= 10; x += 2.5) {
      k.arch(1.75, 3.5, x, 0.05, 0.035, m.get('wood', 0x536151), g);
      k.box(0.2, 3.6, 0.25, x - 1, 1.8, 0.2, m.get('plaster', 0xe9dcc1), g);
      k.arch(1.1, 1.4, x, 5.3, 0.05, m.get('wood', 0x6a7461), g);
    }
    k.box(25, 0.2, 0.9, 0, 4.2, 0.25, m.get('plaster', 0xe7d8ba), g);
    k.box(25, 0.2, 3.5, 0, 7.65, -1.5, m.get('plaster', 0xe7d8ba), g);
    k.label(z < 0 ? 'POORNA SQUARE' : 'POORNA MARKET', 'పూర్ణ మార్కెట్ · విశాఖపట్నం', 7.4, 0.85, 0, 4.78, 0.1, '#775a40', g);
  }
  // Community square: benches, a separate drinking-water point and segregated waste bins.
  for (const s of [-1, 1]) p.bench(s * 4.4, -46, s);
  k.box(1, 0.95, 0.75, 6.8, 0.48, -44, m.get('stone', 0xd4c7a6));
  k.cylinder(0.22, 0.08, 6.8, 1, -44, m.get('metal', 0x9fa79a));
  k.tube([new T.Vector3(6.8, 1, -44.2), new T.Vector3(6.8, 1.3, -44.2), new T.Vector3(6.8, 1.3, -44)], 0.025, m.get('metal', 0xadb3a6));
  k.label('DRINKING WATER', 'Mains supply · not harvested', 0.7, 0.24, 6.8, 0.72, -43.6, '#426b70');
  for (let i = 0; i < 3; i++) {
    k.box(0.45, 0.85, 0.45, -6.3 + i * 0.55, 0.43, -44, m.get('metal', [0x5f745c, 0x9c8053, 0x5c7880][i]));
    k.box(0.48, 0.06, 0.48, -6.3 + i * 0.55, 0.9, -44, m.get('metal', 0x46584e));
  }
  k.batch();
  return {floor};
}

/** Circular seat wall around a centre-row tree. */
function seat(k: Kit, x: number, z: number) {
  const m = k.materials;
  const ring = (outer: number, inner: number, h: number, y: number, mat: T.Material) => {
    const s = new T.Shape();
    s.absarc(0, 0, outer, 0, Math.PI * 2, false);
    const hole = new T.Path();
    hole.absarc(0, 0, inner, 0, Math.PI * 2, true);
    s.holes.push(hole);
    const mesh = k.mesh(new T.ExtrudeGeometry(s, {depth: h, bevelEnabled: false, curveSegments: 40}), mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(x, y, z);
    return mesh;
  };
  ring(seatWall.outer, seatWall.inner, seatWall.height - 0.06, 0, m.get('stone', 0xc9b996, 0.8));
  ring(seatWall.outer + 0.04, seatWall.inner - 0.03, 0.06, seatWall.height - 0.06, m.get('wood', 0xa0805a, 0.6));
  ring(seatWall.outer + 0.02, seatWall.outer - 0.06, 0.08, 0, m.get('stone', 0x8f8470));
  const soil = k.cylinder(seatWall.inner, 0.02, x, seatWall.height - 0.12, z, m.get('plain', 0x4a3f2c));
  soil.castShadow = false;
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2 + 0.3;
    k.ellipsoid(x + Math.cos(a) * 0.4, seatWall.height - 0.05, z + Math.sin(a) * 0.4, 0.13, 0.08, 0.13, m.get('leaf', [0x5f7d3c, 0x7c8f45, 0x4f6d3a][i % 3]));
  }
  // Low uplights set into the wall face.
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    k.box(0.12, 0.05, 0.03, x + Math.cos(a) * (seatWall.outer + 0.005), 0.12, z + Math.sin(a) * (seatWall.outer + 0.005), m.glow).rotation.y = -a + Math.PI / 2;
  }
}

/** The thirteen existing shops on the east frontage, unchanged from the previous edition. */
function buildStreetShops(k: Kit, p: Props) {
  const m = k.materials;
  shopConnections.filter((c) => c.building === 'street').forEach((connection, j) => {
    const i = j + 13;
    const side = connection.side;
    const z = connection.z;
    const g = new T.Group();
    g.position.set(side * 8.65, 0, z);
    g.rotation.y = side < 0 ? Math.PI / 2 : -Math.PI / 2;
    k.root.add(g);
    const h = 7.1 + (i % 5) * 0.48;
    const col = [0xe9dfc7, 0xd7d4bc, 0xe2cab5, 0xc7cbb7, 0xd7c2a4, 0xdbd3c7][i % 6];
    const plaster = m.get('plaster', col, 2);
    const trim = m.get('plaster', 0xeee3cb);
    const wood = m.get('wood', [0x7b5b3e, 0x476354, 0x665a43][i % 3]);
    const dark = m.get('plain', 0x324538);
    k.box(7.88, h - 3.35, 4.7, 0, 3.35 + (h - 3.35) / 2, -2.3, plaster, g);
    k.box(0.28, 3.35, 3.5, -3.78, 1.67, -1.6, plaster, g);
    k.box(0.28, 3.35, 3.5, 3.78, 1.67, -1.6, plaster, g);
    k.box(7.5, 3.3, 0.14, 0, 1.65, -3.4, m.get('plaster', 0xb9ab8a), g);
    k.box(7.5, 0.08, 3.6, 0, 0.04, -1.6, m.get('stone', 0xc8bea5, 2), g);
    k.box(8.1, 0.19, 5, 0, h, -2.2, trim, g);
    k.box(8, 0.14, 0.48, 0, 3.34, 0.09, trim, g);
    k.box(8, 0.13, 0.25, 0, 3.13, 0.18, m.get('wood', 0x77664b), g);
    // Open shutter leaves reveal shelves, counters and a lit back wall rather than a flat door plane.
    for (const x of [-3.35, 3.35]) {
      k.box(0.52, 2.72, 0.12, x, 1.4, 0.12, wood, g);
      for (let a = 0; a < 18; a++) k.box(0.48, 0.025, 0.05, x, 0.22 + a * 0.14, 0.2, m.get('wood', 0x9a7d53), g);
    }
    for (const x of i % 4 === 2 ? [-1.9, 1.9] : [-2.5, 0, 2.5]) {
      const yy = 4.05;
      if (i % 4 === 1 || i % 4 === 2) k.box(1.42, 1.78, 0.05, x, yy + 0.89, 0.065, dark, g);
      else k.arch(1.42, 1.95, x, yy, 0.065, dark, g);
      k.box(0.06, 1.72, 0.09, x, yy + 0.85, 0.12, trim, g);
      k.box(1.35, 0.06, 0.1, x, yy + 0.86, 0.13, trim, g);
      k.box(1.65, 0.14, 0.38, x, yy, 0.16, trim, g);
      for (const s of [-1, 1]) k.box(0.18, 1.65, 0.1, x + s * 0.77, yy + 0.83, 0.08, wood, g);
      if (h > 8.2) k.box(1.2, 0.42, 0.1, x, h - 0.65, 0.08, wood, g);
    }
    const label = shopNames[j];
    connection.name = label[0];
    k.label(label[0], label[1], 6.1, 0.72, 0, 2.85, 0.31, i % 4 === 0 ? '#e4d6b9' : i % 4 === 1 ? '#4c5f50' : i % 4 === 2 ? '#7f5c45' : '#556b70', g);
    const type = shopTypes[j];
    const shelfMat = m.get('wood', 0xb09874);
    for (let shelf = 0; shelf < 4; shelf++) {
      k.box(6.5, 0.065, 0.45, 0, 0.55 + shelf * 0.54, -2.87, shelfMat, g);
      for (let q = 0; q < 10; q++) {
        if (type === 'books' || type === 'textiles' || type === 'brass') p.product(type, -2.85 + q * 0.62, 0.59 + shelf * 0.54, -2.87, q, g, false);
        else if (type === 'craft' && q % 3 === 0) k.box(0.38, 0.22, 0.36, -2.85 + q * 0.62, 0.71 + shelf * 0.54, -2.87, m.get('fabric', [0xbb7761, 0x668d8b, 0xc8b782][q % 3]), g);
        else k.cylinder(0.095, 0.24, -2.85 + q * 0.62, 0.72 + shelf * 0.54, -2.87, m.get('ceramic', [0x9f6e49, 0xbdad79, 0x63806d, 0xd5c8ab][(q + shelf) % 4]), g);
      }
    }
    if (type === 'textiles')
      for (let q = 0; q < 4; q++) {
        const cloth = new T.PlaneGeometry(0.75, 1.35, 8, 12);
        const a = cloth.getAttribute('position');
        for (let n = 0; n < a.count; n++) a.setZ(n, Math.sin(a.getX(n) * 32) * 0.055);
        cloth.computeVertexNormals();
        const hanging = k.mesh(cloth, m.get('fabric', [0xae6656, 0x62867d, 0xb4a16a, 0x80728c][q]), g);
        hanging.position.set(-2.5 + q * 1.65, 1.85, -2.5);
        hanging.material.side = T.DoubleSide;
      }
    k.box(4.3, 0.85, 0.85, 0, 0.46, -1.4, shelfMat, g);
    k.box(4.5, 0.07, 1, 0, 0.92, -1.4, m.get('stone', 0xe2d4b5), g);
    for (let q = 0; q < 8; q++) p.product(type, -1.8 + q * 0.5, 0.96, -1.4, q, g);
    k.box(5, 0.035, 0.08, 0, 2.65, -1.8, m.glow, g);
    k.label('LOCAL GOODS · EVERYDAY STORIES', `${connection.id} · POORNA MARKET`, 2.7, 0.35, 0, 2.04, -3.25, '#5b6150', g);
    if (i % 3 !== 0) {
      const glass = new T.MeshPhysicalMaterial({color: 0xc9d6cd, transparent: true, opacity: 0.24, roughness: 0.12, metalness: 0.15, side: T.DoubleSide});
      for (const x of [-2.75, 2.75]) {
        k.box(0.7, 2.2, 0.025, x, 1.15, 0.04, glass, g);
        for (const xx of [-0.39, 0.39]) k.box(0.04, 2.3, 0.06, x + xx, 1.15, 0.12, m.get('metal', 0x647668), g);
      }
    }
    // Facade variation: balconies, roof tiles, pipes, notice boards and planted window boxes.
    if (i % 3 !== 0) {
      k.box(6.7, 0.15, 1.05, 0, 3.88, 0.45, trim, g);
      for (let q = 0; q < 23; q++) k.box(0.035, 0.65, 0.035, -3.2 + q * 0.29, 4.25, 0.91, m.get('metal', 0x445747), g);
      k.box(6.8, 0.045, 0.06, 0, 4.6, 0.91, m.get('metal', 0x445747), g);
    }
    for (let q = 0; q < 25; q++) {
      const tile = k.cylinder(0.13, 1, -3.85 + q * 0.32, h + 0.13, -0.25, m.get('ceramic', 0xa57859), g);
      tile.rotation.x = Math.PI / 2;
    }
    k.cylinder(0.035, h, -3.6, h / 2, 0.18, m.get('metal', 0x8c8d78), g);
    k.label(i % 2 ? 'OPEN DAILY' : 'LOCALLY MADE', i % 2 ? 'Fresh arrivals' : 'Since yesterday, for tomorrow', 0.65, 0.8, 2.9, 1.5, 0.26, '#895e42', g);
  });
}

/** The twenty hawker stalls that face the promenades from both sides. */
function buildVendors(k: Kit, p: Props) {
  const m = k.materials;
  vendors.forEach((v, i) => {
    const g = new T.Group();
    g.position.set(v.side * 5.95, 0, v.z);
    g.rotation.y = v.side < 0 ? Math.PI / 2 : -Math.PI / 2;
    k.root.add(g);
    const wood = m.get('wood', 0x9f8662);
    k.box(3.9, 0.93, 1.4, 0, 0.5, 0, wood, g);
    k.box(4.1, 0.09, 1.65, 0, 1.02, 0, m.get('stone', 0xe1d4b8), g);
    for (let q = 0; q < 12; q++) k.box(0.025, 0.76, 0.06, -1.8 + q * 0.33, 0.53, 0.73, m.get('wood', 0x786245), g);
    for (const x of [-1.9, 1.9]) k.box(0.065, 2.7, 0.065, x, 1.4, -0.7, m.get('metal', 0x4f6251), g);
    for (let q = 0; q < 16; q++) {
      const a = k.box(0.265, 0.025, 2.4, -1.98 + q * 0.265, 2.72, 0.25, m.get('fabric', q % 2 ? 0xe9ddc2 : v.color, 2), g);
      a.rotation.x = 0.12;
      k.box(0.265, 0.17, 0.035, -1.98 + q * 0.265, 2.49, 1.42, m.get('fabric', q % 2 ? 0xe9ddc2 : v.color, 2), g);
    }
    const t = ['produce', 'flowers', 'craft', 'food'].indexOf(v.type);
    const name = [['Rythu Fresh', 'రైతు తాజా'], ['Padma Flowers', 'పద్మ పూలు'], ['Coastal Makers', 'హస్తకళలు'], ['Amma’s Tiffin', 'అమ్మ టిఫిన్']][t];
    k.label(name[0], name[1], 2.55, 0.5, 0, 2.16, -0.64, '#365347', g);
    p.display(v.type, g, 3.7, 0.9, 1.07);
    p.basket(0, 2.62, -0.1, 0.3, g);
    k.label(['TOMATO · MANGO · GREENS', 'JASMINE · MARIGOLD', 'HANDMADE IN ANDHRA', 'TEA · TIFFIN · COFFEE'][t], 'Pick one up to look closer', 1.7, 0.22, 0, 0.7, 0.77, '#7c603d', g);
    k.label('UPI', 'PAY HERE', 0.22, 0.28, 1.65, 1.25, 0.68, '#efe6cd', g);
    k.box(3, 0.035, 0.045, 0, 2.47, -0.55, m.glow, g);
  });
}
