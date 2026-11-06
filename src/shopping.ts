import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {vendors} from './data.ts';
import {basketStand} from './infrastructure.ts';

/** Goods that can be picked up from the hawker stalls, put in a basket and put back. */
export type ItemKind = 'tomato' | 'mango' | 'cabbage' | 'lemon' | 'banana' | 'marigold' | 'rose' | 'jasmine' | 'pot' | 'box' | 'cup' | 'tiffin';
export const itemNames: Record<ItemKind, string> = {
  tomato: 'Tomato', mango: 'Mango', cabbage: 'Cabbage', lemon: 'Lemon', banana: 'Bananas', marigold: 'Marigold bunch', rose: 'Rose bunch', jasmine: 'Jasmine string', pot: 'Clay pot', box: 'Kalamkari box', cup: 'Tea glass', tiffin: 'Steel tiffin',
};
const stallKinds: Record<string, ItemKind[]> = {
  produce: ['tomato', 'mango', 'cabbage', 'lemon', 'banana', 'tomato'],
  flowers: ['marigold', 'rose', 'jasmine', 'marigold', 'rose', 'jasmine'],
  craft: ['pot', 'box', 'pot', 'box', 'pot', 'box'],
  food: ['cup', 'tiffin', 'cup', 'tiffin', 'cup', 'tiffin'],
};
/** Front-row positions on each stall counter, in stall space (+z faces the promenade). */
export const counterSlots = Array.from({length: 6}, (_, i) => ({x: -1.55 + i * 0.62, y: 1.07, z: 0.58}));

export interface Item {id: number; kind: ItemKind; name: string; stall: number; home: T.Matrix4; state: 'home' | 'held' | 'moving' | 'basket'; mesh?: T.Mesh}

function painted(geo: T.BufferGeometry, color: number) {
  const g = geo.index ? geo.toNonIndexed() : geo;
  for (const name of Object.keys(g.attributes)) if (!['position', 'normal'].includes(name)) g.deleteAttribute(name);
  const c = new T.Color(color);
  const colors = new Float32Array(g.getAttribute('position').count * 3);
  for (let i = 0; i < colors.length; i += 3) colors.set([c.r, c.g, c.b], i);
  g.setAttribute('color', new T.BufferAttribute(colors, 3));
  return g;
}
const at = (geo: T.BufferGeometry, x: number, y: number, z: number, sx = 1, sy = sx, sz = sx, ry = 0, rz = 0) => geo.applyMatrix4(new T.Matrix4().compose(new T.Vector3(x, y, z), new T.Quaternion().setFromEuler(new T.Euler(0, ry, rz)), new T.Vector3(sx, sy, sz)));
const sphere = () => new T.SphereGeometry(1, 14, 10);

/** One merged, vertex-coloured geometry per kind, with its base at y = 0. */
export function itemGeometry(kind: ItemKind): T.BufferGeometry {
  const parts: T.BufferGeometry[] = [];
  const add = (g: T.BufferGeometry, color: number) => parts.push(painted(g, color));
  switch (kind) {
    case 'tomato':
      add(at(sphere(), 0, 0.075, 0, 0.085, 0.072, 0.085), 0xc6402a);
      for (let q = 0; q < 5; q++) add(at(new T.BoxGeometry(0.06, 0.008, 0.02), Math.cos(q * 1.26) * 0.024, 0.146, Math.sin(q * 1.26) * 0.024, 1, 1, 1, -q * 1.26), 0x456e32);
      break;
    case 'mango':
      add(at(sphere(), 0, 0.075, 0, 0.1, 0.075, 0.065, 0, 0.35), 0xe0aa32);
      add(at(new T.CylinderGeometry(0.01, 0.01, 0.035, 6), -0.03, 0.15, 0), 0x58613b);
      break;
    case 'cabbage':
      for (let q = 0; q < 5; q++) add(at(sphere(), Math.sin(q) * 0.03, 0.08 + q * 0.01, Math.cos(q) * 0.025, 0.11 - q * 0.008, 0.075, 0.095, q * 1.8), [0x7c973e, 0xa1ac57, 0x60863c][q % 3]);
      break;
    case 'lemon':
      add(at(sphere(), 0, 0.05, 0, 0.065, 0.05, 0.05), 0xe8d043);
      add(at(sphere(), 0.065, 0.05, 0, 0.012), 0xc8b034);
      break;
    case 'banana':
      for (let q = 0; q < 4; q++) {
        const curve = new T.CatmullRomCurve3([new T.Vector3(-0.11, 0.04, q * 0.04 - 0.06), new T.Vector3(0, 0.1, q * 0.04 - 0.06), new T.Vector3(0.12, 0.09, q * 0.04 - 0.06)]);
        add(new T.TubeGeometry(curve, 10, 0.022, 6, false), 0xdcbc45);
      }
      add(at(new T.CylinderGeometry(0.015, 0.02, 0.06, 6), -0.12, 0.05, 0, 1, 1, 1, 0, 1), 0x5b4a2a);
      break;
    case 'marigold':
    case 'rose':
    case 'jasmine': {
      const petal = {marigold: 0xe29a1c, rose: 0xc23a5c, jasmine: 0xf6f1e2}[kind];
      for (let s = 0; s < 5; s++) {
        const a = (s / 5) * Math.PI * 2;
        const x = Math.cos(a) * 0.035;
        const z = Math.sin(a) * 0.035;
        add(at(new T.CylinderGeometry(0.006, 0.006, 0.28, 5), x * 0.5, 0.14, z * 0.5, 1, 1, 1, 0, x * 2), 0x527142);
        add(at(sphere(), x * 1.6, 0.29, z * 1.6, kind === 'jasmine' ? 0.025 : 0.04, kind === 'jasmine' ? 0.025 : 0.03, kind === 'jasmine' ? 0.025 : 0.04), petal);
      }
      add(at(new T.CylinderGeometry(0.03, 0.022, 0.06, 10), 0, 0.08, 0), 0xb59a6a);
      break;
    }
    case 'pot': {
      const pts = [new T.Vector2(0.045, 0), new T.Vector2(0.09, 0.05), new T.Vector2(0.1, 0.13), new T.Vector2(0.055, 0.2), new T.Vector2(0.04, 0.24), new T.Vector2(0.052, 0.25)];
      add(new T.LatheGeometry(pts, 18), 0xb06844);
      add(new T.TorusGeometry(0.098, 0.006, 4, 24).rotateX(Math.PI / 2).translate(0, 0.12, 0), 0xefe1c0);
      break;
    }
    case 'box':
      add(at(new T.BoxGeometry(0.2, 0.08, 0.14), 0, 0.04, 0), 0x3e706b);
      add(at(new T.BoxGeometry(0.21, 0.012, 0.15), 0, 0.086, 0), 0xb35444);
      add(at(new T.BoxGeometry(0.06, 0.004, 0.06), 0, 0.093, 0), 0xd4a24c);
      break;
    case 'cup':
      add(new T.CylinderGeometry(0.038, 0.03, 0.09, 14).translate(0, 0.045, 0), 0xd9e1e0);
      add(new T.CylinderGeometry(0.034, 0.034, 0.004, 14).translate(0, 0.075, 0), 0x8a5a2b);
      break;
    case 'tiffin':
      for (let t = 0; t < 3; t++) add(new T.CylinderGeometry(0.07, 0.07, 0.06, 18).translate(0, 0.035 + t * 0.065, 0), 0xb9bfbd);
      add(new T.TorusGeometry(0.05, 0.007, 5, 16, Math.PI).translate(0, 0.21, 0), 0x8c918f);
      break;
  }
  const merged = mergeGeometries(parts, false)!;
  merged.computeBoundingSphere();
  parts.forEach((p) => p.dispose());
  return merged;
}

/** World matrix of a stall's counter slot (matches the stall groups in architecture.ts). */
export function slotMatrix(stall: number, slot: number) {
  const v = vendors[stall];
  const s = counterSlots[slot];
  const stallM = new T.Matrix4().compose(new T.Vector3(v.side * 5.95, 0, v.z), new T.Quaternion().setFromAxisAngle(new T.Vector3(0, 1, 0), v.side < 0 ? Math.PI / 2 : -Math.PI / 2), new T.Vector3(1, 1, 1));
  return stallM.multiply(new T.Matrix4().compose(new T.Vector3(s.x, s.y, s.z), new T.Quaternion().setFromAxisAngle(new T.Vector3(0, 1, 0), slot * 0.9), new T.Vector3(1, 1, 1)));
}

const BASKET_SLOTS = Array.from({length: 18}, (_, i) => {
  const layer = Math.floor(i / 6);
  const a = (i % 6) / 6 * Math.PI * 2 + layer * 0.5;
  const r = i % 6 === 0 && layer === 0 ? 0 : 0.11;
  return new T.Vector3(Math.cos(a) * r, 0.035 + layer * 0.07, Math.sin(a) * r);
});
const zero = new T.Matrix4().makeScale(0, 0, 0);
const ITEM_IN_BASKET_SCALE = 0.72;

interface Tween {item: Item; from: T.Matrix4; t: number; to: () => T.Matrix4; done: () => void}

export class Shopping {
  readonly items: Item[] = [];
  readonly root = new T.Group();
  readonly basket = new T.Group();
  basketTaken = false;
  onChange: (() => void) | undefined;
  onMessage: ((text: string) => void) | undefined;
  private meshes = new Map<ItemKind, T.InstancedMesh>();
  private index = new Map<ItemKind, Item[]>();
  private geometries = new Map<ItemKind, T.BufferGeometry>();
  private material = new T.MeshStandardMaterial({vertexColors: true, roughness: 0.55});
  private tweens: Tween[] = [];
  private standBaskets: T.Object3D[] = [];
  private tmp = new T.Matrix4();

  private scene: T.Scene;
  constructor(scene: T.Scene, makeBasket: (width: number) => T.Object3D) {
    this.scene = scene;
    this.root.name = 'shopping';
    scene.add(this.root);
    let id = 0;
    vendors.forEach((v, stall) => stallKinds[v.type].forEach((kind, slot) => {
      const item: Item = {id: id++, kind, name: itemNames[kind], stall, home: slotMatrix(stall, slot), state: 'home'};
      this.items.push(item);
      if (!this.index.has(kind)) this.index.set(kind, []);
      this.index.get(kind)!.push(item);
    }));
    for (const [kind, list] of this.index) {
      const geo = itemGeometry(kind);
      this.geometries.set(kind, geo);
      const mesh = new T.InstancedMesh(geo, this.material, list.length);
      mesh.name = `items-${kind}`;
      mesh.userData.kind = kind;
      list.forEach((item, i) => mesh.setMatrixAt(i, item.home));
      mesh.computeBoundingSphere();
      mesh.castShadow = true;
      this.meshes.set(kind, mesh);
      this.root.add(mesh);
    }
    // Three baskets wait on the stand; taking one leaves the others.
    for (let i = 0; i < 3; i++) {
      const b = makeBasket(0.42);
      b.position.set(basketStand.x - 0.38 + i * 0.38, 0.89, basketStand.z);
      b.rotation.y = i * 0.7;
      b.userData.stand = true;
      this.root.add(b);
      this.standBaskets.push(b);
    }
    this.basket.name = 'basket';
    this.basket.add(makeBasket(0.42));
    this.basket.visible = false;
    this.root.add(this.basket);
  }

  /** Raycast targets: the instanced goods and the stand baskets. */
  targets(): T.Object3D[] {
    return [...this.meshes.values(), ...this.standBaskets.filter((b) => b.visible)];
  }

  /** What a ray hits first: an item at its stall, an item in the basket, or the basket stand. */
  hit(raycaster: T.Raycaster, maxDistance = 6): {item?: Item; stand?: boolean} | null {
    const objects: T.Object3D[] = [...this.targets(), ...this.items.filter((i) => i.state === 'basket' && i.mesh).map((i) => i.mesh!)];
    const hits = raycaster.intersectObjects(objects, true).filter((h) => h.distance <= maxDistance);
    for (const h of hits) {
      if (h.object instanceof T.InstancedMesh && h.instanceId !== undefined) {
        const item = this.index.get(h.object.userData.kind as ItemKind)?.[h.instanceId];
        if (item && item.state === 'home') return {item};
      }
      const inBasket = this.items.find((i) => i.mesh === h.object);
      if (inBasket) return {item: inBasket};
      let o: T.Object3D | null = h.object;
      while (o && !o.userData.stand) o = o.parent;
      if (o) return {stand: true};
    }
    return null;
  }

  /** Nearest item at a stall (or in the basket) within reach of a hand. */
  nearest(point: T.Vector3, reach = 0.16): Item | null {
    let best: Item | null = null;
    let bestD = reach;
    const p = new T.Vector3();
    for (const item of this.items) {
      if (item.state === 'home') p.setFromMatrixPosition(item.home).y += 0.08;
      else if (item.state === 'basket' && item.mesh) item.mesh.getWorldPosition(p);
      else continue;
      const d = p.distanceTo(point);
      if (d < bestD) {
        bestD = d;
        best = item;
      }
    }
    return best;
  }

  nearStand(point: T.Vector3, reach = 0.35) {
    return !this.basketTaken && this.standBaskets.some((b) => b.visible && b.getWorldPosition(new T.Vector3()).distanceTo(point) < reach);
  }

  /** Take a basket from the stand and carry it on `holder` (the camera, or a VR hand). */
  takeBasket(holder: T.Object3D, offset = new T.Vector3(0.42, -0.4, -0.86), scale = 0.9) {
    if (!this.basketTaken) {
      const stand = this.standBaskets.find((b) => b.visible);
      if (stand) stand.visible = false;
      this.basketTaken = true;
    }
    this.carryBasket(holder, offset, scale);
    this.onMessage?.('Basket ready. Pick goods from any stall to add them.');
    this.onChange?.();
  }

  carryBasket(holder: T.Object3D, offset: T.Vector3, scale: number) {
    if (!this.basketTaken) return;
    holder.add(this.basket);
    this.basket.position.copy(offset);
    this.basket.rotation.set(0.25, 0, 0);
    this.basket.scale.setScalar(scale);
    this.basket.visible = true;
  }

  basketItems() {
    return this.items.filter((i) => i.state === 'basket' || (i.state === 'moving' && i.mesh?.userData.toBasket));
  }

  /** Lift an item off its stall into a free mesh, keeping its world transform. */
  private detach(item: Item) {
    if (item.state === 'home') {
      const mesh = this.meshes.get(item.kind)!;
      const list = this.index.get(item.kind)!;
      mesh.setMatrixAt(list.indexOf(item), zero);
      mesh.instanceMatrix.needsUpdate = true;
      mesh.computeBoundingSphere();
      const m = new T.Mesh(this.geometries.get(item.kind)!, this.material);
      m.castShadow = true;
      m.matrixAutoUpdate = true;
      item.home.decompose(m.position, m.quaternion, m.scale);
      this.scene.add(m);
      item.mesh = m;
    } else if (item.mesh) this.scene.attach(item.mesh);
    this.tweens = this.tweens.filter((t) => t.item !== item);
    return item.mesh!;
  }

  private restore(item: Item) {
    if (item.mesh) {
      item.mesh.removeFromParent();
      item.mesh = undefined;
    }
    const mesh = this.meshes.get(item.kind)!;
    mesh.setMatrixAt(this.index.get(item.kind)!.indexOf(item), item.home);
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
    item.state = 'home';
  }

  private slotFor(item: Item) {
    const used = new Set(this.items.filter((i) => i !== item && (i.state === 'basket' || i.mesh?.userData.toBasket)).map((i) => i.mesh?.userData.slot));
    let s = 0;
    while (used.has(s)) s++;
    return s;
  }

  private basketTarget(slot: number) {
    return () => {
      this.basket.updateWorldMatrix(true, false);
      const local = new T.Matrix4().compose(BASKET_SLOTS[slot % BASKET_SLOTS.length].clone().setY(BASKET_SLOTS[slot % BASKET_SLOTS.length].y + Math.floor(slot / BASKET_SLOTS.length) * 0.2), new T.Quaternion().setFromAxisAngle(new T.Vector3(0, 1, 0), slot * 1.3), new T.Vector3(1, 1, 1).multiplyScalar(ITEM_IN_BASKET_SCALE));
      return this.basket.matrixWorld.clone().multiply(local);
    };
  }

  /** Desktop and laser pick: the item flies into the basket. */
  addToBasket(item: Item) {
    if (!this.basketTaken) {
      this.onMessage?.('Pick up a basket at the stand by the entrance first.');
      return false;
    }
    if (item.state === 'basket') return false;
    const mesh = this.detach(item);
    const slot = this.slotFor(item);
    mesh.userData.toBasket = true;
    mesh.userData.slot = slot;
    item.state = 'moving';
    this.tween(item, this.basketTarget(slot), () => {
      this.basket.attach(mesh);
      item.state = 'basket';
      this.onChange?.();
    });
    this.onMessage?.(`${item.name} added to your basket.`);
    this.onChange?.();
    return true;
  }

  /** Put an item back exactly where it came from. */
  putBack(item: Item) {
    if (item.state === 'home') return;
    const mesh = this.detach(item);
    mesh.userData.toBasket = false;
    item.state = 'moving';
    this.tween(item, () => item.home, () => this.restore(item));
    this.onMessage?.(`${item.name} returned to its stall.`);
    this.onChange?.();
  }

  putAllBack() {
    for (const item of this.basketItems()) this.putBack(item);
  }

  /** VR: hold an item in a hand; it follows the hand until released. */
  grab(item: Item, hand: T.Object3D) {
    const mesh = this.detach(item);
    mesh.userData.toBasket = false;
    item.state = 'held';
    hand.attach(mesh);
    this.onChange?.();
  }

  /** VR: let go. Near the basket it drops in; anywhere else it floats back to its stall. */
  release(item: Item) {
    if (item.state !== 'held' || !item.mesh) return 'none';
    const p = item.mesh.getWorldPosition(new T.Vector3());
    const b = this.basket.getWorldPosition(new T.Vector3());
    if (this.basketTaken && this.basket.visible && p.distanceTo(b) < 0.32) {
      this.scene.attach(item.mesh);
      const slot = this.slotFor(item);
      item.mesh.userData.toBasket = true;
      item.mesh.userData.slot = slot;
      item.state = 'moving';
      const mesh = item.mesh;
      this.tween(item, this.basketTarget(slot), () => {
        this.basket.attach(mesh);
        item.state = 'basket';
        this.onChange?.();
      });
      this.onMessage?.(`${item.name} added to your basket.`);
      return 'basket';
    }
    this.putBack(item);
    return 'home';
  }

  private tween(item: Item, to: () => T.Matrix4, done: () => void) {
    item.mesh!.updateMatrix();
    this.tweens.push({item, from: item.mesh!.matrix.clone(), t: 0, to, done});
  }

  update(dt: number) {
    const a = new T.Vector3(), b = new T.Vector3(), sa = new T.Vector3(), sb = new T.Vector3();
    const qa = new T.Quaternion(), qb = new T.Quaternion();
    for (const tw of [...this.tweens]) {
      tw.t = Math.min(1, tw.t + dt / 0.4);
      const e = tw.t < 0.5 ? 2 * tw.t * tw.t : 1 - (-2 * tw.t + 2) ** 2 / 2;
      tw.from.decompose(a, qa, sa);
      this.tmp.copy(tw.to()).decompose(b, qb, sb);
      const mesh = tw.item.mesh!;
      mesh.position.lerpVectors(a, b, e);
      mesh.position.y += Math.sin(e * Math.PI) * 0.12;
      mesh.quaternion.slerpQuaternions(qa, qb, e);
      mesh.scale.lerpVectors(sa, sb, e);
      if (tw.t >= 1) {
        this.tweens.splice(this.tweens.indexOf(tw), 1);
        mesh.position.copy(b);
        mesh.quaternion.copy(qb);
        mesh.scale.copy(sb);
        tw.done();
      }
    }
  }
}
