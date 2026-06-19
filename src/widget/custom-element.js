import { LavaLampInstance } from './lava-lamp-instance.js';

function readOptions(element, overrides = {}) {
  const width = overrides.width ?? element.getAttribute?.('width');
  const height = overrides.height ?? element.getAttribute?.('height');
  const backgroundColor = overrides.backgroundColor ?? element.getAttribute?.('background-color');

  return {
    ...(width ? { width: Number(width) } : {}),
    ...(height ? { height: Number(height) } : {}),
    ...(backgroundColor ? { backgroundColor } : {}),
  };
}

export function createLavaLampElement(BaseElement = globalThis.HTMLElement ?? class {}) {
  return class LavaLampElement extends BaseElement {
    static get observedAttributes() {
      return ['width', 'height', 'background-color'];
    }

    connectedCallback() {
      if (!this.instance) {
        this.instance = new LavaLampInstance(this, readOptions(this));
        this.instance.mount();
      }
    }

    attributeChangedCallback(name, oldValue, newValue) {
      if (oldValue === newValue || !this.instance) {
        return;
      }

      const overrides =
        name === 'width'
          ? { width: newValue }
          : name === 'height'
            ? { height: newValue }
            : name === 'background-color'
              ? { backgroundColor: newValue }
              : {};

      this.instance.setOptions(readOptions(this, overrides));
    }

    disconnectedCallback() {
      this.instance?.destroy();
      this.instance = null;
    }
  };
}
