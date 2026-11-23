// SOLANO HEAT — the 5-star wanted system and the police who answer it.
// Police cars spawn at radius and pursue, ram and PIT; foot cops appear
// at 3+ stars; roadblocks (3 cars across the road) at 3+ stars; the
// helicopter joins at 4 stars. Heat decays when the player stays hidden.

import * as THREE from '../vendor/three.module.min.js';
import { TUNE } from './config.js';
import { mulberry32, range } from './random.js';
import { createPoliceMesh, createCarState } from './vehicles.js';
import { createFigureMesh } from './player.js';
import { startSiren, stopSiren } from './audio.js';

export function setWanted(S, stars) {
  S.wanted = Math.max(0, Math.min(5, stars));
  S.heatTimer = 0;
  S.hiddenTimer = 0;
  if (S.wanted > 0) startSiren();
  else stopSiren();
  updatePolicePanel(S);
}

export function addHeat(S, stars) {
  setWanted(S, S.wanted + stars);
}

// Called by hud.js through S; kept here so police own their panel data.
export function updatePolicePanel(S) { /* hud reads S.wanted directly */ }

function spawnPoliceCar(S) {
  const rng = mulberry32((S.seed + S.policeSpawned * 131) | 0);
  const a = rng() * Math.PI * 2;
  const r = range(rng, 55, 80);
  const x = S.player.pos.x + Math.sin(a) * r;
  const z = S.player.pos.z + Math.cos(a) * r;
  const mesh = createPoliceMesh();
  S.scene.add(mesh);
  const car = createCarState({ name: 'INTERCEPTOR', kind: 'sedan', top: 54, accel: 24, colour: 0x14161c }, x, z, 0);
  car.mesh = mesh;
  car.isPolice = true;
  car.ramCooldown = 0;
  S.police.push(car);
  S.policeSpawned++;
}

export function updatePolice(S, dt) {
  const want = Math.min(TUNE.policeMax, S.wanted * 2);
  if (S.wanted > 0 && S.police.length < want && S.time - S.lastPoliceSpawn > 2.2) {
    spawnPoliceCar(S);
    S.lastPoliceSpawn = S.time;
  }
  if (S.wanted === 0) {
    // Cops give up and drive off.
    for (const c of S.police) {
      c.pos.x += Math.sin(c.heading) * 20 * dt;
      c.pos.z += Math.cos(c.heading) * 20 * dt;
      c.mesh.position.copy(c.pos);
    }
    if (S.police.length > 0 && S.time - S.lastPoliceSpawn > 6) {
      const gone = S.police.shift();
      S.scene.remove(gone.mesh);
    }
    return;
  }
  const px = S.player.pos.x, pz = S.player.pos.z;
  for (const c of S.police) {
    const dx = px - c.pos.x, dz = pz - c.pos.z;
    const dist = Math.hypot(dx, dz) || 1;
    const wantHeading = Math.atan2(dx, dz);
    let dh = wantHeading - c.heading;
    while (dh > Math.PI) dh -= Math.PI * 2;
    while (dh < -Math.PI) dh += Math.PI * 2;
    c.heading += Math.max(-2.4 * dt, Math.min(2.4 * dt, dh));
    const targetSpeed = dist > 10 ? 46 : 30;
    c.speed += (targetSpeed - c.speed) * Math.min(1, dt * 1.2);
    c.pos.x += Math.sin(c.heading) * c.speed * dt;
    c.pos.z += Math.cos(c.heading) * c.speed * dt;
    c.mesh.position.copy(c.pos);
    c.mesh.rotation.y = c.heading;
    const spin = c.speed * dt * 1.4;
    for (const w of c.mesh.userData.wheels) w.rotation.x += spin;
    c.ramCooldown -= dt;
    // Ram the player car on contact.
    if (dist < 4.4 && c.ramCooldown <= 0) {
      c.ramCooldown = 1.2;
      if (!S.player.onFoot && S.car) {
        S.car.damage = Math.min(100, S.car.damage + 7);
        S.car.speed *= 0.55;
        S.events.push({ type: 'crash', speed: 14 });
      } else {
        hurtPlayer(S, 12);
      }
    }
    // Busted: on foot, slow, cop right next to you.
    if (S.player.onFoot && dist < TUNE.bustRadius && S.player.speed < 2 && S.wanted >= 2) {
      S.mode = 'busted';
      S.events.push({ type: 'busted' });
    }
  }
  // Heat decay: stay out of sight of every unit and stars fall off.
  const nearest = S.police.reduce((m, c) => Math.min(m, Math.hypot(c.pos.x - px, c.pos.z - pz)), 999);
  if (nearest > 70) {
    S.hiddenTimer += dt;
    if (S.hiddenTimer > TUNE.wantedDecay) {
      setWanted(S, S.wanted - 1);
      S.hiddenTimer = 0;
    }
  } else S.hiddenTimer = 0;
}

export function hurtPlayer(S, dmg) {
  if (S.player.armour > 0) {
    const absorbed = Math.min(S.player.armour, dmg);
    S.player.armour -= absorbed;
    dmg -= absorbed;
  }
  S.player.health -= dmg;
  if (S.player.health <= 0) {
    S.player.health = 0;
    S.mode = 'wasted';
    S.events.push({ type: 'wasted' });
  }
}

// --- roadblocks -------------------------------------------------------------
export function buildRoadblock(S, cx, cz, heading) {
  const group = new THREE.Group();
  group.name = 'roadblock';
  // Across the road = perpendicular to the heading: (cos h, -sin h).
  const px = Math.cos(heading), pz = -Math.sin(heading);
  const cars = [];
  for (let i = -1; i <= 1; i++) {
    const mesh = createPoliceMesh();
    const x = cx + px * i * 4.6;
    const z = cz + pz * i * 4.6;
    mesh.position.set(x, 0, z);
    mesh.rotation.y = heading + Math.PI; // facing back toward the player
    S.scene.add(mesh);
    cars.push(mesh);
  }
  // Two foot cops standing behind the line.
  for (const s of [-1, 1]) {
    const cop = createFigureMesh(0x1a2a4a, 0xc98a5a, 0x1a2a4a);
    cop.position.set(cx + px * s * 7.5, 0, cz + pz * s * 7.5 + 5);
    cop.rotation.y = heading + Math.PI;
    S.scene.add(cop);
    cars.push(cop);
  }
  S.roadblocks.push({ group, cars, x: cx, z: cz, heading });
  return group;
}

export function clearRoadblocks(S) {
  for (const rb of S.roadblocks) for (const m of rb.cars) S.scene.remove(m);
  S.roadblocks = [];
}
