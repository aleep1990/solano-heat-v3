// SOLANO HEAT — street races: 3 circuits with checkpoints, a timer
// and a cash prize. Win to unlock the garage (Plaza Sprint) and to
// climb the respect ladder.

import * as THREE from '../vendor/three.module.min.js';
import { RACES } from './config.js';
import { mulberry32 } from './random.js';

function circuitPoints(race, seed) {
  // A rounded rectangle of checkpoints around the race district.
  const rng = mulberry32(seed + race.name.length * 31);
  const centres = {
    'PLAZA SPRINT': [0, 0, 190],
    'BEACH RUN': [330, -40, 260],
    'MARINA LOOP': [210, -280, 200],
  };
  const [cx, cz, r] = centres[race.name] || [0, 0, 180];
  const pts = [];
  const n = 8;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    pts.push([cx + Math.cos(a) * r + (rng() - 0.5) * 20, cz + Math.sin(a) * r * 0.8 + (rng() - 0.5) * 20]);
  }
  return pts;
}

export function createRaceState() {
  return { active: false, race: null, lap: 1, cp: 0, time: 0, best: null, points: [], markers: [] };
}

export function startRace(S, raceIdx) {
  const race = RACES[raceIdx];
  if (!race) return false;
  const pts = circuitPoints(race, S.seed);
  // Drop checkpoint rings into the scene.
  for (const m of S.race.markers) S.scene.remove(m);
  S.race.markers = [];
  const ringGeo = new THREE.TorusGeometry(5, 0.5, 8, 20);
  const ringMat = new THREE.MeshBasicMaterial({ color: 0xe8a020 });
  for (const [x, z] of pts) {
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.set(x, 2.5, z);
    ring.rotation.y = Math.PI / 2;
    S.scene.add(ring);
    S.race.markers.push(ring);
  }
  S.race = { active: true, race, lap: 1, cp: 0, time: 0, best: S.race.best, points: pts, markers: S.race.markers };
  S.events.push({ type: 'raceStart', name: race.name });
  return true;
}

export function updateRace(S, dt) {
  const r = S.race;
  if (!r.active) return;
  r.time += dt;
  const [tx, tz] = r.points[r.cp];
  const d = Math.hypot(S.player.pos.x - tx, S.player.pos.z - tz);
  // Pulse the next checkpoint ring.
  const ring = r.markers[r.cp];
  if (ring) { ring.scale.setScalar(1 + Math.sin(S.time * 5) * 0.12); ring.material.color.setHex(0x2e9a7a); }
  if (d < 7) {
    r.cp++;
    if (ring) ring.material.color.setHex(0x555555);
    if (r.cp >= r.points.length) {
      r.cp = 0;
      r.lap++;
      if (r.lap > r.race.laps) {
        r.active = false;
        const prize = r.race.prize;
        S.money += prize;
        S.rp += 120;
        if (!r.best || r.time < r.best) r.best = r.time;
        S.events.push({ type: 'raceWin', name: r.race.name, prize, time: r.time });
      }
    }
  }
}

export function raceHudText(S) {
  const r = S.race;
  if (!r.active) return null;
  return `${r.race.name} · LAP ${r.lap}/${r.race.laps} · CP ${r.cp + 1}/${r.points.length} · ${r.time.toFixed(1)}s`;
}
