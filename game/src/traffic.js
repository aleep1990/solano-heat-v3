// SOLANO HEAT — living city traffic: 30 cars looping the road grid and
// 64 pedestrians on the sidewalks and the beach. Cars keep to lanes,
// peds flee from gunfire and scatter from speeding cars.

import * as THREE from '../vendor/three.module.min.js';
import { BLOCK, ROAD_W, WORLD_HALF, BEACH_X, TUNE } from './config.js';
import { mulberry32, pick, range } from './random.js';
import { createCarMesh, createCarState, randomTrafficModel } from './vehicles.js';
import { createFigureMesh } from './player.js';

function laneRoads() {
  const roads = [];
  for (let c = -WORLD_HALF; c <= WORLD_HALF; c += BLOCK) roads.push(c);
  return roads;
}

export function spawnTraffic(S) {
  const rng = mulberry32(S.seed + 7);
  const roads = laneRoads();
  S.traffic = [];
  for (let i = 0; i < TUNE.trafficCount; i++) {
    const vertical = rng() < 0.5;
    const road = pick(rng, roads);
    const along = range(rng, -WORLD_HALF + 20, WORLD_HALF - 20);
    const lane = (rng() < 0.5 ? -1 : 1) * (ROAD_W / 4);
    const x = vertical ? road + lane : along;
    const z = vertical ? along : road + lane;
    const heading = vertical ? (lane > 0 ? 0 : Math.PI) : (lane > 0 ? Math.PI / 2 : -Math.PI / 2);
    const model = randomTrafficModel(rng);
    const mesh = createCarMesh(model);
    mesh.position.set(x, 0, z);
    mesh.rotation.y = heading;
    S.scene.add(mesh);
    const car = createCarState(model, x, z, heading);
    car.mesh = mesh;
    car.speed = range(rng, 9, 15);
    car.vertical = vertical;
    car.road = road;
    car.lane = lane;
    S.traffic.push(car);
  }
}

export function updateTraffic(S, dt) {
  for (const car of S.traffic) {
    // Slow for the player car ahead, otherwise cruise.
    let target = car.baseSpeed ?? car.speed;
    const ahead = car.vertical
      ? S.traffic.some((o) => o !== car && Math.abs(o.pos.x - car.pos.x) < 3 && ((o.pos.z - car.pos.z) * Math.sin(car.heading)) > 0 && ((o.pos.z - car.pos.z) * Math.sin(car.heading)) < 12)
      : S.traffic.some((o) => o !== car && Math.abs(o.pos.z - car.pos.z) < 3 && ((o.pos.x - car.pos.x) * Math.sin(car.heading)) > 0 && ((o.pos.x - car.pos.x) * Math.sin(car.heading)) < 12);
    if (ahead) target = Math.min(target, 4);
    car.speed += (target - car.speed) * Math.min(1, dt * 1.5);
    car.pos.x += Math.sin(car.heading) * car.speed * dt;
    car.pos.z += Math.cos(car.heading) * car.speed * dt;
    // Wrap around the city edge back to the far side.
    if (car.pos.x > WORLD_HALF) car.pos.x = -WORLD_HALF + 20;
    if (car.pos.x < -WORLD_HALF) car.pos.x = WORLD_HALF - 20;
    if (car.pos.z > WORLD_HALF) car.pos.z = -WORLD_HALF + 20;
    if (car.pos.z < -WORLD_HALF) car.pos.z = WORLD_HALF - 20;
    car.mesh.position.copy(car.pos);
    car.mesh.rotation.y = car.heading;
    const spin = car.speed * dt * 1.4;
    for (const w of car.mesh.userData.wheels) w.rotation.x += spin;
  }
}

export function spawnPeds(S) {
  const rng = mulberry32(S.seed + 21);
  const jackets = [0x3a6fd8, 0xd84a9a, 0x2e9a7a, 0xe8a020, 0x8a5ad8, 0xd8d0c0, 0x5a7a8c, 0xc96f4a];
  const skins = [0xc98a5a, 0x8a5a3a, 0xe8b88a, 0x6a3a2a];
  S.peds = [];
  for (let i = 0; i < TUNE.pedCount; i++) {
    const onBeach = rng() < 0.3;
    let x, z;
    if (onBeach) {
      x = range(rng, BEACH_X + 4, BEACH_X + 60);
      z = range(rng, -400, 400);
    } else {
      x = range(rng, -WORLD_HALF + 10, BEACH_X - 16);
      z = range(rng, -WORLD_HALF + 10, WORLD_HALF - 10);
    }
    const mesh = createFigureMesh(pick(rng, jackets), pick(rng, skins));
    mesh.position.set(x, 0, z);
    mesh.scale.setScalar(range(rng, 0.92, 1.06));
    S.scene.add(mesh);
    S.peds.push({
      mesh, x, z,
      heading: rng() * Math.PI * 2,
      speed: range(rng, 0.8, 1.7),
      flee: 0,
      phase: rng() * 6,
      beach: onBeach,
    });
  }
}

export function updatePeds(S, dt) {
  const px = S.player.pos.x, pz = S.player.pos.z;
  const shooting = S.shotsFired > 0 && S.time - S.lastShotAt < 2;
  for (const p of S.peds) {
    const dx = p.x - px, dz = p.z - pz;
    const d = Math.hypot(dx, dz);
    if (d < 14 && (shooting || S.player.speed > 8)) p.flee = 2.5;
    if (p.flee > 0) {
      p.flee -= dt;
      p.heading = Math.atan2(dx, dz);
      p.speed = 4.2;
    } else {
      p.speed += (1.2 - p.speed) * dt;
      if (Math.random() < dt * 0.12) p.heading += (Math.random() - 0.5) * 1.6;
    }
    p.x += Math.sin(p.heading) * p.speed * dt;
    p.z += Math.cos(p.heading) * p.speed * dt;
    p.x = Math.max(-WORLD_HALF + 6, Math.min(BEACH_X + 64, p.x));
    p.z = Math.max(-WORLD_HALF + 6, Math.min(WORLD_HALF - 6, p.z));
    p.phase += dt * p.speed * 3;
    p.mesh.position.set(p.x, 0, p.z);
    p.mesh.rotation.y = p.heading;
    p.mesh.rotation.x = Math.sin(p.phase) * 0.06;
  }
}
