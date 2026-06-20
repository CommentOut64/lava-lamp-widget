import * as TWGL from 'twgl.js';
import { vertexShader, fragmentShader } from './shaders.js';

const DEG_TO_RAD = Math.PI / 180;
const cameraRadius = 6;
const cameraPhi = 90 * DEG_TO_RAD;
const cameraTheta = 270 * DEG_TO_RAD;
const sinPhiRadius = Math.sin(cameraPhi) * cameraRadius;
const cameraPosition = [
  sinPhiRadius * Math.sin(cameraTheta), // X
  Math.cos(cameraPhi) * cameraRadius, // Y
  sinPhiRadius * Math.cos(cameraTheta), // Z
];

function hexToRgbRatio(hex) {
  const normalized = hex.replace('#', '');
  const size = normalized.length === 3 ? 1 : 2;
  const expand = (part) => (size === 1 ? part + part : part);
  const r = Number.parseInt(expand(normalized.slice(0, size)), 16) / 255;
  const g = Number.parseInt(expand(normalized.slice(size, size * 2)), 16) / 255;
  const b = Number.parseInt(expand(normalized.slice(size * 2, size * 3)), 16) / 255;
  return [r, g, b];
}

export class WebGLRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    const contextAttributes = {
      alpha: true,
      premultipliedAlpha: false,
      antialias: false,
      depth: false,
      stencil: false,
    };

    this.gl = canvas.getContext('webgl2', contextAttributes) || canvas.getContext('webgl', contextAttributes);
    if (!this.gl) {
      throw new Error('WebGL not supported');
    }

    this.programInfo = TWGL.createProgramInfo(this.gl, [vertexShader, fragmentShader]);
    this.gl.useProgram(this.programInfo.program);

    const arrays = {
      position: [-1, -1, 0, 1, -1, 0, -1, 1, 0, -1, 1, 0, 1, -1, 0, 1, 1, 0],
    };
    this.bufferInfo = TWGL.createBufferInfoFromArrays(this.gl, arrays);
    TWGL.setBuffersAndAttributes(this.gl, this.programInfo, this.bufferInfo);
  }

  render(scene) {
    const { width, height, time, theme, particles = [] } = scene;

    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
      this.gl.viewport(0, 0, width, height);
    }

    const bgColor = hexToRgbRatio(theme.liquid[0] || '#101820');
    const lavaRaw = hexToRgbRatio(theme.wax[0] || '#ff7a18');
    const lavaColor = [lavaRaw[0], lavaRaw[1], lavaRaw[2]];

    const MAX_PARTICLES = 72;
    const count = Math.min(particles.length, MAX_PARTICLES);
    const particlesData = new Float32Array(MAX_PARTICLES * 4);

    for (let i = 0; i < count; i++) {
      const p = particles[i];
      // Pass actual pixel coordinates. Flip Y since gl_FragCoord is Y-up.
      particlesData[i * 4 + 0] = p.x;
      particlesData[i * 4 + 1] = height - p.y;
      // Pass visual radius. Balanced multiplier 1.45: smoother than 1.3, snaps better than 1.6
      particlesData[i * 4 + 2] = p.radius * 1.45;
      particlesData[i * 4 + 3] = 0.0;
    }

    try {
      // Clear the canvas to fully transparent so CSS backgrounds show through
      this.gl.clearColor(0.0, 0.0, 0.0, 0.0);
      this.gl.clear(this.gl.COLOR_BUFFER_BIT);
      TWGL.setUniforms(this.programInfo, {
        uTime: time * 1e-3,
        uResolution: [width, height],
        uCameraPosition: cameraPosition,
        backgroundColor: bgColor,
        lavaColor: lavaColor,
        uParticleCount: count,
        uParticles: particlesData,
      });
      TWGL.drawBufferInfo(this.gl, this.bufferInfo);
    } catch (error) {
      console.error(error);
    }
  }
}
