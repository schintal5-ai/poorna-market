import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {Shopping} from '../src/shopping.ts';
import {walkHalfWidth} from '../src/navigation.ts';
import {vendors} from '../src/data.ts';
import {archZ} from '../src/infrastructure.ts';

const make = () => {
  const scene = new T.Scene();
  const s = new Shopping(scene, () => new T.Mesh(new T.BoxGeometry(0.4, 0.2, 0.4)));
  const settle = () => {
    for (let i = 0; i < 30; i++) s.update(0.05);
  };
  return {scene, s, settle};
};

test('every stall offers six pickable goods within reach of the promenade', () => {
  const {s} = make();
  assert.equal(s.items.length, vendors.length * 6);
  assert.ok(vendors.length >= 18);
  const p = new T.Vector3();
  for (const item of s.items) {
    p.setFromMatrixPosition(item.home);
    assert.ok(Math.abs(p.y - 1.07) < 1e-6);
    assert.ok(Math.abs(p.x) - walkHalfWidth < 0.6, `${item.name} out of reach at x=${p.x}`);
  }
  for (const n of ['Tomato', 'Mango', 'Marigold bunch', 'Clay pot', 'Tea glass']) assert.ok(s.items.some((i) => i.name === n), n);
});

test('a basket is needed first; goods fly in and can be put back exactly where they were', () => {
  const {scene, s, settle} = make();
  const item = s.items[3];
  assert.equal(s.addToBasket(item), false);
  s.takeBasket(scene);
  assert.ok(s.addToBasket(item));
  settle();
  assert.equal(item.state, 'basket');
  assert.equal(item.mesh.parent, s.basket);
  assert.equal(s.basketItems().length, 1);
  s.putBack(item);
  settle();
  assert.equal(item.state, 'home');
  assert.equal(item.mesh, undefined);
  assert.equal(s.basketItems().length, 0);
});

test('VR: a held item released near the basket drops in; elsewhere it returns to its stall', () => {
  const {scene, s, settle} = make();
  const leftHand = new T.Group();
  const rightHand = new T.Group();
  scene.add(leftHand, rightHand);
  leftHand.position.set(3, 1, 20);
  s.takeBasket(leftHand, new T.Vector3(), 1);
  const first = s.items[0];
  const second = s.items[1];
  const home = new T.Vector3().setFromMatrixPosition(first.home);
  assert.equal(s.nearest(home.clone().setY(home.y + 0.08)), first);
  rightHand.position.copy(home);
  rightHand.updateMatrixWorld(true);
  s.grab(first, rightHand);
  rightHand.position.set(0, 0, 0);
  assert.equal(first.state, 'held');
  rightHand.position.set(3.05, 1.05, 20);
  rightHand.updateMatrixWorld(true);
  assert.equal(s.release(first), 'basket');
  settle();
  assert.equal(first.state, 'basket');
  s.grab(second, rightHand);
  rightHand.position.set(0, 1.5, 0);
  rightHand.updateMatrixWorld(true);
  assert.equal(s.release(second), 'home');
  settle();
  assert.equal(second.state, 'home');
});

test('no hawker stall blocks an arched entrance of the complex', () => {
  for (const v of vendors) if (v.side < 0) for (const a of archZ) assert.ok(Math.abs(a - v.z) >= 3, `stall at ${v.z} blocks arch at ${a}`);
});
