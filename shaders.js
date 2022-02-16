const vertexSourceMain = `#version 100
precision highp float;

attribute vec2 position;

void main(void) {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const fragmentSourceMainA = `#version 100
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

#define PI 3.141592653589793

vec3 hsv2rgb(in vec3 hsv) {
  float h = hsv.x;
  float s = hsv.y;
  float v = hsv.z;
  vec3 k = vec3(1.0, 2.0/3.0, 1.0/3.0);
  vec3 p = clamp(abs(6.0*fract(h - k) - 3.0) - 1.0, 0.0, 1.0);
  return v * mix(k.xxx, p, s);
}

uniform vec2 resolution;
uniform float time;
uniform vec2 mouse;
uniform struct {
  float a;
  float b;
  float c;
  float d;
  float e;
} user;`;

const mandelbrotFragment = `
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
  const vec2 offset = vec2(-1.0, 0.3);
  const float zoom = 10.0;
  vec2 p = (fragCoord.xy - c)/(scale*zoom) + offset;

  int iterations = mandelbrot(p);
  if (iterations < 0) {
    fragColor = vec4(0.0, 0.0, 0.0, 1.0);
    return;
  }

  float value = float(iterations)/36.0;
  const float speed = 1.0/2500.0;
  float hue = fract(value + time*speed);
  vec3 rgb = hsv2rgb(vec3(hue, 1.0, 1.0));
  fragColor = vec4(rgb, 1.0);
}
`.trim();

function makeRainbowFragment(valueSegment) {
  return `
void setColor(out vec4 fragColor, in vec4 fragCoord) {
  vec2 c = resolution*0.5;
  float scale = min(resolution.x, resolution.y);
  vec2 p = (fragCoord.xy - c)/scale;
  
  ${valueSegment}

  const float spread = 1.0/200.0;
  const float speed = 1.0/4000.0;
  float hue = fract(value*5.0 + time*speed);
  vec3 rgb = hsv2rgb(vec3(hue, 1.0, 1.0));
  fragColor = vec4(rgb, 1.0);
}`.trim();
}

const fragmentsMain = {
  'Circle': makeRainbowFragment('float value = sqrt(p.x*p.x + p.y*p.y);'),
  'Diagonal Lines': makeRainbowFragment('float value = p.y - p.x;'),
  'Hyperbolas A': makeRainbowFragment('float value = sqrt(abs(p.x*p.x - p.y*p.y));'),
  'Hyperbolas B': makeRainbowFragment('float value = p.x*p.x/p.y - p.y;'),
  'Mandelbrot Set': mandelbrotFragment,
  'Parabolas': makeRainbowFragment('float value = p.x*p.x/p.y;'),
};

const fragmentSourceMainB = `
void main(void) {
  setColor(gl_FragColor, gl_FragCoord);
}`.trim();

function makeFragmentSource(fragment) {
  return fragmentSourceMainA + fragment + fragmentSourceMainB;
}

