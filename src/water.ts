import * as T from 'three';
import {createCanopyRoof, canopySpec} from './canopy-model';
import {Kit} from './geometry';
import {canopies, shopConnections, waterStages, underground, complex, complexHeight} from './infrastructure';
export {canopies, shopConnections, waterStages} from './infrastructure';

/** The seven rain harvesters of the centre row: column, petal roof, downpipe and lamp ring. */
export function buildCanopies(k: Kit) {
  const bronze = k.materials.get('metal', 0x92734b);
  const footing = k.materials.get('stone', 0xc8b999);
  const membrane = new T.MeshPhysicalMaterial({color: 0xf1e9cf, roughness: 0.6, emissive: 0xe6dabc, emissiveIntensity: 0.2, metalness: 0.05, side: T.DoubleSide, clearcoat: 0.12});
  for (const c of canopies) {
    const g = new T.Group();
    g.position.set(c.x, 0, c.z);
    k.root.add(g);
    const y0 = canopySpec.baseHeight;
    k.cylinder(0.19, y0, c.x, y0 / 2, c.z, bronze);
    k.cylinder(0.34, 0.12, c.x, 0.07, c.z, footing);
    k.cylinder(0.25, 0.38, c.x, 0.24, c.z, bronze);
    for (let a = 0; a < 6; a++) {
      const t = (a * Math.PI) / 3;
      k.cylinder(0.025, 0.035, c.x + Math.cos(t) * 0.27, 0.15, c.z + Math.sin(t) * 0.27, bronze);
    }
    g.add(createCanopyRoof(c.side, membrane, bronze));
    k.cylinder(0.24, 0.08, c.x, y0 + 0.12, c.z, bronze);
    k.cylinder(0.15, 0.025, c.x, y0 + 0.17, c.z, k.materials.get('metal', 0x3d4a43));
    // Lamp ring under the petal and a plaque naming the collector.
    const ring = k.mesh(new T.TorusGeometry(0.42, 0.035, 8, 32), k.materials.glow);
    ring.rotation.x = Math.PI / 2;
    ring.position.set(c.x, 3.3, c.z);
    for (const s of [-1, 1]) {
      const plaque = k.label(`${c.id} · RAIN HARVESTER`, 'Feeds the underground tank', 0.5, 0.16, c.x + s * 0.2, 1.35, c.z, '#426b70');
      plaque.rotation.y = s * Math.PI / 2;
    }
    // Flush inspection hatch beside each concealed downpipe.
    k.box(0.6, 0.025, 0.45, c.x, 0.025, c.z + 0.62, k.materials.get('metal', 0x5d6961));
  }
}

let flowTexture: T.CanvasTexture | undefined;
function flow() {
  if (flowTexture) return flowTexture;
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 16;
  const ctx = c.getContext('2d')!;
  const g = ctx.createLinearGradient(0, 0, 128, 0);
  g.addColorStop(0, '#5a5a5a');
  g.addColorStop(0.7, '#ffffff');
  g.addColorStop(1, '#5a5a5a');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 16);
  flowTexture = new T.CanvasTexture(c);
  flowTexture.wrapS = flowTexture.wrapT = T.RepeatWrapping;
  return flowTexture;
}

/** The underground rainwater system, revealed when the paving turns see-through. */
export class WaterNetwork {
  readonly group = new T.Group();
  private materials: T.MeshStandardMaterial[] = [];
  private paving: T.MeshStandardMaterial;
  private pavingState: {opacity: number; transparent: boolean; depthWrite: boolean};
  constructor(scene: T.Scene, floor: T.Mesh) {
    this.group.name = 'water-network';
    this.group.visible = false;
    scene.add(this.group);
    this.paving = floor.material as T.MeshStandardMaterial;
    this.pavingState = {opacity: this.paving.opacity, transparent: this.paving.transparent, depthWrite: this.paving.depthWrite};
    this.build();
  }
  get visible() {
    return this.group.visible;
  }
  setVisible(v: boolean) {
    this.group.visible = v;
    Object.assign(this.paving, v ? {opacity: 0.1, transparent: true, depthWrite: false} : this.pavingState);
    this.paving.needsUpdate = true;
  }
  update(dt: number) {
    if (!this.group.visible) return;
    for (const m of this.materials) if (m.map) m.map.offset.x -= dt * 1.4;
  }
  private pipe(points: T.Vector3[], radius: number, color: number) {
    const curve = points.length > 2 ? new T.CatmullRomCurve3(points, false, 'catmullrom', 0.05) : new T.LineCurve3(points[0], points[1]);
    const length = curve.getLength();
    const map = flow().clone();
    map.repeat.set(Math.max(1, Math.round(length / 0.9)), 1);
    map.needsUpdate = true;
    const mat = new T.MeshStandardMaterial({color, emissive: color, emissiveIntensity: 1.3, emissiveMap: map, map, roughness: 0.4, depthTest: true});
    this.materials.push(mat);
    const mesh = new T.Mesh(new T.TubeGeometry(curve as T.Curve<T.Vector3>, Math.max(8, Math.round(length * 2)), radius, 8, false), mat);
    this.group.add(mesh);
    return mesh;
  }
  private block(w: number, h: number, d: number, x: number, y: number, z: number, color: number, opacity = 1) {
    const mesh = new T.Mesh(new T.BoxGeometry(w, h, d), new T.MeshStandardMaterial({color, roughness: 0.7, transparent: opacity < 1, opacity, depthWrite: opacity >= 1}));
    mesh.position.set(x, y, z);
    this.group.add(mesh);
    return mesh;
  }
  private tag(text: string, sub: string, x: number, y: number, z: number) {
    const c = document.createElement('canvas');
    c.width = 512;
    c.height = 128;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = '#fffdf7';
    ctx.beginPath();
    ctx.roundRect(4, 4, 504, 120, 18);
    ctx.fill();
    ctx.fillStyle = '#183d32';
    ctx.font = '600 44px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(text, 256, 58, 480);
    ctx.font = '30px sans-serif';
    ctx.fillStyle = '#59665c';
    ctx.fillText(sub, 256, 100, 480);
    const tex = new T.CanvasTexture(c);
    tex.colorSpace = T.SRGBColorSpace;
    const sprite = new T.Sprite(new T.SpriteMaterial({map: tex, depthTest: false, transparent: true}));
    sprite.scale.set(3.4, 0.85, 1);
    sprite.position.set(x, y, z);
    sprite.renderOrder = 10;
    this.group.add(sprite);
  }
  private build() {
    const u = underground;
    const blue = 0x2c8c9a;
    const terra = 0xc4553a;
    const v = (x: number, y: number, z: number) => new T.Vector3(x, y, z);
    // Trench floor gives the pipes something to read against.
    const trench = new T.Mesh(new T.PlaneGeometry(17.2, 112), new T.MeshStandardMaterial({color: 0x8a8576, roughness: 1}));
    trench.rotation.x = -Math.PI / 2;
    trench.position.y = -4.2;
    this.group.add(trench);
    // Collection: a downpipe in every harvester column to a screened main down the centre line.
    for (const c of canopies) this.pipe([v(c.x, 0.05, c.z), v(c.x, u.collectionY, c.z)], 0.08, blue);
    const first = canopies[0].z;
    this.pipe([v(0, u.collectionY, first), v(0, u.collectionY, u.filter.z + 0.8)], 0.13, blue);
    this.block(1.6, 1.3, 1.6, u.filter.x, -1.35, u.filter.z, 0x9fc3c0);
    this.tag('First flush + filtration', 'Debris screen · diverts the dirty first rain', u.filter.x, 0.9, u.filter.z);
    this.pipe([v(0, -1.9, u.filter.z - 0.8), v(0, -1.9, u.tank.z + u.tank.d / 2 - 0.3), v(0, u.tank.y + u.tank.h / 2 - 0.2, u.tank.z + u.tank.d / 2 - 0.3)], 0.12, blue);
    // Underground storage tank, with its water level.
    this.block(u.tank.w, u.tank.h, u.tank.d, u.tank.x, u.tank.y, u.tank.z, 0xa9b4ad, 0.28);
    this.block(u.tank.w - 0.2, u.tank.h * 0.62, u.tank.d - 0.2, u.tank.x, u.tank.y - u.tank.h * 0.19, u.tank.z, 0x3c8fa6, 0.75);
    this.tag('Underground storage tank', 'Filtered rainwater · non-potable', u.tank.x, 1.2, u.tank.z);
    // Pump and the separate non-potable supply main under both frontages.
    this.pipe([v(u.tank.w / 2, u.tank.y, u.tank.z), v(u.pump.x - 0.4, u.tank.y, u.pump.z)], 0.11, terra);
    const pump = new T.Mesh(new T.CylinderGeometry(0.42, 0.42, 0.9, 20), new T.MeshStandardMaterial({color: 0xa6432d, roughness: 0.5, metalness: 0.3}));
    pump.position.set(u.pump.x, u.tank.y + 0.1, u.pump.z);
    this.group.add(pump);
    this.tag('Pump', 'Feeds the supply main', u.pump.x, 0.9, u.pump.z);
    this.pipe([v(u.pump.x, u.tank.y + 0.55, u.pump.z), v(u.pump.x, u.supplyY, u.pump.z)], 0.1, terra);
    for (const s of [-1, 1]) {
      this.pipe([v(u.pump.x, u.supplyY, u.pump.z), v(s * u.supplyX, u.supplyY, u.pump.z)], 0.1, terra);
      this.pipe([v(s * u.supplyX, u.supplyY, u.pump.z), v(s * u.supplyX, u.supplyY, 50)], 0.1, terra);
    }
    // One branch to every complex unit and every street shop.
    for (const shop of shopConnections) {
      const x = shop.side * u.supplyX;
      const face = shop.side * (complex.faceX + 0.3);
      this.pipe([v(x, u.supplyY, shop.z), v(face, u.supplyY, shop.z), v(face, 0.35, shop.z)], 0.045, terra);
    }
    // Risers to the complex's rooftop tanks, which feed its first and second floors.
    for (const z of u.rooftopTankZ) {
      const x = -(complex.faceX - 0.2);
      this.pipe([v(-u.supplyX, u.supplyY, z), v(x, u.supplyY, z), v(x, complexHeight + 0.2, z)], 0.07, terra);
      this.tag('Riser to rooftop tank', 'Supplies the upper floors', x + 1.4, 5, z);
    }
    this.tag('Supply to 26 complex units', 'Separate non-potable branches', -5.5, 1, 6);
    this.tag('Supply to 13 street shops', 'Separate non-potable branches', 5.5, 1, 14);
    this.tag('Collection main', 'From 7 harvesters', 0, 1, 11);
    // Engineered overflow beyond the south gateway.
    this.pipe([v(-u.tank.w / 2, u.tank.y + 0.8, u.tank.z), v(-5, u.tank.y + 0.8, u.tank.z), v(-5, -1.6, -55)], 0.09, 0x9a7645);
  }
}

export function waterDiagram() {
  const street = shopConnections.filter((c) => c.building === 'street').length;
  const units = shopConnections.length - street;
  return `<div class="water-diagram"><svg viewBox="0 0 760 340" role="img" aria-labelledby="water-diagram-title water-diagram-desc"><title id="water-diagram-title">Rainwater collection and separate supply to the complex and shops</title><desc id="water-diagram-desc">${canopies.length} centre-row harvesters feed a screened collection main, first-flush diversion, filtration and an underground tank. A pump feeds a separate non-potable main with a branch to each of ${units} complex units and ${street} street shops, plus risers to the complex rooftop tanks. Overflow is routed to an engineered outlet. Drinking water remains separate.</desc><defs><marker id="water-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0 0 6 3 0 6" fill="#426b70"/></marker></defs><path d="M28 132H730" stroke="#c5b99d" stroke-width="2" stroke-dasharray="5 5"/><text x="29" y="124" fill="#59665c" font-size="12">STREET LEVEL</text>${[115, 275, 435, 595].map((x) => `<path d="M${x - 44} 30Q${x} 90 ${x + 44} 30L${x + 25} 27Q${x} 57 ${x - 25} 27Z" fill="#e0cda9" stroke="#93784e" stroke-width="2"/><path d="M${x} 58V162" stroke="#426b70" stroke-width="4"/><circle cx="${x + 80}" cy="96" r="20" fill="#9bb87a"/><path d="M${x + 80} 116V132" stroke="#7b5b3e" stroke-width="4"/><text x="${x}" y="16" text-anchor="middle" font-size="11" fill="#183d32">HARVESTER</text>`).join('')}<path d="M115 162H595V187H480" fill="none" stroke="#426b70" stroke-width="4" marker-end="url(#water-arrow)"/><text x="230" y="155" font-size="11" fill="#426b70">COLLECTION MAIN · centre of the street</text><rect x="348" y="180" width="130" height="49" rx="4" fill="#e8ede4" stroke="#426b70"/><text x="413" y="200" text-anchor="middle" font-size="11" fill="#183d32">FIRST FLUSH</text><text x="413" y="216" text-anchor="middle" font-size="11" fill="#183d32">+ FILTRATION</text><path d="M348 204H280" stroke="#426b70" stroke-width="4" marker-end="url(#water-arrow)"/><rect x="143" y="186" width="135" height="68" rx="7" fill="#d8e6e2" stroke="#426b70" stroke-width="2"/><path d="M148 224q18-8 36 0t36 0t52 0" fill="none" stroke="#426b70"/><text x="210" y="206" text-anchor="middle" fill="#183d32" font-size="11">UNDERGROUND TANK</text><path d="M143 213H63V270H110" stroke="#9a7645" stroke-width="3" fill="none"/><text x="33" y="289" font-size="10" fill="#695631">ENGINEERED OVERFLOW</text><path d="M278 242H325" stroke="#a6432d" stroke-width="4"/><circle cx="340" cy="242" r="15" fill="#f5f1e7" stroke="#a6432d" stroke-width="2"/><path d="m335 234 12 8-12 8Z" fill="#a6432d"/><path d="M355 242H714" stroke="#a6432d" stroke-width="4"/><text x="470" y="263" font-size="11" fill="#a6432d">SEPARATE NON-POTABLE SUPPLY MAIN</text>${[['405', 'G'], ['470', 'G'], ['535', 'R'], ['600', 'S'], ['665', 'S'], ['713', 'S']].map(([x, t], i) => `<path d="M${x} 242V214" stroke="#a6432d" stroke-width="2"/><rect x="${Number(x) - 17}" y="193" width="34" height="22" fill="#f5f1e7" stroke="#a6432d"/><text x="${x}" y="208" text-anchor="middle" font-size="9" fill="#183d32">${t === 'R' ? 'ROOF' : t + (i + 1)}</text>`).join('')}<path d="M413 229V285H120" stroke="#9a7645" stroke-width="2" stroke-dasharray="4 4" fill="none"/><text x="285" y="280" text-anchor="middle" fill="#695631" font-size="10">FIRST-FLUSH DISCHARGE TO ENGINEERED OUTLET</text><text x="380" y="319" text-anchor="middle" fill="#59665c" font-size="12">Schematic only · ${canopies.length} harvesters · ${units} complex units (G) · ${street} street shops (S) · not for drinking</text></svg></div><p class="diagram-caption">Blue-green: collection. Terracotta: dedicated non-potable distribution, including risers to the complex's rooftop tanks for its upper floors. Use <strong>Show water network</strong> in the street view to see these pipes in 3D under the paving.</p><div class="water-stages">${waterStages.map((s, i) => `<span><b>0${i + 1}</b>${s}</span>`).join('')}</div><details class="connection-details"><summary>View all ${shopConnections.length} supply branches</summary><div class="connections">${shopConnections.map((c) => `<span><b>${c.id}</b> ${c.name} · ${c.building === 'complex' ? 'Shopping complex, west' : 'Street shop, east'}<small>Collection catchment → filtered storage → separate supply branch</small></span>`).join('')}</div></details><p class="engineering-note">Architectural concept only. Catchment yield, storage capacity, pipe and pump sizing, treatment, structural loading, backflow protection and overflow destination require site-specific engineering. Drinking-water pipes remain physically separate.</p>`;
}
