// SOLANO HEAT — central tuning and world data.
// Every number, name and colour in the game lives here so the other
// modules stay small and the whole city can be rebalanced from one file.

export const GAME_TITLE = 'SOLANO HEAT';
export const CITY_NAME = 'Port Solano';
export const HERO_NAME = 'Dante Reyes';

// --- world geometry -------------------------------------------------------
export const WORLD_HALF = 430; // city extends -430..430 on x and z
export const BLOCK = 52; // city block pitch (road centre to road centre)
export const ROAD_W = 15; // road width
export const BEACH_X = 330; // east of this line: sand, then water
export const WATER_X = 405; // east of this line: open water
export const PIER_Z = -40; // pier runs east from the strand at this z
export const PIER_LEN = 120;

// --- districts (standing 0-100, NEUTRAL band 40-70) -----------------------
export const DISTRICTS = [
  { name: 'SOLANO STRAND', short: 'STRAND', x0: 300, z0: -430, x1: 430, z1: 430, standing: 61, mood: 'NEUTRAL', colour: '#e8b34a' },
  { name: 'SOLANO PIER', short: 'PIER', x0: 300, z0: -110, x1: 430, z1: 30, standing: 58, mood: 'NEUTRAL', colour: '#d97b4f' },
  { name: 'MARINA', short: 'MARINA', x0: 120, z0: -430, x1: 300, z1: -140, standing: 62, mood: 'NEUTRAL', colour: '#4fa8c9' },
  { name: 'OLD TOWN', short: 'OLD TOWN', x0: -430, z0: -430, x1: 120, z1: 60, standing: 51, mood: 'NEUTRAL', colour: '#c98a4f' },
  { name: 'LAS LOMAS', short: 'LOMAS', x0: -430, z0: 60, x1: 300, z1: 430, standing: 57, mood: 'NEUTRAL', colour: '#7ba05b' },
];

// --- palette (golden hour) -------------------------------------------------
export const PALETTE = {
  skyTop: 0x2e3a6e,
  skyMid: 0xe8803f,
  skyLow: 0xffb347,
  sun: 0xffd27a,
  fog: 0xe8905a,
  ground: 0x3d3a38,
  sidewalk: 0x8a8378,
  sand: 0xe8cf9a,
  water: 0x2e6f8e,
  road: 0x2b2b30,
  roadLine: 0xd8c86a,
  building: [0xc96f4a, 0xd8a05a, 0x8a6f8e, 0x5a7a8c, 0xb0705a, 0x9a8a6a, 0x6a5a7a, 0xe0b070],
  glass: 0x2a3a4a,
  palm: 0x6fae55,
  trunk: 0x7a5a3a,
};

// --- cars ------------------------------------------------------------------
export const CAR_MODELS = [
  { name: 'RUKAN PELO GT', kind: 'sport', top: 62, accel: 26, colour: 0xd8402e },
  { name: 'MARLIN SUNSET', kind: 'sport', top: 58, accel: 24, colour: 0xe8a020 },
  { name: 'CORAL COUPE', kind: 'coupe', top: 52, accel: 21, colour: 0x2e7a8c },
  { name: 'PIER RUNNER', kind: 'sedan', top: 48, accel: 19, colour: 0x7a8a9a },
  { name: 'STRAND CRUISER', kind: 'sedan', top: 46, accel: 18, colour: 0xd8d0c0 },
  { name: 'DUNA 4X4', kind: 'suv', top: 44, accel: 17, colour: 0x5a6a3a },
  { name: 'LOMA SEDAN', kind: 'sedan', top: 45, accel: 18, colour: 0x8a5a7a },
  { name: 'TAXI CAB', kind: 'taxi', top: 47, accel: 18, colour: 0xf0c020 },
];

// --- weapons ---------------------------------------------------------------
export const WEAPONS = [
  { key: 'FISTS', name: 'FISTS', ammo: Infinity, damage: 12, rate: 0.45, spread: 0.0, range: 3, auto: false },
  { key: 'PISTOL', name: '.38 PISTOL', ammo: Infinity, damage: 22, rate: 0.28, spread: 0.02, range: 55, auto: false },
  { key: 'SMG', name: 'SMG', ammo: 120, damage: 14, rate: 0.09, spread: 0.06, range: 48, auto: true },
  { key: 'SHOTGUN', name: '12G SHOTGUN', ammo: 40, damage: 16, rate: 0.85, spread: 0.14, range: 26, auto: false, pellets: 6 },
  { key: 'RIFLE', name: 'AR-9 RIFLE', ammo: 90, damage: 34, rate: 0.14, spread: 0.015, range: 90, auto: true },
];

// --- crew ------------------------------------------------------------------
export const CREW = [
  { name: 'RICO', role: 'Wheelman', ability: 'SWAP PLATES', key: 'Z', colour: '#3a6fd8', skin: '#c98a5a', desc: 'Drops your wanted level by one star, instantly.' },
  { name: 'LENA', role: 'Mechanic', ability: 'QUICK FIX', key: 'H', colour: '#3a9a4a', skin: '#e8b88a', desc: 'Repairs 40% car damage and refills armour.' },
  { name: 'KIKI', role: 'Lookout', ability: 'EYES OUT', key: 'C', colour: '#9a4ad8', skin: '#8a5a3a', desc: 'Marks every police unit and enemy on the map.' },
];

// --- radio -----------------------------------------------------------------
export const STATIONS = [
  { name: 'OMBO 98.4', genre: 'Island Pop', bpm: 104, root: 62, hue: '#e8a020' },
  { name: 'SOL 101.2', genre: 'Sunset Rock', bpm: 128, root: 57, hue: '#d8402e' },
  { name: 'MAREA 88.7', genre: 'Latin Groove', bpm: 96, root: 60, hue: '#2e9a7a' },
  { name: 'NOCHE 104.5', genre: 'Night Drive', bpm: 116, root: 55, hue: '#7a5ad8' },
];

// --- respect ranks ---------------------------------------------------------
export const RANKS = [
  { name: 'ROOKIE', at: 0 },
  { name: 'RUNNER', at: 150 },
  { name: 'HUSTLER', at: 700 },
  { name: 'FIXER', at: 2200 },
  { name: 'KINGPIN', at: 4200 },
];

// --- races -----------------------------------------------------------------
export const RACES = [
  { name: 'PLAZA SPRINT', district: 'OLD TOWN', laps: 2, prize: 1200 },
  { name: 'BEACH RUN', district: 'SOLANO STRAND', laps: 2, prize: 1500 },
  { name: 'MARINA LOOP', district: 'MARINA', laps: 3, prize: 1800 },
];

// --- safehouses / shops ----------------------------------------------------
export const SAFEHOUSES = [
  { name: 'STRAND FLAT', district: 'SOLANO STRAND', price: 0, owned: true },
  { name: 'LOMAS ROOFTOP', district: 'LAS LOMAS', price: 4500, owned: false },
];
export const SHOP_ITEMS = [
  { name: 'SMG AMMO x120', price: 400 },
  { name: '12G SHELLS x40', price: 350 },
  { name: 'AR-9 ROUNDS x90', price: 600 },
  { name: 'BODY ARMOUR', price: 500 },
  { name: 'MEDKIT', price: 250 },
];

// --- gameplay tuning -------------------------------------------------------
export const TUNE = {
  trafficCount: 30,
  pedCount: 64,
  policeMax: 8,
  wantedDecay: 14, // seconds hidden before a star drops
  bustRadius: 6,
  heliAtStars: 4,
  roadblockAtStars: 3,
  playerHealth: 100,
  playerArmour: 100,
  startMoney: 18450,
  startRp: 3900,
};
