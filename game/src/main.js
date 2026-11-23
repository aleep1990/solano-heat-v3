// SOLANO HEAT — boot, game loop and the state machine.
// Wires every system together: title → play → pause / busted / wasted,
// plus the frozen ?shot= staging used for screenshots.

import * as THREE from '../vendor/three.module.min.js';
import { TUNE, CAR_MODELS } from './config.js';
import { createInput, isDown, wasPressed, endFrame, moveAxes } from './input.js';
import { createSky, updateDayNight } from './daynight.js';
import { buildCity } from './world.js';
import { buildProps } from './props.js';
import { createEffects, updateEffects, shakeOffset, skidPuff } from './render.js';
import { createHeroMesh, createPlayerState, updatePlayerOnFoot, updateCamera } from './player.js';
import { createCarMesh, createCarState, updatePlayerCar } from './vehicles.js';
import { spawnTraffic, updateTraffic, spawnPeds, updatePeds } from './traffic.js';
import { setWanted, updatePolice, clearRoadblocks } from './police.js';
import { createHelicopter, updateHelicopter } from './helicopter.js';
import { createWeaponState, selectWeapon, cycleWeapon, tickWeapons } from './weapons.js';
import { playerShoot, updateEnemies, clearEnemies, enemiesLeft } from './combat.js';
import { createMissionState, startMission, advanceStage, completeMission, currentStep, MISSIONS } from './missions.js';
import { createRaceState, startRace, updateRace } from './races.js';
import { createCrewState, crewAbility, tickCrew, clearCrewFigures } from './crew.js';
import { createGarageState } from './garage.js';
import { createShopState, restAtSafehouse } from './shops.js';
import { createRadioState, startRadio, cycleStation } from './radio.js';
import { ensureAudio, setEngine, playChime, playCash, playCrash, playShot } from './audio.js';
import { saveGame, loadGame, hasSave } from './save.js';
import { pushDialogue, currentDialogue } from './dialogue.js';
import { buildHud, updateHud, setModeOverlay } from './hud.js';
import { createWreckState, updateWrecks, addWreck } from './wrecks.js';
import { stageShot } from './shots.js';

function params() {
  const q = new URLSearchParams(window.location.search);
  return { seed: parseInt(q.get('seed') || '1', 10) || 1, shot: q.get('shot') || null };
}

function newGameState(seed) {
  return {
    seed,
    time: 0,
    clockHours: 16.0,
    mode: 'title',
    frozen: false,
    shot: null,
    shotCamera: null,
    money: TUNE.startMoney,
    rp: TUNE.startRp,
    wanted: 0,
    heatTimer: 0,
    hiddenTimer: 0,
    lastPoliceSpawn: -10,
    policeSpawned: 0,
    kills: 0,
    shotsFired: 0,
    lastShotAt: -10,
    revealTimer: 0,
    dialogue: [],
    dialogueUntil: 0,
    events: [],
    lastToastAt: 0,
    mission: createMissionState(),
    weapons: createWeaponState(),
    crew: createCrewState(),
    garage: createGarageState(),
    shops: createShopState(),
    race: createRaceState(),
    radio: createRadioState(),
    wrecks: createWreckState(),
    traffic: [],
    peds: [],
    police: [],
    roadblocks: [],
    enemies: [],
    heli: null,
    fx: null,
    city: null,
    player: null,
    car: null,
    input: null,
  };
}

export function boot() {
  const { seed, shot } = params();
  const S = newGameState(seed);
  window.__solano = S; // handy for the finalist review to poke at

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  document.getElementById('game-canvas').appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(62, window.innerWidth / window.innerHeight, 0.1, 3000);
  camera.position.set(260, 26, 60);
  S.scene = scene; S.camera = camera; S.renderer = renderer;
  S.input = createInput();

  const lights = createSky(scene);
  S.city = buildCity(scene, seed);
  buildProps(scene, seed);
  S.fx = createEffects(scene);

  // Dante + his starting car on the beachfront avenue.
  const hero = createHeroMesh();
  scene.add(hero);
  S.player = createPlayerState(300, -30);
  S.player.mesh = hero;
  hero.position.copy(S.player.pos);
  const model = CAR_MODELS[0]; // RUKAN PELO GT
  const carMesh = createCarMesh(model);
  scene.add(carMesh);
  S.car = createCarState(model, 312, -30, Math.PI);
  S.car.mesh = carMesh;
  carMesh.position.copy(S.car.pos);
  carMesh.rotation.y = Math.PI;

  spawnTraffic(S);
  spawnPeds(S);
  S.heli = createHelicopter(scene);

  buildHud(S);
  setModeOverlay(S);
  updateHud(S);

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  // Clicking the canvas unlocks audio (browsers require a gesture).
  window.addEventListener('pointerdown', () => { ensureAudio(); startRadio(S); }, { once: true });

  if (shot) {
    // Title visibility is owned by stageShot in shot mode (only the
    // start shot shows the title screen).
    stageShot(S, shot);
    document.getElementById('title-screen').style.display = shot === 'start' ? 'flex' : 'none';
    document.getElementById('hud').style.display = 'block';
    updateHud(S);
    renderer.render(scene, camera);
  } else {
    wireTitleButtons(S);
  }

  let last = performance.now();
  let lastMode = S.mode;
  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (!S.frozen) {
      S.time += dt;
      S.clockHours = 16.0 + (S.time / 3600) * 0.9;
      updateDayNight(lights, S.clockHours);
      tick(dt);
    }
    if (S.mode !== lastMode) { setModeOverlay(S); lastMode = S.mode; }
    if (S.frozen && S.shotCamera) {
      const c = S.shotCamera;
      camera.position.set(c.x, c.y, c.z);
      camera.lookAt(c.lx, c.ly, c.lz);
    }
    updateHud(S);
    renderer.render(scene, camera);
    endFrame(S.input);
  }
  requestAnimationFrame(frame);
  return S;

  function tick(dt) {
    const input = S.input;
    if (S.mode === 'title') {
      // Slow orbit around the beachfront for the title backdrop.
      const a = S.time * 0.05;
      camera.position.set(300 + Math.sin(a) * 90, 26 + Math.sin(a * 0.7) * 6, -40 + Math.cos(a) * 90);
      camera.lookAt(330, 8, -40);
      if (wasPressed(input, 'Enter')) startNewGame(S);
      return;
    }
    if (S.mode === 'pause') {
      if (wasPressed(input, 'KeyP') || wasPressed(input, 'Escape')) S.mode = 'play';
      return;
    }
    if (S.mode === 'busted' || S.mode === 'wasted') {
      if (wasPressed(input, 'Enter')) respawn(S);
      return;
    }
    // --- play mode ---
    if (wasPressed(input, 'KeyP') || wasPressed(input, 'Escape')) { S.mode = 'pause'; return; }
    if (wasPressed(input, 'KeyM')) { /* mute toggle handled by audio */ }
    if (wasPressed(input, 'KeyL')) saveGame(S);
    if (wasPressed(input, 'KeyR')) cycleStation(S);
    if (wasPressed(input, 'KeyQ')) S.weapons.wheelOpen = !S.weapons.wheelOpen;
    if (wasPressed(input, 'Digit1')) selectWeapon(S, 0);
    if (wasPressed(input, 'Digit2')) selectWeapon(S, 1);
    if (wasPressed(input, 'Digit3')) selectWeapon(S, 2);
    if (wasPressed(input, 'Digit4')) selectWeapon(S, 3);
    if (wasPressed(input, 'Digit5')) selectWeapon(S, 4);
    if (wasPressed(input, 'KeyZ')) crewAbility(S, 0);
    if (wasPressed(input, 'KeyH')) crewAbility(S, 1);
    if (wasPressed(input, 'KeyC')) crewAbility(S, 2);
    if (wasPressed(input, 'KeyE')) toggleCar(S);
    if (wasPressed(input, 'KeyF')) startRace(S, 0);
    if (wasPressed(input, 'Space') && S.player.onFoot && !S.player.jumping) {
      S.player.jumping = true; S.player.vy = 8;
    }
    if (wasPressed(input, 'Mouse0') && S.player.onFoot) playerShoot(S);
    if (isDown(input, 'Mouse0') && S.player.onFoot && currentWeaponIsAuto(S)) playerShoot(S);

    const axes = moveAxes(input);
    const sprint = isDown(input, 'ShiftLeft') || isDown(input, 'ShiftRight');
    const handbrake = isDown(input, 'Space') && !S.player.onFoot;
    if (S.player.onFoot) updatePlayerOnFoot(S, dt, axes, sprint);
    else updatePlayerCar(S, dt, axes, handbrake);
    updateCamera(S, dt, input.lookDX, input.lookDY);
    const shake = shakeOffset(S.fx);
    camera.position.x += shake.x; camera.position.y += shake.y;

    updateTraffic(S, dt);
    updatePeds(S, dt);
    updatePolice(S, dt);
    updateHelicopter(S, dt);
    updateEnemies(S, dt);
    updateRace(S, dt);
    updateWrecks(S, dt);
    updateEffects(S.fx, dt);
    tickWeapons(S, dt);
    tickCrew(S, dt);
    setEngine(S.player.onFoot ? 0 : Math.abs(S.car.speed) / S.car.model.top, !S.player.onFoot);
    if (S.car && S.car.smoke > 0 && Math.random() < dt * 10) {
      skidPuff(S.fx, S.car.pos.x, 1, S.car.pos.z);
    }
    if (S.car && S.car.burning && !S.car.wreckAdded) { S.car.wreckAdded = true; addWreck(S, S.car); }
    drainEvents(S);
  }
}

function currentWeaponIsAuto(S) {
  const w = S.weapons.idx;
  return w === 2 || w === 4;
}

function startNewGame(S) {
  ensureAudio();
  startRadio(S);
  S.mode = 'play';
  S.mission.done = 0;
  S.mission.index = 0;
  S.mission.stage = 0;
  startMission(S, 0);
  pushDialogue(S, 'RICO', 'Port Solano, Dante. One last job — then we are free.', '#3a6fd8');
  playChime();
}

function respawn(S) {
  S.player.health = 100;
  S.player.armour = 50;
  S.player.pos.set(300, 0, -30);
  S.player.onFoot = true;
  setWanted(S, 0);
  clearEnemies(S);
  clearRoadblocks(S);
  if (S.car) { S.car.damage = 40; S.car.burning = false; }
  S.mode = 'play';
  pushDialogue(S, 'LENA', 'You are back on your feet. Do not make me patch you up again.', '#3a9a4a');
}

function toggleCar(S) {
  if (S.player.onFoot) {
    // Enter the player's car, or steal the nearest traffic car.
    const near = S.traffic.find((c) => Math.hypot(c.pos.x - S.player.pos.x, c.pos.z - S.player.pos.z) < 5);
    if (near) {
      // Steal it: the old car stays parked where it stands.
      const old = S.car;
      old.speed = 0;
      S.traffic.push(old);
      S.car = near;
      S.traffic = S.traffic.filter((c) => c !== near);
      S.player.onFoot = false;
      setWanted(S, S.wanted + 1);
      pushDialogue(S, 'DANTE', 'Borrowed. They will get it back. Eventually.', '#e86a1a');
    } else if (Math.hypot(S.car.pos.x - S.player.pos.x, S.car.pos.z - S.player.pos.z) < 6) {
      S.player.onFoot = false;
    }
  } else {
    // Step out beside the car.
    S.player.onFoot = true;
    S.player.pos.set(S.car.pos.x - 2.5, 0, S.car.pos.z + 1);
    S.player.mesh.position.copy(S.player.pos);
    S.player.camYaw = S.car.heading + Math.PI;
  }
}

function drainEvents(S) {
  while (S.events.length > 20) S.events.shift();
  for (const e of S.events) {
    if (e.at !== undefined) continue;
    e.at = S.time;
    if (e.type === 'crash') playCrash();
    if (e.type === 'missionComplete') {
      playCash();
      pushDialogue(S, 'LENA', `Job done. $${e.payout} in the bag — nice work, Dante.`, '#3a9a4a');
      saveGame(S);
    }
    if (e.type === 'missionStart') {
      const m = MISSIONS[S.mission.index];
      if (m && m.dialogue) pushDialogue(S, 'RICO', m.dialogue, '#3a6fd8');
    }
    if (e.type === 'busted' || e.type === 'wasted') setModeOverlay(S);
    if (e.type === 'enemyDown' && e.left === 0 && S.mission.index === 11) advanceStage(S);
    if (e.type === 'raceWin') playCash();
    if (e.line) S.lastToastAt = S.time;
  }
}

function wireTitleButtons(S) {
  const ng = document.getElementById('btn-new');
  if (ng) ng.addEventListener('click', () => startNewGame(S));
  const ct = document.getElementById('btn-continue');
  if (ct) ct.addEventListener('click', () => {
    const save = loadGame(S);
    S.mode = 'play';
    ensureAudio();
    startRadio(S);
    if (save) pushDialogue(S, 'RICO', 'Welcome back, Dante. The city missed you.', '#3a6fd8');
    else startNewGame(S);
  });
  const has = hasSave();
  if (ct) ct.style.display = has ? 'block' : 'none';
}

boot();
