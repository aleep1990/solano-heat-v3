// SOLANO HEAT — respect ranks. RP comes from missions, races and
// clean driving; ranks unlock missions, cars and the garage.

import { RANKS } from './config.js';

export function rankFor(rp) {
  let cur = RANKS[0];
  let next = null;
  for (let i = 0; i < RANKS.length; i++) {
    if (rp >= RANKS[i].at) { cur = RANKS[i]; next = RANKS[i + 1] ?? null; }
  }
  return { cur, next };
}

export function rankProgress(S) {
  const { cur, next } = rankFor(S.rp);
  if (!next) return { name: cur.name, pct: 1, label: `${S.rp} RP · MAX` };
  const span = next.at - cur.at;
  const done = S.rp - cur.at;
  return { name: cur.name, pct: done / span, label: `${S.rp}/${next.at} RP` };
}

export function addRespect(S, n) {
  const before = rankFor(S.rp).cur.name;
  S.rp += n;
  const after = rankFor(S.rp).cur.name;
  if (after !== before) {
    S.events.push({ type: 'rankUp', name: after, line: `New rank: ${after}. The city knows your name now.` });
  }
}
