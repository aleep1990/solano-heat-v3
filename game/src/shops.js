// SOLANO HEAT — shops and safehouses. The weapon shop sells ammo,
// armour and medkits; two safehouses save the game and refill health.

import { SHOP_ITEMS, SAFEHOUSES } from './config.js';
import { addAmmo } from './weapons.js';
import { playCash } from './audio.js';

export function createShopState() {
  return {
    safehouses: SAFEHOUSES.map((s) => ({ ...s })),
    shopOpen: false,
  };
}

export function buyShopItem(S, idx) {
  const item = SHOP_ITEMS[idx];
  if (!item) return { ok: false, why: 'No such item.' };
  if (S.money < item.price) return { ok: false, why: 'Not enough cash.' };
  S.money -= item.price;
  if (item.name.startsWith('SMG AMMO')) addAmmo(S, 2, 120);
  else if (item.name.startsWith('12G')) addAmmo(S, 3, 40);
  else if (item.name.startsWith('AR-9')) addAmmo(S, 4, 90);
  else if (item.name === 'BODY ARMOUR') S.player.armour = 100;
  else if (item.name === 'MEDKIT') S.player.health = 100;
  playCash();
  return { ok: true, why: item.name + ' bought.' };
}

export function buySafehouse(S, idx) {
  const house = S.shops.safehouses[idx];
  if (!house) return { ok: false, why: 'No such safehouse.' };
  if (house.owned) return { ok: false, why: 'Already yours.' };
  if (S.money < house.price) return { ok: false, why: 'Not enough cash.' };
  S.money -= house.price;
  house.owned = true;
  playCash();
  return { ok: true, why: house.name + ' is yours now.' };
}

export function restAtSafehouse(S) {
  S.player.health = 100;
  S.player.armour = 100;
  if (S.car) S.car.damage = 0;
  S.events.push({ type: 'saved', line: 'Rested at the safehouse. Health and armour restored.' });
}
