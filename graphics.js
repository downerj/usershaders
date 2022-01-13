class Graphics3D {
  static #getGL(canvas) {
    for (const name of ['webgl', 'webgl-experimental']) {
      const gl = canvas.getContext(name);
      if (gl) {
        return gl;
      }
    }
    return null;
  }
  
  static #surface = {
    vertices: new Float32Array([
      -1, -1,
      1, -1,
      1, 1,
      -1, 1,
    ]),
    indices: new Uint16Array([
      0, 1, 2,
      0, 2, 3,
    ]),
  };
  
  #gl;
  #program;
  
  constructor(canvas) {
    this.#gl = Graphics3D.#getGL(canvas);
    if (!this.#gl) {
      throw 'Unable to get WebGL context';
    }
    
    this.#program = this.#createProgram(vertexSourceMain, fragmentSourceMain);
  }
  
  render(timestamp) {
    const gl = this.#gl;
    
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clearDepth(1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.viewport(0, 0, gl.canvas.clientWidth, gl.canvas.clientHeight);
  }
  
  #createShader(type, source) {
    const gl = this.#gl;
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    return shader;
  }
  
  #createProgram(vertexSource, fragmentSource) {
    const gl = this.#gl;
    const vertexShader = this.#createShader(gl.VERTEX_SHADER, vertexSource);
    const fragmentShader = this.#createShader(gl.FRAGMENT_SHADER, fragmentSource);
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    const status = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (!status) {
      const programLog = gl.getProgramInfoLog(program);
      const vertexLog = gl.getShaderInfoLog(vertexShader);
      const fragmentLog = gl.getShaderInfoLog(fragmentShader);
      console.error(`Program failed to link: ${programLog}`);
      if (vertexLog.length > 0) {
        console.error(`Vertex shader log: ${vertexLog}`);
      }
      if (fragmentLog.length > 0) {
        console.error(`Fragment shader log: ${fragmentLog}`);
      }
    }
    
    gl.detachShader(program, vertexShader);
    gl.detachShader(program, fragmentShader);
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);
    return status ? program : null;
  }
  
  #createBuffer(target, data, usage) {
    const gl = this.#gl;
    const buffer = gl.createBuffer(target);
    gl.bindBuffer(target, buffer);
    gl.bufferData(target, data, usage);
    gl.bindBuffer(target, null);
    return buffer;
  }
}
