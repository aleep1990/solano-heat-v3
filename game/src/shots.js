// SOLANO HEAT — deterministic screenshot staging.
// ?shot=start|drive|chase|mission&seed=N places the player, the camera,
// the traffic, the police and the HUD in a composed frame, then freezes
// gameplay so the render is identical on every run.

import { setWanted } from './police.js';
import { startMission, MISSIONS } from './missions.js';
import { spawnEnemy, clearEnemies } from './combat.js';
import { placeCrewFigures, clearCrewFigures } from './crew.js';
import { pushDialogue } from './dialogue.js';
import { buildRoadblock, clearRoadblocks } from './police.js';
import { selectWeapon } from './weapons.js';
import { tracer } from './render.js';
import * as THREE from '../vendor/three.module.min.js';

function placeTrafficRow(S, cars) {
  // cars: [{x, z, heading, speed}] — reposition the first N traffic cars.
  for (let i = 0; i < cars.length && i < S.traffic.length; i++) {
    const c = S.traffic[i];
    c.pos.set(cars[i].x, 0, cars[i].z);
    c.heading = cars[i].heading;
    c.speed = cars[i].speed ?? 0;
    c.mesh.position.copy(c.pos);
    c.mesh.rotation.y = c.heading;
  }
}

function setPlayerCar(S, x, z, heading, speed) {
  S.player.onFoot = false;
  S.car.pos.set(x, 0, z);
  S.car.heading = heading;
  S.car.speed = speed;
  S.car.mesh.position.copy(S.car.pos);
  S.car.mesh.rotation.y = heading;
  S.player.pos.copy(S.car.pos);
  S.player.heading = heading;
  S.player.camYaw = heading + Math.PI;
}

function setPlayerFoot(S, x, z, heading) {
  S.player.onFoot = true;
  S.player.pos.set(x, 0, z);
  S.player.heading = heading;
  S.player.mesh.position.copy(S.player.pos);
  S.player.mesh.rotation.y = heading;
  S.player.camYaw = heading + Math.PI;
}

function setCamera(S, x, y, z, lx, ly, lz) {
  S.camera.position.set(x, y, z);
  S.camera.lookAt(lx, ly, lz);
  S.shotCamera = { x, y, z, lx, ly, lz };
}

export function stageShot(S, shot) {
  S.shot = shot;
  S.frozen = true;
  S.mode = 'play';
  S.clockHours = 16.0; // golden hour for every shot
  document.getElementById('controls-hint').style.display = 'none';
  clearEnemies(S);
  clearRoadblocks(S);
  clearCrewFigures(S);
  S.wanted = 0;
  S.money = 18450;
  S.rp = 3900;
  S.player.health = 100;
  S.player.armour = 100;
  S.car.damage = 0;

  if (shot === 'start') {
    // Title screen over a golden-hour beachfront vista: the parked
    // Rukan and Dante on the avenue, beach and sun beyond.
    S.mode = 'play';
    setPlayerCar(S, 304, 4, Math.PI, 0);
    setPlayerFoot(S, 308, 2, Math.PI * 0.75);
    S.player.mesh.position.set(308, 0, 2);
    S.player.mesh.rotation.y = Math.PI * 0.75;
    placeTrafficRow(S, [
      { x: 312, z: -70, heading: Math.PI, speed: 0 },
      { x: 300, z: -100, heading: 0, speed: 0 },
      { x: 324, z: -45, heading: Math.PI, speed: 0 },
      { x: 300, z: 55, heading: 0, speed: 0 },
    ]);
    setCamera(S, 312, 4, 14, 300, 2, -35);
    // No dialogue line here: the title screen already carries its own
    // controls list, and a dialogue box would cover it.
    return;
  }

  if (shot === 'drive') {
    // Driving north up the beachfront avenue, 5+ traffic cars in frame.
    startMission(S, 0);
    S.mission.stage = 1;
    setPlayerCar(S, 312, 10, Math.PI, 25);
    // Traffic pulled close: lead cars 28-40m ahead of the player so
    // they read in near/mid frame instead of as distant specks.
    placeTrafficRow(S, [
      { x: 312, z: -18, heading: Math.PI, speed: 12 },
      { x: 300, z: -32, heading: 0, speed: 12 },
      { x: 312, z: -48, heading: Math.PI, speed: 11 },
      { x: 324, z: -58, heading: Math.PI, speed: 10 },
      { x: 300, z: -85, heading: 0, speed: 12 },
      { x: 324, z: -105, heading: Math.PI, speed: 13 },
      { x: 312, z: -130, heading: Math.PI, speed: 11 },
    ]);
    // Peds on the strand sidewalk, close to the road.
    for (let i = 0; i < 6 && i < S.peds.length; i++) {
      const p = S.peds[i];
      p.x = 296 + (i % 2) * 4;
      p.z = -30 - i * 18;
      p.mesh.position.set(p.x, 0, p.z);
    }
    setCamera(S, 310, 4.5, 20, 312, 1.5, -15);
    pushDialogue(S, 'LENA', 'Engine sounds sweet. Keep her under the limit — for once.', '#3a9a4a');
    return;
  }

  if (shot === 'chase') {
    // Four-star chase: 3-car roadblock ahead, CONDOR-1 big and close.
    startMission(S, 3); // THE LONG WAY HOME — sets 4 stars in gameplay
    S.mission.stage = 1;
    setWanted(S, 4);
    setPlayerCar(S, 312, 40, Math.PI, 30);
    S.car.damage = 62;
    S.player.health = 72;
    S.player.armour = 55;
    selectWeapon(S, 4); // AR-9
    // Roadblock: 3 police cars clearly across the road, 6m ahead of the
    // player — a wall right in front of his nose. z=34 puts the roadblock
    // BETWEEN the camera and the yellow kiosk prop at (310, 30), so the
    // prop hides behind the cars instead of covering the middle car;
    // centre x=310 keeps the right car clear of the palm at (318, 36).
    buildRoadblock(S, 310, 34, Math.PI);
    // Two pursuit cars flanking the player, just ahead of the camera.
    placeTrafficRow(S, [
      { x: 300, z: 55, heading: Math.PI, speed: 28 },
      { x: 324, z: 62, heading: Math.PI, speed: 28 },
      { x: 300, z: -25, heading: Math.PI, speed: 14 },
      { x: 324, z: -35, heading: 0, speed: 12 },
    ]);
    // CONDOR-1 low and close, ahead-left of the player car, searchlight
    // on the player — big in the frame, body + rotor + tail visible.
    const h = S.heli;
    h.active = true;
    h.group.visible = true;
    h.group.position.set(292, 17, 15);
    h.group.rotation.y = Math.atan2(312 - 292, 40 - 15);
    h.spot.position.set(20, -16.5, 25);
    // Camera west (x=310) of the x=318 palm line so the palm trunks at
    // z=10/36 no longer cross the roadblock; aimed straight at the
    // roadblock so the 3-car wall sits prominent mid-frame. Pulled back
    // to z=62 so CONDOR-1 drops below the mission panel and clear of
    // the foreground palm fronds at the left edge.
    setCamera(S, 310, 5.5, 62, 310, 2.2, 34);
    pushDialogue(S, 'RICO', 'Four stars… the whole city is coming. Drive like you mean it, Dante.', '#3a6fd8');
    return;
  }

  if (shot === 'mission') {
    // On-foot pier shootout: Dante centre, 5 enemies as figures, crew on the flanks.
    // The pier deck top is at y=1.6, so everyone stands at y=1.6.
    startMission(S, 11); // PIER PRESSURE
    S.mission.stage = 0;
    setWanted(S, 3);
    setPlayerFoot(S, 388, -40, Math.PI / 2);
    S.player.pos.y = 1.6;
    S.player.mesh.position.y = 1.6;
    selectWeapon(S, 4); // AR-9
    S.player.health = 72;
    S.player.armour = 55;
    // 5 enemies in a line across the pier, facing Dante, 12-16m ahead.
    const enemySpots = [
      [404, -46], [406, -42], [408, -38], [404, -34], [410, -44],
    ];
    enemySpots.forEach(([x, z], i) => {
      const e = spawnEnemy(S, x, z, [0x8a1a1a, 0x6a1a2a, 0x8a1a1a, 0x5a1a3a, 0x8a1a1a][i], 60);
      e.heading = Math.atan2(S.player.pos.x - x, S.player.pos.z - z);
      e.mesh.rotation.y = e.heading;
      e.mesh.position.y = 1.6;
    });
    // Crew pushed to the flanks, away from the camera centre.
    placeCrewFigures(S, 388, -40, Math.PI / 2);
    for (const m of S.crew) if (m.mesh) m.mesh.position.y = 1.6;
    // A tracer from Dante toward the middle enemy, for a dynamic combat read.
    // Frozen mode never ticks the effects, so this tracer stays in the frame.
    tracer(S.fx, new THREE.Vector3(390, 3.1, -40), new THREE.Vector3(406, 2.9, -42));
    setCamera(S, 372, 6.2, -40, 412, 3.0, -40);
    pushDialogue(S, 'KIKI', 'Five of them on the pier, Dante. Hold the line!', '#9a4ad8');
    return;
  }

  // Fallback: free roam.
  setPlayerCar(S, 0, 0, Math.PI, 0);
  setCamera(S, 0, 30, 60, 0, 0, 0);
}
