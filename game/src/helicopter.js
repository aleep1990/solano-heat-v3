// SOLANO HEAT — CONDOR-1, the police helicopter.
// A big, close air unit: body, tail boom, spinning rotor and a visible
// searchlight cone that tracks the player. Deployed at 4+ stars.

import * as THREE from '../vendor/three.module.min.js';
import { startRotor, stopRotor } from './audio.js';

export function createHelicopter(scene) {
  const g = new THREE.Group();
  g.name = 'condor-1';
  const mat = (c) => new THREE.MeshLambertMaterial({ color: c });
  const box = new THREE.BoxGeometry(1, 1, 1);
  const add = (x, y, z, w, h, d, c) => {
    const m = new THREE.Mesh(box, mat(c));
    m.position.set(x, y, z); m.scale.set(w, h, d);
    g.add(m);
    return m;
  };
  // Body: white belly, dark blue top, glass nose.
  add(0, 0, 0, 2.6, 1.7, 4.6, 0xe8e8e8);
  add(0, 0.7, 0.4, 2.2, 0.7, 3.4, 0x1a2a4a);
  add(0, 0.1, 2.0, 2.0, 1.1, 1.2, 0x2a4a6a);
  // Tail boom + tail fin + tail rotor.
  add(0, 0.2, -4.4, 0.7, 0.7, 4.6, 0xe8e8e8);
  add(0, 1.0, -6.4, 0.3, 1.6, 1.2, 0x1a2a4a);
  const tailRotor = new THREE.Mesh(new THREE.BoxGeometry(0.15, 2.6, 0.3), mat(0x1a1a1a));
  tailRotor.position.set(0.45, 0.3, -6.4);
  g.add(tailRotor);
  // Skids.
  add(-1.1, -1.2, 0.6, 0.25, 0.25, 3.6, 0x1a1a1a);
  add(1.1, -1.2, 0.6, 0.25, 0.25, 3.6, 0x1a1a1a);
  // Main rotor: two long blades on a mast.
  const rotor = new THREE.Group();
  rotor.position.set(0, 1.35, 0.2);
  const bladeGeo = new THREE.BoxGeometry(11, 0.12, 0.7);
  const bladeMat = mat(0x1a1a1a);
  const b1 = new THREE.Mesh(bladeGeo, bladeMat);
  const b2 = new THREE.Mesh(bladeGeo, bladeMat);
  b2.rotation.y = Math.PI / 2;
  rotor.add(b1); rotor.add(b2);
  g.add(rotor);
  // Searchlight: a bright cone from the belly straight down to the ground.
  // Cone apex sits at the heli (geometry translated so +y is the apex).
  const beamGeo = new THREE.ConeGeometry(6, 24, 16, 1, true);
  beamGeo.translate(0, -12, 0);
  const beamMat = new THREE.MeshBasicMaterial({ color: 0xfff2b0, transparent: true, opacity: 0.22, side: THREE.DoubleSide, depthWrite: false });
  const beam = new THREE.Mesh(beamGeo, beamMat);
  beam.position.set(0, -0.5, 0);
  g.add(beam);
  const spot = new THREE.Mesh(new THREE.CircleGeometry(5.5, 20), new THREE.MeshBasicMaterial({ color: 0xfff2b0, transparent: true, opacity: 0.4 }));
  spot.rotation.x = -Math.PI / 2;
  spot.position.set(0, -23.5, 0);
  g.add(spot);
  // "CONDOR-1" marking bar on the side.
  add(1.32, 0.3, 0, 0.06, 0.5, 3.0, 0xd8402e);
  scene.add(g);
  return { group: g, rotor, tailRotor, beam, spot, active: false, angle: 0 };
}

export function updateHelicopter(S, dt) {
  const h = S.heli;
  if (!h) return;
  const want = S.wanted >= 4 || S.shot === 'chase' || S.shot === 'mission';
  if (want && !h.active) { h.active = true; startRotor(); }
  if (!want && h.active) { h.active = false; stopRotor(); }
  h.group.visible = h.active;
  if (!h.active) return;
  h.rotor.rotation.y += dt * 22;
  h.tailRotor.rotation.x += dt * 30;
  // Orbit the player low and close: 26m out, 24m up, slowly circling.
  h.angle += dt * 0.22;
  const px = S.player.pos.x, pz = S.player.pos.z;
  const hx = px + Math.sin(h.angle) * 26;
  const hz = pz + Math.cos(h.angle) * 26;
  h.group.position.set(hx, 24 + Math.sin(S.time * 0.8) * 1.2, hz);
  h.group.rotation.y = Math.atan2(px - hx, pz - hz);
  // The beam hangs straight down; the lit spot stays on the player.
  h.spot.position.set(px - hx, -23.5, pz - hz);
}
