// SOLANO HEAT — the crew: Rico (Wheelman), Lena (Mechanic) and Kiki
// (Lookout). Each has an ability on a key with a cooldown, a portrait
// colour for the HUD cards, and a figure that can stand beside Dante
// in mission scenes.

import { CREW } from './config.js';
import { createFigureMesh } from './player.js';
import { setWanted } from './police.js';
import { playChime } from './audio.js';

export function createCrewState() {
  return CREW.map((c) => ({ ...c, cooldown: 0, ready: true, mesh: null }));
}

export function crewAbility(S, idx) {
  const member = S.crew[idx];
  if (!member || member.cooldown > 0) return false;
  if (idx === 0) {
    // RICO — SWAP PLATES: drop one wanted star.
    if (S.wanted <= 0) return false;
    setWanted(S, S.wanted - 1);
    S.events.push({ type: 'crew', name: 'RICO', ability: 'SWAP PLATES', line: 'Plates swapped. They lost us — for now.' });
  } else if (idx === 1) {
    // LENA — QUICK FIX: repair the car and refill armour.
    if (S.car) S.car.damage = Math.max(0, S.car.damage - 40);
    S.player.armour = 100;
    S.events.push({ type: 'crew', name: 'LENA', ability: 'QUICK FIX', line: 'Good as new. Try not to bend it again.' });
  } else {
    // KIKI — EYES OUT: mark every unit and enemy on the minimap.
    S.revealTimer = 12;
    S.events.push({ type: 'crew', name: 'KIKI', ability: 'EYES OUT', line: 'I see them all. Every unit, every corner.' });
  }
  member.cooldown = 25;
  member.ready = false;
  playChime();
  return true;
}

export function tickCrew(S, dt) {
  for (const m of S.crew) {
    if (m.cooldown > 0) {
      m.cooldown -= dt;
      if (m.cooldown <= 0) { m.cooldown = 0; m.ready = true; }
    }
  }
  if (S.revealTimer > 0) S.revealTimer -= dt;
}

// Place the crew as figures at the flanks of a mission scene — ahead of
// the hero and off to the sides, never between the camera and the hero.
export function placeCrewFigures(S, cx, cz, heading) {
  clearCrewFigures(S);
  const fx = Math.sin(heading), fz = Math.cos(heading); // forward
  const sx = Math.cos(heading), sz = -Math.sin(heading); // side
  // [forward, side] pairs: RICO left flank, LENA right flank, KIKI far left.
  const offsets = [[4, 8], [4, -8], [11, 8]];
  const jackets = [0x3a6fd8, 0x3a9a4a, 0x9a4ad8];
  const skins = [0xc98a5a, 0xe8b88a, 0x8a5a3a];
  S.crew.forEach((m, i) => {
    const [f, s] = offsets[i % offsets.length];
    const mesh = createFigureMesh(jackets[i], skins[i], 0x2a2a33);
    mesh.position.set(cx + fx * f + sx * s, 0, cz + fz * f + sz * s);
    mesh.rotation.y = heading;
    mesh.scale.setScalar(0.95);
    S.scene.add(mesh);
    m.mesh = mesh;
  });
}

export function clearCrewFigures(S) {
  for (const m of S.crew) {
    if (m.mesh) { S.scene.remove(m.mesh); m.mesh = null; }
  }
}
