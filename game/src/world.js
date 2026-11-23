// SOLANO HEAT — the city of Port Solano, generated procedurally.
// Grid streets, five districts with their own building heights and colours,
// a beachfront avenue with palms, a pier, marina docks and open water.
// Exports the collision boxes and the road graph everything else drives on.

import * as THREE from '../vendor/three.module.min.js';
import { WORLD_HALF, BLOCK, ROAD_W, BEACH_X, WATER_X, PIER_Z, PIER_LEN, PALETTE, DISTRICTS } from './config.js';
import { mulberry32, valueNoise, pick, range, intRange } from './random.js';

export function districtAt(x, z) {
  for (const d of DISTRICTS) {
    if (x >= d.x0 && x < d.x1 && z >= d.z0 && z < d.z1) return d;
  }
  return DISTRICTS[0];
}

// Road centre lines, both directions, every BLOCK.
export function roadLines() {
  const lines = [];
  for (let c = -WORLD_HALF; c <= WORLD_HALF; c += BLOCK) lines.push(c);
  return lines;
}

export function isOnRoad(x, z) {
  const lines = roadLines();
  for (const c of lines) {
    if (Math.abs(x - c) < ROAD_W / 2 + 1) return true;
    if (Math.abs(z - c) < ROAD_W / 2 + 1) return true;
  }
  return false;
}

export function buildCity(scene, seed) {
  const rng = mulberry32(seed);
  const group = new THREE.Group();
  group.name = 'city';
  const colliders = []; // {x0,z0,x1,z1}
  const boxGeo = new THREE.BoxGeometry(1, 1, 1);
  const mats = {};
  const matFor = (colour) => {
    const key = colour.toString(16);
    if (!mats[key]) mats[key] = new THREE.MeshLambertMaterial({ color: colour });
    return mats[key];
  };
  const addBox = (x, y, z, w, h, d, colour, collide = false) => {
    const m = new THREE.Mesh(boxGeo, matFor(colour));
    m.position.set(x, y, z);
    m.scale.set(w, h, d);
    group.add(m);
    if (collide) colliders.push({ x0: x - w / 2, z0: z - d / 2, x1: x + w / 2, z1: z + d / 2 });
    return m;
  };

  // --- ground slabs ---------------------------------------------------------
  addBox(0, -0.6, 0, WORLD_HALF * 2 + 120, 1, WORLD_HALF * 2 + 120, PALETTE.ground);
  // Beach sand strip on the east edge.
  addBox((BEACH_X + WATER_X) / 2, -0.35, 0, WATER_X - BEACH_X + 30, 0.5, WORLD_HALF * 2 + 120, PALETTE.sand);
  // Water plane, slightly lower, shimmering blue.
  const water = new THREE.Mesh(
    new THREE.PlaneGeometry(260, WORLD_HALF * 2 + 400),
    new THREE.MeshLambertMaterial({ color: PALETTE.water })
  );
  water.rotation.x = -Math.PI / 2;
  water.position.set(WATER_X + 130, -0.2, 0);
  group.add(water);

  // --- roads -----------------------------------------------------------------
  const roadMat = new THREE.MeshLambertMaterial({ color: PALETTE.road });
  const lineMat = new THREE.MeshLambertMaterial({ color: PALETTE.roadLine });
  for (const c of roadLines()) {
    const ns = new THREE.Mesh(new THREE.PlaneGeometry(ROAD_W, WORLD_HALF * 2 + 60), roadMat);
    ns.rotation.x = -Math.PI / 2; ns.position.set(c, 0.02, 0); group.add(ns);
    const ew = new THREE.Mesh(new THREE.PlaneGeometry(WORLD_HALF * 2 + 60, ROAD_W), roadMat);
    ew.rotation.x = -Math.PI / 2; ew.position.set(0, 0.02, c); group.add(ew);
    // Dashed centre lines along the beachfront avenue and the main drags.
    if (c === 312 || c === 0 || c === -156) {
      for (let t = -WORLD_HALF; t < WORLD_HALF; t += 16) {
        const dash = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 7), lineMat);
        dash.rotation.x = -Math.PI / 2;
        dash.position.set(c === 312 ? 312 : c, 0.04, c === 312 ? t : t);
        if (c === 312) dash.position.set(312, 0.04, t);
        else dash.position.set(t, 0.04, c);
        group.add(dash);
      }
    }
  }

  // --- buildings --------------------------------------------------------------
  const glassMat = new THREE.MeshLambertMaterial({ color: PALETTE.glass });
  for (let bx = -WORLD_HALF + BLOCK / 2; bx < BEACH_X - 10; bx += BLOCK) {
    for (let bz = -WORLD_HALF + BLOCK / 2; bz < WORLD_HALF; bz += BLOCK) {
      // Leave the pier mouth and the plaza clear.
      if (Math.abs(bz - PIER_Z) < BLOCK && bx > 260) continue;
      if (bx > -30 && bx < 30 && bz > -30 && bz < 30) continue; // central plaza
      const d = districtAt(bx, bz);
      const n = valueNoise(bx * 0.02, bz * 0.02, 41);
      const tall = d.name === 'OLD TOWN' ? 0.35 : d.name === 'MARINA' ? 0.5 : 0.8;
      const h = 10 + Math.abs(n) * 26 + (rng() < tall ? intRange(rng, 8, 30) : 0);
      const w = range(rng, 24, 36);
      const dep = range(rng, 24, 36);
      const colour = pick(rng, PALETTE.building);
      const b = addBox(bx + range(rng, -3, 3), h / 2, bz + range(rng, -3, 3), w, h, dep, colour, true);
      // Rooftop box + lit windows band on taller towers.
      addBox(b.position.x, h + 1.2, b.position.z, w * 0.4, 2.4, dep * 0.4, 0x5a4a3a, false);
      if (h > 26) {
        const win = new THREE.Mesh(boxGeo, glassMat);
        win.position.set(b.position.x, h * 0.62, b.position.z);
        win.scale.set(w * 0.7, h * 0.5, dep * 0.7);
        group.add(win);
      }
      // A few corner shops get an awning stripe.
      if (rng() < 0.22) addBox(b.position.x, 3.2, b.position.z + dep / 2 + 1.5, w * 0.8, 0.7, 3, pick(rng, [0xd8402e, 0x2e9a7a, 0xe8a020]), false);
    }
  }

  // --- central plaza (OLD TOWN) ----------------------------------------------
  addBox(0, 0.1, 0, 56, 0.4, 56, 0x9a8a72);
  addBox(0, 1.4, 0, 10, 2.8, 10, 0xc9b890); // plaza monument
  addBox(0, 3.4, 0, 4, 1.4, 4, 0xe8d8a0);

  // --- marina docks ------------------------------------------------------------
  for (let i = 0; i < 5; i++) {
    const z = -380 + i * 52;
    addBox(318, 0.6, z, 26, 1.2, 8, 0x6a4a2a, true);
    addBox(338, 0.2, z, 8, 2.2, 4, 0xe8e0d0); // moored boat hull
    addBox(338, 1.8, z, 2, 3.4, 2, 0xd8402e);
  }

  // --- the pier ------------------------------------------------------------------
  addBox(BEACH_X + PIER_LEN / 2, 0.8, PIER_Z, PIER_LEN, 1.6, 14, 0x8a6a4a, true);
  for (let i = 0; i < 8; i++) {
    addBox(BEACH_X + 12 + i * 14, 2.4, PIER_Z - 6.4, 1, 1.6, 1.4, 0xd8d0c0, false);
    addBox(BEACH_X + 12 + i * 14, 2.4, PIER_Z + 6.4, 1, 1.6, 1.4, 0xd8d0c0, false);
  }
  addBox(BEACH_X + PIER_LEN - 8, 4, PIER_Z, 12, 8, 12, 0xd8402e, true); // pier end pavilion
  addBox(BEACH_X + PIER_LEN - 8, 9, PIER_Z, 8, 2, 8, 0xe8a020, false);

  // --- palms along the beachfront avenue ---------------------------------------
  const trunkMat = new THREE.MeshLambertMaterial({ color: PALETTE.trunk });
  const leafMat = new THREE.MeshLambertMaterial({ color: PALETTE.palm });
  const palmSpots = [];
  for (let z = -WORLD_HALF + 20; z < WORLD_HALF; z += 26) {
    palmSpots.push([BEACH_X - 12, z]);
    if (rng() < 0.5) palmSpots.push([BEACH_X - 34, z + 13]);
  }
  for (const [px, pz] of palmSpots) {
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.8, 9, 6), trunkMat);
    trunk.position.set(px, 4.5, pz);
    trunk.rotation.z = range(rng, -0.08, 0.08);
    group.add(trunk);
    for (let f = 0; f < 6; f++) {
      const frond = new THREE.Mesh(new THREE.ConeGeometry(1.3, 4.2, 4), leafMat);
      const a = (f / 6) * Math.PI * 2;
      frond.position.set(px + Math.cos(a) * 2.4, 9.4, pz + Math.sin(a) * 2.4);
      frond.rotation.z = Math.cos(a) * 1.1;
      frond.rotation.x = -Math.sin(a) * 1.1;
      group.add(frond);
    }
  }

  // --- streetlights -------------------------------------------------------------
  const poleMat = new THREE.MeshLambertMaterial({ color: 0x3a3a40 });
  const lampMat = new THREE.MeshBasicMaterial({ color: 0xffd27a });
  for (let c = -WORLD_HALF; c <= WORLD_HALF; c += BLOCK * 2) {
    for (const z of [-WORLD_HALF + 20, 0, WORLD_HALF - 20]) {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 8, 5), poleMat);
      pole.position.set(c + ROAD_W / 2 + 1.5, 4, z);
      group.add(pole);
      const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.7, 8, 6), lampMat);
      lamp.position.set(c + ROAD_W / 2 + 1.5, 8.2, z);
      group.add(lamp);
    }
  }

  scene.add(group);
  return { group, colliders, roads: roadLines() };
}

// Point-collision test against building boxes.
export function hitsBuilding(colliders, x, z, pad = 0.6) {
  for (const c of colliders) {
    if (x > c.x0 - pad && x < c.x1 + pad && z > c.z0 - pad && z < c.z1 + pad) return c;
  }
  return null;
}

export function clampToCity(x, z) {
  return {
    x: Math.max(-WORLD_HALF + 8, Math.min(WORLD_HALF - 8, x)),
    z: Math.max(-WORLD_HALF + 8, Math.min(WORLD_HALF - 8, z)),
  };
}
