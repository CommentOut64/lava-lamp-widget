import { defaults } from './defaults.js';
import { LavaLampInstance } from './widget/lava-lamp-instance.js';
import { createLavaLampElement } from './widget/custom-element.js';

export { defaults };

export function mount(container, options = {}) {
  const instance = new LavaLampInstance(container, options);
  instance.mount();
  return instance;
}

export function defineCustomElement(tagName = 'lava-lamp-widget', host = globalThis) {
  const registry = host.customElements;
  if (!registry) {
    throw new Error('customElements registry is required');
  }

  const existing = registry.get(tagName);
  if (existing) {
    return existing;
  }

  const BaseElement = host.HTMLElement ?? globalThis.HTMLElement ?? class {};
  const ElementCtor = createLavaLampElement(BaseElement);
  registry.define(tagName, ElementCtor);
  return ElementCtor;
}
