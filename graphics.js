function isPowerOf2(value) {
  return (value & (value - 1)) == 0;
}

class UserProgramData {
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
    this.#program = Graphics3D.createProgram(gl, vertexSourceMain, makeFragmentSource(this.#fragment));
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
    if (this.#program === null) {
      return;
    }
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
    textureCoords: new Float32Array([
      0, 0,
      0, 1,
      1, 1,
      1, 0,
    ]),
  };
  
  #gl;
  #programDatas = {};
  #programName;
  #programData;
  #buffers = {
    vertex: null,
    index: null,
    textureCoords: null,
  };
  #texture;
  #textureWidth;
  #textureHeight;
  #framebuffer;
  #screenProgram;
  #screenLocations = {
    position: null,
    textureCoordIn: null,
    texture: null,
  };
  #mouse;
  
  constructor(canvas, mouse) {
    const gl = Graphics3D.#getGL(canvas);
    if (!gl) {
      throw 'Unable to get WebGL context';
    }
    this.#gl = gl;
    this.#mouse = mouse;
    const pixelWidth = 10;
    this.#textureWidth = Math.floor(canvas.clientWidth / pixelWidth);
    this.#textureHeight = Math.floor(canvas.clientHeight / pixelWidth);
    
    for (const name in fragmentsMain) {
      const fragment = fragmentsMain[name];
      this.updateFragment(name, fragment);
    }
    this.setFragment(null);
    
    this.#buffers.vertex = Graphics3D.createBuffer(
      gl,
      gl.ARRAY_BUFFER,
      Graphics3D.#surface.vertices,
      gl.STATIC_DRAW
    );
    this.#buffers.index = Graphics3D.createBuffer(
      gl,
      gl.ELEMENT_ARRAY_BUFFER,
      Graphics3D.#surface.indices,
      gl.STATIC_DRAW
    );
    this.#buffers.textureCoords = Graphics3D.createBuffer(
      gl,
      gl.ARRAY_BUFFER,
      Graphics3D.#surface.textureCoords,
      gl.STATIC_DRAW
    );

    this.#texture = Graphics3D.createBlankTexture(
      gl,
      this.#textureWidth,
      this.#textureHeight
    );
    this.#framebuffer = Graphics3D.createTextureFramebuffer(gl, this.#texture);
    this.#screenProgram = Graphics3D.createProgram(
      gl,
      vertexSourceScreen,
      fragmentSourceScreen
    );
    this.#screenLocations.position = gl.getAttribLocation(
      this.#screenProgram,
      'position'
    );
    this.#screenLocations.textureCoordIn = gl.getAttribLocation(
      this.#screenProgram,
      'textureCoordIn'
    );
    this.#screenLocations.texture = gl.getUniformLocation(
      this.#screenProgram,
      'texture'
    );
  }

  updateFragment(name, fragment) {
    try {
      if (name in this.#programDatas) {
        this.#programDatas[name].fragment = fragment;
      } else {
        this.#programDatas[name] = new UserProgramData(this.#gl, fragment);
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
    const canvasWidth = gl.canvas.clientWidth;
    const canvasHeight = gl.canvas.clientHeight;

    // Draw to the texture.

    if (this.#programData === null) {
      return;
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.#framebuffer);
    gl.clearColor(1.0, 1.0, 1.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.enable(gl.BLEND);
    gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ZERO, gl.ONE);
    gl.disable(gl.DEPTH_TEST);
    gl.viewport(0, 0, this.#textureWidth, this.#textureHeight);
    
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
      this.#textureWidth,
      this.#textureHeight
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

    gl.disable(gl.BLEND);
    gl.disableVertexAttribArray(this.#programData.positionLocation);

    // Draw to the screen.

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.useProgram(this.#screenProgram);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clearDepth(1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.viewport(0, 0, canvasWidth, canvasHeight);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, this.#buffers.vertex);
    gl.vertexAttribPointer(
      this.#screenLocations.position,
      2,
      gl.FLOAT,
      false,
      0,
      0
    );
    gl.enableVertexAttribArray(this.#screenLocations.position);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, this.#buffers.textureCoords);
    gl.vertexAttribPointer(
      this.#screenLocations.textureCoordIn,
      2,
      gl.FLOAT,
      false,
      0,
      0
    );
    gl.enableVertexAttribArray(this.#screenLocations.textureCoordIn);
    
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.#texture);
    gl.uniform1i(this.#screenLocations.texture, 0);
    
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.#buffers.index);
    gl.drawElements(
      gl.TRIANGLES,
      Graphics3D.#surface.indices.length,
      gl.UNSIGNED_SHORT,
      0
    );
    
    gl.disableVertexAttribArray(this.#screenLocations.position);
    gl.disableVertexAttribArray(this.#screenLocations.textureCoordIn);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
  }
     
  static createBuffer(gl, target, data, usage) {
    const buffer = gl.createBuffer(target);
    gl.bindBuffer(target, buffer);
    gl.bufferData(target, data, usage);
    gl.bindBuffer(target, null);
    return buffer;
  }

  static createBlankTexture(gl, width, height) {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      width,
      height,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      new Uint8Array(width * height * 4)
    );

    if (isPowerOf2(width) && isPowerOf2(height)) {
       gl.generateMipmap(gl.TEXTURE_2D);
    } else {
       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    }
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.bindTexture(gl.TEXTURE_2D, null);
    return texture;
  }

  static createTextureFramebuffer(gl, texture) {
    const framebuffer = gl.createFramebuffer();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      texture,
      0
    );
    const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    if (status !== gl.FRAMEBUFFER_COMPLETE) {
      console.error(`Error creating framebuffer with texture: Status code ${status}`);
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.bindTexture(gl.TEXTURE_2D, null);
    return status ? framebuffer : null;
  }

  static createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    return shader;
  }
  
  static createProgram(gl, vertexSource, fragmentSource) {
    const vertexShader = Graphics3D.createShader(gl, gl.VERTEX_SHADER, vertexSource);
    const fragmentShader = Graphics3D.createShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
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
