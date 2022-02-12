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
  
  get availableFragments() {
    return this.#graphics.availableFragments;
  }

  getFragmentFor(name) {
    return this.#graphics.getFragmentFor(name);
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

  app = new Application(cvs);
  function cvs_onMouseMove(event) {
    app.mouseMove(event.clientX, event.clientY);
  }
  cvs.addEventListener('mousemove', cvs_onMouseMove);

  const fragmentDropdown = document.getElementById('fragment-dropdown');
  const fragmentInput = document.getElementById('fragment-input');

  for (const fragment of app.availableFragments) {
    const option = document.createElement('OPTION');
    option.textContent = fragment;
    fragmentDropdown.appendChild(option);
  }
  fragmentInput.value = app.getFragmentFor('Circle');

  app.run();
});

