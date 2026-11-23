// SOLANO HEAT — combat: aiming, shooting, enemies that shoot back,
// health, damage numbers and the pier shootout logic.
// Fire from the player camera centre; enemies are hit-tested by ray.

import * as THREE from '../vendor/three.module.min.js';
import { currentWeapon, canFire, spendAmmo } from './weapons.js';
import { createFigureMesh } from './player.js';
import { muzzleFlash, tracer, bloodPuff, explosion } from './render.js';
import { hurtPlayer, addHeat } from './police.js';
import { playShot } from './audio.js';

const raycaster = new THREE.Raycaster();

export function spawnEnemy(S, x, z, jacket = 0x8a1a1a, hp = 60) {
  const mesh = createFigureMesh(jacket, 0x8a5a3a, 0x1a1a1a);
  mesh.position.set(x, 0, z);
  S.scene.add(mesh);
  const e = {
    mesh, x, z, hp, maxHp: hp,
    heading: Math.atan2(S.player.pos.x - x, S.player.pos.z - z),
    shootTimer: 1 + Math.random() * 1.5,
    alive: true,
  };
  S.enemies.push(e);
  return e;
}

export function clearEnemies(S) {
  for (const e of S.enemies) S.scene.remove(e.mesh);
  S.enemies = [];
}

function aimPoint(S) {
  // From the camera through its centre, out to the weapon's range.
  const w = currentWeapon(S);
  const dir = new THREE.Vector3();
  S.camera.getWorldDirection(dir);
  const from = S.camera.position.clone();
  const to = from.clone().add(dir.multiplyScalar(w.range));
  return { from, to, dir };
}

export function playerShoot(S) {
  if (!canFire(S)) return;
  const w = currentWeapon(S);
  S.weapons.cooldown = w.rate;
  S.shotsFired++;
  S.lastShotAt = S.time;
  if (w.key === 'FISTS') {
    // Melee swing: hurt the nearest enemy within 3m.
    let best = null, bd = 3;
    for (const e of S.enemies) {
      if (!e.alive) continue;
      const d = Math.hypot(e.x - S.player.pos.x, e.z - S.player.pos.z);
      if (d < bd) { bd = d; best = e; }
    }
    if (best) damageEnemy(S, best, w.damage);
    return;
  }
  spendAmmo(S);
  playShot(w.key);
  const { from, to } = aimPoint(S);
  // Muzzle origin: just in front of the camera.
  const muzzle = from.clone().add(to.clone().sub(from).normalize().multiplyScalar(1.2));
  muzzle.y -= 0.4;
  muzzleFlash(S.fx, muzzle.x, muzzle.y, muzzle.z, to.clone().sub(from).normalize());
  const pellets = w.pellets || 1;
  for (let p = 0; p < pellets; p++) {
    const spread = w.spread;
    const dir = to.clone().sub(from).normalize();
    dir.x += (Math.random() - 0.5) * spread * 2;
    dir.y += (Math.random() - 0.5) * spread * 2;
    dir.z += (Math.random() - 0.5) * spread * 2;
    dir.normalize();
    const end = from.clone().add(dir.multiplyScalar(w.range));
    raycaster.set(from, dir);
    const targets = S.enemies.filter((e) => e.alive).map((e) => e.mesh);
    const hits = raycaster.intersectObjects(targets, true);
    if (hits.length > 0) {
      const hit = hits[0];
      const enemy = S.enemies.find((e) => e.alive && (e.mesh === hit.object || e.mesh.children.includes(hit.object)));
      tracer(S.fx, muzzle, hit.point);
      if (enemy) {
        damageEnemy(S, enemy, w.damage);
        bloodPuff(S.fx, hit.point.x, hit.point.y, hit.point.z);
      }
    } else {
      tracer(S.fx, muzzle, end);
    }
  }
  if (S.wanted < 2) addHeat(S, 1);
}

export function damageEnemy(S, enemy, dmg) {
  enemy.hp -= dmg;
  if (enemy.hp <= 0 && enemy.alive) {
    enemy.alive = false;
    enemy.mesh.rotation.x = -Math.PI / 2;
    enemy.mesh.position.y = 0.35;
    S.kills++;
    S.events.push({ type: 'enemyDown', left: S.enemies.filter((e) => e.alive).length });
  }
}

export function updateEnemies(S, dt) {
  const px = S.player.pos.x, pz = S.player.pos.z;
  for (const e of S.enemies) {
    if (!e.alive) continue;
    const dx = px - e.x, dz = pz - e.z;
    const d = Math.hypot(dx, dz) || 1;
    e.heading = Math.atan2(dx, dz);
    e.mesh.rotation.y = e.heading;
    // Close the distance to ~14m, then hold and shoot.
    if (d > 15) {
      e.x += Math.sin(e.heading) * 3.2 * dt;
      e.z += Math.cos(e.heading) * 3.2 * dt;
      e.mesh.position.set(e.x, 0, e.z);
    }
    e.shootTimer -= dt;
    if (e.shootTimer <= 0 && d < 55) {
      e.shootTimer = 1.3 + Math.random() * 1.2;
      const from = new THREE.Vector3(e.x, 1.4, e.z);
      const to = new THREE.Vector3(px, 1.3, pz);
      tracer(S.fx, from, to);
      playShot('PISTOL');
      if (Math.random() < 0.35) hurtPlayer(S, 8);
    }
  }
}

export function enemiesLeft(S) {
  return S.enemies.filter((e) => e.alive).length;
}
