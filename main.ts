// SOLANO HEAT — make.fun gta6-01 entry program (Node 22, stdlib only).
// Hands the game in: copies game/ and screenshots/ from this repository
// into the output directory and writes /output/dossier.json with the
// kit's buildDossier. Deterministic: two runs write identical bytes.
// Game contents: 15 story missions (mission 4 is the 4-star escape),
// a crew of 3, 5 weapons, 3 street races, 4 radio stations, garage,
// respect ranks, shops, 2 safehouses, named police dispatch with
// roadblocks and the CONDOR-1 helicopter, 5 districts, and a living
// city of 30 traffic cars and 64 pedestrians at golden hour.

import { cpSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)));
const outDir = process.env.MAKEFUN_OUTPUT_DIR
  ? resolve(process.env.MAKEFUN_OUTPUT_DIR)
  : '/output';

rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });
cpSync(join(repoRoot, 'game'), join(outDir, 'game'), { recursive: true });
cpSync(join(repoRoot, 'screenshots'), join(outDir, 'screenshots'), { recursive: true });

const dossier = buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
});
writeFileSync(join(outDir, 'dossier.json'), dossier);
console.log(`SOLANO HEAT: wrote ${outDir} (${dossier.length} byte dossier)`);
