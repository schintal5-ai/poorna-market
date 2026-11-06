import {test} from 'node:test';
import assert from 'node:assert/strict';
import {assetUrl} from '../src/asset-url.ts';

test('models, textures and sky resolve under GitHub Pages and root hosting', () => {
  for (const base of ['https://schintal5-ai.github.io/poorna-market/', 'https://poorna-market-pedestrian-futures.wellspoon.chatgpt.site/'])
    for (const file of ['wicker_basket_01.glb', 'stone-normal.webp', 'daylight.hdr']) assert.equal(assetUrl(file, base), base + 'assets/' + file);
});
