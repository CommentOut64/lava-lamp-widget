import { access } from 'node:fs/promises';

await access(new URL('../dist/lava-lamp-widget.js', import.meta.url));
await access(new URL('../dist/lava-lamp-widget.esm.js', import.meta.url));
console.log('dist verified');
