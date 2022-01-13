class Application {
  #canvas;
  #timer = new IntervalTimer(this.#onTick.bind(this), 10);
  
  constructor(canvas) {
    this.#canvas = canvas;
  }
  
  run() {
    this.#timer.resume();
  }
  
  pause() {
    this.#timer.suspend();
  }
  
  #onTick(timestamp) {
    return true;
  }
}

window.addEventListener('load', () => {
  const cvs = document.getElementById('cvs');
  
  function window_onResize() {
    cvs.width = cvs.parentElement.clientWidth;
    cvs.height = cvs.parentElement.clientHeight;
  }
  window.addEventListener('resize', window_onResize);
  window_onResize();
  
  const app = new Application(cvs);
  app.run();
});
