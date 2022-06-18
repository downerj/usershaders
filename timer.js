class IntervalTimer {
  #callback;
  #interval;
  #handle = null;
  #previous = 0;
  #maxIterations;
  #iterations;
  
  constructor(callback, interval) {
    this.#callback = callback;
    this.#interval = interval;
  }

  resume(iterations = Infinity) {
    if (this.#handle !== null) {
      return;
    }
    this.#maxIterations = iterations;
    this.#iterations = 0;
    this.#update();
  }
  
  suspend() {
    if (this.#handle === null) {
      return;
    }
    this.#cancel();
  }
  
  #update() {
    if (this.#maxIterations === Infinity || this.#iterations < this.#maxIterations) {
      this.#iterations++;
      this.#handle = window.requestAnimationFrame(this.#onAnimate.bind(this));
    } else {
      this.#cancel();
    }
  }
  
  #cancel() {
    window.cancelAnimationFrame(this.#handle);
    this.#handle = null;
  }
  
  #onAnimate(timestamp) {
    if (timestamp - this.#previous >= this.#interval) {
      this.#previous = timestamp;
      const status = this.#callback(timestamp);
      if (!status) {
        this.#cancel();
        return;
      }
    }
    
    this.#update();
  }
}
