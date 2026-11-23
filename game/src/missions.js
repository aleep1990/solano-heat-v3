// SOLANO HEAT — 15 story missions. Each has a name, heat level, a
// briefing, staged steps with objectives + NEXT lines, a payout and a
// respect reward. Mission 4 is the four-star chase: its briefing,
// dialogue and gameplay all say four stars.

import { setWanted } from './police.js';

export const MISSIONS = [
  {
    name: 'THE PICKUP', heat: 2, payout: 900, respect: 90,
    briefing: 'Rico left a package at the marina docks. Go get it, and do not open it.',
    steps: [
      { objective: 'Drive to the marina docks', next: 'Collect the package' },
      { objective: 'Collect the package', next: 'Lose the tail' },
      { objective: 'Lose the 2-star tail', next: 'Return to the Strand flat' },
    ],
  },
  {
    name: 'HOT WHEELS', heat: 3, payout: 1100, respect: 110,
    briefing: 'A Rukan Pelo GT is parked outside the casino. Take it. The owner will not wait.',
    steps: [
      { objective: 'Steal the Rukan Pelo GT', next: 'Outrun the patrols' },
      { objective: 'Lose the 3-star tail', next: 'Deliver the car to the garage' },
    ],
  },
  {
    name: 'PAYDAY', heat: 3, payout: 1400, respect: 130,
    briefing: 'Cash pickup at the Old Town plaza. The other crew wants it too. Bring something loud.',
    steps: [
      { objective: 'Reach the plaza on foot', next: 'Grab the cash' },
      { objective: 'Grab the cash', next: 'Fight off the rival crew' },
      { objective: 'Fight off the rival crew', next: 'Escape with the cash' },
    ],
  },
  {
    name: 'THE LONG WAY HOME', heat: 4, payout: 1800, respect: 170,
    briefing: 'Four stars and the whole city behind you. Get the package across Port Solano — every unit in the city is on this one.',
    steps: [
      { objective: 'Pick up the package with 4 stars on you', next: 'Break through the roadblock' },
      { objective: 'Break through the roadblock', next: 'Shake CONDOR-1' },
      { objective: 'Shake CONDOR-1 and reach the safehouse', next: 'Deliver the package' },
    ],
    dialogue: 'Four stars… the whole city is coming. Drive like you mean it, Dante.',
  },
  {
    name: 'STREET KING', heat: 0, payout: 2000, respect: 180,
    briefing: 'The Plaza Sprint. Beat the best drivers in Port Solano and the garage is yours.',
    steps: [
      { objective: 'Win the Plaza Sprint', next: 'Claim the garage' },
      { objective: 'Claim the garage', next: 'Meet the crew' },
    ],
  },
  {
    name: 'THE CREW', heat: 2, payout: 1500, respect: 150,
    briefing: 'Rico, Lena and Kiki. One job, three talents. Prove you can run a crew.',
    steps: [
      { objective: 'Pick up Rico at the Strand', next: 'Collect Lena' },
      { objective: 'Collect Lena', next: 'Grab Kiki at the pier' },
      { objective: 'Grab Kiki at the pier', next: 'Hit the depot together' },
    ],
  },
  {
    name: 'BLACKOUT', heat: 4, payout: 2200, respect: 200,
    briefing: 'Cut the power to the marina shops, walk in, walk out rich. Four stars the moment the lights die.',
    steps: [
      { objective: 'Cut the power at the substation', next: 'Rob the marina shop' },
      { objective: 'Rob the marina shop', next: 'Escape the 4-star response' },
    ],
  },
  {
    name: 'AIR ONE', heat: 4, payout: 2400, respect: 210,
    briefing: 'CONDOR-1 is on you and it does not blink. Lose the helicopter or lose everything.',
    steps: [
      { objective: 'Escape CONDOR-1 through the tunnels', next: 'Break line of sight' },
      { objective: 'Break line of sight', next: 'Lose all 4 stars' },
    ],
  },
  {
    name: 'CAB CALL', heat: 0, payout: 1000, respect: 100,
    briefing: 'A night driving the cab. Fares, tips, no heat. Sometimes the quiet jobs pay best.',
    steps: [
      { objective: 'Pick up 3 fares', next: 'Drop the last fare at the pier' },
      { objective: 'Drop the last fare at the pier', next: 'Park the cab' },
    ],
  },
  {
    name: 'DEAD DROP', heat: 3, payout: 1700, respect: 160,
    briefing: 'A dead drop under the pier. Three stars if anyone sees you take it.',
    steps: [
      { objective: 'Reach the dead drop under the pier', next: 'Take the envelope' },
      { objective: 'Take the envelope', next: 'Lose the tail' },
    ],
  },
  {
    name: 'HARBOUR LIGHTS', heat: 4, payout: 2300, respect: 200,
    briefing: 'The harbour master is moving crates after dark. Follow the lights, take the manifest.',
    steps: [
      { objective: 'Tail the harbour truck', next: 'Photograph the manifest' },
      { objective: 'Photograph the manifest', next: 'Escape the docks' },
    ],
  },
  {
    name: 'PIER PRESSURE', heat: 3, payout: 2100, respect: 190,
    briefing: 'Hold the pier. The rival crew is coming over the boards and they brought friends.',
    steps: [
      { objective: 'Hold the pier — enemies left: 5', next: 'Push them back' },
      { objective: 'Clear the pier', next: 'Meet Kiki at the pavilion' },
    ],
  },
  {
    name: 'SUNSET SMUGGLE', heat: 4, payout: 2600, respect: 220,
    briefing: 'One boat, one beach, one sunset. Four stars the moment the cargo touches sand.',
    steps: [
      { objective: 'Meet the boat at the Strand', next: 'Load the cargo' },
      { objective: 'Load the cargo', next: 'Outrun the shore patrol' },
      { objective: 'Outrun the shore patrol', next: 'Deliver to Las Lomas' },
    ],
  },
  {
    name: 'THE LAST SCORE', heat: 4, payout: 2800, respect: 240,
    briefing: 'The biggest score in Port Solano. Four stars, no backup, no second chances.',
    steps: [
      { objective: 'Crack the vault', next: 'Grab the haul' },
      { objective: 'Grab the haul', next: 'Escape across the city' },
    ],
  },
  {
    name: 'KING OF THE PORT', heat: 5, payout: 3000, respect: 260,
    briefing: 'Five stars. The whole city, one night, one crown. Become King of the Port.',
    steps: [
      { objective: 'Take the crown from the old king', next: 'Survive the 5-star storm' },
      { objective: 'Survive the 5-star storm', next: 'Claim the Port' },
      { objective: 'Claim the Port', next: 'Watch the credits roll' },
    ],
  },
];

export function missionByIndex(i) {
  return MISSIONS[i] ?? null;
}

export function createMissionState() {
  return { index: 0, stage: 0, active: false, done: 0, fares: 0 };
}

export function startMission(S, index) {
  const m = MISSIONS[index];
  if (!m) return false;
  S.mission.index = index;
  S.mission.stage = 0;
  S.mission.active = true;
  S.mission.fares = 0;
  // THE LONG WAY HOME (index 3) is the four-star chase: four stars, set
  // explicitly here in gameplay, not just in the briefing text.
  if (index === 3) setWanted(S, 4);
  else setMissionHeat(S, m);
  S.events.push({ type: 'missionStart', name: m.name });
  return true;
}

// Heat for a mission's current stage: the mission's own heat, with the
// four-star missions actually setting four stars in gameplay.
export function setMissionHeat(S, m) {
  if (m.heat > 0) setWanted(S, m.heat);
}

export function currentStep(S) {
  const m = MISSIONS[S.mission.index];
  if (!m) return null;
  return m.steps[Math.min(S.mission.stage, m.steps.length - 1)];
}

export function advanceStage(S) {
  const m = MISSIONS[S.mission.index];
  if (!m) return;
  S.mission.stage++;
  if (S.mission.stage >= m.steps.length) completeMission(S);
}

export function completeMission(S) {
  const m = MISSIONS[S.mission.index];
  if (!m) return;
  S.money += m.payout;
  S.rp += m.respect;
  S.mission.done++;
  S.mission.active = false;
  S.mission.index = Math.min(S.mission.index + 1, MISSIONS.length - 1);
  S.mission.stage = 0;
  S.events.push({ type: 'missionComplete', name: m.name, payout: m.payout, respect: m.respect });
}
