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
uniform vec3 backgroundColor;
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
    
    if (d > threshold) {
        // Render a perfectly flat, uniform 2D solid color without any 3D shading or highlights.
        // This ensures the edge color is 100% identical to the interior color.
        gl_FragColor = vec4(lavaColor, 1.0);
    } else {
        gl_FragColor = vec4(backgroundColor, 1.0);
    }
}
`;
