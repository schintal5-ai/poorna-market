import * as T from 'three';
import {features} from './data';
import {canWalk} from './navigation.ts';
import {advanceMotion, movementEnabled} from './movement';
import {WalkInput} from './input';
import {Materials} from './materials';
import {MarketAssets} from './market-assets';
import {Kit} from './geometry';
import {buildArchitecture} from './architecture';
import {Props} from './props';
import {WaterNetwork} from './water';
import {Shopping} from './shopping.ts';
import {VRMode} from './xr';

export interface Position {x: number; z: number}

export class MarketScene {
  scene = new T.Scene();
  camera = new T.PerspectiveCamera(64, 1, 0.08, 220);
  renderer: T.WebGLRenderer;
  yaw = 0;
  pitch = 0;
  exploring = false;
  evening = false;
  shopping: Shopping | undefined;
  vr: VRMode | undefined;
  water: WaterNetwork | undefined;
  onContextState: ((lost: boolean) => void) | undefined;
  onManual: (() => void) | undefined;
  onFrame: ((p: Position, yaw: number) => void) | undefined;
  onTravelEnd: (() => void) | undefined;
  onQuality: ((s: string) => void) | undefined;
  onBasket: (() => void) | undefined;
  onMessage: ((s: string) => void) | undefined;
  onVR: ((active: boolean) => void) | undefined;
  readonly ready: Promise<string[]>;
  readonly mobile = matchMedia('(pointer: coarse)').matches;
  private contextLost = false;
  private requestedRatio = 1;
  private modalOpen = false;
  private input: WalkInput;
  private mats = new Materials();
  private assets = new MarketAssets();
  private sun: T.DirectionalLight;
  private ambient: T.HemisphereLight;
  private target: T.Vector3 | null = null;
  private guide = false;
  private last = 0;
  private reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  private daySky: T.Texture | T.Color | null = null;
  private suspended = false;
  private initialized = false;
  private nightLights: T.PointLight[] = [];
  private frames = 0;
  private seconds = 0;
  private raycaster = new T.Raycaster();
  private down: {x: number; y: number} | null = null;

  constructor(private host: HTMLElement, onProgress: (s: string) => void = () => {}) {
    this.renderer = new T.WebGLRenderer({antialias: true, powerPreference: 'high-performance'});
    this.requestedRatio = Math.min(devicePixelRatio, this.mobile ? 1.25 : 1.6);
    this.renderer.setPixelRatio(this.requestedRatio);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = T.PCFSoftShadowMap;
    this.renderer.toneMapping = T.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.3;
    this.renderer.outputColorSpace = T.SRGBColorSpace;
    host.append(this.renderer.domElement);
    this.scene.background = new T.Color(0xd8e2df);
    this.scene.fog = new T.Fog(0xd8e0d8, 75, 190);
    this.ambient = new T.HemisphereLight(0xeaf0ff, 0x8c7860, 1.15);
    this.scene.add(this.ambient);
    this.sun = new T.DirectionalLight(0xffe5b9, 2.7);
    this.sun.position.set(-28, 45, 32);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(this.mobile ? 2048 : 4096, this.mobile ? 2048 : 4096);
    Object.assign(this.sun.shadow.camera, {left: -30, right: 30, top: 70, bottom: -70, near: 1, far: 150});
    this.sun.shadow.autoUpdate = false;
    this.sun.shadow.normalBias = 0.035;
    this.sun.shadow.bias = -0.0002;
    this.scene.add(this.sun);
    [36, 12, -12, -36].forEach((z, i) => {
      const lamp = new T.PointLight(0xffc880, 0, 24, 2);
      lamp.position.set(i % 2 ? 3 : -3, 4.2, z);
      this.nightLights.push(lamp);
    });
    // The camera carries the desktop basket, so it must be part of the scene graph.
    this.scene.add(this.camera);
    this.camera.position.set(0.3, 2.35, 44);
    this.yaw = -0.02;
    this.pitch = 0.04;
    const canvas = this.renderer.domElement;
    canvas.tabIndex = 0;
    canvas.setAttribute('aria-label', '3D street. Drag to look; use WASD or arrow keys to walk; click goods on a stall to put them in your basket.');
    new ResizeObserver(() => this.resize()).observe(host);
    this.resize();
    this.input = new WalkInput(canvas, () => movementEnabled(this.initialized, this.exploring, this.modalOpen, this.suspended), () => {
      this.cancelTravel();
      this.onManual?.();
    }, (dx, dy) => {
      this.yaw -= dx;
      this.pitch = T.MathUtils.clamp(this.pitch - dy, -1.05, 1.15);
    });
    canvas.addEventListener('pointerdown', (e) => (this.down = {x: e.clientX, y: e.clientY}));
    canvas.addEventListener('pointerup', (e) => {
      if (this.down && Math.hypot(e.clientX - this.down.x, e.clientY - this.down.y) < 6) this.click(e.clientX, e.clientY);
      this.down = null;
    });
    canvas.addEventListener('pointermove', (e) => {
      if (e.buttons || !this.shopping || !this.exploring) return;
      canvas.style.cursor = this.pick(e.clientX, e.clientY) ? 'pointer' : '';
    });
    document.addEventListener('visibilitychange', () => {
      this.suspended = document.hidden;
      this.last = performance.now();
    });
    const restoreExtension = this.renderer.getContext().getExtension('WEBGL_lose_context');
    canvas.addEventListener('webglcontextlost', (e) => {
      e.preventDefault();
      this.contextLost = true;
      this.initialized = false;
      this.input.clear();
      this.onContextState?.(true);
      setTimeout(() => {
        if (this.contextLost)
          try {
            restoreExtension?.restoreContext();
          } catch {
            /* the browser restores it itself */
          }
      }, 800);
    });
    canvas.addEventListener('webglcontextrestored', () => {
      if (this.daySky instanceof T.Texture) {
        const pmrem = new T.PMREMGenerator(this.renderer);
        this.scene.environment?.dispose();
        this.scene.environment = pmrem.fromEquirectangular(this.daySky).texture;
        pmrem.dispose();
      }
      this.sun.shadow.needsUpdate = true;
      this.contextLost = false;
      this.initialized = true;
      this.frames = 0;
      this.seconds = 0;
      this.input.clear();
      this.input.focus();
      this.onContextState?.(false);
    });
    this.ready = this.initialize(onProgress);
    this.renderer.setAnimationLoop((t) => this.frame(t));
  }

  private async initialize(progress: (s: string) => void) {
    await this.mats.load(this.renderer, this.scene, progress);
    this.daySky = this.scene.background;
    await this.assets.load(progress);
    progress('Building the shopping complex and the harvester row');
    const kit = new Kit(this.mats, this.scene, this.assets);
    const arch = buildArchitecture(kit);
    this.water = new WaterNetwork(this.scene, arch.floor);
    const props = new Props(kit);
    this.shopping = new Shopping(this.scene, (width) => {
      const g = new T.Group();
      if (this.assets.has('wicker_basket_01')) this.assets.place('wicker_basket_01', width, 0, 0, 0, g);
      else props.basket(0, 0.05, 0, width / 2, g);
      return g;
    });
    this.shopping.onChange = () => {
      this.vr?.refresh();
      this.onBasket?.();
    };
    this.shopping.onMessage = (s) => this.onMessage?.(s);
    this.vr = new VRMode(this.renderer, this.scene, this.camera, {
      canWalk,
      shopping: this.shopping,
      toggleWater: () => this.setWaterNetwork(!this.water?.visible),
      toggleEvening: () => this.setEvening(!this.evening),
      onStart: () => {
        this.exploring = true;
        this.cancelTravel();
        this.input.clear();
        this.onVR?.(true);
      },
      onEnd: (pose) => {
        this.camera.position.set(pose.x, 1.68, pose.z);
        this.yaw = pose.yaw;
        this.pitch = 0.035;
        if (this.shopping?.basketTaken) this.shopping.carryBasket(this.camera, this.basketOffset(), 0.9);
        this.onVR?.(false);
        this.input.focus();
      },
    });
    this.sun.shadow.needsUpdate = true;
    await this.renderer.compileAsync(this.scene, this.camera);
    this.initialized = true;
    this.frames = 0;
    this.seconds = 0;
    return [...this.mats.failures, ...this.assets.failures];
  }

  setEvening(v: boolean) {
    this.evening = v;
    this.scene.background = this.daySky;
    this.scene.backgroundIntensity = v ? 0.2 : 0.75;
    this.nightLights.forEach((light) => {
      light.intensity = v ? 20 : 0;
      if (v) this.scene.add(light);
      else light.removeFromParent();
    });
    this.scene.environmentIntensity = v ? 0.25 : 0.8;
    this.sun.color.setHex(v ? 0xffbe81 : 0xffe5b9);
    this.sun.intensity = v ? 0.48 : 2.7;
    this.ambient.intensity = v ? 0.55 : 1.15;
    (this.scene.fog as T.Fog).color.setHex(v ? 0x52606b : 0xd8e0d8);
    this.mats.glow.emissiveIntensity = v ? 4 : 0.15;
    this.mats.interior.emissiveIntensity = v ? 1.8 : 0.08;
    this.renderer.toneMappingExposure = v ? 1.45 : 1.3;
    this.onEvening?.(v);
  }
  onEvening: ((v: boolean) => void) | undefined;

  setWaterNetwork(v: boolean) {
    this.water?.setVisible(v);
    this.onWater?.(v);
  }
  onWater: ((v: boolean) => void) | undefined;

  setQuality(high: boolean) {
    this.requestedRatio = high ? Math.min(devicePixelRatio, 1.6) : 1;
    this.sun.shadow.mapSize.set(high ? 4096 : 1024, high ? 4096 : 1024);
    this.sun.shadow.map?.dispose();
    this.sun.shadow.map = null;
    this.sun.shadow.needsUpdate = true;
    this.resize();
  }

  enter() {
    this.exploring = true;
    this.camera.position.set(2.4, 1.68, 44.5);
    this.yaw = 0.1;
    this.pitch = 0.035;
    this.input.clear();
    this.input.focus();
  }

  overview() {
    this.exploring = false;
    this.input.clear();
    this.camera.position.set(0.3, 2.35, 44);
    this.yaw = -0.02;
    this.pitch = 0.04;
  }

  goTo(x: number, z: number, guided = false, yaw = 0) {
    this.target = new T.Vector3(x, 1.68, z);
    this.guide = guided;
    if (!guided || this.reduced) {
      this.camera.position.copy(this.target);
      this.target = null;
      this.yaw = yaw;
      this.pitch = 0.035;
      this.input.focus();
      if (guided) setTimeout(() => this.onTravelEnd?.(), 150);
    }
  }

  cancelTravel() {
    this.target = null;
    this.guide = false;
  }

  projectFeature(i: number) {
    const f = features[i];
    const v = new T.Vector3(f.x, f.y, f.z);
    const dir = v.clone().sub(this.camera.position);
    if (dir.dot(this.camera.getWorldDirection(new T.Vector3())) < 0 || dir.length() > 25) return null;
    v.project(this.camera);
    if (v.z > 1 || Math.abs(v.x) > 0.92 || Math.abs(v.y) > 0.86) return null;
    return {x: ((v.x + 1) * this.host.clientWidth) / 2, y: ((1 - v.y) * this.host.clientHeight) / 2};
  }

  private resize() {
    if (this.renderer.xr.isPresenting) return;
    this.camera.aspect = this.host.clientWidth / this.host.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setPixelRatio(Math.min(this.requestedRatio, Math.sqrt((1920 * 1080) / Math.max(1, this.host.clientWidth * this.host.clientHeight))));
    this.renderer.setSize(this.host.clientWidth, this.host.clientHeight);
    if (this.shopping?.basketTaken && this.shopping.basket.parent === this.camera) this.shopping.basket.position.copy(this.basketOffset());
  }

  private pick(clientX: number, clientY: number) {
    if (!this.shopping) return null;
    const r = this.renderer.domElement.getBoundingClientRect();
    this.raycaster.setFromCamera(new T.Vector2(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1), this.camera);
    return this.shopping.hit(this.raycaster, 5.5);
  }

  /** Desktop and touch: click the stand for a basket, goods to add them, basket goods to put them back. */
  private click(clientX: number, clientY: number) {
    if (!this.exploring || this.modalOpen || !this.shopping) return;
    const hit = this.pick(clientX, clientY);
    if (!hit) return;
    if (hit.stand) this.takeBasket();
    else if (hit.item) {
      if (hit.item.state === 'basket') this.shopping.putBack(hit.item);
      else this.shopping.addToBasket(hit.item);
    }
  }

  /** Bottom-right of the view, pulled in on narrow (portrait) screens so the basket stays visible. */
  private basketOffset() {
    const a = this.camera.aspect;
    return new T.Vector3(Math.min(0.42, 0.32 * a), a < 1 ? -0.5 : -0.4, -0.86);
  }

  takeBasket() {
    this.shopping?.takeBasket(this.camera, this.basketOffset(), 0.9);
  }

  /** Test and accessibility hook: add the nearest stall item within reach of the walker. */
  pickNearest() {
    if (!this.shopping) return null;
    const p = this.camera.position.clone().setY(1.1);
    const item = this.shopping.nearest(p, 2.2);
    if (item) this.shopping.addToBasket(item);
    return item;
  }

  focusMovement() {
    this.input.clear();
    if (this.exploring && !this.modalOpen) this.input.focus();
  }

  setModalOpen(value: boolean) {
    this.modalOpen = value;
    this.input.clear();
    if (!value && this.exploring) this.input.focus();
  }

  holdMove(forward: number, strafe: number) {
    this.input.hold(forward, strafe);
  }

  releaseMove() {
    this.input.release();
  }

  stepMove(forward: number, strafe: number) {
    if (!movementEnabled(this.initialized, this.exploring, this.modalOpen, this.suspended)) return;
    this.cancelTravel();
    this.onManual?.();
    this.move({forward, strafe, turn: 0}, 0.19);
    this.input.focus();
  }

  private move(direction: {forward: number; strafe: number; turn: number}, dt: number) {
    const p = this.camera.position;
    const result = advanceMotion({x: p.x, z: p.z, yaw: this.yaw}, direction, dt, (x, z) => !canWalk(x, z));
    p.set(result.x, p.y, result.z);
    this.yaw = result.yaw;
  }

  private frame(t: number) {
    const elapsed = Math.max(0, (t - this.last) / 1000);
    const dt = Math.min(elapsed, 0.05);
    this.last = t;
    const xr = this.renderer.xr.isPresenting;
    if ((this.suspended && !xr) || this.contextLost) return;
    if (xr) this.vr?.update(dt);
    else {
      if (this.target && this.guide && !this.modalOpen) {
        const d = this.target.clone().sub(this.camera.position);
        const dist = d.length();
        this.yaw = 0;
        this.pitch = 0.035;
        if (dist < 0.08) {
          this.camera.position.copy(this.target);
          this.target = null;
          this.onTravelEnd?.();
        } else this.camera.position.addScaledVector(d.normalize(), Math.min(dist, dt * 3.3));
      } else if (movementEnabled(this.initialized, this.exploring, this.modalOpen, this.suspended)) this.move(this.input.direction(), elapsed);
      this.camera.rotation.order = 'YXZ';
      this.camera.rotation.set(this.pitch, this.yaw, 0);
    }
    this.shopping?.update(dt);
    this.water?.update(dt);
    const head = this.camera.getWorldPosition(new T.Vector3());
    this.renderer.domElement.dataset.camera = JSON.stringify({x: head.x, z: head.z, yaw: this.yaw, exploring: this.exploring, modalOpen: this.modalOpen, ready: this.initialized, basket: this.shopping?.basketTaken ?? false, items: this.shopping?.basketItems().length ?? 0, vr: xr, water: this.water?.visible ?? false});
    this.renderer.render(this.scene, this.camera);
    this.onFrame?.({x: head.x, z: head.z}, xr ? new T.Euler().setFromQuaternion(this.camera.getWorldQuaternion(new T.Quaternion()), 'YXZ').y : this.yaw);
    if (this.initialized) {
      this.frames++;
      this.seconds += elapsed;
    }
    if (this.seconds > 2) {
      const fps = Math.round(this.frames / this.seconds);
      this.onQuality?.(`${xr ? 'VR' : this.mobile ? 'Mobile' : 'Desktop'} · ${fps} fps · ${this.renderer.info.render.calls} draws`);
      this.renderer.domElement.dataset.performance = JSON.stringify({fps, draws: this.renderer.info.render.calls, triangles: this.renderer.info.render.triangles, width: this.renderer.domElement.width, height: this.renderer.domElement.height, mobile: this.mobile});
      this.frames = 0;
      this.seconds = 0;
    }
  }
}
