const shaderSources = {
  vertex: null,
  fragmentIncludes: {
    header: null,
    complex: null,
    coloring: null,
    main: null,
  },
  fragment: {
    provided: {},
    user: {},
  },
};

// //////////
// VERTEX SHADER
// //////////

shaderSources.vertex = `#version 100
precision highp float;

attribute vec2 position;

void main(void) {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

// //////////
// FRAGMENT SHADER INCLUDES
// //////////

shaderSources.fragmentIncludes.header = `#version 100
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

uniform vec2 resolution;
uniform float time;
uniform vec2 mouse;
`;

shaderSources.fragmentIncludes.complex = `
#define PI 3.141592653589793
#define DEG_TO_RAD PI/180.0
#define RAD_TO_DEG 180.0/PI

const vec2 R = vec2(1.0, 0.0);
const vec2 I = vec2(0.0, 1.0);

vec2 cMul(vec2 a, vec2 b) {
  return vec2(a.x*b.x - a.y*b.y, a.x*b.y + a.y*b.x);
}

vec2 cDiv(vec2 a, vec2 b) {
  float d = b.x*b.x + b.y*b.y;
  return vec2((a.x*b.x + a.y*b.y)/d, (a.y*b.x - a.x*b.y)/d);
}

#define MAX_N 10
vec2 cPowZ(in vec2 z, in int n) {
  if (n == 0) {
    return R;
  }
  vec2 res = R;
  // Custom replacement for int abs(int) for GLSL 1.00.
  int limit = n < 0 ? -n : n;
  for (int i = 0; i < MAX_N; i++) {
    if (i >= limit) {
      break;
    }
    if (n > 1) {
      res = cMul(res, z);
    } else {
      res = cDiv(res, z);
    }
  }
  return res;
}

float cLen(vec2 z) {
  return sqrt(z.x*z.x + z.y*z.y);
}

float cArg(vec2 z) {
  return atan(z.y, z.x);
}

vec2 cPolar(float r, float th) {
  return vec2(r*cos(th), r*sin(th));
}

vec2 cUnit(vec2 z) {
  float d = sqrt(z.x*z.x + z.y*z.y);
  return vec2(z.x/d, z.y/d);
}

vec2 cRotate(vec2 z, float degrees) {
  float r = cLen(z);
  float th = cArg(z);
  return cPolar(r, th + degrees*DEG_TO_RAD);
}
#define SATURATION_RATIO 0.0625

#define CONTOURS
#ifdef CONTOURS
#define CONTOUR_R_FREQUENCY 2.0
#define CONTOUR_R_WIDTH 0.25
#define CONTOUR_A_FREQUENCY 5.0
#define CONTOUR_A_WIDTH 0.5
#define CONTOUR_A2_FREQUENCY 20.0
#define CONTOUR_A2_WIDTH 1.0
#define CONTOUR_HSV_VALUE_MIN 0.5
#define CONTOUR_HSV_VALUE_MAX 1.0
#define CONTOUR_R_MOD 4.0
#define CONTOUR_R_DIVISOR 8.0
#endif

vec3 complex2hsv(vec2 point) {
  float x = point.x;
  float y = point.y;
  float r = sqrt(x*x + y*y);
  float a = atan(y, x)*RAD_TO_DEG;

  float hue = a/360.0;
  float sat = 1.0 - pow(SATURATION_RATIO, r);
#ifndef CONTOURS
  return vec3(hue, sat, 1.0);
#else
  // Dark -> colorful edges.
  float val = CONTOUR_HSV_VALUE_MIN + mod(r, CONTOUR_R_MOD)/CONTOUR_R_DIVISOR;

  // Perpendicular curves.
  float n = mod(a + CONTOUR_A_WIDTH, CONTOUR_A_FREQUENCY);
  if (n <= 2.0*CONTOUR_A_WIDTH) {
    val = 0.75;
  }

  // Radial curves.
  float m = mod(r + CONTOUR_R_WIDTH, CONTOUR_R_FREQUENCY);
  if (r > 1.0 && m <= 2.0*CONTOUR_R_WIDTH) {
    val = 0.5;
  }

  // Bright perpendicular curves.
  float p = mod(a + CONTOUR_A2_WIDTH, CONTOUR_A2_FREQUENCY);
  if (p <= 2.0*CONTOUR_A2_WIDTH) {
    float sat2 = abs(p - CONTOUR_A2_WIDTH)/CONTOUR_A2_WIDTH;
    sat = mix(sat, sat2, 2.0);
    val = mix(val, 1.0, 0.5);
  } else if (sat < 0.5) {
    val = mix(val, 1.0 - sat, 1.0);
  }

  val = clamp(val, CONTOUR_HSV_VALUE_MIN, CONTOUR_HSV_VALUE_MAX);
  return vec3(hue, sat, val);
#endif
}`;

shaderSources.fragmentIncludes.coloring = `
vec4 hsv2rgba(in vec3 hsv) {
  float h = hsv.x;
  float s = hsv.y;
  float v = hsv.z;
  vec3 k = vec3(1.0, 2.0/3.0, 1.0/3.0);
  vec3 p = clamp(abs(6.0*fract(h - k) - 3.0) - 1.0, 0.0, 1.0);
  return vec4(v * mix(k.xxx, p, s), 1.0);
}

vec4 hsvCycled2rgba(in vec3 hsv, in float spread, in float speed) {
  hsv.x = fract(hsv.x*spread + time*speed);
  return hsv2rgba(hsv);
}
`;

shaderSources.fragmentIncludes.main = `
void main(void) {
  setColor(gl_FragColor, gl_FragCoord);
}`;

// //////////
// FRAGMENT SHADERS (PROVIDED)
// //////////

shaderSources.fragment.provided['Mandelbrot Set'] = (
  shaderSources.fragmentIncludes.header +
  shaderSources.fragmentIncludes.coloring + `
int mandelbrot(in vec2 p) {
  vec2 t = vec2(0.0, 0.0);
  const int maxIterations = 1000;
  for (int i = 0; i < maxIterations - 1; i++) {
    if (t.x*t.x + t.y*t.y > 4.0) {
      return i;
    }
    t = vec2(t.x*t.x - t.y*t.y, 2.0*t.x*t.y) + p;
  }
  return -1;
}

void setColor(out vec4 fragColor, in vec4 fragCoord) {
  vec2 c = resolution*0.5;
  float scale = resolution.y;
  vec2 uv = fragCoord.xy;

  const vec2 offset = vec2(-1.0, 0.3);
  const float zoom = 1.0;
  
  // Standard view.
  // vec2 offset = vec2(-1.0, 0.0);
  // const float zoom = -0.5;

  vec2 p = (uv - c)/(scale*pow(10.0, zoom)) + offset;

  int iterations = mandelbrot(p);
  if (iterations < 0) {
    fragColor = vec4(0.0, 0.0, 0.0, 1.0);
    return;
  }

  float value = float(iterations)/-36.0;
  vec3 hsv = vec3(value, 1.0, 1.0);
  fragColor = hsvCycled2rgba(hsv, 1.0, -1.0/4000.0);
}
` + shaderSources.fragmentIncludes.main
).trim();

shaderSources.fragment.provided['Complex Graphs'] = (
  shaderSources.fragmentIncludes.header +
  shaderSources.fragmentIncludes.coloring +
  shaderSources.fragmentIncludes.complex + `
#define FUNCTION_C

#ifdef FUNCTION_A
vec2 func(vec2 z) {
  vec2 a = cMul(z, z) - R;
  vec2 b = z - 2.0*R - I;
  vec2 b2 = cMul(b, b);
  vec2 d = cMul(z, z) + 2.0*R + 2.0*I;
  vec2 o = cDiv(cMul(a, b2), d);
  return o;
}
#elif defined FUNCTION_B
vec2 func(vec2 z) {
  return 2.0*I + R + cMul(z, z);
}
#elif defined FUNCTION_C
vec2 func(vec2 z) {
  return cPowZ(z, 3) - 25.0*R;
}
#endif

#define OFFSET_X 0.0
#define OFFSET_Y 0.0
#define SCALE 0.10
#define CYCLE_SPEED 0.0001

void setColor(out vec4 fragColor, in vec4 fragCoord) {
  vec2 c = resolution.xy*0.5 + vec2(OFFSET_X, OFFSET_Y);
  float scale = SCALE*min(resolution.x, resolution.y);
  vec2 z = (fragCoord.xy - c)/scale;
  vec2 o = func(z);
  vec3 hsv = complex2hsv(o);

  fragColor = hsvCycled2rgba(hsv, 2.0, CYCLE_SPEED);
}
` + shaderSources.fragmentIncludes.main
).trim();

// //////////
// FRAGMENT SHADERS (PROVIDED) (RAINBOWS)
// //////////

function makeRainbowFragment(valueSegment) {
  return (
    shaderSources.fragmentIncludes.header +
    shaderSources.fragmentIncludes.coloring + `
void setColor(out vec4 fragColor, in vec4 fragCoord) {
  vec2 c = resolution*0.5;
  float scale = min(resolution.x, resolution.y);
  vec2 p = (fragCoord.xy - c)/scale;
  
  ${valueSegment}

  vec3 hsv = vec3(value, 1.0, 1.0);
  fragColor = hsvCycled2rgba(hsv, 5.0, 1.0/4000.0);
}
` + shaderSources.fragmentIncludes.main
  ).trim();
}

shaderSources.fragment.provided['Circle'] = makeRainbowFragment(
  'float value = sqrt(p.x*p.x + p.y*p.y);'
);
shaderSources.fragment.provided['Diagonal Lines'] = makeRainbowFragment(
  'float value = p.y - p.x;'
);
shaderSources.fragment.provided['Hyperbolas Simple'] = makeRainbowFragment(
  'float value = sqrt(abs(p.x*p.x - p.y*p.y));'
);
shaderSources.fragment.provided['Hyperbolas Chaotic'] = makeRainbowFragment(
  'float value = p.x*p.x/p.y - p.y;'
);
shaderSources.fragment.provided['Parabolas'] = makeRainbowFragment(
  'float value = p.x*p.x/p.y;'
);

