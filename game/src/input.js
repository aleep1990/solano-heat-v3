// SOLANO HEAT — keyboard + mouse input.
// Tracks held keys, edge-triggered presses (consumed once per frame),
// and pointer orbit deltas. No game logic lives here.

export function createInput() {
  const keys = new Set();
  const pressed = new Set();
  const state = {
    keys, pressed,
    mouseX: 0, mouseY: 0,
    lookDX: 0, lookDY: 0,
    locked: false,
  };
  window.addEventListener('keydown', (e) => {
    if (e.repeat) return;
    keys.add(e.code);
    pressed.add(e.code);
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.code)) e.preventDefault();
  });
  window.addEventListener('keyup', (e) => keys.delete(e.code));
  window.addEventListener('blur', () => { keys.clear(); pressed.clear(); });
  window.addEventListener('mousemove', (e) => {
    state.lookDX += e.movementX || 0;
    state.lookDY += e.movementY || 0;
  });
  window.addEventListener('mousedown', (e) => {
    if (e.button === 0) pressed.add('Mouse0');
    if (e.button === 2) pressed.add('Mouse2');
  });
  window.addEventListener('mouseup', (e) => {
    if (e.button === 0) keys.delete('Mouse0');
    if (e.button === 2) keys.delete('Mouse2');
  });
  window.addEventListener('contextmenu', (e) => e.preventDefault());
  return state;
}

export function isDown(input, code) {
  return input.keys.has(code);
}

export function wasPressed(input, code) {
  return input.pressed.has(code);
}

// Call once at the end of every frame: edges are single-frame only.
export function endFrame(input) {
  input.pressed.clear();
  input.lookDX = 0;
  input.lookDY = 0;
}

// WASD / arrows as a -1..1 pair, y forward.
export function moveAxes(input) {
  let x = 0, y = 0;
  if (isDown(input, 'KeyA') || isDown(input, 'ArrowLeft')) x -= 1;
  if (isDown(input, 'KeyD') || isDown(input, 'ArrowRight')) x += 1;
  if (isDown(input, 'KeyW') || isDown(input, 'ArrowUp')) y += 1;
  if (isDown(input, 'KeyS') || isDown(input, 'ArrowDown')) y -= 1;
  return { x, y };
}
