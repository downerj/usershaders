const storage = new class {
  getLocalItem(key) {
    try {
      return window.localStorage.getItem(key);
    } catch (_e) {
      return null;
    }
  }

  setLocalItem(key, value) {
    try {
      window.localStorage.setItem(key, value);

      return true;
    } catch (_e) {
      return false;
    }
  }

  removeLocalItem(key) {
    try {
      window.localStorage.removeItem(key);

      return true;
    } catch (_e) {
      return false;
    }
  }

  get keys() {
    try {
      return Object.keys(window.localStorage);
    } catch (_e) {
      return [];
    }
  }
}();

class Application {
  #graphics;
  #timer = new IntervalTimer(this.#onTick.bind(this), 10);
  #mouse = {x: 0, y: 0};
  
  constructor(canvas) {
    this.#graphics = new Graphics3D(canvas, this.#mouse);
    let selectedFragment = storage.getLocalItem('selectedProgram');
    if (!selectedFragment) {
      const defaultProgram = 'Hyperbolas A';
      storage.setLocalItem('selectdProgram', defaultProgram);
      selectedFragment = defaultProgram;
    }
    this.#graphics.setFragment(selectedFragment);
  }
  
  run() {
    this.#timer.resume();
  }
  
  pause() {
    this.#timer.suspend();
  }

  mouseMove(x, y) {
    this.#mouse.x = x;
    this.#mouse.y = y;
  }

  updateFragment(name, fragment) {
    return this.#graphics.updateFragment(name, fragment);
  }

  setFragment(name) {
    const status = this.#graphics.setFragment(name);
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

  get currentFragment() {
    return this.#graphics.currentFragment;
  }

  #onTick(timestamp) {
    this.#graphics.render(timestamp);
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

  app = new Application(cvs);
  cvs.addEventListener('mousemove', () => {
    app.mouseMove(event.clientX, event.clientY);
  });

  const menuToggle = document.getElementById('menu-toggle');
  menuToggle.checked = false;
  cvs.addEventListener('click', () => {
    menuToggle.checked = false;
  });
  const menuOpenButton = document.getElementById('menu-open-button');
  const menuCloseButton = document.getElementById('menu-close-button');
  menuToggle.addEventListener('input', () => {
    menuOpenButton.hidden = menuToggle.checked;
    menuCloseButton.hidden = !menuToggle.checked;
  });

  const fragmentDropdown = document.getElementById('fragment-dropdown');
  const fragmentInput = document.getElementById('fragment-input');

  for (const fragment of app.availableFragments) {
    const option = document.createElement('OPTION');
    option.textContent = fragment;
    option.value = fragment;
    fragmentDropdown.appendChild(option);
  }
  const currentFragment = app.currentFragment;
  const index = (() => {
    for (const [index, option] of [...fragmentDropdown.options].entries()) {
      if (option.value === currentFragment) {
        return index;
      }
    }
  })();
  fragmentDropdown.selectedIndex = index;
  fragmentInput.value = app.getFragmentFor(currentFragment);

  fragmentDropdown.addEventListener('input', () => {
    const selectedFragment = fragmentDropdown.selectedOptions[0].value;
    app.setFragment(selectedFragment);
    fragmentInput.value = app.getFragmentFor(selectedFragment);
  });

  const viewIncludedButton = document.getElementById('view-included-button');
  const viewFragmentButton = document.getElementById('view-fragment-button');
  const includedInput = document.getElementById('included-input');
  includedInput.value = fragmentSourceMainA;

  viewIncludedButton.addEventListener('click', () => {
    viewFragmentButton.hidden = false;
    fragmentInput.hidden = true;
    viewIncludedButton.hidden = true;
    includedInput.hidden = false;
  });
  viewFragmentButton.addEventListener('click', () => {
    viewFragmentButton.hidden = true;
    fragmentInput.hidden = false;
    viewIncludedButton.hidden = false;
    includedInput.hidden = true;
  });

  app.run();
});

