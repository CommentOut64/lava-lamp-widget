import * as esbuild from 'esbuild';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const srcEntry = fileURLToPath(new URL('../src/index.js', import.meta.url));
const distDir = fileURLToPath(new URL('../dist', import.meta.url));

await mkdir(distDir, { recursive: true });

// Build ESM version
await esbuild.build({
  entryPoints: [srcEntry],
  outfile: fileURLToPath(new URL('../dist/lava-lamp-widget.esm.js', import.meta.url)),
  bundle: true,
  format: 'esm',
  target: ['es2020'],
  minify: true,
});

// Build IIFE version
await esbuild.build({
  entryPoints: [srcEntry],
  outfile: fileURLToPath(new URL('../dist/lava-lamp-widget.js', import.meta.url)),
  bundle: true,
  format: 'iife',
  globalName: 'LavaLampWidget',
  target: ['es2020'],
  minify: true,
});

console.log('Build complete');
