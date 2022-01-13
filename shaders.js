const vertexSourceMain = `#version 100
precision highp float;

attribute vec2 inPosition;

void main() {
  gl_Position = vec4(inPosition, 0.0, 1.0);
}
`;

const fragmentSourceMain = `#version 100
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

uniform vec2 uResolution;
uniform float uTime;

void main() {
  gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
}
`;
