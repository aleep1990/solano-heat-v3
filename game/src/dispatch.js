// SOLANO HEAT — police dispatch: the named units the KPD RESPONSE
// panel shows, each with a role and a live distance to the player.
// Distances are computed from the real spawned units where they exist,
// and from seeded patrol posts where they do not.

const UNIT_DEFS = [
  { id: 'CONDOR-1', role: 'AIR UNIT', air: true },
  { id: 'MARLIN-3', role: 'SHORE WATCH' },
  { id: 'CORAL-48', role: 'RAMMING' },
  { id: 'KITE-1', role: 'MARKSMAN' },
  { id: 'REEF-22', role: 'PURSUIT' },
  { id: 'TIDE-9', role: 'ROADBLOCK' },
  { id: 'PALM-7', role: 'PURSUIT' },
  { id: 'SURF-31', role: 'INTERCEPT' },
];

// Seeded patrol posts around the city for units not yet spawned.
const POSTS = [
  [312, -120], [260, 180], [0, -260], [-180, 40], [120, 300], [-300, -180], [200, -320], [60, 120],
];

export function dispatchUnits(S) {
  const px = S.player.pos.x, pz = S.player.pos.z;
  const units = [];
  const count = S.wanted >= 4 ? 6 : S.wanted >= 2 ? 5 : S.wanted >= 1 ? 4 : 3;
  for (let i = 0; i < count; i++) {
    const def = UNIT_DEFS[i % UNIT_DEFS.length];
    let d;
    if (def.air) {
      d = S.heli && S.heli.active ? Math.round(Math.hypot(S.heli.group.position.x - px, S.heli.group.position.z - pz)) : 212;
    } else if (S.police[i - 1]) {
      const c = S.police[i - 1];
      d = Math.round(Math.hypot(c.pos.x - px, c.pos.z - pz));
    } else {
      const post = POSTS[(i + S.seed) % POSTS.length];
      d = Math.round(Math.hypot(post[0] - px, post[1] - pz));
    }
    units.push({ id: def.id, role: def.role, dist: d, air: !!def.air });
  }
  // Air unit always leads the list at 4+ stars.
  units.sort((a, b) => (b.air ? 1 : 0) - (a.air ? 1 : 0));
  return units;
}

export function dispatchHeader(S) {
  if (S.wanted >= 5) return 'KPD RESPONSE · FULL ALERT';
  if (S.wanted >= 4) return 'KPD RESPONSE · AIR UNIT DEPLOYED';
  if (S.wanted >= 3) return 'KPD RESPONSE · ROADBLOCKS UP';
  if (S.wanted >= 1) return 'KPD RESPONSE · UNITS EN ROUTE';
  return 'KPD RESPONSE · STANDING BY';
}
