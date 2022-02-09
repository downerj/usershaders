const vertexSourceMain = `#version 100
precision highp float;

attribute vec2 position;

void main(void) {
  gl_Position = vec4(position, 0.0, 1.0);
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
  vec3 p = clamp(abs(6.0*fract(h - k) - 3.0) - 1.0, 0.0, 1.0);
  return v * mix(k.xxx, p, s);
}

uniform vec2 resolution;
uniform float time;

// User inputs.
uniform float spread;
uniform float speed;

void setColor(out vec4 fragColor, in vec4 fragCoord) {
  vec2 p = fragCoord.xy - resolution*0.5;

  float value = sqrt(p.x*p.x + p.y*p.y);
  
  float hue = mod(value*spread + time*speed, 360.0);
  vec3 rgb = hsv2rgb(vec3(hue, 1.0, 1.0));
  fragColor = vec4(rgb, 1.0);
}

void main(void) {
  setColor(gl_FragColor, gl_FragCoord);
}
`;
