// SOLANO HEAT — weapons: definitions, the weapon wheel, ammo state,
// switching and firing cadence. Ballistics live in combat.js.

import { WEAPONS } from './config.js';

export function createWeaponState() {
  return {
    idx: 1, // start on the .38
    ammo: WEAPONS.map((w) => (w.ammo === Infinity ? Infinity : w.ammo)),
    cooldown: 0,
    wheelOpen: false,
  };
}

export function currentWeapon(S) {
  return WEAPONS[S.weapons.idx];
}

export function currentAmmo(S) {
  const a = S.weapons.ammo[S.weapons.idx];
  return a === Infinity ? '∞' : String(a);
}

export function selectWeapon(S, idx) {
  if (idx < 0 || idx >= WEAPONS.length) return;
  S.weapons.idx = idx;
  S.weapons.cooldown = 0.1;
}

export function cycleWeapon(S, dir) {
  selectWeapon(S, (S.weapons.idx + dir + WEAPONS.length) % WEAPONS.length);
}

export function canFire(S) {
  const w = currentWeapon(S);
  if (S.weapons.cooldown > 0) return false;
  if (w.ammo !== Infinity && S.weapons.ammo[S.weapons.idx] <= 0) return false;
  return true;
}

export function spendAmmo(S) {
  const w = currentWeapon(S);
  if (w.ammo === Infinity) return;
  S.weapons.ammo[S.weapons.idx] = Math.max(0, S.weapons.ammo[S.weapons.idx] - 1);
}

export function addAmmo(S, idx, n) {
  if (WEAPONS[idx].ammo === Infinity) return;
  S.weapons.ammo[idx] = Math.min(WEAPONS[idx].ammo * 2, S.weapons.ammo[idx] + n);
}

export function tickWeapons(S, dt) {
  S.weapons.cooldown = Math.max(0, S.weapons.cooldown - dt);
}
