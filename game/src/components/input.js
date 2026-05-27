const movementKeys = new Map([
  ['KeyW', 'forward'],
  ['ArrowUp', 'forward'],
  ['KeyS', 'backward'],
  ['ArrowDown', 'backward'],
  ['KeyA', 'left'],
  ['ArrowLeft', 'left'],
  ['KeyD', 'right'],
  ['ArrowRight', 'right'],
]);

export function createInput() {
  const state = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    sprint: false,
    restart: false,
  };

  function setKey(event, active) {
    const movement = movementKeys.get(event.code);

    if (movement) {
      state[movement] = active;
      event.preventDefault();
    }

    if (event.code === 'ShiftLeft' || event.code === 'ShiftRight') {
      state.sprint = active;
    }

    if (event.code === 'Space' && active) {
      state.restart = true;
      event.preventDefault();
    }
  }

  window.addEventListener('keydown', (event) => setKey(event, true));
  window.addEventListener('keyup', (event) => setKey(event, false));

  return {
    state,
    consumeRestart() {
      const restart = state.restart;
      state.restart = false;
      return restart;
    },
  };
}
