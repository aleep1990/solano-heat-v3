// SOLANO HEAT — beach props and street furniture.
// Umbrellas, towels, lifeguard tower, food carts, benches, bins and
// billboards: the small stuff that makes the strand feel lived in.

import * as THREE from '../vendor/three.module.min.js';
import { BEACH_X, WATER_X, PIER_Z } from './config.js';
import { mulberry32, range, pick } from './random.js';

export function buildProps(scene, seed) {
  const rng = mulberry32(seed + 99);
  const group = new THREE.Group();
  group.name = 'props';
  const box = new THREE.BoxGeometry(1, 1, 1);

  const mat = (c) => new THREE.MeshLambertMaterial({ color: c });
  const addBox = (x, y, z, w, h, d, colour) => {
    const m = new THREE.Mesh(box, mat(colour));
    m.position.set(x, y, z); m.scale.set(w, h, d);
    group.add(m);
    return m;
  };

  // --- beach umbrellas + towels -------------------------------------------
  const umbrellaCols = [0xd8402e, 0x2e9a7a, 0xe8a020, 0x3a6fd8, 0xd84a9a];
  for (let i = 0; i < 26; i++) {
    const x = range(rng, BEACH_X + 8, WATER_X - 12);
    const z = range(rng, -400, 400);
    const col = pick(rng, umbrellaCols);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 3.2, 5), mat(0xd8d0c0));
    pole.position.set(x, 1.6, z);
    group.add(pole);
    const top = new THREE.Mesh(new THREE.ConeGeometry(3.2, 1.6, 8), mat(col));
    top.position.set(x, 3.8, z);
    group.add(top);
    addBox(x + range(rng, -3, 3), 0.25, z + range(rng, -3, 3), 2.4, 0.3, 1.2, pick(rng, umbrellaCols));
  }

  // --- lifeguard tower -------------------------------------------------------
  const tx = BEACH_X + 22, tz = 60;
  addBox(tx, 1.5, tz, 4, 3, 4, 0xe8e0d0);
  addBox(tx, 3.6, tz, 5, 0.6, 5, 0xd8402e);
  addBox(tx, 4.6, tz, 4.4, 2, 4.4, 0xf0f0e8);
  addBox(tx, 6, tz, 4.8, 0.5, 4.8, 0x2e9a7a);

  // --- food carts along the strand -------------------------------------------
  for (let i = 0; i < 6; i++) {
    const z = -300 + i * 110;
    const x = BEACH_X - 20;
    addBox(x, 1.1, z, 3.4, 2.2, 2.2, pick(rng, [0xe8a020, 0x2e9a7a, 0xd8402e]));
    addBox(x, 2.5, z, 3.8, 0.4, 2.6, 0xf0e8d0);
    addBox(x, 2.9, z, 2.6, 0.9, 0.3, 0x3a3a40);
  }

  // --- benches + bins on sidewalks --------------------------------------------
  for (let i = 0; i < 40; i++) {
    const x = range(rng, -400, 300);
    const z = range(rng, -400, 400);
    if (Math.abs(x - Math.round(x / 52) * 52) < 12 && Math.abs(z - Math.round(z / 52) * 52) > 12) continue;
    addBox(x, 0.7, z, 2.6, 0.5, 0.9, 0x6a4a2a);
    addBox(x, 0.35, z, 0.5, 0.7, 0.5, 0x3a3a40);
  }

  // --- billboards ---------------------------------------------------------------
  const boards = [
    { x: 290, z: -208, text: 0xd8402e },
    { x: -104, z: 156, text: 0x2e9a7a },
    { x: 156, z: 260, text: 0xe8a020 },
  ];
  for (const b of boards) {
    addBox(b.x, 7, b.z, 1, 14, 1, 0x3a3a40);
    addBox(b.x, 11, b.z, 16, 6, 1, b.text);
    addBox(b.x, 11, b.z + 0.6, 13, 1.2, 0.4, 0xf0e8d0);
    addBox(b.x, 9.4, b.z + 0.6, 13, 1.2, 0.4, 0xf0e8d0);
  }

  // --- pier lamps ---------------------------------------------------------------
  for (let i = 0; i < 6; i++) {
    const x = BEACH_X + 16 + i * 18;
    addBox(x, 1.8, PIER_Z - 6, 0.4, 3.6, 0.4, 0x3a3a40);
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.35, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffd27a }));
    lamp.position.set(x, 3.8, PIER_Z - 6);
    group.add(lamp);
  }

  scene.add(group);
  return group;
}
