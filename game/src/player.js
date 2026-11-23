// SOLANO HEAT — Dante Reyes on foot.
// A boxy low-poly hero: orange jacket, dark jeans, cap. Third-person
// orbit camera, WASD movement, sprint, jump, and enter/exit car.

import * as THREE from '../vendor/three.module.min.js';
import { hitsBuilding, clampToCity } from './world.js';

export function createHeroMesh() {
  const g = new THREE.Group();
  g.name = 'dante';
  const mat = (c) => new THREE.MeshLambertMaterial({ color: c });
  const box = new THREE.BoxGeometry(1, 1, 1);
  const add = (x, y, z, w, h, d, colour, parent = g) => {
    const m = new THREE.Mesh(box, mat(colour));
    m.position.set(x, y, z); m.scale.set(w, h, d);
    parent.add(m);
    return m;
  };
  // Legs, torso (orange jacket), arms, head, cap.
  const legL = add(-0.16, 0.45, 0, 0.26, 0.9, 0.3, 0x2a2a33);
  const legR = add(0.16, 0.45, 0, 0.26, 0.9, 0.3, 0x2a2a33);
  add(0, 1.25, 0, 0.72, 0.7, 0.4, 0xe86a1a); // jacket
  add(0, 1.25, 0.22, 0.5, 0.5, 0.06, 0x2a2a33); // jacket front panel
  const armL = add(-0.48, 1.25, 0, 0.2, 0.62, 0.24, 0xe86a1a);
  const armR = add(0.48, 1.25, 0, 0.2, 0.62, 0.24, 0xe86a1a);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.26, 10, 8), mat(0xc98a5a));
  head.position.set(0, 1.86, 0);
  g.add(head);
  add(0, 2.02, 0.08, 0.5, 0.12, 0.5, 0xd8402e); // cap
  add(0, 1.98, 0.3, 0.46, 0.06, 0.2, 0xd8402e); // cap brim
  // A pistol in the right hand when armed.
  const gun = add(0.48, 0.95, 0.22, 0.1, 0.1, 0.42, 0x1a1a1a);
  gun.visible = false;
  g.userData = { legL, legR, armL, armR, gun };
  return g;
}

// A generic pedestrian / enemy figure, coloured by jacket.
export function createFigureMesh(jacket, skin = 0xc98a5a, pants = 0x2a2a33) {
  const g = new THREE.Group();
  const mat = (c) => new THREE.MeshLambertMaterial({ color: c });
  const box = new THREE.BoxGeometry(1, 1, 1);
  const add = (x, y, z, w, h, d, colour) => {
    const m = new THREE.Mesh(box, mat(colour));
    m.position.set(x, y, z); m.scale.set(w, h, d);
    g.add(m);
    return m;
  };
  add(-0.16, 0.45, 0, 0.26, 0.9, 0.3, pants);
  add(0.16, 0.45, 0, 0.26, 0.9, 0.3, pants);
  add(0, 1.25, 0, 0.72, 0.7, 0.4, jacket);
  add(-0.48, 1.25, 0, 0.2, 0.62, 0.24, jacket);
  add(0.48, 1.25, 0, 0.2, 0.62, 0.24, jacket);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.26, 10, 8), mat(skin));
  head.position.set(0, 1.86, 0);
  g.add(head);
  return g;
}

export function createPlayerState(x, z) {
  return {
    mesh: null,
    pos: new THREE.Vector3(x, 0, z),
    vel: new THREE.Vector3(),
    heading: Math.PI,
    camYaw: Math.PI,
    camPitch: 0.32,
    onFoot: true,
    health: 100,
    armour: 100,
    speed: 0,
    jumping: false,
    vy: 0,
    walkPhase: 0,
  };
}

export function updatePlayerOnFoot(S, dt, axes, sprint) {
  const p = S.player;
  const speed = sprint ? 9.5 : 5.2;
  const fx = Math.sin(p.camYaw), fz = Math.cos(p.camYaw);
  const rx = Math.cos(p.camYaw), rz = -Math.sin(p.camYaw);
  const mx = fx * axes.y + rx * axes.x;
  const mz = fz * axes.y + rz * axes.x;
  const len = Math.hypot(mx, mz) || 1;
  p.vel.x = (mx / len) * speed * (axes.x || axes.y ? 1 : 0);
  p.vel.z = (mz / len) * speed * (axes.x || axes.y ? 1 : 0);
  let nx = p.pos.x + p.vel.x * dt;
  let nz = p.pos.z + p.vel.z * dt;
  if (hitsBuilding(S.city.colliders, nx, p.pos.z)) nx = p.pos.x;
  if (hitsBuilding(S.city.colliders, nx, nz)) nz = p.pos.z;
  const cl = clampToCity(nx, nz);
  p.pos.x = cl.x; p.pos.z = cl.z;
  p.speed = Math.hypot(p.vel.x, p.vel.z);
  if (p.speed > 0.5) {
    p.heading = Math.atan2(p.vel.x, p.vel.z);
    p.walkPhase += dt * p.speed * 1.6;
  }
  // Jump / gravity.
  if (p.jumping) {
    p.vy -= 22 * dt;
    p.pos.y += p.vy * dt;
    if (p.pos.y <= 0) { p.pos.y = 0; p.jumping = false; p.vy = 0; }
  }
  p.mesh.position.copy(p.pos);
  p.mesh.rotation.y = p.heading;
  const swing = Math.sin(p.walkPhase) * 0.5 * Math.min(1, p.speed / 5);
  const u = p.mesh.userData;
  u.legL.rotation.x = swing;
  u.legR.rotation.x = -swing;
  u.armL.rotation.x = -swing * 0.7;
  u.armR.rotation.x = swing * 0.7;
  u.gun.visible = S.weaponIdx > 0;
}

// Third-person camera behind the player (on foot or in car).
export function updateCamera(S, dt, lookDX, lookDY) {
  const p = S.player;
  p.camYaw -= lookDX * 0.0032;
  p.camPitch = Math.max(0.08, Math.min(0.9, p.camPitch + lookDY * 0.0022));
  let target, dist, height;
  if (p.onFoot) {
    target = p.pos.clone().add(new THREE.Vector3(0, 1.7, 0));
    dist = 7.5; height = 2.6;
  } else {
    const c = S.car;
    target = c.mesh.position.clone().add(new THREE.Vector3(0, 1.6, 0));
    // Chase cam follows the car's heading, not the mouse.
    p.camYaw = c.heading + Math.PI;
    dist = 11; height = 3.6;
  }
  const cx = target.x + Math.sin(p.camYaw) * Math.cos(p.camPitch) * dist;
  const cz = target.z + Math.cos(p.camYaw) * Math.cos(p.camPitch) * dist;
  const cy = target.y + Math.sin(p.camPitch) * dist + height * 0.4;
  S.camera.position.lerp(new THREE.Vector3(cx, cy, cz), 1 - Math.pow(0.0001, dt));
  S.camera.lookAt(target);
}
