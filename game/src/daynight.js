// SOLANO HEAT — golden-hour / dusk lighting.
// A low warm sun, a gradient sky dome, warm fog and a cool fill light.
// Time of day is a game clock (16:00 golden hour, drifting to dusk).

import * as THREE from '../vendor/three.module.min.js';
import { PALETTE } from './config.js';

export function createSky(scene) {
  // Big inverted sphere with a vertical gradient baked into vertex colours.
  const geo = new THREE.SphereGeometry(1400, 24, 12);
  const pos = geo.attributes.position;
  const colours = new Float32Array(pos.count * 3);
  const top = new THREE.Color(PALETTE.skyTop);
  const mid = new THREE.Color(PALETTE.skyMid);
  const low = new THREE.Color(PALETTE.skyLow);
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i) / 1400;
    const c = y > 0.25 ? top.clone().lerp(mid, 1 - (y - 0.25) / 0.75) : mid.clone().lerp(low, 1 - (y + 0.08) / 0.33);
    colours[i * 3] = c.r; colours[i * 3 + 1] = c.g; colours[i * 3 + 2] = c.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colours, 3));
  const mat = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false });
  const sky = new THREE.Mesh(geo, mat);
  scene.add(sky);

  // The sun disc itself, low over the water to the east.
  const sun = new THREE.Mesh(
    new THREE.CircleGeometry(55, 32),
    new THREE.MeshBasicMaterial({ color: PALETTE.sun, fog: false })
  );
  sun.position.set(1200, 130, -80);
  sun.lookAt(0, 130, -80);
  scene.add(sun);
  // A soft glow ring around the sun.
  const glow = new THREE.Mesh(
    new THREE.CircleGeometry(95, 32),
    new THREE.MeshBasicMaterial({ color: 0xff9a4a, transparent: true, opacity: 0.28, fog: false })
  );
  glow.position.set(1195, 130, -80);
  glow.lookAt(0, 130, -80);
  scene.add(glow);

  const hemi = new THREE.HemisphereLight(0xffc890, 0x6a5570, 1.15);
  scene.add(hemi);
  const sunLight = new THREE.DirectionalLight(0xffb060, 1.8);
  sunLight.position.set(500, 180, -120);
  scene.add(sunLight);
  const fill = new THREE.DirectionalLight(0x8a9ac0, 0.55);
  fill.position.set(-300, 220, 300);
  scene.add(fill);
  scene.fog = new THREE.Fog(PALETTE.fog, 260, 1150);
  return { sunLight, hemi, sun };
}

// Advance the clock; after 18:30 the light cools toward dusk purple.
export function updateDayNight(lights, hours) {
  const dusk = Math.max(0, Math.min(1, (hours - 17.2) / 1.6));
  lights.sunLight.intensity = 1.6 - dusk * 0.7;
  lights.sunLight.color.setHex(dusk > 0.5 ? 0xff7a50 : 0xffb060);
  lights.hemi.intensity = 0.85 - dusk * 0.25;
}
