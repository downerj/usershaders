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
  
  #gl;
  
  constructor(canvas) {
    this.#gl = Graphics3D.#getGL(canvas);
    if (!this.#gl) {
      throw 'Unable to get WebGL context';
    }
  }
  
  render(timestamp) {
    const gl = this.#gl;
  }
}
