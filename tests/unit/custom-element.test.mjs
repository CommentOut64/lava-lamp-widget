import test from 'node:test';
import assert from 'node:assert/strict';
import { createLavaLampElement } from '../../src/widget/custom-element.js';

function createHostEnvironment() {
  const appended = [];
  const removed = [];

  class FakeHTMLElement {
    constructor() {
      this.attributes = new Map();
    }

    appendChild(node) {
      appended.push(node);
      return node;
    }

    removeChild(node) {
      removed.push(node);
      return node;
    }

    getAttribute(name) {
      return this.attributes.get(name) ?? null;
    }

    setAttribute(name, value) {
      this.attributes.set(name, String(value));
    }
  }

  const ownerDocument = {
    createElement(tagName) {
      return {
        tagName,
        getContext() {
          return {
            clearRect() {},
            fillRect() {},
            beginPath() {},
            moveTo() {},
            lineTo() {},
            closePath() {},
            fill() {},
            stroke() {},
            set fillStyle(_) {},
            set strokeStyle(_) {},
            set lineWidth(_) {},
            set globalAlpha(_) {},
          };
        },
      };
    },
  };

  return { FakeHTMLElement, ownerDocument, appended, removed };
}

test('custom element mounts exactly once when connected twice', () => {
  const env = createHostEnvironment();
  const LavaLampElement = createLavaLampElement(env.FakeHTMLElement);
  const element = new LavaLampElement();
  element.ownerDocument = env.ownerDocument;

  element.connectedCallback();
  element.connectedCallback();

  assert.equal(env.appended.length, 1);
  assert.ok(element.instance);
  assert.equal(element.instance.container, element);
});

test('custom element destroys instance when disconnected', () => {
  const env = createHostEnvironment();
  const LavaLampElement = createLavaLampElement(env.FakeHTMLElement);
  const element = new LavaLampElement();
  element.ownerDocument = env.ownerDocument;

  element.connectedCallback();
  const mountedCanvas = env.appended[0];
  element.disconnectedCallback();

  assert.equal(element.instance, null);
  assert.equal(env.removed[0], mountedCanvas);
});

test('custom element maps attributes into instance options on connect and update', () => {
  const env = createHostEnvironment();
  const LavaLampElement = createLavaLampElement(env.FakeHTMLElement);
  const element = new LavaLampElement();
  element.ownerDocument = env.ownerDocument;
  element.setAttribute('width', '320');
  element.setAttribute('height', '640');
  element.setAttribute('background-color', '#f4efe8');

  element.connectedCallback();
  assert.equal(element.instance.options.width, 320);
  assert.equal(element.instance.options.height, 640);
  assert.equal(element.instance.options.backgroundColor, '#f4efe8');

  element.attributeChangedCallback('width', '320', '280');
  assert.equal(element.instance.options.width, 280);
});
