#version 320 es
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

// #####
// ##### Uniforms
// #####

uniform vec2 resolution;
uniform float time;

// #####
// ##### Math constants
// #####

#define E 2.71828182845904
#define PI 3.141592653589793
#define DEG_TO_RAD PI/180.0
#define RAD_TO_DEG 180.0/PI

// #####
// ##### Math complex functions
// #####

const vec2 R = vec2(1.0, 0.0);
const vec2 I = vec2(0.0, 1.0);

vec2 cmul(in vec2 a, in vec2 b) {
  return vec2(a.x*b.x - a.y*b.y, a.x*b.y + a.y*b.x);
}

vec2 cdiv(in vec2 a, in vec2 b) {
  float d = b.x*b.x + b.y*b.y;
  return vec2((a.x*b.x + a.y*b.y)/d, (a.y*b.x - a.x*b.y)/d);
}

#define MAX_N 10
vec2 cpowz(in vec2 z, in int n) {
  if (n == 0) {
    return R;
  }
  vec2 res = R;
  // Custom replacement for int abs(int) for GLSL 1.00.
  //int limit = n < 0 ? -n : n;
  int limit = abs(n);
  for (int i = 0; i < MAX_N; i++) {
    if (i >= limit) {
      break;
    }
    if (n > 1) {
      res = cmul(res, z);
    } else {
      res = cdiv(res, z);
    }
  }
  return res;
}

float clen(in vec2 z) {
  return sqrt(z.x*z.x + z.y*z.y);
}

float carg(in vec2 z) {
  return atan(z.y, z.x);
}

vec2 cpolar(in float r, in float th) {
  return vec2(r*cos(th), r*sin(th));
}

vec2 cunit(in vec2 z) {
  float d = sqrt(z.x*z.x + z.y*z.y);
  return vec2(z.x/d, z.y/d);
}

vec2 crotate(in vec2 z, in float degrees) {
  float r = clen(z);
  float th = carg(z);
  return cpolar(r, th + degrees*DEG_TO_RAD);
}

vec2 ccos(in vec2 z) {
	return vec2(
		cos(z.x) * cosh(z.y),
		-1. * sin(z.x) * sinh(z.y)
	);
}

vec2 csin(in vec2 z) {
	return vec2(
		sin(z.x) * cosh(z.y),
		cos(z.x) * sinh(z.y)
	);
}

vec2 ctan(in vec2 z) {
	vec2 n = vec2(tan(z.x), tanh(z.y));
	vec2 d = vec2(1.0, -1.0 * tan(z.x) * tanh(z.y));
	return cdiv(n, d);
}

// #####
// ##### Contours
// #####

#define SATURATION_RATIO 0.0625

#define USE_CONTOURS
#ifdef USE_CONTOURS
#define CONTOUR_R_FREQUENCY 2.0
#define CONTOUR_R_WIDTH 0.25
#define CONTOUR_A_FREQUENCY 5.0
#define CONTOUR_A_WIDTH 0.5
#define CONTOUR_A2_FREQUENCY 40.0
#define CONTOUR_A2_WIDTH 5.0
#define CONTOUR_HSV_VALUE_MIN 0.5
#define CONTOUR_HSV_VALUE_MAX 1.0
#define CONTOUR_R_MOD 4.0
#define CONTOUR_R_DIVISOR 8.0
#endif

// #####
// ##### View & colors
// #####

#define OFFSET_X 0.0
#define OFFSET_Y 0.0
#define SCALE 0.10
//#define DO_HUE_CYCLE
#define CYCLE_SPEED 0.1
#define CYCLE_SPREAD 3.0

vec4 hsv2rgba(in vec3 hsv) {
#ifdef DO_HUE_CYCLE
  float h = fract(hsv.x*CYCLE_SPREAD + time*CYCLE_SPEED);
#else
  float h = hsv.x;
#endif
  float s = hsv.y;
  float v = hsv.z;
  vec3 k = vec3(1.0, 2.0/3.0, 1.0/3.0);
  vec3 p = clamp(abs(6.0*fract(h - k) - 3.0) - 1.0, 0.0, 1.0);
  vec4 rgba = vec4(v * mix(k.xxx, p, s), 1.0);
  return rgba;
}

vec3 complex2hsv(in vec2 point) {
  float x = point.x;
  float y = point.y;
  float r = sqrt(x*x + y*y);
  float a = atan(y, x)*RAD_TO_DEG;

  float hue = a/360.0;
  float sat = 1.0 - pow(SATURATION_RATIO, r);
#ifndef USE_CONTOURS
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
}

// #####
// ##### Primary functions
// #####

#define FUNCTION_D

#ifdef FUNCTION_A
#undef OFFSET_X
#define OFFSET_X -70.0
vec2 func(in vec2 z) {
  vec2 a = cmul(z, z) - R;
  vec2 b = z - 2.0*R - I;
  vec2 b2 = cmul(b, b);
  vec2 d = cmul(z, z) + 2.0*R + 2.0*I;
  vec2 o = cdiv(cmul(a, b2), d);
  return o;
}
#elif defined FUNCTION_B
vec2 func(in vec2 z) {
  return 2.0*I + R + cmul(z, z);
}
#elif defined FUNCTION_C
vec2 func(in vec2 z) {
  return cpowz(z, 3) - 25.0*R;
}
#elif defined FUNCTION_D
#undef SCALE
#define SCALE 0.25
vec2 func(in vec2 z) {
  return ctan(z);
}
#endif

// #####
// ##### Main
// #####

void setColor(out vec4 fragColor, in vec4 fragCoord) {
  vec2 c = resolution.xy*0.5 + vec2(OFFSET_X, OFFSET_Y);
  float scale = SCALE*min(resolution.x, resolution.y);
  vec2 z = (fragCoord.xy - c)/scale;
  vec2 o = func(z);
  vec3 hsv = complex2hsv(o);

  fragColor = hsv2rgba(hsv);
}

out vec4 fragColor;
void main(void) {
  setColor(fragColor, gl_FragCoord);
}
