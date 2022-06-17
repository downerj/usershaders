class ProgramData {
  #gl;
  #fragment;
  #program = null;
  #positionLocation = null;
  #resolutionLocation = null;
  #timeLocation = null;
  #mouseLocation = null;

  constructor(gl, fragment) {
    this.#gl = gl;
    this.#fragment = fragment;
  }
  
  prepareProgram() {
    const gl = this.#gl;
    this.#program = this.#createProgram(shaderSources.vertex, this.#fragment);
    if (this.#program === null) {
      throw 'Error construction program from fragment';
    }
    this.#positionLocation = gl.getAttribLocation(this.#program, 'position');
    this.#resolutionLocation = gl.getUniformLocation(this.#program, 'resolution');
    this.#timeLocation = gl.getUniformLocation(this.#program, 'time');
    this.#mouseLocation = gl.getUniformLocation(this.#program, 'mouse');
  }

  releaseProgram() {
    const gl = this.#gl;
    gl.deleteProgram(this.#program);
    this.#program = null;
  }

  get fragment() {
    return this.#fragment;
  }

  set fragment(value) {
    this.#fragment = value;
  }

  get program() {
    return this.#program;
  }

  get positionLocation() {
    return this.#positionLocation;
  }

  get resolutionLocation() {
    return this.#resolutionLocation;
  }

  get timeLocation() {
    return this.#timeLocation;
  }

  get mouseLocation() {
    return this.#mouseLocation;
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
}

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
      -1, 1,
      1, 1,
      1, -1,
    ]),
    indices: new Uint16Array([
      0, 1, 2,
      0, 2, 3,
    ]),
  };
  
  #gl;
  #programDatas = {};
  #programName;
  #programData;
  #buffers = {
    vertex: null,
    index: null,
  };
  #mouse;
  
  constructor(canvas, mouse) {
    const gl = Graphics3D.#getGL(canvas);
    if (!gl) {
      throw 'Unable to get WebGL context';
    }
    this.#gl = gl;
    this.#mouse = mouse;
    
    for (const name in shaderSources.fragment.provided) {
      const fragment = shaderSources.fragment.provided[name];
      this.updateFragment(name, fragment);
    }
    this.setFragment(null);
    
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

  updateFragment(name, fragment) {
    try {
      if (name in this.#programDatas) {
        this.#programDatas[name].fragment = fragment;
      } else {
        this.#programDatas[name] = new ProgramData(this.#gl, fragment);
      }
      return true;
    } catch (e) {
      console.error(`Fragment "${name}": ${e}`);
      return false;
    }
  }

  setFragment(name) {
    if (name === null) {
      this.#programName = null;
      this.#programData = null;
      return null;
    } else if (!(name in this.#programDatas)) {
      return false;
    }

    if (this.#programData !== null) {
      this.#programData.releaseProgram();
    }

    this.#programName = name;
    this.#programData = this.#programDatas[name];
    this.#programData.prepareProgram();
    return true;
  }
  
  get availableFragments() {
    return Object.keys(this.#programDatas);
  }

  getFragmentFor(name) {
    return this.#programDatas[name]?.fragment ?? null;
  }

  get currentFragment() {
    return this.#programName;
  }
  
  render(timestamp) {
    const gl = this.#gl;
    
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clearDepth(1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.viewport(0, 0, gl.canvas.clientWidth, gl.canvas.clientHeight);
    
    if (this.#programData === null) {
      return;
    }
    gl.useProgram(this.#programData.program);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, this.#buffers.vertex);
    gl.vertexAttribPointer(
      this.#programData.positionLocation,
      2,
      gl.FLOAT,
      false,
      0,
      0
    );
    gl.enableVertexAttribArray(this.#programData.positionLocation);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    
    gl.uniform2f(
      this.#programData.resolutionLocation,
      gl.canvas.clientWidth,
      gl.canvas.clientHeight
    );
    gl.uniform1f(
      this.#programData.timeLocation,
      timestamp
    );
    gl.uniform2f(
      this.#programData.mouseLocation,
      this.#mouse.x,
      gl.canvas.clientHeight - this.#mouse.y
    );
    
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.#buffers.index);
    gl.drawElements(
      gl.TRIANGLES,
      Graphics3D.#surface.indices.length,
      gl.UNSIGNED_SHORT,
      0
    );
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
