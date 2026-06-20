export const vertexShader = `
attribute vec4 position;
void main() {
  gl_Position = position;
}
`;

export const fragmentShader = `
precision highp float;

uniform float uTime;
uniform vec2 uResolution;
// backgroundColor is no longer needed in shader since we output transparent alpha
uniform vec3 lavaColor;

#define MAX_PARTICLES 72
uniform int uParticleCount;
uniform vec4 uParticles[MAX_PARTICLES]; // x, y, visual_radius, unused

// Removed noise functions as they cause high-frequency edge jittering.

// Gaussian density with velocity-based teardrop elongation
float getDensity(vec2 uv) {
    float d = 0.0;
    for (int i = 0; i < MAX_PARTICLES; i++) {
        if (i >= uParticleCount) break;
        
        vec2 pos = uParticles[i].xy;
        float r = uParticles[i].z;
        vec2 delta = uv - pos;
        float distSq = dot(delta, delta);
        // Gaussian falloff
        d += exp(-distSq / (r * r));
    }
    return d;
}

void main() {
    vec2 uv = gl_FragCoord.xy;
    
    // We use the raw UV without domain warping to ensure mathematically perfect, smooth edges.
    float d = getDensity(uv);
    float threshold = 0.5; // Gaussian isosurface threshold
    
    // Output lava color with smooth alpha
    float alpha = smoothstep(threshold - 0.02, threshold + 0.02, d);
    gl_FragColor = vec4(lavaColor, alpha);
}
`;
