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
  #locations = {
    attribute: {
      inPosition: null,
    },
    uniform: {
      uResolution: null,
      uTime: null,
    },
  };
  #buffers = {
    vertex: null,
    index: null,
  };
  
  constructor(canvas) {
    const gl = Graphics3D.#getGL(canvas);
    if (!gl) {
      throw 'Unable to get WebGL context';
    }
    this.#gl = gl;
    
    this.#program = this.#createProgram(vertexSourceMain, fragmentSourceMain);
    for (const name in this.#locations.attribute) {
      this.#locations.attribute[name] = gl.getAttribLocation(this.#program, name);
    }
    for (const name in this.#locations.uniform) {
      this.#locations.uniform[name] = gl.getUniformLocation(this.#program, name);
    }
    
    this.#buffers.vertex = this.#createBuffer(
      gl.ARRAY_BUFFER,
      Graphics3D.#surface.vertices,
      gl.STATIC_DRAW
    );
    this.#buffers.index = this.#createBuffer(
      gl.ELEMENT_ARRAY_BUFFER,
      Graphics3D.#surface.indices,
      gl.STATIC_DRAW
    );
  }
  
  render(timestamp) {
    const gl = this.#gl;
    
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clearDepth(1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.viewport(0, 0, gl.canvas.clientWidth, gl.canvas.clientHeight);
    
    gl.useProgram(this.#program);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, this.#buffers.vertex);
    gl.vertexAttribPointer(
      this.#locations.attribute.inPosition,
      2,
      gl.FLOAT,
      false,
      0,
      0
    );
    gl.enableVertexAttribArray(this.#locations.attribute.inPosition);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    
    gl.uniform2f(
      this.#locations.uniform.uResolution,
      gl.canvas.clientWidth,
      gl.canvas.clientHeight
    );
    gl.uniform1f(
      this.#locations.uniform.uTime,
      timestamp
    );
    
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.#buffers.index);
    gl.drawElements(
      gl.TRIANGLES,
      Graphics3D.#surface.indices.length,
      gl.UNSIGNED_SHORT,
      0
    );
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
