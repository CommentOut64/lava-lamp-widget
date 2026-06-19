import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveTheme } from '../../src/render/palette.js';

test('dark background yields stronger glass highlight contrast', () => {
  const dark = resolveTheme({ backgroundMode: 'auto', backgroundColor: '#101820' });
  const light = resolveTheme({ backgroundMode: 'auto', backgroundColor: '#f4efe8' });
  assert.ok(dark.glassEdgeAlpha > light.glassEdgeAlpha);
});

test('custom mode preserves provided palette values', () => {
  const theme = resolveTheme({
    backgroundMode: 'custom',
    palette: {
      wax: ['#112233', '#445566'],
      liquid: ['#223344', '#556677'],
    },
  });
  assert.deepEqual(theme.wax, ['#112233', '#445566']);
});
