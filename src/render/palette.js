function hexToRgb(hex) {
  const normalized = hex.replace('#', '');
  const size = normalized.length === 3 ? 1 : 2;
  const expand = (part) => (size === 1 ? part + part : part);
  const r = Number.parseInt(expand(normalized.slice(0, size)), 16);
  const g = Number.parseInt(expand(normalized.slice(size, size * 2)), 16);
  const b = Number.parseInt(expand(normalized.slice(size * 2, size * 3)), 16);
  return { r, g, b };
}

function luminanceFromHex(hex) {
  const { r, g, b } = hexToRgb(hex);
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

export function resolveTheme(options = {}) {
  if (options.backgroundMode === 'custom' && options.palette) {
    return {
      wax: options.palette.wax,
      liquid: options.palette.liquid,
      glassEdgeAlpha: 0.36,
      shadowAlpha: 0.24,
    };
  }

  const backgroundColor = options.backgroundColor ?? '#101820';
  const luminance = luminanceFromHex(backgroundColor);
  const darkBackground = options.backgroundMode === 'dark' || (options.backgroundMode !== 'light' && luminance < 0.45);

  return {
    wax: darkBackground ? ['#ff7a18', '#ffb347'] : ['#d95f02', '#f4a261'],
    liquid: darkBackground ? ['#13293d', '#1f4e5f'] : ['#dbe9f4', '#c8dceb'],
    glassEdgeAlpha: darkBackground ? 0.44 : 0.24,
    shadowAlpha: darkBackground ? 0.3 : 0.16,
  };
}
