// SOLANO HEAT — garage: car upgrades bought with cash. Engine, armour
// and paint change the player car; the garage unlocks after winning
// the Plaza Sprint (mission 5).

export const UPGRADES = [
  { id: 'engine1', name: 'ENGINE TUNE I', price: 800, desc: '+12% top speed' },
  { id: 'engine2', name: 'ENGINE TUNE II', price: 1600, desc: '+12% top speed', needs: 'engine1' },
  { id: 'armour1', name: 'ARMOURED PANELS', price: 1200, desc: 'Half damage from rams' },
  { id: 'paint', name: 'SUNSET PEARL PAINT', price: 600, desc: 'A paint job that turns heads' },
  { id: 'brakes', name: 'RACE BRAKES', price: 900, desc: 'Shorter stops, tighter turns' },
];

export function createGarageState() {
  return { unlocked: false, owned: [], paint: null };
}

export function garageUnlocked(S) {
  return S.garage.unlocked || S.mission.done >= 5;
}

export function buyUpgrade(S, id) {
  const up = UPGRADES.find((u) => u.id === id);
  if (!up) return { ok: false, why: 'No such upgrade.' };
  if (S.garage.owned.includes(id)) return { ok: false, why: 'Already fitted.' };
  if (up.needs && !S.garage.owned.includes(up.needs)) return { ok: false, why: 'Needs ' + up.needs + ' first.' };
  if (S.money < up.price) return { ok: false, why: 'Not enough cash.' };
  S.money -= up.price;
  S.garage.owned.push(id);
  applyUpgrade(S, up);
  return { ok: true, why: up.name + ' fitted.' };
}

function applyUpgrade(S, up) {
  if (!S.car) return;
  if (up.id === 'engine1' || up.id === 'engine2') S.car.model = { ...S.car.model, top: S.car.model.top * 1.12 };
  if (up.id === 'paint') S.garage.paint = 0xe86a1a;
}

export function garageSummary(S) {
  return UPGRADES.map((u) => ({
    ...u,
    owned: S.garage.owned.includes(u.id),
    afford: S.money >= u.price,
  }));
}
