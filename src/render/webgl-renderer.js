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
      alpha: false,
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
    const lavaColor = [lavaRaw[0] * 2.0, lavaRaw[1] * 1.5, lavaRaw[2] - 0.2];

    const MAX_PARTICLES = 72;
    const count = Math.min(particles.length, MAX_PARTICLES);
    const uParticles = new Float32Array(MAX_PARTICLES * 4);

    for (let i = 0; i < count; i++) {
      const p = particles[i];
      // x is depth in shader. We can add a slight pseudo-3D depth variation
      uParticles[i * 4 + 0] = (i % 3 - 1) * 0.2;
      // The camera looks from x=-6 towards origin. Intersection with x=0 plane is at distance 6.
      // uv.y maps to [-0.5, 0.5], so world y at x=0 maps to [-3.0, 3.0].
      uParticles[i * 4 + 1] = (1.0 - p.y / height) * 6.0 - 3.0;
      
      // uv.x maps to [-0.5*aspect, 0.5*aspect], so world z at x=0 maps to [-3.0*aspect, 3.0*aspect].
      const aspect = width / height;
      const zRange = 6.0 * aspect;
      uParticles[i * 4 + 2] = (p.x / width) * zRange - (zRange / 2.0);
      
      // Scale radius proportionally
      uParticles[i * 4 + 3] = (p.radius / width) * zRange;
    }

    try {
      TWGL.setUniforms(this.programInfo, {
        uTime: time * 1e-3,
        uResolution: [width, height],
        uCameraPosition: cameraPosition,
        backgroundColor: bgColor,
        lavaColor: lavaColor,
        uParticleCount: count,
        uParticles: uParticles,
      });
      TWGL.drawBufferInfo(this.gl, this.bufferInfo);
    } catch (error) {
      console.error(error);
    }
  }
}
