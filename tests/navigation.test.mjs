import {test} from 'node:test';
import assert from 'node:assert/strict';
import {canWalk} from '../src/navigation.ts';
test('the complete promenade and all five destinations remain reachable',()=>{for(let z=-47;z<=46;z+=.1)assert.ok(canWalk(0,z));for(const z of [43,22,0,-22,-43])assert.ok(canWalk(0,z))});
test('walking cannot enter vendor bays or leave either gateway',()=>{for(let z=-47;z<=46;z++){assert.equal(canWalk(3.36,z),false);assert.equal(canWalk(-3.36,z),false)}assert.equal(canWalk(0,-47.01),false);assert.equal(canWalk(0,46.01),false)});
test('invalid navigation coordinates fail closed',()=>{for(const n of [NaN,Infinity,-Infinity]){assert.equal(canWalk(n,0),false);assert.equal(canWalk(0,n),false)}});
