import * as T from 'three';
import {XRHandModelFactory} from 'three/addons/webxr/XRHandModelFactory.js';
import type {Shopping, Item} from './shopping';

/** Meta Quest (WebXR immersive-vr): controllers and hand tracking, thumbstick walking, grab and basket. */
export interface VRHooks {
  canWalk: (x: number, z: number) => boolean;
  shopping: Shopping;
  onStart?: () => void;
  onEnd?: (pose: {x: number; z: number; yaw: number}) => void;
  toggleWater?: () => void;
  toggleEvening?: () => void;
}

interface Hand {
  controller: T.XRTargetRaySpace;
  grip: T.XRGripSpace;
  hand: T.XRHandSpace;
  source?: XRInputSource;
  held: Item | null;
  ray: T.Line;
  marker: T.Mesh;
  pressed: boolean[];
}

const WALK_SPEED = 1.8;
const SNAP = Math.PI / 6;
const REACH = 0.16;

function panel(lines: string[], width = 1.3) {
  const c = document.createElement('canvas');
  c.width = 1024;
  c.height = 128 + lines.length * 64;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = 'rgba(24,61,50,0.92)';
  ctx.beginPath();
  ctx.roundRect(0, 0, c.width, c.height, 40);
  ctx.fill();
  ctx.fillStyle = '#fffdf7';
  ctx.font = '600 56px sans-serif';
  ctx.fillText(lines[0], 48, 92);
  ctx.font = '40px sans-serif';
  lines.slice(1).forEach((l, i) => ctx.fillText(l, 48, 170 + i * 64));
  const tex = new T.CanvasTexture(c);
  tex.colorSpace = T.SRGBColorSpace;
  const m = new T.Mesh(new T.PlaneGeometry(width, (width * c.height) / c.width), new T.MeshBasicMaterial({map: tex, transparent: true, depthTest: false}));
  m.renderOrder = 20;
  return m;
}

export class VRMode {
  readonly rig = new T.Group();
  active = false;
  private hands: Hand[] = [];
  private raycaster = new T.Raycaster();
  private turnReady = true;
  private help: T.Mesh | null = null;
  private helpTime = 0;
  private counter: T.Mesh | null = null;
  private basketHand = -1;

  constructor(private renderer: T.WebGLRenderer, private scene: T.Scene, private camera: T.PerspectiveCamera, private hooks: VRHooks) {
    this.rig.name = 'vr-rig';
    renderer.xr.enabled = true;
    renderer.xr.setReferenceSpaceType('local-floor');
    renderer.xr.setFoveation(1);
    const factory = new XRHandModelFactory();
    for (let i = 0; i < 2; i++) {
      const controller = renderer.xr.getController(i);
      const grip = renderer.xr.getControllerGrip(i);
      const hand = renderer.xr.getHand(i);
      hand.add(factory.createHandModel(hand, 'spheres'));
      const ray = new T.Line(new T.BufferGeometry().setFromPoints([new T.Vector3(), new T.Vector3(0, 0, -1)]), new T.LineBasicMaterial({color: 0xfff2d1, transparent: true, opacity: 0.8}));
      ray.scale.z = 4;
      controller.add(ray);
      // A simple controller body so nothing is downloaded at runtime.
      const body = new T.Mesh(new T.CapsuleGeometry(0.022, 0.08, 4, 10), new T.MeshStandardMaterial({color: 0x2c3a35, roughness: 0.5}));
      body.rotation.x = Math.PI / 2.4;
      grip.add(body);
      const marker = new T.Mesh(new T.TorusGeometry(0.07, 0.006, 6, 28), new T.MeshBasicMaterial({color: 0xffd27a, depthTest: false}));
      marker.rotation.x = Math.PI / 2;
      marker.visible = false;
      marker.renderOrder = 15;
      scene.add(marker);
      const h: Hand = {controller, grip, hand, held: null, ray, marker, pressed: []};
      this.hands.push(h);
      controller.addEventListener('connected', (e) => {
        h.source = (e as unknown as {data: XRInputSource}).data;
        ray.visible = !h.source.hand;
        body.visible = !h.source.hand;
      });
      controller.addEventListener('disconnected', () => {
        this.letGo(i);
        h.source = undefined;
      });
      controller.addEventListener('squeezestart', () => {
        if (!h.source?.hand) this.grabAt(i);
      });
      controller.addEventListener('squeezeend', () => {
        if (!h.source?.hand) this.letGo(i);
      });
      controller.addEventListener('selectstart', () => {
        if (!h.source?.hand) this.point(i);
      });
      hand.addEventListener('pinchstart', () => this.grabAt(i));
      hand.addEventListener('pinchend', () => this.letGo(i));
      this.rig.add(controller, grip, hand);
    }
    renderer.xr.addEventListener('sessionstart', () => this.start());
    renderer.xr.addEventListener('sessionend', () => this.end());
  }

  /** Call when the basket contents change. */
  refresh() {
    this.updateCounter();
  }

  static async supported() {
    try {
      return !!(await navigator.xr?.isSessionSupported('immersive-vr'));
    } catch {
      return false;
    }
  }

  async enter() {
    if (!navigator.xr) throw new Error('WebXR is not available in this browser');
    const session = await navigator.xr.requestSession('immersive-vr', {optionalFeatures: ['local-floor', 'bounded-floor', 'hand-tracking']});
    await this.renderer.xr.setSession(session);
  }

  exit() {
    void this.renderer.xr.getSession()?.end();
  }

  /** Places the player where the desktop camera stood, facing the same way. */
  private start() {
    this.active = true;
    const yaw = new T.Euler().setFromQuaternion(this.camera.quaternion, 'YXZ').y;
    this.rig.position.set(this.camera.position.x, 0, this.camera.position.z);
    this.rig.rotation.set(0, yaw, 0);
    this.scene.add(this.rig);
    this.rig.add(this.camera);
    this.camera.position.set(0, 1.6, 0);
    this.camera.rotation.set(0, 0, 0);
    const s = this.hooks.shopping;
    if (s.basketTaken) this.holdBasket(0);
    this.help?.removeFromParent();
    this.help = panel(['Welcome to Poorna Market', 'Left stick: walk · Right stick: turn', 'Grip or pinch: pick up · release to put back', 'Trigger: point at goods to add to basket', 'Take a basket from the stand by the gate', 'X / A: water network · Y / B: day and evening'], 1.25);
    this.help.position.set(0, 1.45, -1.4);
    this.rig.add(this.help);
    this.helpTime = 14;
    this.hooks.onStart?.();
  }

  private end() {
    for (let i = 0; i < this.hands.length; i++) this.letGo(i);
    const head = this.camera.getWorldPosition(new T.Vector3());
    const yaw = new T.Euler().setFromQuaternion(this.camera.getWorldQuaternion(new T.Quaternion()), 'YXZ').y;
    this.scene.add(this.camera);
    this.rig.removeFromParent();
    this.hands.forEach((h) => (h.marker.visible = false));
    this.active = false;
    this.basketHand = -1;
    const x = this.hooks.canWalk(head.x, head.z) ? head.x : this.rig.position.x;
    const z = this.hooks.canWalk(head.x, head.z) ? head.z : this.rig.position.z;
    this.hooks.onEnd?.({x, z, yaw});
  }

  private holdBasket(i: number) {
    this.basketHand = i;
    this.hooks.shopping.carryBasket(this.hands[i].grip, new T.Vector3(0, -0.16, 0.04), 0.8);
    this.updateCounter();
  }

  private updateCounter() {
    if (!this.active) return;
    this.counter?.removeFromParent();
    const s = this.hooks.shopping;
    if (!s.basketTaken) return;
    const n = s.basketItems().length;
    this.counter = panel([`${n} item${n === 1 ? '' : 's'} in basket`], 0.3);
    this.counter.position.set(0, 0.28, 0);
    s.basket.add(this.counter);
  }

  private fingertip(i: number) {
    const h = this.hands[i];
    if (h.source?.hand) {
      const tip = h.hand.joints['index-finger-tip'];
      const thumb = h.hand.joints['thumb-tip'];
      if (tip && thumb) return tip.getWorldPosition(new T.Vector3()).add(thumb.getWorldPosition(new T.Vector3())).multiplyScalar(0.5);
    }
    return h.grip.getWorldPosition(new T.Vector3());
  }

  private holder(i: number): T.Object3D {
    const h = this.hands[i];
    if (h.source?.hand) return h.hand.joints['index-finger-tip'] ?? h.grip;
    return h.grip;
  }

  private grabAt(i: number) {
    const h = this.hands[i];
    if (h.held) return;
    const s = this.hooks.shopping;
    const p = this.fingertip(i);
    if (s.nearStand(p)) {
      s.takeBasket(h.grip, new T.Vector3(0, -0.16, 0.04), 0.8);
      this.holdBasket(i);
      this.pulse(i);
      return;
    }
    const item = s.nearest(p, REACH);
    if (!item) return;
    s.grab(item, this.holder(i));
    h.held = item;
    this.pulse(i);
  }

  private letGo(i: number) {
    const h = this.hands[i];
    if (!h?.held) return;
    this.hooks.shopping.release(h.held);
    h.held = null;
  }

  /** Trigger: laser-pick goods from a distance into the basket, or put a basket item back. */
  private point(i: number) {
    const h = this.hands[i];
    if (this.help) {
      this.help.removeFromParent();
      this.help = null;
    }
    const m = h.controller.matrixWorld;
    this.raycaster.ray.origin.setFromMatrixPosition(m);
    this.raycaster.ray.direction.set(0, 0, -1).transformDirection(m);
    const s = this.hooks.shopping;
    const hit = s.hit(this.raycaster, 5);
    if (!hit) return;
    if (hit.stand) {
      s.takeBasket(this.hands[1 - i].grip, new T.Vector3(0, -0.16, 0.04), 0.8);
      this.holdBasket(1 - i);
    } else if (hit.item) {
      if (hit.item.state === 'basket') s.putBack(hit.item);
      else s.addToBasket(hit.item);
    }
    this.pulse(i);
  }

  private pulse(i: number) {
    const actuator = this.hands[i].source?.gamepad?.hapticActuators?.[0] as unknown as {pulse?: (v: number, ms: number) => void} | undefined;
    try {
      actuator?.pulse?.(0.4, 40);
    } catch {
      /* haptics are optional */
    }
  }

  update(dt: number) {
    if (!this.active) return;
    const s = this.hooks.shopping;
    if (this.help && (this.helpTime -= dt) <= 0) {
      this.help.removeFromParent();
      this.help = null;
    }
    for (let i = 0; i < this.hands.length; i++) {
      const h = this.hands[i];
      const gp = h.source?.gamepad;
      if (gp && !h.source?.hand) {
        const ax = gp.axes[2] ?? 0;
        const ay = gp.axes[3] ?? 0;
        if (h.source!.handedness === 'left') this.walk(ax, ay, dt);
        else if (h.source!.handedness === 'right') this.turn(ax);
        // X/A toggles the water network, Y/B toggles day and evening.
        const b4 = !!gp.buttons[4]?.pressed;
        const b5 = !!gp.buttons[5]?.pressed;
        if (b4 && !h.pressed[4]) this.hooks.toggleWater?.();
        if (b5 && !h.pressed[5]) this.hooks.toggleEvening?.();
        h.pressed[4] = b4;
        h.pressed[5] = b5;
      }
      // Highlight what this hand would pick up.
      const target = h.held ? null : s.nearest(this.fingertip(i), REACH);
      h.marker.visible = !!target;
      if (target) {
        if (target.state === 'home') h.marker.position.setFromMatrixPosition(target.home).y += 0.02;
        else target.mesh?.getWorldPosition(h.marker.position);
      }
      if (h.ray.visible) {
        const m = h.controller.matrixWorld;
        this.raycaster.ray.origin.setFromMatrixPosition(m);
        this.raycaster.ray.direction.set(0, 0, -1).transformDirection(m);
        const hit = this.raycaster.intersectObjects(s.targets(), true)[0];
        h.ray.scale.z = hit && hit.distance < 5 ? hit.distance : 4;
        (h.ray.material as T.LineBasicMaterial).color.setHex(hit && hit.distance < 5 ? 0xffd27a : 0xfff2d1);
      }
    }
  }

  private walk(ax: number, ay: number, dt: number) {
    if (Math.hypot(ax, ay) < 0.15) return;
    const head = this.camera.getWorldPosition(new T.Vector3());
    const fwd = this.camera.getWorldDirection(new T.Vector3()).setY(0).normalize();
    const right = new T.Vector3(-fwd.z, 0, fwd.x);
    const d = fwd.multiplyScalar(-ay).add(right.multiplyScalar(ax)).multiplyScalar(WALK_SPEED * dt);
    if (this.hooks.canWalk(head.x + d.x, head.z)) this.rig.position.x += d.x;
    if (this.hooks.canWalk(head.x, head.z + d.z)) this.rig.position.z += d.z;
  }

  private turn(ax: number) {
    if (Math.abs(ax) < 0.3) this.turnReady = true;
    if (!this.turnReady || Math.abs(ax) < 0.7) return;
    this.turnReady = false;
    const angle = ax > 0 ? -SNAP : SNAP;
    const head = this.camera.getWorldPosition(new T.Vector3());
    const offset = this.rig.position.clone().sub(head).applyAxisAngle(new T.Vector3(0, 1, 0), angle);
    this.rig.position.set(head.x + offset.x, 0, head.z + offset.z);
    this.rig.rotation.y += angle;
  }
}
