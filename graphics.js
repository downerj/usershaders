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
      position: null,
    },
    uniform: {
      resolution: null,
      time: null,
      user: {
        a: null,
        b: null,
        c: null,
        d: null,
        e: null,
        f: null,
      },
    },
  };
  #buffers = {
    vertex: null,
    index: null,
  };
  #userInputs;
  
  constructor(canvas, userInputs = {}) {
    const gl = Graphics3D.#getGL(canvas);
    if (!gl) {
      throw 'Unable to get WebGL context';
    }
    this.#gl = gl;
    
    this.#program = this.#createProgram(vertexSourceMain, fragmentSourceMain);
    this.#userInputs = userInputs;
    this.#locations.attribute.position = gl.getAttribLocation(this.#program, 'position');
    this.#locations.uniform.time = gl.getUniformLocation(this.#program, 'time');
    this.#locations.uniform.resolution = gl.getUniformLocation(this.#program, 'resolution');
    this.#locations.uniform.user.a = gl.getUniformLocation(this.#program, 'user.a');
    this.#locations.uniform.user.b = gl.getUniformLocation(this.#program, 'user.b');
    this.#locations.uniform.user.c = gl.getUniformLocation(this.#program, 'user.c');
    this.#locations.uniform.user.d = gl.getUniformLocation(this.#program, 'user.d');
    this.#locations.uniform.user.e = gl.getUniformLocation(this.#program, 'user.e');
    
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
      this.#locations.uniform.resolution,
      gl.canvas.clientWidth,
      gl.canvas.clientHeight
    );
    gl.uniform1f(
      this.#locations.uniform.time,
      timestamp
    );
    gl.uniform1f(
      this.#locations.uniform.user.a,
      this.#userInputs.a
    );
    gl.uniform1f(
      this.#locations.uniform.user.b,
      this.#userInputs.b
    );
    gl.uniform1f(
      this.#locations.uniform.user.c,
      this.#userInputs.c
    );
    gl.uniform1f(
      this.#locations.uniform.user.d,
      this.#userInputs.d
    );
    gl.uniform1f(
      this.#locations.uniform.user.e,
      this.#userInputs.e
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
