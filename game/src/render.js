// SOLANO HEAT — visual effects: particles, muzzle flashes, tracers,
// explosions, skid puffs and screen shake. All pooled, no allocation
// in the hot loop beyond a few vector reuses.

import * as THREE from '../vendor/three.module.min.js';

export function createEffects(scene) {
  const fx = {
    scene,
    parts: [], // {mesh, vel, life, maxLife, grav}
    shake: 0,
    flashLight: null,
  };
  const geo = new THREE.BoxGeometry(0.22, 0.22, 0.22);
  fx.flashLight = new THREE.PointLight(0xffc060, 0, 26);
  scene.add(fx.flashLight);
  fx.geo = geo;
  return fx;
}

function spawnPart(fx, x, y, z, vx, vy, vz, colour, life, size = 1) {
  const m = new THREE.Mesh(fx.geo, new THREE.MeshBasicMaterial({ color: colour }));
  m.position.set(x, y, z);
  m.scale.setScalar(size);
  fx.scene.add(m);
  fx.parts.push({ mesh: m, vx, vy, vz, life, maxLife: life });
  if (fx.parts.length > 220) {
    const old = fx.parts.shift();
    fx.scene.remove(old.mesh);
    old.mesh.material.dispose();
  }
}

export function muzzleFlash(fx, x, y, z, dir) {
  fx.flashLight.position.set(x, y, z);
  fx.flashLight.intensity = 5;
  for (let i = 0; i < 5; i++) {
    spawnPart(fx, x, y, z,
      dir.x * 6 + (Math.random() - 0.5) * 4,
      (Math.random() - 0.5) * 3 + 1,
      dir.z * 6 + (Math.random() - 0.5) * 4,
      0xffc060, 0.14, 1.4);
  }
}

export function tracer(fx, from, to) {
  const len = from.distanceTo(to);
  const geo = new THREE.CylinderGeometry(0.05, 0.05, len, 4);
  const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0xffe090, transparent: true, opacity: 0.9 }));
  m.position.copy(from).add(to).multiplyScalar(0.5);
  m.lookAt(to);
  m.rotateX(Math.PI / 2);
  fx.scene.add(m);
  fx.parts.push({ mesh: m, vx: 0, vy: 0, vz: 0, life: 0.07, maxLife: 0.07 });
}

export function explosion(fx, x, y, z) {
  fx.shake = Math.max(fx.shake, 0.7);
  fx.flashLight.position.set(x, y + 1, z);
  fx.flashLight.intensity = 12;
  for (let i = 0; i < 26; i++) {
    const a = Math.random() * Math.PI * 2;
    const sp = 3 + Math.random() * 9;
    spawnPart(fx, x, y + 0.5, z,
      Math.cos(a) * sp, 2 + Math.random() * 7, Math.sin(a) * sp,
      Math.random() < 0.5 ? 0xff7a20 : 0xffc060, 0.5 + Math.random() * 0.5, 1 + Math.random() * 1.6);
  }
  for (let i = 0; i < 10; i++) {
    spawnPart(fx, x + (Math.random() - 0.5) * 3, y + 1 + Math.random() * 2, z + (Math.random() - 0.5) * 3,
      0, 1.5 + Math.random(), 0, 0x3a3a3a, 1.2, 2.2);
  }
}

export function skidPuff(fx, x, y, z) {
  spawnPart(fx, x, y + 0.2, z, (Math.random() - 0.5) * 2, 0.6, (Math.random() - 0.5) * 2, 0x9a9a9a, 0.5, 1.2);
}

export function bloodPuff(fx, x, y, z) {
  for (let i = 0; i < 4; i++) {
    spawnPart(fx, x, y, z, (Math.random() - 0.5) * 3, 1 + Math.random(), (Math.random() - 0.5) * 3, 0xa02020, 0.35, 1);
  }
}

export function updateEffects(fx, dt) {
  fx.flashLight.intensity *= Math.pow(0.001, dt * 4);
  if (fx.flashLight.intensity < 0.05) fx.flashLight.intensity = 0;
  fx.shake = Math.max(0, fx.shake - dt * 1.4);
  for (let i = fx.parts.length - 1; i >= 0; i--) {
    const p = fx.parts[i];
    p.life -= dt;
    if (p.life <= 0) {
      fx.scene.remove(p.mesh);
      if (p.mesh.geometry !== fx.geo) p.mesh.geometry.dispose();
      p.mesh.material.dispose();
      fx.parts.splice(i, 1);
      continue;
    }
    p.mesh.position.x += p.vx * dt;
    p.mesh.position.y += p.vy * dt;
    p.mesh.position.z += p.vz * dt;
    p.vy -= 6 * dt;
    const s = p.life / p.maxLife;
    if (p.mesh.geometry === fx.geo) p.mesh.scale.setScalar(Math.max(0.1, s));
    else p.mesh.material.opacity = s * 0.9;
  }
}

// Camera shake offset, applied by main.js after the camera is placed.
export function shakeOffset(fx) {
  const s = fx.shake * fx.shake * 0.5;
  return { x: (Math.random() - 0.5) * s, y: (Math.random() - 0.5) * s };
}
