import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { mount, defineCustomElement, defaults } from '../../src/index.js';

test('public api exports stable entry points', () => {
  assert.equal(typeof mount, 'function');
  assert.equal(typeof defineCustomElement, 'function');
  assert.equal(typeof defaults, 'object');
  assert.equal(defaults.quality, 'auto');
});

test('dist bundle exposes global entry', async () => {
  const code = await readFile(new URL('../../dist/lava-lamp-widget.js', import.meta.url), 'utf8');
  assert.match(code, /window\.LavaLampWidget/);
  assert.match(code, /appendChild/);
  assert.match(code, /resume\(/);
});

test('mount returns an instance and appends a canvas to the host', () => {
  const appended = [];
  const drawLog = [];
  const container = {
    appendChild(node) {
      appended.push(node);
      return node;
    },
    ownerDocument: {
      getElementById() { return null; },
      head: { appendChild() {} },
      createElement(tagName) {
        return {
          tagName,
          appendChild(node) { return node; },
          getContext() {
            return {
              clearRect() {
                drawLog.push('clearRect');
              },
              fillRect() {
                drawLog.push('fillRect');
              },
              beginPath() {
                drawLog.push('beginPath');
              },
              moveTo() {
                drawLog.push('moveTo');
              },
              lineTo() {
                drawLog.push('lineTo');
              },
              closePath() {
                drawLog.push('closePath');
              },
              fill() {
                drawLog.push('fill');
              },
              stroke() {
                drawLog.push('stroke');
              },
              set fillStyle(_) {},
              set strokeStyle(_) {},
              set lineWidth(_) {},
              set globalAlpha(_) {},
            };
          },
        };
      },
    },
  };

  const instance = mount(container, {});
  assert.equal(typeof instance.mount, 'function');
  assert.equal(appended[0].tagName, 'div');
  assert.ok(drawLog.includes('fillRect'));
});

test('defineCustomElement registers a mountable element class once', () => {
  const registry = new Map();
  const customElements = {
    get(name) {
      return registry.get(name);
    },
    define(name, ctor) {
      registry.set(name, ctor);
    },
  };

  const ctor = defineCustomElement('lava-lamp-widget', { customElements });
  const sameCtor = defineCustomElement('lava-lamp-widget', { customElements });

  assert.equal(typeof ctor, 'function');
  assert.equal(ctor, sameCtor);
  assert.equal(customElements.get('lava-lamp-widget'), ctor);
});
