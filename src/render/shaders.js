export const vertexShader = `
attribute vec4 position;
void main() {
  gl_Position = position;
}
`;

export const fragmentShader = `
precision mediump float;

uniform float uTime;
uniform vec2 uResolution;
uniform vec3 uCameraPosition;
uniform vec3 backgroundColor;
uniform vec3 lavaColor;

#define MAX_PARTICLES 72
uniform int uParticleCount;
uniform vec4 uParticles[MAX_PARTICLES]; // x, y, z, radius

#define MAX_STEPS 30
#define MAX_DIST 30.0
#define MIN_DIST 1.5
vec4 sphere = vec4(0.0, 0.0, 0.0, 1.0);
vec3 lightpos = vec3(-30.0, 2.0, 0.0);

float opSmoothUnion(float d1, float d2, float k) {
  float h = clamp(0.5 + 0.5 * (d2 - d1) / k, 0.0, 1.0);
  return mix(d2, d1, h) - k * h * (1.0 - h);
}

float getDist(vec3 raypos) {
  float dist = 100.0;

  for (int i = 0; i < MAX_PARTICLES; i++) {
    if (i >= uParticleCount) break;
    float sphereDist = length(raypos - uParticles[i].xyz) - uParticles[i].w;
    if (i == 0) {
      dist = sphereDist;
    } else {
      // k=0.3 provides sharper snapping apart (easier disconnection)
      dist = opSmoothUnion(dist, sphereDist, 0.3);
    }
  }
  
  return dist;
}

vec3 getNormal(vec3 p) {
  return normalize(sphere.xyz - p);
}

float getLight(vec3 p) {
  vec3 lightdir = normalize(lightpos - p);
  vec3 normal = getNormal(p);
  float diff = dot(normal,lightdir);
  return diff;
}

float raymarch(vec3 camera, vec3 dir) {
  float dist = 1.5;

  for (int i = 0; i < MAX_STEPS; i++) {
    vec3 pos = camera + dir * dist;
    float stepdist = getDist(pos);
    dist += stepdist;
    if (dist > MAX_DIST || dist < MIN_DIST) break;
  }

  return dist;
}

void main() {
  vec2 uv = (gl_FragCoord.xy - uResolution.xy * 0.5) / uResolution.y;
  vec3 col = vec3(0.0);

  vec3 camera = uCameraPosition;
  vec3 ray = vec3(1.0, uv.y, uv.x);

  float d = raymarch(camera, normalize(ray));
  vec3 p = camera + ray * d;

  float diff = getLight(p);

  col += vec3(1.0 - diff);
  col = col * 0.5;
  
  gl_FragColor = vec4(
    mix(
      backgroundColor,
      lavaColor,
      col
    ),
    1.0
  );
}
`
