class Application {
  #graphics;
  #timer = new IntervalTimer(this.#onTick.bind(this), 10);
  mouse = {x: 0, y: 0};
  userInputs = {
    a: 0.005,
    b: 0.00025,
    c: 0,
    d: 0,
    e: 0,
  };
  
  constructor(canvas) {
    this.#graphics = new Graphics3D(canvas, this.mouse, this.userInputs);
    if (!('selectedProgram' in window.localStorage)) {
      window.localStorage.setItem('selectedProgram', 'Hyperbolas A');
    }
    this.#graphics.setProgram(localStorage.getItem('selectedProgram'));
  }
  
  run() {
    this.#timer.resume();
  }
  
  pause() {
    this.#timer.suspend();
  }

  mouseMove(x, y) {
    this.mouse.x = x;
    this.mouse.y = y;
  }

  updateFragment(name, fragment) {
    return this.#graphics.updateFragment(name, fragment);
  }

  setProgram(name) {
    const status = this.#graphics.setProgram(name);
    if (status) {
      window.localStorage.setItem('selectedProgram', name);
    }
    return status;
  }
  
  get availablePrograms() {
    return this.#graphics.availablePrograms;
  }

  #onTick(timestamp) {
    this.#graphics.render(timestamp);
    return true;
  }
}

let app;
window.addEventListener('load', () => {
  const cvs = document.getElementById('cvs');
  
  function window_onResize() {
    cvs.width = cvs.parentElement.clientWidth;
    cvs.height = cvs.parentElement.clientHeight;
  }
  window.addEventListener('resize', window_onResize);
  window_onResize();

  function cvs_onMouseMove(event) {
    app.mouseMove(event.clientX, event.clientY);
  }
  cvs.addEventListener('mousemove', cvs_onMouseMove);
  
  app = new Application(cvs);
  app.run();
});

