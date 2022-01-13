class IntervalTimer {
  #callback;
  #interval;
  #handle = null;
  #previous = 0;
  
  constructor(callback, interval) {
    this.#callback = callback;
    this.#interval = interval;
  }
  
  resume() {
    if (this.#handle !== null) {
      return;
    }
    this.#update();
  }
  
  suspend() {
    if (this.#handle === null) {
      return;
    }
    this.#cancel();
  }
  
  #update() {
    this.#handle = window.requestAnimationFrame(this.#onAnimate.bind(this));
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
