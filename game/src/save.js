// SOLANO HEAT — saves to localStorage: cash, RP, mission progress,
// garage, safehouses, best race times and the radio station.
// Loading restores the same numbers; a corrupt save is ignored.

const KEY = 'solano-heat-save-v3';

export function saveGame(S) {
  try {
    const data = {
      money: S.money,
      rp: S.rp,
      missionDone: S.mission.done,
      missionIndex: S.mission.index,
      garageOwned: S.garage.owned,
      safehouses: S.shops.safehouses.map((s) => s.owned),
      bestRace: S.race.best,
      station: S.radio.station,
      wanted: 0,
      savedAt: Date.now(),
    };
    localStorage.setItem(KEY, JSON.stringify(data));
    S.events.push({ type: 'saved', line: 'Game saved.' });
    return true;
  } catch (e) { return false; }
}

export function loadGame(S) {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const d = JSON.parse(raw);
    if (typeof d.money !== 'number' || typeof d.rp !== 'number') return null;
    S.money = d.money;
    S.rp = d.rp;
    S.mission.done = d.missionDone | 0;
    S.mission.index = Math.min(d.missionIndex | 0, 14);
    S.garage.owned = Array.isArray(d.garageOwned) ? d.garageOwned : [];
    if (Array.isArray(d.safehouses)) {
      d.safehouses.forEach((owned, i) => { if (S.shops.safehouses[i]) S.shops.safehouses[i].owned = !!owned; });
    }
    if (typeof d.bestRace === 'number') S.race.best = d.bestRace;
    if (typeof d.station === 'number') S.radio.station = d.station % 4;
    return d;
  } catch (e) { return null; }
}

export function hasSave() {
  try { return !!localStorage.getItem(KEY); } catch (e) { return false; }
}

export function clearSave() {
  try { localStorage.removeItem(KEY); } catch (e) { /* private mode */ }
}
