const vertexSourceMain = `#version 100
precision highp float;

attribute vec2 inPosition;

void main(void) {
  gl_Position = vec4(inPosition, 0.0, 1.0);
}
`;

const fragmentSourceMain = `#version 100
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
  vec3 p = clamp(abs(6.0 * fract(h - k) - 3.0) - 1.0, 0.0, 1.0);
  return v * mix(k.xxx, p, s);
}

uniform vec2 uResolution;
uniform float uTime;

// User inputs.
uniform float uSpread;
uniform float uSpeed;

void setColor(out vec4 fragColor, in vec4 fragCoord) {
  float w = uResolution.x;
  float h = uResolution.y;
  float x = fragCoord.x;
  float y = fragCoord.y;
  float xp = x - w*0.5;
  float yp = y - h*0.5;
  float value = sqrt(xp*xp + yp*yp);
  float hue = mod(value * uSpread + uTime * uSpeed, 360.0);
  vec3 rgb = hsv2rgb(vec3(hue, 1.0, 1.0));
  fragColor = vec4(rgb, 1.0);
}

void main(void) {
  setColor(gl_FragColor, gl_FragCoord);
}
`;
