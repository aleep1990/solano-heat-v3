// SOLANO HEAT — deterministic seeded randomness.
// One mulberry32 stream per seed plus a tiny value-noise field, so the
// city, traffic and every staged screenshot are identical on every run.

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hash2(x, z, seed = 1337) {
  let h = (Math.imul(x | 0, 374761393) + Math.imul(z | 0, 668265263) + Math.imul(seed | 0, 2246822519)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

export function pick(rng, arr) {
  return arr[Math.floor(rng() * arr.length)];
}

export function range(rng, lo, hi) {
  return lo + rng() * (hi - lo);
}

export function intRange(rng, lo, hi) {
  return lo + Math.floor(rng() * (hi - lo + 1));
}

// Smooth 2D value noise in [-1, 1], built from hash2 with bilinear
// interpolation of the four lattice corners.
export function valueNoise(x, z, seed = 77) {
  const xi = Math.floor(x), zi = Math.floor(z);
  const xf = x - xi, zf = z - zi;
  const sx = xf * xf * (3 - 2 * xf);
  const sz = zf * zf * (3 - 2 * zf);
  const a = hash2(xi, zi, seed) * 2 - 1;
  const b = hash2(xi + 1, zi, seed) * 2 - 1;
  const c = hash2(xi, zi + 1, seed) * 2 - 1;
  const d = hash2(xi + 1, zi + 1, seed) * 2 - 1;
  const ab = a + (b - a) * sx;
  const cd = c + (d - c) * sx;
  return ab + (cd - ab) * sz;
}
