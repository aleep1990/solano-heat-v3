// SOLANO HEAT — burning wrecks: cars that catch fire after heavy
// damage, burn for a while, then explode and leave a scorched shell.
// Fire damages nearby peds and the player if they stand too close.

import * as THREE from '../vendor/three.module.min.js';
import { explosion, skidPuff } from './render.js';
import { playExplosion } from './audio.js';

export function createWreckState() {
  return { wrecks: [] };
}

export function addWreck(S, car) {
  const w = { car, timer: 6 + Math.random() * 4, exploded: false };
  S.wrecks.wrecks.push(w);
  return w;
}

export function updateWrecks(S, dt) {
  for (const w of S.wrecks.wrecks) {
    const c = w.car;
    if (!c.mesh) continue;
    // Smoke while burning.
    if (Math.random() < dt * 14) {
      skidPuff(S.fx, c.pos.x + (Math.random() - 0.5) * 2, 1.2, c.pos.z + (Math.random() - 0.5) * 2);
    }
    // Flicker the car material toward charred black.
    if (c.mesh.children[0] && c.mesh.children[0].material) {
      c.mesh.children[0].material.color.lerp(new THREE.Color(0x1a1a1a), dt * 0.2);
    }
    w.timer -= dt;
    if (w.timer <= 0 && !w.exploded) {
      w.exploded = true;
      explosion(S.fx, c.pos.x, 1, c.pos.z);
      playExplosion();
      const d = Math.hypot(S.player.pos.x - c.pos.x, S.player.pos.z - c.pos.z);
      if (d < 9 && S.player.onFoot) {
        S.player.health = Math.max(1, S.player.health - 25);
      }
      S.events.push({ type: 'explosion', line: 'A wreck went up in flames.' });
    }
  }
  // Drop exploded wrecks after their fire dies down.
  S.wrecks.wrecks = S.wrecks.wrecks.filter((w) => !(w.exploded && w.timer < -4));
}
