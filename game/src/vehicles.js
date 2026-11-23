// SOLANO HEAT — cars: boxy low-poly models, arcade driving physics,
// enter/exit/steal, damage, smoke and burning. One factory builds every
// car in the game (player, traffic and police share it).

import * as THREE from '../vendor/three.module.min.js';
import { CAR_MODELS } from './config.js';
import { hitsBuilding, clampToCity } from './world.js';
import { pick } from './random.js';

export function createCarMesh(model, colourOverride = null) {
  const g = new THREE.Group();
  g.name = 'car';
  const colour = colourOverride ?? model.colour;
  const mat = (c) => new THREE.MeshLambertMaterial({ color: c });
  const box = new THREE.BoxGeometry(1, 1, 1);
  const add = (x, y, z, w, h, d, c) => {
    const m = new THREE.Mesh(box, mat(c));
    m.position.set(x, y, z); m.scale.set(w, h, d);
    g.add(m);
    return m;
  };
  const sporty = model.kind === 'sport';
  const len = sporty ? 4.4 : model.kind === 'suv' ? 4.6 : 4.2;
  const wid = 2.0;
  add(0, 0.55, 0, wid, 0.7, len, colour); // body
  add(0, 1.15, sporty ? 0.2 : -0.2, wid * 0.82, 0.62, len * 0.52, 0x1c2733); // cabin glass
  add(0, 1.32, sporty ? 0.2 : -0.2, wid * 0.7, 0.12, len * 0.46, colour); // roof
  add(0, 0.5, len / 2 + 0.02, wid * 0.9, 0.22, 0.08, 0xf0e8d0); // headlights bar
  add(0, 0.5, -len / 2 - 0.02, wid * 0.9, 0.22, 0.08, 0xc02020); // tail bar
  if (sporty) add(0, 0.95, -len / 2 - 0.15, wid * 0.9, 0.08, 0.4, 0x1a1a1a); // spoiler
  const wheelGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.3, 10);
  const wheelMat = mat(0x141414);
  const wheels = [];
  for (const [wx, wz] of [[-0.95, 1.45], [0.95, 1.45], [-0.95, -1.45], [0.95, -1.45]]) {
    const w = new THREE.Mesh(wheelGeo, wheelMat);
    w.rotation.z = Math.PI / 2;
    w.position.set(wx, 0.38, wz);
    g.add(w);
    wheels.push(w);
  }
  g.userData = { wheels, len, model };
  return g;
}

// A police interceptor: white body with a black hood and trunk, light
// bar, and a dark stripe — bright enough to read against the night road.
export function createPoliceMesh() {
  const g = createCarMesh({ name: 'INTERCEPTOR', kind: 'sedan', colour: 0xe8e8e8 }, 0xe8e8e8);
  const box = new THREE.BoxGeometry(1, 1, 1);
  const mat = (c) => new THREE.MeshLambertMaterial({ color: c });
  const add = (x, y, z, w, h, d, c) => {
    const m = new THREE.Mesh(box, mat(c));
    m.position.set(x, y, z); m.scale.set(w, h, d);
    g.add(m);
    return m;
  };
  add(0, 0.62, 1.6, 1.9, 0.5, 1.2, 0x14161c); // black hood
  add(0, 0.62, -1.6, 1.9, 0.5, 1.2, 0x14161c); // black trunk
  add(0, 0.56, 0, 2.02, 0.28, 3.4, 0x14161c); // dark side stripe
  add(-0.55, 1.5, -0.2, 0.7, 0.14, 0.5, 0xd8402e); // light bar red
  add(0.55, 1.5, -0.2, 0.7, 0.14, 0.5, 0x2a5ad8); // light bar blue
  add(0, 1.18, -0.2, 1.7, 0.1, 2.0, 0x14161c); // roof panel
  return g;
}

export function createCarState(model, x, z, heading) {
  return {
    mesh: null,
    model,
    pos: new THREE.Vector3(x, 0, z),
    heading,
    speed: 0,
    steer: 0,
    damage: 0, // 0..100
    burning: false,
    smoke: 0,
  };
}

export function updatePlayerCar(S, dt, axes, handbrake) {
  const c = S.car;
  const m = c.model;
  const top = m.top * (1 - c.damage * 0.004);
  const accel = m.accel * (1 - c.damage * 0.003);
  if (axes.y > 0) c.speed += accel * dt;
  else if (axes.y < 0) c.speed -= (c.speed > 0.5 ? 34 : 14) * dt;
  else c.speed -= Math.sign(c.speed) * 6 * dt;
  if (handbrake) c.speed -= Math.sign(c.speed) * 26 * dt;
  if (Math.abs(c.speed) < 0.2 && axes.y === 0) c.speed = 0;
  c.speed = Math.max(-14, Math.min(top, c.speed));
  const steerTarget = axes.x * (c.speed >= 0 ? 1 : -1);
  c.steer += (steerTarget - c.steer) * Math.min(1, dt * 7);
  const turn = c.steer * 1.9 * Math.min(1, Math.abs(c.speed) / 12) * (handbrake ? 1.5 : 1);
  c.heading += turn * dt * Math.sign(c.speed || 1) * (c.speed >= 0 ? 1 : -1) * (axes.y < 0 && c.speed > 0 ? -1 : 1);
  let nx = c.pos.x + Math.sin(c.heading) * c.speed * dt;
  let nz = c.pos.z + Math.cos(c.heading) * c.speed * dt;
  const hit = hitsBuilding(S.city.colliders, nx, nz, 1.6);
  if (hit) {
    // Slide along the wall instead of sticking.
    if (!hitsBuilding(S.city.colliders, nx, c.pos.z, 1.6)) nz = c.pos.z;
    else if (!hitsBuilding(S.city.colliders, c.pos.x, nz, 1.6)) nx = c.pos.x;
    else { nx = c.pos.x; nz = c.pos.z; }
    if (Math.abs(c.speed) > 12) {
      c.damage = Math.min(100, c.damage + Math.abs(c.speed) * 0.9);
      S.events.push({ type: 'crash', speed: Math.abs(c.speed) });
      c.speed *= -0.25;
    } else c.speed *= 0.4;
  }
  const cl = clampToCity(nx, nz);
  c.pos.x = cl.x; c.pos.z = cl.z;
  c.mesh.position.copy(c.pos);
  c.mesh.rotation.y = c.heading;
  // Wheel spin + front steer visuals.
  const spin = c.speed * dt * 1.4;
  for (const w of c.mesh.userData.wheels) w.rotation.x += spin;
  c.mesh.userData.wheels[0].rotation.y = c.steer * 0.4;
  c.mesh.userData.wheels[1].rotation.y = c.steer * 0.4;
  // Smoke as damage climbs.
  c.smoke = c.damage > 55 ? (c.damage - 55) / 45 : 0;
  if (c.damage >= 100 && !c.burning) {
    c.burning = true;
    S.events.push({ type: 'carBurning', car: c });
  }
  S.player.pos.copy(c.pos);
  S.player.heading = c.heading;
  S.player.speed = Math.abs(c.speed);
}

export function damagePercent(car) {
  return Math.round(car.damage);
}

export function randomTrafficModel(rng) {
  return pick(rng, CAR_MODELS.filter((m) => m.kind !== 'sport' || rng() < 0.4));
}
