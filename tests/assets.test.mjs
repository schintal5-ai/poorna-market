import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const root = new URL('../public/assets/', import.meta.url);

test('every licensed asset is present locally and no raw downloads ship', () => {
  const manifest = JSON.parse(fs.readFileSync(new URL('licenses.json', root), 'utf8'));
  for (const record of manifest) {
    assert.equal(record.license, 'CC0-1.0');
    assert.ok(fs.existsSync(new URL(record.file, root)), record.file);
  }
  assert.equal(fs.readdirSync(root).some((f) => f.endsWith('-raw.glb')), false);
});

test('no people ship with the walkthrough: no character models, skeletons or crowd code', () => {
  for (const name of ['sam.glb', 'maya.glb', 'harper.glb']) assert.equal(fs.existsSync(new URL(name, root)), false, name);
  for (const f of fs.readdirSync(root).filter((n) => n.endsWith('.glb'))) {
    const b = fs.readFileSync(new URL(f, root));
    const json = JSON.parse(b.toString('utf8', 20, 20 + b.readUInt32LE(12)));
    assert.equal((json.skins ?? []).length, 0, f + ' has a skeleton');
  }
  const src = new URL('../src/', import.meta.url);
  for (const f of fs.readdirSync(src)) assert.doesNotMatch(fs.readFileSync(new URL(f, src), 'utf8'), /SkinnedMesh|AnimationMixer|crowd/i, f);
});
