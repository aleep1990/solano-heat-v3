// SOLANO HEAT — the HUD: mission panel, police response panel, district
// standing, minimap, health/armour, weapon slots, crew cards with
// portraits, rank + RP, money, wanted stars, speed, car + damage,
// radio, clock and the dialogue box. Portraits are inline SVG faces.

import { WEAPONS, CREW } from './config.js';
import { currentWeapon, currentAmmo } from './weapons.js';
import { dispatchUnits, dispatchHeader } from './dispatch.js';
import { missionByIndex, currentStep } from './missions.js';
import { rankProgress } from './respect.js';
import { currentStation } from './radio.js';
import { districtAt } from './world.js';
import { currentDialogue } from './dialogue.js';
import { raceHudText } from './races.js';

const $ = (id) => document.getElementById(id);

export function portraitSvg(name, jacket, skin) {
  const initial = name[0];
  return `<svg viewBox="0 0 64 64" width="44" height="44" aria-label="${name}">
    <rect width="64" height="64" rx="8" fill="${jacket}"/>
    <circle cx="32" cy="26" r="14" fill="${skin}"/>
    <path d="M18 26 a14 14 0 0 1 28 0 l0 -4 a14 12 0 0 0 -28 0 z" fill="#1c1c22"/>
    <circle cx="26" cy="25" r="2.4" fill="#1c1c22"/><circle cx="38" cy="25" r="2.4" fill="#1c1c22"/>
    <path d="M27 33 q5 4 10 0" stroke="#1c1c22" stroke-width="2" fill="none"/>
    <rect x="14" y="44" width="36" height="20" rx="6" fill="${jacket}"/>
    <text x="32" y="60" font-size="13" font-weight="bold" text-anchor="middle" fill="#fff">${initial}</text>
  </svg>`;
}

export function buildHud(S) {
  // Weapon slots.
  const slots = $('weapon-slots');
  slots.innerHTML = '';
  WEAPONS.forEach((w, i) => {
    const d = document.createElement('div');
    d.className = 'wslot';
    d.id = 'wslot-' + i;
    d.innerHTML = `<span class="wkey">${i + 1}</span><span class="wname">${w.name}</span><span class="wammo" id="wammo-${i}"></span>`;
    slots.appendChild(d);
  });
  // Crew cards.
  const cards = $('crew-cards');
  cards.innerHTML = '';
  S.crew.forEach((m, i) => {
    const d = document.createElement('div');
    d.className = 'crew-card';
    d.id = 'crew-' + i;
    d.innerHTML = `<div class="crew-face">${portraitSvg(m.name, m.colour, m.skin)}</div>
      <div class="crew-info"><b>${m.name}</b><span>${m.role}</span><span class="crew-ability">${m.ability} [${m.key}]</span></div>
      <div class="crew-cd" id="crew-cd-${i}"></div>`;
    cards.appendChild(d);
  });
  // Wanted stars.
  const stars = $('wanted-stars');
  stars.innerHTML = '';
  for (let i = 0; i < 5; i++) {
    const s = document.createElement('span');
    s.className = 'star';
    s.id = 'star-' + i;
    s.textContent = '★';
    stars.appendChild(s);
  }
}

function setText(id, v) { const el = $(id); if (el && el.textContent !== v) el.textContent = v; }
function setWidth(id, pct) { const el = $(id); if (el) el.style.width = Math.max(0, Math.min(100, pct)) + '%'; }

export function updateHud(S) {
  // --- mission panel ---
  const m = missionByIndex(S.mission.index);
  if (m) {
    setText('mission-title', `MISSION ${S.mission.index + 1} · ${m.name}`);
    const step = currentStep(S);
    setText('mission-stage', `STAGE ${Math.min(S.mission.stage + 1, m.steps.length)}/${m.steps.length} · ${'★'.repeat(m.heat)}${'☆'.repeat(5 - m.heat)}`);
    if (step) {
      setText('mission-objective', step.objective);
      setText('mission-next', 'NEXT: ' + step.next);
    }
    $('mission-panel').classList.toggle('done', !S.mission.active && S.mission.done > 0);
  }
  // --- police response panel ---
  setText('police-header', dispatchHeader(S));
  const units = dispatchUnits(S);
  const ul = $('police-units');
  const html = units.map((u) => `<div class="unit"><span class="unit-id">${u.id}</span><span class="unit-role">${u.role}</span><span class="unit-dist">${u.dist}m</span></div>`).join('');
  if (ul.dataset.html !== html) { ul.innerHTML = html; ul.dataset.html = html; }
  $('police-panel').classList.toggle('hot', S.wanted >= 3);
  // --- district standing ---
  const d = districtAt(S.player.pos.x, S.player.pos.z);
  setText('district-name', d.name);
  setText('district-mood', `${d.mood} · ${d.standing}`);
  setWidth('district-bar', d.standing);
  // --- vitals ---
  setWidth('health-fill', S.player.health);
  setText('health-num', String(Math.round(S.player.health)));
  setWidth('armour-fill', S.player.armour);
  setText('armour-num', String(Math.round(S.player.armour)));
  // --- weapons ---
  WEAPONS.forEach((w, i) => {
    const slot = $('wslot-' + i);
    if (slot) slot.classList.toggle('active', i === S.weapons.idx);
    const ammo = S.weapons.ammo[i];
    setText('wammo-' + i, ammo === Infinity ? '∞' : String(ammo));
  });
  // --- crew cooldowns ---
  S.crew.forEach((mem, i) => {
    const cd = $('crew-cd-' + i);
    if (cd) cd.textContent = mem.cooldown > 0 ? Math.ceil(mem.cooldown) + 's' : 'READY';
    const card = $('crew-' + i);
    if (card) card.classList.toggle('cooling', mem.cooldown > 0);
  });
  // --- rank / money / stars ---
  const rp = rankProgress(S);
  setText('rank-name', 'RANK · ' + rp.name);
  setWidth('rank-bar', rp.pct * 100);
  setText('rank-label', rp.label);
  setText('money-val', '$' + S.money.toLocaleString('en-US'));
  for (let i = 0; i < 5; i++) {
    const s = $('star-' + i);
    if (s) s.classList.toggle('lit', i < S.wanted);
  }
  // --- speed / car ---
  const kmh = Math.round(Math.abs(S.player.onFoot ? S.player.speed * 3.6 : (S.car ? S.car.speed * 3.6 : 0)));
  setText('speed-val', String(kmh));
  if (S.player.onFoot) {
    setText('car-name', 'ON FOOT');
    setText('car-damage', '');
  } else if (S.car) {
    setText('car-name', S.car.model.name);
    setText('car-damage', Math.round(S.car.damage) + '% DENTED');
  }
  // --- radio / clock ---
  const st = currentStation(S);
  setText('radio-name', st.name);
  setText('radio-genre', st.genre);
  const hh = Math.floor(S.clockHours);
  const mm = Math.floor((S.clockHours - hh) * 60);
  setText('clock-time', `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`);
  // --- air unit banner ---
  $('air-banner').style.display = (S.heli && S.heli.active) ? 'block' : 'none';
  // --- race banner ---
  const race = raceHudText(S);
  $('race-banner').style.display = race ? 'block' : 'none';
  if (race) setText('race-banner', race);
  // --- dialogue ---
  const dlg = currentDialogue(S);
  const box = $('dialogue-box');
  if (dlg) {
    box.style.display = 'flex';
    setText('dialogue-speaker', dlg.speaker);
    setText('dialogue-line', dlg.line);
    const face = $('dialogue-portrait');
    const want = portraitSvg(dlg.speaker, dlg.colour, '#c98a5a');
    if (face.dataset.svg !== want) { face.innerHTML = want; face.dataset.svg = want; }
  } else box.style.display = 'none';
  // --- toast feed ---
  const toast = $('toast-line');
  const last = S.events[S.events.length - 1];
  if (last && last.line && S.time - (last.at ?? S.time) < 6) {
    toast.style.display = 'block';
    setText('toast-line', last.line);
  } else if (S.time - (S.lastToastAt ?? 0) > 6) toast.style.display = 'none';
  // --- weapon wheel ---
  $('wheel').style.display = S.weapons.wheelOpen ? 'flex' : 'none';
  drawMinimap(S);
}

// --- minimap -----------------------------------------------------------------
export function drawMinimap(S) {
  const cv = $('minimap');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const W = cv.width, H = cv.height;
  const map = (x, z) => [((x + 430) / 860) * W, ((z + 430) / 860) * H];
  ctx.fillStyle = '#20242e';
  ctx.fillRect(0, 0, W, H);
  // Water + sand on the east.
  const [wx] = map(405, 0);
  ctx.fillStyle = '#2e6f8e';
  ctx.fillRect(wx, 0, W - wx, H);
  const [bx] = map(330, 0);
  ctx.fillStyle = '#e8cf9a';
  ctx.fillRect(bx, 0, wx - bx, H);
  // Roads.
  ctx.strokeStyle = '#4a4a55';
  ctx.lineWidth = 2;
  for (let c = -430; c <= 430; c += 52) {
    const [x0] = map(c, 0);
    ctx.beginPath(); ctx.moveTo(x0, 0); ctx.lineTo(x0, H); ctx.stroke();
    const [, y0] = map(0, c);
    ctx.beginPath(); ctx.moveTo(0, y0); ctx.lineTo(W, y0); ctx.stroke();
  }
  // Mission marker.
  const m = missionByIndex(S.mission.index);
  if (m) {
    const [mx, my] = map(312, -40);
    ctx.fillStyle = '#e8a020';
    ctx.beginPath(); ctx.arc(mx, my, 6, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(mx, my, 9, 0, Math.PI * 2); ctx.stroke();
  }
  // Police dots.
  for (const c of S.police) {
    const [x, y] = map(c.pos.x, c.pos.z);
    ctx.fillStyle = '#ff3b30';
    ctx.beginPath(); ctx.arc(x, y, 3.5, 0, Math.PI * 2); ctx.fill();
  }
  // Heli icon.
  if (S.heli && S.heli.active) {
    const [x, y] = map(S.heli.group.position.x, S.heli.group.position.z);
    ctx.fillStyle = '#ff3b30';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText('H', x - 4, y + 4);
  }
  // Enemies (only while Kiki's EYES OUT is up).
  if (S.revealTimer > 0) {
    for (const e of S.enemies) {
      if (!e.alive) continue;
      const [x, y] = map(e.x, e.z);
      ctx.fillStyle = '#ff7a20';
      ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2); ctx.fill();
    }
  }
  // Player arrow.
  const [px, py] = map(S.player.pos.x, S.player.pos.z);
  ctx.save();
  ctx.translate(px, py);
  ctx.rotate(Math.atan2(Math.sin(S.player.heading), Math.cos(S.player.heading)) + Math.PI);
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.moveTo(0, -7); ctx.lineTo(5, 6); ctx.lineTo(-5, 6); ctx.closePath(); ctx.fill();
  ctx.restore();
  // North.
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 11px sans-serif';
  ctx.fillText('N', W - 14, 14);
}

export function setModeOverlay(S) {
  const show = (id, on) => { const el = $(id); if (el) el.style.display = on ? 'flex' : 'none'; };
  show('title-screen', S.mode === 'title');
  show('pause-screen', S.mode === 'pause');
  show('busted-screen', S.mode === 'busted');
  show('wasted-screen', S.mode === 'wasted');
  $('hud').style.display = S.mode === 'title' ? 'none' : 'block';
  $('wheel').style.display = S.weapons.wheelOpen ? 'flex' : 'none';
}
